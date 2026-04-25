import { useSimStore } from "../simulation/store";

export function RouteControls() {
  const isAnimating = useSimStore((s) => s.isAnimating);
  const startRoute = useSimStore((s) => s.startRoute);

  return (
    <div className="space-y-2">
      <p className="text-[9px] font-mono text-slate-500">Scenario runner</p>
      <div className="grid grid-cols-1 gap-1.5">
        <button
          type="button"
          disabled={isAnimating}
          onClick={() => startRoute("safe")}
          className="rounded border border-slate-700/80 bg-slate-900/50 py-1.5 text-left text-[10px] text-slate-200 transition hover:border-emerald-600/50 hover:text-emerald-200 disabled:opacity-40"
        >
          <span className="font-mono text-emerald-400">A</span> — Run safe route
        </button>
        <button
          type="button"
          disabled={isAnimating}
          onClick={() => startRoute("risky")}
          className="rounded border border-slate-700/80 bg-slate-900/50 py-1.5 text-left text-[10px] text-slate-200 transition hover:border-amber-500/50 hover:text-amber-200 disabled:opacity-40"
        >
          <span className="font-mono text-amber-500">B</span> — Run risky route
        </button>
        <button
          type="button"
          disabled={isAnimating}
          onClick={() => startRoute("failed")}
          className="rounded border border-slate-700/80 bg-slate-900/50 py-1.5 text-left text-[10px] text-slate-200 transition hover:border-rose-500/50 hover:text-rose-200 disabled:opacity-40"
        >
          <span className="font-mono text-rose-500">C</span> — Run failed route
        </button>
      </div>
    </div>
  );
}
