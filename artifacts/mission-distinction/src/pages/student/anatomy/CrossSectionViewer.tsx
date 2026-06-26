import React, { useState } from "react";
import type { AnatomySystem } from "@/data/anatomyData";

type Mode = "ct" | "mri" | "anatomical";

export default function CrossSectionViewer({ system }: { system: AnatomySystem }) {
  const [mode, setMode] = useState<Mode>("ct");
  const [expanded, setExpanded] = useState(false);

  const modeData: Record<Mode, { label: string; note: string; bg: string; imgClass: string }> = {
    ct:         { label: "CT",         note: system.ctNote,  bg: "bg-slate-950",  imgClass: "grayscale" },
    mri:        { label: "MRI",        note: system.mriNote, bg: "bg-slate-900",  imgClass: "grayscale contrast-125" },
    anatomical: { label: "Anatomical", note: "Anatomical cross-sections are schematic diagrams showing the relationships of structures at a particular level. Colour-coded for easy identification of tissue types.", bg: "bg-slate-950", imgClass: "saturate-100" },
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-xl overflow-hidden border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.03]">
        <div>
          <p className="text-sm font-semibold text-white">{system.crossSectionTitle}</p>
          <p className="text-xs text-slate-400">Level: {system.crossSectionLevel}</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex border-b border-white/5">
        {(["ct", "mri", "anatomical"] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
              mode === m
                ? "text-cyan-400 border-b-2 border-cyan-400 -mb-px bg-cyan-500/5"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {modeData[m].label}
          </button>
        ))}
      </div>

      {/* Image */}
      <div className={`flex-1 flex items-center justify-center min-h-[200px] ${modeData[mode].bg} relative overflow-hidden`}>
        {/* Cross-section placeholder with system-specific content */}
        <div className="relative w-full h-full flex items-center justify-center p-4">
          {mode === "anatomical" ? (
            <AnatomicalDiagram systemId={system.id} />
          ) : (
            <CTMRIDiagram systemId={system.id} mode={mode} />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3 border-t border-white/5 flex items-start gap-2">
        <div className="mt-0.5 text-cyan-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-300 leading-relaxed">{modeData[mode].note}</p>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 pb-3">
        <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/5">
          <p className="text-[11px] text-slate-400 leading-relaxed">{system.crossSectionDescription}</p>
        </div>
      </div>
    </div>
  );
}

