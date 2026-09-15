import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DustWorld, RifleViewmodel } from "./world";
import { OperatorMesh } from "./operator";
import { OPERATORS } from "@/lib/strike/cast";
import { BOT_SPAWNS, SPAWN_CT, WAYPOINTS, collideXZ, losBlocked } from "@/lib/strike/map";
import { input } from "@/lib/strike/input";
import { sfxEmpty, sfxFire, sfxHead, sfxHit, sfxHurt, sfxKill, sfxReload } from "@/lib/strike/audio";

export type Hud = {
  hp: number;
  armor: number;
  ammo: number;
  reserve: number;
  kills: number;
  deaths: number;
  hit: number;
  hurt: number;
  feed: string;
  alive: number;
};

type Bot = {
  id: string;
  name: string;
  face: string;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  wp: number;
  cool: number;
  dead: number;
  walking: boolean;
  aiming: boolean;
};

type Sim = {
  x: number;
  z: number;
  y: number;
  yaw: number;
  pitch: number;
  vy: number;
  grounded: boolean;
  hp: number;
  armor: number;
  ammo: number;
  reserve: number;
  reload: number;
  shot: number;
  kick: number;
  trauma: number;
  kills: number;
  deaths: number;
  hitFlash: number;
  hurtFlash: number;
  feed: string;
  feedT: number;
  respawn: number;
  bots: Bot[];
};

const MAG = 30;
const SPEED = 6.2;
const SENS = 0.0022;

function makeBots(): Bot[] {
  return OPERATORS.filter((o) => o.team === "t")
    .slice(0, 5)
    .map((o, i) => ({
      id: o.id,
      name: o.name,
      face: o.face,
      x: BOT_SPAWNS[i]!.x,
      z: BOT_SPAWNS[i]!.z,
      yaw: BOT_SPAWNS[i]!.yaw,
      hp: 100,
      wp: i % WAYPOINTS.length,
      cool: 0.4 + i * 0.2,
      dead: 0,
      walking: true,
      aiming: false,
    }));
}

function spawnPlayer(s: Sim) {
  s.x = SPAWN_CT.x;
  s.z = SPAWN_CT.z;
  s.y = 1.62;
  s.yaw = SPAWN_CT.yaw;
  s.pitch = -0.08;
  s.vy = 0;
  s.hp = 100;
  s.armor = 50;
  s.ammo = MAG;
  s.reserve = 90;
}

function forward(yaw: number) {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}
function right(yaw: number) {
  return { x: Math.cos(yaw), z: -Math.sin(yaw) };
}

