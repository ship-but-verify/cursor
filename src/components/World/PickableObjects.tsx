import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useSimulationStore } from "../../store/useSimulationStore";

type PickableDef = {
  id: string;
  pos: [number, number, number];
  color: string;
};

const htmlCommon = {
  className: "pointer-events-none select-none",
  pointerEvents: "none" as const,
  transform: true,
  occlude: false,
  zIndexRange: [0, 100] as [number, number],
} as const;

const defs: PickableDef[] = [
  { id: "tool_crate_a", pos: [-2.4, 0.55, 1.3], color: "#475569" },
  { id: "tool_crate_b", pos: [4.9, 0.55, 1.9], color: "#64748b" },
  { id: "sample_canister", pos: [2.8, 0.55, -1.4], color: "#0ea5e9" },
];

function PickableObject({ def }: { def: PickableDef }) {
  const rb = useRef<RapierRigidBody>(null);
  const heldObjectId = useSimulationStore((s) => s.heldObjectId);
  const armStatus = useSimulationStore((s) => s.armStatus);
  const armPitchRad = useSimulationStore((s) => s.armPitchRad);
  const { camera } = useThree();
  const isHeld = heldObjectId === def.id && armStatus === "nominal";
  const holdDistance = 1.25;

  useFrame(() => {
    if (!isHeld || !rb.current) return;
    const p = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    camera.getWorldPosition(p);
    camera.getWorldDirection(dir);
    const holdPos = p
      .add(dir.multiplyScalar(holdDistance))
      .add(up.multiplyScalar(armPitchRad * 0.45));
    rb.current.setTranslation(holdPos, true);
    rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
  });

  return (
    <RigidBody
      ref={rb}
      type="dynamic"
      colliders="cuboid"
      position={def.pos}
      linearDamping={3}
      angularDamping={3}
      canSleep={false}
      name={def.id}
    >
      <mesh castShadow userData={{ pickupId: def.id, blocksLos: false }}>
        <boxGeometry args={[0.28, 0.28, 0.28]} />
        <meshStandardMaterial color={def.color} metalness={0.4} roughness={0.55} />
      </mesh>
      <Html position={[0, 0.35, 0]} {...htmlCommon}>
        <div className="rounded bg-slate-950/80 px-1 py-0.5 text-[8px] font-mono text-cyan-200/90">
          {def.id}
        </div>
      </Html>
    </RigidBody>
  );
}

export function PickableObjects() {
  const objects = useMemo(() => defs, []);
  return (
    <group>
      {objects.map((d) => (
        <PickableObject key={d.id} def={d} />
      ))}
    </group>
  );
}
