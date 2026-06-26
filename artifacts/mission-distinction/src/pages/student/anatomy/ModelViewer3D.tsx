import React, { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";
import type { AnatomySystem, StructureLabel } from "@/data/anatomyData";

// ── Label pin rendered in 3D space ────────────────────────────────────────────
function Label3D({
  label,
  selected,
  onSelect,
}: {
  label: StructureLabel;
  selected: boolean;
  onSelect: (l: StructureLabel) => void;
}) {
  return (
    <Html position={label.pos} center distanceFactor={6}>
      <button
        onClick={() => onSelect(label)}
        className={`flex items-center gap-1.5 cursor-pointer select-none transition-all ${selected ? "scale-110" : "hover:scale-105"}`}
        style={{ background: "none", border: "none", padding: 0 }}
      >
        <span
          className="block rounded-full border-2 shadow-lg"
          style={{
            width: selected ? 12 : 9,
            height: selected ? 12 : 9,
            background: selected ? "#7c3aed" : "rgba(255,255,255,0.9)",
            borderColor: selected ? "#a78bfa" : "#6366f1",
            boxShadow: selected ? "0 0 8px #7c3aed" : undefined,
            transition: "all 0.15s",
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: selected ? "#c4b5fd" : "#e2e8f0",
            background: "rgba(0,0,0,0.65)",
            padding: "1px 5px",
            borderRadius: 4,
            whiteSpace: "nowrap",
            textShadow: "0 1px 2px #000",
          }}
        >
          {label.name}
        </span>
      </button>
    </Html>
  );
}

// ── Slow rotation animation ───────────────────────────────────────────────────
function AutoRotate({ paused }: { paused: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (!paused && ref.current) ref.current.rotation.y += dt * 0.18;
  });
  return <group ref={ref} />;
}

// ═════════════════════════════════════════════════════════════════════════════
// Per-system 3D models
// ═════════════════════════════════════════════════════════════════════════════

function HeartModel() {
  const boneM = <meshPhysicalMaterial color="#8B0000" roughness={0.45} metalness={0.12} clearcoat={0.3} />;
  const blueM = <meshPhysicalMaterial color="#1e3a8a" roughness={0.4} metalness={0.15} />;
  const artM  = <meshPhysicalMaterial color="#cc0000" roughness={0.35} metalness={0.2} clearcoat={0.4} />;
  return (
    <group scale={1.0}>
      {/* Left Ventricle - bigger, more muscular */}
      <mesh position={[-0.28, -0.12, 0]} castShadow>
        <sphereGeometry args={[0.55, 32, 32]} />
        {boneM}
      </mesh>
      {/* Right Ventricle */}
      <mesh position={[0.3, -0.22, 0.05]} castShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhysicalMaterial color="#a01020" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Left Atrium - posterior superior */}
      <mesh position={[-0.3, 0.42, -0.15]} castShadow>
        <sphereGeometry args={[0.35, 28, 28]} />
        <meshPhysicalMaterial color="#9b1010" roughness={0.45} metalness={0.1} />
      </mesh>
      {/* Right Atrium */}
      <mesh position={[0.32, 0.38, -0.1]} castShadow>
        <sphereGeometry args={[0.38, 28, 28]} />
        <meshPhysicalMaterial color="#b01515" roughness={0.45} metalness={0.1} />
      </mesh>
      {/* Ascending Aorta */}
      <mesh position={[-0.08, 0.95, 0.05]} rotation={[0.15, 0, -0.15]} castShadow>
        <cylinderGeometry args={[0.14, 0.17, 0.75, 16]} />
        {artM}
      </mesh>
      {/* Aortic arch curve */}
      <mesh position={[-0.08, 1.3, 0.05]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        {artM}
      </mesh>
      {/* Pulmonary trunk - blue/purple */}
      <mesh position={[0.26, 0.85, 0.15]} rotation={[0.1, 0, 0.25]} castShadow>
        <cylinderGeometry args={[0.11, 0.13, 0.6, 16]} />
        {blueM}
      </mesh>
      {/* SVC */}
      <mesh position={[0.38, 0.95, -0.1]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.5, 12]} />
        {blueM}
      </mesh>
      {/* IVC */}
      <mesh position={[0.38, -0.88, -0.1]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.55, 12]} />
        {blueM}
      </mesh>
    </group>
  );
}

