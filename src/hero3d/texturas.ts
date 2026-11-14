// Texturas procedurais pintadas em canvas na carga: nenhum arquivo de imagem é baixado.
import * as THREE from 'three';
import { fbm, hash2, mix, ruido, suave } from './ruido';

type RGB = [number, number, number];
type Pixel = (u: number, v: number, x: number, y: number) => RGB | [number, number, number, number];

function pintar(n: number, m: number, fn: Pixel): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = n;
  c.height = m;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('canvas 2d indisponível');
  const img = ctx.createImageData(n, m);
  const d = img.data;
  let k = 0;
  for (let y = 0; y < m; y++) {
    for (let x = 0; x < n; x++) {
      const p = fn(x / n, y / m, x, y);
      d[k++] = p[0] * 255;
      d[k++] = p[1] * 255;
      d[k++] = p[2] * 255;
      d[k++] = (p[3] ?? 1) * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function textura(c: HTMLCanvasElement, aniso: number, cor = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = cor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = aniso;
  return t;
}

const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

function reboco(n: number) {
  return pintar(n, n, (u, v, x, y) => {
    const mancha = fbm(u * 6, v * 6, 4, 6, 6);
    const grao = hash2(x, y) * 0.5 + ruido(u * 90, v * 90, 90, 90) * 0.5;
    const k = 0.84 + mancha * 0.11 + (grao - 0.5) * 0.1;
    return [k, k, k];
  });
}

// Concreto com marcas de fôrma de tábua (faixas horizontais) e furos de amarração.
function concreto(n: number) {
  const faixas = 8;
  return pintar(n, n, (u, v, x, y) => {
    const f = Math.floor(v * faixas);
    const fv = v * faixas - f;
    const tom = (hash2(f, 3) - 0.5) * 0.07;
    const veio = (fbm(u * 3 + f * 5, v * 70, 3, 3, 70) - 0.5) * 0.09;
    const mancha = (fbm(u * 4, v * 4, 4, 4, 4) - 0.5) * 0.22;
    const escorrido = (fbm(u * 22, v * 2, 3, 22, 2) - 0.5) * 0.08;
    let k = 0.7 + tom + veio + mancha + escorrido + (hash2(x, y) - 0.5) * 0.05;
    k *= 1 - 0.3 * (1 - suave(0, 0.045, Math.min(fv, 1 - fv)));
    const fx = (u * 4) % 1;
    const fy = (v * 2) % 1;
    const furo = Math.hypot((fx - 0.5) / 4, (fy - 0.5) / 2);
    k *= 1 - 0.4 * (1 - suave(0.004, 0.009, furo));
    return [k, k * 0.985, k * 0.955];
  });
}

// Madeira: veio ao longo de U; com `tabuas` > 1 vira assoalho/deck com juntas.
function madeira(n: number, tabuas: number, escura: RGB, clara: RGB, sem: number, junta = 0.5) {
  return pintar(n, n, (u, v, x, y) => {
    const t = Math.floor(v * tabuas);
    const fv = v * tabuas - t;
    const h = hash2(t, sem);
    const des = Math.floor(h * 16);
    const veio = fbm(u * 4 + des, v * 48 + des, 4, 4, 48);
    const anel = 0.5 + 0.5 * Math.sin((veio * 5 + u * 2 + h * 4) * 6.2832);
    let k = 0.2 + veio * 0.5 + anel * 0.16 + (h - 0.5) * (tabuas > 1 ? 0.5 : 0);
    k += (hash2(x, y) - 0.5) * 0.06;
    let c = mixRGB(escura, clara, Math.min(1, Math.max(0, k)));
    if (tabuas > 1) {
      const borda = 1 - suave(0, 0.035, Math.min(fv, 1 - fv));
      const topo = 1 - suave(0, 0.004, Math.abs(((u + h * 0.83) % 1) - 0.5));
      const s = 1 - junta * Math.max(borda, topo);
      c = [c[0] * s, c[1] * s, c[2] * s];
    }
    return c;
  });
}

function grama(n: number) {
  return pintar(n, n, (u, v, x, y) => {
    const a = fbm(u * 8, v * 8, 4, 8, 8);
    const b = fbm(u * 40 + 5, v * 40 + 9, 3, 40, 40);
    const g = hash2(x, y);
    const k = 0.62 + a * 0.2 + b * 0.16 + (g - 0.5) * 0.14;
    const seco = suave(0.55, 0.8, fbm(u * 5 + 31, v * 5 + 17, 3, 5, 5)) * 0.1;
    return [k * (0.96 + seco), k, k * (0.9 - seco)];
  });
}

// Folhagem: massas claras e vãos escuros entre folhas, para a copa não parecer pedra lisa.
function folhagem(n: number) {
  return pintar(n, n, (u, v) => {
    const a = fbm(u * 10, v * 10, 3, 10, 10);
    const b = ruido(u * 46 + 3, v * 46 + 7, 46, 46);
    const c = ruido(u * 120, v * 120, 120, 120);
    const vao = 1 - suave(0.26, 0.42, b);
    const luz = suave(0.58, 0.85, b);
    const k = Math.min(1, Math.max(0.3, 0.74 + (a - 0.5) * 0.24 + luz * 0.2 - vao * 0.24 + (c - 0.5) * 0.12));
    return [k * 0.97, k, k * 0.8];
  });
}

// Estrada de chão: duas trilhas de terra vermelha com capim no meio; bordas somem em alfa.
function estrada(n: number) {
  const terra = hex('#8d5f47');
  const terraClara = hex('#b08666');
  const capim = hex('#6c7a3c');
  return pintar(n, n, (u, v, x, y) => {
    const ond = (fbm(v * 6, 2.3, 3, 6, 0) - 0.5) * 0.08;
    const du = Math.abs(u - 0.5 + ond);
    const trilha = suave(0.07, 0.13, du) * (1 - suave(0.3, 0.38, du));
    const pedr = fbm(u * 30, v * 30, 3, 30, 30);
    let c = mixRGB(terra, terraClara, pedr * 0.9 + (hash2(x, y) - 0.5) * 0.3);
    const meio = (1 - trilha) * (0.55 + 0.45 * fbm(u * 14 + 3, v * 14, 3, 14, 14));
    c = mixRGB(c, capim, Math.min(1, meio * 0.8));
    const borda = 1 - suave(0.32, 0.48, du + (fbm(u * 9, v * 9, 3, 9, 9) - 0.5) * 0.12);
    return [c[0], c[1], c[2], borda];
  });
}

function tecido(n: number) {
  return pintar(n, n, (u, v, x, y) => {
    const tx = 0.5 + 0.5 * Math.sin(u * 6.2832 * 64);
    const ty = 0.5 + 0.5 * Math.sin(v * 6.2832 * 64);
    const k = 0.82 + (tx * ty) * 0.1 + (fbm(u * 10, v * 10, 3, 10, 10) - 0.5) * 0.1 + (hash2(x, y) - 0.5) * 0.06;
    return [k, k, k];
  });
}

function tapete(n: number) {
  return pintar(n, n, (u, v, x, y) => {
    const fio = 0.5 + 0.5 * Math.sin(v * 6.2832 * 90);
    const lista = suave(0.46, 0.5, Math.abs(((u * 6) % 1) - 0.5)) * 0.07;
    const k = 0.84 + fio * 0.07 - lista + (fbm(u * 8, v * 8, 3, 8, 8) - 0.5) * 0.1 + (hash2(x, y) - 0.5) * 0.05;
    return [k, k * 0.985, k * 0.95];
  });
}

// Cortina iluminada por dentro, para as janelas dos cômodos que não são modelados.
function cortina() {
  return pintar(64, 128, (u, v) => {
    const prega = 0.72 + 0.28 * Math.sin(u * 6.2832 * 7 + Math.sin(u * 23) * 0.8);
    const alto = mix(1, 0.55, suave(0.35, 1, v));
    const k = prega * alto;
    return [k, k * 0.86, k * 0.62];
  });
}

function painelSolar() {
  return pintar(128, 256, (u, v, x, y) => {
    const cx = Math.abs(((u * 6) % 1) - 0.5);
    const cy = Math.abs(((v * 10) % 1) - 0.5);
    const linha = Math.max(suave(0.44, 0.49, cx), suave(0.46, 0.49, cy));
    const k = 0.05 + (hash2(x >> 2, y >> 2) - 0.5) * 0.015;
    return [mix(k * 0.75, 0.42, linha), mix(k * 0.95, 0.45, linha), mix(k * 1.7, 0.5, linha)];
  });
}

// Quadro abstrato da sala: horizonte em faixas com um sol baixo, nas cores da marca.
function quadro() {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 256;
  const g = c.getContext('2d');
  if (!g) throw new Error('canvas 2d indisponível');
  const ceu = g.createLinearGradient(0, 0, 0, 150);
  ceu.addColorStop(0, '#d9d2c2');
  ceu.addColorStop(1, '#e7cf9a');
  g.fillStyle = ceu;
  g.fillRect(0, 0, 384, 256);
  g.fillStyle = '#d99a2e';
  g.beginPath();
  g.arc(262, 138, 44, 0, Math.PI * 2);
  g.fill();
  const faixa = (y0: number, cor: string, amp: number, fase: number) => {
    g.fillStyle = cor;
    g.beginPath();
    g.moveTo(0, 256);
    for (let x = 0; x <= 384; x += 8) g.lineTo(x, y0 + Math.sin(x * 0.012 + fase) * amp + Math.sin(x * 0.031 + fase * 2) * amp * 0.4);
    g.lineTo(384, 256);
    g.fill();
  };
  faixa(150, '#8f9a5b', 10, 0.4);
  faixa(176, '#5f7a35', 12, 2.1);
  faixa(206, '#3b4a2c', 9, 4.0);
  faixa(232, '#2e3130', 5, 1.2);
  const img = g.getImageData(0, 0, 384, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const r = (hash2(i, 7) - 0.5) * 18;
    img.data[i] += r;
    img.data[i + 1] += r;
    img.data[i + 2] += r;
  }
  g.putImageData(img, 0, 0);
  return c;
}

// Mancha radial macia para sombras de contato sob os móveis.
function mancha() {
  return pintar(64, 64, (u, v) => {
    const d = Math.hypot(u - 0.5, v - 0.5) * 2;
    const a = Math.pow(1 - suave(0.15, 1, d), 1.4);
    return [0, 0, 0, a];
  });
}

export interface Texturas {
  reboco: THREE.Texture;
  concreto: THREE.Texture;
  madeira: THREE.Texture;
  deck: THREE.Texture;
  piso: THREE.Texture;
  grama: THREE.Texture;
  folhagem: THREE.Texture;
  estrada: THREE.Texture;
  tecido: THREE.Texture;
  tapete: THREE.Texture;
  cortina: THREE.Texture;
  painel: THREE.Texture;
  quadro: THREE.Texture;
  mancha: THREE.Texture;
}

export function criarTexturas(aniso: number, baixa: boolean): Texturas {
  const n = baixa ? 256 : 512;
  const t: Texturas = {
    reboco: textura(reboco(256), aniso),
    concreto: textura(concreto(n), aniso),
    madeira: textura(madeira(n, 1, hex('#5b3a22'), hex('#a8733f'), 5), aniso),
    deck: textura(madeira(n, 8, hex('#6a4a30'), hex('#b08a5c'), 11, 0.7), aniso),
    piso: textura(madeira(n, 6, hex('#a57a4c'), hex('#d4ae7a'), 23, 0.3), aniso),
    grama: textura(grama(n), aniso),
    folhagem: textura(folhagem(n), aniso),
    estrada: textura(estrada(256), aniso),
    tecido: textura(tecido(256), aniso),
    tapete: textura(tapete(256), aniso),
    cortina: textura(cortina(), 1),
    painel: textura(painelSolar(), aniso),
    quadro: textura(quadro(), aniso),
    mancha: textura(mancha(), 1),
  };
  t.quadro.wrapS = t.quadro.wrapT = THREE.ClampToEdgeWrapping;
  t.mancha.wrapS = t.mancha.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
