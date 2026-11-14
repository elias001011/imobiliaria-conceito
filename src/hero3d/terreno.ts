// Terreno: coxilhas suaves, lavouras ao longe (no shader), estrada de chão até a casa.
import * as THREE from 'three';
import { GLSL_RASANTE, SOL } from './ceu';
import { fbm, suave } from './ruido';
import type { Texturas } from './texturas';

export const CENTRO = { x: 2, z: 0 }; // centro do platô onde a casa assenta
const SOL_H = new THREE.Vector2(SOL.x, SOL.z).normalize();

export function altura(x: number, z: number): number {
  const dx = x - CENTRO.x;
  const dz = z - CENTRO.z;
  const r = Math.hypot(dx, dz);
  if (r < 17) return 0;
  const a = suave(17, 170, r);
  const n = fbm(x * 0.0065 + 11.3, z * 0.0065 + 4.1, 4) - 0.5;
  const m = fbm(x * 0.021 + 3.3, z * 0.021 + 8.8, 3) - 0.5;
  let h = (n * 13 + m * 3) * a;
  // O campo cai de leve para o lado do sol: abre o horizonte visto da janela da sala.
  const paraSol = (dx * SOL_H.x + dz * SOL_H.y) / Math.max(r, 1);
  h -= suave(24, 260, r) * (3.5 + 8 * Math.max(0, paraSol));
  // Morros ao fundo, mais baixos na direção do sol.
  const morro = 0.35 + 0.65 * fbm(x * 0.004 + 40.7, z * 0.004 + 12.9, 3);
  h += suave(190, 400, r) * morro * 24 * (1 - 0.8 * Math.max(0, paraSol) ** 2);
  return h;
}

// Eixo da estrada: vem do fundo do vale, faz uma curva e chega de frente para a porta.
const EIXO: [number, number][] = [
  [26, 190],
  [10, 140],
  [-4, 104],
  [-11, 74],
  [-11.5, 52],
  [-8, 35],
  [-3.2, 23],
  [0.3, 15],
  [0.3, 9.4],
];

