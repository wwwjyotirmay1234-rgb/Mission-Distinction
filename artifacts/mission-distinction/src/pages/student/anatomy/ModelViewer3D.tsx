import React, { Suspense, useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Eye, EyeOff, Layers, Crosshair, RotateCcw, SlidersHorizontal, X, Download, Tag } from "lucide-react";
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
  if (p.isolated && p.isolated !== layer) return Math.min(p.globalOp, 0.06);
  return p.globalOp;
}
function lv(layer: string, p: MRP): boolean { return !p.hidden.has(layer); }

// ─────────────────────────────────────────────────────────────────────────────
// GLB mesh auto-classification by name keywords
// ─────────────────────────────────────────────────────────────────────────────
type LayerId = "bone" | "muscle" | "vessel" | "nerve" | "organ";

function classifyMeshByName(
  name: string,
  overrides?: Record<string, LayerId>
): LayerId {
  const key = name.toLowerCase().replace(/[\s\-_.]/g, "");
  // Check explicit overrides first
  if (overrides) {
    for (const [k, v] of Object.entries(overrides)) {
      if (key.includes(k.toLowerCase().replace(/[\s\-_.]/g, ""))) return v;
    }
  }
  // Vessel keywords
  if (/aort|coron|lad|rca|lcx|circumflex|marginal|arteri|pulmonar.*(trunk|art)|svc|ivc|venacava|cardiac.?vein|coronary.?sinus|great.?vessel|venous|vascular|pulm/.test(key)) return "vessel";
  // Nerve keywords
  if (/nerve|vagus|plexus|sympathet|parasympath|ganglion|neural/.test(key)) return "nerve";
  // Muscle keywords
  if (/myocard|cardiac.?muscle|papillary|trabecula/.test(key)) return "muscle";
  // Bone keywords
  if (/bone|sternum|rib|costal|vertebr|clavicl|scapul|pelvis|skull|mandib/.test(key)) return "bone";
  // Default: organ (chambers, valves, pericardium, etc.)
  return "organ";
}

// ─────────────────────────────────────────────────────────────────────────────
// Error boundary — catches useGLTF load failures, renders fallback
// ─────────────────────────────────────────────────────────────────────────────
interface EBState { hasError: boolean }
interface EBProps { children: React.ReactNode; fallback: React.ReactNode }

class GLBErrorBoundary extends React.Component<EBProps, EBState> {
  constructor(props: EBProps) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(): EBState { return { hasError: true }; }
  componentDidCatch(err: Error) { console.warn("[ModelViewer3D] GLB load error:", err.message); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

// ─────────────────────────────────────────────────────────────────────────────
// GLBModel — loads any anatomy GLB, auto-classifies meshes, applies MRP
// ─────────────────────────────────────────────────────────────────────────────
function GLBModel({ glbPath, p, overrides }: {
  glbPath: string;
  p: MRP;
  overrides?: Record<string, LayerId>;
}) {
  const { scene } = useGLTF(glbPath);

  // Clone the scene + clone all materials so we can mutate them safely
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m: THREE.Material) => m.clone());
      } else if (mesh.material) {
        mesh.material = (mesh.material as THREE.Material).clone();
      }
    });
    return clone;
  }, [scene]);

  // Build mesh→layer map once
  const meshLayerMap = useMemo(() => {
    const map = new Map<THREE.Mesh, LayerId>();
    clonedScene.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const name = mesh.name || mesh.parent?.name || "";
      map.set(mesh, classifyMeshByName(name, overrides));
    });
    return map;
  }, [clonedScene, overrides]);

  // Normalise bounding box to ~2 units centred at origin
  const [normScale, normOffset] = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const s = 2.2 / maxDim;
    return [s, center.clone().multiplyScalar(-s)];
  }, [clonedScene]);

  // Apply MRP opacity every frame (lightweight per-material update)
  useFrame(() => {
    meshLayerMap.forEach((layer, mesh) => {
      const op = lo(layer, p);
      const applyToMat = (mat: THREE.Material) => {
        mat.transparent = op < 0.999;
        (mat as THREE.MeshStandardMaterial).opacity = op;
        mat.needsUpdate = false; // only flag on change
      };
      const wasVisible = mesh.visible;
      mesh.visible = op > 0.005;
      if (mesh.visible !== wasVisible) {
        // Force material update when visibility flips
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(applyToMat);
      } else if (mesh.visible) {
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(applyToMat);
      }
    });
  });

  return (
    <group
      scale={[normScale, normScale, normScale]}
      position={[normOffset.x, normOffset.y, normOffset.z]}
    >
      <primitive object={clonedScene} castShadow receiveShadow />
    </group>
  );
}

