// Trilho da câmera: quadros-chave por progresso interpolados por spline de Hermite.
import type { HeroLayout } from '../hero/contract';

export interface Quadro {
  pos: [number, number, number];
  alvo: [number, number, number];
  fov: number;
  sx: number; // deslocamento de lente horizontal (NDC): põe a casa no terço direito sem girar a câmera
  sy: number; // idem vertical: no celular a casa sobe para a metade de cima
  exp: number; // exposição
}

interface Chave {
  p: number;
  v: number[];
  parar: boolean;
}

type V3 = [number, number, number];
const PIVO: [number, number] = [1.5, 0];
const rad = Math.PI / 180;

export function criarTrilho(layout: HeroLayout): (p: number, q: Quadro) => void {
  const alto = layout === 'tall';
  const fd = alto ? 1.26 : 1; // no celular a câmera recua: o quadro é estreito
  const orb = (az: number, d: number, h: number): V3 => [PIVO[0] + Math.sin(az * rad) * d * fd, h * (alto ? 1.12 : 1), PIVO[1] + Math.cos(az * rad) * d * fd];
  const ks: Chave[] = [];
  const k = (p: number, pos: V3, alvo: V3, fov: number, sx: number, sy: number, exp = 1, parar = false) => {
    ks.push({ p, v: [...pos, ...alvo, fov, sx, sy, exp], parar });
  };
  // fov, sx, sy de exterior conforme o formato
  const F = (wide: number, tall: number) => (alto ? tall : wide);
  const SY = F(0.04, 0.46);

  // Abertura corresponde ao enquadramento de referência: sala de vidro e deck lateral.
  // Um único arco até a fachada; depois a câmera avança pela porta, sem voltar pelos fundos.
  k(0.0, orb(88, 25, 2.45), [2.8, 1.7, -0.5], F(33, 54), F(0.26, 0), SY, 1, true);
  k(0.12, orb(81, 25, 2.45), [2.7, 1.7, -0.4], F(33, 54), F(0.26, 0), SY);
  k(0.25, orb(55, 25, 2.35), [2.2, 1.7, -0.1], F(33, 54), F(0.24, 0), SY);
  k(0.38, orb(25, 24, 2.15), [1.4, 1.65, 0.4], F(34, 54), F(0.21, 0), SY);
  k(0.48, [1.0, 1.85, F(22, 27)], [0.3, 1.6, 1.2], F(34, 54), F(0.18, 0), F(0.04, 0.4));
  k(0.59, [0.3, 1.68, F(16, 20)], [0.3, 1.55, 1.2], F(35, 55), F(0.12, 0), F(0.03, 0.32));
  k(0.70, [0.3, 1.6, F(9, 11)], [0.3, 1.5, 1.0], F(37, 57), F(0.06, 0), F(0.02, 0.22));
  k(0.78, [0.4, 1.56, 3.8], [0.55, 1.45, -2.5], F(42, 62), 0, F(0, 0.1), 1.02);
  k(0.85, [0.65, 1.48, 0.9], [3.0, 1.35, -3.3], F(45, 66), 0, F(0, 0.1), 1.06);
  k(0.9, [1.55, 1.38, -0.5], [6.6, 1.28, -0.9], F(46, 70), 0, F(0, 0.14), 1.09);
  const fim: V3 = alto ? [2.0, 1.36, -0.75] : [2.3, 1.3, -0.8];
  const alvoFim: V3 = alto ? [8.5, 1.3, 0.75] : [8.5, 1.25, -0.15];
  k(1.0, fim, alvoFim, F(46, 72), 0, F(0, 0.14), 1.12, true);

  const n = ks.length;
  const dim = ks[0].v.length;
  // Tangentes de Catmull-Rom com nós não uniformes; zero onde a câmera deve repousar.
  const tg = ks.map((c, i) => {
    if (c.parar) return new Array<number>(dim).fill(0);
    const a = ks[Math.max(0, i - 1)];
    const b = ks[Math.min(n - 1, i + 1)];
    return c.v.map((_, j) => (b.v[j] - a.v[j]) / (b.p - a.p));
  });
  const tmp = new Array<number>(dim).fill(0);

  return (p, q) => {
    const x = Math.min(1, Math.max(0, p));
    let i = 0;
    while (i < n - 2 && x > ks[i + 1].p) i++;
    const a = ks[i];
    const b = ks[i + 1];
    const h = b.p - a.p;
    const t = (x - a.p) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    for (let j = 0; j < dim; j++) tmp[j] = h00 * a.v[j] + h10 * h * tg[i][j] + h01 * b.v[j] + h11 * h * tg[i + 1][j];
    q.pos[0] = tmp[0];
    q.pos[1] = tmp[1];
    q.pos[2] = tmp[2];
    q.alvo[0] = tmp[3];
    q.alvo[1] = tmp[4];
    q.alvo[2] = tmp[5];
    q.fov = tmp[6];
    q.sx = tmp[7];
    q.sy = tmp[8];
    q.exp = tmp[9];
  };
}
