import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "../../store/useSimulationStore";
import { buildTelemetryEntry } from "../../utils/calculateTelemetry";
import { detectPhysicalLimitWarnings } from "../../utils/detectPhysicalLimitWarnings";
import { robotProfile } from "../../data/robotProfile";
import { gaugeG12, valveV17 } from "../../data/worldLayout";

const TELEMETRY_INTERVAL = 0.25;

/** Mission clock + 4 Hz telemetry, physical limits, periodic integrity heuristics. */
export function SimulationLoop() {
  const telemetryAcc = useRef(0);

  useFrame((_, dt) => {
    const tick = useSimulationStore.getState().tickElapsed;
    tick(dt);

    telemetryAcc.current += dt;
    if (telemetryAcc.current < TELEMETRY_INTERVAL) return;
    telemetryAcc.current = 0;

    const s = useSimulationStore.getState();
    if (s.missionStatus !== "running") return;

    const pos = new THREE.Vector3(s.playerPos.x, s.playerPos.y, s.playerPos.z);
    const vel = new THREE.Vector3(s.velocity.x, s.velocity.y, s.velocity.z);
    const prevVel = new THREE.Vector3(
      s.prevVelocity.x,
      s.prevVelocity.y,
      s.prevVelocity.z
    );
    const quat = new THREE.Quaternion(
      s.playerQuat.x,
      s.playerQuat.y,
      s.playerQuat.z,
      s.playerQuat.w
    );
    const speed = vel.length();
    const accelVec = vel.clone().sub(prevVel).multiplyScalar(1 / TELEMETRY_INTERVAL);
    const accelMag = accelVec.length();

    const nearest = Math.min(
      pos.distanceTo(gaugeG12.position),
      pos.distanceTo(valveV17.position)
    );
    const sensorConfidence = THREE.MathUtils.clamp(
      1.15 - nearest * 0.22,
      robotProfile.minSensorConfidence,
      1
    );

    const taskParts: string[] = [];
    if (s.gaugeInspected) taskParts.push("G-12✓");
    if (s.valveInspected) taskParts.push("V-17✓");
    const taskProgress = taskParts.length ? taskParts.join(" ") : "pending";

    const warnings = detectPhysicalLimitWarnings({
      elapsedSec: s.elapsedSec,
      speed,
      accelMag,
      cumulativeDose: s.cumulativeDose,
      contactForceN: s.maxContactForceSeen,
      batteryPct: s.battery,
      sensorConfidence,
    });
    s.appendPhysicalWarnings(warnings);

    const entry = buildTelemetryEntry({
      elapsedSec: s.elapsedSec,
      position: pos,
      rotation: quat,
      velocity: vel,
      prevVelocity: prevVel,
      deltaTime: TELEMETRY_INTERVAL,
      radiationRate: s.radiationRate,
      cumulativeDose: s.cumulativeDose,
      collisionActive: s.maxContactForceSeen > 12,
      contactForceN: s.maxContactForceSeen,
      battery: s.battery,
      sensorConfidence,
      taskProgress,
      currentAction: s.currentAction,
      armStatus: s.armStatus,
      heldObject: s.heldObjectId,
      armPitchRad: s.armPitchRad,
      armYawRad: s.armYawRad,
      warnings: warnings.map((w) => w.code),
    });
    s.pushTelemetry(entry);
  });

  return null;
}
