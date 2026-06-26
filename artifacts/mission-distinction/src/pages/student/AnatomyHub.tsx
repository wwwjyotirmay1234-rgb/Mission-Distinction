import { lazy, Suspense, useState, useCallback } from "react";
import {
  Rotate3D, ZoomIn, Info, Layers, Wifi, ChevronLeft,
  Bookmark, Search, Eye, EyeOff,
  Microscope, Camera, Scan, BookOpen, FileQuestion,
  StickyNote, Tag, ChevronRight, Loader2,
} from "lucide-react";
import { ANATOMY_SYSTEMS, type AnatomySystem, type AnatomyStructure, type StructureLabel } from "@/data/anatomyData";
import CadavericViewer from "@/pages/student/anatomy/CadavericViewer";
import CrossSectionViewer from "@/pages/student/anatomy/CrossSectionViewer";
import AnatomyQuizPanel from "@/pages/student/anatomy/AnatomyQuizPanel";

const ModelViewer3D = lazy(() => import("@/pages/student/anatomy/ModelViewer3D"));

// ── System icon/thumbnail colors ──────────────────────────────────────────────
const SYSTEM_BG: Record<string, string> = {
  skeletal:       "from-amber-900/40 to-amber-950/60 border-amber-700/30",
  muscular:       "from-orange-900/40 to-orange-950/60 border-orange-700/30",
  nervous:        "from-purple-900/40 to-purple-950/60 border-purple-700/30",
  cardiovascular: "from-red-900/40 to-red-950/60 border-red-700/30",
  respiratory:    "from-cyan-900/40 to-cyan-950/60 border-cyan-700/30",
  digestive:      "from-green-900/40 to-green-950/60 border-green-700/30",
};

type ViewMode = "model" | "cadaveric" | "crosssection";
type RightTab = "structures" | "labels" | "quiz" | "notes";

