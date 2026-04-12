from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import re
import calendar as cal_module
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

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

SEASONAL_TIPS = {
    "Verao": {
        "description": "Estacao quente e chuvosa no Brasil",
        "tips": [
            {"title": "Aumente a frequencia de rega", "description": "O calor intenso faz o solo secar mais rapido. Verifique a umidade diariamente.", "icon": "water"},
            {"title": "Proteja do sol forte", "description": "Entre 11h e 15h, mova plantas sensiveis para areas com sombra parcial.", "icon": "sun"},
            {"title": "Atencao com pragas", "description": "Calor e umidade favorecem pulgoes, cochonilhas e acaros. Inspecione regularmente.", "icon": "alert"},
            {"title": "Adube com moderacao", "description": "Plantas crescem mais no verao. Use adubo diluido a cada 15 dias.", "icon": "fertilizer"},
        ]
    },
    "Outono": {
        "description": "Temperaturas amenas e dias mais curtos",
        "tips": [
            {"title": "Reduza a rega gradualmente", "description": "Com a queda de temperatura, as plantas precisam de menos agua.", "icon": "water"},
            {"title": "Aproveite a luz natural", "description": "Mova plantas para locais com mais luz, pois os dias ficam mais curtos.", "icon": "sun"},
            {"title": "Prepare para o inverno", "description": "Faca podas de limpeza e troque vasos apertados.", "icon": "prune"},
            {"title": "Ultima adubacao forte", "description": "Faca a ultima adubacao robusta antes do inverno.", "icon": "fertilizer"},
        ]
    },
    "Inverno": {
        "description": "Periodo frio e seco",
        "tips": [
            {"title": "Regue com menos frequencia", "description": "O solo demora mais a secar no frio. Espere o substrato secar completamente.", "icon": "water"},
            {"title": "Proteja do frio intenso", "description": "Plantas tropicais devem ficar longe de janelas frias e correntes de ar.", "icon": "temperature"},
            {"title": "Pause a adubacao", "description": "A maioria das plantas entra em dormencia. Nao adube ate a primavera.", "icon": "fertilizer"},
            {"title": "Limpe as folhas", "description": "Folhas limpas absorvem melhor a pouca luz disponivel.", "icon": "clean"},
        ]
    },
    "Primavera": {
        "description": "Temperaturas agradaveis e dias mais longos",
        "tips": [
            {"title": "Retome a adubacao", "description": "As plantas acordam da dormencia! Comece a adubar a cada 15 dias.", "icon": "fertilizer"},
            {"title": "Aumente a rega aos poucos", "description": "Com mais calor e luz, as plantas voltam a consumir mais agua.", "icon": "water"},
            {"title": "Hora de replantar", "description": "Melhor epoca para trocar vasos, dividir touceiras e fazer mudas.", "icon": "repot"},
            {"title": "Pode para estimular crescimento", "description": "Remova galhos secos e pode para dar forma. A planta vai brotar com forca.", "icon": "prune"},
        ]
    }
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def get_current_season():
    month = datetime.now(timezone.utc).month
    if month in [12, 1, 2]:
        return "Verao"
    elif month in [3, 4, 5]:
        return "Outono"
    elif month in [6, 7, 8]:
        return "Inverno"
    else:
        return "Primavera"


async def analyze_plant_image(image_base64, session_id, extra_context=""):
    image_data = image_base64
    if ',' in image_data:
        image_data = image_data.split(',')[1]

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=PLANT_ANALYSIS_PROMPT
    )
    chat.with_model("openai", "gpt-5.2")

    image_content = ImageContent(image_base64=image_data)
    text = "Analyze this plant image. Identify the species, evaluate health, diagnose diseases, and provide care recommendations. Return ONLY raw JSON."
    if extra_context:
        text = extra_context

    user_msg = UserMessage(text=text, file_contents=[image_content])
    response_text = await chat.send_message(user_msg)

    clean = response_text.strip()
    if clean.startswith('```'):
        clean = re.sub(r'^```(?:json)?\s*', '', clean)
        clean = re.sub(r'\s*```$', '', clean)

    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        match = re.search(r'\{[\s\S]*\}', clean)
        if match:
            return json.loads(match.group())
        raise


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


# ─── Core Endpoints ───

@api_router.get("/")
async def root():
    return {"message": "PlantaScan API v1.0"}


