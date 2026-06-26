import React, { Suspense, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html, Sphere, Cylinder, Torus, Box } from "@react-three/drei";
import * as THREE from "three";
import type { AnatomySystem, StructureLabel } from "@/data/anatomyData";

// ─────────────────────────────────────────────────────────────────────────────
// Materials
// ─────────────────────────────────────────────────────────────────────────────
const MAT = {
  bone: <meshPhysicalMaterial color="#F5EFDC" roughness={0.7} metalness={0} clearcoat={0.12} />,
  boneLight: <meshPhysicalMaterial color="#EDE8D5" roughness={0.65} metalness={0} />,
  muscle: <meshPhysicalMaterial color="#8B1A1A" roughness={0.55} metalness={0.06} clearcoat={0.08} />,
  muscleDark: <meshPhysicalMaterial color="#6B1010" roughness={0.6} metalness={0.05} />,
  artery: <meshPhysicalMaterial color="#CC1010" roughness={0.35} metalness={0.18} clearcoat={0.4} />,
  vein: <meshPhysicalMaterial color="#1a2ea0" roughness={0.4} metalness={0.15} clearcoat={0.2} />,
  heart: <meshPhysicalMaterial color="#8B0000" roughness={0.45} metalness={0.12} clearcoat={0.3} />,
  nerve: <meshPhysicalMaterial color="#F0D060" roughness={0.5} metalness={0.05} />,
  brain: <meshPhysicalMaterial color="#D4B5A8" roughness={0.6} metalness={0} clearcoat={0.08} />,
  lung: <meshPhysicalMaterial color="#E08888" roughness={0.55} metalness={0.04} transparent opacity={0.92} />,
  airway: <meshPhysicalMaterial color="#C8B890" roughness={0.7} metalness={0} />,
  liver: <meshPhysicalMaterial color="#8B3A1A" roughness={0.6} metalness={0.05} clearcoat={0.12} />,
  stomach: <meshPhysicalMaterial color="#C06040" roughness={0.58} metalness={0.04} />,
  gut: <meshPhysicalMaterial color="#E8B090" roughness={0.6} metalness={0.02} />,
  gland: <meshPhysicalMaterial color="#C0A0D0" roughness={0.55} metalness={0.06} clearcoat={0.15} />,
  kidney: <meshPhysicalMaterial color="#8B4513" roughness={0.6} metalness={0.04} clearcoat={0.1} />,
  spleen: <meshPhysicalMaterial color="#6B3070" roughness={0.58} metalness={0.05} clearcoat={0.1} />,
  uterus: <meshPhysicalMaterial color="#C06080" roughness={0.55} metalness={0.04} clearcoat={0.12} />,
  ovary: <meshPhysicalMaterial color="#D09060" roughness={0.58} metalness={0.03} />,
  lymph: <meshPhysicalMaterial color="#80C880" roughness={0.5} metalness={0.04} clearcoat={0.1} />,
  tendon: <meshPhysicalMaterial color="#C8B080" roughness={0.65} metalness={0.04} />,
  fat: <meshPhysicalMaterial color="#F0E060" roughness={0.75} metalness={0} transparent opacity={0.5} />,
};

// ─────────────────────────────────────────────────────────────────────────────
// Label pin in 3D space
// ─────────────────────────────────────────────────────────────────────────────
function Label3D({
  label, selected, onSelect, hidden,
}: {
  label: StructureLabel;
  selected: boolean;
  onSelect: (l: StructureLabel) => void;
  hidden: boolean;
}) {
  if (hidden) return null;
  return (
    <Html position={label.pos} center distanceFactor={6} zIndexRange={[10, 100]}>
      <button
        onClick={() => onSelect(label)}
        className={`flex items-center gap-1.5 cursor-pointer select-none transition-all ${selected ? "scale-110" : "hover:scale-105"}`}
        style={{ background: "none", border: "none", padding: 0 }}
      >
        <span
          style={{
            width: selected ? 11 : 8, height: selected ? 11 : 8,
            borderRadius: "50%",
            background: selected ? "#7c3aed" : "rgba(255,255,255,0.88)",
            border: `2px solid ${selected ? "#a78bfa" : "#818cf8"}`,
            boxShadow: selected ? "0 0 10px #7c3aed" : "0 1px 3px rgba(0,0,0,0.4)",
            transition: "all 0.15s", display: "block", flexShrink: 0,
          }}
        />
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: selected ? "#c4b5fd" : "#e2e8f0",
          background: "rgba(6,4,20,0.82)",
          padding: "2px 6px", borderRadius: 5, whiteSpace: "nowrap",
          letterSpacing: "0.02em", textShadow: "0 1px 2px #000",
          border: selected ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.08)",
        }}>
          {label.name}
        </span>
      </button>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// System 3D models — anatomically improved procedural geometry
// ─────────────────────────────────────────────────────────────────────────────

