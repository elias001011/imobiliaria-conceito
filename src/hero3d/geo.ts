// Utilitários de geometria: caixas por limites, UV em metros e lotes que fundem tudo por material.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface OpUV {
  escala?: number;
  giro?: boolean; // troca U e V (veio da madeira na vertical)
  manter?: boolean; // mantém o UV original da geometria
  cor?: boolean; // mantém a cor por vértice
}

const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

// Matriz de posição, giro (ry, rx, rz) e escala.
export function M(x = 0, y = 0, z = 0, ry = 0, sx = 1, sy = sx, sz = sx, rx = 0, rz = 0): THREE.Matrix4 {
  _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ'));
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
}

// UV projetado pelo eixo dominante da normal, em metros do mundo: a textura não estica nem recomeça entre peças.
export function uvMundo(g: THREE.BufferGeometry, escala = 1, giro = false): void {
  const p = g.getAttribute('position');
  const n = g.getAttribute('normal');
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    let u: number;
    let v: number;
    if (ay >= ax && ay >= az) {
      u = p.getX(i);
      v = p.getZ(i);
    } else if (ax >= az) {
      u = p.getZ(i);
      v = p.getY(i);
    } else {
      u = p.getX(i);
      v = p.getY(i);
    }
    uv[i * 2] = (giro ? v : u) * escala;
    uv[i * 2 + 1] = (giro ? u : v) * escala;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

// Deixa só posição, normal e uv (e cor, se houver), sem índice, para poder fundir.
export function normalizar(geo: THREE.BufferGeometry, m?: THREE.Matrix4): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const nome of Object.keys(g.attributes)) {
    if (nome !== 'position' && nome !== 'normal' && nome !== 'uv' && nome !== 'color') g.deleteAttribute(nome);
  }
  g.morphAttributes = {};
  if (m) g.applyMatrix4(m);
  return g;
}

interface Item {
  mat: THREE.Material;
  geos: THREE.BufferGeometry[];
}

export class Lote {
  private itens = new Map<THREE.Material, Item>();

  add(mat: THREE.Material, geo: THREE.BufferGeometry, m?: THREE.Matrix4, uv?: OpUV): void {
    const g = normalizar(geo, m);
    if (!uv?.cor) g.deleteAttribute('color');
    if (!uv?.manter || !g.getAttribute('uv')) uvMundo(g, uv?.escala ?? 1, uv?.giro);
    let it = this.itens.get(mat);
    if (!it) {
      it = { mat, geos: [] };
      this.itens.set(mat, it);
    }
    it.geos.push(g);
  }

  bloco(mat: THREE.Material, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, uv?: OpUV): void {
    const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
    this.add(mat, g, M((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), uv);
  }

  // Caixa com arestas chanfradas (raio em metros).
  blocoR(mat: THREE.Material, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, r = 0.012, uv?: OpUV): void {
    const g = new RoundedBoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), 1, r);
    this.add(mat, g, M((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), uv);
  }

  montar(nome: string): THREE.Group {
    const grupo = new THREE.Group();
    grupo.name = nome;
    for (const it of this.itens.values()) {
      const g = mergeGeometries(it.geos, false);
      if (!g) continue;
      const mesh = new THREE.Mesh(g, it.mat);
      mesh.castShadow = it.mat.userData.semSombra !== true;
      mesh.receiveShadow = it.mat.userData.semReceber !== true;
      mesh.renderOrder = it.mat.userData.ordem ?? 0;
      grupo.add(mesh);
    }
    this.itens.clear();
    return grupo;
  }
}

export function caixaR(w: number, h: number, d: number, r = 0.03, seg = 2): THREE.BufferGeometry {
  return new RoundedBoxGeometry(w, h, d, seg, r);
}

// Funde geometrias com cor por vértice (vegetação).
export function fundirCor(gs: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const lista = gs.map((g) => {
    const n = normalizar(g);
    if (!n.getAttribute('uv')) uvMundo(n);
    return n;
  });
  const r = mergeGeometries(lista, false);
  if (!r) throw new Error('falha ao fundir geometrias');
  return r;
}

// Pinta a geometria com uma função de cor por vértice (valores lineares).
export function colorir(
  g: THREE.BufferGeometry,
  fn: (x: number, y: number, z: number, ny: number, i: number) => [number, number, number],
): THREE.BufferGeometry {
  const p = g.getAttribute('position');
  const n = g.getAttribute('normal');
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const k = fn(p.getX(i), p.getY(i), p.getZ(i), n ? n.getY(i) : 1, i);
    c[i * 3] = k[0];
    c[i * 3 + 1] = k[1];
    c[i * 3 + 2] = k[2];
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

export function descartar(raiz: THREE.Object3D): void {
  const mats = new Set<THREE.Material>();
  raiz.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => mats.add(x));
    if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose();
  });
  mats.forEach((m) => m.dispose());
}
