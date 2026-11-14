// Vegetação procedural: araucárias (tronco reto, copa em taça), capões de mata, arbustos, capim-dos-pampas e grama.
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { colorir, fundirCor, M, uvMundo } from './geo';
import type { Texturas } from './texturas';
import { luzRasante } from './ceu';
import { fbm, hash2, mix, semente, suave, type Rand } from './ruido';
import { altura, CENTRO, distEstrada } from './terreno';

type RGB = [number, number, number];
const lin = (h: string): RGB => {
  const c = new THREE.Color(h);
  return [c.r, c.g, c.b];
};
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

// Bola irregular de folhagem, com normais suaves; mais escura por baixo e com leve variação de tom.
function tufo(rnd: Rand, raio: number, achat: number, detalhe: number, c1: RGB, c2: RGB): THREE.BufferGeometry {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detalhe);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-4);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const s = rnd() * 100;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const k = 0.74 + 0.52 * fbm(x * 1.9 + s, y * 1.9 + z * 1.4 + s, 2);
    p.setXYZ(i, x * k * raio, y * k * raio * achat, z * k * raio);
  }
  g.computeVertexNormals();
  const tom = rnd();
  colorir(g, (x, y, z, ny) => {
    const luz = 0.5 + 0.5 * ny;
    const c = mixRGB(c1, c2, Math.min(1, tom * 0.55 + luz * 0.45));
    const k = (0.42 + 0.58 * suave(-0.7, 0.6, y / (raio * achat))) * (0.9 + 0.2 * hash2(Math.floor(x * 40 + s), Math.floor(z * 40 + y * 17)));
    return [c[0] * k, c[1] * k, c[2] * k];
  });
  uvMundo(g, 1.7);
  return g;
}

// Vários tufos de tamanhos e tons diferentes formando uma massa orgânica (arbusto, copa, capão).
function aglomerado(rnd: Rand, n: number, raio: number, alto: number, det: number, paleta: RGB[], y0 = 0): THREE.BufferGeometry[] {
  const partes: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = i === 0 ? 0 : raio * (0.25 + 0.75 * Math.sqrt(rnd()));
    const r = raio * (i === 0 ? 0.62 : 0.3 + rnd() * 0.36);
    const c1 = paleta[Math.floor(rnd() * paleta.length)];
    const c2 = paleta[Math.floor(rnd() * paleta.length)];
    const t = tufo(rnd, r, 0.78 + rnd() * 0.3, det, c1, c2);
    const y = y0 + r * 0.55 + (i === 0 ? alto * 0.6 : rnd() * alto) * (1 - (0.5 * d) / raio);
    t.applyMatrix4(M(Math.cos(a) * d, y, Math.sin(a) * d, rnd() * 6.283));
    partes.push(t);
  }
  return partes;
}

const CASCA = lin('#2b231d');
const VERDE_A = lin('#1b2e17');
const VERDE_B = lin('#3a5527');
const VERDE_C = lin('#526a2e');

