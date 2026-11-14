// Interior: hall de entrada e sala (sofá, tapete, mesas, luminárias, jantar), com forros e pisos.
import * as THREE from 'three';
import { caixaR, Lote, M, type OpUV } from './geo';
import { LY0, PISO } from './casa';
import type { Materiais } from './materiais';
import { semente } from './ruido';

// Peças de um móvel em coordenadas locais, posicionadas por uma matriz-base.
function movel(L: Lote, base: THREE.Matrix4) {
  return (mat: THREE.Material, g: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0, rx = 0, uv?: OpUV) => {
    L.add(mat, g, base.clone().multiply(M(x, y, z, ry, 1, 1, 1, rx)), uv);
  };
}

function sofa(L: Lote, m: Materiais, base: THREE.Matrix4) {
  const P = movel(L, base);
  const comp = 2.4;
  P(m.grafite, new THREE.BoxGeometry(comp - 0.16, 0.1, 0.8), 0, 0.05, 0);
  P(m.sofa, caixaR(comp, 0.24, 0.96, 0.05), 0, 0.22, 0);
  for (const sx of [-1, 1]) P(m.sofa, caixaR(0.17, 0.36, 0.96, 0.06), sx * (comp / 2 - 0.085), 0.5, 0);
  P(m.sofa, caixaR(comp - 0.3, 0.46, 0.2, 0.07), 0, 0.57, -0.38);
  const larg = (comp - 0.36) / 3;
  for (let i = -1; i <= 1; i++) {
    P(m.sofa, caixaR(larg - 0.015, 0.17, 0.72, 0.065, 3), i * larg, 0.42, 0.1);
    P(m.sofa, caixaR(larg - 0.03, 0.44, 0.19, 0.08, 3), i * larg, 0.7, -0.22, 0, -0.2);
  }
  P(m.almofadaVerde, caixaR(0.44, 0.44, 0.13, 0.06, 3), -0.72, 0.68, -0.02, 0.25, -0.32);
  P(m.almofadaOuro, caixaR(0.4, 0.4, 0.12, 0.055, 3), 0.8, 0.66, 0.0, -0.3, -0.34);
  P(m.tinta, caixaR(0.36, 0.36, 0.11, 0.05, 3), 0.5, 0.65, 0.06, 0.1, -0.5);
}

export function poltrona(L: Lote, m: Materiais, base: THREE.Matrix4) {
  const P = movel(L, base);
  const perna = new THREE.BoxGeometry(0.035, 0.6, 0.035);
  for (const sx of [-1, 1]) {
    P(m.marcenaria, perna, sx * 0.32, 0.3, 0.3);
    P(m.marcenaria, new THREE.BoxGeometry(0.035, 0.78, 0.035), sx * 0.32, 0.39, -0.32, 0, -0.14);
    P(m.marcenaria, caixaR(0.05, 0.03, 0.72, 0.01), sx * 0.32, 0.6, 0);
    P(m.marcenaria, new THREE.BoxGeometry(0.03, 0.03, 0.62), sx * 0.32, 0.3, 0);
  }
  P(m.marcenaria, new THREE.BoxGeometry(0.62, 0.03, 0.03), 0, 0.3, 0.3);
  P(m.sofa, caixaR(0.6, 0.15, 0.62, 0.06, 3), 0, 0.42, 0.0);
  P(m.sofa, caixaR(0.6, 0.5, 0.14, 0.06, 3), 0, 0.68, -0.3, 0, -0.22);
  P(m.almofadaVerde, caixaR(0.36, 0.3, 0.1, 0.05, 3), 0.02, 0.6, -0.18, 0, -0.3);
}

function mesaRedonda(L: Lote, m: Materiais, x: number, z: number, raio: number, alt: number, pes: number) {
  L.add(m.marcenaria, new THREE.CylinderGeometry(raio, raio - 0.012, 0.035, 40), M(x, PISO + alt, z));
  for (let i = 0; i < pes; i++) {
    const a = (i / pes) * Math.PI * 2 + 0.4;
    L.add(m.grafite, new THREE.CylinderGeometry(0.014, 0.011, alt, 8), M(x + Math.cos(a) * raio * 0.72, PISO + alt / 2, z + Math.sin(a) * raio * 0.72));
  }
}

