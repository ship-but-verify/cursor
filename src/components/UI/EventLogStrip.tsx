import { useMemo, useState } from "react";
import { useSimulationStore } from "../../store/useSimulationStore";

type Tab = "combined" | "events" | "trajectory" | "telemetry" | "haptics" | "integrity";

export function EventLogStrip() {
  const [tab, setTab] = useState<Tab>("combined");
  const eventLog = useSimulationStore((s) => s.eventLog);
  const trajectoryLog = useSimulationStore((s) => s.trajectoryLog);
  const telemetryLog = useSimulationStore((s) => s.telemetryLog);
  const hapticsLog = useSimulationStore((s) => s.hapticsLog);
  const integrityLog = useSimulationStore((s) => s.integrityLog);

  const combined = useMemo(() => {
    type Row = { t: string; label: string; text: string };
    const rows: Row[] = [];
    for (const e of eventLog) {
      rows.push({ t: e.timestamp, label: e.kind, text: e.message });
    }
    for (const tr of trajectoryLog) {
      rows.push({
        t: tr.timestamp,
        label: "traj",
        text: `${tr.action} → ${tr.next_state}`,
      });
    }
    for (const h of hapticsLog.slice(-40)) {
      rows.push({
        t: h.timestamp,
        label: "haptic",
        text: `${h.contact_object} (${h.severity})`,
      });
    }
    for (const i of integrityLog) {
      rows.push({
        t: i.timestamp,
        label: "integrity",
        text: `${i.issue} (${i.severity})`,
      });
    }
    rows.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
    return rows.slice(-80);
  }, [eventLog, trajectoryLog, hapticsLog, integrityLog]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "combined", label: "Combined" },
    { id: "events", label: "Events" },
    { id: "trajectory", label: "Trajectory" },
    { id: "telemetry", label: "Telemetry" },
    { id: "haptics", label: "Haptics" },
    { id: "integrity", label: "Integrity" },
  ];

  return (
    <div className="pointer-events-auto flex max-h-[32dvh] min-h-[120px] w-full flex-col rounded border border-slate-800/90 bg-slate-950/94 text-[9px] shadow-lg backdrop-blur-sm">
      <div className="flex flex-wrap gap-1 border-b border-slate-800 px-2 py-1">
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            className={`rounded px-2 py-0.5 ${
              tab === x.id
                ? "bg-cyan-950/90 text-cyan-200"
                : "text-slate-500 hover:text-slate-300"
            }`}
            onClick={() => setTab(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1 font-mono leading-snug text-slate-300">
        {tab === "combined" &&
          combined.map((r, i) => (
            <div key={`${r.t}-${i}`}>
              <span className="text-slate-500">{r.t}</span>{" "}
              <span className="text-cyan-600/90">{r.label}</span> {r.text}
            </div>
          ))}
        {tab === "events" &&
          eventLog.map((e, i) => (
            <div key={`${e.timestamp}-${i}`}>
              <span className="text-slate-500">{e.timestamp}</span> [{e.kind}] {e.message}
            </div>
          ))}
        {tab === "trajectory" &&
          trajectoryLog.map((tr, i) => (
            <div key={`${tr.timestamp}-${i}`}>
              <span className="text-slate-500">{tr.timestamp}</span> {tr.action} / {tr.object ?? "—"}{" "}
              → {tr.next_state}
            </div>
          ))}
        {tab === "telemetry" &&
          telemetryLog.slice(-24).map((t, i) => (
            <div key={`${t.timestamp}-${i}`}>
              <span className="text-slate-500">{t.timestamp}</span> {t.current_zone} dose{" "}
              {t.cumulative_radiation_dose.toFixed(2)}
            </div>
          ))}
        {tab === "haptics" &&
          hapticsLog.map((h, i) => (
            <div key={`${h.timestamp}-${i}`}>
              <span className="text-slate-500">{h.timestamp}</span> {h.contact_object} F=
              {h.force_newtons.toFixed(0)} {h.severity}
            </div>
          ))}
        {tab === "integrity" &&
          integrityLog.map((ev, i) => (
            <div key={`${ev.timestamp}-${i}`} className="text-rose-300/90">
              <span className="text-slate-500">{ev.timestamp}</span> {ev.issue}: {ev.description}
            </div>
          ))}
      </div>
    </div>
  );
}
