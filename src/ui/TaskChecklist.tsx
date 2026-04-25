import { useSimStore } from "../simulation/store";
import { MAX_SAFE_EXPOSURE, VALVE_INSPECTION_DISTANCE, VALVE_V17 } from "../simulation/world-constants";

function dist2D(x: number, z: number) {
  return Math.hypot(x - VALVE_V17.x, z - VALVE_V17.z);
}

export function TaskChecklist() {
  const mission = useSimStore((s) => s.mission);
  const v = useSimStore((s) => s.verifier);
  const exp = useSimStore((s) => s.exposure);
  const pos = useSimStore((s) => s.robotPos);
  const atValve = dist2D(pos.x, pos.z) <= VALVE_INSPECTION_DISTANCE;
  const dosed = v ? exp <= MAX_SAFE_EXPOSURE : false;

  const items = [
    { id: 0, label: mission.objectives[0] ?? "Physics online", done: v !== null },
    { id: 1, label: mission.objectives[1] ?? "V-17 approach", done: v !== null && atValve },
    { id: 2, label: mission.objectives[2] ?? "Dose model", done: v !== null && dosed },
    { id: 3, label: mission.objectives[3] ?? "Trace", done: v !== null },
  ];

  return (
    <div className="space-y-2 border-b border-slate-800/80 pb-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
        Checklist
      </h2>
      <ul className="space-y-1.5 text-[9px]">
        {items.map((i) => (
          <li key={i.id} className="flex items-start gap-2">
            <span
              className={`mt-0.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-sm ${
                i.done ? "bg-emerald-500" : "bg-slate-600"
              }`}
            />
            <span
              className={
                i.done
                  ? "text-slate-200 line-through decoration-slate-600/80"
                  : "text-slate-500"
              }
            >
              {i.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
