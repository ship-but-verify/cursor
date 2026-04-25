import { useSimStore } from "../simulation/store";

export function MissionPanel() {
  const m = useSimStore((s) => s.mission);
  return (
    <div className="space-y-2 border-b border-slate-800/80 pb-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
        Mission
      </h2>
      <h3 className="text-sm font-medium leading-tight text-slate-100">{m.title}</h3>
      <p className="text-[10px] leading-relaxed text-slate-500">{m.description}</p>
      <div className="text-[8px] font-mono text-slate-600">id: {m.id}</div>
    </div>
  );
}
