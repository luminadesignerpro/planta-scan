import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Leaf, Loader2, AlertTriangle, Check, X } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const healthBadge = {
  healthy: { label: "Saudavel", cls: "bg-emerald-50 text-emerald-700" },
  needs_attention: { label: "Atencao", cls: "bg-amber-50 text-amber-700" },
  critical: { label: "Critico", cls: "bg-red-50 text-red-700" },
};

export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API}/scans`)
      .then((r) => setScans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-24 min-h-screen bg-[#F9F8F6]" data-testid="history-page">
      <div className="px-6 pt-12 pb-4">
        <h1 className="font-heading text-3xl text-[#1C3F2A] tracking-tight">
          Historico
        </h1>
        <p className="text-[#4A5D4E] mt-1 font-body text-sm">
          {scans.length} escaneamento{scans.length !== 1 && "s"}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#1C3F2A]" size={32} />
        </div>
      ) : scans.length === 0 ? (
        <div className="px-6 flex flex-col items-center py-16">
          <Clock size={48} className="text-[#8FA290] mb-4" />
          <h2 className="font-heading text-2xl text-[#1C3F2A] mb-2">
            Nenhum escaneamento
          </h2>
          <p className="text-[#8B9D8E] font-body text-center text-sm mb-6">
            Seu historico de escaneamentos aparecera aqui
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#1C3F2A] text-white rounded-2xl py-3 px-8 font-body font-semibold active:scale-95 transition-transform"
            data-testid="scan-from-history-button"
          >
            Escanear Planta
          </button>
        </div>
      ) : (
        <div className="px-6 space-y-3">
          {scans.map((scan) => {
            const analysis = scan.analysis || {};
            const identified = analysis.identified !== false;
            const badge = healthBadge[analysis.health_status] || healthBadge.healthy;
            const date = new Date(scan.timestamp);

            return (
              <div
                key={scan.id}
                className="bg-white rounded-2xl border border-[#E5EBE5] p-4 shadow-sm animate-fade-in"
                data-testid={`scan-history-${scan.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        identified ? "bg-[#EEF2EB]" : "bg-amber-50"
                      }`}
                    >
                      {identified ? (
                        <Leaf size={20} className="text-[#1C3F2A]" />
                      ) : (
                        <AlertTriangle size={20} className="text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-body font-semibold text-[#1C3F2A] text-sm truncate">
                        {identified
                          ? analysis.plant_name
                          : "Nao identificado"}
                      </h3>
                      {identified && (
                        <p className="text-[#8B9D8E] font-body text-xs italic truncate">
                          {analysis.scientific_name}
                        </p>
                      )}
                      <p className="text-[#8B9D8E] font-body text-[10px] mt-0.5">
                        {date.toLocaleDateString("pt-BR")} as{" "}
                        {date.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {identified && (
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    )}
                    {scan.saved ? (
                      <span className="text-emerald-500" title="Salvo">
                        <Check size={16} />
                      </span>
                    ) : (
                      <span className="text-[#8B9D8E]" title="Nao salvo">
                        <X size={16} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Health bar */}
                {identified && analysis.health_score != null && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[#8B9D8E] font-body text-[10px]">
                        Saude
                      </span>
                      <span className="text-[#1C3F2A] font-body text-[10px] font-bold">
                        {analysis.health_score}%
                      </span>
                    </div>
                    <div className="w-full bg-[#EEF2EB] rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          analysis.health_score >= 70
                            ? "bg-emerald-500"
                            : analysis.health_score >= 40
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${analysis.health_score}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Diseases count */}
                {identified && analysis.diseases?.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-[#B85C38]" />
                    <span className="text-[#B85C38] font-body text-xs font-medium">
                      {analysis.diseases.length} problema
                      {analysis.diseases.length > 1 && "s"} detectado
                      {analysis.diseases.length > 1 && "s"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
