import type { MissionDefinition, MissionId } from "../store/simulationTypes";

export const missions: Record<MissionId, MissionDefinition> = {
  gauge_g12: {
    id: "gauge_g12",
    name: "Inspect Gauge G-12",
    description:
      "Navigate to gauge G-12, capture a valid reading, and return to the safe zone.",
    objectives: [
      "Reach inspection range of Gauge G-12",
      "Inspect G-12 (click or E) with valid line-of-sight",
      "Return to safe zone",
    ],
    timeLimitSec: 420,
    requiresGauge: true,
    requiresValve: false,
  },
  valve_v17: {
    id: "valve_v17",
    name: "Check Valve V-17",
    description:
      "Inspect valve V-17 state (open / closed / leaking) and return to the safe zone.",
    objectives: [
      "Reach inspection range of Valve V-17",
      "Inspect V-17 (click or E) with valid line-of-sight",
      "Return to safe zone",
    ],
    timeLimitSec: 420,
    requiresGauge: false,
    requiresValve: true,
  },
  radiation_dual: {
    id: "radiation_dual",
    name: "Radiation-Constrained Inspection",
    description:
      "Inspect both G-12 and V-17 while keeping cumulative dose under budget, then return to safe zone.",
    objectives: [
      "Inspect Gauge G-12 within sensor range and LOS",
      "Inspect Valve V-17 within sensor range and LOS",
      "Keep cumulative dose below mission budget",
      "Return to safe zone",
    ],
    timeLimitSec: 600,
    radiationBudgetMsV: 18,
    requiresGauge: true,
    requiresValve: true,
  },
};

export const defaultMissionId: MissionId = "gauge_g12";
