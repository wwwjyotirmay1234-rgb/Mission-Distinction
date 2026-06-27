import React, { useState, useMemo, useRef } from "react";
import ModelViewer3D from "./anatomy/ModelViewer3D";
import CadavericViewer from "./anatomy/CadavericViewer";
import CrossSectionViewer from "./anatomy/CrossSectionViewer";
import AnatomyQuizPanel from "./anatomy/AnatomyQuizPanel";
import {
  ANATOMY_SYSTEMS,
  searchStructures,
  type AnatomySystem,
  type AnatomyStructure,
  type StructureLabel,
} from "@/data/anatomyData";
import { ChevronDown, ChevronUp, X, Search, ArrowLeft, List, BookOpen } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// System brand colours
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  cardiovascular: { bg: "rgba(239,68,68,0.12)",  text: "#f87171", border: "rgba(239,68,68,0.3)",  glow: "rgba(239,68,68,0.4)" },
  skeletal:       { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", border: "rgba(245,158,11,0.3)", glow: "rgba(245,158,11,0.4)" },
  nervous:        { bg: "rgba(168,85,247,0.12)", text: "#c084fc", border: "rgba(168,85,247,0.3)", glow: "rgba(168,85,247,0.4)" },
  respiratory:    { bg: "rgba(6,182,212,0.12)",  text: "#22d3ee", border: "rgba(6,182,212,0.3)",  glow: "rgba(6,182,212,0.4)" },
  muscular:       { bg: "rgba(249,115,22,0.12)", text: "#fb923c", border: "rgba(249,115,22,0.3)", glow: "rgba(249,115,22,0.4)" },
  digestive:      { bg: "rgba(34,197,94,0.12)",  text: "#4ade80", border: "rgba(34,197,94,0.3)",  glow: "rgba(34,197,94,0.4)" },
  endocrine:      { bg: "rgba(234,179,8,0.12)",  text: "#facc15", border: "rgba(234,179,8,0.3)",  glow: "rgba(234,179,8,0.4)" },
  urinary:        { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.3)", glow: "rgba(59,130,246,0.4)" },
  lymphatic:      { bg: "rgba(16,185,129,0.12)", text: "#34d399", border: "rgba(16,185,129,0.3)", glow: "rgba(16,185,129,0.4)" },
  reproductive:   { bg: "rgba(236,72,153,0.12)", text: "#f472b6", border: "rgba(236,72,153,0.3)", glow: "rgba(236,72,153,0.4)" },
};