function vaso(L: Lote, mat: THREE.Material, x: number, y: number, z: number, esc = 1) {
  const perfil = [
    [0.0, 0.0],
    [0.07, 0.0],
    [0.1, 0.05],
    [0.105, 0.14],
    [0.07, 0.24],
    [0.045, 0.3],
    [0.055, 0.33],
  ].map(([r, h]) => new THREE.Vector2(r * esc, h * esc));
  L.add(mat, new THREE.LatheGeometry(perfil, 24), M(x, y, z));
}

function luminariaPiso(L: Lote, m: Materiais, x: number, z: number) {
  L.add(m.grafite, new THREE.CylinderGeometry(0.15, 0.15, 0.02, 24), M(x, PISO + 0.01, z));
  L.add(m.latao, new THREE.CylinderGeometry(0.011, 0.011, 1.42, 8), M(x, PISO + 0.72, z));
  L.add(m.cupula, new THREE.CylinderGeometry(0.19, 0.23, 0.32, 28, 1, true), M(x, PISO + 1.55, z));
}

function abajur(L: Lote, m: Materiais, x: number, y: number, z: number) {
  vaso(L, m.ceramica, x, y, z, 0.85);
  L.add(m.cupula, new THREE.CylinderGeometry(0.11, 0.16, 0.2, 24, 1, true), M(x, y + 0.4, z));
}

function planta(L: Lote, m: Materiais, x: number, z: number) {
  const rnd = semente(77);
  L.add(m.grafite, new THREE.CylinderGeometry(0.24, 0.18, 0.46, 20), M(x, PISO + 0.23, z));
  L.add(m.escuro, new THREE.CylinderGeometry(0.22, 0.22, 0.02, 20), M(x, PISO + 0.455, z));
  const folha = new THREE.SphereGeometry(1, 8, 5);
  for (let i = 0; i < 4; i++) {
    const a = rnd() * 6.283;
    const incl = 0.1 + rnd() * 0.18;
    const h = 1.2 + rnd() * 0.75;
    L.add(m.marcenaria, new THREE.CylinderGeometry(0.012, 0.018, h, 5), M(x + Math.sin(a) * incl * h * 0.5, PISO + 0.45 + h / 2, z + Math.cos(a) * incl * h * 0.5, a, 1, 1, 1, incl));
    for (let k = 0; k < 6; k++) {
      const t = 0.35 + (k / 6) * 0.68;
      const b = a + k * 2.4 + rnd();
      const px = x + Math.sin(a) * incl * h * t + Math.sin(b) * 0.16;
      const pz = z + Math.cos(a) * incl * h * t + Math.cos(b) * 0.16;
      L.add(m.folha, folha, M(px, PISO + 0.45 + h * t, pz, b, 0.1, 0.012, 0.2, 0.5 + rnd() * 0.5));
    }
  }
}

function cortina(L: Lote, m: Materiais, x: number, z0: number, z1: number, eixoX: boolean) {
  const larg = Math.abs(z1 - z0);
  const g = new THREE.PlaneGeometry(larg, LY0 - PISO - 0.06, 28, 1);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / larg + 0.5;
    p.setZ(i, Math.sin(u * Math.PI * 9) * 0.045 + Math.sin(u * 31) * 0.012);
  }
  g.computeVertexNormals();
  const mid = (z0 + z1) / 2;
  const y = (LY0 + PISO) / 2;
  if (eixoX) L.add(m.cortina, g, M(mid, y, x));
  else L.add(m.cortina, g, M(x, y, mid, Math.PI / 2));
}

function cadeira(L: Lote, m: Materiais, base: THREE.Matrix4) {
  const P = movel(L, base);
  const perna = new THREE.BoxGeometry(0.03, 0.45, 0.03);
  for (const sx of [-1, 1]) {
    P(m.grafite, perna, sx * 0.19, 0.225, 0.19);
    P(m.grafite, new THREE.BoxGeometry(0.03, 0.84, 0.03), sx * 0.19, 0.42, -0.2, 0, -0.08);
  }
  P(m.marcenaria, caixaR(0.44, 0.04, 0.44, 0.015), 0, 0.46, 0);
  P(m.marcenaria, caixaR(0.42, 0.2, 0.025, 0.012), 0, 0.74, -0.225, 0, -0.08);
}

