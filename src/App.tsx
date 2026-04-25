import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { WorldPackScene } from "./three/WorldPackScene";
import { Dashboard } from "./ui/Dashboard";

/**
 * 35% dashboard, 65% 3D scene; dark technical shell.
 */
export default function App() {
  return (
    <div className="font-data flex h-[100dvh] min-h-0 w-full min-w-0 flex-col sm:flex-row">
      <Dashboard />
      <div className="relative flex-1 min-h-0 w-full min-w-0 min-h-[50dvh] sm:min-h-0 sm:min-w-[200px] sm:basis-0 sm:flex-[0.65]">
        <div className="absolute inset-0 z-0 bg-[#020617]" />
        <div className="absolute inset-0 z-10 h-full w-full min-h-0">
          <Canvas
            shadows
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true, powerPreference: "default" }}
            className="!block h-full min-h-0 w-full"
            camera={{ position: [10, 6, 10], fov: 48, near: 0.1, far: 200 }}
            frameloop="always"
          >
            <Suspense fallback={null}>
              <WorldPackScene />
            </Suspense>
          </Canvas>
        </div>
        <div className="pointer-events-none absolute bottom-1 left-1 z-20 max-w-[90%]">
          <p className="text-[8px] text-slate-500">
            Orbit · R3F / Rapier sensors (rad fields) / ND-WP-01
          </p>
        </div>
      </div>
    </div>
  );
}
