// Casa térrea: bloco branco dos quartos + laje de concreto sobre a sala envidraçada. Metros; frente em +Z, deck em +X.
import * as THREE from 'three';
import { Lote, M } from './geo';
import type { Materiais } from './materiais';

export const PISO = 0.2; // nível do piso acabado
const E = 0.22; // espessura das paredes externas
// Bloco branco
const AX0 = -7.6;
const AX1 = -0.9;
const AZ0 = -4.2;
const AZ1 = 3.4;
const ATOPO = 3.62;
// Laje de cobertura
const LX0 = -0.9;
const LX1 = 11.4;
const LZ0 = -4.4;
const LZ1 = 5.0;
export const LY0 = 3.2;
const LY1 = 3.46;
// Eixo da porta de entrada
// eixo = dobradiça, na face interna do montante esquerdo (x -0.35): a folha fechada ocupa o vão de -0.345 a 0.945.
export const PORTA = { x: 0.3, z: 1.27, eixo: -0.345, altura: 2.76 };

type Eixo = 'x' | 'z';
interface Vao {
  a0: number;
  a1: number;
  y0: number;
  y1: number;
}

// Parede em um plano (eixo 'z' = perpendicular a Z, correndo em X), recortada pelos vãos.
function parede(L: Lote, mat: THREE.Material, eixo: Eixo, c0: number, c1: number, a0: number, a1: number, y0: number, y1: number, vaos: Vao[] = []) {
  const B = (p0: number, p1: number, q0: number, q1: number) => {
    if (p1 - p0 < 1e-4 || q1 - q0 < 1e-4) return;
    if (eixo === 'z') L.bloco(mat, p0, p1, q0, q1, c0, c1);
    else L.bloco(mat, c0, c1, q0, q1, p0, p1);
  };
  let a = a0;
  for (const v of [...vaos].sort((p, q) => p.a0 - q.a0)) {
    B(a, v.a0, y0, y1);
    B(v.a0, v.a1, y0, v.y0);
    B(v.a0, v.a1, v.y1, y1);
    a = v.a1;
  }
  B(a, a1, y0, y1);
}

// Caixa orientada pelo eixo do plano: (a = ao longo, c = através).
function peca(L: Lote, mat: THREE.Material, eixo: Eixo, c0: number, c1: number, a0: number, a1: number, y0: number, y1: number) {
  if (eixo === 'z') L.bloco(mat, a0, a1, y0, y1, c0, c1);
  else L.bloco(mat, c0, c1, y0, y1, a0, a1);
}

function vidro(L: Lote, m: Materiais, eixo: Eixo, c: number, a0: number, a1: number, y0: number, y1: number, mat: THREE.Material = m.vidro) {
  const g = new THREE.PlaneGeometry(a1 - a0, y1 - y0);
  const mid = (a0 + a1) / 2;
  if (eixo === 'z') L.add(mat, g, M(mid, (y0 + y1) / 2, c), { manter: true });
  else L.add(mat, g, M(c, (y0 + y1) / 2, mid, Math.PI / 2), { manter: true });
}

// Esquadria de alumínio escuro com n folhas e um pano de vidro.
function esquadria(L: Lote, m: Materiais, eixo: Eixo, c: number, a0: number, a1: number, y0: number, y1: number, n: number, perfil = 0.055, prof = 0.1) {
  const c0 = c - prof / 2;
  const c1 = c + prof / 2;
  peca(L, m.metal, eixo, c0, c1, a0, a1, y0, y0 + perfil * 0.8);
  peca(L, m.metal, eixo, c0, c1, a0, a1, y1 - perfil, y1);
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0 - perfil) * i) / n;
    const w = i === 0 || i === n ? perfil : perfil * 1.25;
    const d = i === 0 || i === n ? 0 : (perfil - w) / 2;
    peca(L, m.metal, eixo, c0 + 0.012, c1 - 0.012, a + d, a + d + w, y0 + perfil * 0.8, y1 - perfil);
  }
  vidro(L, m, eixo, c, a0 + perfil, a1 - perfil, y0 + perfil * 0.8, y1 - perfil);
}

