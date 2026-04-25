import type { ExportPayload } from "../simulation/types";
import { useSimStore } from "../simulation/store";
import { MAX_SAFE_EXPOSURE, VALVE_INSPECTION_DISTANCE, VALVE_V17 } from "../simulation/world-constants";

function dist2D(x: number, z: number) {
  return Math.hypot(x - VALVE_V17.x, z - VALVE_V17.z);
}

function ResetBlock() {
  const reset = useSimStore((s) => s.reset);
  return (
    <button
      type="button"
      onClick={reset}
      className="mb-2 w-full rounded border border-slate-800 py-1 text-[9px] text-slate-500 transition hover:border-slate-600 hover:text-slate-300"
    >
      Reset simulation
    </button>
  );
}

/**
 * Do not use useSimStore with a selector that returns a new [] / {} every call —
 * React 19 + Zustand will warn (getSnapshot) and can max-update-depth loop.
 * Export only reads state in the click handler via getState().
 */
export function ExportButton() {
  return (
    <div className="pt-1">
      <ResetBlock />
      <button
        type="button"
        onClick={() => {
          const s = useSimStore.getState();
          const { mission, log, exposure, verifier, robotPos, activeRoute } = s;
          const at = dist2D(robotPos.x, robotPos.z) <= VALVE_INSPECTION_DISTANCE;
          const payload: ExportPayload = {
            mission,
            log,
            finalExposure: exposure,
            verifier,
            atValve: at,
            inSafeCorridor: robotPos.x < -0.5,
            activeRoute,
            exportedAt: new Date().toISOString(),
          };
          const b = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
          });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(b);
          a.download = "fleet-nd-mission-trace.json";
          a.click();
          URL.revokeObjectURL(a.href);
        }}
        className="w-full rounded border border-cyan-800/50 bg-cyan-950/40 py-1.5 text-[10px] font-mono text-cyan-200 transition hover:border-cyan-500/50 hover:bg-cyan-900/30"
      >
        Export JSON trace
      </button>
      <p className="mt-1 text-[8px] text-slate-600">ND-WP-01 / exposure cap {MAX_SAFE_EXPOSURE} mSv</p>
    </div>
  );
}