function HeartModel({ fade }: { fade?: boolean }) {
  const op = fade ? 0.25 : 1;
  const s = fade ? { opacity: op, transparent: true } : {};
  const hM = <meshPhysicalMaterial color="#8B0000" roughness={0.45} metalness={0.12} clearcoat={0.3} {...s} />;
  const blM = <meshPhysicalMaterial color="#1e3a8a" roughness={0.4} metalness={0.15} {...s} />;
  const aM = <meshPhysicalMaterial color="#cc0000" roughness={0.32} metalness={0.2} clearcoat={0.4} {...s} />;
  const vM = <meshPhysicalMaterial color="#9b1010" roughness={0.45} metalness={0.1} {...s} />;
  return (
    <group>
      {/* Left Ventricle — larger, ellipsoidal */}
      <mesh position={[-0.3, -0.18, 0]} scale={[0.95, 1.1, 0.88]} castShadow><sphereGeometry args={[0.55, 32, 32]} />{hM}</mesh>
      {/* Right Ventricle — crescent, thinner */}
      <mesh position={[0.32, -0.25, 0.06]} scale={[0.8, 1.0, 0.7]} castShadow><sphereGeometry args={[0.5, 28, 28]} />{vM}</mesh>
      {/* Left Atrium */}
      <mesh position={[-0.32, 0.44, -0.18]} scale={[0.9, 0.75, 0.75]} castShadow><sphereGeometry args={[0.36, 24, 24]} />{vM}</mesh>
      {/* Right Atrium */}
      <mesh position={[0.33, 0.4, -0.12]} scale={[0.85, 0.72, 0.72]} castShadow><sphereGeometry args={[0.38, 24, 24]} />{vM}</mesh>
      {/* Ascending Aorta */}
      <mesh position={[-0.06, 0.97, 0.06]} rotation={[0.12, 0, -0.14]} castShadow><cylinderGeometry args={[0.13, 0.16, 0.78, 16]} />{aM}</mesh>
      {/* Aortic arch */}
      <mesh position={[-0.22, 1.3, 0]} scale={[1, 0.4, 0.5]} castShadow><torusGeometry args={[0.22, 0.12, 12, 24, Math.PI]} />{aM}</mesh>
      {/* Descending aorta */}
      <mesh position={[-0.42, 0.9, -0.1]} rotation={[0.1, 0, 0]} castShadow><cylinderGeometry args={[0.1, 0.12, 0.6, 14]} />{aM}</mesh>
      {/* Pulmonary trunk */}
      <mesh position={[0.27, 0.88, 0.16]} rotation={[0.1, 0, 0.28]} castShadow><cylinderGeometry args={[0.1, 0.12, 0.62, 14]} />{blM}</mesh>
      {/* Pulmonary L */}
      <mesh position={[0.05, 1.08, 0.08]} rotation={[0, 0, 0.7]} castShadow><cylinderGeometry args={[0.07, 0.09, 0.4, 10]} />{blM}</mesh>
      {/* SVC */}
      <mesh position={[0.38, 0.98, -0.12]} castShadow><cylinderGeometry args={[0.08, 0.09, 0.52, 12]} />{blM}</mesh>
      {/* IVC */}
      <mesh position={[0.38, -0.9, -0.12]} castShadow><cylinderGeometry args={[0.1, 0.1, 0.56, 12]} />{blM}</mesh>
      {/* Papillary muscles hint */}
      <mesh position={[-0.22, -0.45, 0.15]} castShadow><cylinderGeometry args={[0.055, 0.065, 0.4, 10]} />{hM}</mesh>
      <mesh position={[-0.42, -0.4, 0.08]} castShadow><cylinderGeometry args={[0.05, 0.06, 0.36, 10]} />{hM}</mesh>
    </group>
  );
}

function HumerusModel({ fade }: { fade?: boolean }) {
  const op = fade ? 0.22 : 1;
  const bM = <meshPhysicalMaterial color="#F5EFDC" roughness={0.7} metalness={0} clearcoat={0.12} transparent={fade} opacity={op} />;
  const cM = <meshPhysicalMaterial color="#EDE8D5" roughness={0.65} metalness={0} transparent={fade} opacity={op} />;
  return (
    <group scale={1.0}>
      {/* Shaft with slight taper */}
      <mesh castShadow><cylinderGeometry args={[0.17, 0.2, 2.7, 28]} />{bM}</mesh>
      {/* Humeral head */}
      <mesh position={[-0.12, 1.52, 0]} rotation={[0, 0, -0.35]} scale={[1, 1, 0.9]} castShadow><sphereGeometry args={[0.44, 32, 32]} />{bM}</mesh>
      {/* Greater tubercle */}
      <mesh position={[0.34, 1.3, 0]} castShadow><sphereGeometry args={[0.19, 20, 20]} />{cM}</mesh>
      {/* Lesser tubercle */}
      <mesh position={[-0.34, 1.24, 0.17]} castShadow><sphereGeometry args={[0.13, 16, 16]} />{cM}</mesh>
      {/* Intertubercular (bicipital) groove */}
      <mesh position={[-0.08, 1.2, 0.28]} rotation={[0, 0, 0.1]} castShadow><cylinderGeometry args={[0.04, 0.04, 0.35, 8]} />{cM}</mesh>
      {/* Surgical neck ridge */}
      <mesh position={[0, 1.02, 0]} castShadow><cylinderGeometry args={[0.22, 0.2, 0.08, 24]} />{cM}</mesh>
      {/* Deltoid tuberosity */}
      <mesh position={[0.22, 0.1, 0.08]} castShadow><sphereGeometry args={[0.06, 12, 12]} />{cM}</mesh>
      {/* Lateral epicondyle */}
      <mesh position={[0.32, -1.42, 0]} castShadow><sphereGeometry args={[0.2, 20, 20]} />{cM}</mesh>
      {/* Medial epicondyle */}
      <mesh position={[-0.36, -1.44, 0]} castShadow><sphereGeometry args={[0.23, 20, 20]} />{cM}</mesh>
      {/* Capitulum */}
      <mesh position={[0.28, -1.52, 0.07]} castShadow><sphereGeometry args={[0.15, 18, 18]} />{bM}</mesh>
      {/* Trochlea */}
      <mesh position={[-0.14, -1.54, 0.06]} scale={[1, 0.6, 1.2]} castShadow><torusGeometry args={[0.16, 0.1, 12, 20]} />{bM}</mesh>
      {/* Olecranon fossa */}
      <mesh position={[0, -1.44, -0.12]} castShadow><sphereGeometry args={[0.14, 14, 14]} />{cM}</mesh>
    </group>
  );
}