// Mancha escura no piso sob um móvel (substitui a oclusão de ambiente).
function contato(L: Lote, m: Materiais, x: number, z: number, w: number, d: number, forca: number, y = PISO + 0.004, ry = 0) {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  const c = new Float32Array(4 * 4);
  for (let i = 0; i < 4; i++) c.set([1, 1, 1, forca], i * 4);
  g.setAttribute('color', new THREE.BufferAttribute(c, 4));
  L.add(m.contato, g, M(x, y, z, ry), { manter: true, cor: true });
}

export function criarInterior(m: Materiais): THREE.Group {
  const L = new Lote();
  const T = LY0 - 0.03;

  // Pisos, forros e revestimento interno das paredes
  L.bloco(m.piso, -0.9, 1.5, 0.17, PISO, -3.6, 1.2);
  L.bloco(m.piso, 1.5, 8.5, 0.17, PISO, -3.6, 3.18);
  L.bloco(m.teto, -0.9, 1.5, T, LY0, -3.6, 1.2);
  L.bloco(m.teto, 1.5, 8.5, T, LY0, -3.6, 3.18);
  L.bloco(m.tinta, -0.9, 8.5, PISO, T, -3.6, -3.575);
  L.bloco(m.tinta, -0.9, -0.875, PISO, T, -3.575, 1.2);
  L.bloco(m.tinta, 1.72, 1.745, PISO, T, 1.2, 3.18);
  L.bloco(m.tinta, 1.745, 2.3, PISO, T, 3.155, 3.18);
  L.bloco(m.tinta, 8.475, 8.5, PISO, T, -3.575, -2.6);
  // Rodapé
  L.bloco(m.teto, -0.875, 8.475, PISO, PISO + 0.09, -3.575, -3.56);
  L.bloco(m.teto, -0.875, -0.86, PISO, PISO + 0.09, -3.56, 1.2);
  // Porta interna para os quartos
  L.blocoR(m.marcenaria, -0.875, -0.84, PISO, 2.32, -2.7, -1.82, 0.006, { giro: true });
  L.add(m.latao, new THREE.CylinderGeometry(0.012, 0.012, 0.13, 8), M(-0.82, 1.2, -1.92, 0, 1, 1, 1, Math.PI / 2));

  // ---------- Estar ----------
  const SX = 6.8;
  const SZ = -0.75;
  sofa(L, m, M(SX, PISO, SZ, -Math.PI / 2));
  L.blocoR(m.tapete, 3.55, 6.75, PISO, PISO + 0.016, -2.15, 0.65, 0.007);
  mesaRedonda(L, m, 5.15, SZ, 0.48, 0.36, 3);
  vaso(L, m.ceramica, 5.3, PISO + 0.38, SZ - 0.12);
  L.blocoR(m.livro, 4.82, 5.1, PISO + 0.378, PISO + 0.41, -0.8, -0.42, 0.004);
  L.blocoR(m.grafite, 4.84, 5.08, PISO + 0.41, PISO + 0.435, -0.77, -0.45, 0.004);
  poltrona(L, m, M(5.2, PISO, 1.25, Math.PI + 0.3));
  mesaRedonda(L, m, 6.85, 0.92, 0.22, 0.5, 3);
  vaso(L, m.grafite, 6.85, PISO + 0.52, 0.92, 0.7);
  luminariaPiso(L, m, 7.5, -2.55);
  planta(L, m, 8.0, 2.72);
  cortina(L, m, 8.4, -2.58, -1.95, false);
  cortina(L, m, 8.4, 2.62, 3.14, false);
  cortina(L, m, 3.1, 2.34, 2.9, true);

  // Aparador com quadro na parede do fundo
  L.blocoR(m.marcenaria, 2.9, 5.1, PISO + 0.2, PISO + 0.72, -3.57, -3.15, 0.008);
  for (const x of [2.98, 5.02]) {
    for (const z of [-3.5, -3.22]) L.bloco(m.grafite, x - 0.015, x + 0.015, PISO, PISO + 0.2, z - 0.015, z + 0.015);
  }
  L.blocoR(m.grafite, 3.2, 4.8, 1.32, 2.42, -3.575, -3.545, 0.006);
  L.add(m.quadro, new THREE.PlaneGeometry(1.5, 1.0), M(4.0, 1.87, -3.542), { manter: true });
  abajur(L, m, 3.2, PISO + 0.72, -3.36);
  L.blocoR(m.livro, 4.3, 4.62, PISO + 0.72, PISO + 0.76, -3.5, -3.26, 0.004);
  vaso(L, m.almofadaOuro, 4.75, PISO + 0.72, -3.36, 0.6);

  // ---------- Jantar (visto de fora pelos vidros da frente) ----------
  const JX = 3.5;
  const JZ = 1.85;
  L.blocoR(m.marcenaria, JX - 0.95, JX + 0.95, PISO + 0.71, PISO + 0.75, JZ - 0.45, JZ + 0.45, 0.008);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) L.bloco(m.grafite, JX + sx * 0.86 - 0.025, JX + sx * 0.86 + 0.025, PISO, PISO + 0.71, JZ + sz * 0.36 - 0.025, JZ + sz * 0.36 + 0.025);
  }
  for (let i = -1; i <= 1; i++) {
    cadeira(L, m, M(JX + i * 0.6, PISO, JZ - 0.62, 0));
    cadeira(L, m, M(JX + i * 0.6, PISO, JZ + 0.62, Math.PI));
  }
  for (const dx of [-0.42, 0.42]) {
    L.add(m.grafite, new THREE.CylinderGeometry(0.004, 0.004, 1.0, 5), M(JX + dx, T - 0.5, JZ));
    L.add(m.grafite, new THREE.CylinderGeometry(0.05, 0.19, 0.2, 24, 1, true), M(JX + dx, T - 1.08, JZ));
    L.add(m.ponto, new THREE.SphereGeometry(0.045, 12, 8), M(JX + dx, T - 1.12, JZ));
  }

  // ---------- Hall ----------
  L.blocoR(m.tapete, -0.25, 0.85, PISO, PISO + 0.012, -1.1, 0.7, 0.005);
  L.blocoR(m.marcenaria, -0.3, 0.9, PISO + 0.76, PISO + 0.8, -3.56, -3.26, 0.008);
  for (const x of [-0.25, 0.85]) L.bloco(m.grafite, x - 0.015, x + 0.015, PISO, PISO + 0.76, -3.52, -3.49);
  vaso(L, m.ceramica, 0.0, PISO + 0.8, -3.4, 1.1);
  L.blocoR(m.grafite, 0.0, 0.84, 1.3, 2.3, -3.575, -3.55, 0.005);
  const recorte = new THREE.PlaneGeometry(0.72, 0.88);
  const ruv = recorte.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < ruv.count; i++) ruv.setXY(i, 0.5 + ruv.getX(i) * 0.36, 0.12 + ruv.getY(i) * 0.66);
  L.add(m.quadro, recorte, M(0.42, 1.8, -3.547), { manter: true });

  // Duas poltronas no deck, viradas para o pôr do sol
  poltrona(L, m, M(10.15, 0.19, 1.55, Math.PI / 2 - 0.2));
  poltrona(L, m, M(10.2, 0.19, -0.1, Math.PI / 2 + 0.15));
  mesaRedonda(L, m, 10.35, 0.72, 0.2, 0.42, 3);

  // ---------- Sombras de contato ----------
  contato(L, m, SX + 0.05, SZ, 1.25, 2.75, 0.55);
  contato(L, m, 5.15, SZ, 1.15, 1.15, 0.3);
  contato(L, m, 5.2, 1.25, 1.0, 1.0, 0.4);
  contato(L, m, 6.85, 0.92, 0.6, 0.6, 0.35);
  contato(L, m, 7.5, -2.55, 0.5, 0.5, 0.4);
  contato(L, m, 8.0, 2.72, 0.8, 0.8, 0.5);
  contato(L, m, 4.0, -3.36, 2.6, 0.75, 0.4);
  contato(L, m, JX, JZ, 2.5, 2.0, 0.3);
  contato(L, m, 0.3, -3.4, 1.5, 0.55, 0.35);
  return L.montar('interior');
}
