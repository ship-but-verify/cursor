import type { SimulationIntegrityEvent } from "../store/simulationTypes";

export interface IntegrityCheckInput {
  elapsedSec: number;
  /** Teleport / discontinuity heuristic (m in one frame) */
  positionJumpM?: number;
  /** Impossible acceleration (m/s²) */
  accelMag?: number;
  maxAccelMps2: number;
  /** Inspect attempt */
  inspectDistanceM?: number;
  sensorRangeM: number;
  lineOfSightBlocked?: boolean;
  interactionTooFar?: boolean;
  inspectThroughWall?: boolean;
  /** Collision spam */
  collisionBurstCount?: number;
}

export function detectSimulationIntegrityEvents(
  input: IntegrityCheckInput
): SimulationIntegrityEvent[] {
  const ts = formatTs(input.elapsedSec);
  const events: SimulationIntegrityEvent[] = [];

  if ((input.positionJumpM ?? 0) > 2.5) {
    events.push({
      timestamp: ts,
      event_type: "simulation_integrity_event",
      issue: "teleport_or_clipping",
      description: `Position discontinuity ~${input.positionJumpM?.toFixed(2)} m in one frame`,
      severity: "high",
      recommended_fix: "Clamp delta movement; check kinematic integration",
    });
  }

  if ((input.accelMag ?? 0) > input.maxAccelMps2 * 3) {
    events.push({
      timestamp: ts,
      event_type: "simulation_integrity_event",
      issue: "impossible_acceleration",
      description: `Acceleration spike ${input.accelMag?.toFixed(1)} m/s²`,
      severity: "high",
      recommended_fix: "Cap impulses and validate timestep",
    });
  }

  if (input.interactionTooFar || (input.inspectDistanceM ?? 0) > input.sensorRangeM) {
    events.push({
      timestamp: ts,
      event_type: "simulation_integrity_event",
      issue: "invalid_interaction_distance",
      description: `Interaction at ${input.inspectDistanceM?.toFixed(2)} m exceeds sensor range ${input.sensorRangeM} m`,
      severity: "high",
      recommended_fix: "Require proximity before inspection",
    });
  }

  if (input.lineOfSightBlocked || input.inspectThroughWall) {
    events.push({
      timestamp: ts,
      event_type: "simulation_integrity_event",
      issue: "inspected_through_wall",
      description: "Line-of-sight blocked by geometry",
      severity: "high",
      recommended_fix: "Raycast must hit target before occluders",
    });
  }

  if ((input.collisionBurstCount ?? 0) > 18) {
    events.push({
      timestamp: ts,
      event_type: "simulation_integrity_event",
      issue: "collision_spam",
      description: `High-frequency contact bursts (${input.collisionBurstCount})`,
      severity: "medium",
      recommended_fix: "Debounce collision logging / stabilize collider",
    });
  }

  return events;
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
