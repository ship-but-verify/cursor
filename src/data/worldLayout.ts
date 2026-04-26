import * as THREE from "three";

/** Safe zone AABB (XZ footprint, Y height) — return zone when player inside. */
export const safeZone = {
  min: new THREE.Vector3(-11.5, 0, 4),
  max: new THREE.Vector3(-7.5, 2.5, 8.5),
};

export const playerSpawn = { x: -9.5, y: 0.9, z: 6.2 };

export const gaugeG12 = {
  id: "Gauge G-12",
  objectId: "gauge_g12",
  position: new THREE.Vector3(1.9, 1.05, 0.85),
  reading: "42.6 PSI",
};

export const valveV17 = {
  id: "Valve V-17",
  objectId: "valve_v17",
  position: new THREE.Vector3(6.8, 0.45, 2.2),
  state: "closed" as "open" | "closed" | "leaking",
};

/** Zone labels by AABB overlap (first match wins order). */
export const zoneRegions: {
  name: string;
  min: THREE.Vector3;
  max: THREE.Vector3;
}[] = [
  {
    name: "entry_corridor",
    min: new THREE.Vector3(-12, 0, 3.5),
    max: new THREE.Vector3(-6, 3, 8.8),
  },
  {
    name: "reactor_hall",
    min: new THREE.Vector3(-6, 0, -4),
    max: new THREE.Vector3(5, 4, 5),
  },
  {
    name: "pipe_room",
    min: new THREE.Vector3(5, 0, -2),
    max: new THREE.Vector3(10, 3.5, 5.5),
  },
  {
    name: "inspection_bay",
    min: new THREE.Vector3(1, 0, -3.5),
    max: new THREE.Vector3(5, 3, 1),
  },
  {
    name: "base_station",
    min: safeZone.min.clone(),
    max: safeZone.max.clone(),
  },
];

export function getZoneAt(pos: THREE.Vector3): string {
  for (const z of zoneRegions) {
    if (
      pos.x >= z.min.x &&
      pos.x <= z.max.x &&
      pos.y >= z.min.y &&
      pos.y <= z.max.y &&
      pos.z >= z.min.z &&
      pos.z <= z.max.z
    ) {
      return z.name;
    }
  }
  return "facility_unknown";
}

export function inSafeZone(pos: THREE.Vector3): boolean {
  return (
    pos.x >= safeZone.min.x &&
    pos.x <= safeZone.max.x &&
    pos.y >= safeZone.min.y &&
    pos.y <= safeZone.max.y &&
    pos.z >= safeZone.min.z &&
    pos.z <= safeZone.max.z
  );
}
