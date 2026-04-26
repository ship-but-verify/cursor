import { useSimulationStore } from "../../store/useSimulationStore";

export function PhysicalLimitsPanel() {
  const physicalWarnings = useSimulationStore((s) => s.physicalWarnings);
  const warnings = physicalWarnings.slice(-8);

  return (
    <div className="pointer-events-auto max-h-40 overflow-y-auto rounded border border-slate-800/90 bg-slate-950/92 p-2 text-[9px] shadow-lg backdrop-blur-sm">
      <div className="mb-1 border-b border-slate-800 pb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-400/90">
        Physical limits
      </div>
      {warnings.length === 0 ? (
        <p className="text-slate-500">No warnings</p>
      ) : (
        <ul className="space-y-1">
          {warnings.map((w, i) => (
            <li
              key={`${w.timestamp}-${w.code}-${i}`}
              className={
                w.level === "limit_exceeded" ? "text-rose-400/95" : "text-amber-300/90"
              }
            >
              <span className="font-mono text-slate-500">{w.timestamp}</span> {w.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
