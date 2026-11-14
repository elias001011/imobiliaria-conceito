// Céu de fim de tarde (degradê, halo do sol, nuvens) e bruma que usa a mesma cor do céu em cada direção.
import * as THREE from 'three';
import { cicloCeleste, type CicloCeleste } from './cicloCeleste';

const ciclo: CicloCeleste = { sol: [0, 0, 0], lua: [0, 0, 0], luzSol: 1, luzLua: 0, estrelas: 0, crepusculo: 0 };
cicloCeleste(0, ciclo);
// Direção original da iluminação: não acompanha a animação decorativa dos astros.
const AZ = THREE.MathUtils.degToRad(70);
const EL = THREE.MathUtils.degToRad(9);
export const SOL = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));
export const COR_SOL = new THREE.Color(1.0, 0.63, 0.31);
export const NOITE = { value: 0 };
export const DIRECAO_SOL = { value: new THREE.Vector3().fromArray(ciclo.sol) };
export const DIRECAO_LUA = { value: new THREE.Vector3().fromArray(ciclo.lua) };
export const ESTRELAS = { value: 0 };
export const UNIFORMES_CEU = { hcNoite: NOITE, hcSol: DIRECAO_SOL, hcLua: DIRECAO_LUA, hcEstrelas: ESTRELAS };

export function atualizarCeu(noite: number, vertical = false): CicloCeleste {
  cicloCeleste(noite, ciclo, vertical);
  NOITE.value = noite;
  DIRECAO_SOL.value.fromArray(ciclo.sol);
  DIRECAO_LUA.value.fromArray(ciclo.lua);
  ESTRELAS.value = ciclo.estrelas;
  return ciclo;
}

const f = (n: number) => n.toFixed(5);

// Grama são folhas em pé e acende com sol baixo: inclina a normal para o sol (ou usa uma fixa, nas folhas soltas).
export const GLSL_RASANTE = (quanto: number, fixa: boolean) => {
  const h = Math.hypot(SOL.x, SOL.z);
  const v = `(viewMatrix * vec4(${f((SOL.x / h) * quanto)}, ${fixa ? '1.0' : '0.0'}, ${f((SOL.z / h) * quanto)}, 0.0)).xyz`;
  return fixa ? `normal = normalize(${v});` : `normal = normalize(normal + ${v});`;
};
export function luzRasante(mat: THREE.Material, quanto: number): void {
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n' + GLSL_RASANTE(quanto, true));
  };
  mat.customProgramCacheKey = () => 'rasante' + quanto;
}

// Funções GLSL partilhadas pelo domo e pela bruma. Valores lineares, referidos à cena.
const FUNCOES = /* glsl */ `
uniform float hcNoite;
uniform vec3 hcSol;
uniform vec3 hcLua;
uniform float hcEstrelas;
const vec3 HC_SOL = vec3(${f(SOL.x)}, ${f(SOL.y)}, ${f(SOL.z)});
vec3 hc_ceu(vec3 d) {
  float y = clamp(d.y, 0.0, 1.0);
  vec2 hd = normalize(d.xz + vec2(1e-5));
  // saturar antes do pow: um valor -1e-8 por arredondamento vira NaN e contamina o mapa de ambiente inteiro
  float az = clamp(dot(hd, normalize(HC_SOL.xz)) * 0.5 + 0.5, 0.0, 1.0);
  float perto = pow(az, 1.5);
  vec3 zen = vec3(0.09, 0.17, 0.34);
  vec3 alto = vec3(0.2, 0.31, 0.5);
  // dourado junto ao horizonte do lado do sol; pêssego apagado do lado oposto
  vec3 hor = mix(vec3(0.62, 0.46, 0.4), vec3(1.8, 1.0, 0.36), perto);
  vec3 meio = mix(vec3(0.34, 0.39, 0.52), vec3(1.0, 0.64, 0.37), perto);
  float t = sqrt(y);
  vec3 c = mix(hor, meio, smoothstep(0.0, 0.3, t));
  c = mix(c, alto, smoothstep(0.2, 0.64, t));
  c = mix(c, zen, smoothstep(0.5, 1.0, t));
  float fx = (y - 0.12) / 0.08;
  c += vec3(0.09, 0.03, 0.04) * (1.0 - az) * exp(-fx * fx);
  float cs = clamp(dot(normalize(d), HC_SOL), 0.0, 1.0);
  c += vec3(1.5, 0.74, 0.27) * pow(cs, 7.0) * 0.5;
  vec3 noturno = mix(vec3(0.018, 0.028, 0.065), vec3(0.002, 0.005, 0.018), sqrt(y));
  return mix(c, noturno, hcNoite);
}
// Clarão em volta do sol: só no céu. Na bruma ele lavaria as árvores em contraluz.
vec3 hc_halo(vec3 d) {
  float cs = clamp(dot(d, HC_SOL), 0.0, 1.0);
  return (1.0 - hcNoite) * vec3(2.4, 1.35, 0.5) * (pow(cs, 48.0) * 0.9 + pow(cs, 700.0) * 2.5);
}
// Cor da bruma: o céu junto ao horizonte naquela direção.
vec3 hc_bruma(vec3 d) {
  vec3 h = normalize(vec3(d.x, 0.035 + max(d.y, 0.0) * 0.25, d.z));
  return hc_ceu(h) * 0.84;
}
`;

