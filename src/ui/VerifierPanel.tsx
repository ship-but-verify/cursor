import { useSimStore } from "../simulation/store";

export function VerifierPanel() {
  const v = useSimStore((s) => s.verifier);
  return (
    <div className="space-y-2 border-b border-slate-800/80 pb-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
        Verifier
      </h2>
      {!v ? (
        <p className="text-[9px] text-slate-600">Awaiting route completion…</p>
      ) : (
        <div className="space-y-2 text-[9px]">
          <div
            className={`font-mono font-medium uppercase tracking-wider ${
              v.passed ? "text-emerald-400" : "text-amber-500"
            }`}
          >
            {v.passed ? "pass" : "fail"}
          </div>
          <ul className="list-inside list-disc text-slate-500">
            {v.details.map((d) => (
              <li key={d} className="font-mono text-[8px] leading-relaxed text-slate-500">
                {d}
              </li>
            ))}
          </ul>
          <p className="text-[8px] leading-relaxed text-slate-500">{v.reasons.join(" ")}</p>
        </div>
      )}
    </div>
  );
}
