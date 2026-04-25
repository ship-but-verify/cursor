import { MissionPanel } from "./MissionPanel";
import { RouteControls } from "./RouteControls";
import { RobotStatus } from "./RobotStatus";
import { TaskChecklist } from "./TaskChecklist";
import { RadiationMeter } from "./RadiationMeter";
import { VerifierPanel } from "./VerifierPanel";
import { TrajectoryTimeline } from "./TrajectoryTimeline";
import { ExportButton } from "./ExportButton";

/**
 * 35% mission deck — all telemetry, routes, and export.
 */
export function Dashboard() {
  return (
    <aside
      className="flex w-[35%] min-w-[280px] flex-col gap-3 overflow-y-auto border-r border-slate-800/80 bg-slate-950/95 p-3"
      data-testid="nd-dashboard"
    >
      <header className="shrink-0">
        <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-cyan-500/90">
          Fleet AI
        </p>
        <h1 className="mt-0.5 text-xs font-semibold text-slate-200">
          Nuclear decommissioning — world pack
        </h1>
      </header>
      <MissionPanel />
      <RouteControls />
      <RobotStatus />
      <TaskChecklist />
      <RadiationMeter />
      <div className="space-y-1">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
          Trajectory
        </h2>
        <TrajectoryTimeline />
      </div>
      <VerifierPanel />
      <ExportButton />
    </aside>
  );
}