// Araucária adulta: tronco reto, copa em taça de galhos em candelabro. nivel 2 = destaque, 1 = meio do campo, 0 = longe.
function araucaria(rnd: Rand, H: number, nivel: 0 | 1 | 2): THREE.BufferGeometry {
  const partes: THREE.BufferGeometry[] = [];
  const tronco = new THREE.CylinderGeometry(0.07 + H * 0.002, 0.12 + H * 0.0065, H, nivel ? 8 : 5, nivel ? 4 : 1);
  tronco.translate(0, H / 2, 0);
  colorir(tronco, (x, y, z) => {
    const k = 0.75 + 0.5 * hash2(Math.floor(Math.atan2(z, x) * 5), Math.floor(y * 1.7));
    return [CASCA[0] * k, CASCA[1] * k, CASCA[2] * k];
  });
  partes.push(tronco);

  const nT = nivel ? 5 : 3;
  for (let i = 0; i < nT; i++) {
    const f = i / (nT - 1);
    const y0 = H * (0.7 + 0.26 * f) + (rnd() - 0.5) * H * 0.02;
    const n = Math.round(mix(7, 5, f)) + (rnd() < 0.3 ? 1 : 0);
    const fase = rnd() * Math.PI * 2;
    for (let j = 0; j < n; j++) {
      if (nivel && i < nT - 1 && rnd() < 0.1) continue; // falhas: nenhuma copa de verdade é completa
      const ang = fase + (j / n) * Math.PI * 2 + (rnd() - 0.5) * 0.5;
      const L = H * (0.34 - 0.14 * f) * (0.78 + rnd() * 0.36);
      const dx = Math.cos(ang);
      const dz = Math.sin(ang);
      const cai = L * (0.03 + rnd() * 0.07);
      const sobe = L * (0.3 - 0.08 * f) * (0.8 + rnd() * 0.4);
      const curva = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, y0, 0),
        new THREE.Vector3(dx * L * 0.45, y0 - cai, dz * L * 0.45),
        new THREE.Vector3(dx * L * 0.97, y0 - cai * 0.5, dz * L * 0.97),
        new THREE.Vector3(dx * L, y0 + sobe, dz * L),
      );
      if (nivel) {
        const galho = new THREE.TubeGeometry(curva, 7, 0.035 + 0.03 * (1 - f), 4, false);
        colorir(galho, () => CASCA);
        partes.push(galho);
      }
      // Tufos empilhados na ponta virada para cima, como uma vela.
      const r = H * 0.05 * (1 - 0.28 * f) * (0.8 + rnd() * 0.38);
      const ponta = curva.getPoint(1);
      const det = nivel === 2 ? 2 : nivel;
      const t1 = tufo(rnd, r, 0.95, det, VERDE_A, VERDE_B);
      t1.applyMatrix4(M(ponta.x, ponta.y - r * 0.15, ponta.z, rnd() * 6));
      partes.push(t1);
      const t3 = tufo(rnd, r * 0.66, 1.1, nivel ? 1 : 0, VERDE_B, VERDE_C);
      t3.applyMatrix4(M(ponta.x + (rnd() - 0.5) * r * 0.5, ponta.y + r * 0.72, ponta.z + (rnd() - 0.5) * r * 0.5, rnd() * 6));
      partes.push(t3);
      if (nivel) {
        const q = curva.getPoint(0.84);
        const t2 = tufo(rnd, r * 0.78, 0.85, 1, VERDE_A, VERDE_B);
        t2.applyMatrix4(M(q.x, q.y + r * 0.2, q.z, rnd() * 6));
        partes.push(t2);
      }
    }
  }
  const topo = tufo(rnd, H * 0.045, 1.05, nivel ? 1 : 0, VERDE_B, VERDE_C);
  topo.applyMatrix4(M(0, H * 1.0, 0));
  partes.push(topo);
  return fundirCor(partes);
}

const PALETA_ARVORE = [lin('#27391d'), lin('#3a4f26'), lin('#4d5f2c'), lin('#646f36')];
const PALETA_ARBUSTO = [lin('#2f4024'), lin('#3f522b'), lin('#516233'), lin('#63703c')];

// Árvore de copa larga: tronco curto, dois galhos e copa em vários volumes.
function arvore(rnd: Rand, det: number): THREE.BufferGeometry {
  const partes: THREE.BufferGeometry[] = [];
  const tr = new THREE.CylinderGeometry(0.13, 0.24, 3.0, 7, 1);
  tr.translate(0, 1.5, 0);
  colorir(tr, () => CASCA);
  partes.push(tr);
  for (let i = 0; i < 3; i++) {
    const a = rnd() * 6.283;
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 2.4, 0), new THREE.Vector3(Math.cos(a) * 0.6, 3.4, Math.sin(a) * 0.6), new THREE.Vector3(Math.cos(a) * 1.7, 4.3, Math.sin(a) * 1.7));
    const gl = new THREE.TubeGeometry(c, 4, 0.07, 5, false);
    colorir(gl, () => CASCA);
    partes.push(gl);
  }
  partes.push(...aglomerado(rnd, 13, 3.0, 2.0, det, PALETA_ARVORE, 3.3));
  return fundirCor(partes);
}