const INFO_TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "labels",       label: "Labels",    icon: "⬡" },
  { id: "clinical",     label: "Clinical",  icon: "🏥" },
  { id: "quiz",         label: "Quiz",      icon: "✍️" },
  { id: "relations",    label: "Relations", icon: "🔗" },
  { id: "mnemonics",    label: "Mnemonics", icon: "💡" },
  { id: "cadaveric",    label: "Cadaveric", icon: "🔬" },
  { id: "crosssection", label: "CT/MRI",   icon: "📡" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type TabId = "labels" | "cadaveric" | "crosssection" | "clinical" | "quiz" | "relations" | "mnemonics";
type HubPage = "landing" | "system";
type SheetState = "closed" | "peek" | "full";
type RegionId = "head" | "trunk" | "upper_limb" | "lower_limb";

// ─────────────────────────────────────────────────────────────────────────────
// Region configuration
// ─────────────────────────────────────────────────────────────────────────────
const BODY_REGIONS: { id: RegionId; line1: string; line2?: string }[] = [
  { id: "head",        line1: "Head" },
  { id: "trunk",       line1: "Trunk" },
  { id: "upper_limb",  line1: "Upper", line2: "limb" },
  { id: "lower_limb",  line1: "Lower", line2: "limb" },
];

const REGION_SYSTEM_IDS: Record<RegionId, string[]> = {
  head:       ["nervous", "endocrine"],
  trunk:      ["cardiovascular", "respiratory", "digestive", "urinary", "reproductive", "lymphatic"],
  upper_limb: ["skeletal", "muscular"],
  lower_limb: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Body region SVG silhouettes
// ─────────────────────────────────────────────────────────────────────────────
function RegionIcon({ id, active }: { id: RegionId; active: boolean }) {
  const c = active ? "#ffffff" : "#6b7280";
  if (id === "head") return (
    <svg viewBox="0 0 36 44" width="30" height="36" fill="none">
      <ellipse cx="18" cy="14" rx="12" ry="13" fill={c} />
      <rect x="13" y="25" width="10" height="9" rx="3" fill={c} opacity={0.75} />
      <path d="M10 33 Q5 36 6 44 L14 44" stroke={c} strokeWidth="3" strokeLinecap="round" fill="none" opacity={0.5} />
      <path d="M26 33 Q31 36 30 44 L22 44" stroke={c} strokeWidth="3" strokeLinecap="round" fill="none" opacity={0.5} />
    </svg>
  );
  if (id === "trunk") return (
    <svg viewBox="0 0 36 44" width="30" height="36" fill="none">
      <path d="M4 6 L32 6 L35 16 L30 42 L6 42 L1 16 Z" fill={c} />
      <rect x="0" y="6" width="6" height="14" rx="3" fill={c} opacity={0.7} />
      <rect x="30" y="6" width="6" height="14" rx="3" fill={c} opacity={0.7} />
    </svg>
  );
  if (id === "upper_limb") return (
    <svg viewBox="0 0 36 44" width="30" height="36" fill="none">
      <rect x="13" y="2" width="10" height="22" rx="5" fill={c} />
      <rect x="10" y="22" width="8" height="14" rx="4" fill={c} opacity={0.85} />
      <rect x="19" y="22" width="8" height="14" rx="4" fill={c} opacity={0.85} />
      <rect x="9" y="34" width="4" height="8" rx="2" fill={c} opacity={0.6} />
      <rect x="14" y="35" width="4" height="7" rx="2" fill={c} opacity={0.6} />
      <rect x="19" y="34" width="4" height="8" rx="2" fill={c} opacity={0.6} />
      <rect x="24" y="35" width="4" height="7" rx="2" fill={c} opacity={0.6} />
    </svg>
  );
  return (
    <svg viewBox="0 0 36 44" width="30" height="36" fill="none">
      <rect x="5" y="2" width="11" height="22" rx="5.5" fill={c} />
      <rect x="20" y="2" width="11" height="22" rx="5.5" fill={c} />
      <rect x="4" y="22" width="12" height="18" rx="4" fill={c} opacity={0.85} />
      <rect x="20" y="22" width="12" height="18" rx="4" fill={c} opacity={0.85} />
      <rect x="3" y="37" width="13" height="6" rx="3" fill={c} opacity={0.65} />
      <rect x="20" y="37" width="13" height="6" rx="3" fill={c} opacity={0.65} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Model card (structure thumbnail)
// ─────────────────────────────────────────────────────────────────────────────
function ModelCard({ system, structure, onClick }: {
  system: AnatomySystem;
  structure: AnatomyStructure;
  onClick: () => void;
}) {
  const c = SYSTEM_COLORS[system.id] ?? SYSTEM_COLORS.cardiovascular;
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      className="flex-shrink-0 flex flex-col overflow-hidden rounded-2xl text-left transition-all duration-150"
      style={{
        width: 148,
        height: 186,
        background: `linear-gradient(165deg, #0d0820 0%, ${c.bg.replace("0.12", "0.35")} 100%)`,
        border: `1.5px solid ${c.border}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)`,
        transform: pressed ? "scale(0.96)" : "scale(1)",
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: `radial-gradient(circle at 50% 60%, ${c.glow} 0%, transparent 70%)` }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "12px 12px" }}
        />
        <span className="relative z-10 text-5xl leading-none select-none" style={{ filter: `drop-shadow(0 4px 16px ${c.glow})` }}>
          {system.icon}
        </span>
        <span className="relative z-10 mt-2 text-[9px] font-black uppercase tracking-[0.15em] px-2 text-center" style={{ color: c.text }}>
          {system.name.replace(" System", "")}
        </span>
      </div>
      <div
        className="px-2.5 pb-2.5 pt-2"
        style={{ borderTop: `1px solid ${c.border.replace("0.3", "0.2")}`, background: "rgba(0,0,0,0.45)" }}
      >
        <p className="text-[11px] font-black text-white leading-tight uppercase line-clamp-2">
          {structure.name}
        </p>
        <p className="text-[10px] mt-0.5 truncate" style={{ color: c.text }}>
          {structure.labels.length} labels · {structure.quiz.length} quiz
        </p>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// System section (heading + horizontal card scroll)
// ─────────────────────────────────────────────────────────────────────────────
function SystemSection({ system, onSelectStructure }: {
  system: AnatomySystem;
  onSelectStructure: (sys: AnatomySystem, struct: AnatomyStructure) => void;
}) {
  return (
    <div>
      <h2 className="text-[15px] font-bold text-white px-4 mb-3">{system.name}</h2>
      <div
        className="flex gap-3 pl-4 pr-4 overflow-x-auto"
        style={{ scrollbarWidth: "none", paddingBottom: 4 }}
      >
        {system.structures.map(struct => (
          <ModelCard
            key={struct.id}
            system={system}
            structure={struct}
            onClick={() => onSelectStructure(system, struct)}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hub landing — region selector + system cards
// ─────────────────────────────────────────────────────────────────────────────
function HubLanding({ onSelectSystem, onSelectResult, globalSearch, setGlobalSearch }: {
  onSelectSystem: (s: AnatomySystem, struct?: AnatomyStructure) => void;
  onSelectResult: (sys: AnatomySystem, struct: AnatomyStructure) => void;
  globalSearch: string;
  setGlobalSearch: (v: string) => void;
}) {
  const [selectedRegion, setSelectedRegion] = useState<RegionId>("trunk");

  const searchResults = useMemo(
    () => (globalSearch.trim().length > 1 ? searchStructures(globalSearch) : []),
    [globalSearch],
  );

  const systemsForRegion = useMemo(() => {
    const ids = REGION_SYSTEM_IDS[selectedRegion];
    return ANATOMY_SYSTEMS.filter(s => ids.includes(s.id));
  }, [selectedRegion]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Region selector row ── */}
      <div
        className="flex items-start justify-center gap-4 sm:gap-6 px-4 py-4 shrink-0 border-b border-white/8"
        style={{ background: "rgba(0,0,0,0.25)" }}
      >
        {BODY_REGIONS.map(region => {
          const active = selectedRegion === region.id && !globalSearch;
          return (
            <button
              key={region.id}
              onClick={() => { setSelectedRegion(region.id); setGlobalSearch(""); }}
              className="flex flex-col items-center gap-2 transition-all"
              style={{ minWidth: 64 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: active ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.05)",
                  border: `2px solid ${active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.1)"}`,
                  boxShadow: active ? "0 0 0 4px rgba(255,255,255,0.07), 0 4px 20px rgba(0,0,0,0.4)" : "none",
                }}
              >
                <RegionIcon id={region.id} active={active} />
              </div>
              <span
                className="text-[11px] font-bold leading-tight text-center"
                style={{ color: active ? "#ffffff" : "#6b7280" }}
              >
                {region.line1}
                {region.line2 && <><br />{region.line2}</>}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search bar ── */}
      <div className="px-4 py-2.5 border-b border-white/5 shrink-0" style={{ background: "rgba(0,0,0,0.15)" }}>
        <div className="relative max-w-lg mx-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            placeholder="Search any structure — heart, humerus, nephron…"
            className="w-full pl-8 pr-8 py-2 rounded-xl text-sm placeholder-slate-600 focus:outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div
        className="flex-1 overflow-y-auto py-5 space-y-7"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#3b0764 transparent" }}
      >
        {globalSearch ? (
          /* Search results */
          <div className="px-4">
            <p className="text-[11px] text-slate-500 mb-3">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &quot;{globalSearch}&quot;
            </p>
            {searchResults.length === 0 ? (
              <p className="text-center text-slate-600 py-10 text-sm">No structures found. Try a different term.</p>
            ) : (
              <div className="space-y-1.5">
                {searchResults.map(({ system, structure }) => {
                  const c = SYSTEM_COLORS[system.id] ?? SYSTEM_COLORS.cardiovascular;
                  return (
                    <button
                      key={`${system.id}-${structure.id}`}
                      onClick={() => onSelectResult(system, structure)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:brightness-110"
                      style={{ background: c.bg, borderColor: c.border }}
                    >
                      <span className="text-xl">{system.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white truncate">{structure.name}</div>
                        <div className="text-[11px] truncate" style={{ color: c.text }}>{system.name}</div>
                      </div>
                      <span className="text-slate-500 text-xs shrink-0">→</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : systemsForRegion.length === 0 ? (
          /* Coming soon */
          <div className="flex flex-col items-center justify-center py-24 px-8 gap-5">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <RegionIcon id={selectedRegion} active={false} />
            </div>
            <div className="text-center">
              <p className="font-bold text-white text-base mb-2">Coming Soon</p>
              <p className="text-slate-500 text-sm max-w-xs">
                3D anatomy models for the {BODY_REGIONS.find(r => r.id === selectedRegion)?.line1}{" "}
                {BODY_REGIONS.find(r => r.id === selectedRegion)?.line2} region are being added. Check back soon!
              </p>
            </div>
          </div>
        ) : (
          systemsForRegion.map(sys => (
            <SystemSection
              key={sys.id}
              system={sys}
              onSelectStructure={onSelectResult}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Info tab content panels
// ─────────────────────────────────────────────────────────────────────────────
function LabelsPanel({ structure, selectedLabel, onLabelSelect }: {
  structure: AnatomyStructure; selectedLabel: string | null; onLabelSelect: (l: StructureLabel) => void;
}) {
  const layerColors: Record<string, string> = {
    bone: "text-amber-400", muscle: "text-orange-400", vessel: "text-red-400", nerve: "text-yellow-400", organ: "text-violet-400",
  };
  if (structure.labels.length === 0) {
    return <div className="flex flex-col items-center justify-center h-32 text-slate-600 gap-2"><span className="text-3xl">⬡</span><p className="text-sm">No 3D labels for this structure.</p></div>;
  }
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-slate-500 px-0.5">Tap a label to highlight it in the 3D viewer</p>
      {structure.labels.map(label => (
        <button key={label.id} onClick={() => onLabelSelect(label)}
          className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left border transition-all ${
            selectedLabel === label.id ? "bg-violet-900/30 border-violet-500/40" : "bg-white/3 border-white/6 hover:bg-white/6"
          }`}
        >
          <span className={`text-xs mt-0.5 shrink-0 ${layerColors[label.layer ?? "organ"] ?? "text-violet-400"}`}>◆</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white leading-tight">{label.name}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{label.description}</p>
            {label.clinicalNote && selectedLabel === label.id && (
              <p className="text-[11px] text-red-300 mt-1.5 bg-red-900/15 rounded px-1.5 py-1 border border-red-500/15 leading-snug">⚕ {label.clinicalNote}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function ClinicalPanel({ structure }: { structure: AnatomyStructure }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-500/20 bg-violet-900/10 p-4">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-2">📖 Study Notes</h4>
        <p className="text-sm text-slate-300 leading-relaxed">{structure.studyNotes}</p>
      </div>
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">🏥 High-Yield Clinical Points</h4>
        <div className="space-y-1.5">
          {structure.clinicalPoints.map((pt, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/4 border border-white/6">
              <span className="text-red-400 text-xs font-black shrink-0 mt-0.5">{i + 1}.</span>
              <p className="text-sm text-slate-300 leading-snug">{pt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RelationsPanel({ structure }: { structure: AnatomyStructure }) {
  const hasContent = structure.relations?.length || structure.bloodSupply || structure.nerveSupply || structure.lymphDrainage || structure.origin;
  if (!hasContent) return <div className="flex flex-col items-center justify-center h-40 text-slate-600 gap-2"><span className="text-3xl">🔗</span><p className="text-sm">Relations data coming soon.</p></div>;
  return (
    <div className="space-y-4">
      {(structure.relations?.length ?? 0) > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">🔗 Anatomical Relations</h4>
          <div className="space-y-1.5">
            {structure.relations!.map((rel, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/4 border border-white/6">
                <span className="text-violet-400 text-xs shrink-0 mt-0.5">◆</span>
                <p className="text-sm text-slate-300">{rel}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {structure.bloodSupply && <div className="rounded-xl border border-red-500/20 bg-red-900/10 p-4"><h4 className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">🩸 Blood Supply</h4><p className="text-sm text-slate-300">{structure.bloodSupply}</p></div>}
      {structure.nerveSupply && <div className="rounded-xl border border-yellow-500/20 bg-yellow-900/10 p-4"><h4 className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 mb-2">⚡ Nerve Supply</h4><p className="text-sm text-slate-300">{structure.nerveSupply}</p></div>}
      {structure.lymphDrainage && <div className="rounded-xl border border-green-500/20 bg-green-900/10 p-4"><h4 className="text-[10px] font-bold uppercase tracking-wider text-green-400 mb-2">🫐 Lymph Drainage</h4><p className="text-sm text-slate-300">{structure.lymphDrainage}</p></div>}
      {(structure.origin || structure.insertion || structure.action) && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-900/10 p-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-3">💪 Origin / Insertion / Action</h4>
          <div className="space-y-1.5">
            {structure.origin && <p className="text-sm"><span className="text-orange-300 font-semibold">Origin: </span><span className="text-slate-300">{structure.origin}</span></p>}
            {structure.insertion && <p className="text-sm"><span className="text-orange-300 font-semibold">Insertion: </span><span className="text-slate-300">{structure.insertion}</span></p>}
            {structure.action && <p className="text-sm"><span className="text-orange-300 font-semibold">Action: </span><span className="text-slate-300">{structure.action}</span></p>}
          </div>
        </div>
      )}
    </div>
  );
}

function MnemonicsPanel({ structure }: { structure: AnatomyStructure }) {
  if (!structure.mnemonics?.length) return <div className="flex flex-col items-center justify-center h-40 text-slate-600 gap-2"><span className="text-3xl">💡</span><p className="text-sm">No mnemonics yet.</p></div>;
  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-500">High-yield exam mnemonics — commit these to memory!</p>
      {structure.mnemonics.map((m, i) => (
        <div key={i} className="rounded-xl border border-violet-500/20 bg-violet-900/15 p-4">
          <div className="flex items-start gap-3 mb-3"><span className="text-2xl shrink-0">💡</span><p className="font-black text-violet-300 text-base leading-tight">{m.mnemonic}</p></div>
          <p className="text-sm text-slate-300 leading-relaxed mb-2">{m.meaning}</p>
          {m.tip && <div className="flex items-start gap-2 bg-amber-900/20 rounded-lg p-2.5 border border-amber-500/20 mt-3"><span className="text-amber-400 text-xs shrink-0 mt-0.5">⚡ Tip:</span><p className="text-amber-200 text-xs leading-snug">{m.tip}</p></div>}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Structure info panel (shared between right panel and bottom sheet)
// ─────────────────────────────────────────────────────────────────────────────
function StructureInfoPanel({ system, structure, activeTab, setActiveTab, selectedLabel, onLabelSelect }: {
  system: AnatomySystem; structure: AnatomyStructure;
  activeTab: TabId; setActiveTab: (t: TabId) => void;
  selectedLabel: string | null; onLabelSelect: (l: StructureLabel) => void;
}) {
  const c = SYSTEM_COLORS[system.id] ?? SYSTEM_COLORS.cardiovascular;
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-3 pb-2.5 border-b border-white/6 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: c.text }}>{system.name}</p>
        <h2 className="font-black text-white text-sm leading-tight">{structure.name}</h2>
        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{structure.description.slice(0, 110)}…</p>
      </div>
      <div className="flex overflow-x-auto shrink-0 border-b border-white/6" style={{ scrollbarWidth: "none" }}>
        {INFO_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-2.5 py-2.5 text-[11px] font-bold whitespace-nowrap shrink-0 border-b-2 transition-colors ${
              activeTab === tab.id ? "border-violet-500 text-violet-300" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className="text-[13px] leading-none">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin", scrollbarColor: "#3b0764 transparent" }}>
        {activeTab === "labels"       && <LabelsPanel structure={structure} selectedLabel={selectedLabel} onLabelSelect={onLabelSelect} />}
        {activeTab === "clinical"     && <ClinicalPanel structure={structure} />}
        {activeTab === "quiz"         && <AnatomyQuizPanel questions={structure.quiz} title={structure.name} />}
        {activeTab === "relations"    && <RelationsPanel structure={structure} />}
        {activeTab === "mnemonics"    && <MnemonicsPanel structure={structure} />}
        {activeTab === "cadaveric"    && <CadavericViewer system={system} />}
        {activeTab === "crosssection" && <CrossSectionViewer system={system} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// System View — full-screen 3D + professional controls
// ─────────────────────────────────────────────────────────────────────────────
function SystemView({ system, onBack, initialStructure }: {
  system: AnatomySystem; onBack: () => void; initialStructure?: AnatomyStructure | null;
}) {
  const [selectedStructure, setSelectedStructure] = useState<AnatomyStructure>(initialStructure ?? system.structures[0]);
  const [activeTab, setActiveTab] = useState<TabId>("labels");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [sheetState, setSheetState] = useState<SheetState>("peek");
  const [showSearch, setShowSearch] = useState(false);
  const [structSearch, setStructSearch] = useState("");
  const [showStructList, setShowStructList] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  const c = SYSTEM_COLORS[system.id] ?? SYSTEM_COLORS.cardiovascular;

  const filtered = useMemo(
    () => system.structures.filter(s => s.name.toLowerCase().includes(structSearch.toLowerCase()) || s.description.toLowerCase().includes(structSearch.toLowerCase())),
    [system.structures, structSearch],
  );

  function handleLabelSelect(label: StructureLabel) {
    setSelectedLabel(prev => prev === label.id ? null : label.id);
    setActiveTab("labels");
    setSheetState(prev => prev === "closed" ? "peek" : prev);
  }

  function handleStructureSelect(s: AnatomyStructure) {
    setSelectedStructure(s);
    setSelectedLabel(null);
    setActiveTab("labels");
    setShowStructList(false);
    setStructSearch("");
    setSheetState(prev => prev === "closed" ? "peek" : prev);
    setTimeout(() => {
      const btn = document.getElementById(`struct-btn-${s.id}`);
      btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, 50);
  }

  function handleSheetOpen(tab?: TabId) {
    if (tab) setActiveTab(tab);
    setSheetState(prev => prev === "closed" ? "peek" : "full");
  }

  const sheetHeight = sheetState === "full" ? "72vh" : sheetState === "peek" ? "260px" : "0px";

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">

      {/* ─── Top bar ─── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-black/40 backdrop-blur-md shrink-0 z-10">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm group shrink-0"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline text-xs font-medium">Regions</span>
        </button>
        <span className="text-slate-700">/</span>
        <span className="text-lg shrink-0">{system.icon}</span>
        <span className="font-bold text-sm truncate" style={{ color: c.text }}>{system.name}</span>
        <span className="text-[10px] text-slate-600 hidden sm:inline">·</span>
        <span className="text-[10px] text-slate-600 hidden sm:inline truncate">{selectedStructure.name}</span>

        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => setShowSearch(p => !p)}
            className={`p-2 rounded-xl transition-colors ${showSearch ? "bg-violet-700/40 text-violet-300" : "text-slate-500 hover:bg-white/8 hover:text-white"}`}
          >
            <Search size={14} />
          </button>
          <button onClick={() => setShowStructList(p => !p)}
            className={`p-2 rounded-xl transition-colors ${showStructList ? "bg-violet-700/40 text-violet-300" : "text-slate-500 hover:bg-white/8 hover:text-white"}`}
          >
            <List size={14} />
          </button>
          <button
            onClick={() => handleSheetOpen("clinical")}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-white/8 hover:text-white transition-colors"
          >
            <BookOpen size={14} />
          </button>
        </div>
      </div>

      {/* ─── Search bar ─── */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-white/6 bg-black/30 shrink-0 z-10">
          <div className="relative max-w-md mx-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input autoFocus value={structSearch} onChange={e => setStructSearch(e.target.value)}
              placeholder={`Search structures in ${system.name}…`}
              className="w-full pl-8 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] placeholder-slate-600 focus:outline-none focus:border-violet-500/60"
            />
            {structSearch && <button onClick={() => setStructSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"><X size={12} /></button>}
          </div>
          {structSearch && (
            <div className="max-w-md mx-auto mt-1.5 space-y-1 max-h-40 overflow-y-auto">
              {filtered.map(s => (
                <button key={s.id} onClick={() => { handleStructureSelect(s); setShowSearch(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left bg-white/4 border border-white/6 hover:bg-white/8 transition-colors"
                >
                  <span className="text-base">{system.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-500">{s.labels.length} labels · {s.quiz.length} questions</p>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <p className="text-[11px] text-slate-600 text-center py-3">No match</p>}
            </div>
          )}
        </div>
      )}

      {/* ─── Structures dropdown ─── */}
      {showStructList && (
        <div className="absolute top-14 right-3 z-30 w-64 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/12 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{system.name} Structures</span>
            <button onClick={() => setShowStructList(false)} className="text-slate-600 hover:text-white p-0.5"><X size={12} /></button>
          </div>
          <div className="max-h-72 overflow-y-auto py-1.5" style={{ scrollbarWidth: "thin" }}>
            {system.structures.map(s => (
              <button key={s.id} onClick={() => handleStructureSelect(s)}
                className={`w-full flex items-start gap-2.5 px-4 py-2.5 text-left transition-colors border-l-2 ${
                  selectedStructure.id === s.id ? "bg-violet-900/25 border-l-violet-500 text-white" : "border-l-transparent text-slate-400 hover:bg-white/4 hover:text-white"
                }`}
              >
                <span className="text-sm shrink-0 mt-0.5">{system.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate leading-tight">{s.name}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{s.labels.length} labels</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Main content row ─── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">

        <div className="flex-1 min-w-0 relative">
          <ModelViewer3D
            system={system}
            selectedLabel={selectedLabel}
            onLabelSelect={handleLabelSelect}
          />

          {selectedLabel && (() => {
            const allLabels = system.structures.flatMap(s => s.labels);
            const lbl = allLabels.find(l => l.id === selectedLabel);
            return lbl ? (
              <div className="absolute top-3 left-3 z-20 max-w-[calc(100%-1.5rem)] pointer-events-none">
                <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-violet-500/40 shadow-xl">
                  <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0 shadow-[0_0_6px_#7c3aed]" />
                  <span className="text-[11px] font-bold text-violet-200 truncate">{lbl.name}</span>
                </div>
              </div>
            ) : null;
          })()}

          <button
            onClick={() => handleSheetOpen()}
            className="absolute bottom-16 right-3 md:hidden bg-violet-600 hover:bg-violet-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-xl shadow-violet-900/40 border border-violet-400/30 transition-colors z-10"
          >
            <BookOpen size={18} />
          </button>
        </div>

        {/* ─── Desktop right panel ─── */}
        <aside className="w-72 xl:w-[300px] shrink-0 hidden md:flex flex-col border-l border-white/8 bg-black/25 overflow-hidden">
          <StructureInfoPanel
            system={system}
            structure={selectedStructure}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedLabel={selectedLabel}
            onLabelSelect={handleLabelSelect}
          />
        </aside>
      </div>

      {/* ─── Bottom structure strip ─── */}
      <div
        ref={stripRef}
        className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto border-t border-white/8 bg-black/40 backdrop-blur-md shrink-0"
        style={{ scrollbarWidth: "none", minHeight: 54 }}
      >
        {system.structures.map(s => (
          <button
            id={`struct-btn-${s.id}`}
            key={s.id}
            onClick={() => handleStructureSelect(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-all ${
              selectedStructure.id === s.id
                ? "text-white border-violet-500/50 shadow-lg"
                : "text-slate-500 border-white/8 hover:text-slate-200 hover:border-white/20 hover:bg-white/5"
            }`}
            style={selectedStructure.id === s.id ? { background: c.bg, borderColor: c.border, color: c.text } : {}}
          >
            <span className="text-sm leading-none">{system.icon}</span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* ─── Mobile bottom sheet ─── */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-40 flex flex-col"
        style={{
          height: sheetHeight,
          transition: "height 0.3s cubic-bezier(0.4,0,0.2,1)",
          background: "rgba(8,5,24,0.97)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        }}
      >
        {sheetState !== "closed" && (
          <>
            <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
              <button onClick={() => setSheetState(prev => prev === "full" ? "peek" : "full")}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </button>
              <button onClick={() => setSheetState("closed")} className="text-slate-600 hover:text-white p-1 rounded-lg hover:bg-white/8 transition-colors ml-2">
                <X size={14} />
              </button>
            </div>
            <div className="shrink-0">
              <button
                onClick={() => setSheetState(prev => prev === "full" ? "peek" : "full")}
                className="w-full flex items-center justify-center gap-1.5 text-[10px] text-slate-600 hover:text-slate-400 pb-1 transition-colors"
              >
                {sheetState === "full" ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                <span>{sheetState === "full" ? "Collapse" : "Expand"}</span>
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <StructureInfoPanel
                system={system}
                structure={selectedStructure}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                selectedLabel={selectedLabel}
                onLabelSelect={handleLabelSelect}
              />
            </div>
          </>
        )}
      </div>

      {sheetState !== "closed" && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" onClick={() => setSheetState("closed")} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
export default function AnatomyHub() {
  const [page, setPage] = useState<HubPage>("landing");
  const [selectedSystem, setSelectedSystem] = useState<AnatomySystem | null>(null);
  const [initialStructure, setInitialStructure] = useState<AnatomyStructure | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");

  function handleSelectSystem(s: AnatomySystem, structure?: AnatomyStructure) {
    setSelectedSystem(s); setInitialStructure(structure ?? null); setPage("system"); setGlobalSearch("");
  }
  function handleBack() {
    setPage("landing"); setSelectedSystem(null); setInitialStructure(null);
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: "linear-gradient(135deg,#060414 0%,#0a0520 50%,#060318 100%)" }}>
      <nav className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-black/50 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-white select-none" style={{ background: "linear-gradient(135deg,#7c3aed,#a21caf)" }}>A</div>
          <span className="font-black text-white text-sm tracking-tight">Anatomy Hub</span>
          <span className="text-[9px] text-slate-600 uppercase tracking-wider hidden sm:inline ml-1">1st Year MBBS</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="text-violet-400 font-bold">{ANATOMY_SYSTEMS.length} Systems</span>
          <span>·</span>
          <span>{ANATOMY_SYSTEMS.reduce((a, s) => a + s.structures.length, 0)} Topics</span>
        </div>
      </nav>

      {page === "landing" && (
        <HubLanding
          onSelectSystem={handleSelectSystem}
          onSelectResult={(sys, struct) => handleSelectSystem(sys, struct)}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
        />
      )}
      {page === "system" && selectedSystem && (
        <SystemView system={selectedSystem} onBack={handleBack} initialStructure={initialStructure} />
      )}
    </div>
  );
}
