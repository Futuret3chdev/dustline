export type Screen = "title" | "play" | "win" | "lose";

export type Cell = { c: number; r: number; color: number };

export type Shot = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  r: number;
  kind: "shard" | "spark" | "star";
};

export type Floater = {
  x: number;
  y: number;
  vy: number;
  color: number;
  rot: number;
  vr: number;
};

export type PopAnim = {
  x: number;
  y: number;
  color: number;
  t: number;
};

export type FloaterText = {
  x: number;
  y: number;
  text: string;
  t: number;
};

export type Layout = {
  w: number;
  h: number;
  R: number;
  originX: number;
  originY: number;
  rowH: number;
  shooterX: number;
  shooterY: number;
  dangerY: number;
  left: number;
  right: number;
};

export const COLS = 8;
export const MAX_ROWS = 12;
export const MATCH = 3;
export const DROP_EVERY = 6;

export const JEWELS = [
  { fill: "#e4455a", deep: "#8e1e32", light: "#ffb3be", ink: "#4a0d18" },
  { fill: "#f0a33a", deep: "#a85a10", light: "#ffe0a0", ink: "#5a3008" },
  { fill: "#3dcc72", deep: "#178a42", light: "#b6ffd0", ink: "#0c4a24" },
  { fill: "#3aa6f0", deep: "#155a9a", light: "#b3e4ff", ink: "#0a3258" },
  { fill: "#9b64f0", deep: "#5a28b4", light: "#dcc4ff", ink: "#2c1460" },
  { fill: "#f056b0", deep: "#a01e68", light: "#ffc1e6", ink: "#5a1040" },
] as const;