// Capim ornamental: touceira de folhas arqueadas, com alguns colmos mais altos.
function capim(rnd: Rand): THREE.BufferGeometry {
  const pos: number[] = [];
  const cores: number[] = [];
  const base = lin('#414f27');
  const ponta = lin('#9a9a58');
  const fita = (ox: number, oy: number, oz: number, ang: number, comp: number, abre: number, larg: number, cA: RGB, cB: RGB) => {
    const SEG = 4;
    const dx = Math.cos(ang);
    const dz = Math.sin(ang);
    const px = -dz;
    const pz = dx;
    const perfil = (t: number) => 1 - t;
    let ax = ox;
    let ay = oy;
    let az = oz;
    for (let k = 1; k <= SEG; k++) {
      const t = k / SEG;
      const bx = ox + dx * abre * t * t;
      const by = oy + comp * (t - 0.35 * abre * t * t);
      const bz = oz + dz * abre * t * t;
      const w0 = larg * perfil((k - 1) / SEG);
      const w1 = larg * perfil(t);
      const c0 = mixRGB(cA, cB, (k - 1) / SEG);
      const c1 = mixRGB(cA, cB, t);
      pos.push(ax - px * w0, ay, az - pz * w0, ax + px * w0, ay, az + pz * w0, bx + px * w1, by, bz + pz * w1);
      pos.push(ax - px * w0, ay, az - pz * w0, bx + px * w1, by, bz + pz * w1, bx - px * w1, by, bz - pz * w1);
      cores.push(...c0, ...c0, ...c1, ...c0, ...c1, ...c1);
      ax = bx;
      ay = by;
      az = bz;
    }
  };
  for (let i = 0; i < 150; i++) {
    const a = rnd() * 6.283;
    const d = rnd() * 0.16;
    fita(Math.cos(a) * d, 0, Math.sin(a) * d, a + (rnd() - 0.5), 0.75 + rnd() * 0.85, 0.3 + rnd() * 0.9, 0.022 + rnd() * 0.012, base, ponta);
  }
  // alguns colmos mais altos e finos, sem pluma
  for (let i = 0; i < 14; i++) fita(0, 0, 0, rnd() * 6.283, 1.4 + rnd() * 0.7, 0.15 + rnd() * 0.35, 0.008, base, ponta);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
  const nrm = new Float32Array(pos.length);
  for (let i = 1; i < nrm.length; i += 3) nrm[i] = 1;
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return g;
}