@api_router.post("/scan")
async def scan_plant(request: ScanRequest):
    scan_id = str(uuid.uuid4())
    try:
        analysis = await analyze_plant_image(request.image_base64, f"scan-{scan_id}")
        scan_doc = {
            "id": scan_id,
            "image_base64": request.image_base64,
            "analysis": analysis,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "saved": False
        }
        await db.scans.insert_one(scan_doc)
        return {"id": scan_id, "analysis": analysis, "timestamp": scan_doc["timestamp"]}
    except Exception as e:
        logger.error(f"Scan error: {str(e)}")
        return {
            "id": scan_id,
            "analysis": {"identified": False, "error": f"Erro ao analisar: {str(e)}"},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


@api_router.get("/scans")
async def get_scans():
    return await db.scans.find({}, {"_id": 0, "image_base64": 0}).sort("timestamp", -1).to_list(100)


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
    now_iso = datetime.now(timezone.utc).isoformat()

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
        "created_at": now_iso,
        "last_watered": None,
        "health_history": [
            {
                "timestamp": now_iso,
                "health_score": analysis.get("health_score", 0),
                "health_status": analysis.get("health_status", "healthy"),
                "diseases_count": len(analysis.get("diseases", [])),
            }
        ]
    }

    await db.plants.insert_one(plant_doc)
    await db.scans.update_one({"id": request.scan_id}, {"$set": {"saved": True}})

    for reminder in analysis.get("suggested_reminders", []):
        freq = reminder.get("frequency_days", 7)
        r_doc = {
            "id": str(uuid.uuid4()),
            "plant_id": plant_id,
            "plant_name": plant_doc["custom_name"],
            "reminder_type": reminder.get("type", "water"),
            "frequency_days": freq,
            "description": reminder.get("description", ""),
            "is_active": True,
            "last_completed": None,
            "next_due": (datetime.now(timezone.utc) + timedelta(days=freq)).isoformat(),
            "created_at": now_iso
        }
        await db.reminders.insert_one(r_doc)

    return {"id": plant_id, "custom_name": plant_doc["custom_name"], "plant_name": plant_doc["plant_name"],
            "scientific_name": plant_doc["scientific_name"], "health_status": plant_doc["health_status"], "created_at": now_iso}


@api_router.get("/plants")
async def get_plants():
    return await db.plants.find({}, {"_id": 0, "image_base64": 0}).sort("created_at", -1).to_list(100)


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


# ─── Re-scan & Health History ───

@api_router.post("/plants/{plant_id}/rescan")
async def rescan_plant(plant_id: str, request: ScanRequest):
    plant = await db.plants.find_one({"id": plant_id}, {"_id": 0})
    if not plant:
        return {"error": "Planta nao encontrada"}

    scan_id = str(uuid.uuid4())
    try:
        context = f"This is a re-scan of '{plant['plant_name']}' ({plant['scientific_name']}). Compare with previous health and provide updated analysis. Return ONLY raw JSON."
        analysis = await analyze_plant_image(request.image_base64, f"rescan-{scan_id}", context)

        now_iso = datetime.now(timezone.utc).isoformat()
        scan_doc = {
            "id": scan_id, "image_base64": request.image_base64, "analysis": analysis,
            "timestamp": now_iso, "saved": True, "rescan_of": plant_id
        }
        await db.scans.insert_one(scan_doc)

        history_entry = {
            "timestamp": now_iso,
            "health_score": analysis.get("health_score", 0),
            "health_status": analysis.get("health_status", "healthy"),
            "diseases_count": len(analysis.get("diseases", [])),
        }

        await db.plants.update_one({"id": plant_id}, {
            "$set": {
                "health_status": analysis.get("health_status", plant["health_status"]),
                "health_score": analysis.get("health_score", plant["health_score"]),
                "diseases": analysis.get("diseases", []),
                "care_tips": analysis.get("care_tips", plant.get("care_tips", {})),
                "image_base64": request.image_base64,
            },
            "$push": {"health_history": history_entry}
        })

        updated = await db.plants.find_one({"id": plant_id}, {"_id": 0, "image_base64": 0})
        return {"scan_id": scan_id, "analysis": analysis, "plant": updated}

    except Exception as e:
        logger.error(f"Rescan error: {str(e)}")
        return {"error": f"Erro ao re-escanear: {str(e)}"}


@api_router.get("/plants/{plant_id}/history")
async def get_plant_history(plant_id: str):
    plant = await db.plants.find_one({"id": plant_id}, {"_id": 0, "health_history": 1, "custom_name": 1})
    if not plant:
        return {"error": "Planta nao encontrada"}
    return {"plant_name": plant.get("custom_name", ""), "history": plant.get("health_history", [])}


# ─── Reminders ───

