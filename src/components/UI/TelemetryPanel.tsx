import { useSimulationStore } from "../../store/useSimulationStore";

export function TelemetryPanel() {
  const telemetryLog = useSimulationStore((s) => s.telemetryLog);
  const rows = telemetryLog.slice(-6);

  return (
    <div className="pointer-events-auto max-h-48 overflow-y-auto rounded border border-slate-800/90 bg-slate-950/92 p-2 text-[9px] text-slate-300 shadow-lg backdrop-blur-sm">
      <div className="mb-1 border-b border-slate-800 pb-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-400/90">
        Telemetry <span className="font-normal text-slate-500">(~4 Hz)</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-slate-500">No samples yet</p>
      ) : (
        <ul className="space-y-1 font-mono leading-tight">
          {rows.map((t, i) => (
            <li key={`${t.timestamp}-${i}`} className="border-b border-slate-800/60 pb-1">
              <span className="text-slate-500">{t.timestamp}</span>{" "}
              <span className="text-emerald-400/90">{t.current_zone}</span>
              <div className="text-slate-400">
                v {t.velocity.map((x) => x.toFixed(1)).join(",")} | bat {t.battery.toFixed(0)}%
              </div>
              <div className="text-slate-500">
                arm {t.arm_status} pitch {t.arm_pitch_rad.toFixed(2)} yaw {t.arm_yaw_rad.toFixed(2)} hold {t.held_object ?? "none"}
              </div>
              {t.physical_limit_warnings.length > 0 && (
                <div className="text-amber-400/90">{t.physical_limit_warnings.join(", ")}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
