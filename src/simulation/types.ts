import type { RouteId } from "./routes";

export type LogVerifierField =
  | "pending"
  | { passed: boolean; snapshot: string };

export interface TraceLogEntry {
  state: string;
  action: string;
  nextState: string;
  timestamp: number;
  /** ISO offset from run start in ms, or same as performance relative */
  tRelMs: number;
  verifier: LogVerifierField;
}

export interface VerifierResult {
  passed: boolean;
  details: string[];
  reasons: string[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  objectives: string[];
}

export interface ExportPayload {
  mission: Mission;
  log: TraceLogEntry[];
  finalExposure: number;
  verifier: VerifierResult | null;
  atValve: boolean;
  inSafeCorridor: boolean;
  activeRoute: RouteId;
  exportedAt: string;
}

export interface RobotPosition {
  x: number;
  y: number;
  z: number;
}
