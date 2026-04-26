import * as THREE from "three";
import { missions } from "../../data/missions";
import type { MissionId } from "../../store/simulationTypes";
import { useSimulationStore } from "../../store/useSimulationStore";
import { formatRunTime } from "../../utils/formatTime";
import { buildExportPayload } from "../../utils/exportTrajectory";
import { buildTrainingValidity } from "../../data/verifierRules";
import { inSafeZone } from "../../data/worldLayout";

export function MissionPanel() {
  const missionId = useSimulationStore((s) => s.missionId);
  const missionStatus = useSimulationStore((s) => s.missionStatus);
  const elapsedSec = useSimulationStore((s) => s.elapsedSec);
  const cumulativeDose = useSimulationStore((s) => s.cumulativeDose);
  const radiationRate = useSimulationStore((s) => s.radiationRate);
  const currentZone = useSimulationStore((s) => s.currentZone);
  const gaugeInspected = useSimulationStore((s) => s.gaugeInspected);
  const valveInspected = useSimulationStore((s) => s.valveInspected);
  const armStatus = useSimulationStore((s) => s.armStatus);
  const heldObjectId = useSimulationStore((s) => s.heldObjectId);
  const playerPos = useSimulationStore((s) => s.playerPos);
  const startMission = useSimulationStore((s) => s.startMission);
  const setMissionId = useSimulationStore((s) => s.setMissionId);

  const m = missions[missionId];
  const budget = m.radiationBudgetMsV;
  const posVec = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
  const atSafe = inSafeZone(posVec);
  const doseOk = budget == null || cumulativeDose <= budget;

  const objectiveClass = (index: number) => {
    if (missionStatus === "completed") return "text-emerald-400/95";
    let done = false;
    if (m.id === "gauge_g12") {
      if (index === 0) done = gaugeInspected;
      if (index === 1) done = gaugeInspected;
      if (index === 2) done = gaugeInspected && atSafe;
    } else if (m.id === "valve_v17") {
      if (index === 0) done = valveInspected;
      if (index === 1) done = valveInspected;
      if (index === 2) done = valveInspected && atSafe;
    } else {
      if (index === 0) done = gaugeInspected;
      if (index === 1) done = valveInspected;
      if (index === 2) done = doseOk;
      if (index === 3) done = gaugeInspected && valveInspected && atSafe && doseOk;
    }
    return done ? "text-emerald-400/95" : "text-slate-400";
  };

  const onExport = () => {
    const s = useSimulationStore.getState();
    const mission = missions[s.missionId];
    const tv = s.verifier
      ? buildTrainingValidity(s.verifier)
      : {
          usable_for_training: s.missionStatus === "running",
          usable_for_eval: false,
          invalid_reason:
            s.missionStatus === "running" ? "mission_in_progress" : null,
          requires_human_review: true,
        };
    const payload = buildExportPayload({
      mission,
      event_log: s.eventLog,
      trajectory_log: s.trajectoryLog,
      telemetry_log: s.telemetryLog,
      haptics_log: s.hapticsLog,
      physical_limit_warnings: s.physicalWarnings,
      simulation_integrity_events: s.integrityLog,
      verifier_results: s.verifier,
      final_outcome: s.missionStatus,
      training_validity: tv,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `trajectory_${s.missionId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const statusColor =
    missionStatus === "completed"
      ? "text-emerald-400"
      : missionStatus === "failed" || missionStatus === "invalid"
        ? "text-rose-400"
        : missionStatus === "running"
          ? "text-cyan-300"
          : "text-slate-400";

  return (
    <div className="pointer-events-auto flex max-h-[min(92dvh,640px)] w-[min(100%,280px)] flex-col gap-2 overflow-y-auto rounded border border-slate-800/90 bg-slate-950/92 p-3 text-[10px] text-slate-200 shadow-lg backdrop-blur-sm">
      <div className="border-b border-slate-800 pb-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-400/95">
        Mission
      </div>
      <label className="flex flex-col gap-1 text-slate-400">
        <span>Scenario</span>
        <select
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100"
          value={missionId}
          disabled={missionStatus === "running"}
          onChange={(e) => setMissionId(e.target.value as MissionId)}
        >
          {(Object.keys(missions) as MissionId[]).map((id) => (
            <option key={id} value={id}>
              {missions[id].name}
            </option>
          ))}
        </select>
      </label>
      {missionStatus === "not_started" && (
        <button
          type="button"
          className="rounded bg-cyan-700/90 px-2 py-2 text-[11px] font-medium text-white hover:bg-cyan-600"
          onClick={() => startMission(missionId)}
        >
          Start mission
        </button>
      )}
      <p className="text-[9px] leading-snug text-slate-500">{m.description}</p>
      <ul className="list-inside list-disc space-y-1 text-[9px]">
        {m.objectives.map((o, i) => (
          <li key={i} className={objectiveClass(i)}>
            {o}
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2">
        <div>
          <div className="text-slate-500">Status</div>
          <div className={`font-medium ${statusColor}`}>{missionStatus}</div>
        </div>
        <div>
          <div className="text-slate-500">Elapsed</div>
          <div className="font-mono text-slate-200">{formatRunTime(elapsedSec)}</div>
        </div>
        <div className="col-span-2">
          <div className="text-slate-500">Zone</div>
          <div className="truncate font-mono text-slate-300">{currentZone}</div>
        </div>
        <div>
          <div className="text-slate-500">Dose (mSv)</div>
          <div className="font-mono text-amber-200/95">{cumulativeDose.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-slate-500">Rate</div>
          <div className="font-mono text-amber-200/80">{radiationRate.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-slate-500">Arm</div>
          <div className={armStatus === "broken" ? "font-mono text-rose-400" : "font-mono text-emerald-300"}>
            {armStatus}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Held object</div>
          <div className="truncate font-mono text-slate-300">{heldObjectId ?? "none"}</div>
        </div>
        {budget != null && (
          <div className="col-span-2 text-[9px] text-slate-500">
            Budget: {budget} mSv (radiation mission)
          </div>
        )}
      </div>
      <div className="border-t border-slate-800 pt-2 text-[9px] text-slate-500">
        <span className="text-slate-400">R</span> reset · click canvas to lock pointer
      </div>
      <button
        type="button"
        className="rounded border border-slate-600 bg-slate-900/90 px-2 py-1.5 text-[10px] text-slate-200 hover:border-cyan-700 hover:text-cyan-100"
        onClick={onExport}
      >
        Export trajectory JSON
      </button>
    </div>
  );
}