function BrainModel({ fade }: { fade?: boolean }) {
  const op = fade ? 0.22 : 1;
  const brM = <meshPhysicalMaterial color="#D4B5A8" roughness={0.6} metalness={0} clearcoat={0.08} transparent={fade} opacity={op} />;
  const cbM = <meshPhysicalMaterial color="#C8A595" roughness={0.65} metalness={0} transparent={fade} opacity={op} />;
  const stM = <meshPhysicalMaterial color="#B8967A" roughness={0.7} metalness={0} transparent={fade} opacity={op} />;
  return (
    <group>
      {/* Left hemisphere */}
      <mesh position={[-0.33, 0.05, 0]} scale={[1.0, 0.93, 1.1]} castShadow><sphereGeometry args={[0.84, 36, 36]} />{brM}</mesh>
      {/* Right hemisphere */}
      <mesh position={[0.33, 0.05, 0]} scale={[1.0, 0.93, 1.1]} castShadow><sphereGeometry args={[0.84, 36, 36]} />{brM}</mesh>
      {/* Interhemispheric fissure hint */}
      <mesh position={[0, 0.88, 0]} castShadow><boxGeometry args={[0.08, 0.3, 1.2]} />{<meshPhysicalMaterial color="#1a0f3d" roughness={1} />}</mesh>
      {/* Frontal lobe bulge L */}
      <mesh position={[-0.5, 0.25, 0.85]} scale={[0.7, 0.6, 0.7]} castShadow><sphereGeometry args={[0.55, 24, 24]} />{brM}</mesh>
      {/* Frontal lobe bulge R */}
      <mesh position={[0.5, 0.25, 0.85]} scale={[0.7, 0.6, 0.7]} castShadow><sphereGeometry args={[0.55, 24, 24]} />{brM}</mesh>
      {/* Temporal lobe L */}
      <mesh position={[-1.0, -0.38, 0.22]} scale={[0.65, 0.52, 0.78]} castShadow><sphereGeometry args={[0.56, 24, 24]} />{brM}</mesh>
      {/* Temporal lobe R */}
      <mesh position={[1.0, -0.38, 0.22]} scale={[0.65, 0.52, 0.78]} castShadow><sphereGeometry args={[0.56, 24, 24]} />{brM}</mesh>
      {/* Occipital lobe */}
      <mesh position={[0, 0.22, -0.95]} scale={[1.1, 0.7, 0.65]} castShadow><sphereGeometry args={[0.55, 24, 24]} />{brM}</mesh>
      {/* Cerebellum — bilobed */}
      <mesh position={[-0.28, -0.85, -0.75]} scale={[1.0, 0.6, 0.85]} castShadow><sphereGeometry args={[0.48, 28, 28]} />{cbM}</mesh>
      <mesh position={[0.28, -0.85, -0.75]} scale={[1.0, 0.6, 0.85]} castShadow><sphereGeometry args={[0.48, 28, 28]} />{cbM}</mesh>
      {/* Vermis */}
      <mesh position={[0, -0.82, -0.78]} scale={[0.45, 0.55, 0.8]} castShadow><sphereGeometry args={[0.35, 20, 20]} />{cbM}</mesh>
      {/* Midbrain */}
      <mesh position={[0, -0.98, -0.18]} rotation={[0.32, 0, 0]} castShadow><cylinderGeometry args={[0.2, 0.18, 0.4, 16]} />{stM}</mesh>
      {/* Pons */}
      <mesh position={[0, -1.14, -0.25]} rotation={[0.28, 0, 0]} castShadow><cylinderGeometry args={[0.22, 0.2, 0.32, 16]} />{stM}</mesh>
      {/* Medulla */}
      <mesh position={[0, -1.32, -0.18]} rotation={[0.15, 0, 0]} castShadow><cylinderGeometry args={[0.16, 0.14, 0.38, 14]} />{stM}</mesh>
    </group>
  );
}

function LungsModel({ fade }: { fade?: boolean }) {
  const op = fade ? 0.22 : 1;
  const lgM = <meshPhysicalMaterial color="#E08888" roughness={0.55} metalness={0.04} transparent opacity={fade ? op : 0.9} />;
  const trM = <meshPhysicalMaterial color="#C8B890" roughness={0.7} metalness={0} transparent={fade} opacity={op} />;
  return (
    <group scale={1.05}>
      {/* Right lung — 3 lobes, larger */}
      <mesh position={[0.76, 0.08, 0.02]} scale={[0.82, 1.38, 0.72]} castShadow><sphereGeometry args={[0.74, 30, 30]} />{lgM}</mesh>
      {/* Right upper lobe hint */}
      <mesh position={[0.76, 0.85, 0.18]} scale={[0.75, 0.55, 0.6]} castShadow><sphereGeometry args={[0.5, 20, 20]} />{lgM}</mesh>
      {/* Oblique fissure R */}
      <mesh position={[0.76, 0.3, 0.52]} scale={[0.58, 0.04, 0.48]}><sphereGeometry args={[0.72, 10, 10]} /><meshPhysicalMaterial color="#C07070" roughness={1} transparent opacity={0.4} /></mesh>
      {/* Left lung — 2 lobes, smaller, cardiac notch */}
      <mesh position={[-0.72, 0.1, 0]} scale={[0.76, 1.32, 0.7]} castShadow><sphereGeometry args={[0.72, 30, 30]} />{lgM}</mesh>
      {/* Lingula */}
      <mesh position={[-0.92, -0.45, 0.22]} scale={[0.55, 0.7, 0.5]} castShadow><sphereGeometry args={[0.35, 18, 18]} />{lgM}</mesh>
      {/* Cardiac notch indent (dark) */}
      <mesh position={[-0.52, -0.02, 0.42]} scale={[0.35, 0.55, 0.25]}><sphereGeometry args={[0.5, 16, 16]} /><meshPhysicalMaterial color="#080618" transparent opacity={0.7} /></mesh>
      {/* Trachea */}
      <mesh position={[0, 1.48, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 0.68, 14]} />{trM}</mesh>
      {/* Carina */}
      <mesh position={[0, 1.1, 0]} castShadow><sphereGeometry args={[0.13, 12, 12]} />{trM}</mesh>
      {/* Right main bronchus — more vertical (25°) */}
      <mesh position={[0.32, 0.86, 0]} rotation={[0, 0, -0.44]} castShadow><cylinderGeometry args={[0.09, 0.09, 0.52, 12]} />{trM}</mesh>
      {/* Left main bronchus — more horizontal (45°) */}
      <mesh position={[-0.36, 0.78, 0]} rotation={[0, 0, 0.55]} castShadow><cylinderGeometry args={[0.08, 0.08, 0.58, 12]} />{trM}</mesh>
      {/* Hilar lymph nodes R */}
      <mesh position={[0.52, 0.42, 0.1]} castShadow><sphereGeometry args={[0.055, 10, 10]} /><meshPhysicalMaterial color="#888888" roughness={0.8} /></mesh>
    </group>
  );
}

