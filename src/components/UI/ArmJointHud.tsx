import { useSimulationStore } from "../../store/useSimulationStore";

const PITCH_LIMIT = 5.7;
const YAW_LIMIT = 6.6;

function pct(v: number, lim: number): number {
  return Math.min(100, Math.round((Math.abs(v) / lim) * 100));
}

export function ArmJointHud() {
  const armPitch = useSimulationStore((s) => s.armPitchRad);
  const armYaw = useSimulationStore((s) => s.armYawRad);
  const armStatus = useSimulationStore((s) => s.armStatus);
  const pPct = pct(armPitch, PITCH_LIMIT);
  const yPct = pct(armYaw, YAW_LIMIT);

  const barClass = (percent: number) =>
    percent > 90 ? "bg-rose-500" : percent > 70 ? "bg-amber-400" : "bg-emerald-400";

  return (
    <div className="pointer-events-auto rounded border border-slate-800/90 bg-slate-950/92 p-2 text-[9px] text-slate-200 shadow-lg backdrop-blur-sm">
      <div className="mb-1 border-b border-slate-800 pb-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-300/95">
        Arm joints
      </div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-slate-400">status</span>
        <span className={armStatus === "broken" ? "text-rose-400" : "text-emerald-400"}>
          {armStatus}
        </span>
      </div>
      <div className="space-y-1">
        <div>
          <div className="mb-0.5 flex justify-between text-slate-400">
            <span>pitch</span>
            <span className="font-mono">{armPitch.toFixed(2)} rad</span>
          </div>
          <div className="h-1.5 w-full rounded bg-slate-800">
            <div className={`h-1.5 rounded ${barClass(pPct)}`} style={{ width: `${pPct}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-0.5 flex justify-between text-slate-400">
            <span>yaw</span>
            <span className="font-mono">{armYaw.toFixed(2)} rad</span>
          </div>
          <div className="h-1.5 w-full rounded bg-slate-800">
            <div className={`h-1.5 rounded ${barClass(yPct)}`} style={{ width: `${yPct}%` }} />
          </div>
        </div>
      </div>
      <div className="mt-2 text-[8px] text-slate-500">Controls: I/K pitch, J/L yaw</div>
    </div>
  );
}
