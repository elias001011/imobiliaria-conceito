import type { ProgressSource } from './contract';

export function createProgress(initial = 0): ProgressSource & { set(p: number): void } {
  let value = initial;
  const subs = new Set<(p: number) => void>();
  return {
    get: () => value,
    set(p: number) {
      if (p === value) return;
      value = p;
      subs.forEach((cb) => cb(p));
    },
    subscribe(cb) {
      subs.add(cb);
      return () => subs.delete(cb);
    },
  };
}

// ?hero=0.35 fixa o progresso (capturas e depuração).
export function forcedProgress(): number | null {
  const v = new URLSearchParams(location.search).get('hero');
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : null;
}