// Dev-mode mesh inspector — logs all mesh names from the GLB to console
function GLBInspector({ glbPath }: { glbPath: string }) {
  const { scene } = useGLTF(glbPath);
  useEffect(() => {
    if (import.meta.env.DEV) {
      const names: string[] = [];
      scene.traverse(c => { if ((c as THREE.Mesh).isMesh) names.push(c.name || "(unnamed)"); });
      console.log(`[AnatomyHub] GLB mesh names for ${glbPath}:`, names);
    }
  }, [scene, glbPath]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// "No GLB yet" placeholder — shows inside the 3D canvas
// ─────────────────────────────────────────────────────────────────────────────
function NoGLBPlaceholder({ system }: { system: AnatomySystem }) {
  return (
    <Html center zIndexRange={[10, 100]}>
      <div style={{
        textAlign: "center", padding: "24px 28px", borderRadius: 16,
        background: "rgba(10,6,30,0.92)", border: "1px solid rgba(124,58,237,0.35)",
        backdropFilter: "blur(12px)", maxWidth: 260,
      }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>{system.icon}</div>
        <p style={{ color: "#c4b5fd", fontWeight: 800, fontSize: 13, marginBottom: 6 }}>
          GLB Model Not Found
        </p>
        <p style={{ color: "#6b7280", fontSize: 11, lineHeight: 1.5, marginBottom: 14 }}>
          Place <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 4 }}>heart.glb</code> in{" "}
          <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 4 }}>public/models/</code>
        </p>
        <a
          href="https://sketchfab.com/search?q=human+heart+anatomy&downloadable=true&sort_by=-likeCount"
          target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(124,58,237,0.3)", border: "1px solid rgba(124,58,237,0.5)",
            color: "#c4b5fd", padding: "7px 14px", borderRadius: 20,
            fontSize: 11, fontWeight: 700, textDecoration: "none",
          }}
        >
          Get free model ↗
        </a>
      </div>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GLB availability check — robust against Vite SPA fallback
// Vite serves index.html (text/html, 200) for unknown paths in dev mode.
// We detect this by checking Content-Type: a real GLB will never be text/html.
// ─────────────────────────────────────────────────────────────────────────────
function useGLBExists(path: string | undefined): boolean | null {
  const [exists, setExists] = useState<boolean | null>(null);
  useEffect(() => {
    if (!path) { setExists(false); return; }
    let cancelled = false;
    fetch(path, { method: "HEAD" })
      .then(r => {
        if (cancelled) return;
        if (!r.ok) { setExists(false); return; }
        const ct = r.headers.get("content-type") ?? "";
        // If Vite returned the SPA HTML fallback, the file doesn't really exist
        setExists(!ct.startsWith("text/html") && !ct.startsWith("text/htm"));
      })
      .catch(() => { if (!cancelled) setExists(false); });
    return () => { cancelled = true; };
  }, [path]);
  return exists;
}

