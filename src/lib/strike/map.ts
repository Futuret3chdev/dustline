export type Block = {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  mat: "sand" | "wall" | "crate" | "metal" | "dark" | "trim";
};

/** Compact dusty arena — CS-style boxes, long, mid, two sites. */
export const BLOCKS: Block[] = [
  // perimeter
  { x: 0, y: 2.2, z: -20, w: 42, h: 4.4, d: 1.2, mat: "wall" },
  { x: 0, y: 2.2, z: 20, w: 42, h: 4.4, d: 1.2, mat: "wall" },
  { x: -21, y: 2.2, z: 0, w: 1.2, h: 4.4, d: 41, mat: "wall" },
  { x: 21, y: 2.2, z: 0, w: 1.2, h: 4.4, d: 41, mat: "wall" },

  // mid divider with a 3.4m door
  { x: -8.5, y: 2, z: 0, w: 10, h: 4, d: 1, mat: "wall" },
  { x: 8.5, y: 2, z: 0, w: 10, h: 4, d: 1, mat: "wall" },
  { x: 0, y: 3.4, z: 0, w: 7.2, h: 1.2, d: 1, mat: "trim" },

  // A site (player left / -x, T side of mid)
  { x: -14, y: 0.55, z: 10, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },
  { x: -12.2, y: 0.55, z: 8.4, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },
  { x: -13.1, y: 1.65, z: 9.2, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },
  { x: -16.4, y: 1.6, z: 13, w: 4, h: 3.2, d: 1, mat: "dark" },

  // B site
  { x: 13.5, y: 0.55, z: 9.5, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },
  { x: 15.4, y: 0.55, z: 11.2, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },
  { x: 14.4, y: 1.65, z: 10.4, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },
  { x: 16.6, y: 1.6, z: 13.5, w: 4, h: 3.2, d: 1, mat: "dark" },

  // long corridor wall
  { x: -10, y: 2, z: -10, w: 1, h: 4, d: 12, mat: "wall" },
  { x: 10, y: 2, z: -10, w: 1, h: 4, d: 12, mat: "wall" },

  // CT cover
  { x: -4, y: 0.7, z: -14, w: 3.2, h: 1.4, d: 1.2, mat: "metal" },
  { x: 4, y: 0.7, z: -14, w: 3.2, h: 1.4, d: 1.2, mat: "metal" },
  { x: 0, y: 0.55, z: -11, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },
  { x: 2.1, y: 0.55, z: -9.4, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },

  // T spawn crates
  { x: -3, y: 0.55, z: 15, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },
  { x: 3.2, y: 0.55, z: 16, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },

  // mid stack
  { x: -2.4, y: 0.55, z: 3.6, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },
  { x: 0, y: 0.55, z: 5, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },
  { x: 2.4, y: 0.55, z: 3.6, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },
  { x: 0, y: 1.65, z: 4.2, w: 2.2, h: 1.1, d: 2.2, mat: "crate" },
];

export const SPAWN_T = { x: 0, z: 16.5 };
export const SPAWN_CT = { x: 0, z: -15.2, yaw: Math.PI };

export const BOT_SPAWNS = [
  { x: -1.6, z: -7.2, yaw: Math.PI },
  { x: 2.4, z: -6.4, yaw: Math.PI },
  { x: -8, z: 6, yaw: Math.PI },
  { x: 8, z: 6, yaw: Math.PI },
  { x: 0, z: 8, yaw: Math.PI },
];

export const WAYPOINTS = [
  { x: -14, z: 10 },
  { x: 14, z: 10 },
  { x: -12, z: -8 },
  { x: 12, z: -8 },
  { x: 0, z: 4 },
  { x: 0, z: -12 },
  { x: -6, z: 14 },
  { x: 6, z: 14 },
];

const R = 0.38;

export function collideXZ(x: number, z: number, r = R) {
  let px = x;
  let pz = z;
  for (const b of BLOCKS) {
    const hx = b.w / 2 + r;
    const hz = b.d / 2 + r;
    const dx = px - b.x;
    const dz = pz - b.z;
    if (Math.abs(dx) > hx || Math.abs(dz) > hz) continue;
    const ox = hx - Math.abs(dx);
    const oz = hz - Math.abs(dz);
    if (ox < oz) px += Math.sign(dx || 1) * ox;
    else pz += Math.sign(dz || 1) * oz;
  }
  px = Math.max(-20.2, Math.min(20.2, px));
  pz = Math.max(-19.2, Math.min(19.2, pz));
  return { x: px, z: pz };
}

export function losBlocked(ax: number, az: number, bx: number, bz: number) {
  const steps = 18;
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const z = az + (bz - az) * t;
    for (const b of BLOCKS) {
      if (b.h < 1.4) continue;
      if (Math.abs(x - b.x) < b.w / 2 && Math.abs(z - b.z) < b.d / 2) return true;
    }
  }
  return false;
}

export function headshot(py: number, hitY: number) {
  return hitY > py + 1.35;
}