function HumerusModel() {
  const boneM = <meshPhysicalMaterial color="#F5EFDC" roughness={0.72} metalness={0.0} clearcoat={0.15} />;
  const cortM = <meshPhysicalMaterial color="#EDE8D5" roughness={0.65} metalness={0.0} />;
  return (
    <group scale={1.0}>
      {/* Shaft */}
      <mesh castShadow>
        <cylinderGeometry args={[0.18, 0.2, 2.6, 24]} />
        {boneM}
      </mesh>
      {/* Humeral head - sphere */}
      <mesh position={[-0.1, 1.5, 0]} rotation={[0, 0, -0.35]} castShadow>
        <sphereGeometry args={[0.42, 32, 32]} />
        {boneM}
      </mesh>
      {/* Greater tubercle */}
      <mesh position={[0.32, 1.28, 0]} castShadow>
        <sphereGeometry args={[0.18, 20, 20]} />
        {cortM}
      </mesh>
      {/* Lesser tubercle */}
      <mesh position={[-0.32, 1.22, 0.15]} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        {cortM}
      </mesh>
      {/* Lateral epicondyle */}
      <mesh position={[0.3, -1.38, 0]} castShadow>
        <sphereGeometry args={[0.19, 20, 20]} />
        {cortM}
      </mesh>
      {/* Medial epicondyle - slightly bigger */}
      <mesh position={[-0.34, -1.4, 0]} castShadow>
        <sphereGeometry args={[0.22, 20, 20]} />
        {cortM}
      </mesh>
      {/* Condyle block */}
      <mesh position={[0, -1.38, 0.05]} castShadow>
        <cylinderGeometry args={[0.35, 0.22, 0.22, 24]} />
        {boneM}
      </mesh>
    </group>
  );
}

function BrainModel() {
  const cortexM = <meshPhysicalMaterial color="#D4B5A8" roughness={0.6} metalness={0.0} clearcoat={0.1} />;
  const cerebM  = <meshPhysicalMaterial color="#C8A595" roughness={0.65} metalness={0.0} />;
  const stemM   = <meshPhysicalMaterial color="#B8967A" roughness={0.7} metalness={0.0} />;
  return (
    <group scale={1.0}>
      {/* Left hemisphere */}
      <mesh position={[-0.32, 0.05, 0]} scale={[1.0, 0.92, 1.08]} castShadow>
        <sphereGeometry args={[0.82, 32, 32]} />
        {cortexM}
      </mesh>
      {/* Right hemisphere */}
      <mesh position={[0.32, 0.05, 0]} scale={[1.0, 0.92, 1.08]} castShadow>
        <sphereGeometry args={[0.82, 32, 32]} />
        {cortexM}
      </mesh>
      {/* Temporal lobe L */}
      <mesh position={[-0.95, -0.35, 0.25]} scale={[0.7, 0.55, 0.8]} castShadow>
        <sphereGeometry args={[0.55, 24, 24]} />
        {cortexM}
      </mesh>
      {/* Temporal lobe R */}
      <mesh position={[0.95, -0.35, 0.25]} scale={[0.7, 0.55, 0.8]} castShadow>
        <sphereGeometry args={[0.55, 24, 24]} />
        {cortexM}
      </mesh>
      {/* Cerebellum */}
      <mesh position={[0, -0.82, -0.72]} scale={[1.2, 0.65, 0.9]} castShadow>
        <sphereGeometry args={[0.55, 28, 28]} />
        {cerebM}
      </mesh>
      {/* Brainstem */}
      <mesh position={[0, -1.05, -0.1]} rotation={[0.35, 0, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.75, 16]} />
        {stemM}
      </mesh>
    </group>
  );
}

