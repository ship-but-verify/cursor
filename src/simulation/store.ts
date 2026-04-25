import { create } from "zustand";
import { ROBOT_START } from "./world-constants";
import { routes, type RouteId } from "./routes";
import type { Mission, TraceLogEntry, VerifierResult } from "./types";
import { checkMission } from "./verifier";

const mission: Mission = {
  id: "ND-WP-01",
  title: "Reactor Hall — V-17 seal inspection",
  description:
    "Autonomous transporter must reach manual valve V-17 under exposure budget. Radiation model uses live sensor fields.",
  objectives: [
    "Enter reactor hall with collision modeling active",
    "Navigate to inspection target V-17",
    "Minimize integrated dose (mSv) below threshold",
    "Emit trace for Fleet AI verifier",
  ],
};

const initialRunMs = () => performance.now();

interface SimState {
  mission: Mission;
  robotPos: { x: number; y: number; z: number };
  /** Number of active radiation zone intersections. */
  radiationStack: number;
  exposure: number;
  activeRoute: RouteId;
  isAnimating: boolean;
  runStartedAt: number;
  runT0: number;
  log: TraceLogEntry[];
  verifier: VerifierResult | null;
  runOrder: number;

  setRadiationStack: (n: number) => void;
  radiationEnter: () => void;
  radiationExit: () => void;
  addLog: (entry: Omit<TraceLogEntry, "tRelMs" | "verifier"> & Partial<Pick<TraceLogEntry, "verifier">>) => void;
  setRobotPos: (p: { x: number; y: number; z: number }) => void;
  tickExposure: (dt: number, mult: number) => void;
  startRoute: (id: "safe" | "risky" | "failed") => void;
  setAnimating: (v: boolean) => void;
  setActiveRoute: (r: RouteId) => void;
  completeRun: (finalPos: { x: number; y: number; z: number }) => void;
  reset: () => void;
}

const emptyLog: TraceLogEntry[] = [];

function relNow(runT0: number) {
  return performance.now() - runT0;
}

export const useSimStore = create<SimState>((set, get) => ({
  mission,
  robotPos: { ...ROBOT_START },
  radiationStack: 0,
  exposure: 0,
  activeRoute: "idle",
  isAnimating: false,
  runStartedAt: initialRunMs(),
  runT0: initialRunMs(),
  log: emptyLog,
  verifier: null,
  runOrder: 0,

  setRadiationStack: (n) => set({ radiationStack: n }),

  radiationEnter: () =>
    set((s) => ({ radiationStack: s.radiationStack + 1 })),
  radiationExit: () =>
    set((s) => ({ radiationStack: Math.max(0, s.radiationStack - 1) })),

  addLog: (entry) => {
    const runT0 = get().runT0;
    const tRelMs = relNow(runT0);
    const logEntry: TraceLogEntry = {
      state: entry.state,
      action: entry.action,
      nextState: entry.nextState,
      timestamp: entry.timestamp ?? Date.now(),
      tRelMs,
      verifier: entry.verifier ?? "pending",
    };
    set((s) => ({ log: [...s.log, logEntry] }));
  },

  setRobotPos: (p) => set({ robotPos: { ...p } }),

  tickExposure: (dt, mult) => {
    const stack = get().radiationStack;
    if (stack <= 0) return;
    const baseRate = 2.6;
    set((s) => ({
      exposure: s.exposure + baseRate * mult * stack * dt,
    }));
  },

  startRoute: (id) => {
    const r = routes[id];
    const t0 = performance.now();
    set({
      runT0: t0,
      runStartedAt: t0,
      exposure: 0,
      radiationStack: 0,
      log: [],
      verifier: null,
      activeRoute: id,
      robotPos: { ...r.waypoints[0].pos },
      runOrder: get().runOrder + 1,
      isAnimating: true,
    });
    get().addLog({
      state: "IDLE",
      action: "ROUTE_START",
      nextState: r.waypoints[0].name,
      timestamp: Date.now(),
    });
  },

  setAnimating: (v) => set({ isAnimating: v }),
  setActiveRoute: (r) => set({ activeRoute: r }),

  completeRun: (finalPos) => {
    set({ robotPos: { ...finalPos }, isAnimating: false });
    const s = get();
    const v = checkMission({
      finalExposure: s.exposure,
      robotPos: finalPos,
      activeRoute: s.activeRoute,
    });
    const tRel = relNow(s.runT0);
    const logEntry: TraceLogEntry = {
      state: "MISSION",
      action: "VERIFY",
      nextState: v.passed ? "PASS" : "FAIL",
      timestamp: Date.now(),
      tRelMs: tRel,
      verifier: { passed: v.passed, snapshot: JSON.stringify(v) },
    };
    set((st) => ({
      verifier: v,
      log: [...st.log, logEntry],
    }));
  },

  reset: () =>
    set({
      robotPos: { ...ROBOT_START },
      radiationStack: 0,
      exposure: 0,
      activeRoute: "idle",
      isAnimating: false,
      runT0: initialRunMs(),
      log: [],
      verifier: null,
    }),
}));

export function getExposureMultiplier(route: RouteId): number {
  if (route === "safe") return routes.safe.exposureMultiplier;
  if (route === "risky") return routes.risky.exposureMultiplier;
  if (route === "failed") return routes.failed.exposureMultiplier;
  if (route === "idle") return 1;
  return 1;
}
