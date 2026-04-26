import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  gaugeG12,
  valveV17,
  safeZone,
  playerSpawn,
} from "../../data/worldLayout";
import { RadiationZone } from "./RadiationZone";
import { PickableObjects } from "./PickableObjects";

const htmlCommon = {
  className: "pointer-events-none select-none",
  pointerEvents: "none" as const,
  transform: true,
  occlude: false,
  zIndexRange: [0, 100] as [number, number],
} as const;

const wallColor = { color: "#0f172a", metalness: 0.18, roughness: 0.78 } as const;

/** Facility layout: floor, rooms, debris (LOS), gauge G-12, valve V-17, safe zone. */
export function NuclearWorld() {
  const szCenter = new THREE.Vector3()
    .addVectors(safeZone.min, safeZone.max)
    .multiplyScalar(0.5);
  const szSize = new THREE.Vector3().subVectors(safeZone.max, safeZone.min);

  return (
    <group>
      <hemisphereLight intensity={0.35} color="#94a3b8" groundColor="#020617" />
      <directionalLight
        castShadow
        position={[-14, 22, 10]}
        intensity={1.05}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <Html position={[-9.5, 2.4, 0]} {...htmlCommon}>
        <div className="whitespace-nowrap text-xs font-medium text-cyan-300/95 [text-shadow:0_0_8px_#0c4a6e]">
          Building 7 — Decommissioning
        </div>
      </Html>

      <RigidBody type="fixed" position={[0, -0.1, 0]} colliders="cuboid" name="floor">
        <mesh receiveShadow userData={{ blocksLos: false }}>
          <boxGeometry args={[28, 0.2, 22]} />
          <meshStandardMaterial color="#0b1220" metalness={0.08} roughness={0.88} />
        </mesh>
      </RigidBody>
      {/* Invisible fail-safe floor so the player cannot fall out. */}
      <RigidBody type="fixed" position={[0, -3, 0]} colliders="cuboid" name="failsafe_floor">
        <CuboidCollider args={[40, 0.5, 40]} />
      </RigidBody>
      {/* Invisible perimeter walls around the world bounds. */}
      <RigidBody type="fixed" position={[0, 2, -11.6]} colliders={false} name="bound_north">
        <CuboidCollider args={[15, 3, 0.4]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, 2, 11.6]} colliders={false} name="bound_south">
        <CuboidCollider args={[15, 3, 0.4]} />
      </RigidBody>
      <RigidBody type="fixed" position={[-14.6, 2, 0]} colliders={false} name="bound_west">
        <CuboidCollider args={[0.4, 3, 12]} />
      </RigidBody>
      <RigidBody type="fixed" position={[14.6, 2, 0]} colliders={false} name="bound_east">
        <CuboidCollider args={[0.4, 3, 12]} />
      </RigidBody>

      {/* Corridor + reactor hall shell */}
      <RigidBody type="fixed" position={[-8.5, 1.1, 5.8]} colliders="cuboid" name="wall_n">
        <mesh castShadow receiveShadow userData={{ blocksLos: true }}>
          <boxGeometry args={[5.5, 2.2, 0.22]} />
          <meshStandardMaterial {...wallColor} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[-6.2, 1.1, 3.2]} colliders="cuboid" name="wall_e">
        <mesh castShadow receiveShadow userData={{ blocksLos: true }}>
          <boxGeometry args={[0.22, 2.2, 5.2]} />
          <meshStandardMaterial {...wallColor} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[-1.2, 1.6, -2]} colliders="cuboid" name="reactor_wall">
        <mesh castShadow receiveShadow userData={{ blocksLos: true }}>
          <boxGeometry args={[0.25, 3.2, 12]} />
          <meshStandardMaterial {...wallColor} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" position={[2.5, 1.4, 4.8]} colliders="cuboid" name="bay_divider">
        <mesh castShadow receiveShadow userData={{ blocksLos: true }}>
          <boxGeometry args={[6, 2.8, 0.2]} />
          <meshStandardMaterial {...wallColor} />
        </mesh>
      </RigidBody>

      {/* Debris blocking direct LOS from corridor toward gauge */}
      <RigidBody type="fixed" position={[0.2, 0.55, 2.4]} colliders="cuboid" name="debris_crate">
        <mesh castShadow receiveShadow userData={{ blocksLos: true }}>
          <boxGeometry args={[1.1, 0.7, 0.85]} />
          <meshStandardMaterial color="#334155" metalness={0.25} roughness={0.82} />
        </mesh>
      </RigidBody>

      {/* Pipes (visual + thin collider) */}
      <RigidBody type="fixed" position={[1.2, 0.65, 1]} colliders="cuboid" name="pipe_rung">
        <mesh castShadow userData={{ blocksLos: true }}>
          <cylinderGeometry args={[0.08, 0.08, 4.2, 10]} />
          <meshStandardMaterial color="#64748b" metalness={0.45} roughness={0.42} />
        </mesh>
      </RigidBody>

      {/* Safe zone slab */}
      <RigidBody type="fixed" position={[szCenter.x, 0.02, szCenter.z]} colliders={false}>
        <mesh receiveShadow userData={{ blocksLos: false }}>
          <boxGeometry args={[szSize.x * 0.98, 0.04, szSize.z * 0.98]} />
          <meshStandardMaterial
            color="#14532d"
            emissive="#166534"
            emissiveIntensity={0.12}
            roughness={0.9}
          />
        </mesh>
      </RigidBody>
      <Html position={[szCenter.x, 0.35, szCenter.z]} {...htmlCommon}>
        <div className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300/95">
          SAFE ZONE
        </div>
      </Html>

      {/* Gauge G-12 */}
      <RigidBody
        type="fixed"
        position={[gaugeG12.position.x, gaugeG12.position.y - 0.35, gaugeG12.position.z]}
        colliders={false}
        name="gauge_g12_body"
      >
        <mesh
          castShadow
          userData={{ inspectTarget: "gauge_g12" as const, blocksLos: false }}
        >
          <cylinderGeometry args={[0.22, 0.26, 0.5, 20]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.32, 0.12]} userData={{ inspectTarget: "gauge_g12", blocksLos: false }}>
          <boxGeometry args={[0.35, 0.12, 0.08]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0369a1" emissiveIntensity={0.25} />
        </mesh>
        <CuboidCollider args={[0.32, 0.45, 0.32]} position={[0, 0.05, 0]} />
      </RigidBody>
      <Html position={[gaugeG12.position.x, gaugeG12.position.y + 0.55, gaugeG12.position.z]} {...htmlCommon}>
        <div className="text-[9px] font-mono text-sky-200/95">G-12</div>
      </Html>

      {/* Valve V-17 */}
      <RigidBody
        type="fixed"
        position={[valveV17.position.x, valveV17.position.y - 0.2, valveV17.position.z]}
        colliders={false}
        name="valve_v17_body"
      >
        <mesh castShadow userData={{ inspectTarget: "valve_v17" as const, blocksLos: false }}>
          <cylinderGeometry args={[0.18, 0.22, 0.35, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh
          position={[0.22, 0.1, 0]}
          rotation={[0, 0, Math.PI / 2]}
          userData={{ inspectTarget: "valve_v17", blocksLos: false }}
        >
          <cylinderGeometry args={[0.06, 0.06, 0.5, 10]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.35} />
        </mesh>
        <CuboidCollider args={[0.35, 0.35, 0.35]} position={[0.1, 0.08, 0]} />
      </RigidBody>
      <Html position={[valveV17.position.x, valveV17.position.y + 0.65, valveV17.position.z]} {...htmlCommon}>
        <div className="text-[9px] font-mono text-slate-200/95">V-17</div>
      </Html>

      <Html position={[playerSpawn.x, 1.8, playerSpawn.z - 1.2]} {...htmlCommon}>
        <div className="max-w-[200px] text-[8px] leading-snug text-slate-400">
          Click lock · WASD move · I/K arm pitch · J/L arm yaw · Click pick/drop · E inspect · R reset
        </div>
      </Html>

      <RadiationZone />
      <PickableObjects />
    </group>
  );
}
