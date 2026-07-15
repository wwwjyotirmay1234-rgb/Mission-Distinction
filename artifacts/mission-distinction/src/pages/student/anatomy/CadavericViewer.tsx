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
    <div className="flex flex-col h-full bg-card rounded-xl overflow-hidden border border-border/40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/20">
        <div>
          <p className="text-sm font-semibold text-foreground">{system.cadavericTitle}</p>
          <p className="text-xs text-muted-foreground">{system.cadavericSide}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            {expanded ? <X size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Image area — intentionally dark background for cadaveric specimen viewing */}
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
                className="block rounded-full border-2 border-primary bg-primary/70 shadow-lg transition-all"
                style={{ width: 10, height: 10 }}
              />
              {hoveredLabel === ann.label && (
                <span className="absolute z-10 left-3 -top-1 bg-card text-primary text-[10px] font-semibold px-2 py-0.5 rounded border border-border whitespace-nowrap shadow-xl pointer-events-none">
                  {ann.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-border/40">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
              activeTab === t.id
                ? "text-primary border-t-2 border-primary -mt-px bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
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
                className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-primary text-[10px]"
              >
                {ann.label}
              </span>
            ))}
          </div>
        )}
        {activeTab === "info" && (
          <p className="text-foreground leading-relaxed">{system.cadavericDescription}</p>
        )}
        {activeTab === "notes" && (
          <div className="space-y-2">
            <p className="text-foreground leading-relaxed">
              Cadaveric specimens are fixed in formalin (10% formaldehyde) for preservation. 
              Structures appear paler and firmer than in vivo. Arterial walls appear whitish; 
              venous walls are thin and collapse easily.
            </p>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-700 dark:text-amber-300 font-medium mb-1">📌 Clinical Correlation</p>
              <p className="text-muted-foreground">
                {system.structures[0]?.clinicalPoints[0] ?? "Study the cadaveric dissection alongside clinical imaging for best retention."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
