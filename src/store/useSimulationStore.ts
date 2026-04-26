import { create } from "zustand";
import * as THREE from "three";
import { missions } from "../data/missions";
import type { MissionId } from "./simulationTypes";
import type {
  EventLogEntry,
  HapticsLogEntry,
  MissionStatus,
  PhysicalLimitWarning,
  SimulationIntegrityEvent,
  TelemetryLogEntry,
  TrajectoryLogEntry,
  VerifierResult,
} from "./simulationTypes";
import { playerSpawn, inSafeZone, getZoneAt } from "../data/worldLayout";
import { runVerifier, buildTrainingValidity } from "../data/verifierRules";
import { robotProfile } from "../data/robotProfile";
import { formatRunTime } from "../utils/formatTime";
import { canInspect } from "../utils/inspectRay";
import { gaugeG12, valveV17 } from "../data/worldLayout";

function ts(elapsed: number) {
  return formatRunTime(elapsed);
}

interface SimState {
  missionId: MissionId;
  missionStatus: MissionStatus;
  elapsedSec: number;
  playerPos: { x: number; y: number; z: number };
  playerQuat: { x: number; y: number; z: number; w: number };
  velocity: { x: number; y: number; z: number };
  prevVelocity: { x: number; y: number; z: number };
  battery: number;
  cumulativeDose: number;
  radiationRate: number;
  radiationStack: number;
  currentZone: string;
  gaugeInspected: boolean;
  valveInspected: boolean;
  gaugeReading: string | null;
  valveState: string | null;
  maxSpeedSeen: number;
  maxAccelSeen: number;
  maxContactForceSeen: number;
  collisionCount: number;
  sensorRangeViolations: number;
  losFailures: number;
  anyIntegrityHigh: boolean;
  highIntegrityCount: number;
  currentAction: string;
  armStatus: "nominal" | "broken";
  heldObjectId: string | null;
  armPitchRad: number;
  armYawRad: number;
  eventLog: EventLogEntry[];
  trajectoryLog: TrajectoryLogEntry[];
  telemetryLog: TelemetryLogEntry[];
  hapticsLog: HapticsLogEntry[];
  integrityLog: SimulationIntegrityEvent[];
  physicalWarnings: PhysicalLimitWarning[];
  verifier: VerifierResult | null;
  lastTelemetryAt: number;
  lastPosForIntegrity: { x: number; y: number; z: number } | null;
  collisionTimestamps: number[];
  physicsResetKey: number;

  startMission: (id: MissionId) => void;
  /** Choose scenario before Start (only while idle). */
  setMissionId: (id: MissionId) => void;
  resetMission: () => void;
  tickElapsed: (dt: number) => void;
  setPlayerKinematics: (p: {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    quat: THREE.Quaternion;
    deltaTime: number;
  }) => void;
  setArmPose: (armPitchRad: number, armYawRad: number) => void;
  setRadiationStack: (n: number) => void;
  radiationEnter: () => void;
  radiationExit: () => void;
  tickExposure: (dt: number) => void;
  pushTelemetry: (entry: TelemetryLogEntry) => void;
  pushEvent: (e: Omit<EventLogEntry, "timestamp"> & { timestamp?: string }) => void;
  pushTrajectory: (
    e: Omit<TrajectoryLogEntry, "timestamp"> & { timestamp?: string }
  ) => void;
  pushHaptic: (e: HapticsLogEntry) => void;
  pushIntegrity: (e: SimulationIntegrityEvent[]) => void;
  appendPhysicalWarnings: (w: PhysicalLimitWarning[]) => void;
  recordInspectResult: (input: {
    objectId: string;
    ok: boolean;
    reason?: string;
    distance: number;
    losOk: boolean;
  }) => void;
  tryFinalizeMission: () => void;
  pickObject: (objectId: string) => void;
  dropObject: (reason?: string) => void;
  triggerArmBreakdown: (reason: string) => void;
  registerCollisionForce: (forceN: number, objectLabel: string) => void;
  finalizeWithVerifier: (outcome: "completed" | "failed" | "invalid") => void;
  tryInteractNearest: (scene: THREE.Object3D, eye: THREE.Vector3) => void;
}

