import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CapsuleCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import * as THREE from "three";
import { PerspectiveCamera } from "@react-three/drei";
import { gaugeG12, playerSpawn, valveV17 } from "../../data/worldLayout";
import { robotProfile } from "../../data/robotProfile";
import { useSimulationStore } from "../../store/useSimulationStore";
import { canInspect, type InspectTargetId } from "../../utils/inspectRay";

type Keys = Record<string, boolean>;

const MOVE_FORCE = 22;
const CONTACT_LOG_MIN_N = 22;
const SOFT_RESET_Y = -1;
const ARM_PITCH_LIMIT_RAD = 5.7;
const ARM_YAW_LIMIT_RAD = 6.6;
const ARM_PITCH_MIN_RAD = -6.3;
const ARM_PITCH_MAX_RAD = 6.3;
const ARM_CONTROL_SPEED = 1.8;
const ARM_BREAK_PITCH_RED = ARM_PITCH_LIMIT_RAD * 0.9;
const ARM_BREAK_YAW_RED = ARM_YAW_LIMIT_RAD * 0.9;
const ARM_TOUCH_RADIUS = 1.45;
const ARM_TIP_LOCAL = new THREE.Vector3(0.04, -1.18, -0.42);

function FirstPersonArm() {
  const armPitch = useSimulationStore((s) => s.armPitchRad);
  const armYaw = useSimulationStore((s) => s.armYawRad);
  const heldObjectId = useSimulationStore((s) => s.heldObjectId);
  const armStatus = useSimulationStore((s) => s.armStatus);
  const broken = armStatus === "broken";
  const active = !!heldObjectId && !broken;
  return (
    <group
      position={[0, -0.14, -0.55]}
      rotation={[broken ? 0.9 : armPitch * 0.55, broken ? 0.55 : armYaw * 0.9, broken ? 0.35 : 0]}
    >
      <mesh castShadow renderOrder={999}>
        <boxGeometry args={[0.09, 0.3, 0.09]} />
        <meshBasicMaterial
          color={broken ? "#dc2626" : "#f59e0b"}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <group position={[0.04, -0.24, -0.08]} rotation={[active ? -0.52 : -0.25, 0, 0]}>
        <mesh castShadow renderOrder={999}>
          <boxGeometry args={[0.08, 0.56, 0.08]} />
          <meshBasicMaterial
            color={broken ? "#ef4444" : "#fbbf24"}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, -0.4, -0.1]} castShadow renderOrder={999}>
          <boxGeometry args={[0.2, 0.06, 0.16]} />
          <meshBasicMaterial
            color={broken ? "#b91c1c" : active ? "#22c55e" : "#eab308"}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

