import { useSimStore } from "../simulation/store";
import { MAX_SAFE_EXPOSURE } from "../simulation/world-constants";

const cap = 40;

export function RadiationMeter() {
  const mSv = useSimStore((s) => s.exposure);
  const pct = Math.min(1, mSv / cap);
  return (
    <div className="space-y-2 border-b border-slate-800/80 pb-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
        Integrated dose
      </h2>
      <div className="text-[9px] font-mono text-slate-300">
        <div className="mb-0.5 flex justify-between text-[8px] text-slate-500">
          <span>mSv (sim.)</span>
          <span>
            {mSv.toFixed(1)} <span className="text-slate-600">/ {MAX_SAFE_EXPOSURE} cap</span>
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-sm bg-slate-900">
          <div
            className="h-full rounded-sm transition-[width,background] duration-150"
            style={{
              width: `${Math.round(pct * 100)}%`,
              background:
                mSv <= MAX_SAFE_EXPOSURE * 0.6
                  ? "linear-gradient(90deg,#10b981,#d97706)"
                  : mSv <= MAX_SAFE_EXPOSURE
                    ? "linear-gradient(90deg,#d97706,#f97316)"
                    : "linear-gradient(90deg,#f97316,#dc2626)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
