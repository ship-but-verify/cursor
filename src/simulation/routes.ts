import { ROBOT_START, VALVE_V17 } from "./world-constants";

export type RouteId = "idle" | "safe" | "risky" | "failed";

export interface WaypointMeta {
  name: string;
  pos: { x: number; y: number; z: number };
}

const y = 0.5;

/** Stays in corridor / safe zone, ends at V-17 with low exposure. */
const safeWaypoints: WaypointMeta[] = [
  { name: "NAV:spawn", pos: { ...ROBOT_START, y } },
  { name: "NAV:corridor_west", pos: { x: -5, y, z: 4.5 } },
  { name: "NAV:corridor_north", pos: { x: -3, y, z: 2.5 } },
  { name: "NAV:valve_approach", pos: { x: 3.5, y, z: 2.5 } },
  { name: "NAV:valve_V17", pos: { x: VALVE_V17.x - 0.8, y, z: VALVE_V17.z } },
];

/** Dips through the hot cell — long exposure. */
const riskyWaypoints: WaypointMeta[] = [
  { name: "NAV:spawn", pos: { ...ROBOT_START, y } },
  { name: "NAV:hot_ingress", pos: { x: 0, y, z: 0 } },
  { name: "NAV:hot_core", pos: { x: 0.5, y, z: -0.3 } },
  { name: "NAV:hot_egress", pos: { x: -0.2, y, z: 1.2 } },
  { name: "NAV:valve_approach", pos: { x: 3.2, y, z: 2.4 } },
  { name: "NAV:valve_V17", pos: { x: VALVE_V17.x - 0.5, y, z: VALVE_V17.z } },
];

/** Ends in staging short of the valve (mission fail). */
const failedWaypoints: WaypointMeta[] = [
  { name: "NAV:spawn", pos: { ...ROBOT_START, y } },
  { name: "NAV:staging", pos: { x: 2, y, z: 5.5 } },
  { name: "NAV:aborted", pos: { x: 4, y, z: 5.2 } },
];

export const routes = {
  safe: {
    id: "safe" as const,
    label: "Safe route",
    exposureMultiplier: 0.4,
    waypoints: safeWaypoints,
  },
  risky: {
    id: "risky" as const,
    label: "Risky route",
    exposureMultiplier: 2.2,
    waypoints: riskyWaypoints,
  },
  failed: {
    id: "failed" as const,
    label: "Failed route",
    exposureMultiplier: 1.2,
    waypoints: failedWaypoints,
  },
} as const;

export const segmentDuration = 1.0;