function MuscleModel({ fade }: { fade?: boolean }) {
  const op = fade ? 0.22 : 1;
  const msM = <meshPhysicalMaterial color="#8B1A1A" roughness={0.55} metalness={0.06} clearcoat={0.08} transparent={fade} opacity={op} />;
  const bM = <meshPhysicalMaterial color="#F0EAD6" roughness={0.7} metalness={0} transparent={fade} opacity={op} />;
  const tnM = <meshPhysicalMaterial color="#C8B080" roughness={0.65} metalness={0.04} transparent={fade} opacity={op} />;
  return (
    <group scale={0.95}>
      {/* Humerus shaft */}
      <mesh castShadow><cylinderGeometry args={[0.14, 0.17, 2.3, 22]} />{bM}</mesh>
      {/* Deltoid — anterior head */}
      <mesh position={[-0.54, 0.65, 0.24]} scale={[0.58, 1.08, 0.58]} castShadow><sphereGeometry args={[0.46, 20, 20]} />{msM}</mesh>
      {/* Deltoid — middle head */}
      <mesh position={[-0.74, 0.35, 0]} scale={[0.54, 1.12, 0.48]} castShadow><sphereGeometry args={[0.52, 22, 22]} /><meshPhysicalMaterial color="#9B2525" roughness={0.52} metalness={0.07} transparent={fade} opacity={op} /></mesh>
      {/* Deltoid — posterior head */}
      <mesh position={[-0.54, 0.48, -0.3]} scale={[0.54, 1.02, 0.54]} castShadow><sphereGeometry args={[0.43, 20, 20]} />{msM}</mesh>
      {/* Deltoid tendon insertion */}
      <mesh position={[-0.36, -0.04, 0.02]} rotation={[0, 0, 0.52]} castShadow><cylinderGeometry args={[0.065, 0.065, 0.42, 10]} />{tnM}</mesh>
      {/* Biceps brachii — long + short heads */}
      <mesh position={[-0.26, -0.55, 0.22]} scale={[0.52, 1.12, 0.52]} castShadow><sphereGeometry args={[0.3, 18, 18]} /><meshPhysicalMaterial color="#7A1818" roughness={0.58} metalness={0.06} transparent={fade} opacity={op} /></mesh>
      <mesh position={[-0.38, -0.48, 0.14]} scale={[0.42, 1.0, 0.42]} castShadow><sphereGeometry args={[0.26, 16, 16]} />{msM}</mesh>
      {/* Biceps tendon */}
      <mesh position={[-0.28, -1.0, 0.18]} castShadow><cylinderGeometry args={[0.055, 0.065, 0.32, 10]} />{tnM}</mesh>
      {/* Triceps — long + lateral + medial */}
      <mesh position={[0.4, -0.52, -0.12]} scale={[0.62, 1.18, 0.48]} castShadow><sphereGeometry args={[0.33, 18, 18]} />{msM}</mesh>
      <mesh position={[0.3, -0.35, -0.2]} scale={[0.5, 0.9, 0.42]} castShadow><sphereGeometry args={[0.28, 16, 16]} />{msM}</mesh>
      <mesh position={[0.22, -0.62, 0.0]} scale={[0.4, 0.9, 0.38]} castShadow><sphereGeometry args={[0.22, 14, 14]} />{msM}</mesh>
      {/* Brachialis */}
      <mesh position={[-0.04, -0.75, 0.12]} scale={[0.5, 0.9, 0.45]} castShadow><sphereGeometry args={[0.26, 16, 16]} />{msM}</mesh>
    </group>
  );
}

function DigestiveModel({ fade }: { fade?: boolean }) {
  const op = fade ? 0.22 : 1;
  const lvM = <meshPhysicalMaterial color="#8B3A1A" roughness={0.6} metalness={0.05} clearcoat={0.12} transparent={fade} opacity={op} />;
  const stM = <meshPhysicalMaterial color="#C06040" roughness={0.58} metalness={0.04} transparent={fade} opacity={op} />;
  const gtM = <meshPhysicalMaterial color="#E8B090" roughness={0.6} metalness={0.02} transparent={fade} opacity={op} />;
  return (
    <group scale={0.95}>
      {/* Liver — right lobe (large) */}
      <mesh position={[0.62, 0.54, 0]} scale={[1.15, 0.68, 0.75]} castShadow><sphereGeometry args={[0.75, 30, 30]} />{lvM}</mesh>
      {/* Liver left lobe */}
      <mesh position={[0.08, 0.55, 0.1]} scale={[0.68, 0.42, 0.6]} castShadow><sphereGeometry args={[0.52, 24, 24]} />{lvM}</mesh>
      {/* Gallbladder */}
      <mesh position={[0.72, 0.12, 0.46]} scale={[0.5, 0.72, 0.5]} castShadow><sphereGeometry args={[0.18, 14, 14]} /><meshPhysicalMaterial color="#5C7A2A" roughness={0.58} metalness={0.04} transparent={fade} opacity={op} /></mesh>
      {/* Common bile duct */}
      <mesh position={[0.68, -0.08, 0.28]} castShadow><cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />{gtM}</mesh>
      {/* Stomach body */}
      <mesh position={[-0.36, 0.36, 0.18]} scale={[0.85, 0.76, 0.55]} castShadow><sphereGeometry args={[0.54, 26, 26]} />{stM}</mesh>
      {/* Stomach fundus */}
      <mesh position={[-0.6, 0.74, 0.12]} scale={[0.72, 0.68, 0.58]} castShadow><sphereGeometry args={[0.36, 22, 22]} />{stM}</mesh>
      {/* Pylorus */}
      <mesh position={[0.08, 0.2, 0.22]} scale={[0.65, 0.5, 0.48]} castShadow><sphereGeometry args={[0.28, 16, 16]} />{stM}</mesh>
      {/* Duodenum C-loop */}
      <mesh position={[0.82, -0.1, 0.08]} rotation={[0, 0, 0.3]} scale={[0.45, 1.1, 0.35]} castShadow><torusGeometry args={[0.36, 0.1, 10, 22, Math.PI * 1.6]} />{gtM}</mesh>
      {/* Small intestine loops */}
      <mesh position={[0, -0.42, 0.12]} scale={[1.1, 0.52, 0.7]} castShadow><torusGeometry args={[0.44, 0.1, 10, 26]} />{gtM}</mesh>
      <mesh position={[-0.14, -0.62, 0.02]} scale={[0.88, 0.48, 0.65]} castShadow><torusGeometry args={[0.36, 0.09, 10, 22]} />{gtM}</mesh>
      {/* Large intestine — ascending colon */}
      <mesh position={[0.88, -0.22, 0]} rotation={[0, 0, 0.12]} scale={[0.55, 1.1, 0.5]} castShadow><cylinderGeometry args={[0.12, 0.13, 0.7, 12]} />{gtM}</mesh>
      {/* Transverse colon */}
      <mesh position={[0.3, 0.05, -0.15]} rotation={[0, 0, 1.55]} scale={[0.5, 1.0, 0.45]} castShadow><cylinderGeometry args={[0.12, 0.12, 0.85, 12]} />{gtM}</mesh>
      {/* Sigmoid */}
      <mesh position={[-0.4, -0.82, 0.08]} rotation={[0.3, 0.4, 0.2]} castShadow><torusGeometry args={[0.3, 0.095, 10, 18, Math.PI * 1.2]} />{gtM}</mesh>
    </group>
  );
}