// ─────────────────────────────────────────────────────────────────────────────
// VesselTube — CatmullRom spline for procedural fallback models
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
// PROCEDURAL FALLBACK MODELS (shown while GLB loads / when GLB absent)
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
      </>}
      {vVis && <>
        <VesselTube pts={[[-0.1, 0.52, 0.18], [-0.06, 0.82, 0.1], [0.06, 1.06, -0.02], [0.22, 1.15, -0.12]]} r={0.1} color="#CC0000" op={vOp} />
        <VesselTube pts={[[0.22, 1.15, -0.12], [0.38, 1.18, -0.22], [0.44, 1.1, -0.32], [0.4, 0.88, -0.38]]} r={0.09} color="#CC0000" op={vOp} />
        <VesselTube pts={[[0.14, 0.56, 0.22], [0.14, 0.84, 0.3], [0.04, 1.02, 0.28]]} r={0.09} color="#2040C0" op={vOp} />
        <VesselTube pts={[[0.04, 1.02, 0.28], [-0.26, 1.04, 0.22], [-0.52, 0.88, 0.08]]} r={0.058} color="#2040C0" op={vOp} />
        <VesselTube pts={[[0.04, 1.02, 0.28], [0.4, 1.02, 0.2], [0.62, 0.88, 0.06]]} r={0.058} color="#2040C0" op={vOp} />
        <VesselTube pts={[[-0.14, 0.34, 0.52], [-0.2, 0.12, 0.56], [-0.26, -0.1, 0.54], [-0.31, -0.32, 0.48], [-0.34, -0.56, 0.34], [-0.36, -0.72, 0.2]]} r={0.018} color="#CC1010" op={vOp} seg={28} />
        <VesselTube pts={[[-0.14, 0.34, 0.52], [-0.32, 0.38, 0.36], [-0.5, 0.22, 0.1], [-0.52, -0.06, -0.1], [-0.44, -0.3, -0.25]]} r={0.015} color="#CC1010" op={vOp} seg={24} />
        <VesselTube pts={[[0.1, 0.4, 0.36], [0.38, 0.22, 0.3], [0.52, -0.04, 0.14], [0.5, -0.3, -0.06], [0.38, -0.56, -0.2], [0.18, -0.72, -0.3]]} r={0.016} color="#CC1010" op={vOp} seg={28} />
        <VesselTube pts={[[-0.36, -0.72, 0.2], [-0.28, -0.42, 0.38], [-0.18, -0.16, 0.44], [-0.04, 0.1, 0.38], [0.04, 0.32, -0.22]]} r={0.013} color="#0A1A80" op={vOp} seg={22} />
      </>}
    </group>
  );
}

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
      {[-0.1,-0.3,-0.5,-0.7,-0.9,-1.08,-1.25,-1.42,-1.58,-1.72,-1.86,-1.98].map((y, i) => (
        <mesh key={i} position={[0, y + 1.25, -0.05]} scale={[i<5?0.24:0.28, 0.14, 0.18]} castShadow><boxGeometry args={[1, 1, 1]} />{bM}</mesh>
      ))}
      {[-0.05,-0.2,-0.38,-0.55,-0.72,-0.88,-1.04,-1.18,-1.3,-1.42,-1.5,-1.56].map((y, i) => (
        <React.Fragment key={i}>
          <VesselTube pts={[[0.12, y+1.15, 0.08],[0.5, y+1.1, 0.28],[0.7, y+1.0, 0.1],[0.6, y+0.92, -0.12]]} r={0.038} color="#EDEAC8" op={op} seg={14}/>
          <VesselTube pts={[[-0.12, y+1.15, 0.08],[-0.5, y+1.1, 0.28],[-0.7, y+1.0, 0.1],[-0.6, y+0.92, -0.12]]} r={0.038} color="#EDEAC8" op={op} seg={14}/>
        </React.Fragment>
      ))}
      <mesh position={[0, -1.05, -0.02]} scale={[1.0, 0.38, 0.78]} castShadow><sphereGeometry args={[0.62, 24, 24]} />{bM}</mesh>
      <mesh position={[0, -1.18, -0.32]} scale={[0.34, 0.5, 0.22]} castShadow><sphereGeometry args={[0.5, 16, 16]} />{cM}</mesh>
    </group>
  );
}

