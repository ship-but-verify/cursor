import type { ExportPayload } from "../store/simulationTypes";
import type { MissionDefinition } from "../store/simulationTypes";
import type { VerifierResult } from "../store/simulationTypes";
import type { TrainingValidity } from "../store/simulationTypes";
import type { EventLogEntry } from "../store/simulationTypes";
import type { TrajectoryLogEntry } from "../store/simulationTypes";
import type { TelemetryLogEntry } from "../store/simulationTypes";
import type { HapticsLogEntry } from "../store/simulationTypes";
import type { PhysicalLimitWarning } from "../store/simulationTypes";
import type { SimulationIntegrityEvent } from "../store/simulationTypes";

export function buildExportPayload(input: {
  mission: MissionDefinition;
  event_log: EventLogEntry[];
  trajectory_log: TrajectoryLogEntry[];
  telemetry_log: TelemetryLogEntry[];
  haptics_log: HapticsLogEntry[];
  physical_limit_warnings: PhysicalLimitWarning[];
  simulation_integrity_events: SimulationIntegrityEvent[];
  verifier_results: VerifierResult | null;
  final_outcome: ExportPayload["final_outcome"];
  training_validity: TrainingValidity;
}): ExportPayload {
  return {
    mission_metadata: input.mission,
    task_objectives: input.mission.objectives,
    event_log: input.event_log,
    trajectory_log: input.trajectory_log,
    telemetry_log: input.telemetry_log,
    haptics_log: input.haptics_log,
    physical_limit_warnings: input.physical_limit_warnings,
    simulation_integrity_events: input.simulation_integrity_events,
    verifier_results: input.verifier_results,
    final_outcome: input.final_outcome,
    training_validity: input.training_validity,
    exported_at: new Date().toISOString(),
  };
}
