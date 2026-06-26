import React, { useState, useMemo } from "react";
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

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type TabId = "model" | "cadaveric" | "crosssection" | "clinical" | "quiz" | "relations" | "mnemonics";
type HubPage = "landing" | "system";

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

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "model",        label: "3D Model",      icon: "🫀" },
  { id: "cadaveric",    label: "Cadaveric",      icon: "🔬" },
  { id: "crosssection", label: "Cross-Section",  icon: "📡" },
  { id: "clinical",     label: "Clinical",       icon: "🏥" },
  { id: "quiz",         label: "Quiz",           icon: "✍️" },
  { id: "relations",    label: "Relations",      icon: "🔗" },
  { id: "mnemonics",    label: "Mnemonics",      icon: "💡" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Landing — system grid + global search
// ─────────────────────────────────────────────────────────────────────────────
function SystemCard({ system, onClick }: { system: AnatomySystem; onClick: () => void }) {
  const c = SYSTEM_COLORS[system.id] ?? SYSTEM_COLORS.cardiovascular;
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
      style={{ background: c.bg, borderColor: c.border, boxShadow: "0 2px 14px rgba(0,0,0,0.35)" }}
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl leading-none">{system.icon}</span>
        <span
          className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/35 border"
          style={{ borderColor: c.border, color: c.text }}
        >
          {system.structures.length} topics
        </span>
      </div>
      <div>
        <h3 className="font-bold text-sm text-white leading-tight">{system.name}</h3>
        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
          {system.structures.map(s => s.name).join(" · ")}
        </p>
      </div>
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ boxShadow: `inset 0 0 28px ${c.glow}` }} />
    </button>
  );
}