export function PlayerRobot() {
  const rb = useRef<RapierRigidBody>(null);
  const pivot = useRef<THREE.Group>(null);
  const armHud = useRef<THREE.Group>(null);
  const { gl, scene, camera } = useThree();
  const missionId = useSimulationStore((s) => s.missionId);
  const missionStatus = useSimulationStore((s) => s.missionStatus);
  const physicsResetKey = useSimulationStore((s) => s.physicsResetKey);
  const armStatus = useSimulationStore((s) => s.armStatus);
  const keys = useRef<Keys>({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const armPitch = useRef(0);
  const armYaw = useRef(0);
  const lastContactLogMs = useRef(0);
  const lastSoftResetLogMs = useRef(0);

  const setPlayerKinematics = useSimulationStore((s) => s.setPlayerKinematics);
  const setArmPose = useSimulationStore((s) => s.setArmPose);
  const tickExposure = useSimulationStore((s) => s.tickExposure);
  const startMission = useSimulationStore((s) => s.startMission);
  const resetMission = useSimulationStore((s) => s.resetMission);
  const pickObject = useSimulationStore((s) => s.pickObject);
  const dropObject = useSimulationStore((s) => s.dropObject);
  const registerCollisionForce = useSimulationStore((s) => s.registerCollisionForce);
  const getS = useSimulationStore.getState;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "KeyR") {
        e.preventDefault();
        resetMission();
      }
      if (e.code === "KeyE") {
        e.preventDefault();
        if (missionStatus !== "running") return;
        const hud = armHud.current;
        if (!hud) return;
        const tip = hud.localToWorld(ARM_TIP_LOCAL.clone());
        const s = getS();
        if (s.heldObjectId) {
          dropObject("manual_release");
          return;
        }

        let bestPickupId: string | null = null;
        let bestPickupDist = Number.POSITIVE_INFINITY;
        scene.traverse((obj) => {
          const id = obj.userData?.pickupId as string | undefined;
          if (!id) return;
          const wp = new THREE.Vector3();
          obj.getWorldPosition(wp);
          const d = wp.distanceTo(tip);
          if (d < bestPickupDist) {
            bestPickupDist = d;
            bestPickupId = id;
          }
        });
        if (bestPickupId && bestPickupDist <= ARM_TOUCH_RADIUS) {
          pickObject(bestPickupId);
          return;
        }

        const inspectTargets: { id: InspectTargetId; pos: THREE.Vector3 }[] = [
          { id: "gauge_g12", pos: gaugeG12.position },
          { id: "valve_v17", pos: valveV17.position },
        ];
        let bestInspect: { id: InspectTargetId; d: number } | null = null;
        for (const it of inspectTargets) {
          const d = it.pos.distanceTo(tip);
          if (!bestInspect || d < bestInspect.d) bestInspect = { id: it.id, d };
        }
        if (bestInspect && bestInspect.d <= ARM_TOUCH_RADIUS) {
          const r = canInspect(tip, scene, bestInspect.id);
          s.recordInspectResult({
            objectId: bestInspect.id,
            ok: r.ok && r.losOk,
            reason: !r.ok
              ? "invalid_interaction_distance"
              : !r.losOk
                ? "inspected_through_wall"
                : undefined,
            distance: r.distance,
            losOk: r.losOk,
          });
          if (r.ok && r.losOk) s.tryFinalizeMission();
          return;
        }

        s.pushEvent({
          kind: "interact",
          message: "E action failed: arm tip not touching target",
        });
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [dropObject, getS, missionStatus, pickObject, resetMission, scene]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onClick = () => {
      if (missionStatus === "not_started") {
        startMission(missionId);
      } else if (missionStatus !== "running") {
        return;
      }
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
        return;
      }
    };
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      const maxTurn = robotProfile.maxTurnRateRadPerSec * (1 / 60) * 2;
      let dy = -e.movementX * 0.0025;
      let dp = -e.movementY * 0.0025;
      dy = Math.max(-maxTurn, Math.min(maxTurn, dy));
      dp = Math.max(-maxTurn, Math.min(maxTurn, dp));
      yaw.current += dy;
      pitch.current += dp;
      pitch.current = Math.max(-1.35, Math.min(1.35, pitch.current));
    };
    canvas.addEventListener("click", onClick);
    document.addEventListener("mousemove", onMove);
    return () => {
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("mousemove", onMove);
    };
  }, [
    gl,
    missionId,
    missionStatus,
    startMission,
  ]);

  useFrame((_, dt) => {
    const body = rb.current;
    const piv = pivot.current;
    const hud = armHud.current;
    if (!body || !piv || !hud) return;
    piv.rotation.order = "YXZ";
    piv.rotation.y = yaw.current;
    piv.rotation.x = pitch.current;
    if (armStatus === "nominal") {
      const armPitchInput =
        (keys.current.KeyI ? 1 : 0) -
        (keys.current.KeyK ? 1 : 0);
      const armYawInput =
        (keys.current.KeyL ? 1 : 0) -
        (keys.current.KeyJ ? 1 : 0);
      armPitch.current = THREE.MathUtils.clamp(
        armPitch.current + armPitchInput * ARM_CONTROL_SPEED * dt,
        ARM_PITCH_MIN_RAD,
        ARM_PITCH_MAX_RAD
      );
      armYaw.current = THREE.MathUtils.clamp(
        armYaw.current + armYawInput * ARM_CONTROL_SPEED * dt,
        -ARM_YAW_LIMIT_RAD,
        ARM_YAW_LIMIT_RAD
      );
    }
    setArmPose(armPitch.current, armYaw.current);
    camera.getWorldPosition(hud.position);
    camera.getWorldQuaternion(hud.quaternion);

    if (
      missionStatus === "running" &&
      armStatus === "nominal" &&
      (Math.abs(armPitch.current) >= ARM_BREAK_PITCH_RED ||
        Math.abs(armYaw.current) >= ARM_BREAK_YAW_RED)
    ) {
      resetMission();
      getS().pushEvent({
        kind: "arm",
        message: "Robot broke down: arm entered red-zone range",
      });
      armPitch.current = 0;
      armYaw.current = 0;
      setArmPose(0, 0);
      return;
    }

    if (missionStatus === "running") {
      tickExposure(dt);
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() > 1e-6) forward.normalize();
      const right = new THREE.Vector3()
        .crossVectors(forward, new THREE.Vector3(0, 1, 0))
        .normalize();
      let ix = 0;
      let iz = 0;
      if (keys.current.KeyW || keys.current.ArrowUp) {
        ix += forward.x;
        iz += forward.z;
      }
      if (keys.current.KeyS || keys.current.ArrowDown) {
        ix -= forward.x;
        iz -= forward.z;
      }
      if (keys.current.KeyD || keys.current.ArrowRight) {
        ix += right.x;
        iz += right.z;
      }
      if (keys.current.KeyA || keys.current.ArrowLeft) {
        ix -= right.x;
        iz -= right.z;
      }
      const len = Math.hypot(ix, iz);
      if (len > 1e-4) {
        ix /= len;
        iz /= len;
        body.applyImpulse(
          { x: ix * MOVE_FORCE * dt, y: 0, z: iz * MOVE_FORCE * dt },
          true
        );
      }
      const lv = body.linvel();
      const horiz = Math.hypot(lv.x, lv.z);
      if (horiz > robotProfile.maxSpeedMps) {
        const s = robotProfile.maxSpeedMps / horiz;
        body.setLinvel({ x: lv.x * s, y: lv.y, z: lv.z * s }, true);
      }
    }

    const t = body.translation();
    if (t.y < SOFT_RESET_Y) {
      body.setTranslation(playerSpawn, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      const now = performance.now();
      if (now - lastSoftResetLogMs.current > 1000) {
        lastSoftResetLogMs.current = now;
        getS().pushEvent({
          kind: "safety",
          message: "Soft reset to spawn (fall protection)",
        });
      }
      return;
    }
    const v = body.linvel();
    const pos = new THREE.Vector3(t.x, t.y, t.z);
    const vel = new THREE.Vector3(v.x, v.y, v.z);
    const q = new THREE.Quaternion();
    piv.getWorldQuaternion(q);
    setPlayerKinematics({
      pos,
      vel,
      quat: q,
      deltaTime: dt,
    });
  });

  return (
    <>
      <RigidBody
        key={physicsResetKey}
        ref={rb}
        position={[playerSpawn.x, playerSpawn.y, playerSpawn.z]}
        colliders={false}
        mass={1.2}
        linearDamping={2.8}
        angularDamping={8}
        enabledRotations={[false, false, false]}
        lockRotations
        onContactForce={(payload) => {
          const f = payload.totalForceMagnitude ?? 0;
          if (f < CONTACT_LOG_MIN_N) return;
          const now = performance.now();
          if (now - lastContactLogMs.current < 140) return;
          lastContactLogMs.current = now;
          const name =
            payload.other.rigidBodyObject?.name ||
            payload.other.colliderObject?.name ||
            "geometry";
          registerCollisionForce(f, name);
        }}
      >
        <CapsuleCollider args={[0.32, 0.45]} />
        <group ref={pivot}>
          <PerspectiveCamera
            makeDefault
            position={[0, 0.28, 0]}
            near={0.08}
            far={200}
            fov={72}
          />
        </group>
      </RigidBody>
      <group ref={armHud}>
        <FirstPersonArm />
      </group>
    </>
  );
}