// Simple SVG cross-section diagrams for anatomical mode
function AnatomicalDiagram({ systemId }: { systemId: string }) {
  const diagrams: Record<string, React.ReactElement> = {
    cardiovascular: (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <ellipse cx="100" cy="110" rx="70" ry="55" fill="#1e293b" stroke="#475569" strokeWidth="1"/>
        <ellipse cx="85"  cy="108" rx="30" ry="28" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5"/>
        <ellipse cx="118" cy="110" rx="28" ry="26" fill="#991b1b" stroke="#f87171" strokeWidth="1"/>
        <ellipse cx="82"  cy="82"  rx="18" ry="14" fill="#9b1010" stroke="#ef4444" strokeWidth="1"/>
        <ellipse cx="118" cy="82"  rx="17" ry="14" fill="#b91c1c" stroke="#f87171" strokeWidth="1"/>
        <rect x="94" y="72" width="3" height="66" fill="#e2e8f0" opacity="0.4"/>
        <text x="78" y="112" fontSize="7" fill="#fca5a5" textAnchor="middle">LV</text>
        <text x="118" y="114" fontSize="7" fill="#fca5a5" textAnchor="middle">RV</text>
        <text x="82" y="84" fontSize="6" fill="#fed7d7" textAnchor="middle">LA</text>
        <text x="118" y="84" fontSize="6" fill="#fed7d7" textAnchor="middle">RA</text>
        <text x="100" y="25" fontSize="9" fill="#94a3b8" textAnchor="middle">Axial – T5</text>
        <ellipse cx="35" cy="110" rx="22" ry="28" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1" opacity="0.8"/>
        <ellipse cx="165" cy="110" rx="22" ry="28" fill="#1e3a5f" stroke="#93c5fd" strokeWidth="0.8" opacity="0.8"/>
        <text x="35" y="112" fontSize="6" fill="#93c5fd" textAnchor="middle">L. Lung</text>
        <text x="165" y="112" fontSize="6" fill="#93c5fd" textAnchor="middle">R. Lung</text>
      </svg>
    ),
    skeletal: (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <text x="100" y="25" fontSize="9" fill="#94a3b8" textAnchor="middle">Humeral Head – Axial</text>
        <ellipse cx="100" cy="110" rx="60" ry="58" fill="#F5F0DC" stroke="#d4c89a" strokeWidth="2"/>
        <ellipse cx="100" cy="110" rx="35" ry="33" fill="#E8DEBB" stroke="#c8b87a" strokeWidth="1.5"/>
        <ellipse cx="100" cy="110" rx="18" ry="17" fill="#D4C89A" stroke="#a89660" strokeWidth="1"/>
        <ellipse cx="64" cy="96" rx="10" ry="8" fill="#F0EAD0" stroke="#c4b87a" strokeWidth="1"/>
        <text x="64" y="98" fontSize="6" fill="#6b5a2a" textAnchor="middle">GT</text>
        <ellipse cx="72" cy="122" rx="8" ry="7" fill="#F0EAD0" stroke="#c4b87a" strokeWidth="1"/>
        <text x="72" y="124" fontSize="6" fill="#6b5a2a" textAnchor="middle">LT</text>
        <text x="100" y="113" fontSize="7" fill="#6b5a2a" textAnchor="middle">Cortex</text>
        <text x="100" y="165" fontSize="7" fill="#94a3b8" textAnchor="middle">GT = Greater Tubercle, LT = Lesser Tubercle</text>
      </svg>
    ),
    nervous: (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <text x="100" y="20" fontSize="9" fill="#94a3b8" textAnchor="middle">Brain – Axial (BG level)</text>
        <ellipse cx="100" cy="108" rx="72" ry="62" fill="#c8a898" stroke="#a08070" strokeWidth="1.5"/>
        <ellipse cx="85"  cy="105" rx="30" ry="26" fill="#d4b09a" stroke="#b89080" strokeWidth="1"/>
        <ellipse cx="115" cy="105" rx="28" ry="24" fill="#d4b09a" stroke="#b89080" strokeWidth="1"/>
        <ellipse cx="85"  cy="108" rx="14" ry="12" fill="#8B6355" stroke="#6b4335" strokeWidth="1"/>
        <ellipse cx="115" cy="108" rx="12" ry="11" fill="#8B6355" stroke="#6b4335" strokeWidth="1"/>
        <rect x="96" y="83" width="8" height="50" fill="#a09080" stroke="#807060" strokeWidth="0.5"/>
        <text x="85" y="110" fontSize="6" fill="#fde68a" textAnchor="middle">Put</text>
        <text x="115" y="110" fontSize="6" fill="#fde68a" textAnchor="middle">Put</text>
        <text x="100" y="180" fontSize="7" fill="#94a3b8" textAnchor="middle">Put = Putamen; Int. Cap. = internal capsule</text>
      </svg>
    ),
    respiratory: (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <text x="100" y="18" fontSize="9" fill="#94a3b8" textAnchor="middle">Thorax HRCT – T4 Level</text>
        <rect x="10" y="25" width="180" height="160" rx="12" fill="#111827" stroke="#374151" strokeWidth="1"/>
        <ellipse cx="65" cy="105" rx="42" ry="50" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1.5"/>
        <ellipse cx="135" cy="105" rx="44" ry="50" fill="#1e3a5f" stroke="#93c5fd" strokeWidth="1.5"/>
        <rect x="90" y="55" width="20" height="100" rx="6" fill="#374151" stroke="#6b7280" strokeWidth="1"/>
        <ellipse cx="100" cy="80" rx="8" ry="6" fill="#4b5563" stroke="#9ca3af" strokeWidth="1"/>
        <text x="65" y="107" fontSize="8" fill="#93c5fd" textAnchor="middle">L. Lung</text>
        <text x="135" y="107" fontSize="8" fill="#93c5fd" textAnchor="middle">R. Lung</text>
        <text x="100" y="82" fontSize="6" fill="#d1d5db" textAnchor="middle">Ao</text>
        <ellipse cx="100" cy="115" rx="14" ry="12" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1"/>
        <text x="100" y="117" fontSize="6" fill="#fca5a5" textAnchor="middle">Heart</text>
      </svg>
    ),
    muscular: (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <text x="100" y="18" fontSize="9" fill="#94a3b8" textAnchor="middle">Shoulder – Coronal MRI</text>
        <rect x="10" y="25" width="180" height="165" rx="10" fill="#1a1a2e" stroke="#374151" strokeWidth="1"/>
        <ellipse cx="100" cy="100" rx="35" ry="35" fill="#374151" stroke="#6b7280" strokeWidth="1.5"/>
        <ellipse cx="100" cy="100" rx="22" ry="22" fill="#4b5563" stroke="#9ca3af" strokeWidth="1"/>
        <rect x="56" y="58" width="88" height="18" rx="6" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5"/>
        <text x="100" y="70" fontSize="7" fill="#fca5a5" textAnchor="middle">Supraspinatus</text>
        <ellipse cx="42" cy="108" rx="14" ry="22" fill="#991b1b" stroke="#f87171" strokeWidth="1" transform="rotate(-15 42 108)"/>
        <text x="42" y="130" fontSize="6" fill="#fca5a5" textAnchor="middle">Deltoid</text>
        <text x="100" y="102" fontSize="7" fill="#e2e8f0" textAnchor="middle">GH Joint</text>
      </svg>
    ),
    digestive: (
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        <text x="100" y="18" fontSize="9" fill="#94a3b8" textAnchor="middle">Abdomen CT – L1 Level</text>
        <rect x="10" y="25" width="180" height="165" rx="10" fill="#111827" stroke="#374151" strokeWidth="1"/>
        <ellipse cx="130" cy="85" rx="40" ry="32" fill="#7c2d12" stroke="#ea580c" strokeWidth="1.5"/>
        <text x="130" y="87" fontSize="8" fill="#fed7aa" textAnchor="middle">Liver</text>
        <ellipse cx="72" cy="95" rx="22" ry="18" fill="#92400e" stroke="#f59e0b" strokeWidth="1"/>
        <text x="72" y="97" fontSize="7" fill="#fde68a" textAnchor="middle">Stomach</text>
        <ellipse cx="100" cy="130" rx="16" ry="12" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1"/>
        <text x="100" y="132" fontSize="6" fill="#93c5fd" textAnchor="middle">Aorta</text>
        <ellipse cx="125" cy="130" rx="14" ry="10" fill="#374151" stroke="#6b7280" strokeWidth="1"/>
        <text x="125" y="132" fontSize="6" fill="#d1d5db" textAnchor="middle">IVC</text>
        <text x="100" y="180" fontSize="7" fill="#94a3b8" textAnchor="middle">Portal venous phase</text>
      </svg>
    ),
  };
  return diagrams[systemId] ?? diagrams.cardiovascular;
}

function CTMRIDiagram({ systemId, mode }: { systemId: string; mode: "ct" | "mri" }) {
  const isCT = mode === "ct";
  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <div
        className={`w-full h-full rounded-full flex items-center justify-center ${
          isCT ? "bg-slate-800" : "bg-slate-900"
        } border border-slate-700`}
      >
        <AnatomicalDiagram systemId={systemId} />
      </div>
      <div className={`absolute bottom-0 left-0 right-0 text-center text-[9px] py-1 rounded-b-full ${
        isCT ? "text-slate-500" : "text-slate-500"
      }`}>
        {isCT ? "HU window: W:400 L:40" : "T2-weighted MRI"}
      </div>
    </div>
  );
}
