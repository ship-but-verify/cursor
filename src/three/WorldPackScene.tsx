import { Suspense } from "react";
import { OrbitControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { EnvironmentPrimitives } from "./EnvironmentPrimitives";
import { RadiationSensors } from "./RadiationSensors";
import { Robot } from "./Robot";
import { SimulationController } from "./SimulationController";

/**
 * R3F world. Lights / controls render immediately; Physics and HDR load inside nested Suspense
 * so the canvas is not stuck empty until all async work completes.
 */
export function WorldPackScene() {
  return (
    <>
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 8, 32]} />
      <hemisphereLight intensity={0.45} groundColor="#0b1020" color="#e0f2fe" />
      <ambientLight intensity={0.22} />
      <pointLight position={[-3, 4, 2]} intensity={0.2} color="#7dd3fc" />
      <directionalLight
        position={[10, 16, 8]}
        intensity={0.85}
        castShadow
      />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={0.3}
        maxPolarAngle={1.3}
        minDistance={4}
        maxDistance={20}
        target={[-0.5, 0, 0]}
      />
      <Suspense fallback={null}>
        <Physics gravity={[0, 0, 0]} debug={false}>
          <EnvironmentPrimitives />
          <RadiationSensors />
          <Robot />
          <SimulationController />
        </Physics>
      </Suspense>
    </>
  );
}