const NUVENS = /* glsl */ `
float hc_h21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float hc_vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hc_h21(i), hc_h21(i + vec2(1.0, 0.0)), f.x), mix(hc_h21(i + vec2(0.0, 1.0)), hc_h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float hc_fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < HC_OITAVAS; i++) {
    s += a * hc_vn(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return s;
}
vec3 hc_nuvens(vec3 d, vec3 c) {
  if (d.y < 0.012) return c;
  vec2 uv = d.xz / (d.y + 0.16);
  uv = mat2(0.82, -0.57, 0.57, 0.82) * uv;
  uv *= vec2(0.34, 1.05);
  float n = hc_fbm(uv * 0.85 + vec2(3.7, 1.3));
  float fino = hc_fbm(uv * 2.6 + vec2(-1.9, 6.1));
  float cob = smoothstep(0.47, 0.72, n * 0.72 + fino * 0.28);
  cob *= smoothstep(0.012, 0.11, d.y) * (1.0 - smoothstep(0.55, 0.95, d.y) * 0.6);
  float az = clamp(dot(normalize(d.xz + vec2(1e-5)), normalize(HC_SOL.xz)) * 0.5 + 0.5, 0.0, 1.0);
  float cs = max(dot(d, HC_SOL), 0.0);
  vec3 luz = mix(vec3(0.8, 0.56, 0.5), vec3(1.9, 1.02, 0.5), pow(az, 1.6)) + vec3(1.6, 0.8, 0.3) * pow(cs, 10.0);
  vec3 sombra = mix(vec3(0.27, 0.3, 0.42), vec3(0.5, 0.33, 0.3), az);
  vec3 cn = mix(luz, sombra, smoothstep(0.25, 0.95, cob));
  return mix(c, mix(cn, vec3(0.025, 0.035, 0.065), hcNoite), cob * mix(0.68, 0.24, hcNoite));
}
`;

let instalada = false;

// A bruma padrão do three mistura uma cor fixa depois do tone mapping; aqui ela entra antes, em HDR, com a cor do céu.
export function instalarBruma(): void {
  if (instalada) return;
  instalada = true;
  const C = THREE.ShaderChunk;
  C.fog_pars_vertex = /* glsl */ `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogDir;
#endif
`;
  C.fog_vertex = /* glsl */ `
#ifdef USE_FOG
  vFogDepth = length(mvPosition.xyz);
  vFogDir = (vec4(mvPosition.xyz, 0.0) * viewMatrix).xyz;
#endif
`;
  C.fog_pars_fragment = /* glsl */ `
#ifdef USE_FOG
  uniform vec3 fogColor;
  uniform float fogDensity;
  varying float vFogDepth;
  varying vec3 vFogDir;
  ${FUNCOES}
#endif
`;
  C.fog_fragment = '';
  C.opaque_fragment = /* glsl */ `
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
#ifdef USE_FOG
  float hcFog = 1.0 - exp(-pow(vFogDepth * fogDensity, 1.5));
  outgoingLight = mix(outgoingLight, hc_bruma(vFogDir), hcFog);
#endif
gl_FragColor = vec4(outgoingLight, diffuseColor.a);
`;
}