function BrainModel({ p }: { p: MRP }) {
  const nOp = lo("nerve", p); const nVis = lv("nerve", p);
  const oOp = lo("organ", p); const oVis = lv("organ", p);
  const tr = (op: number) => op < 0.999;
  const cxM = (op: number) => <meshPhysicalMaterial color="#D4A8A0" roughness={0.62} metalness={0} clearcoat={0.06} transparent={tr(op)} opacity={op} />;
  const cbM = (op: number) => <meshPhysicalMaterial color="#C09898" roughness={0.7} metalness={0} transparent={tr(op)} opacity={op} />;
  const bsM = (op: number) => <meshPhysicalMaterial color="#B88888" roughness={0.65} metalness={0} transparent={tr(op)} opacity={op} />;
  return (
    <group>
      {oVis && <>
        <mesh position={[-0.3, 0.12, 0]} scale={[0.78, 0.88, 0.98]} castShadow><sphereGeometry args={[0.75, 32, 32]} />{cxM(oOp)}</mesh>
        <mesh position={[0.3, 0.12, 0]} scale={[0.78, 0.88, 0.98]} castShadow><sphereGeometry args={[0.75, 32, 32]} />{cxM(oOp)}</mesh>
        <mesh position={[0,-0.52,-0.58]} scale={[0.82,0.52,0.72]} castShadow><sphereGeometry args={[0.58,24,24]} />{cbM(oOp)}</mesh>
        <mesh position={[0,-0.55,-0.32]} scale={[0.32,0.55,0.32]}><sphereGeometry args={[0.45,16,16]} />{bsM(oOp)}</mesh>
        <mesh position={[0,-0.88,-0.2]} scale={[0.25,0.38,0.25]}><sphereGeometry args={[0.42,14,14]} />{bsM(oOp)}</mesh>
      </>}
      {nVis && [
        { pts: [[0,-0.92,-0.08],[0,-1.3,0.1]] as [number,number,number][], c: "#F0D050" },
        { pts: [[-0.18,-0.72,0.22],[-0.3,-1.1,0.4]] as [number,number,number][], c: "#F0D050" },
        { pts: [[0.18,-0.72,0.22],[0.3,-1.1,0.4]] as [number,number,number][], c: "#F0D050" },
      ].map((n, i) => <VesselTube key={i} pts={n.pts} r={0.022} color={n.c} op={nOp} />)}
    </group>
  );
}

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
        <VesselTube pts={[[0, 0.65, -0.05],[-0.2, 0.48, -0.06],[-0.55, 0.38, -0.05]]} r={0.065} color="#D0C080" op={op} />
        <VesselTube pts={[[0, 0.65, -0.05],[0.2, 0.48, -0.06],[0.58, 0.38, -0.05]]} r={0.07} color="#D0C080" op={op} />
      </>}
      {vVis && <>
        <VesselTube pts={[[-0.28, 0.38, 0.18],[-0.52, 0.28, 0.1],[-0.72, 0.15, 0]]} r={0.06} color="#CC0000" op={vOp} />
        <VesselTube pts={[[0.28, 0.38, 0.18],[0.52, 0.28, 0.1],[0.72, 0.22, 0]]} r={0.065} color="#CC0000" op={vOp} />
      </>}
    </group>
  );
}

function MuscleModel({ p }: { p: MRP }) {
  const op = lo("muscle", p); const vis = lv("muscle", p);
  const tr = op < 0.999;
  const mM = <meshPhysicalMaterial color="#8B1A1A" roughness={0.55} metalness={0.06} clearcoat={0.1} transparent={tr} opacity={op} />;
  if (!vis) return null;
  return (
    <group>
      <mesh position={[-0.42, 0.55, 0.28]} scale={[0.62, 0.72, 0.32]} castShadow><sphereGeometry args={[0.55, 20, 20]} />{mM}</mesh>
      <mesh position={[0.42, 0.55, 0.28]} scale={[0.62, 0.72, 0.32]} castShadow><sphereGeometry args={[0.55, 20, 20]} />{mM}</mesh>
      <mesh position={[-0.15, -0.08, 0.32]} scale={[0.2, 0.85, 0.2]}><boxGeometry args={[1, 1, 1]} />{mM}</mesh>
      <mesh position={[0.15, -0.08, 0.32]} scale={[0.2, 0.85, 0.2]}><boxGeometry args={[1, 1, 1]} />{mM}</mesh>
      <mesh position={[0, 0.98, -0.22]} scale={[0.92, 0.45, 0.18]} castShadow><sphereGeometry args={[0.52, 18, 18]} />{mM}</mesh>
    </group>
  );
}

