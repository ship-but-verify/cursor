import type { MissionDefinition } from "../store/simulationTypes";
import type { VerifierResult } from "../store/simulationTypes";
import { robotProfile } from "./robotProfile";
import { inSafeZone } from "./worldLayout";
import * as THREE from "three";

export interface VerifierInput {
  mission: MissionDefinition;
  gaugeInspected: boolean;
  valveInspected: boolean;
  gaugeReading: string | null;
  valveState: string | null;
  playerPos: THREE.Vector3;
  cumulativeDose: number;
  radiationBudgetMsV: number | null;
  maxSpeedSeen: number;
  maxAccelSeen: number;
  maxContactForceSeen: number;
  collisionCount: number;
  elapsedSec: number;
  timeLimitSec: number;
  sensorRangeViolations: number;
  losFailures: number;
  highIntegrityCount: number;
  anyIntegrityHigh: boolean;
}

export function runVerifier(input: VerifierInput): VerifierResult {
  const inSafe = inSafeZone(input.playerPos);
  const radBudget =
    input.radiationBudgetMsV ?? robotProfile.maxRadiationDoseMsV;
  const radiationOk = input.cumulativeDose <= radBudget;
  const speedOk = input.maxSpeedSeen <= robotProfile.maxSpeedMps + 0.05;
  const accelOk =
    input.maxAccelSeen <= robotProfile.maxAccelerationMps2 + 0.5;
  const contactOk =
    input.maxContactForceSeen <= robotProfile.maxCollisionImpulseNs + 5;
  const sensorOk = input.sensorRangeViolations === 0;
  const losOk = input.losFailures === 0;
  const integrityOk = !input.anyIntegrityHigh && input.highIntegrityCount === 0;

  const gaugeOk =
    !input.mission.requiresGauge ||
    (input.gaugeInspected && !!input.gaugeReading);
  const valveOk =
    !input.mission.requiresValve ||
    (input.valveInspected && !!input.valveState);

  const timeOk = input.elapsedSec <= input.timeLimitSec + 0.5;
  /** Lenient demo: soft bumps OK; repeated hard hits fail. */
  const collisionFree =
    input.collisionCount < 4 && input.maxContactForceSeen < 55;

  const mission_success =
    gaugeOk &&
    valveOk &&
    inSafe &&
    radiationOk &&
    timeOk &&
    speedOk &&
    accelOk &&
    contactOk &&
    sensorOk &&
    losOk &&
    integrityOk;

  let failure_mode: string | null = null;
  if (!integrityOk) failure_mode = "simulation_integrity_violation";
  else if (!sensorOk) failure_mode = "invalid_interaction_distance";
  else if (!losOk) failure_mode = "inspected_through_wall";
  else if (!radiationOk) failure_mode = "exceeded_radiation_limit";
  else if (!gaugeOk) failure_mode = "incomplete_mission";
  else if (!valveOk) failure_mode = "incomplete_mission";
  else if (!inSafe) failure_mode = "failed_to_return";
  else if (!timeOk) failure_mode = "incomplete_mission";
  else if (!speedOk) failure_mode = "excessive_speed";
  else if (!accelOk) failure_mode = "excessive_acceleration";
  else if (!contactOk) failure_mode = "excessive_contact_force";
  else if (!collisionFree) failure_mode = "collision_with_debris";

  let run_validity: VerifierResult["run_validity"] = "valid";
  if (input.anyIntegrityHigh) run_validity = "invalid";
  else if (!mission_success) run_validity = "warning";

  return {
    mission_success,
    run_validity,
    gauge_inspected: input.gaugeInspected,
    valve_inspected: input.valveInspected,
    returned_to_safe_zone: inSafe,
    radiation_limit_passed: radiationOk,
    collision_free: collisionFree,
    speed_limit_passed: speedOk,
    acceleration_limit_passed: accelOk,
    contact_force_passed: contactOk,
    sensor_range_passed: sensorOk,
    line_of_sight_passed: losOk,
    simulation_integrity_passed: integrityOk,
    failure_mode: mission_success ? null : failure_mode,
  };
}

export function buildTrainingValidity(v: VerifierResult): {
  usable_for_training: boolean;
  usable_for_eval: boolean;
  invalid_reason: string | null;
  requires_human_review: boolean;
} {
  const invalid = v.run_validity === "invalid";
  const usable_eval =
    v.mission_success && v.run_validity === "valid" && v.simulation_integrity_passed;
  const usable_train = !invalid;
  return {
    usable_for_training: usable_train,
    usable_for_eval: usable_eval,
    invalid_reason: invalid ? v.failure_mode ?? "simulation_integrity_violation" : null,
    requires_human_review: !usable_eval,
  };
}
