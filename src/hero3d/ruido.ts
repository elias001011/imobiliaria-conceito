// Aleatório com semente e ruído de valor (opcionalmente periódico, para texturas que repetem).
export type Rand = () => number;

export function semente(s: number): Rand {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(x: number, y: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

export function ruido(x: number, y: number, px = 0, py = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const x0 = px ? mod(xi, px) : xi;
  const x1 = px ? mod(xi + 1, px) : xi + 1;
  const y0 = py ? mod(yi, py) : yi;
  const y1 = py ? mod(yi + 1, py) : yi + 1;
  const a = hash2(x0, y0);
  const b = hash2(x1, y0);
  const c = hash2(x0, y1);
  const d = hash2(x1, y1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// Soma de oitavas, resultado em 0..1.
export function fbm(x: number, y: number, oitavas = 4, px = 0, py = 0): number {
  let s = 0;
  let amp = 0.5;
  let f = 1;
  let n = 0;
  for (let i = 0; i < oitavas; i++) {
    s += amp * ruido(x * f + i * 7, y * f + i * 13, px * f, py * f);
    n += amp;
    amp *= 0.5;
    f *= 2;
  }
  return s / n;
}

export const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const limitar = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