// Janela dos quartos: esquadria recuada, peitoril de pedra e cortina iluminada por dentro.
function janela(L: Lote, m: Materiais, eixo: Eixo, fora: number, sentido: 1 | -1, v: Vao, folhas: number, luz: THREE.Material) {
  const c = fora - sentido * 0.13;
  esquadria(L, m, eixo, c, v.a0, v.a1, v.y0, v.y1, folhas, 0.045, 0.07);
  const dentro = fora - sentido * (E + 0.03);
  vidro(L, m, eixo, dentro, v.a0 - 0.3, v.a1 + 0.3, v.y0 - 0.3, v.y1 + 0.3, luz);
  const p0 = fora - sentido * 0.2;
  const p1 = fora + sentido * 0.035;
  peca(L, m.pedra, eixo, Math.min(p0, p1), Math.max(p0, p1), v.a0 - 0.04, v.a1 + 0.04, v.y0 - 0.05, v.y0);
}

// Ripado vertical de madeira sobre fundo escuro. `face` é o plano da parede; as ripas saem no `sentido`.
function ripado(L: Lote, m: Materiais, eixo: Eixo, face: number, sentido: 1 | -1, a0: number, a1: number, y0: number, y1: number) {
  const f1 = face + sentido * 0.02;
  const f2 = face + sentido * 0.052;
  peca(L, m.escuro, eixo, Math.min(face, f1), Math.max(face, f1), a0, a1, y0, y1);
  const passo = 0.078;
  const larg = 0.036;
  const n = Math.floor((a1 - a0 - larg) / passo);
  const folga = (a1 - a0 - (n * passo + larg)) / 2;
  for (let i = 0; i <= n; i++) {
    const a = a0 + folga + i * passo;
    if (eixo === 'z') L.bloco(m.madeira, a, a + larg, y0, y1, Math.min(f1, f2), Math.max(f1, f2), { giro: true });
    else L.bloco(m.madeira, Math.min(f1, f2), Math.max(f1, f2), y0, y1, a, a + larg, { giro: true });
  }
}

export interface Casa {
  grupo: THREE.Group;
  porta: THREE.Group;
}