function GenericOrganModel({ p }: { p: MRP }) {
  const op = lo("organ", p);
  const tr = op < 0.999;
  return (
    <mesh castShadow>
      <sphereGeometry args={[1.0, 32, 32]} />
      <meshPhysicalMaterial color="#A855F7" roughness={0.5} metalness={0.1} clearcoat={0.2} transparent={tr} opacity={op} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProceduralModel — selects the right procedural fallback per system
// ─────────────────────────────────────────────────────────────────────────────
function ProceduralModel({ system, p }: { system: AnatomySystem; p: MRP }) {
  switch (system.id) {
    case "cardiovascular": return <HeartModel p={p} />;
    case "skeletal":       return <SkeletalModel p={p} />;
    case "nervous":        return <BrainModel p={p} />;
    case "respiratory":    return <LungsModel p={p} />;
    case "muscular":       return <MuscleModel p={p} />;
    default:               return <GenericOrganModel p={p} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SystemModel — tries GLB first, falls back to procedural
// ─────────────────────────────────────────────────────────────────────────────
function SystemModel({ system, p, glbExists, structureGlbPath }: {
  system: AnatomySystem; p: MRP; glbExists: boolean | null; structureGlbPath?: string;
}) {
  const procedural = <ProceduralModel system={system} p={p} />;
  // Effective GLB: per-structure override takes priority over system-level
  const effectivePath = structureGlbPath ?? system.glbPath;

  // No GLB configured or confirmed absent
  if (!effectivePath || glbExists === false) return procedural;

  // Still checking (null) → show procedural while loading
  if (glbExists === null) return procedural;

  // GLB confirmed present
  return (
    <GLBErrorBoundary fallback={procedural}>
      <Suspense fallback={procedural}>
        <GLBModel
          glbPath={effectivePath}
          p={p}
          overrides={system.glbLayers as Record<string, LayerId> | undefined}
        />
        {import.meta.env.DEV && <GLBInspector glbPath={effectivePath} />}
      </Suspense>
    </GLBErrorBoundary>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Label3D — shows as a pin always when showAll=true; selected pin shows text
// ─────────────────────────────────────────────────────────────────────────────
function Label3D({ label, selected, onSelect, showAll }: {
  label: StructureLabel; selected: boolean;
  onSelect: (l: StructureLabel) => void; showAll: boolean;
}) {
  if (!showAll && !selected) return null;
  return (
    <Html position={label.pos} center distanceFactor={6} zIndexRange={[20, 200]}>
      <button onClick={() => onSelect(label)}
        style={{ background: "none", border: "none", padding: 0 }}
        className="flex items-center gap-1.5 cursor-pointer select-none group"
      >
        {/* Pulse ring on selected */}
        <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {selected && (
            <span style={{
              position: "absolute", width: 22, height: 22, borderRadius: "50%",
              border: "2px solid #c4b5fd", opacity: 0.5,
              animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite",
            }} />
          )}
          <span style={{
            width: selected ? 14 : 10,
            height: selected ? 14 : 10,
            borderRadius: "50%",
            background: selected ? "#7c3aed" : "rgba(124,58,237,0.7)",
            border: selected ? "2.5px solid #c4b5fd" : "1.5px solid rgba(196,181,253,0.5)",
            boxShadow: selected
              ? "0 0 14px #7c3aed, 0 0 4px rgba(255,255,255,0.6)"
              : "0 0 6px rgba(124,58,237,0.6)",
            display: "block",
            transition: "all 0.15s",
          }} />
        </span>
        {/* Label text — always visible when selected; hover-visible when showAll */}
        <span style={{
          fontSize: 10, fontWeight: 800, color: selected ? "#ede9fe" : "#c4b5fd",
          background: selected ? "rgba(6,4,20,0.95)" : "rgba(6,4,20,0.75)",
          padding: "2px 7px", borderRadius: 5,
          whiteSpace: "nowrap", letterSpacing: "0.02em",
          border: `1px solid ${selected ? "rgba(167,139,250,0.7)" : "rgba(167,139,250,0.25)"}`,
          boxShadow: "0 2px 10px rgba(0,0,0,0.6)",
          display: selected ? "block" : "none",
          transition: "opacity 0.1s",
        }}>
          {label.name}
        </span>
        {/* Tooltip on hover for unselected pins */}
        {!selected && (
          <span className="group-hover:flex hidden" style={{
            fontSize: 10, fontWeight: 700, color: "#c4b5fd",
            background: "rgba(6,4,20,0.92)", padding: "2px 7px", borderRadius: 5,
            whiteSpace: "nowrap", letterSpacing: "0.02em",
            border: "1px solid rgba(167,139,250,0.4)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.6)",
          }}>
            {label.name}
          </span>
        )}
      </button>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera controller
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
      minDistance={1.2} maxDistance={12}
      onStart={() => onInteract(true)}
      onEnd={() => onInteract(false)}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene
// ─────────────────────────────────────────────────────────────────────────────
function Scene({ system, selectedLabel, onLabelSelect, mrp, resetTrigger,
  isInteracting, onInteract, glbExists, structureGlbPath, showAllLabels }: {
  system: AnatomySystem; selectedLabel: string | null;
  onLabelSelect: (l: StructureLabel) => void; mrp: MRP;
  resetTrigger: number; isInteracting: boolean;
  onInteract: (v: boolean) => void; glbExists: boolean | null;
  structureGlbPath?: string; showAllLabels: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current && !isInteracting) groupRef.current.rotation.y += 0.003;
  });
  const allLabels = useMemo(() => system.structures.flatMap(s => s.labels), [system]);
  const effectivePath = structureGlbPath ?? system.glbPath;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.6} />
      <directionalLight position={[-4, 3, -3]} intensity={0.7} color="#a0c8ff" />
      <pointLight position={[0, -3, 3]} intensity={0.5} color="#ff8060" />
      <Environment preset="city" />
      <group ref={groupRef}>
        <SystemModel system={system} p={mrp} glbExists={glbExists} structureGlbPath={structureGlbPath} />
        {allLabels.map(label => (
          <Label3D
            key={label.id} label={label}
            selected={selectedLabel === label.id}
            onSelect={onLabelSelect}
            showAll={showAllLabels}
          />
        ))}
        {/* Show "no GLB" prompt inside 3D if effective path set but file absent */}
        {effectivePath && glbExists === false && (
          <NoGLBPlaceholder system={system} />
        )}
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
          <p className="text-xs text-slate-400 font-medium">Loading HD Model…</p>
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
// GLB Status Indicator (top-right corner badge when GLB is active)
// ─────────────────────────────────────────────────────────────────────────────
function GLBBadge({ status }: { status: "loading" | "loaded" | "fallback" | "none" }) {
  if (status === "none") return null;
  const cfg = {
    loading:  { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)", text: "#fbbf24", label: "Loading GLB…", dot: "bg-amber-400 animate-pulse" },
    loaded:   { bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.35)",  text: "#4ade80", label: "GLB Model",    dot: "bg-green-400" },
    fallback: { bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.35)",  text: "#f87171", label: "Schematic",   dot: "bg-red-400" },
  }[status];
  return (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border pointer-events-none"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export default function ModelViewer3D({
  system, selectedLabel, onLabelSelect, structureGlbPath,
}: {
  system: AnatomySystem;
  selectedLabel: string | null;
  onLabelSelect: (l: StructureLabel) => void;
  /** Per-structure GLB override — loaded instead of system.glbPath when present */
  structureGlbPath?: string;
}) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [viewMode, setViewMode] = useState<"3d" | "sketchfab">("3d");
  const [globalOp, setGlobalOp] = useState(1.0);
  const [showOpSlider, setShowOpSlider] = useState(false);
  const [isolated, setIsolated] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showAllLabels, setShowAllLabels] = useState(true);

  // Effective GLB path: per-structure takes priority over system-level
  const effectiveGlbPath = structureGlbPath ?? system.glbPath;

  // Check whether the effective GLB file actually exists
  const glbExists = useGLBExists(effectiveGlbPath);
  const glbStatus: "loading" | "loaded" | "fallback" | "none" =
    !effectiveGlbPath ? "none" :
    glbExists === null ? "loading" :
    glbExists ? "loaded" : "fallback";

  React.useEffect(() => {
    setViewMode("3d"); setIsolated(null); setHidden(new Set());
    setGlobalOp(1.0); setShowOpSlider(false); setShowLayerPanel(false);
    setShowAllLabels(true);
  }, [system.id, structureGlbPath]);

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
    <div className="w-full h-full relative overflow-hidden select-none"
      style={{ background: "linear-gradient(160deg,#060314 0%,#0b0822 55%,#060218 100%)" }}>

      {/* View mode toggle */}
      {system.sketchfabId && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex bg-black/75 backdrop-blur-md rounded-full p-0.5 border border-white/12 shadow-xl">
          {(["3d", "sketchfab"] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all ${
                viewMode === m ? "bg-violet-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-200"
              }`}
            >
              {m === "3d" ? "⬡ Interactive" : "✦ HD View"}
            </button>
          ))}
        </div>
      )}

      {/* GLB status badge */}
      <GLBBadge status={glbStatus} />

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
          {(isolated || hidden.size > 0) && (
            <button onClick={() => { setIsolated(null); setHidden(new Set()); }}
              className="mt-1.5 text-[10px] text-violet-400 hover:text-violet-200 font-semibold text-center py-1 border-t border-white/8 transition-colors"
            >
              ↺ Reset Layers
            </button>
          )}
          {/* GLB mesh download hint */}
          {effectiveGlbPath && glbExists === false && (
            <a href="https://sketchfab.com/search?q=human+heart+anatomy&downloadable=true&sort_by=-likeCount"
              target="_blank" rel="noopener noreferrer"
              className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-400 hover:text-amber-200 font-semibold text-center py-1 border-t border-white/8 transition-colors"
            >
              <Download size={10} /> Get GLB model
            </a>
          )}
        </div>
      )}

      {/* Main viewer */}
      {viewMode === "sketchfab" && system.sketchfabId ? (
        <SketchfabViewer modelId={system.sketchfabId} title={system.name} />
      ) : (
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }} dpr={[1, 1.2]}
        >
          <Suspense fallback={null}>
            <Scene
              system={system} selectedLabel={selectedLabel} onLabelSelect={onLabelSelect}
              mrp={mrp} resetTrigger={resetTrigger} isInteracting={isInteracting}
              onInteract={setIsInteracting} glbExists={glbExists}
              structureGlbPath={structureGlbPath} showAllLabels={showAllLabels}
            />
          </Suspense>
        </Canvas>
      )}

      {/* Bottom control bar */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-black/80 backdrop-blur-xl rounded-2xl px-1.5 py-1.5 border border-white/12 shadow-2xl">
        <button onClick={() => setShowAllLabels(p => !p)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wide transition-all ${showAllLabels ? "bg-violet-700/60 text-violet-200" : "text-slate-400 hover:bg-white/8 hover:text-white"}`}
        >
          <Tag size={14} />
          <span>Labels</span>
        </button>
        <button onClick={() => { setShowLayerPanel(p => !p); setShowOpSlider(false); }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wide transition-all ${showLayerPanel ? "bg-violet-700/60 text-violet-200" : "text-slate-400 hover:bg-white/8 hover:text-white"}`}
        >
          <Layers size={14} />
          <span>Layers</span>
        </button>
        <div className="w-px h-7 bg-white/8 mx-0.5" />
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
        <button onClick={() => setResetTrigger(t => t + 1)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wide text-slate-400 hover:bg-white/8 hover:text-white transition-all"
        >
          <Crosshair size={14} />
          <span>Center</span>
        </button>
        <div className="w-px h-7 bg-white/8 mx-0.5" />
        <button onClick={handleReset}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wide text-slate-400 hover:bg-white/8 hover:text-white transition-all"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      {/* Active filter pills */}
      {(isolated || hidden.size > 0 || globalOp < 1) && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-none">
          {isolated && <span className="text-[9px] font-bold bg-violet-900/70 border border-violet-400/40 text-violet-200 px-2 py-0.5 rounded-full backdrop-blur">ISO: {LAYERS.find(l => l.id === isolated)?.label}</span>}
          {hidden.size > 0 && <span className="text-[9px] font-bold bg-slate-900/70 border border-white/20 text-slate-300 px-2 py-0.5 rounded-full backdrop-blur">{hidden.size} hidden</span>}
          {globalOp < 1 && <span className="text-[9px] font-bold bg-slate-900/70 border border-white/20 text-slate-300 px-2 py-0.5 rounded-full backdrop-blur">{Math.round(globalOp * 100)}% opacity</span>}
        </div>
      )}

      {viewMode === "3d" && (
        <p className="absolute top-3 right-16 text-[10px] text-slate-700 pointer-events-none select-none hidden md:block">
          Drag · Scroll · Pinch
        </p>
      )}
    </div>
  );
}
