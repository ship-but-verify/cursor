import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BallCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Box, Html } from "@react-three/drei";
import { useSimStore } from "../simulation/store";

const htmlL = {
  className: "pointer-events-none select-none",
  transform: true,
  occlude: false,
  zIndexRange: [0, 100] as [number, number],
} as const;

/**
 * Kinematic transporter: position driven by the simulation store / route player.
 */
export function Robot() {
  const pos = useSimStore((s) => s.robotPos);
  const rb = useRef<RapierRigidBody | null>(null);
  const t = useRef({ x: pos.x, y: pos.y, z: pos.z });

  useFrame(() => {
    t.current.x = pos.x;
    t.current.y = pos.y;
    t.current.z = pos.z;
    rb.current?.setTranslation(t.current, true);
  });

  return (
    <RigidBody
      ref={rb}
      name="nd-robot"
      type="kinematicPosition"
      colliders={false}
    >
      <BallCollider args={[0.42]} />
      <group name="nd-robot-graphic" position={[0, 0, 0]}>
        <mesh castShadow position={[0, 0.15, 0]}>
          <capsuleGeometry args={[0.28, 0.35, 8, 16]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#0369a1"
            emissiveIntensity={0.2}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
        <Box args={[0.1, 0.08, 0.2]} position={[0, 0.35, 0.2]}>
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.5} />
        </Box>
        <Html position={[0, 0.6, 0]} {...htmlL} center>
          <div className="text-[9px] font-mono text-cyan-200/90">ND-1</div>
        </Html>
      </group>
    </RigidBody>
  );
}