function LungsModel() {
  const lungM   = <meshPhysicalMaterial color="#E8A0A0" roughness={0.55} metalness={0.05} transparent opacity={0.92} />;
  const tracheM = <meshPhysicalMaterial color="#d0c0a0" roughness={0.7} metalness={0.0} />;
  return (
    <group scale={1.05}>
      {/* Right lung - 3 lobes, slightly larger */}
      <mesh position={[0.75, 0.0, 0]} scale={[0.82, 1.35, 0.75]} castShadow>
        <sphereGeometry args={[0.72, 28, 28]} />
        {lungM}
      </mesh>
      {/* Fissure hint on right lung */}
      <mesh position={[0.75, 0.25, 0.6]} scale={[0.6, 0.05, 0.5]}>
        <sphereGeometry args={[0.72, 12, 12]} />
        <meshPhysicalMaterial color="#C88080" roughness={1} transparent opacity={0.5} />
      </mesh>
      {/* Left lung - 2 lobes, slightly smaller, cardiac notch */}
      <mesh position={[-0.75, 0.05, 0]} scale={[0.78, 1.3, 0.72]} castShadow>
        <sphereGeometry args={[0.7, 28, 28]} />
        {lungM}
      </mesh>
      {/* Trachea */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.65, 14]} />
        {tracheM}
      </mesh>
      {/* Carina / bifurcation */}
      <mesh position={[0, 1.08, 0]} castShadow>
        <sphereGeometry args={[0.12, 12, 12]} />
        {tracheM}
      </mesh>
      {/* Right main bronchus - more vertical */}
      <mesh position={[0.35, 0.85, 0]} rotation={[0, 0, -0.42]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.5, 12]} />
        {tracheM}
      </mesh>
      {/* Left main bronchus - more horizontal */}
      <mesh position={[-0.38, 0.78, 0]} rotation={[0, 0, 0.52]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.56, 12]} />
        {tracheM}
      </mesh>
    </group>
  );
}

function MuscleModel() {
  const muscleM  = <meshPhysicalMaterial color="#8B2020" roughness={0.55} metalness={0.08} clearcoat={0.1} />;
  const boneM    = <meshPhysicalMaterial color="#F0EAD6" roughness={0.7} metalness={0.0} />;
  const tendonM  = <meshPhysicalMaterial color="#C8B090" roughness={0.65} metalness={0.05} />;
  return (
    <group scale={0.95}>
      {/* Humerus shaft (bone) */}
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.17, 2.2, 20]} />
        {boneM}
      </mesh>
      {/* Deltoid - anterior head */}
      <mesh position={[-0.52, 0.62, 0.22]} scale={[0.6, 1.05, 0.6]} castShadow>
        <sphereGeometry args={[0.45, 20, 20]} />
        {muscleM}
      </mesh>
      {/* Deltoid - middle head (largest) */}
      <mesh position={[-0.72, 0.32, 0]} scale={[0.55, 1.1, 0.5]} castShadow>
        <sphereGeometry args={[0.5, 22, 22]} />
        <meshPhysicalMaterial color="#9B2525" roughness={0.52} metalness={0.08} />
      </mesh>
      {/* Deltoid - posterior head */}
      <mesh position={[-0.52, 0.45, -0.28]} scale={[0.55, 1.0, 0.55]} castShadow>
        <sphereGeometry args={[0.42, 20, 20]} />
        {muscleM}
      </mesh>
      {/* Deltoid insertion tendon */}
      <mesh position={[-0.35, -0.05, 0]} rotation={[0, 0, 0.5]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 10]} />
        {tendonM}
      </mesh>
      {/* Biceps brachii */}
      <mesh position={[-0.28, -0.6, 0.2]} scale={[0.55, 1.1, 0.55]} castShadow>
        <sphereGeometry args={[0.3, 18, 18]} />
        <meshPhysicalMaterial color="#7A1818" roughness={0.58} metalness={0.06} />
      </mesh>
      {/* Triceps (posterior) */}
      <mesh position={[0.38, -0.55, -0.1]} scale={[0.65, 1.15, 0.5]} castShadow>
        <sphereGeometry args={[0.32, 18, 18]} />
        {muscleM}
      </mesh>
    </group>
  );
}

