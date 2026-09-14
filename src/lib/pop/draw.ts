import { JEWELS, type Layout, type Particle } from "./types";

const TAU = Math.PI * 2;

export function jewel(color: number) {
  return JEWELS[(color - 1 + JEWELS.length) % JEWELS.length]!;
}

export function cellCenter(c: number, r: number, L: Layout): [number, number] {
  const odd = r & 1;
  const x = L.originX + L.R + c * L.R * 2 + (odd ? L.R : 0);
  const y = L.originY + L.R + r * L.rowH;
  return [x, y];
}

export function layoutFor(w: number, h: number): Layout {
  const padX = 18;
  const top = 10;
  const bottom = 78;
  const playW = Math.min(430, Math.max(160, w - padX * 2));
  const playH = Math.max(220, h - top - bottom);
  let R = playW / 16.4;
  const rowH = R * Math.sqrt(3);
  const need = 11 * rowH + R * 2.2;
  if (need > playH * 0.78) R *= (playH * 0.78) / need;
  const rowH2 = R * Math.sqrt(3);
  const fieldW = 16 * R;
  const originX = (w - fieldW) / 2;
  const originY = top + 8;
  const shooterX = w / 2;
  const shooterY = h - bottom + R * 0.15;
  return {
    w,
    h,
    R,
    originX,
    originY,
    rowH: rowH2,
    shooterX,
    shooterY,
    dangerY: shooterY - R * 2.35,
    left: originX,
    right: originX + fieldW,
  };
}

export function drawPlayfield(ctx: CanvasRenderingContext2D, L: Layout, warn: boolean, t: number) {
  const { originX, originY, R, rowH, left, right, dangerY } = L;
  const fieldW = right - left;
  const fieldH = dangerY - originY + R;
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, originX - 6, originY - 8, fieldW + 12, fieldH + 10, 18);
  ctx.fillStyle = "rgba(6, 10, 22, 0.55)";
  ctx.fill();
  ctx.strokeStyle = "rgba(240, 199, 94, 0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  roundRect(ctx, originX - 2, originY - 4, fieldW + 4, 8, 4);
  ctx.fillStyle = "rgba(240, 199, 94, 0.55)";
  ctx.fill();

  ctx.setLineDash([6, 10]);
  ctx.strokeStyle = warn ? `rgba(228, 69, 90, ${0.45 + Math.sin(t * 8) * 0.25})` : "rgba(244, 239, 228, 0.14)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(left + 8, dangerY);
  ctx.lineTo(right - 8, dangerY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  void rowH;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: number,
  opts: { t: number; id?: number; lookX?: number; lookY?: number; squash?: number; glow?: boolean } = { t: 0 },
) {
  const j = jewel(color);
  const squash = opts.squash ?? 1;
  const id = opts.id ?? color;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 / squash, squash);

  if (opts.glow) {
    const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.45);
    g.addColorStop(0, `${j.light}00`);
    g.addColorStop(0.55, `${j.fill}55`);
    g.addColorStop(1, `${j.fill}00`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.45, 0, TAU);
    ctx.fill();
  }

  const body = ctx.createRadialGradient(-r * 0.32, -r * 0.38, r * 0.08, 0, r * 0.1, r);
  body.addColorStop(0, j.light);
  body.addColorStop(0.38, j.fill);
  body.addColorStop(1, j.deep);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.28, -r * 0.34, r * 0.22, r * 0.13, -0.55, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.08, -r * 0.46, r * 0.055, 0, TAU);
  ctx.fill();

  const blinkCycle = (opts.t * 0.9 + id * 1.7) % 3.1;
  const blink = blinkCycle < 0.09 || (blinkCycle > 0.16 && blinkCycle < 0.22 && id % 2 === 0);
  const lx = Math.max(-1, Math.min(1, opts.lookX ?? 0)) * r * 0.08;
  const ly = Math.max(-1, Math.min(1, opts.lookY ?? 0)) * r * 0.08;
  if (blink) {
    ctx.strokeStyle = j.ink;
    ctx.lineWidth = Math.max(1.2, r * 0.07);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-r * 0.28, -r * 0.04);
    ctx.lineTo(-r * 0.08, -r * 0.04);
    ctx.moveTo(r * 0.08, -r * 0.04);
    ctx.lineTo(r * 0.28, -r * 0.04);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#f7f3ea";
    ctx.beginPath();
    ctx.ellipse(-r * 0.18, -r * 0.06, r * 0.13, r * 0.16, 0, 0, TAU);
    ctx.ellipse(r * 0.18, -r * 0.06, r * 0.13, r * 0.16, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = j.ink;
    ctx.beginPath();
    ctx.arc(-r * 0.18 + lx, -r * 0.04 + ly, r * 0.07, 0, TAU);
    ctx.arc(r * 0.18 + lx, -r * 0.04 + ly, r * 0.07, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(-r * 0.21 + lx, -r * 0.08 + ly, r * 0.025, 0, TAU);
    ctx.arc(r * 0.15 + lx, -r * 0.08 + ly, r * 0.025, 0, TAU);
    ctx.fill();
  }

  ctx.strokeStyle = j.ink;
  ctx.lineWidth = Math.max(1.2, r * 0.07);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, r * 0.12, r * 0.22, 0.25, Math.PI - 0.25);
  ctx.stroke();

  ctx.restore();
}

