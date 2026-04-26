import { useSimulationStore } from "../../store/useSimulationStore";

export function VerifierPanel() {
  const v = useSimulationStore((s) => s.verifier);

  if (!v) {
    return (
      <div className="pointer-events-auto rounded border border-slate-800/90 bg-slate-950/92 p-2 text-[9px] text-slate-500 shadow-lg backdrop-blur-sm">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-cyan-400/90">
          Verifier
        </div>
        <p className="mt-1">Run ends in safe zone to evaluate.</p>
      </div>
    );
  }

  const row = (label: string, ok: boolean) => (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className={ok ? "text-emerald-400" : "text-rose-400"}>{ok ? "pass" : "fail"}</span>
    </div>
  );

  return (
    <div className="pointer-events-auto max-h-56 overflow-y-auto rounded border border-slate-800/90 bg-slate-950/92 p-2 text-[9px] text-slate-200 shadow-lg backdrop-blur-sm">
      <div className="mb-1 border-b border-slate-800 pb-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-400/90">
        Verifier
      </div>
      <div className="mb-2 font-medium">
        mission_success:{" "}
        <span className={v.mission_success ? "text-emerald-400" : "text-rose-400"}>
          {String(v.mission_success)}
        </span>
      </div>
      <div className="mb-2 text-slate-400">
        run_validity: <span className="text-slate-100">{v.run_validity}</span>
      </div>
      <div className="grid gap-0.5 font-mono">
        {row("gauge", v.gauge_inspected)}
        {row("valve", v.valve_inspected)}
        {row("safe zone", v.returned_to_safe_zone)}
        {row("radiation", v.radiation_limit_passed)}
        {row("speed", v.speed_limit_passed)}
        {row("accel", v.acceleration_limit_passed)}
        {row("contact", v.contact_force_passed)}
        {row("sensor range", v.sensor_range_passed)}
        {row("LOS", v.line_of_sight_passed)}
        {row("integrity", v.simulation_integrity_passed)}
        {row("collision-free", v.collision_free)}
      </div>
      {v.failure_mode && (
        <p className="mt-2 text-rose-400/90">failure_mode: {v.failure_mode}</p>
      )}
    </div>
  );
}
