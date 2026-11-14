// Biblioteca de materiais PBR da cena. Texturas em metros (UV do mundo); `repeat` define o tamanho do ladrilho.
import * as THREE from 'three';
import type { Texturas } from './texturas';

type Std = THREE.MeshStandardMaterialParameters;

function ladrilho(t: THREE.Texture, metros: number): THREE.Texture {
  const c = t.clone();
  c.repeat.set(1 / metros, 1 / metros);
  c.needsUpdate = true;
  return c;
}

export type Materiais = ReturnType<typeof criarMateriais>;

export function criarMateriais(t: Texturas) {
  const clones: THREE.Texture[] = [];
  const lad = (tx: THREE.Texture, m: number) => {
    const c = ladrilho(tx, m);
    clones.push(c);
    return c;
  };
  const std = (o: Std) => new THREE.MeshStandardMaterial(o);
  // Dentro de casa o céu não ilumina direto: o ambiente entra bem mais fraco.
  const INT = 0.3;

  const reboco = lad(t.reboco, 1.6);
  const concreto = lad(t.concreto, 1.2);
  const madeira = lad(t.madeira, 1.3);
  const deck = lad(t.deck, 1.12);
  const piso = lad(t.piso, 1.08);
  const tecido = lad(t.tecido, 0.5);
  const tapete = lad(t.tapete, 0.9);
  const pedra = lad(t.reboco, 0.9);

  const vidro = new THREE.MeshPhysicalMaterial({
    color: '#0c1416',
    roughness: 0.03,
    metalness: 0,
    ior: 1.9,
    transparent: true,
    opacity: 0.07,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.25,
    // O reflexo soma inteiro por cima do que está atrás; só a tinta do vidro é atenuada pela opacidade.
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  vidro.userData = { semSombra: true, semReceber: true, ordem: 20 };
  vidro.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <lights_fragment_end>',
      '#include <lights_fragment_end>\nreflectedLight.directSpecular = vec3(0.0);\nreflectedLight.directDiffuse = vec3(0.0);',
    );
  };
  vidro.customProgramCacheKey = () => 'vidro';

  const luzJanela = new THREE.MeshBasicMaterial({ map: t.cortina, color: new THREE.Color(2.1, 1.5, 0.85) });
  luzJanela.userData = { semSombra: true, semReceber: true };
  const luzJanelaFraca = new THREE.MeshBasicMaterial({ map: t.cortina, color: new THREE.Color(0.5, 0.36, 0.22) });
  luzJanelaFraca.userData = { semSombra: true, semReceber: true };

  const cupula = std({ color: '#f1dcb4', emissive: '#ffae5c', emissiveIntensity: 0.9, roughness: 0.9, side: THREE.DoubleSide });
  cupula.userData = { semSombra: true };
  const ponto = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 3.0, 1.7) });
  ponto.userData = { semSombra: true, semReceber: true };

  const contato = new THREE.MeshBasicMaterial({
    map: t.mancha,
    color: '#000000',
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  contato.userData = { semSombra: true, semReceber: true, ordem: 5 };

  const m = {
    reboco: std({ color: '#e9e1d2', map: reboco, bumpMap: reboco, bumpScale: 0.5, roughness: 0.94 }),
    concreto: std({ color: '#b7b2a8', map: concreto, bumpMap: concreto, bumpScale: 1.4, roughness: 0.86 }),
    pedra: std({ color: '#bdb7aa', map: pedra, bumpMap: pedra, bumpScale: 0.8, roughness: 0.9 }),
    madeira: std({ color: '#ffffff', map: madeira, bumpMap: madeira, bumpScale: 0.5, roughness: 0.62 }),
    deck: std({ color: '#e8dccb', map: deck, bumpMap: deck, bumpScale: 1.6, roughness: 0.74 }),
    forro: std({ color: '#f2e2cc', map: deck, roughness: 0.7 }),
    metal: std({ color: '#25272a', roughness: 0.42, metalness: 0.75 }),
    escuro: std({ color: '#1a1917', roughness: 1 }),
    telhado: std({ color: '#75716a', map: pedra, roughness: 1 }),
    painel: std({ color: '#ffffff', map: t.painel, roughness: 0.18, metalness: 0.35 }),
    agua: std({ color: '#0e2b2e', roughness: 0.05, metalness: 0.05, envMapIntensity: 1.5 }),
    vidro,
    luzJanela,
    luzJanelaFraca,
    cupula,
    ponto,
    contato,
    // interior
    piso: std({ color: '#e4d2b8', map: piso, bumpMap: piso, bumpScale: 0.5, roughness: 0.4, envMapIntensity: 0.5 }),
    tinta: std({ color: '#ece5d8', roughness: 0.95, envMapIntensity: INT, emissive: '#ffd2a0', emissiveIntensity: 0.07 }),
    teto: std({ color: '#f5f1e8', roughness: 0.97, envMapIntensity: 0.12, emissive: '#ffd9ae', emissiveIntensity: 0.16 }),
    marcenaria: std({ color: '#ecd9c0', map: madeira, roughness: 0.55, envMapIntensity: INT }),
    sofa: std({ color: '#a79e8e', map: tecido, bumpMap: tecido, bumpScale: 1.2, roughness: 1, envMapIntensity: INT }),
    almofadaVerde: std({ color: '#586f38', map: tecido, bumpMap: tecido, bumpScale: 1.2, roughness: 1, envMapIntensity: INT }),
    almofadaOuro: std({ color: '#b98a32', map: tecido, bumpMap: tecido, bumpScale: 1.2, roughness: 1, envMapIntensity: INT }),
    tapete: std({ color: '#d9d0bf', map: tapete, bumpMap: tapete, bumpScale: 1.5, roughness: 1, envMapIntensity: INT }),
    cortina: std({ color: '#e8dfcd', emissive: '#c98a4a', emissiveIntensity: 0.12, roughness: 1, side: THREE.DoubleSide, envMapIntensity: INT }),
    ceramica: std({ color: '#e7e0d3', roughness: 0.38, envMapIntensity: INT }),
    grafite: std({ color: '#3b3d3f', roughness: 0.6, envMapIntensity: INT }),
    latao: std({ color: '#a8854a', roughness: 0.38, metalness: 0.85, envMapIntensity: 0.6 }),
    folha: std({ color: '#3f5f2c', roughness: 0.55, side: THREE.DoubleSide, envMapIntensity: INT }),
    quadro: std({ color: '#ffffff', map: t.quadro, roughness: 0.9, envMapIntensity: INT }),
    livro: std({ color: '#7a5a3c', roughness: 0.8, envMapIntensity: INT }),
  };
  m.forro.userData = { semSombra: false };
  m.cortina.userData = { semSombra: true };
  return { ...m, descartarClones: () => clones.forEach((c) => c.dispose()) };
}
