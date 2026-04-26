import { robotProfile } from "../data/robotProfile";
import type { PhysicalLimitWarning } from "../store/simulationTypes";

export interface PhysicalCheckInput {
  elapsedSec: number;
  speed: number;
  accelMag: number;
  cumulativeDose: number;
  contactForceN: number;
  batteryPct: number;
  sensorConfidence: number;
}

export function detectPhysicalLimitWarnings(
  input: PhysicalCheckInput
): PhysicalLimitWarning[] {
  const ts = formatTs(input.elapsedSec);
  const out: PhysicalLimitWarning[] = [];

  if (input.speed > robotProfile.maxSpeedMps * 0.92) {
    out.push({
      timestamp: ts,
      level:
        input.speed > robotProfile.maxSpeedMps ? "limit_exceeded" : "warning",
      code: "excessive_speed",
      message: `Speed ${input.speed.toFixed(2)} m/s (max ${robotProfile.maxSpeedMps})`,
      recovery: "Reduce forward input",
    });
  }

  if (input.accelMag > robotProfile.maxAccelerationMps2 * 0.92) {
    out.push({
      timestamp: ts,
      level:
        input.accelMag > robotProfile.maxAccelerationMps2
          ? "limit_exceeded"
          : "warning",
      code: "excessive_acceleration",
      message: `Acceleration ${input.accelMag.toFixed(1)} m/s² (max ${robotProfile.maxAccelerationMps2})`,
      recovery: "Ease inputs to stay within envelope",
    });
  }

  if (input.cumulativeDose > robotProfile.maxRadiationDoseMsV * 0.85) {
    out.push({
      timestamp: ts,
      level:
        input.cumulativeDose > robotProfile.maxRadiationDoseMsV
          ? "limit_exceeded"
          : "warning",
      code: "radiation_budget",
      message: `Dose ${input.cumulativeDose.toFixed(1)} mSv (max ${robotProfile.maxRadiationDoseMsV})`,
      recovery: "Avoid hot zones or abort mission",
    });
  }

  if (input.contactForceN > robotProfile.maxCollisionImpulseNs * 0.85) {
    out.push({
      timestamp: ts,
      level:
        input.contactForceN > robotProfile.maxCollisionImpulseNs
          ? "limit_exceeded"
          : "warning",
      code: "contact_force",
      message: `Contact ${input.contactForceN.toFixed(0)} N (max ${robotProfile.maxCollisionImpulseNs})`,
      recovery: "Slow down before obstacles",
    });
  }

  if (input.batteryPct < 12) {
    out.push({
      timestamp: ts,
      level: input.batteryPct < 5 ? "limit_exceeded" : "warning",
      code: "low_battery",
      message: `Battery ${input.batteryPct.toFixed(0)}%`,
      recovery: "Return to base for recharge",
    });
  }

  if (input.sensorConfidence < robotProfile.minSensorConfidence + 0.15) {
    out.push({
      timestamp: ts,
      level:
        input.sensorConfidence < robotProfile.minSensorConfidence
          ? "limit_exceeded"
          : "warning",
      code: "sensor_confidence",
      message: `Sensor confidence ${input.sensorConfidence.toFixed(2)}`,
      recovery: "Move closer to target before inspect",
    });
  }

  const t = robotProfile.ambientTempC;
  if (t < robotProfile.operatingTempMinC || t > robotProfile.operatingTempMaxC) {
    out.push({
      timestamp: ts,
      level: "warning",
      code: "temperature_band",
      message: `Ambient ${t}°C outside ${robotProfile.operatingTempMinC}–${robotProfile.operatingTempMaxC}°C`,
    });
  }

  return out;
}

function formatTs(sec: number): string {
  const ms = Math.floor((sec % 1) * 1000);
  const t = Math.floor(sec);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}.${ms.toString().padStart(3, "0")}`;
}
