import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  buildLevel,
  occupied,
  pickColor,
  remainingColors,
  resolve,
  dropCeiling,
  fillTopRow,
  snapCell,
  scorePop,
  shotsUntilDrop,
  inBounds,
} from "@/lib/pop/engine";
import {
  sfxBounce,
  sfxDrop,
  sfxLose,
  sfxPop,
  sfxShoot,
  sfxWin,
  unlockAudio,
} from "@/lib/pop/audio";
import {
  cellCenter,
  drawAim,
  drawBubble,
  drawLauncher,
  drawParticles,
  drawPlayfield,
  jewel,
  layoutFor,
} from "@/lib/pop/draw";
import type { Floater, FloaterText, Layout, Particle, PopAnim, Shot } from "@/lib/pop/types";

export type HudSnap = {
  screen: "play" | "win" | "lose";
  score: number;
  level: number;
  chain: number;
  drops: number;
};

type Sim = {
  grid: number[][];
  palette: number;
  current: number;
  next: number;
  angle: number;
  shot: Shot | null;
  particles: Particle[];
  pop: PopAnim[];
  fall: Floater[];
  floats: FloaterText[];
  score: number;
  level: number;
  shots: number;
  dropIn: number;
  chain: number;
  trauma: number;
  freeze: number;
  screen: "play" | "win" | "lose";
  t: number;
  ready: boolean;
};

function burst(sim: Sim, x: number, y: number, color: number, n: number) {
  const j = jewel(color);
  for (let i = 0; i < n; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 220;
    sim.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 40,
      life: 0.35 + Math.random() * 0.4,
      max: 0.7,
      color: i % 3 ? j.fill : j.light,
      r: 2 + Math.random() * 4,
      kind: i % 5 === 0 ? "star" : i % 2 ? "spark" : "shard",
    });
    if (sim.particles.length > 220) sim.particles.shift();
  }
}

function startLevel(sim: Sim, level: number, keepScore: boolean) {
  const built = buildLevel(level);
  sim.grid = built.grid;
  sim.palette = built.palette;
  sim.current = pickColor(sim.grid, sim.palette);
  sim.next = pickColor(sim.grid, sim.palette);
  sim.shot = null;
  sim.pop = [];
  sim.fall = [];
  sim.level = level;
  sim.shots = 0;
  sim.dropIn = shotsUntilDrop(level);
  sim.chain = 0;
  sim.screen = "play";
  sim.ready = true;
  if (!keepScore) sim.score = 0;
}

export type PlayHandle = {
  nextLevel: () => void;
  retry: () => void;
};

