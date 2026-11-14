// Percurso visual dos astros. Não modifica a iluminação, as sombras ou o ambiente da cena.
export const SOL_ORIGINAL = Object.freeze({ azimute: 70, elevacao: 9 });

export interface CicloCeleste {
  sol: [number, number, number];
  lua: [number, number, number];
  estrelas: number;
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
  const altura = vertical ? 0.7 : 1; // mantém a lua abaixo da navegação no enquadramento vertical
  // O sol se põe antes de a lua completar sua subida; voltar ao claro inverte o percurso.
  // O disco permanece no mesmo lado da luz original, inclusive no enquadramento vertical.
  direcao(SOL_ORIGINAL.azimute, SOL_ORIGINAL.elevacao - 30 * n, out.sol);
  const subida = suave(0.25, 1, n);
  direcao(-124 + 29 * subida, (-12 + 23 * subida) * altura, out.lua);
  out.estrelas = suave(0.5, 1, n);
}
