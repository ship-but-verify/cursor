import * as THREE from "three";
import { robotProfile } from "../data/robotProfile";
import { gaugeG12, valveV17 } from "../data/worldLayout";

export type InspectTargetId = "gauge_g12" | "valve_v17";

export function getInspectTargetWorldPos(id: InspectTargetId): THREE.Vector3 {
  return id === "gauge_g12"
    ? gaugeG12.position.clone()
    : valveV17.position.clone();
}

/**
 * Ray from eye toward target; LOS clear if no `userData.blocksLos` mesh is hit before the target sphere.
 */
export function inspectLineOfSight(
  origin: THREE.Vector3,
  scene: THREE.Object3D,
  targetId: InspectTargetId
): { ok: boolean; distance: number; blockedBy?: string } {
  const targetPos = getInspectTargetWorldPos(targetId);
  const toTarget = targetPos.clone().sub(origin);
  const distance = toTarget.length();
  if (distance < 1e-4) return { ok: true, distance: 0 };
  const dir = toTarget.normalize();
  const raycaster = new THREE.Raycaster(origin, dir, 0, distance + 0.05);
  const hits = raycaster.intersectObjects(scene.children, true);
  const targetRadius = 0.45;
  for (const h of hits) {
    const d = h.distance;
    if (d > distance - targetRadius) {
      return { ok: true, distance };
    }
    const ud = h.object.userData as { blocksLos?: boolean; inspectTarget?: InspectTargetId };
    if (ud.inspectTarget === targetId) {
      return { ok: true, distance };
    }
    if (ud.blocksLos) {
      return { ok: false, distance, blockedBy: h.object.name || "geometry" };
    }
  }
  return { ok: true, distance };
}

export function canInspect(
  origin: THREE.Vector3,
  scene: THREE.Object3D,
  targetId: InspectTargetId
): { ok: boolean; distance: number; losOk: boolean } {
  const targetPos = getInspectTargetWorldPos(targetId);
  const distance = origin.distanceTo(targetPos);
  if (distance > robotProfile.sensorRangeM) {
    return { ok: false, distance, losOk: false };
  }
  const los = inspectLineOfSight(origin, scene, targetId);
  return { ok: los.ok, distance, losOk: los.ok };
}