// Punhado de folhas de grama, baixas e do tom do gramado: dão relevo de perto sem virar "plantinha".
function folhasGrama(rnd: Rand): THREE.BufferGeometry {
  const pos: number[] = [];
  const cores: number[] = [];
  const a = lin('#3d5226');
  const b = lin('#6f7f3c');
  for (let i = 0; i < 7; i++) {
    const ang = rnd() * 6.283;
    const h = 0.05 + rnd() * 0.09;
    const cx = (rnd() - 0.5) * 0.2;
    const cz = (rnd() - 0.5) * 0.2;
    const px = Math.cos(ang) * 0.01;
    const pz = Math.sin(ang) * 0.01;
    const lx = Math.sin(ang) * h * 0.45;
    const lz = -Math.cos(ang) * h * 0.45;
    pos.push(cx - px, 0, cz - pz, cx + px, 0, cz + pz, cx + lx, h, cz + lz);
    cores.push(...a, ...a, ...b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
  const nrm = new Float32Array(pos.length);
  for (let i = 1; i < nrm.length; i += 3) nrm[i] = 1;
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return g;
}

interface Inst {
  x: number;
  z: number;
  y?: number;
  s: number;
  sy?: number;
  ry?: number;
  cor?: THREE.Color;
}

function instanciar(g: THREE.BufferGeometry, mat: THREE.Material, lista: Inst[], sombra: boolean, nome: string): THREE.InstancedMesh {
  const im = new THREE.InstancedMesh(g, mat, lista.length);
  lista.forEach((it, i) => {
    im.setMatrixAt(i, M(it.x, it.y ?? altura(it.x, it.z), it.z, it.ry ?? 0, it.s, it.sy ?? it.s, it.s));
    if (it.cor) im.setColorAt(i, it.cor);
  });
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = sombra;
  im.receiveShadow = true;
  im.name = nome;
  return im;
}

// Fora das construções, deck, piscina e caminho.
function livre(x: number, z: number, folga = 0): boolean {
  if (x > -8.2 - folga && x < 12.2 + folga && z > -5.2 - folga && z < 5.8 + folga) return false;
  if (x > 12 - folga && x < 17.6 + folga && z > -10.6 - folga && z < -3.4 + folga) return false;
  if (Math.abs(x - 0.3) < 1.3 + folga && z > 5 && z < 10) return false;
  return distEstrada(x, z) > 2.4 + folga;
}

export function criarVegetacao(tex: Texturas, baixa: boolean): THREE.Group {
  const grupo = new THREE.Group();
  grupo.name = 'vegetacao';
  const rnd = semente(20161112);
  const folhagem = new THREE.MeshStandardMaterial({ vertexColors: true, map: tex.folhagem, bumpMap: tex.folhagem, bumpScale: 1.2, roughness: 1, envMapIntensity: 0.8 });
  folhagem.color.setRGB(1.3, 1.3, 1.26); // compensa o escurecimento médio da textura
  // Sem reflexo de ambiente nas folhas: em contraluz ele clareava as copas e apagava a silhueta.
  folhagem.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.indirectSpecular = vec3(0.0);');
  };
  folhagem.customProgramCacheKey = () => 'folhagem';
  const folhagem2 = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, envMapIntensity: 0.8, side: THREE.DoubleSide });
  luzRasante(folhagem2, 0.8);
  const tinta = new THREE.Color();
  const tom = (v = 0.25) => {
    const k = 1 - v / 2 + rnd() * v;
    return tinta.setRGB(k * (0.96 + rnd() * 0.1), k, k * (0.88 + rnd() * 0.14)).clone();
  };

  // Destaque: as do lado do sol riscam o gramado de sombras; as de trás sobem acima do telhado. Nada alto atrás do texto.
  const destaque: Inst[] = [
    { x: 36, z: 13, s: 1.0 },
    { x: 35, z: 20.5, s: 0.88 },
    { x: 34, z: 29, s: 1.08 },
    { x: 41, z: -4, s: 0.95 },
    { x: 24, z: -30, s: 1.0 },
    { x: 35, z: -40, s: 0.9 },
    { x: 18, z: -46, s: 1.08 },
    { x: 46, z: -20, s: 0.95 },
  ];
  const meio: Inst[] = [
    { x: 60, z: 34, s: 0.92 },
    { x: 66, z: -52, s: 1.1 },
    { x: 48, z: -62, s: 1.0 },
    { x: -20, z: -84, s: 1.05 },
    { x: 88, z: -8, s: 0.95 },
    { x: -64, z: -92, s: 1.0 },
    { x: -104, z: -40, s: 0.9 },
    { x: 20, z: 66, s: 1.0 },
  ];
  const giro = (l: Inst[]) => l.map((it) => ({ ...it, ry: rnd() * 6.283 }));
  const nD = baixa ? 6 : destaque.length;
  [araucaria(semente(7), 17, baixa ? 1 : 2), araucaria(semente(19), 15.5, baixa ? 1 : 2)].forEach((g, v) => {
    grupo.add(instanciar(g, folhagem, giro(destaque.slice(0, nD).filter((_, i) => i % 2 === v)), true, 'araucarias'));
  });
  grupo.add(instanciar(araucaria(semente(41), 16.5, 1), folhagem, giro(baixa ? meio.slice(0, 4) : meio), false, 'araucarias-meio'));

  // Araucárias e capões de mata ao longe.
  const longe: Inst[] = [];
  const copas: Inst[] = [];
  const nLonge = baixa ? 36 : 90;
  const nCopas = baixa ? 240 : 520;
  let guarda = 0;
  while (longe.length < nLonge && guarda++ < 20000) {
    const a = rnd() * Math.PI * 2;
    const r = 110 + Math.pow(rnd(), 0.8) * 280;
    const x = CENTRO.x + Math.cos(a) * r;
    const z = CENTRO.z + Math.sin(a) * r;
    if (distEstrada(x, z) < 7) continue;
    if (fbm(x * 0.011 + 5, z * 0.011 + 9, 3) < 0.47 && rnd() > 0.12) continue;
    longe.push({ x, z, s: 0.8 + rnd() * 0.45, ry: rnd() * 6.283 });
  }
  guarda = 0;
  while (copas.length < nCopas && guarda++ < 60000) {
    const a = rnd() * Math.PI * 2;
    const r = 125 + Math.pow(rnd(), 0.75) * 330;
    const x = CENTRO.x + Math.cos(a) * r;
    const z = CENTRO.z + Math.sin(a) * r;
    if (distEstrada(x, z) < 9) continue;
    const mata = fbm(x * 0.0085 + 21, z * 0.0085 + 3, 3) + suave(230, 400, r) * 0.16;
    if (mata < 0.54) continue;
    // cada ponto aceito vira um grupo cerrado de copas: a mata fecha em massa, não em bolas soltas
    for (let k = 0; k < 4 && copas.length < nCopas; k++) {
      const cx = x + (k ? (rnd() - 0.5) * 13 : 0);
      const cz = z + (k ? (rnd() - 0.5) * 13 : 0);
      const s = 3.6 + rnd() * 2.8;
      copas.push({ x: cx, z: cz, y: altura(cx, cz), s, sy: s * (0.9 + rnd() * 0.6), ry: rnd() * 6.283, cor: tom(0.4) });
    }
  }
  // Mantém a sequência original do gerador para não alterar os jardins e as sombras perto da casa.
  // A vegetação extra usa uma semente própria e fica apenas ao fundo.
  const fundoRnd = semente(90214);
  const extras = baixa ? 32 : 240;
  let novas = 0;
  let tentativas = 0;
  while (novas < extras && tentativas++ < 8000) {
    const a = fundoRnd() * Math.PI * 2;
    const r = 235 + fundoRnd() * 225;
    const x = CENTRO.x + Math.cos(a) * r;
    const z = CENTRO.z + Math.sin(a) * r;
    if (distEstrada(x, z) < 12 || fbm(x * 0.0085 + 21, z * 0.0085 + 3, 3) < 0.47) continue;
    const esc = 3.4 + fundoRnd() * 3.2;
    const tomFundo = 0.82 + fundoRnd() * 0.32;
    copas.push({ x, z, y: altura(x, z), s: esc, sy: esc * (0.9 + fundoRnd() * 0.5), ry: fundoRnd() * Math.PI * 2, cor: new THREE.Color().setRGB(tomFundo * 0.96, tomFundo, tomFundo * 0.92) });
    novas++;
  }
  const pinheiros = baixa ? longe.slice(0, 28) : longe.filter((_, i) => i % 4 !== 0);
  grupo.add(instanciar(araucaria(semente(31), 16, 0), folhagem, pinheiros, false, 'araucarias-longe'));
  // Capão: copas de alturas diferentes sobre troncos curtos. Mais detalhe só nos mais próximos.
  const paletaMata = [lin('#1f2f19'), lin('#2d4020'), lin('#3c5027'), lin('#4a5a2c')];
  const capao = (sem: number, det: number) => {
    const r2 = semente(sem);
    const partes = aglomerado(r2, det ? 8 : 6, 1.0, 0.75, det, paletaMata, 0.55);
    for (let i = 0; i < 3; i++) {
      const tr = new THREE.CylinderGeometry(0.035, 0.05, 0.8, 5, 1);
      tr.translate((r2() - 0.5) * 1.1, 0.4, (r2() - 0.5) * 1.1);
      colorir(tr, () => CASCA);
      partes.push(tr);
    }
    return fundirCor(partes);
  };
  const dist = (c: Inst) => Math.hypot(c.x - CENTRO.x, c.z - CENTRO.z);
  const copasPerto = baixa ? [] : copas.filter((c) => dist(c) < 230);
  const copasLonge = baixa ? copas : copas.filter((c) => dist(c) >= 230);
  if (copasPerto.length) grupo.add(instanciar(capao(3, 1), folhagem, copasPerto, false, 'mata-perto'));
  // Mais massa de mata, com copas simples à distância: menos triângulos por árvore e a mesma chamada de desenho.
  grupo.add(instanciar(capao(4, 0), folhagem, copasLonge, false, 'mata'));

  // Árvores de copa larga no meio do campo.
  const arvores: Inst[] = giro([
    { x: 21, z: -15, s: 0.95 },
    { x: 54, z: -10, s: 1.2 },
    { x: -44, z: -36, s: 1.25 },
    { x: 40, z: 50, s: 1.2 },
    { x: -24, z: -44, s: 1.0 },
    { x: 78, z: -40, s: 1.3 },
    { x: -78, z: -70, s: 1.3 },
    { x: -58, z: 44, s: 1.15 },
  ]);
  grupo.add(instanciar(arvore(semente(11), baixa ? 2 : 3), folhagem, baixa ? arvores.slice(0, 5) : arvores, true, 'arvores'));

  // Arbustos em canteiros junto à casa: dois tipos, tamanhos e tons variados.
  const arbA: Inst[] = [];
  const arbB: Inst[] = [];
  const canteiro = (x0: number, z0: number, x1: number, z1: number, n: number, esc: number) => {
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const it = { x: mix(x0, x1, t) + (rnd() - 0.5) * 0.4, z: mix(z0, z1, t) + (rnd() - 0.5) * 0.4, y: 0, s: esc * (0.7 + rnd() * 0.6), ry: rnd() * 6.283, cor: tom(0.3) };
      (rnd() < 0.6 ? arbA : arbB).push(it);
    }
  };
  canteiro(-7.2, 4.15, -1.5, 4.15, 7, 1);
  canteiro(-8.5, 2.6, -8.5, -3.8, 6, 0.95);
  canteiro(-6.8, -4.95, -1.5, -4.95, 5, 0.9);
  const det = baixa ? 1 : 2;
  grupo.add(instanciar(fundirCor(aglomerado(semente(5), 8, 0.7, 0.3, det, PALETA_ARBUSTO)), folhagem, arbA, true, 'arbustos'));
  grupo.add(instanciar(fundirCor(aglomerado(semente(9), 6, 0.48, 0.75, det, PALETA_ARBUSTO)), folhagem, arbB, true, 'arbustos-altos'));

  // Touceiras de capim marcando o caminho, o canto do deck e a piscina.
  const touceiras: Inst[] = giro([
    { x: 13.2, z: 5.6, s: 1.0 },
    { x: 14.6, z: 4.4, s: 0.8 },
    { x: 18.2, z: -3.0, s: 0.95 },
    { x: -9.6, z: 4.8, s: 0.95 },
    { x: 3.9, z: 9.6, s: 0.8 },
    { x: -3.4, z: 9.2, s: 0.85 },
    { x: 17.9, z: -8.6, s: 0.9 },
  ]).map((it) => ({ ...it, y: 0, cor: tom(0.2) }));
  grupo.add(instanciar(capim(semente(13)), folhagem2, touceiras, true, 'capim'));

  // Grama em folhas soltas perto da casa: quebra o plano do gramado na aproximação.
  if (!baixa) {
    const tufos: Inst[] = [];
    let g2 = 0;
    while (tufos.length < 16000 && g2++ < 90000) {
      const a = rnd() * Math.PI * 2;
      const r = 3 + Math.pow(rnd(), 0.7) * 24;
      const x = 0.5 + Math.cos(a) * r;
      const z = 8 + Math.sin(a) * r;
      if (!livre(x, z, 0.1)) continue;
      tufos.push({ x, z, y: 0, s: 0.55 + rnd() * 0.75, ry: rnd() * 6.283, cor: tom(0.35) });
    }
    grupo.add(instanciar(folhasGrama(semente(2)), folhagem2, tufos, false, 'grama'));
  }
  return grupo;
}