export function criarCasa(m: Materiais): Casa {
  const L = new Lote();
  const V = L; // o lote já separa por material; V só marca o que é vidro ou luz

  // ---------- Bloco branco (quartos) ----------
  L.bloco(m.escuro, AX0 + 0.05, AX1, 0, 0.13, AZ0 + 0.05, AZ1 - 0.05);
  const W1: Vao = { a0: -6.5, a1: -3.5, y0: 1.1, y1: 2.5 };
  const W2: Vao = { a0: 0.5, a1: 2.3, y0: 1.1, y1: 2.5 };
  const W3: Vao = { a0: -1.5, a1: -0.8, y0: 1.9, y1: 2.5 };
  const W4: Vao = { a0: -3.5, a1: -1.9, y0: 1.1, y1: 2.5 };
  const W5: Vao = { a0: -6.3, a1: -4.3, y0: 1.1, y1: 2.5 };
  parede(L, m.reboco, 'z', AZ1 - E, AZ1, AX0, AX1, 0.12, ATOPO, [W1]);
  parede(L, m.reboco, 'z', AZ0, AZ0 + E, AX0, AX1, 0.12, ATOPO, [W5]);
  parede(L, m.reboco, 'x', AX0, AX0 + E, AZ0 + E, AZ1 - E, 0.12, ATOPO, [W4, W3, W2]);
  parede(L, m.reboco, 'x', AX1 - E, AX1, AZ0 + E, AZ1 - E, 0.12, ATOPO);
  L.bloco(m.telhado, AX0 + E, AX1 - E, 3.3, 3.4, AZ0 + E, AZ1 - E);
  // Rufo da platibanda
  const r0 = ATOPO;
  const r1 = ATOPO + 0.035;
  L.blocoR(m.concreto, AX0 - 0.02, AX1 + 0.02, r0, r1, AZ1 - E - 0.02, AZ1 + 0.02, 0.008);
  L.blocoR(m.concreto, AX0 - 0.02, AX1 + 0.02, r0, r1, AZ0 - 0.02, AZ0 + E + 0.02, 0.008);
  L.blocoR(m.concreto, AX0 - 0.02, AX0 + E + 0.02, r0, r1, AZ0 + E, AZ1 - E, 0.008);
  L.blocoR(m.concreto, AX1 - E - 0.02, AX1 + 0.02, r0, r1, AZ0 + E, AZ1 - E, 0.008);
  janela(V, m, 'z', AZ1, 1, W1, 3, m.luzJanela);
  janela(V, m, 'x', AX0, -1, W2, 2, m.luzJanela);
  janela(V, m, 'x', AX0, -1, W3, 1, m.luzJanelaFraca);
  janela(V, m, 'x', AX0, -1, W4, 2, m.luzJanelaFraca);
  janela(V, m, 'z', AZ0, -1, W5, 2, m.luzJanela);
  // Painel ripado de correr, meio aberto sobre a janela da frente
  ripado(L, m, 'z', AZ1 + 0.03, 1, -4.35, -2.7, 0.98, 2.62);
  L.bloco(m.metal, -6.62, -2.6, 2.62, 2.66, AZ1, AZ1 + 0.09);
  L.bloco(m.metal, -6.62, -2.6, 0.95, 0.98, AZ1, AZ1 + 0.09);

  // Painéis solares na cobertura do bloco branco, inclinados para o norte (+Z)
  const gp = new THREE.BoxGeometry(1.02, 0.035, 1.7);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 2; j++) L.add(m.painel, gp, M(-6.55 + i * 1.1, 3.66, -2.7 + j * 1.86, 0, 1, 1, 1, 0.2), { manter: true });
  }

  // ---------- Base, deck e soleira ----------
  L.bloco(m.concreto, LX0, 8.72, 0, 0.17, -3.82, 3.4);
  L.blocoR(m.pedra, -0.84, 1.44, 0, 0.19, 1.34, 5.2, 0.012);
  L.bloco(m.escuro, 1.56, 11.58, 0, 0.13, 3.4, 5.08);
  L.bloco(m.escuro, 8.72, 11.58, 0, 0.13, -4.28, 3.4);
  L.blocoR(m.deck, 1.44, 11.7, 0.13, 0.19, 3.4, 5.2, 0.008);
  L.blocoR(m.deck, 8.72, 11.7, 0.13, 0.19, -4.4, 3.4, 0.008);
  // Lajotas até o fim da estrada
  for (let i = 0; i < 4; i++) L.blocoR(m.pedra, -0.65, 1.25, 0, 0.05, 5.55 + i * 0.95, 6.27 + i * 0.95, 0.012);

  // ---------- Laje, forro de madeira e pilares ----------
  L.blocoR(m.concreto, LX0, LX1, LY0, LY1, LZ0, LZ1, 0.015);
  L.bloco(m.telhado, LX0 + 0.2, LX1 - 0.25, LY1, LY1 + 0.012, LZ0 + 0.25, LZ1 - 0.25);
  L.bloco(m.forro, -0.84, 1.44, LY0 - 0.035, LY0, 1.34, LZ1 - 0.05);
  L.bloco(m.forro, 1.44, LX1 - 0.05, LY0 - 0.035, LY0, 3.4, LZ1 - 0.05);
  L.bloco(m.forro, 8.72, LX1 - 0.05, LY0 - 0.035, LY0, LZ0 + 0.05, 3.4);
  for (const z of [-4.2, 0.35, 4.8]) L.bloco(m.metal, 11.16, 11.25, 0.19, LY0 - 0.035, z - 0.045, z + 0.045);
  // Pontos de luz embutidos no forro
  const gd = new THREE.CylinderGeometry(0.05, 0.05, 0.012, 16);
  for (const [x, z] of [[0.3, 2.3], [0.3, 4.1], [3.6, 4.2], [6.2, 4.2], [10.1, 4.2], [10.1, 1.2], [10.1, -2.2]]) {
    V.add(m.ponto, gd, M(x, LY0 - 0.04, z));
  }

  // ---------- Sala: paredes e panos de vidro ----------
  parede(L, m.reboco, 'z', -3.82, -3.6, LX0, 8.72, 0.12, LY0);
  L.bloco(m.concreto, 8.5, 8.72, 0.17, LY0, -3.6, -2.6);
  L.bloco(m.concreto, 1.5, 2.3, 0.17, LY0, 3.18, 3.4);
  L.bloco(m.concreto, 1.5, 1.72, 0.17, LY0, 1.2, 3.18);
  esquadria(V, m, 'x', 8.61, -2.6, 3.24, PISO, LY0, 4);
  esquadria(V, m, 'z', 3.29, 2.3, 8.56, PISO, LY0, 4);
  L.bloco(m.metal, 8.55, 8.67, PISO, LY0, 3.23, 3.35);

  // ---------- Entrada: nicho ripado, parede da porta e frestas de vidro ----------
  ripado(L, m, 'x', AX1, 1, 1.34, AZ1, PISO, LY0 - 0.035);
  ripado(L, m, 'x', 1.5, -1, 1.34, AZ1, PISO, LY0 - 0.035);
  const mg = { giro: true };
  L.bloco(m.madeira, -0.9, -0.62, PISO, LY0, 1.2, 1.34, mg);
  L.bloco(m.madeira, 1.22, 1.5, PISO, LY0, 1.2, 1.34, mg);
  L.bloco(m.madeira, -0.62, 1.22, 2.8, LY0, 1.2, 1.34, mg);
  L.bloco(m.metal, -0.4, -0.35, PISO, 2.8, 1.21, 1.33);
  L.bloco(m.metal, 0.95, 1.0, PISO, 2.8, 1.21, 1.33);
  L.bloco(m.metal, -0.4, 1.0, 2.765, 2.8, 1.21, 1.33);
  L.bloco(m.metal, -0.62, 1.22, PISO - 0.01, PISO + 0.005, 1.2, 1.34);
  vidro(V, m, 'z', 1.27, -0.62, -0.4, PISO, 2.8);
  vidro(V, m, 'z', 1.27, 1.0, 1.22, PISO, 2.8);

  // ---------- Chaminé da churrasqueira ----------
  L.bloco(m.concreto, 6.3, 7.3, 0, 4.5, -4.5, -3.82);
  L.bloco(m.escuro, 6.42, 7.18, 4.5, 4.62, -4.38, -3.94);
  L.blocoR(m.concreto, 6.22, 7.38, 4.62, 4.69, -4.58, -3.74, 0.01);

  // ---------- Piscina e apoio no deck ----------
  const PX0 = 12.6;
  const PX1 = 17;
  const PZ0 = -10;
  const PZ1 = -4;
  const bd = 0.36;
  L.blocoR(m.pedra, PX0, PX1, 0, 0.07, PZ1 - bd, PZ1, 0.012);
  L.blocoR(m.pedra, PX0, PX1, 0, 0.07, PZ0, PZ0 + bd, 0.012);
  L.blocoR(m.pedra, PX0, PX0 + bd, 0, 0.07, PZ0 + bd, PZ1 - bd, 0.012);
  L.blocoR(m.pedra, PX1 - bd, PX1, 0, 0.07, PZ0 + bd, PZ1 - bd, 0.012);
  const ga = new THREE.PlaneGeometry(PX1 - PX0 - bd * 2, PZ1 - PZ0 - bd * 2);
  ga.rotateX(-Math.PI / 2);
  V.add(m.agua, ga, M((PX0 + PX1) / 2, 0.03, (PZ0 + PZ1) / 2));
  // Banco de madeira e vaso no deck lateral
  L.blocoR(m.madeira, 9.0, 9.42, 0.19, 0.6, -4.1, -2.75, 0.015);
  L.add(m.grafite, new THREE.CylinderGeometry(0.3, 0.22, 0.55, 20), M(11.0, 0.19 + 0.275, 2.7));

  // ---------- Folha da porta pivotante (grupo próprio para girar) ----------
  const P = new Lote();
  // A folha parte da dobradiça (x local 0) e vai até 1,29; o puxador fica perto da borda livre.
  P.blocoR(m.madeira, 0, 1.29, PISO + 0.008, PORTA.altura, -0.028, 0.028, 0.006, mg);
  for (const s of [1, -1]) {
    P.blocoR(m.metal, 1.115, 1.145, 0.95, 2.05, s * 0.075 - 0.014, s * 0.075 + 0.014, 0.006);
    P.bloco(m.metal, 1.12, 1.14, 1.1, 1.12, Math.min(0, s * 0.075), Math.max(0, s * 0.075));
    P.bloco(m.metal, 1.12, 1.14, 1.88, 1.9, Math.min(0, s * 0.075), Math.max(0, s * 0.075));
  }
  const porta = P.montar('porta');
  porta.position.set(PORTA.eixo, 0, PORTA.z);
  porta.traverse((o) => {
    o.castShadow = false;
  });

  const grupo = new THREE.Group();
  grupo.name = 'casa';
  grupo.add(L.montar('alvenaria'), porta);
  return { grupo, porta };
}
