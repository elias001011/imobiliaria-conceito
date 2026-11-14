// Um único ciclo reversível sincroniza os astros, o céu e as luzes.
export interface CicloCeleste {
  sol: [number, number, number];
  lua: [number, number, number];
  luzSol: number;
  luzLua: number;
  estrelas: number;
  crepusculo: number;
}
const suave = (inicio: number, fim: number, n: number) => {
  const t = Math.max(0, Math.min(1, (n - inicio) / (fim - inicio)));
  return t * t * (3 - 2 * t);
};
const direcao = (az: number, el: number, out: [number, number, number]) => {
  const a = az * Math.PI / 180;
  const e = el * Math.PI / 180;
  out[0] = Math.sin(a) * Math.cos(e);
  out[1] = Math.sin(e);
  out[2] = Math.cos(a) * Math.cos(e);
};
export function cicloCeleste(noite: number, out: CicloCeleste, vertical = false): void {
  const n = Math.max(0, Math.min(1, noite));
  const altura = vertical ? 0.4 : 1; // mantém os astros abaixo da navegação no enquadramento vertical
  // O sol se põe antes de a lua completar sua subida; voltar ao claro inverte o percurso.
  direcao(-100 - 22 * n, (11 - 32 * n) * altura, out.sol);
  const subida = suave(0.25, 1, n);
  direcao(-124 + 29 * subida, (-12 + 23 * subida) * altura, out.lua);
  out.luzSol = 1 - suave(0.12, 0.62, n);
  out.luzLua = suave(0.48, 1, n);
  out.estrelas = suave(0.5, 1, n);
  out.crepusculo = Math.sin(n * Math.PI) ** 2;
}
