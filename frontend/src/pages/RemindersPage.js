import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Droplets,
  Sprout,
  Leaf,
  Loader2,
  Check,
  Trash2,
  Plus,
  Clock,
} from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const typeConfig = {
  water: { label: "Rega", icon: Droplets, color: "text-blue-500", bg: "bg-blue-50" },
  fertilize: { label: "Adubo", icon: Sprout, color: "text-purple-500", bg: "bg-purple-50" },
  prune: { label: "Poda", icon: Leaf, color: "text-amber-500", bg: "bg-amber-50" },
  repot: { label: "Replantio", icon: Leaf, color: "text-red-400", bg: "bg-red-50" },
  rotate: { label: "Rotacao", icon: Leaf, color: "text-cyan-500", bg: "bg-cyan-50" },
  clean: { label: "Limpeza", icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-50" },
};

function NewReminderForm({ plants, onCreated, onCancel }) {
  const [plantId, setPlantId] = useState("");
  const [type, setType] = useState("water");
  const [freq, setFreq] = useState(7);
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plantId) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/reminders`, {
        plant_id: plantId,
        reminder_type: type,
        frequency_days: freq,
        description: desc,
      });
      onCreated(res.data);
    } catch {}
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-[#E5EBE5] p-6 shadow-sm space-y-4 animate-slide-up"
      data-testid="new-reminder-form"
    >
      <h3 className="font-heading text-lg text-[#1C3F2A]">Novo Lembrete</h3>

      <select
        value={plantId}
        onChange={(e) => setPlantId(e.target.value)}
        className="w-full border border-[#E5EBE5] rounded-xl px-4 py-2.5 font-body text-sm text-[#1C3F2A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1C3F2A]"
        data-testid="reminder-plant-select"
      >
        <option value="">Selecione a planta</option>
        {plants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.custom_name}
          </option>
        ))}
      </select>

      <div className="flex gap-2 flex-wrap">
        {Object.entries(typeConfig).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all border ${
              type === key
                ? "bg-[#1C3F2A] text-white border-[#1C3F2A]"
                : "bg-[#EEF2EB] text-[#4A5D4E] border-[#E5EBE5]"
            }`}
            data-testid={`reminder-type-${key}`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <div>
        <label className="font-body text-sm text-[#4A5D4E] mb-1 block">
          Frequencia (dias)
        </label>
        <input
          type="number"
          min={1}
          max={365}
          value={freq}
          onChange={(e) => setFreq(Number(e.target.value))}
          className="w-full border border-[#E5EBE5] rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3F2A]"
          data-testid="reminder-frequency-input"
        />
      </div>

      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        className="w-full border border-[#E5EBE5] rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3F2A]"
        placeholder="Descricao (opcional)"
        data-testid="reminder-description-input"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!plantId || submitting}
          className="flex-1 bg-[#1C3F2A] text-white rounded-xl py-2.5 font-body font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          data-testid="create-reminder-submit"
        >
          {submitting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Plus size={16} />
          )}
          Criar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-[#EEF2EB] text-[#4A5D4E] rounded-xl py-2.5 px-4 font-body"
          data-testid="cancel-reminder-button"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [rRes, pRes] = await Promise.all([
          axios.get(`${API}/reminders`),
          axios.get(`${API}/plants`),
        ]);
        setReminders(rRes.data);
        setPlants(pRes.data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const grouped = useMemo(() => {
    const now = new Date();
    const overdue = [];
    const today = [];
    const upcoming = [];

    reminders
      .filter((r) => r.is_active)
      .forEach((r) => {
        const due = new Date(r.next_due);
        const diffMs = due - now;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays < 0) overdue.push(r);
        else if (diffDays < 1) today.push(r);
        else upcoming.push(r);
      });

    return { overdue, today, upcoming };
  }, [reminders]);

  const handleComplete = async (id) => {
    try {
      const res = await axios.put(`${API}/reminders/${id}/complete`);
      setReminders((prev) => prev.map((r) => (r.id === id ? res.data : r)));
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/reminders/${id}`);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  };

  const handleCreated = (reminder) => {
    setReminders((prev) => [reminder, ...prev]);
    setShowForm(false);
  };

  const pendingCount = grouped.overdue.length + grouped.today.length;

  return (
    <div className="pb-24 min-h-screen bg-[#F9F8F6]" data-testid="reminders-page">
      <div className="px-6 pt-12 pb-4 flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl text-[#1C3F2A] tracking-tight">
            Lembretes
          </h1>
          <p className="text-[#4A5D4E] mt-1 font-body text-sm">
            {pendingCount > 0
              ? `${pendingCount} tarefa${pendingCount > 1 ? "s" : ""} pendente${pendingCount > 1 ? "s" : ""}`
              : "Tudo em dia!"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#1C3F2A] text-white rounded-full p-3 shadow-lg active:scale-95 transition-transform"
          data-testid="add-reminder-button"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="px-6 space-y-6">
        {showForm && (
          <NewReminderForm
            plants={plants}
            onCreated={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#1C3F2A]" size={32} />
          </div>
        ) : reminders.filter((r) => r.is_active).length === 0 && !showForm ? (
          <div className="flex flex-col items-center py-16">
            <Bell size={48} className="text-[#8FA290] mb-4" />
            <h2 className="font-heading text-2xl text-[#1C3F2A] mb-2">
              Sem lembretes
            </h2>
            <p className="text-[#8B9D8E] font-body text-center text-sm mb-6">
              {plants.length > 0
                ? "Crie lembretes para cuidar das suas plantas!"
                : "Escaneie uma planta primeiro para criar lembretes."}
            </p>
            {plants.length === 0 && (
              <button
                onClick={() => navigate("/")}
                className="bg-[#1C3F2A] text-white rounded-2xl py-3 px-8 font-body font-semibold"
                data-testid="scan-for-reminders-button"
              >
                Escanear Planta
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Overdue */}
            {grouped.overdue.length > 0 && (
              <ReminderGroup
                title="Atrasados"
                badge={grouped.overdue.length}
                badgeColor="bg-[#B85C38] text-white"
                reminders={grouped.overdue}
                onComplete={handleComplete}
                onDelete={handleDelete}
                isOverdue
              />
            )}

            {/* Today */}
            {grouped.today.length > 0 && (
              <ReminderGroup
                title="Hoje"
                badge={grouped.today.length}
                badgeColor="bg-amber-500 text-white"
                reminders={grouped.today}
                onComplete={handleComplete}
                onDelete={handleDelete}
              />
            )}

            {/* Upcoming */}
            {grouped.upcoming.length > 0 && (
              <ReminderGroup
                title="Proximos"
                badge={grouped.upcoming.length}
                badgeColor="bg-[#8FA290] text-white"
                reminders={grouped.upcoming}
                onComplete={handleComplete}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReminderGroup({
  title,
  badge,
  badgeColor,
  reminders,
  onComplete,
  onDelete,
  isOverdue,
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-heading text-xl text-[#1C3F2A]">{title}</h2>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}
        >
          {badge}
        </span>
      </div>
      <div className="space-y-2">
        {reminders.map((r) => {
          const cfg = typeConfig[r.reminder_type] || typeConfig.water;
          const Icon = cfg.icon;
          const daysUntil = Math.ceil(
            (new Date(r.next_due) - new Date()) / (1000 * 60 * 60 * 24)
          );

          return (
            <div
              key={r.id}
              className={`bg-white rounded-2xl border p-4 flex items-center gap-3 shadow-sm ${
                isOverdue
                  ? "border-[#B85C38]/30 pulse-gentle"
                  : "border-[#E5EBE5]"
              }`}
              data-testid={`reminder-item-${r.id}`}
            >
              <div className={`p-2 rounded-xl ${cfg.bg}`}>
                <Icon
                  size={18}
                  className={isOverdue ? "text-[#B85C38]" : cfg.color}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-body font-semibold text-[#1C3F2A] text-sm">
                    {cfg.label}
                  </span>
                  <span className="text-[#8B9D8E] font-body text-[10px]">
                    * {r.plant_name}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[#8B9D8E]">
                  <Clock size={10} />
                  <span className="font-body text-xs">
                    {isOverdue
                      ? `${Math.abs(daysUntil)} dia${Math.abs(daysUntil) !== 1 ? "s" : ""} atrasado`
                      : daysUntil === 0
                      ? "Hoje"
                      : `em ${daysUntil} dia${daysUntil !== 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onComplete(r.id)}
                className="bg-[#1C3F2A] text-white rounded-lg p-2 active:scale-95 transition-transform"
                data-testid={`complete-${r.id}`}
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => onDelete(r.id)}
                className="text-[#8B9D8E] hover:text-red-500 transition-colors p-1"
                data-testid={`delete-reminder-${r.id}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
