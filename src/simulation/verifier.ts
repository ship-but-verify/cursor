import {
  MAX_SAFE_EXPOSURE,
  VALVE_INSPECTION_DISTANCE,
  VALVE_V17,
} from "./world-constants";
import type { RouteId } from "./routes";
import type { RobotPosition, VerifierResult } from "./types";

function dist2D(a: RobotPosition, b: { x: number; z: number }): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

export function checkMission(input: {
  finalExposure: number;
  robotPos: RobotPosition;
  activeRoute: RouteId;
}): VerifierResult {
  const { finalExposure, robotPos, activeRoute } = input;
  if (activeRoute === "idle") {
    return {
      passed: false,
      details: ["No active mission."],
      reasons: ["Start a route from the mission deck."],
    };
  }
  const d = dist2D(robotPos, VALVE_V17);
  const atValve = d <= VALVE_INSPECTION_DISTANCE;
  const exposureOk = finalExposure <= MAX_SAFE_EXPOSURE;

  const details: string[] = [
    `delta_inspection: ${d.toFixed(2)} m (threshold ${VALVE_INSPECTION_DISTANCE} m)`,
    `integrated_dose: ${finalExposure.toFixed(1)} mSv (max ${MAX_SAFE_EXPOSURE} mSv)`,
    `route: ${activeRoute}`,
  ];

  const reasons: string[] = [];
  if (!atValve) {
    reasons.push("Inspection target V-17 not within required radius.");
  }
  if (!exposureOk) {
    reasons.push("Dose limit exceeded (radiation field exposure).");
  }
  if (atValve && exposureOk) {
    reasons.push("All mission rules satisfied.");
  }

  const passed = atValve && exposureOk;

  return { passed, details, reasons };
}
