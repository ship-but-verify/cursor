/** Mission lifecycle */
export type MissionStatus =
  | "not_started"
  | "running"
  | "completed"
  | "failed"
  | "invalid";

export type RunValidity = "valid" | "warning" | "invalid";

export type MissionId = "gauge_g12" | "valve_v17" | "radiation_dual";

export interface MissionDefinition {
  id: MissionId;
  name: string;
  description: string;
  objectives: string[];
  timeLimitSec: number;
  radiationBudgetMsV?: number;
  requiresGauge: boolean;
  requiresValve: boolean;
}

export interface EventLogEntry {
  timestamp: string;
  kind: string;
  message: string;
  detail?: string;
}

export interface TrajectoryLogEntry {
  timestamp: string;
  state: string;
  action: string;
  object?: string;
  next_state: string;
  verifier?: string;
}

export interface TelemetryLogEntry {
  timestamp: string;
  robot_position: [number, number, number];
  robot_rotation: [number, number, number, number];
  current_zone: string;
  velocity: [number, number, number];
  acceleration: [number, number, number];
  battery: number;
  radiation_exposure_rate: number;
  cumulative_radiation_dose: number;
  collision_active: boolean;
  contact_force_n: number;
  distance_nearest_hazard_m: number;
  sensor_confidence: number;
  task_progress: string;
  current_action: string;
  arm_status: "nominal" | "broken";
  held_object: string | null;
  arm_pitch_rad: number;
  arm_yaw_rad: number;
  physical_limit_warnings: string[];
}

export interface HapticsLogEntry {
  timestamp: string;
  contact_object: string;
  contact_type: string;
  force_newtons: number;
  duration_ms: number;
  severity: "low" | "medium" | "high";
  simulated_haptic_feedback: {
    vibration_intensity: number;
    resistance: number;
  };
}

export interface SimulationIntegrityEvent {
  timestamp: string;
  event_type: "simulation_integrity_event";
  issue: string;
  description: string;
  severity: "low" | "medium" | "high";
  recommended_fix: string;
}

export interface PhysicalLimitWarning {
  timestamp: string;
  level: "warning" | "limit_exceeded";
  code: string;
  message: string;
  recovery?: string;
}

export interface VerifierResult {
  mission_success: boolean;
  run_validity: RunValidity;
  gauge_inspected: boolean;
  valve_inspected: boolean;
  returned_to_safe_zone: boolean;
  radiation_limit_passed: boolean;
  collision_free: boolean;
  speed_limit_passed: boolean;
  acceleration_limit_passed: boolean;
  contact_force_passed: boolean;
  sensor_range_passed: boolean;
  line_of_sight_passed: boolean;
  simulation_integrity_passed: boolean;
  failure_mode: string | null;
}

export interface TrainingValidity {
  usable_for_training: boolean;
  usable_for_eval: boolean;
  invalid_reason: string | null;
  requires_human_review: boolean;
}

export interface ExportPayload {
  mission_metadata: MissionDefinition;
  task_objectives: string[];
  event_log: EventLogEntry[];
  trajectory_log: TrajectoryLogEntry[];
  telemetry_log: TelemetryLogEntry[];
  haptics_log: HapticsLogEntry[];
  physical_limit_warnings: PhysicalLimitWarning[];
  simulation_integrity_events: SimulationIntegrityEvent[];
  verifier_results: VerifierResult | null;
  final_outcome: MissionStatus;
  training_validity: TrainingValidity;
  exported_at: string;
}