let curva: THREE.CatmullRomCurve3 | null = null;
function eixoEstrada(): THREE.CatmullRomCurve3 {
  if (!curva) curva = new THREE.CatmullRomCurve3(EIXO.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  return curva;
}

let amostras: THREE.Vector3[] | null = null;
// Distância horizontal até o eixo da estrada (para não plantar nada em cima dela).
export function distEstrada(x: number, z: number): number {
  if (!amostras) amostras = eixoEstrada().getSpacedPoints(90);
  let d = Infinity;
  for (const p of amostras) d = Math.min(d, Math.hypot(p.x - x, p.z - z));
  return d;
}

const cor = (h: string) => new THREE.Color(h);

export function criarTerreno(t: Texturas, baixa: boolean): THREE.Mesh {
  const N = baixa ? 96 : 168;
  const LADO = 420;
  const g = new THREE.PlaneGeometry(2, 2, N, N);
  g.rotateX(-Math.PI / 2);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const cores = new Float32Array(p.count * 3);
  const gramado = cor('#56683a');
  const pasto = cor('#62703a');
  const pastoClaro = cor('#7f8646');
  const seco = cor('#9c9464');
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    // Malha mais densa perto da casa.
    const u = p.getX(i);
    const v = p.getZ(i);
    const x = CENTRO.x + Math.sign(u) * Math.pow(Math.abs(u), 1.5) * LADO;
    const z = CENTRO.z + Math.sign(v) * Math.pow(Math.abs(v), 1.5) * LADO;
    p.setXYZ(i, x, altura(x, z), z);
    const r = Math.hypot(x - CENTRO.x, z - CENTRO.z);
    const a = fbm(x * 0.045 + 9, z * 0.045 + 2, 3);
    c.copy(pasto).lerp(pastoClaro, a);
    c.lerp(seco, suave(0.5, 0.78, fbm(x * 0.013 + 70, z * 0.013 + 33, 3)) * 0.75);
    c.lerp(gramado, 1 - suave(19, 34, r + (a - 0.5) * 10));
    cores[i * 3] = c.r;
    cores[i * 3 + 1] = c.g;
    cores[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  g.computeVertexNormals();
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 3.2, p.getZ(i) / 3.2);

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: t.grama, roughness: 1, envMapIntensity: 0.7 });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vHcPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHcPos = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
varying vec3 vHcPos;
float hcH(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float hcVn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hcH(i), hcH(i + vec2(1.0, 0.0)), f.x), mix(hcH(i + vec2(0.0, 1.0)), hcH(i + vec2(1.0, 1.0)), f.x), f.y);
}
// Gramado nunca é de uma cor só: manchas mais secas, mais escuras e um grão fino.
vec3 hcGrama(vec3 base, vec3 pos) {
  float a = hcVn(pos.xz * 0.11 + 3.1) * 0.65 + hcVn(pos.xz * 0.27 + 9.4) * 0.35;
  vec3 g = base * (0.76 + 0.4 * a);
  g = mix(g, g * vec3(1.22, 1.08, 0.7), smoothstep(0.5, 0.85, hcVn(pos.xz * 0.6 + 17.0)) * 0.4);
  g = mix(g, g * vec3(0.78, 0.9, 0.8), smoothstep(0.5, 0.9, hcVn(pos.xz * 0.33 + 40.0)) * 0.5);
  return g * (0.9 + 0.2 * hcVn(pos.xz * 3.3));
}
// Talhões de lavoura do norte gaúcho: palha dourada, soja verde, terra vermelha lavrada e pasto.
vec3 hcLavoura(vec3 base, vec3 pos) {
  float r = length(pos.xz - vec2(${CENTRO.x.toFixed(1)}, ${CENTRO.z.toFixed(1)}));
  float m = smoothstep(80.0, 120.0, r);
  if (m <= 0.0) return base;
  vec2 q = mat2(0.94, -0.34, 0.34, 0.94) * pos.xz;
  q /= vec2(130.0, 86.0);
  q.x += 0.3 * sin(q.y * 1.7);
  q.y += 0.2 * sin(q.x * 1.3);
  vec2 id = floor(q);
  vec2 f = fract(q);
  float h = hcH(id);
  vec3 c = base;
  if (h < 0.3) c = vec3(0.47, 0.38, 0.15);
  else if (h < 0.56) c = vec3(0.13, 0.22, 0.055);
  else if (h < 0.7) c = vec3(0.27, 0.125, 0.075);
  float divisa = smoothstep(0.0, 0.025, f.x) * smoothstep(1.0, 0.975, f.x) * smoothstep(0.0, 0.035, f.y) * smoothstep(1.0, 0.965, f.y);
  c = mix(base * 0.62, c, divisa);
  // linhas de plantio, só onde não viram ruído
  float linhas = 0.5 + 0.5 * sin((q.x * 130.0 + q.y * 30.0 * (h - 0.5)) * 1.9);
  c *= 1.0 - 0.1 * linhas * (1.0 - smoothstep(110.0, 220.0, r));
  return mix(base, c, m);
}`,
      )
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = hcLavoura(hcGrama(diffuseColor.rgb, vHcPos), vHcPos);')
      .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n' + GLSL_RASANTE(0.75, false));
  };
  mat.customProgramCacheKey = () => 'terreno';
  const mesh = new THREE.Mesh(g, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terreno';
  return mesh;
}

export function criarEstrada(t: Texturas): THREE.Mesh {
  const curvaE = eixoEstrada();
  const N = 150;
  const L = 6;
  const meia = 1.9;
  const pts = curvaE.getSpacedPoints(N);
  const comp = curvaE.getLength();
  const pos: number[] = [];
  const uvs: number[] = [];
  const cores: number[] = [];
  const idx: number[] = [];
  const tan = new THREE.Vector3();
  for (let i = 0; i <= N; i++) {
    curvaE.getTangentAt(i / N, tan);
    const nx = tan.z;
    const nz = -tan.x;
    const s = (i / N) * comp;
    // some no começo (longe) e na chegada, onde entram as lajotas
    const alfa = suave(0, 14, s) * (1 - suave(comp - 2.2, comp - 0.2, s));
    for (let j = 0; j <= L; j++) {
      const k = (j / L) * 2 - 1;
      const x = pts[i].x + nx * k * meia;
      const z = pts[i].z + nz * k * meia;
      pos.push(x, altura(x, z) + 0.03, z);
      uvs.push(j / L, s / 3.8);
      cores.push(1, 1, 1, alfa);
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < L; j++) {
      const a = i * (L + 1) + j;
      const b = a + L + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 4));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    map: t.estrada,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    roughness: 1,
    envMapIntensity: 0.7,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.receiveShadow = true;
  mesh.renderOrder = 2;
  mesh.name = 'estrada';
  return mesh;
}