function EndocrineModel({ fade }: { fade?: boolean }) {
  const op = fade ? 0.22 : 1;
  const gM = <meshPhysicalMaterial color="#B8A0D8" roughness={0.52} metalness={0.06} clearcoat={0.18} transparent={fade} opacity={op} />;
  const thyM = <meshPhysicalMaterial color="#90C090" roughness={0.55} metalness={0.05} clearcoat={0.12} transparent={fade} opacity={op} />;
  const adrM = <meshPhysicalMaterial color="#F0A040" roughness={0.5} metalness={0.06} clearcoat={0.15} transparent={fade} opacity={op} />;
  const panM = <meshPhysicalMaterial color="#E0C080" roughness={0.6} metalness={0.04} transparent={fade} opacity={op} />;
  const kidM = <meshPhysicalMaterial color="#A06840" roughness={0.62} metalness={0.04} transparent={fade} opacity={op} />;
  return (
    <group>
      {/* Pituitary — tiny sphere at cranial base */}
      <mesh position={[0, 1.7, 0]} castShadow><sphereGeometry args={[0.14, 14, 14]} />{gM}</mesh>
      {/* Hypothalamus hint above */}
      <mesh position={[0, 1.92, 0]} scale={[0.8, 0.4, 0.7]} castShadow><sphereGeometry args={[0.2, 14, 14]} />{<meshPhysicalMaterial color="#9878C8" roughness={0.6} transparent={fade} opacity={op} />}</mesh>
      {/* Pituitary stalk */}
      <mesh position={[0, 1.78, 0]} castShadow><cylinderGeometry args={[0.03, 0.04, 0.18, 8]} />{gM}</mesh>
      {/* Thyroid — two lobes */}
      <mesh position={[-0.22, 1.22, 0.25]} scale={[0.8, 1.0, 0.6]} castShadow><sphereGeometry args={[0.24, 18, 18]} />{thyM}</mesh>
      <mesh position={[0.22, 1.22, 0.25]} scale={[0.8, 1.0, 0.6]} castShadow><sphereGeometry args={[0.24, 18, 18]} />{thyM}</mesh>
      {/* Thyroid isthmus */}
      <mesh position={[0, 1.18, 0.32]} scale={[0.8, 0.35, 0.45]} castShadow><sphereGeometry args={[0.18, 12, 12]} />{thyM}</mesh>
      {/* Thymus — bilobed, upper chest */}
      <mesh position={[-0.12, 0.88, 0.18]} scale={[0.7, 1.0, 0.5]} castShadow><sphereGeometry args={[0.18, 14, 14]} />{<meshPhysicalMaterial color="#D0C8E8" roughness={0.6} transparent={fade} opacity={op * 0.9} />}</mesh>
      <mesh position={[0.12, 0.88, 0.18]} scale={[0.7, 1.0, 0.5]} castShadow><sphereGeometry args={[0.18, 14, 14]} />{<meshPhysicalMaterial color="#D0C8E8" roughness={0.6} transparent={fade} opacity={op * 0.9} />}</mesh>
      {/* Kidneys — retroperitoneal */}
      <mesh position={[0.52, -0.18, -0.15]} scale={[0.62, 0.88, 0.5]} castShadow><sphereGeometry args={[0.4, 22, 22]} />{kidM}</mesh>
      <mesh position={[-0.52, -0.1, -0.15]} scale={[0.62, 0.88, 0.5]} castShadow><sphereGeometry args={[0.4, 22, 22]} />{kidM}</mesh>
      {/* Adrenal glands — pyramidal, on top of kidneys */}
      <mesh position={[0.5, 0.22, -0.12]} scale={[0.6, 0.7, 0.45]} castShadow><coneGeometry args={[0.14, 0.32, 10]} />{adrM}</mesh>
      <mesh position={[-0.5, 0.3, -0.12]} scale={[0.6, 0.7, 0.45]} castShadow><coneGeometry args={[0.14, 0.32, 10]} />{adrM}</mesh>
      {/* Pancreas — elongated, oblique */}
      <mesh position={[0.1, -0.28, -0.05]} rotation={[0, 0, -0.22]} scale={[0.55, 1.0, 0.4]} castShadow><cylinderGeometry args={[0.1, 0.08, 0.65, 12]} />{panM}</mesh>
      <mesh position={[-0.18, -0.25, -0.02]} scale={[0.8, 0.5, 0.5]} castShadow><sphereGeometry args={[0.16, 12, 12]} />{panM}</mesh>
      {/* Gonads — simplified */}
      <mesh position={[-0.22, -0.95, 0]} castShadow><sphereGeometry args={[0.1, 10, 10]} />{<meshPhysicalMaterial color="#D08080" roughness={0.6} transparent={fade} opacity={op} />}</mesh>
      <mesh position={[0.22, -0.95, 0]} castShadow><sphereGeometry args={[0.1, 10, 10]} />{<meshPhysicalMaterial color="#D08080" roughness={0.6} transparent={fade} opacity={op} />}</mesh>
    </group>
  );
}