function materialCeu(ambiente: boolean, oitavas: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: UNIFORMES_CEU,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    dithering: !ambiente,
    defines: { HC_OITAVAS: oitavas, ...(ambiente ? { HC_AMBIENTE: 1 } : {}) },
    vertexShader: /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  #ifdef HC_AMBIENTE
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #else
    vec4 p = viewMatrix * vec4(position, 0.0);
    gl_Position = projectionMatrix * vec4(p.xyz, 1.0);
    gl_Position.z = gl_Position.w;
  #endif
}
`,
    fragmentShader: /* glsl */ `
#include <common>
#include <dithering_pars_fragment>
varying vec3 vDir;
${FUNCOES}
${NUVENS}
void main() {
  vec3 d = normalize(vDir);
  vec3 c = hc_ceu(d);
  #ifdef HC_AMBIENTE
    // Para iluminar: sem disco do sol (a luz direcional já faz esse papel) e com o chão devolvendo luz esverdeada.
    c += hc_halo(d) * 0.5;
    vec3 chao = vec3(0.095, 0.085, 0.055) + vec3(0.1, 0.07, 0.035) * max(dot(normalize(d.xz + vec2(1e-5)), normalize(HC_SOL.xz)), 0.0);
    c = mix(c, chao, 1.0 - smoothstep(-0.08, 0.02, d.y));
  #else
    c += hc_halo(d);
    c = hc_nuvens(d, c);
    float cs = max(dot(d, hcSol), 0.0);
    c += (1.0 - hcNoite) * (vec3(30.0, 18.0, 7.0) * smoothstep(0.99975, 0.99996, cs) + vec3(3.0, 1.6, 0.5) * pow(cs, 2500.0));
    vec2 st = vec2(atan(d.z, d.x), asin(d.y)) * 330.0;
    float star = step(0.996, hc_h21(floor(st))) * pow(max(0.0, 1.0 - length(fract(st) - 0.5) * 2.0), 9.0);
    c += hcEstrelas * vec3(0.65, 0.75, 1.0) * star * smoothstep(0.05, 0.3, d.y);
    float moon = dot(d, hcLua);
    float discoLua = smoothstep(0.99979, 0.99985, moon);
    vec3 luaX = normalize(cross(hcLua, vec3(0.0, 1.0, 0.0)));
    vec3 luaY = cross(luaX, hcLua);
    vec2 luaUV = vec2(dot(d, luaX), dot(d, luaY)) * 48.0;
    float relevo = 0.78 + 0.14 * hc_vn(luaUV * 13.0) + 0.08 * hc_vn(luaUV * 31.0);
    float bordo = sqrt(max(0.0, 1.0 - dot(luaUV, luaUV)));
    c += hcNoite * vec3(0.72, 0.82, 1.0) * (discoLua * relevo * (0.72 + bordo * 0.28) + pow(max(moon,0.0), 110.0) * 0.045);
    c = mix(c, hc_bruma(d), 1.0 - smoothstep(-0.02, 0.03, d.y));
  #endif
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <dithering_fragment>
}
`,
  });
}

export function criarDomo(baixa: boolean): THREE.Mesh {
  const domo = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), materialCeu(false, baixa ? 3 : 5));
  domo.frustumCulled = false;
  domo.renderOrder = 900; // por último entre os opacos: só pinta o que sobrou de céu
  domo.matrixAutoUpdate = false;
  return domo;
}

// Mapa de ambiente (PMREM) gerado do próprio céu, para luz difusa e reflexos coerentes com o que se vê.
export function criarAmbiente(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const cena = new THREE.Scene();
  const mat = materialCeu(true, 1);
  const esfera = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), mat);
  cena.add(esfera);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(cena, 0.02, 0.1, 100);
  pmrem.dispose();
  esfera.geometry.dispose();
  mat.dispose();
  return rt;
}
