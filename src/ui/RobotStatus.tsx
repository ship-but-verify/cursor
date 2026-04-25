import { useSimStore } from "../simulation/store";

const routeLabel: Record<string, string> = {
  idle: "IDLE",
  safe: "SAFE",
  risky: "RISKY",
  failed: "FAILED",
};

export function RobotStatus() {
  const p = useSimStore((s) => s.robotPos);
  const stack = useSimStore((s) => s.radiationStack);
  const route = useSimStore((s) => s.activeRoute);
  const isAnim = useSimStore((s) => s.isAnimating);
  return (
    <div className="space-y-2 border-b border-slate-800/80 pb-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
        Robot
      </h2>
      <div className="space-y-1 text-[9px] font-mono text-slate-300">
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">status</span>
          <span className={isAnim ? "text-cyan-300" : "text-slate-500"}>
            {isAnim ? "EXEC" : "STBY"}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">route</span>
          <span className="text-amber-200/90">{routeLabel[route] ?? route}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">pose</span>
          <span>
            {p.x.toFixed(1)} {p.y.toFixed(1)} {p.z.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">rad. sensors</span>
          <span className={stack > 0 ? "text-amber-500" : "text-emerald-500/80"}>
            {stack} active
          </span>
        </div>
      </div>
    </div>
  );
}