function UrinaryModel({ fade }: { fade?: boolean }) {
  const op = fade ? 0.22 : 1;
  const kidM = <meshPhysicalMaterial color="#8B4513" roughness={0.6} metalness={0.04} clearcoat={0.1} transparent={fade} opacity={op} />;
  const cortM = <meshPhysicalMaterial color="#A05A28" roughness={0.65} metalness={0.03} transparent={fade} opacity={op} />;
  const blM = <meshPhysicalMaterial color="#6080C0" roughness={0.55} metalness={0.06} clearcoat={0.15} transparent={fade} opacity={op} />;
  const urM = <meshPhysicalMaterial color="#D0B080" roughness={0.65} metalness={0.03} transparent={fade} opacity={op} />;
  return (
    <group>
      {/* Right kidney (lower) */}
      <mesh position={[0.55, 0.05, -0.1]} scale={[0.62, 0.95, 0.5]} castShadow><sphereGeometry args={[0.45, 26, 26]} />{kidM}</mesh>
      {/* Right kidney medulla hint */}
      <mesh position={[0.55, 0.05, -0.05]} scale={[0.35, 0.7, 0.3]} castShadow><sphereGeometry args={[0.35, 18, 18]} />{cortM}</mesh>
      {/* Right kidney hilum/pelvis */}
      <mesh position={[0.2, 0.05, -0.08]} scale={[0.4, 0.35, 0.3]} castShadow><sphereGeometry args={[0.22, 14, 14]} />{urM}</mesh>
      {/* Left kidney (higher) */}
      <mesh position={[-0.55, 0.18, -0.1]} scale={[0.62, 0.95, 0.5]} castShadow><sphereGeometry args={[0.45, 26, 26]} />{kidM}</mesh>
      <mesh position={[-0.55, 0.18, -0.05]} scale={[0.35, 0.7, 0.3]} castShadow><sphereGeometry args={[0.35, 18, 18]} />{cortM}</mesh>
      <mesh position={[-0.2, 0.18, -0.08]} scale={[0.4, 0.35, 0.3]} castShadow><sphereGeometry args={[0.22, 14, 14]} />{urM}</mesh>
      {/* Right adrenal */}
      <mesh position={[0.54, 0.54, -0.08]} scale={[0.55, 0.65, 0.4]} castShadow><coneGeometry args={[0.13, 0.28, 10]} /><meshPhysicalMaterial color="#F0A040" roughness={0.5} transparent={fade} opacity={op} /></mesh>
      {/* Left adrenal — more semilunar */}
      <mesh position={[-0.54, 0.65, -0.08]} scale={[0.55, 0.65, 0.4]} castShadow><coneGeometry args={[0.13, 0.28, 10]} /><meshPhysicalMaterial color="#F0A040" roughness={0.5} transparent={fade} opacity={op} /></mesh>
      {/* Right ureter */}
      <mesh position={[0.35, -0.45, -0.05]} castShadow><cylinderGeometry args={[0.04, 0.04, 1.0, 8]} />{urM}</mesh>
      {/* Left ureter */}
      <mesh position={[-0.35, -0.38, -0.05]} castShadow><cylinderGeometry args={[0.04, 0.04, 1.0, 8]} />{urM}</mesh>
      {/* Bladder */}
      <mesh position={[0, -1.1, 0.1]} scale={[0.85, 0.78, 0.75]} castShadow><sphereGeometry args={[0.42, 24, 24]} />{blM}</mesh>
      {/* Detrusor muscle surface hint */}
      <mesh position={[0, -1.1, 0.12]} scale={[0.9, 0.82, 0.8]}><sphereGeometry args={[0.45, 18, 18]} /><meshPhysicalMaterial color="#4060A0" roughness={0.7} transparent opacity={0.18} /></mesh>
      {/* Urethra */}
      <mesh position={[0, -1.52, 0.12]} castShadow><cylinderGeometry args={[0.03, 0.035, 0.35, 8]} />{urM}</mesh>
      {/* Aorta (context) */}
      <mesh position={[0.12, 0.4, -0.32]} scale={[0.6, 1, 0.6]} castShadow><cylinderGeometry args={[0.09, 0.1, 1.5, 12]} /><meshPhysicalMaterial color="#CC1010" roughness={0.35} metalness={0.18} transparent={fade} opacity={op * 0.5} /></mesh>
    </group>
  );
}

function LymphaticModel({ fade }: { fade?: boolean }) {
  const op = fade ? 0.22 : 1;
  const spM = <meshPhysicalMaterial color="#6B3070" roughness={0.58} metalness={0.05} clearcoat={0.1} transparent={fade} opacity={op} />;
  const lyM = <meshPhysicalMaterial color="#80C880" roughness={0.5} metalness={0.04} clearcoat={0.1} transparent={fade} opacity={op} />;
  const thyM = <meshPhysicalMaterial color="#D0C8E8" roughness={0.6} metalness={0.03} transparent={fade} opacity={op} />;
  const vM = <meshPhysicalMaterial color="#D0D0F0" roughness={0.7} metalness={0} transparent={fade} opacity={op * 0.6} />;
  return (
    <group>
      {/* Spleen */}
      <mesh position={[-0.72, 0.08, 0]} scale={[0.75, 0.82, 0.6]} castShadow><sphereGeometry args={[0.55, 26, 26]} />{spM}</mesh>
      {/* Splenic notch */}
      <mesh position={[-1.05, 0.32, 0.18]} scale={[0.25, 0.15, 0.4]}><sphereGeometry args={[0.3, 10, 10]} /><meshPhysicalMaterial color="#1a0f3d" transparent opacity={0.6} /></mesh>
      {/* Thymus — upper mediastinum */}
      <mesh position={[-0.1, 0.92, 0.2]} scale={[0.7, 1.0, 0.45]} castShadow><sphereGeometry args={[0.25, 16, 16]} />{thyM}</mesh>
      <mesh position={[0.1, 0.92, 0.2]} scale={[0.7, 1.0, 0.45]} castShadow><sphereGeometry args={[0.25, 16, 16]} />{thyM}</mesh>
      {/* Cervical lymph nodes (cluster) */}
      {[[-0.2,1.62,0.1],[0.2,1.62,0.1],[-0.35,1.5,0.05],[0.35,1.5,0.05]].map((p,i) => (
        <mesh key={i} position={p as [number,number,number]} castShadow><sphereGeometry args={[0.065, 10, 10]} />{lyM}</mesh>
      ))}
      {/* Axillary nodes */}
      {[[-0.88,0.42,0.05],[-0.82,0.28,0.1],[-0.94,0.3,0.0]].map((p,i) => (
        <mesh key={i} position={p as [number,number,number]} castShadow><sphereGeometry args={[0.075, 10, 10]} />{lyM}</mesh>
      ))}
      {/* Para-aortic nodes */}
      {[[0.15,-0.12,-0.05],[-0.15,-0.12,-0.05],[0.15,-0.35,-0.05],[-0.15,-0.35,-0.05]].map((p,i) => (
        <mesh key={i} position={p as [number,number,number]} castShadow><sphereGeometry args={[0.065, 10, 10]} />{lyM}</mesh>
      ))}
      {/* Inguinal nodes */}
      {[[0.32,-1.22,0.12],[-0.32,-1.22,0.12],[0.42,-1.28,0.08],[-0.42,-1.28,0.08]].map((p,i) => (
        <mesh key={i} position={p as [number,number,number]} castShadow><sphereGeometry args={[0.07, 10, 10]} />{lyM}</mesh>
      ))}
      {/* Thoracic duct */}
      <mesh position={[0.08, 0.15, -0.22]} castShadow><cylinderGeometry args={[0.03, 0.03, 2.2, 8]} />{vM}</mesh>
      {/* Cisterna chyli */}
      <mesh position={[0.1, -0.78, -0.18]} scale={[0.5, 0.7, 0.5]} castShadow><sphereGeometry args={[0.1, 10, 10]} />{vM}</mesh>
      {/* Splenic artery */}
      <mesh position={[-0.28, 0.12, -0.08]} rotation={[0, 0, -0.15]} castShadow><cylinderGeometry args={[0.04, 0.04, 0.8, 8]} /><meshPhysicalMaterial color="#CC2020" roughness={0.35} transparent={fade} opacity={op * 0.8} /></mesh>
    </group>
  );
}

