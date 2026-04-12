import { useState, useRef, useCallback } from "react";
import {
  Camera,
  Upload,
  Loader2,
  Leaf,
  Heart,
  AlertTriangle,
  Droplets,
  Sun,
  Thermometer,
  Sprout,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const resizeImage = (file, maxSize = 1024) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

function CareItem({ icon: Icon, label, color, tip }) {
  if (!tip) return null;
  const detail =
    tip.frequency || tip.type || tip.range || "";
  return (
    <div className="bg-[#F9F8F6] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className={color} />
        <span className="font-body font-semibold text-[#1C3F2A] text-sm">
          {label}
        </span>
      </div>
      <p className="text-[#4A5D4E] font-body text-xs leading-relaxed">
        {detail}
        {tip.tips ? ` — ${tip.tips}` : ""}
      </p>
    </div>
  );
}

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [showCare, setShowCare] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError(null);
    setResult(null);
    setSaved(false);
    setShowCare(false);

    try {
      const base64 = await resizeImage(file);
      setImagePreview(base64);
      setScanning(true);

      const response = await axios.post(`${API}/scan`, {
        image_base64: base64,
      });
      setResult(response.data);
    } catch (err) {
      setError("Erro ao analisar a imagem. Tente novamente.");
    } finally {
      setScanning(false);
    }
  }, []);

  const handleSave = async () => {
    if (!result?.id) return;
    setSaving(true);
    try {
      await axios.post(`${API}/plants`, { scan_id: result.id });
      setSaved(true);
    } catch (err) {
      setError("Erro ao salvar a planta.");
    } finally {
      setSaving(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    setImagePreview(null);
    setSaved(false);
    setError(null);
    setShowCare(false);
  };

  const analysis = result?.analysis;

  const healthColor = {
    healthy: "text-emerald-600 bg-emerald-50 border-emerald-200",
    needs_attention: "text-amber-600 bg-amber-50 border-amber-200",
    critical: "text-red-600 bg-red-50 border-red-200",
  };

  const healthLabel = {
    healthy: "Saudavel",
    needs_attention: "Precisa de Atencao",
    critical: "Estado Critico",
  };

  return (
    <div className="pb-24 min-h-screen bg-[#F9F8F6]" data-testid="scanner-page">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <h1 className="font-heading text-4xl text-[#1C3F2A] tracking-tight">
          PlantaScan
        </h1>
        <p className="text-[#4A5D4E] mt-1 font-body">
          Identifique e cuide das suas plantas
        </p>
      </div>

      {!imagePreview ? (
        <div className="px-6">
          {/* Empty State */}
          <div className="relative bg-white rounded-3xl border border-[#E5EBE5] overflow-hidden shadow-sm">
            <div className="aspect-[4/3] flex flex-col items-center justify-center p-8">
              <img
                src="https://static.prod-images.emergentagent.com/jobs/dffe6d62-58d4-4fa8-96ff-221942317b91/images/4a5858344b90fe7ac0aaeb73253b92b68104fb018c368b786dabd1dddace4d67.png"
                alt="PlantaScan"
                className="w-36 h-36 object-contain mb-6 opacity-80"
                data-testid="scanner-hero-image"
              />
              <p className="text-[#4A5D4E] text-center font-body text-lg font-medium mb-1">
                Tire uma foto ou envie uma imagem
              </p>
              <p className="text-[#8B9D8E] text-center font-body text-sm">
                A IA vai identificar e diagnosticar sua planta
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 bg-[#1C3F2A] text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 font-body font-semibold shadow-lg active:scale-95 transition-transform"
              data-testid="scan-camera-button"
            >
              <Camera size={22} />
              Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-white text-[#1C3F2A] border-2 border-[#1C3F2A] rounded-2xl py-4 px-6 flex items-center justify-center gap-3 font-body font-semibold active:scale-95 transition-transform"
              data-testid="scan-upload-button"
            >
              <Upload size={22} />
              Galeria
            </button>
          </div>
        </div>
      ) : (
        <div className="px-6">
          {/* Image Preview */}
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-[#E5EBE5]">
            <img
              src={imagePreview}
              alt="Planta"
              className="w-full aspect-[4/3] object-cover"
              data-testid="scan-image-preview"
            />
            <button
              onClick={resetScan}
              className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 backdrop-blur-sm"
              data-testid="scan-reset-button"
            >
              <X size={20} />
            </button>
            {scanning && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="scan-line" />
                <Loader2
                  className="animate-spin text-white mb-4"
                  size={48}
                />
                <p className="text-white font-body font-semibold text-lg">
                  Analisando...
                </p>
                <p className="text-white/70 font-body text-sm mt-1">
                  Identificando especie e saude
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
              <AlertTriangle className="text-red-500 shrink-0" size={20} />
              <p className="text-red-700 font-body text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {analysis && analysis.identified !== false && (
            <div className="mt-6 space-y-4 animate-slide-up">
              {/* Plant Identity */}
              <div className="bg-white rounded-3xl border border-[#E5EBE5] p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-heading text-2xl text-[#1C3F2A] leading-tight">
                      {analysis.plant_name}
                    </h2>
                    <p className="text-[#8B9D8E] font-body text-sm italic truncate">
                      {analysis.scientific_name}
                    </p>
                    {analysis.family && (
                      <p className="text-[#8B9D8E] font-body text-xs mt-0.5">
                        Familia: {analysis.family}
                      </p>
                    )}
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${
                      healthColor[analysis.health_status] ||
                      healthColor.healthy
                    }`}
                    data-testid="health-status-badge"
                  >
                    {healthLabel[analysis.health_status] || "Saudavel"}
                  </div>
                </div>

                {analysis.description && (
                  <p className="text-[#4A5D4E] font-body text-sm mt-4 leading-relaxed">
                    {analysis.description}
                  </p>
                )}

                {/* Health Score */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#4A5D4E] font-body text-sm font-medium">
                      Saude
                    </span>
                    <span className="text-[#1C3F2A] font-body text-sm font-bold">
                      {analysis.health_score}%
                    </span>
                  </div>
                  <div className="w-full bg-[#EEF2EB] rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-1000 ${
                        analysis.health_score >= 70
                          ? "bg-emerald-500"
                          : analysis.health_score >= 40
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${analysis.health_score}%` }}
                      data-testid="health-score-bar"
                    />
                  </div>
                </div>
              </div>

              {/* Diseases */}
              {analysis.diseases?.length > 0 && (
                <div className="bg-white rounded-3xl border border-[#E5EBE5] p-6 shadow-sm">
                  <h3 className="font-heading text-lg text-[#1C3F2A] mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-[#B85C38]" />
                    Problemas Detectados
                  </h3>
                  <div className="space-y-3">
                    {analysis.diseases.map((disease, i) => (
                      <div
                        key={i}
                        className="bg-[#FFF8F5] rounded-2xl p-4 border border-[#F5E6DE]"
                        data-testid={`disease-item-${i}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-body font-semibold text-[#1C3F2A] text-sm">
                            {disease.name}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              disease.severity === "high"
                                ? "bg-red-100 text-red-700"
                                : disease.severity === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {disease.severity === "high"
                              ? "Alta"
                              : disease.severity === "medium"
                              ? "Media"
                              : "Baixa"}
                          </span>
                        </div>
                        <p className="text-[#4A5D4E] font-body text-xs">
                          {disease.description}
                        </p>
                        {disease.treatment && (
                          <p className="text-[#1C3F2A] font-body text-xs mt-2 font-medium">
                            Tratamento: {disease.treatment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Care Tips */}
              {analysis.care_tips && (
                <div className="bg-white rounded-3xl border border-[#E5EBE5] shadow-sm overflow-hidden">
                  <button
                    onClick={() => setShowCare(!showCare)}
                    className="w-full p-6 flex items-center justify-between"
                    data-testid="care-tips-toggle"
                  >
                    <h3 className="font-heading text-lg text-[#1C3F2A] flex items-center gap-2">
                      <Sparkles size={18} className="text-[#8FA290]" />
                      Dicas de Cuidados
                    </h3>
                    {showCare ? (
                      <ChevronUp size={20} className="text-[#8B9D8E]" />
                    ) : (
                      <ChevronDown size={20} className="text-[#8B9D8E]" />
                    )}
                  </button>
                  {showCare && (
                    <div className="px-6 pb-6 space-y-3 animate-slide-up">
                      <CareItem
                        icon={Droplets}
                        label="Rega"
                        color="text-blue-500"
                        tip={analysis.care_tips.water}
                      />
                      <CareItem
                        icon={Sun}
                        label="Luz"
                        color="text-amber-500"
                        tip={analysis.care_tips.light}
                      />
                      <CareItem
                        icon={Thermometer}
                        label="Temperatura"
                        color="text-red-400"
                        tip={analysis.care_tips.temperature}
                      />
                      <CareItem
                        icon={Sprout}
                        label="Solo"
                        color="text-emerald-600"
                        tip={analysis.care_tips.soil}
                      />
                      <CareItem
                        icon={Leaf}
                        label="Adubo"
                        color="text-green-600"
                        tip={analysis.care_tips.fertilizer}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Curiosities */}
              {analysis.curiosities?.length > 0 && (
                <div className="bg-[#EEF2EB] rounded-3xl p-6">
                  <h3 className="font-heading text-lg text-[#1C3F2A] mb-3">
                    Curiosidades
                  </h3>
                  <ul className="space-y-2">
                    {analysis.curiosities.map((c, i) => (
                      <li
                        key={i}
                        className="text-[#4A5D4E] font-body text-sm flex items-start gap-2"
                      >
                        <span className="text-[#B85C38] mt-0.5 shrink-0">
                          *
                        </span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Save Button */}
              {!saved ? (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-[#1C3F2A] text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-body font-semibold shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                  data-testid="save-plant-button"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Save size={20} />
                  )}
                  {saving ? "Salvando..." : "Salvar em Minhas Plantas"}
                </button>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-center gap-3">
                  <Heart className="text-emerald-600" size={20} />
                  <span className="text-emerald-700 font-body font-semibold">
                    Planta salva com sucesso!
                  </span>
                </div>
              )}

              <button
                onClick={resetScan}
                className="w-full bg-white text-[#1C3F2A] border-2 border-[#E5EBE5] rounded-2xl py-4 flex items-center justify-center gap-3 font-body font-medium active:scale-95 transition-transform"
                data-testid="new-scan-button"
              >
                <Camera size={20} />
                Escanear Outra Planta
              </button>
            </div>
          )}

          {/* Not identified */}
          {analysis && analysis.identified === false && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-3xl p-6 animate-slide-up">
              <h3 className="font-heading text-lg text-amber-800 mb-2">
                Nao foi possivel identificar
              </h3>
              <p className="text-amber-700 font-body text-sm">
                {analysis.error ||
                  "Tente tirar uma foto mais proxima e com boa iluminacao."}
              </p>
              <button
                onClick={resetScan}
                className="mt-4 bg-amber-600 text-white rounded-2xl py-3 px-6 font-body font-semibold active:scale-95 transition-transform"
                data-testid="retry-scan-button"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
        data-testid="camera-input"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
        data-testid="gallery-input"
      />
    </div>
  );
}
