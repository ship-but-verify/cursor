import { RigidBody } from "@react-three/rapier";
import { Html } from "@react-three/drei";
import { VALVE_V17 } from "../simulation/world-constants";

const floorSize = { x: 22, y: 0.2, z: 18 } as const;

const htmlCommon = {
  className: "pointer-events-none select-none",
  transform: true,
  occlude: false,
  zIndexRange: [0, 100] as [number, number],
} as const;

/**
 * Reactor hall and props — R3F primitives with fixed colliders.
 */
export function EnvironmentPrimitives() {
  return (
    <group>
      <Html position={[-2, 3, -7]} {...htmlCommon}>
        <div
          className="whitespace-nowrap text-xs font-medium text-cyan-300/95 [text-shadow:0_0_8px_#0c4a6e]"
        >
          Reactor Hall — Bldg 7
        </div>
      </Html>
      <Html position={[3, 0.1, 6.5]} {...htmlCommon}>
        <div className="px-1.5 py-0.5 text-[8px] font-mono text-cyan-300/90">
          FLEET ND-WP-01
        </div>
      </Html>

      <RigidBody type="fixed" position={[0, -0.1, 0]} colliders="cuboid">
        <mesh receiveShadow>
          <boxGeometry args={[floorSize.x, floorSize.y, floorSize.z]} />
          <meshStandardMaterial color="#0b1220" metalness={0.1} roughness={0.85} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" position={[-6, 0.9, 4]} colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4, 1.8, 0.2]} />
          <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.75} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[-4, 0.9, 6.2]} colliders="cuboid">
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.2, 1.8, 4.4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.75} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" position={[-2, 0.3, 1.1]} colliders="cuboid">
        <mesh>
          <boxGeometry args={[8, 0.6, 0.1]} />
          <meshStandardMaterial
            color="#0f3d2e"
            emissive="#14532d"
            emissiveIntensity={0.18}
            transparent
            opacity={0.4}
            roughness={0.9}
            depthWrite={false}
          />
        </mesh>
      </RigidBody>
      <Html position={[-5.5, 0.4, 3]} {...htmlCommon}>
        <div className="text-[8px] font-mono text-emerald-400/90">Safe path</div>
      </Html>

      <mesh
        position={[-1, 0.55, 5.4]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.1, 0.1, 5, 12]} />
        <meshStandardMaterial color="#64748b" metalness={0.4} roughness={0.45} />
      </mesh>
      <mesh position={[4, 0.4, 3]} rotation={[Math.PI / 2, 0, 0.4]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 2.2, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.45} roughness={0.5} />
      </mesh>
      <mesh position={[-0.2, 0.35, 3.1]} rotation={[-0.1, 0, 0.1]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.2, 10]} />
        <meshStandardMaterial color="#334155" metalness={0.2} />
      </mesh>

      {(
        [
          [-4.1, 0.35, 0.6],
          [-2.1, 0.35, -0.1],
          [5.1, 0.35, 0.1],
        ] as const
      ).map((pos, i) => (
        <group key={i} position={[...pos]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.3, 0.32, 0.6, 16]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#b45309" : "#a16207"}
              metalness={0.1}
              roughness={0.6}
            />
          </mesh>
        </group>
      ))}
      {(
        [
          [0.2, 0.12, 0.1],
          [1, 0.1, 0.3],
          [-0.1, 0.14, 0.3],
        ] as const
      ).map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.18, 0.12, 0.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      ))}

      <group position={[VALVE_V17.x, VALVE_V17.y, VALVE_V17.z]}>
        <Html position={[0, 0.7, 0]} {...htmlCommon}>
          <div className="text-[10px] font-mono text-cyan-200/95">V-17</div>
        </Html>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.06, 8, 24]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.2, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.25} />
        </mesh>
      </group>
    </group>
  );
}