function ReproductiveModel({ fade }: { fade?: boolean }) {
  const op = fade ? 0.22 : 1;
  const utM = <meshPhysicalMaterial color="#C06080" roughness={0.55} metalness={0.04} clearcoat={0.12} transparent={fade} opacity={op} />;
  const ovM = <meshPhysicalMaterial color="#D09060" roughness={0.58} metalness={0.03} transparent={fade} opacity={op} />;
  const blM = <meshPhysicalMaterial color="#6080C0" roughness={0.55} metalness={0.06} clearcoat={0.15} transparent={fade} opacity={op} />;
  const vgM = <meshPhysicalMaterial color="#D08090" roughness={0.65} metalness={0.03} transparent={fade} opacity={op} />;
  const faM = <meshPhysicalMaterial color="#D8B0B0" roughness={0.6} metalness={0.03} transparent={fade} opacity={op} />;
  return (
    <group>
      {/* Bladder — anterior to uterus */}
      <mesh position={[0, 0.28, 0.38]} scale={[0.85, 0.75, 0.72]} castShadow><sphereGeometry args={[0.42, 22, 22]} />{blM}</mesh>
      {/* Uterus body — anteverted, anteflexed */}
      <mesh position={[0, -0.08, 0.12]} rotation={[0.35, 0, 0]} scale={[0.7, 1.0, 0.65]} castShadow><sphereGeometry args={[0.42, 24, 24]} />{utM}</mesh>
      {/* Uterus fundus */}
      <mesh position={[0, 0.28, 0.0]} scale={[0.65, 0.55, 0.55]} castShadow><sphereGeometry args={[0.35, 20, 20]} />{utM}</mesh>
      {/* Cervix */}
      <mesh position={[0, -0.42, -0.05]} rotation={[0.2, 0, 0]} castShadow><cylinderGeometry args={[0.14, 0.16, 0.36, 14]} />{<meshPhysicalMaterial color="#A04060" roughness={0.6} metalness={0.03} transparent={fade} opacity={op} />}</mesh>
      {/* Vagina */}
      <mesh position={[0, -0.72, 0.05]} rotation={[0.15, 0, 0]} castShadow><cylinderGeometry args={[0.1, 0.14, 0.4, 12]} />{vgM}</mesh>
      {/* Right ovary */}
      <mesh position={[0.68, 0.18, -0.05]} scale={[0.7, 0.55, 0.6]} castShadow><sphereGeometry args={[0.22, 16, 16]} />{ovM}</mesh>
      {/* Left ovary */}
      <mesh position={[-0.68, 0.18, -0.05]} scale={[0.7, 0.55, 0.6]} castShadow><sphereGeometry args={[0.22, 16, 16]} />{ovM}</mesh>
      {/* Right fallopian tube — ampulla curves over ovary */}
      <mesh position={[0.42, 0.28, 0.02]} rotation={[0, 0, 0.8]} castShadow><cylinderGeometry args={[0.04, 0.05, 0.55, 10]} />{faM}</mesh>
      <mesh position={[0.75, 0.35, 0.05]} scale={[0.6, 0.5, 0.5]} castShadow><torusGeometry args={[0.2, 0.04, 8, 16, Math.PI]} />{faM}</mesh>
      {/* Left fallopian tube */}
      <mesh position={[-0.42, 0.28, 0.02]} rotation={[0, 0, -0.8]} castShadow><cylinderGeometry args={[0.04, 0.05, 0.55, 10]} />{faM}</mesh>
      <mesh position={[-0.75, 0.35, 0.05]} scale={[0.6, 0.5, 0.5]} castShadow><torusGeometry args={[0.2, 0.04, 8, 16, Math.PI]} />{faM}</mesh>
      {/* Broad ligament hints */}
      <mesh position={[0.34, 0.1, 0.02]} rotation={[0, 0, 0.3]} scale={[0.2, 0.6, 0.1]}><boxGeometry args={[1, 1, 1]} /><meshPhysicalMaterial color="#D8C0C8" roughness={1} transparent opacity={0.18} /></mesh>
      <mesh position={[-0.34, 0.1, 0.02]} rotation={[0, 0, -0.3]} scale={[0.2, 0.6, 0.1]}><boxGeometry args={[1, 1, 1]} /><meshPhysicalMaterial color="#D8C0C8" roughness={1} transparent opacity={0.18} /></mesh>
      {/* Uterine arteries */}
      <mesh position={[0.32, -0.08, 0.08]} rotation={[0, 0, 0.6]} castShadow><cylinderGeometry args={[0.025, 0.025, 0.5, 8]} /><meshPhysicalMaterial color="#CC1010" roughness={0.35} transparent={fade} opacity={op * 0.9} /></mesh>
      <mesh position={[-0.32, -0.08, 0.08]} rotation={[0, 0, -0.6]} castShadow><cylinderGeometry args={[0.025, 0.025, 0.5, 8]} /><meshPhysicalMaterial color="#CC1010" roughness={0.35} transparent={fade} opacity={op * 0.9} /></mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Model selector
// ─────────────────────────────────────────────────────────────────────────────
function SystemModel({ systemId }: { systemId: string }) {
  const models: Record<string, React.ReactElement> = {
    cardiovascular: <HeartModel />,
    skeletal:       <HumerusModel />,
    nervous:        <BrainModel />,
    respiratory:    <LungsModel />,
    muscular:       <MuscleModel />,
    digestive:      <DigestiveModel />,
    endocrine:      <EndocrineModel />,
    urinary:        <UrinaryModel />,
    lymphatic:      <LymphaticModel />,
    reproductive:   <ReproductiveModel />,
  };
  return models[systemId] ?? <HumerusModel />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene
// ─────────────────────────────────────────────────────────────────────────────
function Scene({
  system, showLabels, onLabelSelect, selectedLabel, visibleLayers, isInteracting,
}: {
  system: AnatomySystem;
  showLabels: boolean;
  onLabelSelect: (l: StructureLabel) => void;
  selectedLabel: string | null;
  visibleLayers: Set<string>;
  isInteracting: boolean;
}) {
  const labels = useMemo(
    () => system.structures.flatMap(s => s.labels).filter(l => {
      if (!showLabels) return false;
      if (visibleLayers.size === 0) return true;
      const layer = l.layer ?? "organ";
      return visibleLayers.has(layer) || visibleLayers.has("all");
    }),
    [system, showLabels, visibleLayers]
  );

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 7, 5]} intensity={1.9} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-3, 2, -4]} intensity={0.6} color="#c0d0ff" />
      <pointLight position={[-3, 1, -3]} intensity={0.7} color="#a78bfa" />
      <pointLight position={[3, -2, 3]} intensity={0.45} color="#f0f4ff" />
      <Environment preset="studio" />

      <group>
        <SystemModel systemId={system.id} />
        {labels.map(label => (
          <Label3D
            key={label.id}
            label={label}
            selected={selectedLabel === label.id}
            onSelect={onLabelSelect}
            hidden={false}
          />
        ))}
      </group>

      <ContactShadows position={[0, -2.1, 0]} opacity={0.3} scale={5} blur={2.5} far={3} />
      <OrbitControls
        makeDefault
        enablePan={true}
        minDistance={2.2}
        maxDistance={9}
        autoRotate={!isInteracting}
        autoRotateSpeed={0.5}
        panSpeed={0.8}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer toggle control (shown inside the viewer)