function DigestiveModel() {
  const liverM   = <meshPhysicalMaterial color="#8B3A1A" roughness={0.6} metalness={0.06} clearcoat={0.15} />;
  const stomachM = <meshPhysicalMaterial color="#C06040" roughness={0.58} metalness={0.05} />;
  const gutM     = <meshPhysicalMaterial color="#E8B090" roughness={0.6} metalness={0.02} />;
  return (
    <group scale={0.95}>
      {/* Liver - large right upper quadrant */}
      <mesh position={[0.65, 0.52, 0]} scale={[1.1, 0.68, 0.75]} castShadow>
        <sphereGeometry args={[0.72, 28, 28]} />
        {liverM}
      </mesh>
      {/* Liver left lobe */}
      <mesh position={[0.1, 0.52, 0.08]} scale={[0.7, 0.45, 0.6]} castShadow>
        <sphereGeometry args={[0.5, 22, 22]} />
        {liverM}
      </mesh>
      {/* Gallbladder */}
      <mesh position={[0.68, 0.1, 0.45]} scale={[0.5, 0.7, 0.5]} castShadow>
        <sphereGeometry args={[0.18, 14, 14]} />
        <meshPhysicalMaterial color="#5C7A2A" roughness={0.6} metalness={0.04} />
      </mesh>
      {/* Stomach body */}
      <mesh position={[-0.35, 0.35, 0.15]} scale={[0.85, 0.75, 0.55]} castShadow>
        <sphereGeometry args={[0.52, 24, 24]} />
        {stomachM}
      </mesh>
      {/* Stomach fundus */}
      <mesh position={[-0.58, 0.72, 0.1]} scale={[0.75, 0.7, 0.6]} castShadow>
        <sphereGeometry args={[0.35, 20, 20]} />
        {stomachM}
      </mesh>
      {/* Stomach antrum/pylorus */}
      <mesh position={[0.08, 0.18, 0.2]} scale={[0.7, 0.5, 0.5]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        {stomachM}
      </mesh>
      {/* Small intestine loops */}
      <mesh position={[0, -0.45, 0.1]} scale={[1.1, 0.55, 0.7]} castShadow>
        <torusGeometry args={[0.42, 0.1, 10, 24]} />
        {gutM}
      </mesh>
      <mesh position={[-0.15, -0.6, 0]} scale={[0.9, 0.5, 0.65]} castShadow>
        <torusGeometry args={[0.35, 0.09, 10, 20]} />
        {gutM}
      </mesh>
    </group>
  );
}

// ── Model selector ────────────────────────────────────────────────────────────
function SystemModel({ systemId }: { systemId: string }) {
  const map: Record<string, React.ReactElement> = {
    cardiovascular: <HeartModel />,
    skeletal: <HumerusModel />,
    nervous: <BrainModel />,
    respiratory: <LungsModel />,
    muscular: <MuscleModel />,
    digestive: <DigestiveModel />,
  };
  return map[systemId] ?? <HumerusModel />;
}

// ── Scene ─────────────────────────────────────────────────────────────────────
function Scene({
  system,
  showLabels,
  onLabelSelect,
  selectedLabel,
  isInteracting,
}: {
  system: AnatomySystem;
  showLabels: boolean;
  onLabelSelect: (l: StructureLabel) => void;
  selectedLabel: string | null;
  isInteracting: boolean;
}) {
  const labels = system.structures.flatMap(s => s.labels);
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3, 2, -3]} intensity={0.8} color="#a78bfa" />
      <pointLight position={[3, -2, 3]} intensity={0.5} color="#f0f4ff" />
      <Environment preset="studio" />

      <group>
        <SystemModel systemId={system.id} />
        {showLabels && labels.map(label => (
          <Label3D
            key={label.id}
            label={label}
            selected={selectedLabel === label.id}
            onSelect={onLabelSelect}
          />
        ))}
      </group>

      <ContactShadows position={[0, -2.0, 0]} opacity={0.35} scale={5} blur={2} far={3} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={2.5}
        maxDistance={8}
        autoRotate={!isInteracting}
        autoRotateSpeed={0.6}
      />
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Public component
// ═════════════════════════════════════════════════════════════════════════════
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

  return (
    <div
      className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950"
      onPointerDown={() => setIsInteracting(true)}
      onPointerUp={() => setIsInteracting(false)}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene
            system={system}
            showLabels={showLabels}
            onLabelSelect={onLabelSelect}
            selectedLabel={selectedLabel}
            isInteracting={isInteracting}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