const initialPos = () => ({ ...playerSpawn });

function emptyMissionState(id: MissionId): Partial<SimState> {
  return {
    missionId: id,
    missionStatus: "running",
    elapsedSec: 0,
    playerPos: initialPos(),
    playerQuat: { x: 0, y: 0, z: 0, w: 1 },
    velocity: { x: 0, y: 0, z: 0 },
    prevVelocity: { x: 0, y: 0, z: 0 },
    battery: robotProfile.batteryStartPct,
    cumulativeDose: 0,
    radiationRate: 0,
    radiationStack: 0,
    currentZone: getZoneAt(
      new THREE.Vector3(playerSpawn.x, playerSpawn.y, playerSpawn.z)
    ),
    gaugeInspected: false,
    valveInspected: false,
    gaugeReading: null,
    valveState: null,
    maxSpeedSeen: 0,
    maxAccelSeen: 0,
    maxContactForceSeen: 0,
    collisionCount: 0,
    sensorRangeViolations: 0,
    losFailures: 0,
    anyIntegrityHigh: false,
    highIntegrityCount: 0,
    currentAction: "mission_start",
    armStatus: "nominal",
    heldObjectId: null,
    armPitchRad: 0,
    armYawRad: 0,
    eventLog: [],
    trajectoryLog: [],
    telemetryLog: [],
    hapticsLog: [],
    integrityLog: [],
    physicalWarnings: [],
    verifier: null,
    lastTelemetryAt: 0,
    lastPosForIntegrity: { ...playerSpawn },
    collisionTimestamps: [],
  };
}