// ═════════════════════════════════════════════════════════════════════════════
// Hub landing page
// ═════════════════════════════════════════════════════════════════════════════
function HubLanding({ onSelectSystem }: { onSelectSystem: (s: AnatomySystem) => void }) {
  const [search, setSearch] = useState("");
  const filtered = ANATOMY_SYSTEMS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-8">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl mx-4 mt-4 mb-5 p-6 md:p-8 min-h-[180px] flex items-center"
        style={{
          background: "linear-gradient(135deg, #1e1035 0%, #2d1f5e 40%, #1a0f3d 100%)",
          boxShadow: "inset 0 0 80px rgba(124,58,237,0.18)",
        }}
      >
        {/* Purple glow orbs */}
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-36 h-36 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 leading-tight">
            Explore Human Anatomy<br />
            <span className="text-violet-400">in 3D</span>
          </h1>
          <p className="text-slate-300 text-sm max-w-sm mb-5">
            Interactive 3D models, cadaveric images, and detailed anatomy resources.
          </p>
          <button
            onClick={() => onSelectSystem(ANATOMY_SYSTEMS[3])}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-900/50 hover:scale-105"
          >
            <Microscope size={16} /> Explore 3D Models
          </button>
        </div>
        {/* Floating 3D head silhouette */}
        <div className="hidden md:flex absolute right-6 bottom-0 items-end h-full pointer-events-none select-none">
          <span className="text-8xl opacity-25" style={{ filter: "drop-shadow(0 0 24px #7c3aed)" }}>🧠</span>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-6">
        {[
          {
            icon: Microscope,
            title: "3D Anatomy Models",
            sub: "Interactive 3D models with 360° rotation",
            color: "text-violet-400",
            bg: "bg-violet-500/10 border-violet-500/20",
            onClick: () => onSelectSystem(ANATOMY_SYSTEMS[0]),
          },
          {
            icon: Camera,
            title: "Cadaveric Images",
            sub: "High-quality real cadaver photographs",
            color: "text-pink-400",
            bg: "bg-pink-500/10 border-pink-500/20",
            onClick: () => {},
          },
          {
            icon: Scan,
            title: "Cross-Sections",
            sub: "CT, MRI and anatomical sections",
            color: "text-cyan-400",
            bg: "bg-cyan-500/10 border-cyan-500/20",
            onClick: () => {},
          },
        ].map(card => (
          <button
            key={card.title}
            onClick={() => { if (card.onClick) card.onClick(); }}
            className={`relative flex flex-col p-3 md:p-4 rounded-xl border text-left hover:scale-[1.02] transition-all cursor-pointer ${card.bg}`}
          >
            <card.icon size={20} className={`${card.color} mb-2`} />
            <p className="text-xs md:text-sm font-semibold text-white leading-tight mb-1">{card.title}</p>
            <p className="text-[10px] md:text-xs text-slate-400 leading-relaxed hidden md:block">{card.sub}</p>
          </button>
        ))}
      </div>

      {/* Systems header + search */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-bold text-white">Anatomy Systems</h2>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-7 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 w-32"
          />
        </div>
      </div>

      {/* System grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4">
        {filtered.map(system => (
          <button
            key={system.id}
            onClick={() => onSelectSystem(system)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-b border hover:scale-[1.03] transition-all cursor-pointer text-center group ${SYSTEM_BG[system.id]}`}
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">{system.icon}</span>
            <p className="text-xs font-semibold text-white leading-tight">{system.name}</p>
            <p className="text-[10px] text-slate-500">{system.modelCount} Models</p>
            <ChevronRight size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Detail / model viewer page
// ═════════════════════════════════════════════════════════════════════════════
function ModelDetailPage({
  system,
  onBack,
}: {
  system: AnatomySystem;
  onBack: () => void;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("model");
  const [rightTab, setRightTab] = useState<RightTab>("structures");
  const [showLabels, setShowLabels] = useState(true);
  const [selectedLabel, setSelectedLabel] = useState<StructureLabel | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  const allLabels = system.structures.flatMap(s => s.labels);
  const mainStructure = system.structures[0];
  const allQuiz = system.structures.flatMap(s => s.quiz);

  const handleLabelSelect = useCallback((l: StructureLabel) => {
    setSelectedLabel(prev => prev?.id === l.id ? null : l);
    setRightTab("structures");
  }, []);

  const viewModes: { id: ViewMode; label: string; icon: typeof Microscope }[] = [
    { id: "model",        label: "3D Model",     icon: Rotate3D },
    { id: "cadaveric",    label: "Cadaveric",    icon: Camera },
    { id: "crosssection", label: "Cross-Section", icon: Scan },
  ];

  const rightTabs: { id: RightTab; label: string; icon: typeof Microscope }[] = [
    { id: "structures", label: "Structures", icon: Layers },
    { id: "labels",     label: "Labels",     icon: Tag },
    { id: "quiz",       label: "Quiz",       icon: FileQuestion },
    { id: "notes",      label: "Notes",      icon: StickyNote },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-slate-900/50 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white truncate">{system.name}</h2>
          <p className="text-xs text-slate-500">{system.modelCount} Models</p>
        </div>
        {/* View mode pills */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {viewModes.map(m => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === m.id
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <m.icon size={12} />
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setBookmarked(b => !b)}
          className={`p-1.5 rounded-lg transition-colors ${bookmarked ? "text-violet-400 bg-violet-500/15" : "text-slate-500 hover:text-slate-300 hover:bg-white/10"}`}
        >
          <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: viewer area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Viewer */}
          <div className="relative flex-1 bg-slate-950 overflow-hidden">
            {viewMode === "model" && (
              <>
                <Suspense fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <Loader2 size={28} className="text-violet-400 animate-spin" />
                    <p className="text-xs text-slate-500">Loading 3D model…</p>
                  </div>
                }>
                  <ModelViewer3D
                    system={system}
                    showLabels={showLabels}
                    onLabelSelect={handleLabelSelect}
                    selectedLabel={selectedLabel?.id ?? null}
                  />
                </Suspense>
                {/* 3D controls overlay */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                  {[
                    { icon: Rotate3D,  label: "Rotate" },
                    { icon: ZoomIn,    label: "Zoom" },
                    { icon: Info,      label: "Info" },
                    { icon: Layers,    label: "Layers" },
                    { icon: Wifi,      label: "AR" },
                  ].map(ctrl => (
                    <div key={ctrl.label} className="flex flex-col items-center gap-0.5">
                      <button className="p-2 rounded-xl bg-slate-800/80 border border-white/10 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors backdrop-blur-sm">
                        <ctrl.icon size={15} />
                      </button>
                      <span className="text-[9px] text-slate-600">{ctrl.label}</span>
                    </div>
                  ))}
                </div>
                {/* Label toggle */}
                <button
                  onClick={() => setShowLabels(l => !l)}
                  className="absolute right-3 bottom-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors backdrop-blur-sm"
                >
                  {showLabels ? <Eye size={13} /> : <EyeOff size={13} />}
                  {showLabels ? "Hide Labels" : "Show Labels"}
                </button>
                {/* System badge */}
                <div className="absolute right-3 top-3 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/10 backdrop-blur-sm">
                  <p className="text-xs font-semibold text-white">{system.structures[0]?.name ?? system.name}</p>
                  <p className="text-[10px] text-slate-400">{system.name}</p>
                </div>
              </>
            )}
            {viewMode === "cadaveric" && (
              <div className="w-full h-full p-3">
                <CadavericViewer system={system} />
              </div>
            )}
            {viewMode === "crosssection" && (
              <div className="w-full h-full p-3">
                <CrossSectionViewer system={system} />
              </div>
            )}
          </div>

          {/* Layer thumbnails (model view only) */}
          {viewMode === "model" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 border-t border-white/5 flex-shrink-0 overflow-x-auto">
              {["All", "Bone", "Muscles", "Arteries", "Nerves"].map(layer => (
                <button
                  key={layer}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                    layer === "All"
                      ? "bg-violet-600/20 border border-violet-500/40 text-violet-300"
                      : "bg-white/5 border border-white/10 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <span className="text-base leading-none">
                    {layer === "All" ? "🔍" : layer === "Bone" ? "🦴" : layer === "Muscles" ? "💪" : layer === "Arteries" ? "🩸" : "⚡"}
                  </span>
                  {layer}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-72 xl:w-80 flex-shrink-0 border-l border-white/5 flex flex-col bg-slate-900/30 overflow-hidden">
          {/* Right panel tabs */}
          <div className="flex border-b border-white/5 flex-shrink-0">
            {rightTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setRightTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                  rightTab === tab.id
                    ? "text-violet-400 border-b-2 border-violet-400 -mb-px bg-violet-500/5"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right panel content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {rightTab === "structures" && (
              <StructuresPanel
                system={system}
                selectedLabel={selectedLabel}
                onSelectLabel={handleLabelSelect}
              />
            )}
            {rightTab === "labels" && (
              <LabelsPanel labels={allLabels} selected={selectedLabel} onSelect={handleLabelSelect} />
            )}
            {rightTab === "quiz" && allQuiz.length > 0 && (
              <AnatomyQuizPanel questions={allQuiz} title={system.name} />
            )}
            {rightTab === "quiz" && allQuiz.length === 0 && (
              <EmptyState icon="📝" title="No quiz yet" sub="Quiz questions for this system coming soon." />
            )}
            {rightTab === "notes" && mainStructure && (
              <NotesPanel structure={mainStructure} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-panels ────────────────────────────────────────────────────────────────
function StructuresPanel({
  system,
  selectedLabel,
  onSelectLabel,
}: {
  system: AnatomySystem;
  selectedLabel: StructureLabel | null;
  onSelectLabel: (l: StructureLabel) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Selected label highlight */}
      {selectedLabel && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-violet-300">{selectedLabel.name}</p>
            <span className="w-2 h-2 rounded-full bg-violet-400" />
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">{selectedLabel.description}</p>
          {selectedLabel.clinicalNote && (
            <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-[10px] text-amber-300 font-semibold mb-0.5">⚕ Clinical Note</p>
              <p className="text-[10px] text-slate-400">{selectedLabel.clinicalNote}</p>
            </div>
          )}
        </div>
      )}

      {/* All structures list */}
      {system.structures.map(structure => (
        <div key={structure.id} className="rounded-xl bg-white/[0.03] border border-white/8 overflow-hidden">
          <div className="p-3 border-b border-white/5">
            <p className="text-xs font-bold text-white">{structure.name}</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-3">{structure.description}</p>
          </div>
          {structure.labels.length > 0 && (
            <div className="p-2 flex flex-wrap gap-1">
              {structure.labels.slice(0, 4).map(l => (
                <button
                  key={l.id}
                  onClick={() => onSelectLabel(l)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    selectedLabel?.id === l.id
                      ? "bg-violet-600/40 border border-violet-400/50 text-violet-200"
                      : "bg-white/5 border border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {l.name}
                </button>
              ))}
              {structure.labels.length > 4 && (
                <span className="px-2 py-0.5 text-[10px] text-slate-600">+{structure.labels.length - 4} more</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LabelsPanel({
  labels,
  selected,
  onSelect,
}: {
  labels: StructureLabel[];
  selected: StructureLabel | null;
  onSelect: (l: StructureLabel) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-2">
        {labels.length} Structure{labels.length !== 1 ? "s" : ""}
      </p>
      {labels.map(label => (
        <button
          key={label.id}
          onClick={() => onSelect(label)}
          className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all border ${
            selected?.id === label.id
              ? "bg-violet-500/15 border-violet-500/35 text-violet-200"
              : "bg-white/[0.03] border-white/8 text-slate-300 hover:bg-white/[0.06] hover:border-white/15"
          }`}
        >
          <span
            className="mt-0.5 flex-shrink-0 w-2 h-2 rounded-full border"
            style={{
              background: selected?.id === label.id ? "#7c3aed" : "transparent",
              borderColor: selected?.id === label.id ? "#a78bfa" : "#4b5563",
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{label.name}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{label.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function NotesPanel({ structure }: { structure: AnatomyStructure }) {
  return (
    <div className="space-y-3">
      {/* Study notes */}
      <div className="rounded-xl bg-white/[0.03] border border-white/8 p-3">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={13} className="text-violet-400" />
          <p className="text-xs font-bold text-white">Study Notes</p>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">{structure.studyNotes}</p>
      </div>

      {/* Clinical points */}
      <div className="rounded-xl bg-white/[0.03] border border-white/8 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">⚕</span>
          <p className="text-xs font-bold text-white">Clinical Pearls</p>
        </div>
        <ul className="space-y-1.5">
          {structure.clinicalPoints.map((pt, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">{pt}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <span className="text-4xl">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-slate-300">{title}</p>
        <p className="text-xs text-slate-600 mt-1">{sub}</p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Root page component
// ═════════════════════════════════════════════════════════════════════════════
export default function AnatomyHub() {
  const [selectedSystem, setSelectedSystem] = useState<AnatomySystem | null>(null);

  if (selectedSystem) {
    return (
      <div className="h-full overflow-hidden">
        <ModelDetailPage
          system={selectedSystem}
          onBack={() => setSelectedSystem(null)}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden bg-slate-950">
      <HubLanding onSelectSystem={setSelectedSystem} />
    </div>
  );
}
