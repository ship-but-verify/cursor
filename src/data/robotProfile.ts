/** Embodied agent capability envelope for self-monitoring and verifier. */
export const robotProfile = {
  maxSpeedMps: 4.5,
  maxAccelerationMps2: 8,
  maxTurnRateRadPerSec: 2.8,
  maxPayloadKg: 12,
  maxGripForceN: 80,
  maxPushForceN: 120,
  maxRadiationDoseMsV: 22,
  maxCollisionImpulseNs: 85,
  batteryStartPct: 100,
  batteryDrainPerSecMoving: 0.08,
  batteryDrainPerSecIdle: 0.02,
  sensorRangeM: 2.2,
  minSensorConfidence: 0.35,
  operatingTempMinC: 5,
  operatingTempMaxC: 45,
  /** Mock ambient reading for demo */
  ambientTempC: 22,
} as const;

export type RobotProfile = typeof robotProfile;
