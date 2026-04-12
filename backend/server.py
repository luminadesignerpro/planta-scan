from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import re
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# AI Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

PLANT_ANALYSIS_PROMPT = """You are an expert botanist and plant pathologist. Analyze the provided plant image and return a JSON object with the following structure. ALL text fields must be in Brazilian Portuguese.

{
  "identified": true,
  "plant_name": "Nome popular da planta",
  "scientific_name": "Nome cientifico",
  "family": "Familia botanica",
  "description": "Breve descricao da planta (2-3 frases em portugues)",
  "health_status": "healthy",
  "health_score": 85,
  "diseases": [
    {
      "name": "Nome da doenca",
      "severity": "low",
      "description": "Descricao do problema",
      "treatment": "Tratamento recomendado"
    }
  ],
  "care_tips": {
    "water": {"frequency": "A cada 3 dias", "tips": "Dicas de rega"},
    "light": {"type": "Meia-sombra", "tips": "Dicas de luz"},
    "temperature": {"range": "18-25C", "tips": "Dicas"},
    "soil": {"type": "Tipo de solo", "tips": "Dicas"},
    "fertilizer": {"frequency": "Mensal", "tips": "Dicas"}
  },
  "curiosities": ["Curiosidade 1", "Curiosidade 2"],
  "suggested_reminders": [
    {"type": "water", "frequency_days": 3, "description": "Regar a planta"},
    {"type": "fertilize", "frequency_days": 30, "description": "Adubar"}
  ]
}

health_status must be one of: "healthy", "needs_attention", "critical"
severity must be one of: "low", "medium", "high"
Return ONLY the raw JSON object. No markdown, no code blocks, no extra text.
If the image does not contain a recognizable plant, set identified to false and provide an error message.
All descriptions must be in Brazilian Portuguese.
Be specific about diseases and treatments based on visible signs."""

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Pydantic Models
class ScanRequest(BaseModel):
    image_base64: str


class PlantSaveRequest(BaseModel):
    scan_id: str
    custom_name: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class ReminderCreateRequest(BaseModel):
    plant_id: str
    reminder_type: str
    frequency_days: int
    description: Optional[str] = None


class ReminderUpdateRequest(BaseModel):
    reminder_type: Optional[str] = None
    frequency_days: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PlantUpdateRequest(BaseModel):
    custom_name: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None


# ─── API Endpoints ───

@api_router.get("/")
async def root():
    return {"message": "PlantaScan API v1.0"}


