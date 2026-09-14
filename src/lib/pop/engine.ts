import { COLS, DROP_EVERY, MATCH, MAX_ROWS, type Cell } from "./types";

export function colsInRow(r: number) {
  return r & 1 ? COLS - 1 : COLS;
}

export function inBounds(c: number, r: number) {
  return r >= 0 && r < MAX_ROWS && c >= 0 && c < colsInRow(r);
}

export function neighbors(c: number, r: number): [number, number][] {
  const odd = r & 1;
  const raw: [number, number][] = odd
    ? [
        [c - 1, r],
        [c + 1, r],
        [c, r - 1],
        [c + 1, r - 1],
        [c, r + 1],
        [c + 1, r + 1],
      ]
    : [
        [c - 1, r],
        [c + 1, r],
        [c - 1, r - 1],
        [c, r - 1],
        [c - 1, r + 1],
        [c, r + 1],
      ];
  return raw.filter(([cc, rr]) => inBounds(cc, rr));
}

export function makeGrid(): number[][] {
  return Array.from({ length: MAX_ROWS }, (_, r) => Array(colsInRow(r)).fill(0));
}

export function occupied(grid: number[][]): Cell[] {
  const out: Cell[] = [];
  for (let r = 0; r < grid.length; r += 1) {
    const row = grid[r]!;
    for (let c = 0; c < row.length; c += 1) {
      const color = row[c]!;
      if (color) out.push({ c, r, color });
    }
  }
  return out;
}

export function remainingColors(grid: number[][]): number[] {
  const set = new Set<number>();
  for (const cell of occupied(grid)) set.add(cell.color);
  return [...set];
}

export function pickColor(grid: number[][], palette: number): number {
  const live = remainingColors(grid);
  const pool = live.length ? live : Array.from({ length: palette }, (_, i) => i + 1);
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function flood(grid: number[][], c: number, r: number): Cell[] {
  const color = grid[r]?.[c] ?? 0;
  if (!color) return [];
  const seen = new Set<string>([`${c},${r}`]);
  const stack: [number, number][] = [[c, r]];
  const group: Cell[] = [{ c, r, color }];
  while (stack.length) {
    const [cc, rr] = stack.pop()!;
    for (const [nc, nr] of neighbors(cc, rr)) {
      const k = `${nc},${nr}`;
      if (seen.has(k)) continue;
      if (grid[nr]![nc] !== color) continue;
      seen.add(k);
      stack.push([nc, nr]);
      group.push({ c: nc, r: nr, color });
    }
  }
  return group;
}

export function connectedToCeiling(grid: number[][]): Set<string> {
  const seen = new Set<string>();
  const stack: [number, number][] = [];
  const top = grid[0] ?? [];
  for (let c = 0; c < top.length; c += 1) {
    if (top[c]) {
      seen.add(`${c},0`);
      stack.push([c, 0]);
    }
  }
  while (stack.length) {
    const [cc, rr] = stack.pop()!;
    for (const [nc, nr] of neighbors(cc, rr)) {
      const k = `${nc},${nr}`;
      if (seen.has(k) || !grid[nr]![nc]) continue;
      seen.add(k);
      stack.push([nc, nr]);
    }
  }
  return seen;
}

export function place(grid: number[][], c: number, r: number, color: number) {
  if (!inBounds(c, r)) return;
  grid[r]![c] = color;
}

export type Resolve = {
  popped: Cell[];
  fell: Cell[];
  chain: number;
  cleared: boolean;
  placed: Cell;
};

export function resolve(grid: number[][], c: number, r: number, color: number): Resolve {
  place(grid, c, r, color);
  const group = flood(grid, c, r);
  const popped: Cell[] = [];
  if (group.length >= MATCH) {
    for (const cell of group) {
      grid[cell.r]![cell.c] = 0;
      popped.push(cell);
    }
  }
  const hanging: Cell[] = [];
  if (popped.length) {
    const held = connectedToCeiling(grid);
    for (const cell of occupied(grid)) {
      if (!held.has(`${cell.c},${cell.r}`)) {
        grid[cell.r]![cell.c] = 0;
        hanging.push(cell);
      }
    }
  }
  return {
    popped,
    fell: hanging,
    chain: popped.length ? 1 : 0,
    cleared: occupied(grid).length === 0,
    placed: { c, r, color },
  };
}

export function dropCeiling(grid: number[][]): { overflow: boolean } {
  const next = makeGrid();
  let overflow = false;
  for (const cell of occupied(grid)) {
    const nr = cell.r + 1;
    if (nr >= MAX_ROWS) {
      overflow = true;
      continue;
    }
    const nc = Math.min(cell.c, colsInRow(nr) - 1);
    if (!next[nr]![nc]) next[nr]![nc] = cell.color;
    else next[nr]![Math.max(0, nc - 1)] = cell.color;
  }
  for (let r = 0; r < MAX_ROWS; r += 1) {
    grid[r] = next[r]!;
  }
  return { overflow };
}

export function fillTopRow(grid: number[][], palette: number) {
  const row = grid[0]!;
  for (let c = 0; c < row.length; c += 1) {
    row[c] = 1 + Math.floor(Math.random() * palette);
  }
  for (let c = 0; c < row.length; c += 1) {
    const g = flood(grid, c, 0);
    if (g.length >= MATCH) {
      const avoid = row[c]!;
      const pick = 1 + ((avoid + c) % palette);
      row[c] = pick === avoid ? 1 + ((pick + 1) % palette) : pick;
    }
  }
}

export function buildLevel(level: number): { grid: number[][]; palette: number } {
  const palette = level < 3 ? 4 : level < 6 ? 5 : 6;
  const rows = Math.min(4 + Math.floor((level - 1) / 2), 7);
  const grid = makeGrid();
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < colsInRow(r); c += 1) {
      let color = 1 + Math.floor(Math.random() * palette);
      grid[r]![c] = color;
      const g = flood(grid, c, r);
      if (g.length >= MATCH) {
        color = 1 + (color % palette);
        grid[r]![c] = color;
      }
    }
  }
  return { grid, palette };
}

export function snapCell(
  grid: number[][],
  x: number,
  y: number,
  hit: Cell | null,
  centerOf: (c: number, r: number) => [number, number],
): { c: number; r: number } | null {
  const candidates: [number, number][] = [];
  if (hit) {
    for (const n of neighbors(hit.c, hit.r)) {
      if (!grid[n[1]]![n[0]]) candidates.push(n);
    }
  } else {
    for (let c = 0; c < colsInRow(0); c += 1) {
      if (!grid[0]![c]) candidates.push([c, 0]);
    }
  }
  if (!candidates.length) {
    for (let r = 0; r < MAX_ROWS; r += 1) {
      for (let c = 0; c < colsInRow(r); c += 1) {
        if (!grid[r]![c]) candidates.push([c, r]);
      }
    }
  }
  let best: { c: number; r: number; d: number } | null = null;
  for (const [c, r] of candidates) {
    const [cx, cy] = centerOf(c, r);
    const d = (cx - x) ** 2 + (cy - y) ** 2;
    if (!best || d < best.d) best = { c, r, d };
  }
  return best ? { c: best.c, r: best.r } : null;
}

export function scorePop(popped: number, fell: number, chain: number) {
  const pop = popped * 10 + Math.max(0, popped - MATCH) * 15;
  const drop = fell * 50;
  const mult = 1 + Math.max(0, chain - 1);
  return (pop + drop) * mult;
}

export function shotsUntilDrop(level: number) {
  return Math.max(4, DROP_EVERY - Math.floor((level - 1) / 3));
}
