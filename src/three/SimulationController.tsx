import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { routes, segmentDuration, type WaypointMeta } from "../simulation/routes";
import { getExposureMultiplier, useSimStore } from "../simulation/store";

const vA = new THREE.Vector3();
const vB = new THREE.Vector3();
const vT = new THREE.Vector3();
const vOut = { x: 0, y: 0, z: 0 };

function lerp3(
  w0: WaypointMeta,
  w1: WaypointMeta,
  t: number
): { x: number; y: number; z: number } {
  vA.set(w0.pos.x, w0.pos.y, w0.pos.z);
  vB.set(w1.pos.x, w1.pos.y, w1.pos.z);
  vT.copy(vA).lerp(vB, t);
  vOut.x = vT.x;
  vOut.y = vT.y;
  vOut.z = vT.z;
  return vOut;
}

/**
 * Drives waypoints, exposure tick, and mission completion.
 */
export function SimulationController() {
  const runOrder = useSimStore((s) => s.runOrder);
  const isAnimating = useSimStore((s) => s.isAnimating);
  const setRobotPos = useSimStore((s) => s.setRobotPos);
  const tickExposure = useSimStore((s) => s.tickExposure);
  const completeRun = useSimStore((s) => s.completeRun);
  const addLog = useSimStore((s) => s.addLog);
  const activeRoute = useSimStore((s) => s.activeRoute);
  const getS = useSimStore.getState;

  const segRef = useRef(0);
  const tRef = useRef(0);
  const lastLoggedForSeg = useRef(-1);

  useEffect(() => {
    segRef.current = 0;
    tRef.current = 0;
    lastLoggedForSeg.current = -1;
  }, [runOrder]);

  useFrame((_, delta) => {
    if (!isAnimating) return;
    if (activeRoute === "idle") return;
    if (!(activeRoute in routes)) return;
    const r = routes[activeRoute as keyof typeof routes];
    const wps = r.waypoints;
    const n = wps.length;
    if (n < 2) {
      return;
    }

    const mult = getExposureMultiplier(
      getS().activeRoute as "safe" | "risky" | "failed" | "idle"
    );
    if (getS().activeRoute !== "idle") {
      tickExposure(delta, mult);
    }

    const seg = segRef.current;
    if (tRef.current === 0 && lastLoggedForSeg.current !== seg) {
      lastLoggedForSeg.current = seg;
      addLog({
        state: wps[seg].name,
        action: "MOVE",
        nextState: wps[seg + 1].name,
        timestamp: Date.now(),
      });
    }

    tRef.current += delta / segmentDuration;
    if (tRef.current < 1) {
      const p = lerp3(wps[seg], wps[seg + 1], tRef.current);
      setRobotPos(p);
      return;
    }

    tRef.current = 0;
    setRobotPos({ ...wps[seg + 1].pos });

    if (seg < n - 2) {
      segRef.current = seg + 1;
      return;
    }
    completeRun({ ...wps[n - 1].pos });
  });

  return null;
}
