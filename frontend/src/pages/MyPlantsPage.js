import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Plus, Loader2, MapPin, Trash2 } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const healthBadge = {
  healthy: { label: "Saudavel", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  needs_attention: { label: "Atencao", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  critical: { label: "Critico", cls: "bg-red-50 text-red-700 border-red-200" },
};

function PlantCard({ plant, onDelete }) {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const badge = healthBadge[plant.health_status] || healthBadge.healthy;

  useEffect(() => {
    axios
      .get(`${API}/plants/${plant.id}/image`)
      .then((r) => setImgSrc(r.data.image_base64))
      .catch(() => {});
  }, [plant.id]);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Remover esta planta?")) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/plants/${plant.id}`);
      onDelete(plant.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div
      className="plant-card bg-white rounded-3xl border border-[#E5EBE5] shadow-sm overflow-hidden cursor-pointer animate-fade-in"
      onClick={() => navigate(`/plants/${plant.id}`)}
      data-testid={`plant-card-${plant.id}`}
    >
      <div className="aspect-square bg-[#EEF2EB] relative overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={plant.custom_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf size={40} className="text-[#8FA290]" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full border ${badge.cls}`}
          >
            {badge.label}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-heading text-lg text-[#1C3F2A] leading-tight truncate">
          {plant.custom_name}
        </h3>
        <p className="text-[#8B9D8E] font-body text-xs italic truncate">
          {plant.scientific_name}
        </p>
        {plant.location && (
          <div className="flex items-center gap-1 mt-2 text-[#8B9D8E]">
            <MapPin size={12} />
            <span className="font-body text-xs truncate">{plant.location}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[#8B9D8E] font-body text-[10px]">
            {new Date(plant.created_at).toLocaleDateString("pt-BR")}
          </span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[#8B9D8E] hover:text-red-500 transition-colors p-1"
            data-testid={`delete-plant-${plant.id}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyPlantsPage() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API}/plants`)
      .then((r) => setPlants(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id) => {
    setPlants((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="pb-24 min-h-screen bg-[#F9F8F6]" data-testid="my-plants-page">
      <div className="px-6 pt-12 pb-4 flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl text-[#1C3F2A] tracking-tight">
            Minhas Plantas
          </h1>
          <p className="text-[#4A5D4E] mt-1 font-body text-sm">
            {plants.length} planta{plants.length !== 1 && "s"} na colecao
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="bg-[#1C3F2A] text-white rounded-full p-3 shadow-lg active:scale-95 transition-transform"
          data-testid="add-plant-button"
        >
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#1C3F2A]" size={32} />
        </div>
      ) : plants.length === 0 ? (
        <div className="px-6 flex flex-col items-center justify-center py-16">
          <img
            src="https://static.prod-images.emergentagent.com/jobs/dffe6d62-58d4-4fa8-96ff-221942317b91/images/ebc9953cbcfb6f7420e856384bee4c027acd2b1dab0caebe8b4729765e5a6ece.png"
            alt="Sem plantas"
            className="w-40 h-40 object-contain mb-6 opacity-80"
          />
          <h2 className="font-heading text-2xl text-[#1C3F2A] mb-2">
            Nenhuma planta ainda
          </h2>
          <p className="text-[#8B9D8E] font-body text-center mb-6">
            Escaneie sua primeira planta para comecar sua colecao!
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#1C3F2A] text-white rounded-2xl py-3 px-8 font-body font-semibold active:scale-95 transition-transform"
            data-testid="scan-first-plant-button"
          >
            Escanear Planta
          </button>
        </div>
      ) : (
        <div className="px-6 grid grid-cols-2 gap-4">
          {plants.map((plant, i) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