@api_router.post("/scan")
async def scan_plant(request: ScanRequest):
    scan_id = str(uuid.uuid4())
    response_text = None

    try:
        image_data = request.image_base64
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"scan-{scan_id}",
            system_message=PLANT_ANALYSIS_PROMPT
        )
        chat.with_model("openai", "gpt-5.2")

        image_content = ImageContent(image_base64=image_data)
        user_msg = UserMessage(
            text="Analyze this plant image. Identify the species, evaluate health, diagnose diseases, and provide care recommendations. Return ONLY raw JSON.",
            file_contents=[image_content]
        )

        response_text = await chat.send_message(user_msg)

        clean_response = response_text.strip()
        if clean_response.startswith('```'):
            clean_response = re.sub(r'^```(?:json)?\s*', '', clean_response)
            clean_response = re.sub(r'\s*```$', '', clean_response)

        analysis = json.loads(clean_response)

        scan_doc = {
            "id": scan_id,
            "image_base64": request.image_base64,
            "analysis": analysis,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "saved": False
        }
        await db.scans.insert_one(scan_doc)

        return {
            "id": scan_id,
            "analysis": analysis,
            "timestamp": scan_doc["timestamp"]
        }

    except json.JSONDecodeError:
        logger.error(f"JSON parse error, response: {response_text}")
        if response_text:
            try:
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    analysis = json.loads(json_match.group())
                    scan_doc = {
                        "id": scan_id,
                        "image_base64": request.image_base64,
                        "analysis": analysis,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "saved": False
                    }
                    await db.scans.insert_one(scan_doc)
                    return {"id": scan_id, "analysis": analysis, "timestamp": scan_doc["timestamp"]}
            except Exception:
                pass

        return {
            "id": scan_id,
            "analysis": {"identified": False, "error": "Nao foi possivel analisar a imagem. Tente com uma foto mais clara."},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Scan error: {str(e)}")
        return {
            "id": scan_id,
            "analysis": {"identified": False, "error": f"Erro ao analisar: {str(e)}"},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


@api_router.get("/scans")
async def get_scans():
    scans = await db.scans.find(
        {}, {"_id": 0, "image_base64": 0}
    ).sort("timestamp", -1).to_list(100)
    return scans


@api_router.get("/scans/{scan_id}")
async def get_scan(scan_id: str):
    scan = await db.scans.find_one({"id": scan_id}, {"_id": 0})
    if not scan:
        return {"error": "Scan nao encontrado"}
    return scan


@api_router.post("/plants")
async def save_plant(request: PlantSaveRequest):
    scan = await db.scans.find_one({"id": request.scan_id}, {"_id": 0})
    if not scan:
        return {"error": "Scan nao encontrado"}

    plant_id = str(uuid.uuid4())
    analysis = scan.get("analysis", {})

    plant_doc = {
        "id": plant_id,
        "scan_id": request.scan_id,
        "custom_name": request.custom_name or analysis.get("plant_name", "Planta Desconhecida"),
        "plant_name": analysis.get("plant_name", ""),
        "scientific_name": analysis.get("scientific_name", ""),
        "family": analysis.get("family", ""),
        "description": analysis.get("description", ""),
        "health_status": analysis.get("health_status", "healthy"),
        "health_score": analysis.get("health_score", 0),
        "care_tips": analysis.get("care_tips", {}),
        "diseases": analysis.get("diseases", []),
        "curiosities": analysis.get("curiosities", []),
        "image_base64": scan.get("image_base64", ""),
        "location": request.location or "",
        "notes": request.notes or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_watered": None
    }

    await db.plants.insert_one(plant_doc)
    await db.scans.update_one({"id": request.scan_id}, {"$set": {"saved": True}})

    # Create suggested reminders
    for reminder in analysis.get("suggested_reminders", []):
        freq = reminder.get("frequency_days", 7)
        reminder_doc = {
            "id": str(uuid.uuid4()),
            "plant_id": plant_id,
            "plant_name": plant_doc["custom_name"],
            "reminder_type": reminder.get("type", "water"),
            "frequency_days": freq,
            "description": reminder.get("description", ""),
            "is_active": True,
            "last_completed": None,
            "next_due": (datetime.now(timezone.utc) + timedelta(days=freq)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.reminders.insert_one(reminder_doc)

    return {
        "id": plant_doc["id"],
        "custom_name": plant_doc["custom_name"],
        "plant_name": plant_doc["plant_name"],
        "scientific_name": plant_doc["scientific_name"],
        "health_status": plant_doc["health_status"],
        "created_at": plant_doc["created_at"]
    }


@api_router.get("/plants")
async def get_plants():
    plants = await db.plants.find(
        {}, {"_id": 0, "image_base64": 0}
    ).sort("created_at", -1).to_list(100)
    return plants


@api_router.get("/plants/{plant_id}")
async def get_plant(plant_id: str):
    plant = await db.plants.find_one({"id": plant_id}, {"_id": 0})
    if not plant:
        return {"error": "Planta nao encontrada"}
    return plant


@api_router.put("/plants/{plant_id}")
async def update_plant(plant_id: str, request: PlantUpdateRequest):
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        return {"error": "Nenhum dado para atualizar"}
    await db.plants.update_one({"id": plant_id}, {"$set": update_data})
    plant = await db.plants.find_one({"id": plant_id}, {"_id": 0, "image_base64": 0})
    return plant


@api_router.delete("/plants/{plant_id}")
async def delete_plant(plant_id: str):
    await db.plants.delete_one({"id": plant_id})
    await db.reminders.delete_many({"plant_id": plant_id})
    return {"success": True}


@api_router.get("/plants/{plant_id}/image")
async def get_plant_image(plant_id: str):
    plant = await db.plants.find_one({"id": plant_id}, {"_id": 0, "image_base64": 1})
    if not plant:
        return {"error": "Planta nao encontrada"}
    return {"image_base64": plant.get("image_base64", "")}


# ─── Reminders ───

@api_router.post("/reminders")
async def create_reminder(request: ReminderCreateRequest):
    plant = await db.plants.find_one({"id": request.plant_id}, {"_id": 0, "custom_name": 1})
    if not plant:
        return {"error": "Planta nao encontrada"}

    reminder_doc = {
        "id": str(uuid.uuid4()),
        "plant_id": request.plant_id,
        "plant_name": plant.get("custom_name", ""),
        "reminder_type": request.reminder_type,
        "frequency_days": request.frequency_days,
        "description": request.description or "",
        "is_active": True,
        "last_completed": None,
        "next_due": (datetime.now(timezone.utc) + timedelta(days=request.frequency_days)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.reminders.insert_one(reminder_doc)
    reminder_doc.pop("_id", None)
    return reminder_doc


@api_router.get("/reminders")
async def get_reminders():
    reminders = await db.reminders.find({}, {"_id": 0}).sort("next_due", 1).to_list(200)
    return reminders


@api_router.get("/reminders/pending")
async def get_pending_reminders():
    now = datetime.now(timezone.utc).isoformat()
    reminders = await db.reminders.find(
        {"is_active": True, "next_due": {"$lte": now}}, {"_id": 0}
    ).sort("next_due", 1).to_list(200)
    return reminders


@api_router.put("/reminders/{reminder_id}/complete")
async def complete_reminder(reminder_id: str):
    reminder = await db.reminders.find_one({"id": reminder_id}, {"_id": 0})
    if not reminder:
        return {"error": "Lembrete nao encontrado"}

    now = datetime.now(timezone.utc)
    next_due = now + timedelta(days=reminder["frequency_days"])

    await db.reminders.update_one(
        {"id": reminder_id},
        {"$set": {"last_completed": now.isoformat(), "next_due": next_due.isoformat()}}
    )

    if reminder["reminder_type"] == "water":
        await db.plants.update_one(
            {"id": reminder["plant_id"]},
            {"$set": {"last_watered": now.isoformat()}}
        )

    updated = await db.reminders.find_one({"id": reminder_id}, {"_id": 0})
    return updated


@api_router.delete("/reminders/{reminder_id}")
async def delete_reminder(reminder_id: str):
    await db.reminders.delete_one({"id": reminder_id})
    return {"success": True}


@api_router.get("/stats")
async def get_stats():
    total_plants = await db.plants.count_documents({})
    total_scans = await db.scans.count_documents({})
    now = datetime.now(timezone.utc).isoformat()
    pending = await db.reminders.count_documents({"is_active": True, "next_due": {"$lte": now}})
    total_reminders = await db.reminders.count_documents({"is_active": True})
    return {
        "total_plants": total_plants,
        "total_scans": total_scans,
        "pending_reminders": pending,
        "total_reminders": total_reminders
    }


# Include router + middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
