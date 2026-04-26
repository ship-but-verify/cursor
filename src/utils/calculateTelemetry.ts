import * as THREE from "three";
import type { TelemetryLogEntry } from "../store/simulationTypes";
import { gaugeG12, getZoneAt, valveV17 } from "../data/worldLayout";

export interface TelemetryInput {
  elapsedSec: number;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  velocity: THREE.Vector3;
  prevVelocity: THREE.Vector3;
  deltaTime: number;
  radiationRate: number;
  cumulativeDose: number;
  collisionActive: boolean;
  contactForceN: number;
  battery: number;
  sensorConfidence: number;
  taskProgress: string;
  currentAction: string;
  armStatus: "nominal" | "broken";
  heldObject: string | null;
  armPitchRad: number;
  armYawRad: number;
  warnings: string[];
}

export function buildTelemetryEntry(input: TelemetryInput): TelemetryLogEntry {
  const accel = input.velocity
    .clone()
    .sub(input.prevVelocity)
    .multiplyScalar(1 / Math.max(input.deltaTime, 1e-4));
  const hazardDist = Math.min(
    input.position.distanceTo(gaugeG12.position),
    input.position.distanceTo(valveV17.position)
  );
  return {
    timestamp: formatTelemetryTs(input.elapsedSec),
    robot_position: [input.position.x, input.position.y, input.position.z],
    robot_rotation: [
      input.rotation.x,
      input.rotation.y,
      input.rotation.z,
      input.rotation.w,
    ],
    current_zone: getZoneAt(input.position),
    velocity: [input.velocity.x, input.velocity.y, input.velocity.z],
    acceleration: [accel.x, accel.y, accel.z],
    battery: input.battery,
    radiation_exposure_rate: input.radiationRate,
    cumulative_radiation_dose: input.cumulativeDose,
    collision_active: input.collisionActive,
    contact_force_n: input.contactForceN,
    distance_nearest_hazard_m: hazardDist,
    sensor_confidence: input.sensorConfidence,
    task_progress: input.taskProgress,
    current_action: input.currentAction,
    arm_status: input.armStatus,
    held_object: input.heldObject,
    arm_pitch_rad: input.armPitchRad,
    arm_yaw_rad: input.armYawRad,
    physical_limit_warnings: [...input.warnings],
  };
}

function formatTelemetryTs(sec: number): string {
  const ms = Math.floor((sec % 1) * 1000);
  const t = Math.floor(sec);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}.${ms.toString().padStart(3, "0")}`;
}