// ─────────────────────────────────────────────────────────────────────────────
const ALL_LAYERS = [
  { id: "bone",   label: "Bone",    emoji: "🦴" },
  { id: "muscle", label: "Muscle",  emoji: "💪" },
  { id: "vessel", label: "Vessels", emoji: "🩸" },
  { id: "nerve",  label: "Nerves",  emoji: "⚡" },
  { id: "organ",  label: "Organs",  emoji: "🫀" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public component
// ─────────────────────────────────────────────────────────────────────────────
// Sketchfab embedded iframe viewer
// ─────────────────────────────────────────────────────────────────────────────
function SketchfabViewer({ modelId, title }: { modelId: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const embedUrl =
    `https://sketchfab.com/models/${modelId}/embed` +
    `?autostart=1&preload=1&ui_theme=dark&ui_controls=1` +
    `&ui_infos=0&ui_watermark_link=0&ui_watermark=0` +
    `&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0`;

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden bg-[#0d0a22]">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-400">Loading Sketchfab model…</span>
        </div>
      )}
      <iframe
        title={title}
        src={embedUrl}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        className="w-full h-full border-0"
        onLoad={() => setLoaded(true)}
      />
      <div className="absolute bottom-2 right-2 pointer-events-none">
        <span className="text-[10px] text-slate-600 bg-black/40 px-2 py-0.5 rounded-full">
          Powered by Sketchfab
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ModelViewer3D({
  system,
  showLabels,
  onLabelSelect,
  selectedLabel,
}: {
  system: AnatomySystem;
  showLabels: boolean;
  onLabelSelect: (l: StructureLabel) => void;
  selectedLabel: string | null;
}) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [viewMode, setViewMode] = useState<"3d" | "sketchfab">("3d");
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(["bone", "muscle", "vessel", "nerve", "organ"])
  );

  // Reset to 3D view when system changes
  React.useEffect(() => { setViewMode("3d"); }, [system.id]);

  function toggleLayer(id: string) {
    setVisibleLayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div
      className="w-full h-full relative rounded-xl overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a0618 0%, #0d0a22 50%, #080518 100%)" }}
      onPointerDown={() => { if (viewMode === "3d") setIsInteracting(true); }}
      onPointerUp={() => setIsInteracting(false)}
    >
      {/* View mode toggle — top right, only shown when Sketchfab model available */}
      {system.sketchfabId && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-full p-0.5 border border-white/10">
          <button
            onClick={() => setViewMode("3d")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
              viewMode === "3d"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-900/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ⬡ Procedural
          </button>
          <button
            onClick={() => setViewMode("sketchfab")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
              viewMode === "sketchfab"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-900/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ✦ Sketchfab
          </button>
        </div>
      )}

      {/* Sketchfab iframe */}
      {viewMode === "sketchfab" && system.sketchfabId ? (
        <SketchfabViewer modelId={system.sketchfabId} title={system.name} />
      ) : (
        <>
          <Canvas
            camera={{ position: [0, 0, 5.2], fov: 40 }}
            shadows
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            style={{ background: "transparent" }}
            dpr={[1, 2]}
          >
            <Suspense fallback={null}>
              <Scene
                system={system}
                showLabels={showLabels}
                onLabelSelect={onLabelSelect}
                selectedLabel={selectedLabel}
                visibleLayers={visibleLayers}
                isInteracting={isInteracting}
              />
            </Suspense>
          </Canvas>

          {/* Layer toggles — bottom strip */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
            {ALL_LAYERS.map(layer => (
              <button
                key={layer.id}
                onClick={e => { e.stopPropagation(); toggleLayer(layer.id); }}
                onPointerDown={e => e.stopPropagation()}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide transition-all ${
                  visibleLayers.has(layer.id)
                    ? "bg-violet-600/50 border border-violet-400/50 text-violet-200"
                    : "bg-white/5 border border-white/8 text-slate-600"
                }`}
              >
                <span className="text-xs leading-none">{layer.emoji}</span>
                <span className="hidden sm:inline">{layer.label}</span>
              </button>
            ))}
          </div>

          {/* Touch hint */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 pointer-events-none select-none hidden md:block">
            Drag to rotate · Scroll to zoom · Two-finger pan
          </div>
        </>
      )}
    </div>
  );
}
