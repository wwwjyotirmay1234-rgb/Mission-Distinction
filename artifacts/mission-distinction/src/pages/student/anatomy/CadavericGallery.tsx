import { useState, useMemo } from "react";
import { X, ZoomIn, ZoomOut, Info, Tag } from "lucide-react";
import { ANATOMY_SYSTEMS } from "@/data/anatomyData";
import type { AnatomySystem } from "@/data/anatomyData";

type RegionFilter = "all" | "head" | "trunk" | "upper_limb" | "lower_limb";

const REGION_SYSTEM_IDS: Record<Exclude<RegionFilter, "all">, string[]> = {
  head:       ["skeletal", "nervous", "lymphatic", "sensory"],
  trunk:      ["skeletal", "cardiovascular", "nervous", "respiratory", "digestive", "urinary", "reproductive", "lymphatic", "endocrine"],
  upper_limb: ["skeletal", "muscular"],
  lower_limb: ["skeletal", "muscular"],
};

const REGION_LABELS: Record<RegionFilter, string> = {
  all:        "All Regions",
  head:       "Head & Neck",
  trunk:      "Trunk",
  upper_limb: "Upper Limb",
  lower_limb: "Lower Limb",
};

const REGION_ACCENT: Record<RegionFilter, string> = {
  all:        "#7c3aed",
  head:       "#3b82f6",
  trunk:      "#14b8a6",
  upper_limb: "#8b5cf6",
  lower_limb: "#f59e0b",
};

const SYSTEM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  cardiovascular: { bg: "rgba(239,68,68,0.12)",  text: "#f87171", border: "rgba(239,68,68,0.3)" },
  skeletal:       { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", border: "rgba(245,158,11,0.3)" },
  nervous:        { bg: "rgba(168,85,247,0.12)", text: "#c084fc", border: "rgba(168,85,247,0.3)" },
  respiratory:    { bg: "rgba(6,182,212,0.12)",  text: "#22d3ee", border: "rgba(6,182,212,0.3)" },
  muscular:       { bg: "rgba(249,115,22,0.12)", text: "#fb923c", border: "rgba(249,115,22,0.3)" },
  digestive:      { bg: "rgba(34,197,94,0.12)",  text: "#4ade80", border: "rgba(34,197,94,0.3)" },
  endocrine:      { bg: "rgba(234,179,8,0.12)",  text: "#facc15", border: "rgba(234,179,8,0.3)" },
  urinary:        { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.3)" },
  lymphatic:      { bg: "rgba(16,185,129,0.12)", text: "#34d399", border: "rgba(16,185,129,0.3)" },
  reproductive:   { bg: "rgba(236,72,153,0.12)", text: "#f472b6", border: "rgba(236,72,153,0.3)" },
  sensory:        { bg: "rgba(20,184,166,0.12)", text: "#2dd4bf", border: "rgba(20,184,166,0.3)" },
};

function getColor(id: string) {
  return SYSTEM_COLORS[id] ?? SYSTEM_COLORS.skeletal;
}

