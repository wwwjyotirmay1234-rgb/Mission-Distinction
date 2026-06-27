import React, { Suspense, useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";
import { Eye, EyeOff, Layers, Crosshair, RotateCcw, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import type { AnatomySystem, StructureLabel } from "@/data/anatomyData";

// ─────────────────────────────────────────────────────────────────────────────
// Layers
// ─────────────────────────────────────────────────────────────────────────────
const LAYERS = [
  { id: "bone",   label: "Skeleton", icon: "🦴", color: "#FACC15" },
  { id: "muscle", label: "Muscles",  icon: "💪", color: "#F97316" },
  { id: "vessel", label: "Vessels",  icon: "🩸", color: "#EF4444" },
  { id: "nerve",  label: "Nerves",   icon: "⚡", color: "#EAB308" },
  { id: "organ",  label: "Organs",   icon: "🫀", color: "#A855F7" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Model Render Props
// ─────────────────────────────────────────────────────────────────────────────
interface MRP { globalOp: number; isolated: string | null; hidden: Set<string> }

function lo(layer: string, p: MRP): number {
  if (p.hidden.has(layer)) return 0;
  if (p.isolated && p.isolated !== layer) return Math.min(p.globalOp, 0.07);
  return p.globalOp;
}
function lv(layer: string, p: MRP): boolean { return !p.hidden.has(layer); }

// ─────────────────────────────────────────────────────────────────────────────
// VesselTube — CatmullRom spline tube for realistic vessels / ducts
// ─────────────────────────────────────────────────────────────────────────────
function VesselTube({ pts, r = 0.022, color, op = 1, seg = 22 }: {
  pts: [number, number, number][];
  r?: number; color: string; op?: number; seg?: number;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const geom = useMemo(() => new THREE.TubeGeometry(curve, seg, r, 8, false), [curve, r, seg]);
  const tr = op < 0.999;
  return (
    <mesh geometry={geom} castShadow>
      <meshPhysicalMaterial color={color} roughness={0.3} metalness={0.2} clearcoat={0.5} transparent={tr} opacity={op} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HEART MODEL — anatomically detailed with real coronary vessel paths
// ─────────────────────────────────────────────────────────────────────────────
function HeartModel({ p }: { p: MRP }) {
  const oOp = lo("organ", p); const vOp = lo("vessel", p);
  const oVis = lv("organ", p); const vVis = lv("vessel", p);
  const tr = (op: number) => op < 0.999;
  const lvM = (op: number) => <meshPhysicalMaterial color="#7B0000" roughness={0.45} metalness={0.12} clearcoat={0.35} transparent={tr(op)} opacity={op} />;
  const rvM = (op: number) => <meshPhysicalMaterial color="#9B1010" roughness={0.5} metalness={0.1} clearcoat={0.2} transparent={tr(op)} opacity={op} />;
  const atM = (op: number) => <meshPhysicalMaterial color="#6B0000" roughness={0.5} metalness={0.1} transparent={tr(op)} opacity={op} />;
  const ftM = (op: number) => <meshPhysicalMaterial color="#D4A060" roughness={0.75} transparent opacity={Math.min(op, 0.5)} />;
  return (
    <group rotation={[0.08, 0.18, 0.12]}>
      {oVis && <>
        <mesh position={[-0.28, -0.15, 0]} scale={[0.92, 1.18, 0.85]} castShadow><sphereGeometry args={[0.58, 36, 36]} />{lvM(oOp)}</mesh>
        <mesh position={[0.3, -0.22, 0.08]} scale={[0.78, 1.05, 0.68]} castShadow><sphereGeometry args={[0.52, 32, 32]} />{rvM(oOp)}</mesh>
        <mesh position={[-0.3, 0.48, -0.22]} scale={[0.88, 0.72, 0.78]} castShadow><sphereGeometry args={[0.38, 24, 24]} />{atM(oOp)}</mesh>
        <mesh position={[0.32, 0.44, -0.1]} scale={[0.82, 0.7, 0.72]} castShadow><sphereGeometry args={[0.4, 24, 24]} />{atM(oOp)}</mesh>
        <mesh position={[0.56, 0.5, 0.04]} scale={[0.3, 0.26, 0.26]}><sphereGeometry args={[0.38, 16, 16]} />{atM(oOp)}</mesh>
        <mesh position={[-0.36, -0.72, 0.04]} scale={[0.36, 0.24, 0.28]}><sphereGeometry args={[0.6, 16, 16]} />{lvM(oOp)}</mesh>
        <mesh position={[0.05, -0.1, 0.42]} scale={[0.54, 0.2, 0.26]}><sphereGeometry args={[0.38, 12, 12]} />{ftM(oOp)}</mesh>
        <mesh position={[0.22, -0.36, 0.36]} scale={[0.34, 0.16, 0.2]}><sphereGeometry args={[0.3, 12, 12]} />{ftM(oOp)}</mesh>
      </>}
      {vVis && <>
        {/* Ascending aorta + arch */}
        <VesselTube pts={[[-0.1, 0.52, 0.18], [-0.06, 0.82, 0.1], [0.06, 1.06, -0.02], [0.22, 1.15, -0.12]]} r={0.1} color="#CC0000" op={vOp} />
        <VesselTube pts={[[0.22, 1.15, -0.12], [0.38, 1.18, -0.22], [0.44, 1.1, -0.32], [0.4, 0.88, -0.38]]} r={0.09} color="#CC0000" op={vOp} />
        {/* Brachiocephalic branches */}
        <VesselTube pts={[[0.22, 1.15, -0.12], [0.3, 1.3, -0.05], [0.28, 1.5, 0.02]]} r={0.052} color="#CC0000" op={vOp} />
        <VesselTube pts={[[0.3, 1.18, -0.18], [0.2, 1.32, -0.15]]} r={0.038} color="#CC0000" op={vOp} />
        {/* Pulmonary trunk */}
        <VesselTube pts={[[0.14, 0.56, 0.22], [0.14, 0.84, 0.3], [0.04, 1.02, 0.28]]} r={0.09} color="#2040C0" op={vOp} />
        <VesselTube pts={[[0.04, 1.02, 0.28], [-0.26, 1.04, 0.22], [-0.52, 0.88, 0.08]]} r={0.058} color="#2040C0" op={vOp} />
        <VesselTube pts={[[0.04, 1.02, 0.28], [0.4, 1.02, 0.2], [0.62, 0.88, 0.06]]} r={0.058} color="#2040C0" op={vOp} />
        {/* SVC + IVC */}
        <VesselTube pts={[[0.44, 1.22, -0.18], [0.42, 0.88, -0.2], [0.38, 0.65, -0.12]]} r={0.08} color="#1020A0" op={vOp} />
        <VesselTube pts={[[0.38, -0.28, -0.38], [0.36, 0.1, -0.3], [0.32, 0.42, -0.12]]} r={0.088} color="#1020A0" op={vOp} />
        {/* Pulmonary veins into LA */}
        <VesselTube pts={[[-0.74, 0.5, -0.34], [-0.52, 0.52, -0.28], [-0.3, 0.48, -0.22]]} r={0.052} color="#1020A0" op={vOp} />
        <VesselTube pts={[[-0.72, 0.3, -0.38], [-0.52, 0.38, -0.3], [-0.3, 0.42, -0.25]]} r={0.048} color="#1020A0" op={vOp} />
        <VesselTube pts={[[0.72, 0.5, -0.28], [0.52, 0.5, -0.22], [0.32, 0.44, -0.1]]} r={0.048} color="#1020A0" op={vOp} />
        {/* LAD — anterior interventricular groove */}
        <VesselTube pts={[[-0.14, 0.34, 0.52], [-0.2, 0.12, 0.56], [-0.26, -0.1, 0.54], [-0.31, -0.32, 0.48], [-0.34, -0.56, 0.34], [-0.36, -0.72, 0.2]]} r={0.018} color="#CC1010" op={vOp} seg={28} />
        {/* LAD diagonal branch */}
        <VesselTube pts={[[-0.22, 0.04, 0.54], [-0.38, -0.08, 0.42], [-0.5, -0.22, 0.22]]} r={0.012} color="#CC1010" op={vOp} />
        {/* Septal perforators */}
        <VesselTube pts={[[-0.24, -0.02, 0.52], [-0.22, -0.05, 0.3]]} r={0.009} color="#CC1010" op={vOp} />
        <VesselTube pts={[[-0.28, -0.18, 0.48], [-0.26, -0.22, 0.28]]} r={0.009} color="#CC1010" op={vOp} />
        {/* RCA — right AV groove */}
        <VesselTube pts={[[0.1, 0.4, 0.36], [0.38, 0.22, 0.3], [0.52, -0.04, 0.14], [0.5, -0.3, -0.06], [0.38, -0.56, -0.2], [0.18, -0.72, -0.3]]} r={0.016} color="#CC1010" op={vOp} seg={28} />
        {/* RCA marginal branch */}
        <VesselTube pts={[[0.52, -0.04, 0.14], [0.58, -0.2, 0.25], [0.52, -0.4, 0.3]]} r={0.010} color="#CC1010" op={vOp} />
        {/* LCx — left AV groove */}
        <VesselTube pts={[[-0.14, 0.34, 0.52], [-0.32, 0.38, 0.36], [-0.5, 0.22, 0.1], [-0.52, -0.06, -0.1], [-0.44, -0.3, -0.25]]} r={0.015} color="#CC1010" op={vOp} seg={24} />
        {/* LCx obtuse marginal */}
        <VesselTube pts={[[-0.5, 0.22, 0.1], [-0.6, 0.05, 0.2], [-0.62, -0.18, 0.22]]} r={0.011} color="#CC1010" op={vOp} />
        {/* Coronary sinus (vein) */}
        <VesselTube pts={[[-0.36, -0.72, 0.2], [-0.28, -0.42, 0.38], [-0.18, -0.16, 0.44], [-0.04, 0.1, 0.38], [0.04, 0.32, -0.22]]} r={0.013} color="#0A1A80" op={vOp} seg={22} />
        {/* Great cardiac vein */}
        <VesselTube pts={[[-0.14, 0.34, 0.52], [-0.28, 0.24, 0.44], [-0.38, 0.06, 0.32]]} r={0.011} color="#0A1A80" op={vOp} />
      </>}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETAL MODEL
// ─────────────────────────────────────────────────────────────────────────────
function SkeletalModel({ p }: { p: MRP }) {
  const op = lo("bone", p); const vis = lv("bone", p);
  const tr = op < 0.999;
  const bM = <meshPhysicalMaterial color="#F2EACC" roughness={0.68} metalness={0} clearcoat={0.1} transparent={tr} opacity={op} />;
  const cM = <meshPhysicalMaterial color="#E8E0C0" roughness={0.72} metalness={0} transparent={tr} opacity={op} />;
  if (!vis) return null;
  return (
    <group>
      <mesh position={[0, 2.0, 0]} castShadow><sphereGeometry args={[0.62, 32, 32]} />{bM}</mesh>
      <mesh position={[0, 1.72, 0.28]} scale={[0.9, 0.65, 0.85]}><sphereGeometry args={[0.44, 20, 20]} />{bM}</mesh>
      <mesh position={[0, 1.52, 0.38]} scale={[0.72, 0.28, 0.55]}><sphereGeometry args={[0.42, 16, 16]} />{bM}</mesh>
      {[-0.1,-0.3,-0.5,-0.7,-0.9,-1.08,-1.25,-1.42,-1.58,-1.72,-1.86,-1.98].map((y, i) => (
        <mesh key={i} position={[0, y + 1.25, -0.05]} scale={[i<5?0.24:0.28, 0.14, 0.18]} castShadow>
          <boxGeometry args={[1, 1, 1]} />{bM}
        </mesh>
      ))}
      {[-0.05,-0.2,-0.38,-0.55,-0.72,-0.88,-1.04,-1.18,-1.3,-1.42,-1.5,-1.56].map((y, i) => (
        <React.Fragment key={i}>
          <VesselTube pts={[[0.12, y+1.15, 0.08],[0.5, y+1.1, 0.28],[0.7, y+1.0, 0.1],[0.6, y+0.92, -0.12]]} r={0.038} color="#EDEAC8" op={op} seg={14}/>
          <VesselTube pts={[[-0.12, y+1.15, 0.08],[-0.5, y+1.1, 0.28],[-0.7, y+1.0, 0.1],[-0.6, y+0.92, -0.12]]} r={0.038} color="#EDEAC8" op={op} seg={14}/>
        </React.Fragment>
      ))}
      <mesh position={[0, 0.7, 0.3]} scale={[0.14, 1.0, 0.18]}><boxGeometry args={[1,1,1]} />{bM}</mesh>
      <mesh position={[0, -1.05, -0.02]} scale={[1.0, 0.38, 0.78]} castShadow><sphereGeometry args={[0.62, 24, 24]} />{bM}</mesh>
      <mesh position={[0, -1.18, -0.32]} scale={[0.34, 0.5, 0.22]} castShadow><sphereGeometry args={[0.5, 16, 16]} />{cM}</mesh>
      <VesselTube pts={[[0.06, 1.3, 0.22],[0.38, 1.38, 0.14],[0.65, 1.28, 0.02]]} r={0.055} color="#F2EACC" op={op}/>
      <VesselTube pts={[[-0.06, 1.3, 0.22],[-0.38, 1.38, 0.14],[-0.65, 1.28, 0.02]]} r={0.055} color="#F2EACC" op={op}/>
      <mesh position={[0.72, 1.12, -0.32]} scale={[0.36, 0.45, 0.1]} castShadow><boxGeometry args={[1,1,1]} />{cM}</mesh>
      <mesh position={[-0.72, 1.12, -0.32]} scale={[0.36, 0.45, 0.1]} castShadow><boxGeometry args={[1,1,1]} />{cM}</mesh>
      <mesh position={[0.42, -1.32, -0.02]} castShadow><sphereGeometry args={[0.2, 16, 16]} />{bM}</mesh>
      <mesh position={[-0.42, -1.32, -0.02]} castShadow><sphereGeometry args={[0.2, 16, 16]} />{bM}</mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAIN MODEL
// ─────────────────────────────────────────────────────────────────────────────
function BrainModel({ p }: { p: MRP }) {
  const nOp = lo("nerve", p); const nVis = lv("nerve", p);
  const oOp = lo("organ", p); const oVis = lv("organ", p);
  const tr = (op: number) => op < 0.999;
  const cxM = (op: number) => <meshPhysicalMaterial color="#D4A8A0" roughness={0.62} metalness={0} clearcoat={0.06} transparent={tr(op)} opacity={op} />;
  const cbM = (op: number) => <meshPhysicalMaterial color="#C09898" roughness={0.7} metalness={0} transparent={tr(op)} opacity={op} />;
  const bsM = (op: number) => <meshPhysicalMaterial color="#B88888" roughness={0.65} metalness={0} transparent={tr(op)} opacity={op} />;
  const gyri: [number,number,number][] = [
    [-0.38,0.62,0.4],[-0.55,0.3,0.4],[-0.62,0.0,0.3],[-0.5,-0.28,0.2],
    [0.38,0.62,0.4],[0.55,0.3,0.4],[0.62,0.0,0.3],[0.5,-0.28,0.2],
    [-0.3,0.82,-0.1],[0.3,0.82,-0.1],[-0.5,0.48,-0.42],[0.5,0.48,-0.42],
    [-0.48,-0.1,-0.48],[0.48,-0.1,-0.48],
  ];
  return (
    <group>
      {oVis && <>
        <mesh position={[-0.3, 0.12, 0]} scale={[0.78, 0.88, 0.98]} castShadow><sphereGeometry args={[0.75, 32, 32]} />{cxM(oOp)}</mesh>
        <mesh position={[0.3, 0.12, 0]} scale={[0.78, 0.88, 0.98]} castShadow><sphereGeometry args={[0.75, 32, 32]} />{cxM(oOp)}</mesh>
        <mesh position={[0, 0.35, 0.12]} scale={[0.06, 0.72, 0.85]}><sphereGeometry args={[0.6, 12, 12]} /><meshPhysicalMaterial color="#C89898" roughness={0.7} transparent={tr(oOp)} opacity={oOp} /></mesh>
        {gyri.map(([x,y,z], i) => (
          <mesh key={i} position={[x,y,z]} scale={[0.22,0.12,0.18]}><sphereGeometry args={[0.45,10,10]} />{cxM(oOp)}</mesh>
        ))}
        <mesh position={[0,-0.52,-0.58]} scale={[0.82,0.52,0.72]} castShadow><sphereGeometry args={[0.58,24,24]} />{cbM(oOp)}</mesh>
        <mesh position={[-0.32,-0.5,-0.55]} scale={[0.55,0.38,0.5]}><sphereGeometry args={[0.48,18,18]} />{cbM(oOp)}</mesh>
        <mesh position={[0.32,-0.5,-0.55]} scale={[0.55,0.38,0.5]}><sphereGeometry args={[0.48,18,18]} />{cbM(oOp)}</mesh>
        <mesh position={[0,-0.55,-0.32]} scale={[0.32,0.55,0.32]}><sphereGeometry args={[0.45,16,16]} />{bsM(oOp)}</mesh>
        <mesh position={[0,-0.88,-0.2]} scale={[0.25,0.38,0.25]}><sphereGeometry args={[0.42,14,14]} />{bsM(oOp)}</mesh>
        <mesh position={[-0.85,-0.18,0.08]} scale={[0.42,0.38,0.55]}><sphereGeometry args={[0.55,20,20]} />{cxM(oOp)}</mesh>
        <mesh position={[0.85,-0.18,0.08]} scale={[0.42,0.38,0.55]}><sphereGeometry args={[0.55,20,20]} />{cxM(oOp)}</mesh>
      </>}
      {nVis && [
        { pts: [[0,-0.92,-0.08],[0,-1.3,0.1]] as [number,number,number][], c: "#F0D050" },
        { pts: [[-0.18,-0.72,0.22],[-0.3,-1.1,0.4]] as [number,number,number][], c: "#F0D050" },
        { pts: [[0.18,-0.72,0.22],[0.3,-1.1,0.4]] as [number,number,number][], c: "#F0D050" },
      ].map((n, i) => <VesselTube key={i} pts={n.pts} r={0.022} color={n.c} op={nOp} />)}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LUNGS MODEL
// ─────────────────────────────────────────────────────────────────────────────
function LungsModel({ p }: { p: MRP }) {
  const op = lo("organ", p); const vis = lv("organ", p);
  const vOp = lo("vessel", p); const vVis = lv("vessel", p);
  if (!vis && !vVis) return null;
  const lM = (o: number) => <meshPhysicalMaterial color="#E07878" roughness={0.55} metalness={0.04} clearcoat={0.05} transparent opacity={Math.min(o, 0.88)} />;
  return (
    <group>
      {vis && <>
        <mesh position={[-0.72, 0.15, 0]} scale={[0.7, 1.35, 0.78]} castShadow><sphereGeometry args={[0.65, 28, 28]} />{lM(op)}</mesh>
        <mesh position={[-0.68, -0.62, 0.04]} scale={[0.6, 0.78, 0.65]} castShadow><sphereGeometry args={[0.58, 24, 24]} />{lM(op)}</mesh>
        <mesh position={[0.72, 0.22, 0]} scale={[0.72, 1.28, 0.78]} castShadow><sphereGeometry args={[0.65, 28, 28]} />{lM(op)}</mesh>
        <mesh position={[0.68, -0.55, 0.04]} scale={[0.62, 0.75, 0.65]} castShadow><sphereGeometry args={[0.58, 24, 24]} />{lM(op)}</mesh>
        <mesh position={[0.88, -0.08, 0.22]} scale={[0.38, 0.55, 0.42]}><sphereGeometry args={[0.52, 18, 18]} />{lM(op)}</mesh>
        <mesh position={[0, 1.08, -0.05]} scale={[0.14, 0.45, 0.14]} castShadow>
          <cylinderGeometry args={[1, 1, 1, 12]} />
          <meshPhysicalMaterial color="#D0C080" roughness={0.7} transparent={op < 0.999} opacity={op} />
        </mesh>
        <VesselTube pts={[[0, 0.65, -0.05],[-0.2, 0.48, -0.06],[-0.55, 0.38, -0.05]]} r={0.065} color="#D0C080" op={op} />
        <VesselTube pts={[[0, 0.65, -0.05],[0.2, 0.48, -0.06],[0.58, 0.38, -0.05]]} r={0.07} color="#D0C080" op={op} />
      </>}
      {vVis && <>
        <VesselTube pts={[[-0.28, 0.38, 0.18],[-0.52, 0.28, 0.1],[-0.72, 0.15, 0]]} r={0.06} color="#CC0000" op={vOp} />
        <VesselTube pts={[[0.28, 0.38, 0.18],[0.52, 0.28, 0.1],[0.72, 0.22, 0]]} r={0.065} color="#CC0000" op={vOp} />
        <VesselTube pts={[[-0.72, 0.15, 0],[-0.82, -0.15, 0],[-0.78, -0.55, 0.08]]} r={0.048} color="#1020A0" op={vOp} />
        <VesselTube pts={[[0.72, 0.22, 0],[0.82, -0.12, 0],[0.78, -0.52, 0.08]]} r={0.048} color="#1020A0" op={vOp} />
      </>}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MUSCULAR MODEL
// ─────────────────────────────────────────────────────────────────────────────
function MuscleModel({ p }: { p: MRP }) {
  const op = lo("muscle", p); const vis = lv("muscle", p);
  const tr = op < 0.999;
  const mM = <meshPhysicalMaterial color="#8B1A1A" roughness={0.55} metalness={0.06} clearcoat={0.1} transparent={tr} opacity={op} />;
  if (!vis) return null;
  return (
    <group>
      <mesh position={[-0.42, 0.55, 0.28]} scale={[0.62, 0.72, 0.32]} castShadow><sphereGeometry args={[0.55, 20, 20]} />{mM}</mesh>
      <mesh position={[0.42, 0.55, 0.28]} scale={[0.62, 0.72, 0.32]} castShadow><sphereGeometry args={[0.55, 20, 20]} />{mM}</mesh>
      <mesh position={[-0.88, 0.85, 0.08]} scale={[0.4, 0.5, 0.42]} castShadow><sphereGeometry args={[0.48, 16, 16]} />{mM}</mesh>
      <mesh position={[0.88, 0.85, 0.08]} scale={[0.4, 0.5, 0.42]} castShadow><sphereGeometry args={[0.48, 16, 16]} />{mM}</mesh>
      <mesh position={[-1.0, 0.38, 0.12]} scale={[0.28, 0.55, 0.28]} castShadow><sphereGeometry args={[0.45, 16, 16]} />{mM}</mesh>
      <mesh position={[1.0, 0.38, 0.12]} scale={[0.28, 0.55, 0.28]} castShadow><sphereGeometry args={[0.45, 16, 16]} />{mM}</mesh>
      <mesh position={[-0.15, -0.08, 0.32]} scale={[0.2, 0.85, 0.2]}><boxGeometry args={[1, 1, 1]} />{mM}</mesh>
      <mesh position={[0.15, -0.08, 0.32]} scale={[0.2, 0.85, 0.2]}><boxGeometry args={[1, 1, 1]} />{mM}</mesh>
      <mesh position={[-0.45, -0.12, 0.22]} scale={[0.28, 0.65, 0.22]}><sphereGeometry args={[0.5, 14, 14]} />{mM}</mesh>
      <mesh position={[0.45, -0.12, 0.22]} scale={[0.28, 0.65, 0.22]}><sphereGeometry args={[0.5, 14, 14]} />{mM}</mesh>
      <mesh position={[0, 0.98, -0.22]} scale={[0.92, 0.45, 0.18]} castShadow><sphereGeometry args={[0.52, 18, 18]} />{mM}</mesh>
      <mesh position={[-0.38, -1.0, -0.35]} scale={[0.55, 0.55, 0.48]} castShadow><sphereGeometry args={[0.5, 16, 16]} />{mM}</mesh>
      <mesh position={[0.38, -1.0, -0.35]} scale={[0.55, 0.55, 0.48]} castShadow><sphereGeometry args={[0.5, 16, 16]} />{mM}</mesh>
      <mesh position={[-0.35, -1.55, 0.15]} scale={[0.38, 0.65, 0.35]} castShadow><sphereGeometry args={[0.5, 16, 16]} />{mM}</mesh>
      <mesh position={[0.35, -1.55, 0.15]} scale={[0.38, 0.65, 0.35]} castShadow><sphereGeometry args={[0.5, 16, 16]} />{mM}</mesh>
      <VesselTube pts={[[-0.15,-0.85,0.32],[-0.15,-1.05,0.22]]} r={0.04} color="#C8A868" op={op}/>
      <VesselTube pts={[[0.15,-0.85,0.32],[0.15,-1.05,0.22]]} r={0.04} color="#C8A868" op={op}/>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIGESTIVE MODEL
// ─────────────────────────────────────────────────────────────────────────────
function DigestiveModel({ p }: { p: MRP }) {
  const op = lo("organ", p); const vis = lv("organ", p);
  const vOp = lo("vessel", p); const vVis = lv("vessel", p);
  const tr = (o: number) => o < 0.999;
  if (!vis && !vVis) return null;
  return (
    <group>
      {vis && <>
        <mesh position={[0.52, 0.42, 0.08]} scale={[0.82, 0.55, 0.62]} castShadow><sphereGeometry args={[0.62, 24, 24]} /><meshPhysicalMaterial color="#8B3A1A" roughness={0.6} metalness={0.05} clearcoat={0.12} transparent={tr(op)} opacity={op} /></mesh>
        <mesh position={[0.58, 0.12, 0.22]} scale={[0.18, 0.28, 0.18]}><sphereGeometry args={[0.5, 12, 12]} /><meshPhysicalMaterial color="#6B8040" roughness={0.6} transparent={tr(op)} opacity={op} /></mesh>
        <mesh position={[-0.28, 0.22, 0.12]} scale={[0.58, 0.62, 0.45]} castShadow><sphereGeometry args={[0.55, 20, 20]} /><meshPhysicalMaterial color="#C06040" roughness={0.58} metalness={0.04} transparent={tr(op)} opacity={op} /></mesh>
        <mesh position={[0.08, -0.02, -0.15]} scale={[0.55, 0.18, 0.22]}><sphereGeometry args={[0.42, 14, 14]} /><meshPhysicalMaterial color="#D09060" roughness={0.65} transparent={tr(op)} opacity={op} /></mesh>
        <VesselTube pts={[[-0.1,-0.3,0.22],[-0.35,-0.45,0.18],[-0.45,-0.65,0.08],[-0.22,-0.78,0],[0.12,-0.8,0.06],[0.38,-0.65,0.16],[0.42,-0.45,0.22],[0.2,-0.32,0.28],[-0.05,-0.35,0.3]]} r={0.065} color="#E8A888" op={op}/>
        <VesselTube pts={[[0.52,-0.92,0.1],[0.55,-0.55,0.1],[0.52,-0.22,0.1],[0.42,0.02,0.08],[0.12,0.18,0.08],[-0.18,0.18,0.08],[-0.42,0.08,0.08],[-0.52,-0.22,0.08],[-0.5,-0.55,0.08],[-0.45,-0.9,0.08],[0,-1.05,0.05]]} r={0.085} color="#C07858" op={op}/>
        <VesselTube pts={[[0,0.95,0.05],[-0.1,0.6,0.1],[-0.2,0.3,0.1],[-0.28,0.22,0.12]]} r={0.045} color="#C87858" op={op}/>
        <mesh position={[-0.78, 0.15, -0.15]} scale={[0.32, 0.38, 0.28]} castShadow><sphereGeometry args={[0.48, 16, 16]} /><meshPhysicalMaterial color="#6B3070" roughness={0.58} metalness={0.05} transparent={tr(op)} opacity={op} /></mesh>
      </>}
      {vVis && <>
        <VesselTube pts={[[0.52,0.0,0.0],[0.32,0.15,0.0],[0.12,0.28,-0.02]]} r={0.06} color="#8B4513" op={vOp}/>
        <VesselTube pts={[[-0.78,0.15,-0.15],[-0.5,0.1,-0.08],[-0.2,0.15,0.0],[0.12,0.28,-0.02]]} r={0.04} color="#8B4513" op={vOp}/>
      </>}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDOCRINE MODEL
// ─────────────────────────────────────────────────────────────────────────────
function EndocrineModel({ p }: { p: MRP }) {
  const op = lo("organ", p); const vis = lv("organ", p);
  const tr = op < 0.999;
  const gM = <meshPhysicalMaterial color="#C0A0D0" roughness={0.55} metalness={0.06} clearcoat={0.18} transparent={tr} opacity={op} />;
  if (!vis) return null;
  return (
    <group>
      <mesh position={[0, 1.02, -0.08]} castShadow><sphereGeometry args={[0.14, 14, 14]} />{gM}</mesh>
      <mesh position={[0.06, 0.78, -0.18]}><sphereGeometry args={[0.08, 10, 10]} />{gM}</mesh>
      <mesh position={[0, 0.82, -0.08]} scale={[0.28, 0.14, 0.22]}><sphereGeometry args={[0.45, 14, 14]} />{gM}</mesh>
      <mesh position={[-0.12, 0.42, 0.32]} scale={[0.22, 0.28, 0.18]} castShadow><sphereGeometry args={[0.42, 14, 14]} />{gM}</mesh>
      <mesh position={[0.12, 0.42, 0.32]} scale={[0.22, 0.28, 0.18]} castShadow><sphereGeometry args={[0.42, 14, 14]} />{gM}</mesh>
      <mesh position={[0, 0.42, 0.3]} scale={[0.1, 0.14, 0.12]}><sphereGeometry args={[0.4, 12, 12]} />{gM}</mesh>
      {[[-0.14,0.48,0.25],[0.14,0.48,0.25],[-0.14,0.36,0.24],[0.14,0.36,0.24]].map(([x,y,z],i) => (
        <mesh key={i} position={[x,y,z]}><sphereGeometry args={[0.045, 8, 8]} />{gM}</mesh>
      ))}
      <mesh position={[0, 0.72, 0.22]} scale={[0.35, 0.45, 0.18]}><sphereGeometry args={[0.5, 14, 14]} />{gM}</mesh>
      <mesh position={[0.52, -0.05, -0.22]} scale={[0.22, 0.18, 0.16]} castShadow><sphereGeometry args={[0.35, 14, 14]} />{gM}</mesh>
      <mesh position={[-0.52, -0.05, -0.22]} scale={[0.22, 0.18, 0.16]} castShadow><sphereGeometry args={[0.35, 14, 14]} />{gM}</mesh>
      <mesh position={[0.0, -0.15, -0.12]} scale={[0.5, 0.15, 0.2]}><sphereGeometry args={[0.38, 14, 14]} />{gM}</mesh>
      <mesh position={[-0.22, -0.82, 0.08]} castShadow><sphereGeometry args={[0.18, 14, 14]} />{gM}</mesh>
      <mesh position={[0.22, -0.82, 0.08]} castShadow><sphereGeometry args={[0.18, 14, 14]} />{gM}</mesh>
      <VesselTube pts={[[0,1.02,-0.08],[0,0.42,0.32],[0,0.0,0.22],[0.52,-0.05,-0.22]]} r={0.012} color="#D0A0E0" op={op*0.5}/>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// URINARY MODEL
// ─────────────────────────────────────────────────────────────────────────────
function UrinaryModel({ p }: { p: MRP }) {
  const op = lo("organ", p); const vis = lv("organ", p);
  const vOp = lo("vessel", p); const vVis = lv("vessel", p);
  const tr = (o: number) => o < 0.999;
  if (!vis && !vVis) return null;
  const kM = (o: number) => <meshPhysicalMaterial color="#8B4513" roughness={0.6} metalness={0.04} clearcoat={0.1} transparent={tr(o)} opacity={o} />;
  return (
    <group>
      {vis && <>
        <mesh position={[0.5, 0.02, -0.22]} scale={[0.32, 0.5, 0.38]} castShadow><sphereGeometry args={[0.55, 20, 20]} />{kM(op)}</mesh>
        <mesh position={[-0.5, 0.02, -0.22]} scale={[0.32, 0.5, 0.38]} castShadow><sphereGeometry args={[0.55, 20, 20]} />{kM(op)}</mesh>
        <mesh position={[0.42, 0.02, -0.1]} scale={[0.14, 0.22, 0.14]}><sphereGeometry args={[0.4, 12, 12]} /><meshPhysicalMaterial color="#C08060" roughness={0.65} transparent={tr(op)} opacity={op} /></mesh>
        <mesh position={[-0.42, 0.02, -0.1]} scale={[0.14, 0.22, 0.14]}><sphereGeometry args={[0.4, 12, 12]} /><meshPhysicalMaterial color="#C08060" roughness={0.65} transparent={tr(op)} opacity={op} /></mesh>
        <VesselTube pts={[[0.42,0.0,-0.12],[0.38,-0.38,-0.08],[0.3,-0.72,0.02],[0.22,-1.0,0.08]]} r={0.038} color="#D09060" op={op}/>
        <VesselTube pts={[[-0.42,0.0,-0.12],[-0.38,-0.38,-0.08],[-0.3,-0.72,0.02],[-0.22,-1.0,0.08]]} r={0.038} color="#D09060" op={op}/>
        <mesh position={[0, -1.12, 0.08]} scale={[0.55, 0.48, 0.5]} castShadow><sphereGeometry args={[0.55, 20, 20]} /><meshPhysicalMaterial color="#C0A060" roughness={0.62} transparent={tr(op)} opacity={op} /></mesh>
        <mesh position={[0.5, 0.42, -0.18]} scale={[0.22, 0.15, 0.16]}><sphereGeometry args={[0.35, 12, 12]} /><meshPhysicalMaterial color="#C0A0D0" roughness={0.55} transparent={tr(op)} opacity={op} /></mesh>
        <mesh position={[-0.5, 0.42, -0.18]} scale={[0.22, 0.15, 0.16]}><sphereGeometry args={[0.35, 12, 12]} /><meshPhysicalMaterial color="#C0A0D0" roughness={0.55} transparent={tr(op)} opacity={op} /></mesh>
      </>}
      {vVis && <>
        <VesselTube pts={[[0.08,0.04,0],[0.32,0.04,-0.12],[0.5,0.02,-0.22]]} r={0.055} color="#CC0000" op={vOp}/>
        <VesselTube pts={[[-0.08,0.04,0],[-0.32,0.04,-0.12],[-0.5,0.02,-0.22]]} r={0.055} color="#CC0000" op={vOp}/>
        <VesselTube pts={[[0.5,0.02,-0.22],[0.32,0.04,-0.08],[0.08,0.04,-0.02]]} r={0.048} color="#1020A0" op={vOp}/>
        <VesselTube pts={[[-0.5,0.02,-0.22],[-0.32,0.04,-0.08],[-0.08,0.04,-0.02]]} r={0.048} color="#1020A0" op={vOp}/>
      </>}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LYMPHATIC MODEL
// ─────────────────────────────────────────────────────────────────────────────
function LymphaticModel({ p }: { p: MRP }) {
  const op = lo("organ", p); const vis = lv("organ", p);
  const tr = op < 0.999;
  const lnM = <meshPhysicalMaterial color="#48BB78" roughness={0.5} metalness={0.04} clearcoat={0.12} transparent={tr} opacity={op} />;
  if (!vis) return null;
  return (
    <group>
      <mesh position={[-0.72, 0.18, -0.18]} scale={[0.35, 0.42, 0.3]} castShadow><sphereGeometry args={[0.52, 18, 18]} />{lnM}</mesh>
      <mesh position={[0, 0.68, 0.22]} scale={[0.38, 0.5, 0.2]}><sphereGeometry args={[0.5, 16, 16]} />{lnM}</mesh>
      {[[-0.28,1.12,0.12],[0.28,1.12,0.12],[-0.2,0.95,0.18],[0.2,0.95,0.18]].map(([x,y,z],i) => (
        <mesh key={i} position={[x,y,z]}><sphereGeometry args={[0.075, 10, 10]} />{lnM}</mesh>
      ))}
      {[[-0.82,0.7,0.1],[-0.78,0.55,0.12],[0.82,0.7,0.1],[0.78,0.55,0.12]].map(([x,y,z],i) => (
        <mesh key={i} position={[x,y,z]}><sphereGeometry args={[0.07, 10, 10]} />{lnM}</mesh>
      ))}
      <VesselTube pts={[[0,-1.0,-0.12],[0,-0.5,-0.1],[0.05,0.0,-0.1],[0.05,0.5,-0.08],[0.02,0.88,0.0],[-0.08,1.08,0.12]]} r={0.028} color="#38A169" op={op}/>
      <mesh position={[0, -1.05, -0.12]} scale={[0.12, 0.2, 0.12]}><sphereGeometry args={[0.45, 10, 10]} />{lnM}</mesh>
      {[[-0.38,-1.12,0.08],[0.38,-1.12,0.08],[-0.28,-1.22,0.06],[0.28,-1.22,0.06]].map(([x,y,z],i) => (
        <mesh key={i} position={[x,y,z]}><sphereGeometry args={[0.07, 10, 10]} />{lnM}</mesh>
      ))}
      {[[0,0.4,-0.08],[0.15,0.3,-0.1],[-0.15,0.3,-0.1]].map(([x,y,z],i) => (
        <mesh key={i} position={[x,y,z]}><sphereGeometry args={[0.065, 10, 10]} />{lnM}</mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REPRODUCTIVE MODEL
// ─────────────────────────────────────────────────────────────────────────────
function ReproductiveModel({ p }: { p: MRP }) {
  const op = lo("organ", p); const vis = lv("organ", p);
  const vOp = lo("vessel", p); const vVis = lv("vessel", p);
  const tr = (o: number) => o < 0.999;
  if (!vis && !vVis) return null;
  return (
    <group>
      {vis && <>
        <mesh position={[0, -0.2, 0.05]} scale={[0.42, 0.55, 0.35]} castShadow><sphereGeometry args={[0.55, 20, 20]} /><meshPhysicalMaterial color="#C06080" roughness={0.55} metalness={0.04} clearcoat={0.12} transparent={tr(op)} opacity={op} /></mesh>
        <mesh position={[0, -0.58, 0.0]} scale={[0.25, 0.3, 0.22]}><sphereGeometry args={[0.45, 14, 14]} /><meshPhysicalMaterial color="#B05070" roughness={0.6} transparent={tr(op)} opacity={op} /></mesh>
        <VesselTube pts={[[0.22,-0.1,0.08],[0.52,-0.05,0.12],[0.72,-0.12,0.05],[0.78,-0.32,-0.02]]} r={0.035} color="#D08090" op={op}/>
        <VesselTube pts={[[-0.22,-0.1,0.08],[-0.52,-0.05,0.12],[-0.72,-0.12,0.05],[-0.78,-0.32,-0.02]]} r={0.035} color="#D08090" op={op}/>
        <mesh position={[0.78,-0.32,-0.02]} castShadow><sphereGeometry args={[0.16, 14, 14]} /><meshPhysicalMaterial color="#D09060" roughness={0.58} transparent={tr(op)} opacity={op} /></mesh>
        <mesh position={[-0.78,-0.32,-0.02]} castShadow><sphereGeometry args={[0.16, 14, 14]} /><meshPhysicalMaterial color="#D09060" roughness={0.58} transparent={tr(op)} opacity={op} /></mesh>
        <mesh position={[0, -0.78, 0.22]} scale={[0.42, 0.38, 0.38]} castShadow><sphereGeometry args={[0.48, 16, 16]} /><meshPhysicalMaterial color="#C0A060" roughness={0.62} transparent={tr(op)} opacity={op} /></mesh>
      </>}
      {vVis && <>
        <VesselTube pts={[[0.38,-0.05,0],[0.28,-0.18,0.04],[0.22,-0.32,0.06]]} r={0.04} color="#CC0000" op={vOp}/>
        <VesselTube pts={[[-0.38,-0.05,0],[-0.28,-0.18,0.04],[-0.22,-0.32,0.06]]} r={0.04} color="#CC0000" op={vOp}/>
      </>}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// System model router
// ─────────────────────────────────────────────────────────────────────────────
function SystemModel({ system, p }: { system: AnatomySystem; p: MRP }) {
  switch (system.id) {
    case "cardiovascular": return <HeartModel p={p} />;
    case "skeletal":       return <SkeletalModel p={p} />;
    case "nervous":        return <BrainModel p={p} />;
    case "respiratory":    return <LungsModel p={p} />;
    case "muscular":       return <MuscleModel p={p} />;
    case "digestive":      return <DigestiveModel p={p} />;
    case "endocrine":      return <EndocrineModel p={p} />;
    case "urinary":        return <UrinaryModel p={p} />;
    case "lymphatic":      return <LymphaticModel p={p} />;
    case "reproductive":   return <ReproductiveModel p={p} />;
    default:               return <HeartModel p={p} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Label3D — only renders when its label IS selected (zero overlap)
// ─────────────────────────────────────────────────────────────────────────────
function Label3D({ label, selected, onSelect }: {
  label: StructureLabel; selected: boolean; onSelect: (l: StructureLabel) => void;
}) {
  if (!selected) return null;
  return (
    <Html position={label.pos} center distanceFactor={6} zIndexRange={[20, 200]}>
      <button onClick={() => onSelect(label)}
        style={{ background: "none", border: "none", padding: 0 }}
        className="flex items-center gap-2 cursor-pointer select-none"
      >
        <span style={{
          width: 13, height: 13, borderRadius: "50%",
          background: "#7c3aed", border: "2.5px solid #c4b5fd",
          boxShadow: "0 0 14px #7c3aed, 0 0 4px rgba(255,255,255,0.6)", display: "block",
        }} />
        <span style={{
          fontSize: 11, fontWeight: 800, color: "#ede9fe",
          background: "rgba(6,4,20,0.92)", padding: "3px 8px", borderRadius: 6,
          whiteSpace: "nowrap", letterSpacing: "0.02em",
          border: "1px solid rgba(167,139,250,0.55)",
          boxShadow: "0 2px 14px rgba(0,0,0,0.6)",
        }}>
          {label.name}
        </span>
      </button>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera reset (inside Canvas)
// ─────────────────────────────────────────────────────────────────────────────
function CameraController({ resetTrigger, isInteracting, onInteract }: {
  resetTrigger: number; isInteracting: boolean; onInteract: (v: boolean) => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  React.useEffect(() => {
    if (resetTrigger === 0) return;
    camera.position.set(0, 0, 5.2);
    if (controlsRef.current) { controlsRef.current.target.set(0, 0, 0); controlsRef.current.update(); }
  }, [resetTrigger]);
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping dampingFactor={0.08}
      minDistance={1.5} maxDistance={12}
      onStart={() => onInteract(true)}
      onEnd={() => onInteract(false)}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene
// ─────────────────────────────────────────────────────────────────────────────
function Scene({ system, selectedLabel, onLabelSelect, mrp, resetTrigger, isInteracting, onInteract }: {
  system: AnatomySystem; selectedLabel: string | null;
  onLabelSelect: (l: StructureLabel) => void; mrp: MRP;
  resetTrigger: number; isInteracting: boolean; onInteract: (v: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current && !isInteracting) groupRef.current.rotation.y += 0.003;
  });
  const allLabels = useMemo(() => system.structures.flatMap(s => s.labels), [system]);
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-4, 3, -3]} intensity={0.65} color="#a0c8ff" />
      <pointLight position={[0, -3, 3]} intensity={0.45} color="#ff8060" />
      <Environment preset="city" />
      <ContactShadows position={[0, -2.2, 0]} opacity={0.5} scale={7} blur={2.5} far={5} />
      <group ref={groupRef}>
        <SystemModel system={system} p={mrp} />
        {allLabels.map(label => (
          <Label3D key={label.id} label={label} selected={selectedLabel === label.id} onSelect={onLabelSelect} />
        ))}
      </group>
      <CameraController resetTrigger={resetTrigger} isInteracting={isInteracting} onInteract={onInteract} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sketchfab viewer
// ─────────────────────────────────────────────────────────────────────────────
function SketchfabViewer({ modelId, title }: { modelId: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const src = `https://sketchfab.com/models/${modelId}/embed?autostart=1&preload=1&ui_theme=dark&ui_controls=1&ui_infos=0&ui_watermark=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0`;
  return (
    <div className="relative w-full h-full bg-black">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
          <div className="w-10 h-10 rounded-full border-[3px] border-violet-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading 3D Model…</p>
        </div>
      )}
      <iframe title={title} src={src}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        className="w-full h-full border-0"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export default function ModelViewer3D({
  system, selectedLabel, onLabelSelect,
}: {
  system: AnatomySystem;
  selectedLabel: string | null;
  onLabelSelect: (l: StructureLabel) => void;
}) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [viewMode, setViewMode] = useState<"3d" | "sketchfab">("3d");
  const [globalOp, setGlobalOp] = useState(1.0);
  const [showOpSlider, setShowOpSlider] = useState(false);
  const [isolated, setIsolated] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  React.useEffect(() => {
    setViewMode("3d"); setIsolated(null); setHidden(new Set()); setGlobalOp(1.0); setShowOpSlider(false); setShowLayerPanel(false);
  }, [system.id]);

  const mrp: MRP = useMemo(() => ({ globalOp, isolated, hidden }), [globalOp, isolated, hidden]);

  function handleReset() {
    setGlobalOp(1.0); setIsolated(null); setHidden(new Set());
    setResetTrigger(t => t + 1); setShowOpSlider(false);
  }
  function toggleHide(id: string) {
    setHidden(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleIsolate(id: string) {
    setIsolated(prev => prev === id ? null : id);
  }

  return (
    <div className="w-full h-full relative overflow-hidden select-none" style={{ background: "linear-gradient(160deg,#060314 0%,#0b0822 55%,#060218 100%)" }}>

      {/* View mode toggle — top center pill */}
      {system.sketchfabId && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex bg-black/75 backdrop-blur-md rounded-full p-0.5 border border-white/12 shadow-xl">
          {(["3d", "sketchfab"] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all ${
                viewMode === m ? "bg-violet-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-200"
              }`}
            >
              {m === "3d" ? "⬡ Schematic" : "✦ HD Model"}
            </button>
          ))}
        </div>
      )}

      {/* Layer panel */}
      {showLayerPanel && viewMode === "3d" && (
        <div className="absolute top-14 left-3 z-30 flex flex-col gap-0.5 bg-black/88 backdrop-blur-xl rounded-2xl p-2.5 border border-white/12 shadow-2xl min-w-[170px]">
          <div className="flex items-center justify-between px-1 pb-2 mb-1 border-b border-white/8">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Layers</span>
            <button onClick={() => setShowLayerPanel(false)} className="text-slate-600 hover:text-white transition-colors p-0.5 rounded-md hover:bg-white/10"><X size={11} /></button>
          </div>
          {LAYERS.map(layer => {
            const isIso = isolated === layer.id;
            const isHid = hidden.has(layer.id);
            return (
              <div key={layer.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${isIso ? "bg-violet-900/30" : "hover:bg-white/5"}`}>
                <button onClick={() => toggleHide(layer.id)} className={`transition-colors ${isHid ? "text-slate-600" : "text-slate-300 hover:text-white"}`}>
                  {isHid ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <span className="text-sm leading-none">{layer.icon}</span>
                <span className={`text-[11px] font-semibold flex-1 transition-colors ${isHid ? "text-slate-600 line-through" : "text-slate-200"}`}>
                  {layer.label}
                </span>
                <button
                  onClick={() => toggleIsolate(layer.id)}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border transition-all ${
                    isIso ? "bg-violet-600/60 border-violet-400/50 text-violet-200" : "border-white/12 text-slate-600 hover:text-slate-300 hover:border-white/25"
                  }`}
                >
                  ISO
                </button>
              </div>
            );
          })}
          {/* Reset layers */}
          {(isolated || hidden.size > 0) && (
            <button onClick={() => { setIsolated(null); setHidden(new Set()); }}
              className="mt-1.5 text-[10px] text-violet-400 hover:text-violet-200 font-semibold text-center py-1 border-t border-white/8 transition-colors"
            >
              ↺ Reset Layers
            </button>
          )}
        </div>
      )}

      {/* Main viewer */}
      {viewMode === "sketchfab" && system.sketchfabId ? (
        <SketchfabViewer modelId={system.sketchfabId} title={system.name} />
      ) : (
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 40 }}
          shadows gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          style={{ background: "transparent" }} dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <Scene
              system={system} selectedLabel={selectedLabel} onLabelSelect={onLabelSelect}
              mrp={mrp} resetTrigger={resetTrigger} isInteracting={isInteracting}
              onInteract={setIsInteracting}
            />
          </Suspense>
        </Canvas>
      )}

      {/* Bottom control bar — matching Anatomy Learning style */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-black/80 backdrop-blur-xl rounded-2xl px-1.5 py-1.5 border border-white/12 shadow-2xl">
        {/* Layers */}
        <button onClick={() => { setShowLayerPanel(p => !p); setShowOpSlider(false); }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wide transition-all ${showLayerPanel ? "bg-violet-700/60 text-violet-200" : "text-slate-400 hover:bg-white/8 hover:text-white"}`}
        >
          <Layers size={14} />
          <span>Layers</span>
        </button>
        <div className="w-px h-7 bg-white/8 mx-0.5" />
        {/* Opacity */}
        <div className="relative">
          <button onClick={() => { setShowOpSlider(p => !p); setShowLayerPanel(false); }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wide transition-all ${showOpSlider || globalOp < 1 ? "bg-violet-700/60 text-violet-200" : "text-slate-400 hover:bg-white/8 hover:text-white"}`}
          >
            <SlidersHorizontal size={14} />
            <span>Opacity</span>
          </button>
          {showOpSlider && (
            <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 bg-black/94 rounded-2xl p-3.5 border border-white/14 w-40 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Opacity</span>
                <span className="text-[11px] text-violet-300 font-black">{Math.round(globalOp * 100)}%</span>
              </div>
              <input type="range" min={5} max={100} value={Math.round(globalOp * 100)}
                onChange={e => setGlobalOp(Number(e.target.value) / 100)}
                className="w-full h-1.5 accent-violet-500 cursor-pointer"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-slate-600">Ghost</span>
                <span className="text-[9px] text-slate-600">Solid</span>
              </div>
            </div>
          )}
        </div>
        {/* Center */}
        <button onClick={() => setResetTrigger(t => t + 1)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wide text-slate-400 hover:bg-white/8 hover:text-white transition-all"
        >
          <Crosshair size={14} />
          <span>Center</span>
        </button>
        <div className="w-px h-7 bg-white/8 mx-0.5" />
        {/* Reset */}
        <button onClick={handleReset}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wide text-slate-400 hover:bg-white/8 hover:text-white transition-all"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      {/* Active filter pill indicators */}
      {(isolated || hidden.size > 0 || globalOp < 1) && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-none">
          {isolated && (
            <span className="text-[9px] font-bold bg-violet-900/70 border border-violet-400/40 text-violet-200 px-2 py-0.5 rounded-full backdrop-blur">
              ISO: {LAYERS.find(l => l.id === isolated)?.label}
            </span>
          )}
          {hidden.size > 0 && (
            <span className="text-[9px] font-bold bg-slate-900/70 border border-white/20 text-slate-300 px-2 py-0.5 rounded-full backdrop-blur">
              {hidden.size} hidden
            </span>
          )}
          {globalOp < 1 && (
            <span className="text-[9px] font-bold bg-slate-900/70 border border-white/20 text-slate-300 px-2 py-0.5 rounded-full backdrop-blur">
              {Math.round(globalOp * 100)}% opacity
            </span>
          )}
        </div>
      )}

      {/* Drag hint */}
      {viewMode === "3d" && (
        <p className="absolute top-3 right-3 text-[10px] text-slate-700 pointer-events-none select-none hidden md:block">
          Drag · Scroll · Pinch
        </p>
      )}
    </div>
  );
}