export const Playfield = forwardRef<PlayHandle, { onHud: (s: HudSnap) => void; paused: boolean }>(
  function Playfield({ onHud, paused }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim | null>(null);
  const hudRef = useRef(onHud);
  hudRef.current = onHud;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const bgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = "/pop/cabinet.jpg";
    img.crossOrigin = "anonymous";
    bgRef.current = img;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sim: Sim = {
      grid: [],
      palette: 4,
      current: 1,
      next: 2,
      angle: 0,
      shot: null,
      particles: [],
      pop: [],
      fall: [],
      floats: [],
      score: 0,
      level: 1,
      shots: 0,
      dropIn: shotsUntilDrop(1),
      chain: 0,
      trauma: 0,
      freeze: 0,
      screen: "play",
      t: 0,
      ready: false,
    };
    startLevel(sim, 1, false);
    simRef.current = sim;

    let L: Layout = layoutFor(390, 640);
    let last = performance.now();
    let raf = 0;
    let running = true;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      L = layoutFor(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const centerOf = (c: number, r: number) => cellCenter(c, r, L);

    const fire = () => {
      if (pausedRef.current || sim.screen !== "play" || sim.shot || !sim.ready) return;
      const a = sim.angle;
      const speed = L.R * 18;
      sim.shot = {
        x: L.shooterX,
        y: L.shooterY - L.R * 0.05,
        vx: Math.sin(a) * speed,
        vy: -Math.cos(a) * speed,
        color: sim.current,
      };
      sfxShoot();
    };

    const aimFrom = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const dx = x - L.shooterX;
      const dy = y - L.shooterY;
      let a = Math.atan2(dx, -dy);
      const cap = 1.22;
      sim.angle = Math.max(-cap, Math.min(cap, a));
    };

    const onPointerMove = (e: PointerEvent) => {
      aimFrom(e.clientX, e.clientY);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      aimFrom(e.clientX, e.clientY);
      fire();
    };
    const keys = new Set<string>();
    const onKey = (e: KeyboardEvent) => {
      keys.add(e.key);
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        fire();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key);

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);

    const land = (x: number, y: number, color: number, hit: { c: number; r: number; color: number } | null) => {
      const snap = snapCell(sim.grid, x, y, hit, centerOf);
      sim.shot = null;
      if (!snap || !inBounds(snap.c, snap.r)) {
        sim.screen = "lose";
        sfxLose();
        hudRef.current({ screen: "lose", score: sim.score, level: sim.level, chain: 0, drops: sim.dropIn });
        return;
      }
      const res = resolve(sim.grid, snap.c, snap.r, color);
      const [px, py] = centerOf(res.placed.c, res.placed.r);
      if (py + L.R > L.dangerY) {
        sim.screen = "lose";
        sfxLose();
        hudRef.current({ screen: "lose", score: sim.score, level: sim.level, chain: 0, drops: sim.dropIn });
        return;
      }
      if (res.popped.length) {
        sim.chain += 1;
        const gain = scorePop(res.popped.length, res.fell.length, sim.chain);
        sim.score += gain;
        sim.freeze = 0.05;
        sim.trauma = Math.min(1, sim.trauma + 0.28 + res.fell.length * 0.05);
        sfxPop(res.popped.length);
        for (const cell of res.popped) {
          const [cx, cy] = centerOf(cell.c, cell.r);
          sim.pop.push({ x: cx, y: cy, color: cell.color, t: 0 });
          burst(sim, cx, cy, cell.color, 10);
        }
        for (const cell of res.fell) {
          const [cx, cy] = centerOf(cell.c, cell.r);
          sim.fall.push({
            x: cx,
            y: cy,
            vy: 40,
            color: cell.color,
            rot: 0,
            vr: (Math.random() - 0.5) * 6,
          });
          burst(sim, cx, cy, cell.color, 6);
        }
        sim.floats.push({ x: px, y: py - L.R, text: `+${gain}`, t: 0 });
        if (sim.chain > 1) sim.floats.push({ x: px + 20, y: py - L.R * 1.6, text: `x${sim.chain}`, t: 0 });
      } else {
        sim.chain = 0;
      }
      sim.shots += 1;
      sim.dropIn -= 1;
      if (res.cleared) {
        sim.screen = "win";
        sfxWin();
        hudRef.current({ screen: "win", score: sim.score, level: sim.level, chain: sim.chain, drops: sim.dropIn });
        return;
      }
      const live = remainingColors(sim.grid);
      sim.current = sim.next;
      if (live.length && !live.includes(sim.current)) sim.current = live[0]!;
      sim.next = pickColor(sim.grid, sim.palette);
      if (sim.dropIn <= 0) {
        const d = dropCeiling(sim.grid);
        fillTopRow(sim.grid, sim.palette);
        sim.dropIn = shotsUntilDrop(sim.level);
        sfxDrop();
        sim.trauma = Math.min(1, sim.trauma + 0.4);
        if (d.overflow) {
          sim.screen = "lose";
          sfxLose();
        }
        for (const cell of occupied(sim.grid)) {
          const [, cy] = centerOf(cell.c, cell.r);
          if (cy + L.R > L.dangerY) {
            sim.screen = "lose";
            sfxLose();
          }
        }
      }
      hudRef.current({
        screen: sim.screen,
        score: sim.score,
        level: sim.level,
        chain: sim.chain,
        drops: sim.dropIn,
      });
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      sim.t += dt;

      if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) sim.angle = Math.max(-1.22, sim.angle - 1.8 * dt);
      if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) sim.angle = Math.min(1.22, sim.angle + 1.8 * dt);

      const reduce =
        typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!pausedRef.current && sim.screen === "play") {
        if (sim.freeze > 0) sim.freeze -= dt;
        else {
          if (sim.shot) {
            const step = L.R * 0.35;
            let remain = Math.hypot(sim.shot.vx, sim.shot.vy) * dt;
            while (remain > 0 && sim.shot) {
              const s = Math.min(step, remain);
              const sp = Math.hypot(sim.shot.vx, sim.shot.vy) || 1;
              sim.shot.x += (sim.shot.vx / sp) * s;
              sim.shot.y += (sim.shot.vy / sp) * s;
              remain -= s;
              if (sim.shot.x < L.left + L.R) {
                sim.shot.x = L.left + L.R;
                sim.shot.vx *= -1;
                sfxBounce();
              } else if (sim.shot.x > L.right - L.R) {
                sim.shot.x = L.right - L.R;
                sim.shot.vx *= -1;
                sfxBounce();
              }
              if (sim.shot.y <= L.originY + L.R) {
                land(sim.shot.x, sim.shot.y, sim.shot.color, null);
                break;
              }
              let hit: { c: number; r: number; color: number } | null = null;
              let best = (L.R * 1.92) ** 2;
              for (const cell of occupied(sim.grid)) {
                const [cx, cy] = centerOf(cell.c, cell.r);
                const d = (cx - sim.shot.x) ** 2 + (cy - sim.shot.y) ** 2;
                if (d < best) {
                  best = d;
                  hit = cell;
                }
              }
              if (hit) {
                land(sim.shot.x, sim.shot.y, sim.shot.color, hit);
                break;
              }
            }
          }
        }

        for (const p of sim.particles) {
          p.life -= dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 420 * dt;
        }
        sim.particles = sim.particles.filter((p) => p.life > 0);
        for (const p of sim.pop) p.t += dt * 3.2;
        sim.pop = sim.pop.filter((p) => p.t < 1);
        for (const f of sim.fall) {
          f.vy += 900 * dt;
          f.y += f.vy * dt;
          f.rot += f.vr * dt;
        }
        sim.fall = sim.fall.filter((f) => f.y < L.h + 40);
        for (const f of sim.floats) f.t += dt;
        sim.floats = sim.floats.filter((f) => f.t < 0.9);
        sim.trauma = Math.max(0, sim.trauma - dt * 1.8);
      }

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const bg = bgRef.current;
      if (bg && bg.complete && bg.naturalWidth) {
        const scale = Math.max(w / bg.naturalWidth, h / bg.naturalHeight);
        const bw = bg.naturalWidth * scale;
        const bh = bg.naturalHeight * scale;
        ctx.drawImage(bg, (w - bw) / 2, (h - bh) / 2, bw, bh);
        ctx.fillStyle = "rgba(8,12,24,0.28)";
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = "#0a1020";
        ctx.fillRect(0, 0, w, h);
      }

      const shake = reduce ? 0 : sim.trauma * sim.trauma;
      const sx = shake ? (Math.random() - 0.5) * 14 * shake : 0;
      const sy = shake ? (Math.random() - 0.5) * 10 * shake : 0;
      ctx.save();
      ctx.translate(sx, sy);

      const cells = occupied(sim.grid);
      const low = cells.some((cell) => {
        const [, cy] = centerOf(cell.c, cell.r);
        return cy + L.R * 2.2 > L.dangerY;
      });
      drawPlayfield(ctx, L, low, sim.t);

      for (const cell of cells) {
        const [cx, cy] = centerOf(cell.c, cell.r);
        drawBubble(ctx, cx, cy, L.R * 0.96, cell.color, {
          t: sim.t,
          id: cell.c * 13 + cell.r,
          lookX: Math.sin(sim.angle),
          lookY: -0.2,
        });
      }
      for (const p of sim.pop) {
        const s = 1 + p.t * 0.45;
        ctx.globalAlpha = 1 - p.t;
        drawBubble(ctx, p.x, p.y, L.R * 0.96 * s, p.color, { t: sim.t, squash: 1 + p.t * 0.4 });
        ctx.globalAlpha = 1;
      }
      for (const f of sim.fall) {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        drawBubble(ctx, 0, 0, L.R * 0.9, f.color, { t: sim.t, squash: 1.08 });
        ctx.restore();
      }

      if (sim.screen === "play") drawAim(ctx, L, sim.angle, sim.grid, centerOf);
      if (sim.shot) {
        drawBubble(ctx, sim.shot.x, sim.shot.y, L.R * 0.94, sim.shot.color, {
          t: sim.t,
          glow: true,
          lookX: sim.shot.vx,
          lookY: sim.shot.vy,
        });
      }
      drawLauncher(ctx, L, sim.angle, sim.current, sim.next, sim.t);
      drawParticles(ctx, sim.particles);

      ctx.font = `700 ${Math.max(16, L.R * 0.55)}px Fredoka, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#f4efe4";
      for (const f of sim.floats) {
        ctx.globalAlpha = 1 - f.t / 0.9;
        ctx.fillText(f.text, f.x, f.y - f.t * 36);
        ctx.globalAlpha = 1;
      }

      ctx.restore();
      raf = requestAnimationFrame(tick);
    };

    const commands = {
      nextLevel: () => {
        startLevel(sim, sim.level + 1, true);
        hudRef.current({ screen: "play", score: sim.score, level: sim.level, chain: 0, drops: sim.dropIn });
      },
      retry: () => {
        startLevel(sim, 1, false);
        hudRef.current({ screen: "play", score: 0, level: 1, chain: 0, drops: sim.dropIn });
      },
    };
    // bind after commands exist — assigned below via ref object
    (sim as Sim & { commands: typeof commands }).commands = commands;

    raf = requestAnimationFrame(tick);
    hudRef.current({ screen: "play", score: 0, level: 1, chain: 0, drops: sim.dropIn });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    nextLevel: () => (simRef.current as Sim & { commands?: PlayHandle })?.commands?.nextLevel(),
    retry: () => (simRef.current as Sim & { commands?: PlayHandle })?.commands?.retry(),
  }));

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full touch-none"
      onPointerDown={() => unlockAudio()}
    />
  );
});

Playfield.displayName = "Playfield";