// ─── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({ system, onClose }: { system: AnatomySystem; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"labels" | "info">("labels");
  const c = getColor(system.id);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0" style={{ background: "rgba(0,0,0,0.6)" }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{system.icon}</span>
          <div>
            <p className="text-sm font-bold text-white">{system.cadavericTitle}</p>
            <p className="text-xs" style={{ color: c.text }}>{system.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <ZoomIn size={16} />
          </button>
          <button onClick={onClose} className="p-2 ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative">
        <div style={{ transform: `scale(${zoom})`, transition: "transform 0.2s ease", transformOrigin: "center center", position: "relative", display: "inline-block" }}>
          <img
            src={system.cadavericImageUrl}
            alt={system.cadavericTitle}
            className="max-w-[80vw] max-h-[60vh] object-contain rounded-xl"
            style={{ background: "#111827" }}
          />
          {/* Annotation pins */}
          {system.cadavericAnnotations.map((ann, i) => (
            <button
              key={i}
              style={{ position: "absolute", left: `${ann.x}%`, top: `${ann.y}%`, transform: "translate(-50%,-50%)", zIndex: 10 }}
              onMouseEnter={() => setHoveredPin(ann.label)}
              onMouseLeave={() => setHoveredPin(null)}
              onFocus={() => setHoveredPin(ann.label)}
              onBlur={() => setHoveredPin(null)}
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-violet-400 bg-violet-600/80 text-white text-[9px] font-bold shadow-lg shadow-violet-900/40 transition-transform hover:scale-125">
                {i + 1}
              </span>
              {hoveredPin === ann.label && (
                <span className="absolute z-20 left-6 -top-1 bg-slate-900 text-violet-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-violet-700/40 whitespace-nowrap shadow-xl pointer-events-none">
                  {ann.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom panel */}
      <div className="shrink-0 border-t border-white/8" style={{ background: "rgba(0,0,0,0.7)", maxHeight: 220 }}>
        {/* Tabs */}
        <div className="flex border-b border-white/6">
          <button
            onClick={() => setActiveTab("labels")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${activeTab === "labels" ? "border-violet-400 text-violet-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}
          >
            <Tag size={12} /> Labels
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${activeTab === "info" ? "border-violet-400 text-violet-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}
          >
            <Info size={12} /> Description
          </button>
        </div>

        <div className="p-4 overflow-y-auto" style={{ maxHeight: 160, scrollbarWidth: "thin", scrollbarColor: "#3b0764 transparent" }}>
          {activeTab === "labels" && (
            <div className="flex flex-wrap gap-2">
              {system.cadavericAnnotations.map((ann, i) => (
                <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs">
                  <span className="w-4 h-4 rounded-full bg-violet-600/70 border border-violet-400 text-[8px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  {ann.label}
                </span>
              ))}
            </div>
          )}
          {activeTab === "info" && (
            <p className="text-sm text-slate-300 leading-relaxed">{system.cadavericDescription}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Gallery card ─────────────────────────────────────────────────────────────
function GalleryCard({ system, onClick }: { system: AnatomySystem; onClick: () => void }) {
  const c = getColor(system.id);
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-xl border text-left transition-all active:scale-95 hover:brightness-110"
      style={{ background: "#111827", borderColor: c.border }}
    >
      {/* Image area */}
      <div className="relative overflow-hidden flex items-center justify-center" style={{ height: 160, background: "#0d1117" }}>
        {!imgError ? (
          <img
            src={system.cadavericImageUrl}
            alt={system.cadavericTitle}
            className="object-contain w-full h-full p-2"
            style={{ maxHeight: 160 }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-5xl select-none">{system.icon}</span>
        )}
        {/* Annotation count badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: c.text, opacity: 0.8 }} />
          {system.cadavericAnnotations.length} labels
        </div>
        {/* Hover zoom hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
          <ZoomIn size={24} className="text-white opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5" style={{ borderTop: `1px solid ${c.border}`, background: "#0d111a" }}>
        <p className="text-xs font-bold text-white truncate">{system.cadavericTitle}</p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: c.text }}>{system.name}</p>
      </div>
    </button>
  );
}

// ─── Main gallery ─────────────────────────────────────────────────────────────
export default function CadavericGallery() {
  const [region, setRegion] = useState<RegionFilter>("all");
  const [lightbox, setLightbox] = useState<AnatomySystem | null>(null);

  const systems = useMemo(() => {
    const withImages = ANATOMY_SYSTEMS.filter(s => s.cadavericImageUrl);
    if (region === "all") return withImages;
    return withImages.filter(s => REGION_SYSTEM_IDS[region].includes(s.id));
  }, [region]);

  const filters: RegionFilter[] = ["all", "head", "trunk", "upper_limb", "lower_limb"];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Region filter pills */}
      <div className="px-4 py-3 border-b border-white/8 shrink-0 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none", background: "rgba(0,0,0,0.2)" }}>
        {filters.map(f => {
          const active = region === f;
          const accent = REGION_ACCENT[f];
          return (
            <button
              key={f}
              onClick={() => setRegion(f)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border"
              style={active
                ? { background: `${accent}25`, borderColor: accent, color: accent }
                : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "#6b7280" }
              }
            >
              {REGION_LABELS[f]}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <p className="text-[11px] text-slate-500">{systems.length} dissection{systems.length !== 1 ? "s" : ""} · tap to view with labels</p>
      </div>

      {/* Grid */}
      <div
        className="flex-1 overflow-y-auto px-4 pb-6"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#3b0764 transparent" }}
      >
        {systems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <span className="text-5xl">🔬</span>
            <p className="text-slate-400 font-semibold">No cadaveric images for this region yet</p>
            <p className="text-slate-600 text-sm">More being added — check back soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
            {systems.map(s => (
              <GalleryCard key={s.id} system={s} onClick={() => setLightbox(s)} />
            ))}
          </div>
        )}
      </div>

      {lightbox && <Lightbox system={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