@api_router.post("/reminders")
async def create_reminder(request: ReminderCreateRequest):
    plant = await db.plants.find_one({"id": request.plant_id}, {"_id": 0, "custom_name": 1})
    if not plant:
        return {"error": "Planta nao encontrada"}
    r_doc = {
        "id": str(uuid.uuid4()), "plant_id": request.plant_id,
        "plant_name": plant.get("custom_name", ""), "reminder_type": request.reminder_type,
        "frequency_days": request.frequency_days, "description": request.description or "",
        "is_active": True, "last_completed": None,
        "next_due": (datetime.now(timezone.utc) + timedelta(days=request.frequency_days)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reminders.insert_one(r_doc)
    r_doc.pop("_id", None)
    return r_doc


@api_router.get("/reminders")
async def get_reminders():
    return await db.reminders.find({}, {"_id": 0}).sort("next_due", 1).to_list(200)


@api_router.get("/reminders/pending")
async def get_pending_reminders():
    now = datetime.now(timezone.utc).isoformat()
    return await db.reminders.find({"is_active": True, "next_due": {"$lte": now}}, {"_id": 0}).sort("next_due", 1).to_list(200)


@api_router.put("/reminders/{reminder_id}/complete")
async def complete_reminder(reminder_id: str):
    reminder = await db.reminders.find_one({"id": reminder_id}, {"_id": 0})
    if not reminder:
        return {"error": "Lembrete nao encontrado"}
    now = datetime.now(timezone.utc)
    next_due = now + timedelta(days=reminder["frequency_days"])
    await db.reminders.update_one({"id": reminder_id}, {"$set": {"last_completed": now.isoformat(), "next_due": next_due.isoformat()}})
    if reminder["reminder_type"] == "water":
        await db.plants.update_one({"id": reminder["plant_id"]}, {"$set": {"last_watered": now.isoformat()}})
    return await db.reminders.find_one({"id": reminder_id}, {"_id": 0})


@api_router.delete("/reminders/{reminder_id}")
async def delete_reminder(reminder_id: str):
    await db.reminders.delete_one({"id": reminder_id})
    return {"success": True}


# ─── Calendar ───

@api_router.get("/reminders/calendar/{year}/{month}")
async def get_calendar_reminders(year: int, month: int):
    reminders = await db.reminders.find({"is_active": True}, {"_id": 0}).to_list(200)
    days_count = cal_module.monthrange(year, month)[1]
    month_start = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        month_end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        month_end = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    days = {str(d): [] for d in range(1, days_count + 1)}

    for r in reminders:
        try:
            nd = datetime.fromisoformat(r["next_due"])
            if nd.tzinfo is None:
                nd = nd.replace(tzinfo=timezone.utc)
            freq = timedelta(days=max(r["frequency_days"], 1))
            current = nd
            while current > month_end:
                current -= freq
            while current < month_start:
                current += freq
            while current < month_end:
                d_str = str(current.day)
                if d_str in days:
                    days[d_str].append({"id": r["id"], "plant_name": r.get("plant_name", ""),
                                        "type": r["reminder_type"], "description": r.get("description", "")})
                current += freq
        except Exception:
            continue

    first_weekday = (datetime(year, month, 1).weekday() + 1) % 7
    return {"year": year, "month": month, "days_in_month": days_count, "first_weekday": first_weekday, "days": days}


# ─── Seasonal Recommendations ───

@api_router.get("/recommendations/seasonal")
async def get_seasonal_recommendations():
    season = get_current_season()
    month = datetime.now(timezone.utc).month
    month_names = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
                   "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

    base = SEASONAL_TIPS.get(season, SEASONAL_TIPS["Primavera"])
    plants = await db.plants.find({}, {"_id": 0, "id": 1, "custom_name": 1, "plant_name": 1, "scientific_name": 1}).to_list(50)

    result = {
        "season": season,
        "month": month,
        "month_name": month_names[month - 1],
        "description": base["description"],
        "general_tips": base["tips"],
        "plant_tips": []
    }

    if plants:
        cache_key = f"seasonal_{season}_{month}"
        cached = await db.seasonal_cache.find_one({"key": cache_key}, {"_id": 0})
        if cached and cached.get("plant_tips"):
            result["plant_tips"] = cached["plant_tips"]
            return result

        try:
            plant_list = ", ".join([f"{p.get('custom_name', p.get('plant_name', ''))}" for p in plants])
            chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"seasonal-{cache_key}",
                           system_message="Voce e um especialista em plantas. Responda APENAS com JSON valido, sem markdown.")
            chat.with_model("openai", "gpt-5.2")
            msg = UserMessage(text=f"""Estacao atual: {season} ({base['description']}) no Brasil. Mes: {month_names[month-1]}.
Plantas do usuario: {plant_list}
Retorne APENAS um JSON array com dicas sazonais por planta:
[{{"plant_name": "Nome", "tips": ["Dica 1", "Dica 2", "Dica 3"]}}]
Maximo 3 dicas por planta. Tudo em portugues brasileiro.""")
            resp = await chat.send_message(msg)
            clean = resp.strip()
            if clean.startswith('```'):
                clean = re.sub(r'^```(?:json)?\s*', '', clean)
                clean = re.sub(r'\s*```$', '', clean)
            plant_tips = json.loads(clean)
            if isinstance(plant_tips, list):
                result["plant_tips"] = plant_tips
                await db.seasonal_cache.update_one({"key": cache_key}, {"$set": {"key": cache_key, "plant_tips": plant_tips}}, upsert=True)
        except Exception as e:
            logger.error(f"Seasonal AI error: {e}")

    return result


@api_router.get("/stats")
async def get_stats():
    total_plants = await db.plants.count_documents({})
    total_scans = await db.scans.count_documents({})
    now = datetime.now(timezone.utc).isoformat()
    pending = await db.reminders.count_documents({"is_active": True, "next_due": {"$lte": now}})
    total_reminders = await db.reminders.count_documents({"is_active": True})
    return {"total_plants": total_plants, "total_scans": total_scans,
            "pending_reminders": pending, "total_reminders": total_reminders}


app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True,
                   allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
                   allow_methods=["*"], allow_headers=["*"])


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
