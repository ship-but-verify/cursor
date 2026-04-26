import { useSimulationStore } from "../../store/useSimulationStore";

export function SimulationIntegrityPanel() {
  const anyHigh = useSimulationStore((s) => s.anyIntegrityHigh);
  const highCount = useSimulationStore((s) => s.highIntegrityCount);
  const integrityLog = useSimulationStore((s) => s.integrityLog);
  const items = integrityLog.slice(-10);

  return (
    <div className="pointer-events-auto max-h-44 overflow-y-auto rounded border border-slate-800/90 bg-slate-950/92 p-2 text-[9px] shadow-lg backdrop-blur-sm">
      <div className="mb-1 flex items-center justify-between border-b border-slate-800 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-400/95">
          Simulation integrity
        </span>
        <span className={anyHigh ? "text-rose-400" : "text-slate-500"}>
          high: {highCount}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-slate-500">No events</p>
      ) : (
        <ul className="space-y-1">
          {items.map((e, i) => (
            <li
              key={`${e.timestamp}-${e.issue}-${i}`}
              className={
                e.severity === "high"
                  ? "text-rose-400/95"
                  : e.severity === "medium"
                    ? "text-amber-300/90"
                    : "text-slate-400"
              }
            >
              <span className="font-mono text-slate-500">{e.timestamp}</span> {e.issue}:{" "}
              {e.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
