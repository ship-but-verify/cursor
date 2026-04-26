import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { NuclearWorld } from "./components/World/NuclearWorld";
import { PlayerRobot } from "./components/World/PlayerRobot";
import { SimulationLoop } from "./components/World/SimulationLoop";
import { MissionPanel } from "./components/UI/MissionPanel";
import { TelemetryPanel } from "./components/UI/TelemetryPanel";
import { ArmJointHud } from "./components/UI/ArmJointHud";
import { PhysicalLimitsPanel } from "./components/UI/PhysicalLimitsPanel";
import { VerifierPanel } from "./components/UI/VerifierPanel";
import { SimulationIntegrityPanel } from "./components/UI/SimulationIntegrityPanel";
import { EventLogStrip } from "./components/UI/EventLogStrip";

/**
 * Full-viewport FP simulation: canvas + HUD overlays (pointer-events split).
 */
export default function App() {
  return (
    <div className="font-data relative h-[100dvh] w-full overflow-hidden bg-[#020617] text-slate-100">
      <div className="fixed inset-0 z-0">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false, powerPreference: "default" }}
          className="!block h-full w-full"
          frameloop="always"
        >
          <color attach="background" args={["#020617"]} />
          <fog attach="fog" args={["#020617", 14, 52]} />
          <Suspense fallback={null}>
            <Physics gravity={[0, -9.81, 0]} timeStep="vary">
              <NuclearWorld />
              <PlayerRobot />
              <SimulationLoop />
            </Physics>
          </Suspense>
        </Canvas>
      </div>

      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col p-2 sm:p-3">
        <div className="flex min-h-0 flex-1 flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="pointer-events-auto flex shrink-0 justify-start">
            <MissionPanel />
          </div>
          <div className="min-h-0 flex-1" />
          <div className="pointer-events-auto flex max-h-[min(88dvh,720px)] w-full shrink-0 flex-col gap-2 overflow-y-auto sm:w-[min(100%,300px)]">
            <ArmJointHud />
            <TelemetryPanel />
            <PhysicalLimitsPanel />
            <VerifierPanel />
            <SimulationIntegrityPanel />
          </div>
        </div>
        <div className="pointer-events-auto mt-2 min-h-0 shrink-0 px-0 sm:px-1">
          <EventLogStrip />
        </div>
      </div>
    </div>
  );
}