function PlaySim({ onHud, paused }: { onHud: (h: Hud) => void; paused: boolean }) {
  const { camera } = useThree();
  const sim = useRef<Sim | null>(null);
  const hudRef = useRef(onHud);
  hudRef.current = onHud;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const botsRef = useRef<THREE.Group>(null);

  if (!sim.current) {
    const s: Sim = {
      x: 0,
      z: 0,
      y: 1.62,
      yaw: 0,
      pitch: 0,
      vy: 0,
      grounded: true,
      hp: 100,
      armor: 50,
      ammo: MAG,
      reserve: 90,
      reload: 0,
      shot: 0,
      kick: 0,
      trauma: 0,
      kills: 0,
      deaths: 0,
      hitFlash: 0,
      hurtFlash: 0,
      feed: "",
      feedT: 0,
      respawn: 0,
      bots: makeBots(),
    };
    spawnPlayer(s);
    sim.current = s;
  }

  useEffect(() => {
    const s = sim.current!;
    const probe = {
      getYaw: () => s.yaw,
      getSpeed: () => (s as Sim & { speed?: number }).speed ?? 0,
      getPos: () => ({ x: s.x, z: s.z }),
      setKeys: (codes: string[]) => input.setKeys(codes),
    };
    (window as unknown as { __controlsTest: typeof probe }).__controlsTest = probe;
    return () => {
      delete (window as unknown as { __controlsTest?: unknown }).__controlsTest;
    };
  }, []);

  const fireRay = (s: Sim) => {
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(s.pitch, s.yaw, 0, "YXZ"));
    dir.x += (Math.random() - 0.5) * 0.028;
    dir.y += (Math.random() - 0.5) * 0.02;
    dir.normalize();
    const origin = new THREE.Vector3(s.x, s.y, s.z);
    let best: { bot: Bot; t: number; head: boolean } | null = null;
    for (const bot of s.bots) {
      if (bot.dead > 0) continue;
      const to = new THREE.Vector3(bot.x - origin.x, 1.0 - origin.y, bot.z - origin.z);
      const t = to.dot(dir);
      if (t < 0.4 || t > 42) continue;
      const closest = origin.clone().add(dir.clone().multiplyScalar(t));
      const dx = closest.x - bot.x;
      const dz = closest.z - bot.z;
      const dy = closest.y - 0.9;
      if (dx * dx + dz * dz > 0.42 * 0.42) continue;
      if (losBlocked(s.x, s.z, bot.x, bot.z)) continue;
      const head = closest.y > 1.32;
      if (!best || t < best.t) best = { bot, t, head };
    }
    return best;
  };

  useFrame((_, rawDt) => {
    const s = sim.current!;
    const dt = Math.min(rawDt, 0.05);
    if (pausedRef.current) return;

    const look = input.consumeLook();
    s.yaw -= look.x * SENS;
    s.pitch -= look.y * SENS;
    s.pitch = Math.max(-1.4, Math.min(1.4, s.pitch));

    const f = forward(s.yaw);
    const r = right(s.yaw);
    let mx = 0;
    let mz = 0;
    if (input.keys.has("KeyW") || input.keys.has("ArrowUp")) {
      mx += f.x;
      mz += f.z;
    }
    if (input.keys.has("KeyS") || input.keys.has("ArrowDown")) {
      mx -= f.x;
      mz -= f.z;
    }
    if (input.keys.has("KeyD") || input.keys.has("ArrowRight")) {
      mx += r.x;
      mz += r.z;
    }
    if (input.keys.has("KeyA") || input.keys.has("ArrowLeft")) {
      mx -= r.x;
      mz -= r.z;
    }
    mx += f.x * -input.stickY + r.x * input.stickX;
    mz += f.z * -input.stickY + r.z * input.stickX;
    const mag = Math.hypot(mx, mz);
    if (mag > 1) {
      mx /= mag;
      mz /= mag;
    }
    const speed = input.keys.has("ShiftLeft") ? SPEED * 0.48 : SPEED;
    (s as Sim & { speed: number }).speed = mag > 0.05 && s.hp > 0 ? speed * Math.min(1, mag) : 0;
    if (s.hp > 0) {
      const next = collideXZ(s.x + mx * speed * dt, s.z + mz * speed * dt);
      s.x = next.x;
      s.z = next.z;
    }

    if ((input.keys.has("Space") || input.keys.has("KeyC")) && s.grounded && s.hp > 0) {
      s.vy = 5.2;
      s.grounded = false;
    }
    s.vy -= 18 * dt;
    s.y += s.vy * dt;
    if (s.y <= 1.62) {
      s.y = 1.62;
      s.vy = 0;
      s.grounded = true;
    }

    if ((input.keys.has("KeyR") || input.keys.has("Reload")) && s.reload <= 0 && s.ammo < MAG && s.reserve > 0) {
      s.reload = 1.6;
      sfxReload();
    }
    if (s.reload > 0) {
      s.reload -= dt;
      if (s.reload <= 0) {
        const need = MAG - s.ammo;
        const take = Math.min(need, s.reserve);
        s.ammo += take;
        s.reserve -= take;
      }
    }

    s.shot = Math.max(0, s.shot - dt);
    s.kick *= Math.exp(-12 * dt);
    s.trauma = Math.max(0, s.trauma - dt * 2.4);
    s.hitFlash = Math.max(0, s.hitFlash - dt * 6);
    s.hurtFlash = Math.max(0, s.hurtFlash - dt * 4);
    s.feedT = Math.max(0, s.feedT - dt);
    if (s.respawn > 0) {
      s.respawn -= dt;
      if (s.respawn <= 0) spawnPlayer(s);
    }

    const wantFire = input.fire || input.keys.has("MouseLeft");
    if (wantFire && s.hp > 0 && s.reload <= 0 && s.shot <= 0) {
      if (s.ammo <= 0) {
        s.shot = 0.18;
        sfxEmpty();
      } else {
        s.ammo -= 1;
        s.shot = 0.095;
        s.kick = 0.12;
        s.pitch += 0.018;
        s.yaw += (Math.random() - 0.5) * 0.01;
        s.trauma = Math.min(1, s.trauma + 0.12);
        sfxFire();
        const hit = fireRay(s);
        if (hit) {
          const dmg = hit.head ? 90 : 34;
          hit.bot.hp -= dmg;
          s.hitFlash = 1;
          if (hit.head) sfxHead();
          else sfxHit();
          if (hit.bot.hp <= 0) {
            hit.bot.hp = 0;
            hit.bot.dead = 3.2;
            s.kills += 1;
            s.feed = `${hit.bot.name} down`;
            s.feedT = 2.2;
            sfxKill();
          }
        }
      }
    }

    for (const bot of s.bots) {
      if (bot.dead > 0) {
        bot.dead -= dt;
        bot.walking = false;
        bot.aiming = false;
        if (bot.dead <= 0) {
          bot.hp = 100;
          const p = WAYPOINTS[bot.wp % WAYPOINTS.length]!;
          bot.x = p.x;
          bot.z = p.z;
        }
        continue;
      }
      bot.cool -= dt;
      const dx = s.x - bot.x;
      const dz = s.z - bot.z;
      const dist = Math.hypot(dx, dz);
      const see = s.hp > 0 && dist < 22 && !losBlocked(bot.x, bot.z, s.x, s.z);
      if (see) {
        bot.yaw = Math.atan2(dx, dz);
        bot.aiming = true;
        bot.walking = dist > 7;
        if (dist > 6) {
          const step = collideXZ(bot.x + (dx / dist) * 2.4 * dt, bot.z + (dz / dist) * 2.4 * dt);
          bot.x = step.x;
          bot.z = step.z;
        }
        if (bot.cool <= 0) {
          bot.cool = 0.38 + Math.random() * 0.25;
          if (Math.random() < 0.62) {
            let dmg = 12 + Math.floor(Math.random() * 10);
            const soak = Math.min(s.armor, Math.floor(dmg * 0.5));
            s.armor -= soak;
            dmg -= soak;
            s.hp -= dmg;
            s.hurtFlash = 1;
            s.trauma = Math.min(1, s.trauma + 0.35);
            sfxHurt();
            if (s.hp <= 0) {
              s.hp = 0;
              s.deaths += 1;
              s.feed = "You dropped";
              s.feedT = 2;
              s.reload = 0;
              s.respawn = 1.8;
            }
          }
        }
      } else {
        bot.aiming = false;
        bot.walking = true;
        const wp = WAYPOINTS[bot.wp % WAYPOINTS.length]!;
        const wx = wp.x - bot.x;
        const wz = wp.z - bot.z;
        const wd = Math.hypot(wx, wz) || 1;
        bot.yaw = Math.atan2(wx, wz);
        const step = collideXZ(bot.x + (wx / wd) * 2.1 * dt, bot.z + (wz / wd) * 2.1 * dt);
        bot.x = step.x;
        bot.z = step.z;
        if (wd < 0.7) bot.wp = (bot.wp + 1) % WAYPOINTS.length;
      }
    }

    const shake = s.trauma * s.trauma;
    const sx = (Math.random() - 0.5) * 0.08 * shake;
    const sy = (Math.random() - 0.5) * 0.06 * shake;
    camera.position.set(s.x + sx, s.y + sy, s.z);
    camera.rotation.set(s.pitch, s.yaw, 0, "YXZ");

    hudRef.current({
      hp: Math.max(0, Math.round(s.hp)),
      armor: Math.max(0, Math.round(s.armor)),
      ammo: s.ammo,
      reserve: s.reserve,
      kills: s.kills,
      deaths: s.deaths,
      hit: s.hitFlash,
      hurt: s.hurtFlash,
      feed: s.feedT > 0 ? s.feed : "",
      alive: s.bots.filter((b) => b.dead <= 0).length,
    });
  });

  const s = sim.current!;
  return (
    <>
      <color attach="background" args={["#8aa0b0"]} />
      <fog attach="fog" args={["#c8b492", 22, 70]} />
      <hemisphereLight args={["#c9d6e2", "#b0895a", 0.7]} />
      <directionalLight
        position={[18, 28, 8]}
        intensity={2.1}
        color="#ffe6c2"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={70}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
      />
      <DustWorld />
      <group ref={botsRef}>
        {s.bots.map((b) => (
          <BotBody key={b.id} bot={b} />
        ))}
      </group>
      <RifleOverlay sim={sim} />
    </>
  );
}

