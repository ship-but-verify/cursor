import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Html } from "@react-three/drei";
import { useSimulationStore } from "../../store/useSimulationStore";

const htmlL = {
  className: "pointer-events-none select-none",
  pointerEvents: "none" as const,
  transform: true,
  occlude: false,
  zIndexRange: [0, 100] as [number, number],
} as const;

/** Sensor volumes — stack count drives exposure dose in the store. */
export function RadiationZone() {
  const onEnter = () => useSimulationStore.getState().radiationEnter();
  const onExit = () => useSimulationStore.getState().radiationExit();

  return (
    <group>
      <Html position={[0.2, 1.1, -0.4]} {...htmlL}>
        <div className="text-[9px] font-mono text-amber-200/90">Hot cell</div>
      </Html>
      <Html position={[4.2, 1.0, 0.6]} {...htmlL}>
        <div className="text-[8px] font-mono text-amber-200/80">Contam. plume</div>
      </Html>

      <RigidBody type="fixed" position={[0.4, 0.25, -0.2]} colliders={false}>
        <mesh>
          <boxGeometry args={[2.4, 0.35, 1.4]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#b45309"
            emissiveIntensity={0.35}
            transparent
            opacity={0.18}
            depthWrite={false}
            roughness={0.75}
          />
        </mesh>
        <CuboidCollider
          args={[1.2, 0.175, 0.7]}
          sensor
          onIntersectionEnter={onEnter}
          onIntersectionExit={onExit}
        />
      </RigidBody>

      <RigidBody type="fixed" position={[4.2, 0.22, 0.8]} colliders={false}>
        <mesh>
          <boxGeometry args={[1.2, 0.25, 0.8]} />
          <meshStandardMaterial
            color="#d97706"
            emissive="#9a3412"
            emissiveIntensity={0.22}
            transparent
            opacity={0.14}
            depthWrite={false}
            roughness={0.85}
          />
        </mesh>
        <CuboidCollider
          args={[0.6, 0.125, 0.4]}
          sensor
          onIntersectionEnter={onEnter}
          onIntersectionExit={onExit}
        />
      </RigidBody>
    </group>
  );
}