export function drawLauncher(ctx: CanvasRenderingContext2D, L: Layout, angle: number, color: number, next: number, t: number) {
  const { shooterX: x, shooterY: y, R } = L;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(20, 28, 48, 0.95)";
  ctx.beginPath();
  roundRect(ctx, -R * 1.55, -R * 0.35, R * 3.1, R * 1.7, R * 0.4);
  ctx.fill();
  ctx.strokeStyle = "rgba(240, 199, 94, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(240, 199, 94, 0.85)";
  ctx.beginPath();
  ctx.moveTo(0, -R * 2.15);
  ctx.lineTo(-R * 0.22, -R * 0.2);
  ctx.lineTo(R * 0.22, -R * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  drawBubble(ctx, 0, -R * 0.05, R * 0.92, color, { t, glow: true, lookX: Math.sin(angle), lookY: -0.4 });
  ctx.restore();

  drawBubble(ctx, x + R * 2.35, y + R * 0.15, R * 0.55, next, { t, id: 9 });
  ctx.fillStyle = "rgba(244,239,228,0.55)";
  ctx.font = `600 ${Math.max(10, R * 0.32)}px Nunito, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("NEXT", x + R * 2.35, y + R * 1.05);
}

export function drawAim(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  angle: number,
  grid: number[][],
  centerOf: (c: number, r: number) => [number, number],
) {
  const speed = 1;
  let x = L.shooterX;
  let y = L.shooterY - L.R * 0.05;
  let vx = Math.sin(angle) * speed;
  let vy = -Math.cos(angle) * speed;
  ctx.save();
  ctx.fillStyle = "rgba(244,239,228,0.55)";
  for (let i = 0; i < 42; i += 1) {
    x += vx * L.R * 0.55;
    y += vy * L.R * 0.55;
    if (x < L.left + L.R || x > L.right - L.R) vx *= -1;
    x = Math.max(L.left + L.R, Math.min(L.right - L.R, x));
    if (y < L.originY + L.R * 0.4) break;
    let hit = false;
    for (let r = 0; r < grid.length && !hit; r += 1) {
      for (let c = 0; c < grid[r]!.length; c += 1) {
        if (!grid[r]![c]) continue;
        const [cx, cy] = centerOf(c, r);
        if ((cx - x) ** 2 + (cy - y) ** 2 < (L.R * 2) ** 2) hit = true;
      }
    }
    if (hit) break;
    if (i % 2 === 0) {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.4, L.R * 0.08), 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const a = Math.max(0, p.life / p.max);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    if (p.kind === "star") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life);
      ctx.moveTo(p.r, 0);
      for (let i = 1; i < 5; i += 1) {
        const ang = (i * TAU) / 5;
        ctx.lineTo(Math.cos(ang) * p.r, Math.sin(ang) * p.r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
