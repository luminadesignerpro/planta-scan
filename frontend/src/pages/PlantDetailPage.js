import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Leaf,
  Loader2,
  Droplets,
  Sun,
  Thermometer,
  Sprout,
  AlertTriangle,
  Bell,
  Trash2,
  MapPin,
  Edit3,
  Check,
  X,
} from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const reminderTypeLabels = {
  water: "Rega",
  fertilize: "Adubo",
  prune: "Poda",
  repot: "Replantio",
  rotate: "Rotacao",
  clean: "Limpeza",
};

const reminderTypeIcons = {
  water: Droplets,
  fertilize: Sprout,
  prune: Leaf,
  repot: Leaf,
  rotate: Leaf,
  clean: Leaf,
};

const reminderTypeColors = {
  water: "text-blue-500",
  fertilize: "text-purple-500",
  prune: "text-amber-500",
  repot: "text-red-400",
  rotate: "text-cyan-500",
  clean: "text-emerald-500",
};

export default function PlantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [activeTab, setActiveTab] = useState("care");

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pRes, rRes] = await Promise.all([
          axios.get(`${API}/plants/${id}`),
          axios.get(`${API}/reminders`),
        ]);
        setPlant(pRes.data);
        setReminders(rRes.data.filter((r) => r.plant_id === id));
        setEditName(pRes.data.custom_name || "");
        setEditLocation(pRes.data.location || "");
        setEditNotes(pRes.data.notes || "");
      } catch {
        navigate("/plants");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const handleSaveEdit = async () => {
    try {
      const res = await axios.put(`${API}/plants/${id}`, {
        custom_name: editName,
        location: editLocation,
        notes: editNotes,
      });
      setPlant((prev) => ({ ...prev, ...res.data }));
      setEditing(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm("Remover esta planta e todos os lembretes?")) return;
    await axios.delete(`${API}/plants/${id}`);
    navigate("/plants");
  };

  const handleCompleteReminder = async (reminderId) => {
    const res = await axios.put(`${API}/reminders/${reminderId}/complete`);
    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? res.data : r))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9F8F6]">
        <Loader2 className="animate-spin text-[#1C3F2A]" size={32} />
      </div>
    );
  }

  if (!plant) return null;

  const care = plant.care_tips || {};
  const healthColor =
    plant.health_score >= 70
      ? "bg-emerald-500"
      : plant.health_score >= 40
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="pb-24 min-h-screen bg-[#F9F8F6]" data-testid="plant-detail-page">
      {/* Hero Image */}
      <div className="relative">
        <div className="aspect-[4/3] bg-[#EEF2EB] overflow-hidden">
          {plant.image_base64 ? (
            <img
              src={plant.image_base64}
              alt={plant.custom_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf size={60} className="text-[#8FA290]" />
            </div>
          )}
        </div>
        <button
          onClick={() => navigate("/plants")}
          className="absolute top-12 left-4 bg-black/40 text-white rounded-full p-2.5 backdrop-blur-sm"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="absolute top-12 right-4 flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="bg-black/40 text-white rounded-full p-2.5 backdrop-blur-sm"
            data-testid="edit-plant-button"
          >
            <Edit3 size={18} />
          </button>
          <button
            onClick={handleDelete}
            className="bg-black/40 text-white rounded-full p-2.5 backdrop-blur-sm"
            data-testid="delete-plant-detail-button"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Plant Info */}
      <div className="px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl border border-[#E5EBE5] p-6 shadow-sm">
          {editing ? (
            <div className="space-y-3">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-[#E5EBE5] rounded-xl px-4 py-2.5 font-body text-[#1C3F2A] focus:outline-none focus:ring-2 focus:ring-[#1C3F2A]"
                placeholder="Nome da planta"
                data-testid="edit-name-input"
              />
              <input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full border border-[#E5EBE5] rounded-xl px-4 py-2.5 font-body text-sm text-[#4A5D4E] focus:outline-none focus:ring-2 focus:ring-[#1C3F2A]"
                placeholder="Localizacao (ex: Sala, Varanda)"
                data-testid="edit-location-input"
              />
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full border border-[#E5EBE5] rounded-xl px-4 py-2.5 font-body text-sm text-[#4A5D4E] focus:outline-none focus:ring-2 focus:ring-[#1C3F2A] resize-none"
                rows={2}
                placeholder="Notas"
                data-testid="edit-notes-input"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-[#1C3F2A] text-white rounded-xl py-2.5 font-body font-semibold flex items-center justify-center gap-2"
                  data-testid="save-edit-button"
                >
                  <Check size={16} /> Salvar
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-[#EEF2EB] text-[#1C3F2A] rounded-xl py-2.5 px-4"
                  data-testid="cancel-edit-button"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-heading text-3xl text-[#1C3F2A] leading-tight">
                {plant.custom_name}
              </h1>
              <p className="text-[#8B9D8E] font-body text-sm italic">
                {plant.scientific_name}
              </p>
              {plant.family && (
                <p className="text-[#8B9D8E] font-body text-xs mt-0.5">
                  Familia: {plant.family}
                </p>
              )}
              {plant.location && (
                <div className="flex items-center gap-1.5 mt-2 text-[#4A5D4E]">
                  <MapPin size={14} />
                  <span className="font-body text-sm">{plant.location}</span>
                </div>
              )}
              {plant.description && (
                <p className="text-[#4A5D4E] font-body text-sm mt-3 leading-relaxed">
                  {plant.description}
                </p>
              )}
              {/* Health Score */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#4A5D4E] font-body text-sm font-medium">
                    Saude
                  </span>
                  <span className="text-[#1C3F2A] font-body text-sm font-bold">
                    {plant.health_score}%
                  </span>
                </div>
                <div className="w-full bg-[#EEF2EB] rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${healthColor}`}
                    style={{ width: `${plant.health_score}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mt-6">
        <div className="flex gap-2 mb-4">
          {[
            { key: "care", label: "Cuidados" },
            { key: "diseases", label: "Diagnostico" },
            { key: "reminders", label: "Lembretes" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-[#1C3F2A] text-white"
                  : "bg-[#EEF2EB] text-[#4A5D4E]"
              }`}
              data-testid={`tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Care Tab */}
        {activeTab === "care" && (
          <div className="space-y-3 animate-fade-in">
            {care.water && (
              <CareCard icon={Droplets} color="text-blue-500" label="Rega" tip={care.water} />
            )}
            {care.light && (
              <CareCard icon={Sun} color="text-amber-500" label="Luz" tip={care.light} />
            )}
            {care.temperature && (
              <CareCard icon={Thermometer} color="text-red-400" label="Temperatura" tip={care.temperature} />
            )}
            {care.soil && (
              <CareCard icon={Sprout} color="text-emerald-600" label="Solo" tip={care.soil} />
            )}
            {care.fertilizer && (
              <CareCard icon={Leaf} color="text-green-600" label="Adubo" tip={care.fertilizer} />
            )}

            {plant.curiosities?.length > 0 && (
              <div className="bg-[#EEF2EB] rounded-3xl p-5 mt-4">
                <h3 className="font-heading text-base text-[#1C3F2A] mb-2">
                  Curiosidades
                </h3>
                <ul className="space-y-1.5">
                  {plant.curiosities.map((c, i) => (
                    <li
                      key={i}
                      className="text-[#4A5D4E] font-body text-sm flex items-start gap-2"
                    >
                      <span className="text-[#B85C38] shrink-0">*</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Diseases Tab */}
        {activeTab === "diseases" && (
          <div className="space-y-3 animate-fade-in">
            {plant.diseases?.length > 0 ? (
              plant.diseases.map((d, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl border border-[#E5EBE5] p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-[#B85C38]" />
                      <span className="font-body font-semibold text-[#1C3F2A]">
                        {d.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        d.severity === "high"
                          ? "bg-red-100 text-red-700"
                          : d.severity === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {d.severity === "high"
                        ? "Alta"
                        : d.severity === "medium"
                        ? "Media"
                        : "Baixa"}
                    </span>
                  </div>
                  <p className="text-[#4A5D4E] font-body text-sm">{d.description}</p>
                  {d.treatment && (
                    <div className="mt-3 bg-[#EEF2EB] rounded-xl p-3">
                      <span className="font-body text-xs font-semibold text-[#1C3F2A]">
                        Tratamento:
                      </span>
                      <p className="font-body text-xs text-[#4A5D4E] mt-0.5">
                        {d.treatment}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <img
                  src="https://static.prod-images.emergentagent.com/jobs/dffe6d62-58d4-4fa8-96ff-221942317b91/images/ebc9953cbcfb6f7420e856384bee4c027acd2b1dab0caebe8b4729765e5a6ece.png"
                  alt="Saudavel"
                  className="w-28 h-28 mx-auto mb-4 opacity-80"
                />
                <h3 className="font-heading text-xl text-[#1C3F2A]">
                  Planta Saudavel!
                </h3>
                <p className="text-[#8B9D8E] font-body text-sm mt-1">
                  Nenhum problema detectado
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reminders Tab */}
        {activeTab === "reminders" && (
          <div className="space-y-3 animate-fade-in">
            {reminders.length > 0 ? (
              reminders.map((r) => {
                const isOverdue =
                  new Date(r.next_due) < new Date() && r.is_active;
                const Icon =
                  reminderTypeIcons[r.reminder_type] || Bell;
                const color =
                  reminderTypeColors[r.reminder_type] || "text-[#8FA290]";
                return (
                  <div
                    key={r.id}
                    className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${
                      isOverdue
                        ? "border-[#B85C38] bg-[#FFF8F5]"
                        : "border-[#E5EBE5]"
                    }`}
                    data-testid={`reminder-${r.id}`}
                  >
                    <div
                      className={`p-2.5 rounded-xl ${
                        isOverdue ? "bg-[#FFF0E8]" : "bg-[#EEF2EB]"
                      }`}
                    >
                      <Icon
                        size={20}
                        className={isOverdue ? "text-[#B85C38]" : color}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-body font-semibold text-[#1C3F2A] text-sm">
                        {reminderTypeLabels[r.reminder_type] || r.reminder_type}
                      </span>
                      <p className="text-[#8B9D8E] font-body text-xs truncate">
                        A cada {r.frequency_days} dias
                      </p>
                      {isOverdue && (
                        <span className="text-[#B85C38] font-body text-xs font-semibold">
                          Atrasado!
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCompleteReminder(r.id)}
                      className="bg-[#1C3F2A] text-white rounded-xl px-4 py-2 text-xs font-body font-semibold active:scale-95 transition-transform"
                      data-testid={`complete-reminder-${r.id}`}
                    >
                      Feito
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <Bell size={40} className="text-[#8FA290] mx-auto mb-3" />
                <p className="text-[#8B9D8E] font-body text-sm">
                  Nenhum lembrete para esta planta
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CareCard({ icon: Icon, color, label, tip }) {
  if (!tip) return null;
  return (
    <div className="bg-white rounded-3xl border border-[#E5EBE5] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className={color} />
        <span className="font-body font-semibold text-[#1C3F2A]">{label}</span>
      </div>
      <div className="space-y-1">
        {(tip.frequency || tip.type || tip.range) && (
          <p className="text-[#1C3F2A] font-body text-sm font-medium">
            {tip.frequency || tip.type || tip.range}
          </p>
        )}
        {tip.tips && (
          <p className="text-[#4A5D4E] font-body text-sm leading-relaxed">
            {tip.tips}
          </p>
        )}
      </div>
    </div>
  );
}