function BotBody({ bot }: { bot: Bot }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(bot.x, 0, bot.z);
    ref.current.rotation.y = bot.yaw;
  });
  return (
    <group ref={ref}>
      <OperatorMesh face={bot.face} team="t" state={bot} />
    </group>
  );
}

function RifleOverlay({ sim }: { sim: React.MutableRefObject<Sim | null> }) {
  const group = useRef<THREE.Group>(null);
  const gun = useRef<THREE.Group>(null);
  const { camera } = useThree();
  useFrame(() => {
    if (!group.current) return;
    group.current.position.copy(camera.position);
    group.current.quaternion.copy(camera.quaternion);
    if (gun.current) gun.current.rotation.x = sim.current?.kick ?? 0;
  });
  return (
    <group ref={group}>
      <group ref={gun}>
        <RifleViewmodel kick={0} />
      </group>
    </group>
  );
}

export function Arena({ onHud, paused }: { onHud: (h: Hud) => void; paused: boolean }) {
  return (
    <Canvas
      className="h-full w-full touch-none"
      shadows
      dpr={[1, 1.5]}
      camera={{ fov: 80, near: 0.08, far: 90, position: [0, 1.62, -16] }}
      gl={{ antialias: true }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <PlaySim onHud={onHud} paused={paused} />
    </Canvas>
  );
}
