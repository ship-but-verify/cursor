import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Html } from "@react-three/drei";
import { useSimStore } from "../simulation/store";

const htmlL = {
  className: "pointer-events-none select-none",
  transform: true,
  occlude: false,
  zIndexRange: [0, 100] as [number, number],
} as const;

/**
 * Rapier sensor volumes for radiation: stack count drives exposure in the store.
 */
export function RadiationSensors() {
  const onEnter = () => {
    useSimStore.getState().radiationEnter();
  };
  const onExit = () => {
    useSimStore.getState().radiationExit();
  };

  return (
    <group>
      <Html position={[0, 0.8, 0.2]} {...htmlL}>
        <div className="text-[9px] font-mono text-amber-200/90">α · Hot cell</div>
      </Html>
      <Html position={[2, 0.8, 1.4]} {...htmlL}>
        <div className="text-[8px] font-mono text-amber-200/80">β · Contam. plume</div>
      </Html>

      <RigidBody type="fixed" position={[0, 0.2, 0]} colliders={false}>
        <mesh>
          <boxGeometry args={[2, 0.3, 1.2]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#b45309"
            emissiveIntensity={0.4}
            transparent
            opacity={0.2}
            depthWrite={false}
            roughness={0.7}
          />
        </mesh>
        <CuboidCollider
          args={[1, 0.15, 0.6]}
          position={[0, 0, 0]}
          sensor
          onIntersectionEnter={onEnter}
          onIntersectionExit={onExit}
        />
      </RigidBody>

      <RigidBody type="fixed" position={[2, 0.2, 1.4]} colliders={false}>
        <mesh>
          <boxGeometry args={[1, 0.2, 0.6]} />
          <meshStandardMaterial
            color="#d97706"
            emissive="#9a3412"
            emissiveIntensity={0.25}
            transparent
            opacity={0.16}
            depthWrite={false}
            roughness={0.8}
          />
        </mesh>
        <CuboidCollider
          args={[0.5, 0.1, 0.3]}
          position={[0, 0, 0]}
          sensor
          onIntersectionEnter={onEnter}
          onIntersectionExit={onExit}
        />
      </RigidBody>
    </group>
  );
}
