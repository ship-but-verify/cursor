import { useRef, useEffect } from "react";
import { useSimStore } from "../simulation/store";

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function TrajectoryTimeline() {
  const log = useSimStore((s) => s.log);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [log.length]);
  return (
    <div className="max-h-36 space-y-1 overflow-y-auto pr-0.5">
      {log.length === 0 && (
        <p className="text-[8px] text-slate-600">No events yet. Run a route.</p>
      )}
      {log.map((e, i) => (
        <div
          key={i}
          className="border-b border-slate-800/40 pb-1.5 font-mono text-[8px] last:border-0"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-cyan-700/80">+{e.tRelMs.toFixed(0)} ms</span>
            <span className="text-slate-600">{fmt(e.timestamp)}</span>
          </div>
          <div className="text-slate-300">
            <span className="text-slate-500">{e.state}</span>{" "}
            <span className="text-cyan-500/60">{e.action}</span> → {e.nextState}
          </div>
          {e.verifier !== "pending" && (
            <div className="text-[7px] text-amber-600/90">
              vf: {e.verifier.passed ? "ok" : "X"} {e.verifier.snapshot.slice(0, 48)}…
            </div>
          )}
        </div>
      ))}
      <div ref={bottom} />
    </div>
  );
}