function HubLanding({
  onSelectSystem,
  onSelectResult,
  globalSearch,
  setGlobalSearch,
}: {
  onSelectSystem: (s: AnatomySystem) => void;
  onSelectResult: (s: AnatomySystem, st: AnatomyStructure) => void;
  globalSearch: string;
  setGlobalSearch: (v: string) => void;
}) {
  const searchResults = useMemo(() => searchStructures(globalSearch), [globalSearch]);
  const totalStructures = ANATOMY_SYSTEMS.reduce((a, s) => a + s.structures.length, 0);
  const totalLabels = ANATOMY_SYSTEMS.reduce((a, s) => a + s.structures.reduce((b, st) => b + st.labels.length, 0), 0);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="flex justify-center gap-3 mb-3 text-3xl">
          <span>🫀</span><span>🧠</span><span>🦴</span><span>🫁</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">Anatomy Hub</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          3D anatomy for MBBS 1st Year — all {ANATOMY_SYSTEMS.length} body systems, {totalStructures} structures, {totalLabels}+ labelled regions
        </p>
        <div className="flex justify-center gap-8 mt-4">
          {[{ n: ANATOMY_SYSTEMS.length, l: "Systems" }, { n: totalStructures, l: "Topics" }, { n: totalLabels, l: "3D Labels" }].map(s => (
            <div key={s.l} className="text-center">
              <div className="text-2xl font-black text-violet-400">{s.n}</div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-lg mx-auto mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        <input
          value={globalSearch}
          onChange={e => setGlobalSearch(e.target.value)}
          placeholder="Search any structure — LAD, Broca's, nephron, uterus..."
          className="w-full pl-9 pr-9 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
        />
        {globalSearch && (
          <button onClick={() => setGlobalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs">✕</button>
        )}
      </div>

      {/* Search results */}
      {globalSearch ? (
        <div className="max-w-lg mx-auto">
          <p className="text-[11px] text-slate-500 mb-2 px-1">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{globalSearch}"</p>
          {searchResults.length === 0 ? (
            <p className="text-center text-slate-600 py-8 text-sm">No structures found. Try a different term.</p>
          ) : (
            <div className="space-y-1.5">
              {searchResults.map(({ system, structure }) => {
                const c = SYSTEM_COLORS[system.id] ?? SYSTEM_COLORS.cardiovascular;
                return (
                  <button
                    key={`${system.id}-${structure.id}`}
                    onClick={() => onSelectResult(system, structure)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border text-left hover:scale-[1.01] transition-all"
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
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-w-5xl mx-auto">
          {ANATOMY_SYSTEMS.map(s => (
            <SystemCard key={s.id} system={s} onClick={() => onSelectSystem(s)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab content panels
// ─────────────────────────────────────────────────────────────────────────────
function ClinicalPanel({ structure }: { structure: AnatomyStructure }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-500/20 bg-violet-900/10 p-4">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-2 flex items-center gap-1.5">📖 Study Notes</h4>
        <p className="text-sm text-slate-300 leading-relaxed">{structure.studyNotes}</p>
      </div>
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">🏥 High-Yield Clinical Points</h4>
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
  if (!hasContent) {
    return <div className="flex flex-col items-center justify-center h-40 text-slate-600 gap-2"><span className="text-3xl">🔗</span><p className="text-sm">Relations data coming soon.</p></div>;
  }
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
      {structure.bloodSupply && (
        <div className="rounded-xl border border-red-500/20 bg-red-900/10 p-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">🩸 Blood Supply</h4>
          <p className="text-sm text-slate-300">{structure.bloodSupply}</p>
        </div>
      )}
      {structure.nerveSupply && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-900/10 p-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 mb-2">⚡ Nerve Supply</h4>
          <p className="text-sm text-slate-300">{structure.nerveSupply}</p>
        </div>
      )}
      {structure.lymphDrainage && (
        <div className="rounded-xl border border-green-500/20 bg-green-900/10 p-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-green-400 mb-2">🫐 Lymph Drainage</h4>
          <p className="text-sm text-slate-300">{structure.lymphDrainage}</p>
        </div>
      )}
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
  if (!structure.mnemonics?.length) {
    return <div className="flex flex-col items-center justify-center h-40 text-slate-600 gap-2"><span className="text-3xl">💡</span><p className="text-sm">No mnemonics yet.</p></div>;
  }
  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-500">High-yield exam mnemonics — commit these to memory!</p>
      {structure.mnemonics.map((m, i) => (
        <div key={i} className="rounded-xl border border-violet-500/20 bg-violet-900/15 p-4">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl shrink-0">💡</span>
            <p className="font-black text-violet-300 text-base leading-tight">{m.mnemonic}</p>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-2">{m.meaning}</p>
          {m.tip && (
            <div className="flex items-start gap-2 bg-amber-900/20 rounded-lg p-2.5 border border-amber-500/20 mt-3">
              <span className="text-amber-400 text-xs shrink-0 mt-0.5">⚡ Tip:</span>
              <p className="text-amber-200 text-xs leading-snug">{m.tip}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Structure info right panel (7 tabs)
// ─────────────────────────────────────────────────────────────────────────────
function StructureInfoPanel({
  system, structure, activeTab, setActiveTab,
  showLabels, setShowLabels, onLabelSelect, selectedLabel,
}: {
  system: AnatomySystem;
  structure: AnatomyStructure;
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  onLabelSelect: (l: StructureLabel) => void;
  selectedLabel: string | null;
}) {
  const c = SYSTEM_COLORS[system.id] ?? SYSTEM_COLORS.cardiovascular;
  const layerColors: Record<string, string> = {
    bone: "text-amber-400", muscle: "text-orange-400",
    vessel: "text-red-400", nerve: "text-yellow-400", organ: "text-violet-400",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Structure header */}
      <div className="px-4 pt-3 pb-2.5 border-b border-white/6 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: c.text }}>{system.name}</p>
        <h2 className="font-black text-white text-sm leading-tight">{structure.name}</h2>
        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{structure.description.slice(0, 110)}…</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto shrink-0 border-b border-white/6" style={{ scrollbarWidth: "none" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold whitespace-nowrap shrink-0 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-violet-500 text-violet-300"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "model" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Structure Labels</span>
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                  showLabels ? "bg-violet-600/30 border-violet-500/40 text-violet-300" : "bg-white/5 border-white/10 text-slate-500"
                }`}
              >
                {showLabels ? "ON" : "OFF"}
              </button>
            </div>
            {structure.labels.length === 0 && (
              <p className="text-sm text-slate-600 text-center py-6">Rotate the model to explore. No labelled points for this structure.</p>
            )}
            <div className="space-y-1.5">
              {structure.labels.map(label => (
                <button
                  key={label.id}
                  onClick={() => onLabelSelect(label)}
                  className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left border transition-all ${
                    selectedLabel === label.id
                      ? "bg-violet-900/30 border-violet-500/40"
                      : "bg-white/3 border-white/6 hover:bg-white/6 hover:border-white/12"
                  }`}
                >
                  <span className={`text-xs mt-0.5 shrink-0 ${layerColors[label.layer ?? "organ"] ?? "text-violet-400"}`}>◆</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white leading-tight">{label.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{label.description}</p>
                    {label.clinicalNote && selectedLabel === label.id && (
                      <p className="text-[11px] text-red-300 mt-1 bg-red-900/15 rounded px-1.5 py-1 border border-red-500/15 leading-snug">
                        ⚕ {label.clinicalNote}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab === "cadaveric" && <CadavericViewer system={system} />}
        {activeTab === "crosssection" && <CrossSectionViewer system={system} />}
        {activeTab === "clinical" && <ClinicalPanel structure={structure} />}
        {activeTab === "quiz" && <AnatomyQuizPanel questions={structure.quiz} title={structure.name} />}
        {activeTab === "relations" && <RelationsPanel structure={structure} />}
        {activeTab === "mnemonics" && <MnemonicsPanel structure={structure} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// System view — left sidebar + 3D viewer + right panel
// ─────────────────────────────────────────────────────────────────────────────
function SystemView({
  system, onBack, initialStructure,
}: {
  system: AnatomySystem;
  onBack: () => void;
  initialStructure?: AnatomyStructure | null;
}) {
  const [selectedStructure, setSelectedStructure] = useState<AnatomyStructure>(
    initialStructure ?? system.structures[0]
  );
  const [activeTab, setActiveTab] = useState<TabId>("model");
  const [showLabels, setShowLabels] = useState(true);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [showRight, setShowRight] = useState(true);
  const [showLeft, setShowLeft] = useState(true);
  const [structSearch, setStructSearch] = useState("");

  const c = SYSTEM_COLORS[system.id] ?? SYSTEM_COLORS.cardiovascular;

  const filtered = useMemo(
    () => system.structures.filter(s =>
      s.name.toLowerCase().includes(structSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(structSearch.toLowerCase())
    ),
    [system.structures, structSearch]
  );

  function handleLabelSelect(label: StructureLabel) {
    setSelectedLabel(prev => prev === label.id ? null : label.id);
    setShowRight(true);
    setActiveTab("model");
  }

  function handleStructureSelect(s: AnatomyStructure) {
    setSelectedStructure(s);
    setSelectedLabel(null);
    setActiveTab("model");
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* System top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/8 bg-black/30 backdrop-blur-sm shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm group">
          <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span>
          <span className="hidden sm:inline">Systems</span>
        </button>
        <span className="text-slate-700">/</span>
        <span className="text-base">{system.icon}</span>
        <span className="font-bold text-sm" style={{ color: c.text }}>{system.name}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setShowLeft(p => !p)}
            className={`hidden md:block text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-colors ${
              showLeft ? "bg-white/8 border-white/15 text-slate-300" : "bg-white/3 border-white/8 text-slate-600"
            }`}
          >
            ☰ Topics
          </button>
          <button
            onClick={() => setShowRight(p => !p)}
            className={`hidden md:block text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-colors ${
              showRight ? "bg-violet-900/40 border-violet-500/40 text-violet-300" : "bg-white/3 border-white/8 text-slate-600"
            }`}
          >
            📋 Notes
          </button>
        </div>
      </div>

      {/* Content row */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left sidebar */}
        {showLeft && (
          <aside className="w-48 xl:w-52 shrink-0 flex flex-col border-r border-white/8 bg-black/20 overflow-hidden">
            <div className="px-3 py-2 border-b border-white/6 shrink-0">
              <input
                value={structSearch}
                onChange={e => setStructSearch(e.target.value)}
                placeholder="Search topics..."
                className="w-full px-2.5 py-1.5 text-[11px] bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="flex-1 overflow-y-auto py-1.5">
              {filtered.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleStructureSelect(s)}
                  className={`w-full flex items-start gap-2 px-3 py-2.5 text-left transition-colors border-l-2 ${
                    selectedStructure.id === s.id
                      ? "bg-violet-900/25 border-l-violet-500 text-white"
                      : "border-l-transparent text-slate-400 hover:text-white hover:bg-white/4"
                  }`}
                >
                  <span className="text-sm shrink-0 mt-0.5">{system.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate leading-tight">{s.name}</p>
                    <p className="text-[10px] opacity-55 mt-0.5">{s.labels.length} labels · {s.quiz.length} quiz Qs</p>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-[11px] text-slate-600 text-center py-6 px-3">No topics match</p>
              )}
            </div>
          </aside>
        )}

        {/* 3D Viewer */}
        <div className="flex-1 min-w-0 relative">
          <ModelViewer3D
            system={system}
            showLabels={showLabels}
            onLabelSelect={handleLabelSelect}
            selectedLabel={selectedLabel}
          />
          {/* Mobile notes FAB */}
          <button
            onClick={() => setShowRight(p => !p)}
            className="absolute bottom-14 right-3 md:hidden bg-violet-600 text-white rounded-full w-11 h-11 flex items-center justify-center text-lg shadow-xl border border-violet-400/30"
          >
            📋
          </button>
        </div>

        {/* Right panel — desktop */}
        {showRight && (
          <aside className="w-72 xl:w-80 shrink-0 hidden md:flex flex-col border-l border-white/8 bg-black/20 overflow-hidden">
            <StructureInfoPanel
              system={system}
              structure={selectedStructure}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              showLabels={showLabels}
              setShowLabels={setShowLabels}
              onLabelSelect={handleLabelSelect}
              selectedLabel={selectedLabel}
            />
          </aside>
        )}
      </div>

      {/* Right panel — mobile bottom drawer */}
      {showRight && (
        <div className="md:hidden shrink-0 border-t border-white/8 bg-black/40" style={{ height: 260 }}>
          <StructureInfoPanel
            system={system}
            structure={selectedStructure}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showLabels={showLabels}
            setShowLabels={setShowLabels}
            onLabelSelect={handleLabelSelect}
            selectedLabel={selectedLabel}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root component
// ─────────────────────────────────────────────────────────────────────────────
export default function AnatomyHub() {
  const [page, setPage] = useState<HubPage>("landing");
  const [selectedSystem, setSelectedSystem] = useState<AnatomySystem | null>(null);
  const [initialStructure, setInitialStructure] = useState<AnatomyStructure | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");

  function handleSelectSystem(s: AnatomySystem, structure?: AnatomyStructure) {
    setSelectedSystem(s);
    setInitialStructure(structure ?? null);
    setPage("system");
    setGlobalSearch("");
  }

  function handleBack() {
    setPage("landing");
    setSelectedSystem(null);
    setInitialStructure(null);
  }

  return (
    <div
      className="flex flex-col w-full h-full overflow-hidden"
      style={{ background: "linear-gradient(135deg, #060414 0%, #0a0520 50%, #060318 100%)" }}
    >
      {/* Nav bar */}
      <nav className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-black/50 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-white select-none"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a21caf)" }}
          >
            A
          </div>
          <span className="font-black text-white text-sm tracking-tight">Anatomy Hub</span>
          <span className="text-[9px] text-slate-600 uppercase tracking-wider hidden sm:inline ml-1">1st Year MBBS</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-600">
          <span>{ANATOMY_SYSTEMS.length} systems</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="text-violet-400 font-bold">All 10 Systems</span>
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
        <SystemView
          system={selectedSystem}
          onBack={handleBack}
          initialStructure={initialStructure}
        />
      )}
    </div>
  );
}
