// Tempos do hero. A câmera (src/hero3d) segue estes intervalos; os textos também.
export interface Beat {
  id: string;
  start: number;
  end: number;
}

export const BEATS: Beat[] = [
  { id: 'chegada', start: 0, end: 0.25 },
  { id: 'volta', start: 0.25, end: 0.53 },
  { id: 'fachada', start: 0.53, end: 0.8 },
  { id: 'dentro', start: 0.8, end: 1 },
];

export const beatIndexAt = (p: number) => {
  const i = BEATS.findIndex((b) => p < b.end);
  return i === -1 ? BEATS.length - 1 : i;
};

// Visibilidade 0..1 de um tempo, com entrada e saída suaves.
export function beatVisibility(p: number, i: number, fade = 0.045): number {
  const b = BEATS[i];
  const first = i === 0;
  const last = i === BEATS.length - 1;
  const fadeIn = first ? 1 : smooth((p - b.start) / fade);
  const fadeOut = last ? 1 : 1 - smooth((p - (b.end - fade)) / fade);
  return Math.max(0, Math.min(fadeIn, fadeOut));
}

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