export const useSimulationStore = create<SimState>((set, get) => ({
  missionId: "gauge_g12",
  missionStatus: "not_started",
  elapsedSec: 0,
  playerPos: initialPos(),
  playerQuat: { x: 0, y: 0, z: 0, w: 1 },
  velocity: { x: 0, y: 0, z: 0 },
  prevVelocity: { x: 0, y: 0, z: 0 },
  battery: robotProfile.batteryStartPct,
  cumulativeDose: 0,
  radiationRate: 0,
  radiationStack: 0,
  currentZone: "facility_unknown",
  gaugeInspected: false,
  valveInspected: false,
  gaugeReading: null,
  valveState: null,
  maxSpeedSeen: 0,
  maxAccelSeen: 0,
  maxContactForceSeen: 0,
  collisionCount: 0,
  sensorRangeViolations: 0,
  losFailures: 0,
  anyIntegrityHigh: false,
  highIntegrityCount: 0,
  currentAction: "idle",
  armStatus: "nominal",
  heldObjectId: null,
  armPitchRad: 0,
  armYawRad: 0,
  eventLog: [],
  trajectoryLog: [],
  telemetryLog: [],
  hapticsLog: [],
  integrityLog: [],
  physicalWarnings: [],
  verifier: null,
  lastTelemetryAt: 0,
  lastPosForIntegrity: null,
  collisionTimestamps: [],
  physicsResetKey: 0,

  setMissionId: (id) => {
    if (get().missionStatus !== "not_started") return;
    set({ missionId: id });
  },

  startMission: (id) => {
    set({ ...emptyMissionState(id), physicsResetKey: get().physicsResetKey + 1 });
    get().pushEvent({
      timestamp: ts(0),
      kind: "mission",
      message: `Started ${missions[id].name}`,
    });
    get().pushTrajectory({
      timestamp: ts(0),
      state: "not_started",
      action: "mission_start",
      next_state: "running",
    });
  },

  resetMission: () => {
    const id = get().missionId;
    set({
      missionId: id,
      missionStatus: "not_started",
      elapsedSec: 0,
      playerPos: initialPos(),
      playerQuat: { x: 0, y: 0, z: 0, w: 1 },
      velocity: { x: 0, y: 0, z: 0 },
      prevVelocity: { x: 0, y: 0, z: 0 },
      battery: robotProfile.batteryStartPct,
      cumulativeDose: 0,
      radiationRate: 0,
      radiationStack: 0,
      currentZone: getZoneAt(
        new THREE.Vector3(playerSpawn.x, playerSpawn.y, playerSpawn.z)
      ),
      gaugeInspected: false,
      valveInspected: false,
      gaugeReading: null,
      valveState: null,
      maxSpeedSeen: 0,
      maxAccelSeen: 0,
      maxContactForceSeen: 0,
      collisionCount: 0,
      sensorRangeViolations: 0,
      losFailures: 0,
      anyIntegrityHigh: false,
      highIntegrityCount: 0,
      currentAction: "idle",
      armStatus: "nominal",
      heldObjectId: null,
      armPitchRad: 0,
      armYawRad: 0,
      eventLog: [],
      trajectoryLog: [],
      telemetryLog: [],
      hapticsLog: [],
      integrityLog: [],
      physicalWarnings: [],
      verifier: null,
      lastTelemetryAt: 0,
      lastPosForIntegrity: null,
      collisionTimestamps: [],
      physicsResetKey: get().physicsResetKey + 1,
    });
    get().pushEvent({
      timestamp: ts(0),
      kind: "mission",
      message: "Mission reset (R)",
    });
  },

  tickElapsed: (dt) => {
    const s = get();
    if (s.missionStatus !== "running") return;
    const elapsed = s.elapsedSec + dt;
    set({ elapsedSec: elapsed });
    const m = missions[s.missionId];
    if (elapsed > m.timeLimitSec) {
      get().finalizeWithVerifier("failed");
    }
  },

  setPlayerKinematics: ({ pos, vel, quat, deltaTime }) => {
    const s = get();
    if (s.missionStatus !== "running") return;
    const speed = vel.length();
    const accelVec = new THREE.Vector3(
      vel.x - s.velocity.x,
      vel.y - s.velocity.y,
      vel.z - s.velocity.z
    ).multiplyScalar(1 / Math.max(deltaTime, 1e-4));
    const accelMag = accelVec.length();
    const maxSpeed = Math.max(s.maxSpeedSeen, speed);
    const maxAccel = Math.max(s.maxAccelSeen, accelMag);
    const zone = getZoneAt(pos);
    if (s.lastPosForIntegrity) {
      const jump = pos.distanceTo(
        new THREE.Vector3(
          s.lastPosForIntegrity.x,
          s.lastPosForIntegrity.y,
          s.lastPosForIntegrity.z
        )
      );
      if (jump > 2.5) {
        get().pushIntegrity([
          {
            timestamp: ts(s.elapsedSec),
            event_type: "simulation_integrity_event",
            issue: "teleport_or_clipping",
            description: `Jump ${jump.toFixed(2)} m`,
            severity: "high",
            recommended_fix: "Clamp integration step",
          },
        ]);
      }
    }
    set({
      playerPos: { x: pos.x, y: pos.y, z: pos.z },
      playerQuat: { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
      prevVelocity: { ...s.velocity },
      velocity: { x: vel.x, y: vel.y, z: vel.z },
      maxSpeedSeen: maxSpeed,
      maxAccelSeen: maxAccel,
      currentZone: zone,
      lastPosForIntegrity: { x: pos.x, y: pos.y, z: pos.z },
    });
  },

  setArmPose: (armPitchRad, armYawRad) => {
    const s = get();
    if (s.armPitchRad === armPitchRad && s.armYawRad === armYawRad) return;
    set({ armPitchRad, armYawRad });
  },

  setRadiationStack: (n) => set({ radiationStack: n }),
  radiationEnter: () =>
    set((st) => ({ radiationStack: st.radiationStack + 1 })),
  radiationExit: () =>
    set((st) => ({ radiationStack: Math.max(0, st.radiationStack - 1) })),

  tickExposure: (dt) => {
    const s = get();
    if (s.missionStatus !== "running") return;
    const stack = s.radiationStack;
    const rate = stack > 0 ? 2.4 * stack : 0;
    set({ radiationRate: rate });
    if (stack > 0) {
      set((st) => ({ cumulativeDose: st.cumulativeDose + rate * dt }));
    }
    const m = missions[s.missionId];
    const budget = m.radiationBudgetMsV ?? robotProfile.maxRadiationDoseMsV;
    if (m.id === "radiation_dual" && get().cumulativeDose > budget) {
      get().pushEvent({
        timestamp: ts(get().elapsedSec),
        kind: "radiation",
        message: "Radiation budget exceeded",
      });
      get().finalizeWithVerifier("failed");
      return;
    }
    const moving = get().velocity.x ** 2 + get().velocity.z ** 2 > 0.05;
    const drain =
      (moving
        ? robotProfile.batteryDrainPerSecMoving
        : robotProfile.batteryDrainPerSecIdle) * dt;
    set((st) => ({ battery: Math.max(0, st.battery - drain) }));
  },

  pushTelemetry: (entry) =>
    set((st) => ({ telemetryLog: [...st.telemetryLog, entry] })),

  pushEvent: (e) => {
    const entry: EventLogEntry = {
      timestamp: e.timestamp ?? ts(get().elapsedSec),
      kind: e.kind,
      message: e.message,
      detail: e.detail,
    };
    set((st) => ({ eventLog: [...st.eventLog, entry] }));
  },

  pushTrajectory: (e) => {
    const entry: TrajectoryLogEntry = {
      timestamp: e.timestamp ?? ts(get().elapsedSec),
      state: e.state,
      action: e.action,
      object: e.object,
      next_state: e.next_state,
      verifier: e.verifier,
    };
    set((st) => ({ trajectoryLog: [...st.trajectoryLog, entry] }));
  },

  pushHaptic: (e) =>
    set((st) => ({ hapticsLog: [...st.hapticsLog, e] })),

  pushIntegrity: (events) => {
    if (!events.length) return;
    set((st) => ({
      integrityLog: [...st.integrityLog, ...events],
      anyIntegrityHigh:
        st.anyIntegrityHigh || events.some((x) => x.severity === "high"),
      highIntegrityCount:
        st.highIntegrityCount +
        events.filter((x) => x.severity === "high").length,
    }));
  },

  appendPhysicalWarnings: (w) => {
    if (!w.length) return;
    set((st) => ({ physicalWarnings: [...st.physicalWarnings, ...w] }));
  },

  recordInspectResult: ({ objectId, ok, reason, distance, losOk }) => {
    const s = get();
    const t = ts(s.elapsedSec);
    if (!ok) {
      set((st) => ({
        sensorRangeViolations:
          st.sensorRangeViolations + (distance > robotProfile.sensorRangeM ? 1 : 0),
        losFailures: st.losFailures + (!losOk ? 1 : 0),
      }));
      get().pushIntegrity([
        {
          timestamp: t,
          event_type: "simulation_integrity_event",
          issue: reason ?? "inspect_failed",
          description: `Inspect ${objectId} failed (d=${distance.toFixed(2)}m, los=${losOk})`,
          severity: "high",
          recommended_fix: "Require proximity and LOS",
        },
      ]);
      get().pushTrajectory({
        timestamp: t,
        state: s.currentZone,
        action: "inspect_attempt",
        object: objectId,
        next_state: "inspect_rejected",
        verifier: "fail",
      });
      get().pushEvent({
        timestamp: t,
        kind: "inspect",
        message: `Rejected inspect ${objectId}`,
        detail: reason,
      });
      return;
    }
    if (objectId === "gauge_g12") {
      set({ gaugeInspected: true, gaugeReading: "42.6 PSI" });
      get().pushTrajectory({
        timestamp: t,
        state: s.currentZone,
        action: "inspect_gauge",
        object: "Gauge G-12",
        next_state: "gauge_inspected",
        verifier: "passed",
      });
    }
    if (objectId === "valve_v17") {
      set({ valveInspected: true, valveState: "closed" });
      get().pushTrajectory({
        timestamp: t,
        state: s.currentZone,
        action: "inspect_valve",
        object: "Valve V-17",
        next_state: "valve_inspected",
        verifier: "passed",
      });
    }
    get().pushEvent({
      timestamp: t,
      kind: "inspect",
      message: `Inspected ${objectId}`,
    });
  },

  registerCollisionForce: (forceN, objectLabel) => {
    const s = get();
    const maxC = Math.max(s.maxContactForceSeen, forceN);
    let colCount = s.collisionCount;
    if (forceN > 28) colCount += 1;
    const now = performance.now();
    const burst = [...s.collisionTimestamps, now].filter((t) => now - t < 1000);
    set({
      maxContactForceSeen: maxC,
      collisionCount: colCount,
      collisionTimestamps: burst,
    });
    if (burst.length > 18) {
      get().pushIntegrity([
        {
          timestamp: ts(s.elapsedSec),
          event_type: "simulation_integrity_event",
          issue: "collision_spam",
          description: "High-frequency contact bursts",
          severity: "medium",
          recommended_fix: "Debounce collision impulses",
        },
      ]);
    }
    const severity = forceN > 55 ? "high" : forceN > 28 ? "medium" : "low";
    get().pushHaptic({
      timestamp: ts(s.elapsedSec),
      contact_object: objectLabel,
      contact_type: "collision",
      force_newtons: forceN,
      duration_ms: 120,
      severity,
      simulated_haptic_feedback: {
        vibration_intensity: Math.min(1, forceN / 80),
        resistance: Math.min(1, forceN / 100),
      },
    });
  },

  tryFinalizeMission: () => {
    const s = get();
    if (s.missionStatus !== "running") return;
    const m = missions[s.missionId];
    const pos = new THREE.Vector3(s.playerPos.x, s.playerPos.y, s.playerPos.z);
    if (!inSafeZone(pos)) return;
    const needG = m.requiresGauge && !s.gaugeInspected;
    const needV = m.requiresValve && !s.valveInspected;
    if (needG || needV) return;
    get().finalizeWithVerifier("completed");
  },

  pickObject: (objectId) => {
    const s = get();
    if (s.missionStatus !== "running") return;
    if (s.armStatus === "broken") {
      get().pushEvent({
        kind: "arm",
        message: `Cannot pick ${objectId}; arm is broken`,
      });
      return;
    }
    set({ heldObjectId: objectId, currentAction: `pick_${objectId}` });
    const t = ts(s.elapsedSec);
    get().pushEvent({
      timestamp: t,
      kind: "pickup",
      message: `Picked ${objectId}`,
    });
    get().pushTrajectory({
      timestamp: t,
      state: s.currentZone,
      action: "pickup_object",
      object: objectId,
      next_state: "holding_object",
      verifier: "passed",
    });
  },

  dropObject: (reason) => {
    const s = get();
    if (!s.heldObjectId) return;
    const objectId = s.heldObjectId;
    set({ heldObjectId: null, currentAction: "drop_object" });
    const t = ts(s.elapsedSec);
    get().pushEvent({
      timestamp: t,
      kind: "pickup",
      message: `Dropped ${objectId}${reason ? ` (${reason})` : ""}`,
    });
    get().pushTrajectory({
      timestamp: t,
      state: s.currentZone,
      action: "drop_object",
      object: objectId,
      next_state: "object_released",
      verifier: "passed",
    });
  },

  triggerArmBreakdown: (reason) => {
    const s = get();
    if (s.armStatus === "broken") return;
    if (s.heldObjectId) get().dropObject("arm_breakdown");
    set({ armStatus: "broken", currentAction: "arm_breakdown" });
    const t = ts(s.elapsedSec);
    get().pushIntegrity([
      {
        timestamp: t,
        event_type: "simulation_integrity_event",
        issue: "arm_range_of_motion_violation",
        description: reason,
        severity: "high",
        recommended_fix: "Keep arm pitch within motion limits",
      },
    ]);
    get().pushEvent({
      timestamp: t,
      kind: "arm",
      message: "Manipulator arm breakdown",
      detail: reason,
    });
    get().pushTrajectory({
      timestamp: t,
      state: s.currentZone,
      action: "arm_breakdown",
      object: "manipulator_arm",
      next_state: "arm_disabled",
      verifier: "fail",
    });
  },

  finalizeWithVerifier: (outcome) => {
    const s = get();
    const m = missions[s.missionId];
    const pos = new THREE.Vector3(s.playerPos.x, s.playerPos.y, s.playerPos.z);
    const v = runVerifier({
      mission: m,
      gaugeInspected: s.gaugeInspected,
      valveInspected: s.valveInspected,
      gaugeReading: s.gaugeReading,
      valveState: s.valveState,
      playerPos: pos,
      cumulativeDose: s.cumulativeDose,
      radiationBudgetMsV: m.radiationBudgetMsV ?? null,
      maxSpeedSeen: s.maxSpeedSeen,
      maxAccelSeen: s.maxAccelSeen,
      maxContactForceSeen: s.maxContactForceSeen,
      collisionCount: s.collisionCount,
      elapsedSec: s.elapsedSec,
      timeLimitSec: m.timeLimitSec,
      sensorRangeViolations: s.sensorRangeViolations,
      losFailures: s.losFailures,
      highIntegrityCount: s.highIntegrityCount,
      anyIntegrityHigh: s.anyIntegrityHigh,
    });
    let status: MissionStatus =
      outcome === "completed" && v.mission_success && v.run_validity !== "invalid"
        ? "completed"
        : outcome === "invalid" || v.run_validity === "invalid"
          ? "invalid"
          : "failed";
    if (outcome === "completed" && !v.mission_success) status = "failed";
    set({ verifier: v, missionStatus: status });
    const t = ts(s.elapsedSec);
    get().pushTrajectory({
      timestamp: t,
      state: s.currentZone,
      action: "VERIFY",
      object: m.name,
      next_state: v.mission_success ? "PASS" : "FAIL",
      verifier: v.mission_success ? "passed" : "failed",
    });
    get().pushEvent({
      timestamp: t,
      kind: "verifier",
      message: `Run ${status} — mission_success=${v.mission_success}`,
    });
    const tv = buildTrainingValidity(v);
    get().pushEvent({
      timestamp: t,
      kind: "training",
      message: `usable_for_training=${tv.usable_for_training} usable_for_eval=${tv.usable_for_eval}`,
      detail: tv.invalid_reason ?? undefined,
    });
  },

  tryInteractNearest: (scene, eye) => {
    const s = get();
    if (s.missionStatus !== "running") return;
    const m = missions[s.missionId];
    type Tid = "gauge_g12" | "valve_v17";
    const candidates: { id: Tid; pos: THREE.Vector3; need: boolean; done: boolean }[] = [
      {
        id: "gauge_g12",
        pos: gaugeG12.position.clone(),
        need: m.requiresGauge,
        done: s.gaugeInspected,
      },
      {
        id: "valve_v17",
        pos: valveV17.position.clone(),
        need: m.requiresValve,
        done: s.valveInspected,
      },
    ];
    let best: { id: Tid; d: number } | null = null;
    for (const c of candidates) {
      if (!c.need || c.done) continue;
      const d = eye.distanceTo(c.pos);
      if (!best || d < best.d) best = { id: c.id, d };
    }
    if (!best) {
      get().pushEvent({
        timestamp: ts(s.elapsedSec),
        kind: "interact",
        message: "No pending inspect target",
      });
      return;
    }
    const r = canInspect(eye, scene, best.id);
    get().recordInspectResult({
      objectId: best.id,
      ok: r.ok && r.losOk,
      reason: !r.ok
        ? "invalid_interaction_distance"
        : !r.losOk
          ? "inspected_through_wall"
          : undefined,
      distance: r.distance,
      losOk: r.losOk,
    });
    if (r.ok && r.losOk) get().tryFinalizeMission();
  },
}));
