import { useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, Info, FileText, Tag, X } from "lucide-react";
import type { AnatomySystem } from "@/data/anatomyData";

export default function CadavericViewer({ system }: { system: AnatomySystem }) {
  const [activeTab, setActiveTab] = useState<"labels" | "info" | "notes">("labels");
  const [zoom, setZoom] = useState(1);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const tabs = [
    { id: "labels", label: "Labels", icon: Tag },
    { id: "info",   label: "Info",   icon: Info },
    { id: "notes",  label: "Notes",  icon: FileText },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-xl overflow-hidden border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.03]">
        <div>
          <p className="text-sm font-semibold text-white">{system.cadavericTitle}</p>
          <p className="text-xs text-slate-400">{system.cadavericSide}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors ml-1"
          >
            {expanded ? <X size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="relative flex-1 overflow-hidden bg-slate-950 flex items-center justify-center min-h-[220px]">
        <div
          style={{ transform: `scale(${zoom})`, transition: "transform 0.25s ease", transformOrigin: "center center", maxWidth: "100%", maxHeight: "100%" }}
          className="relative"
        >
          <img
            src={system.cadavericImageUrl}
            alt={system.cadavericTitle}
            className="object-contain rounded"
            style={{ maxHeight: 260, maxWidth: "100%" }}
            onError={e => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* Annotation pins */}
          {activeTab === "labels" && system.cadavericAnnotations.map((ann, i) => (
            <button
              key={i}
              style={{ position: "absolute", left: `${ann.x}%`, top: `${ann.y}%`, transform: "translate(-50%,-50%)" }}
              className="group"
              onMouseEnter={() => setHoveredLabel(ann.label)}
              onMouseLeave={() => setHoveredLabel(null)}
            >
              <span
                className="block rounded-full border-2 border-violet-400 bg-violet-600/70 shadow-lg shadow-violet-900/30 transition-all"
                style={{ width: 10, height: 10 }}
              />
              {hoveredLabel === ann.label && (
                <span className="absolute z-10 left-3 -top-1 bg-slate-900 text-violet-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-violet-700/40 whitespace-nowrap shadow-xl pointer-events-none">
                  {ann.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-white/5">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
              activeTab === t.id
                ? "text-violet-400 border-t-2 border-violet-400 -mt-px bg-violet-500/5"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 text-xs space-y-2 max-h-32 overflow-y-auto">
        {activeTab === "labels" && (
          <div className="flex flex-wrap gap-1.5">
            {system.cadavericAnnotations.map((ann, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-[10px]"
              >
                {ann.label}
              </span>
            ))}
          </div>
        )}
        {activeTab === "info" && (
          <p className="text-slate-300 leading-relaxed">{system.cadavericDescription}</p>
        )}
        {activeTab === "notes" && (
          <div className="space-y-2">
            <p className="text-slate-300 leading-relaxed">
              Cadaveric specimens are fixed in formalin (10% formaldehyde) for preservation. 
              Structures appear paler and firmer than in vivo. Arterial walls appear whitish; 
              venous walls are thin and collapse easily.
            </p>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-300 font-medium mb-1">📌 Clinical Correlation</p>
              <p className="text-slate-400">
                {system.structures[0]?.clinicalPoints[0] ?? "Study the cadaveric dissection alongside clinical imaging for best retention."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
