// Monta a cena inteira e expõe o que o componente precisa: atualizar por progresso, redimensionar e descartar.
import * as THREE from 'three';
import type { HeroLayout, HeroQuality } from '../hero/contract';
import { criarCasa } from './casa';
import { COR_SOL, criarAmbiente, criarDomo, instalarBruma, SOL, atualizarCeu, UNIFORMES_CEU } from './ceu';
import { descartar } from './geo';
import { criarInterior } from './interior';
import { criarMateriais } from './materiais';
import { suave } from './ruido';
import { altura, CENTRO, criarEstrada, criarTerreno } from './terreno';
import { criarTexturas } from './texturas';
import { criarTrilho, type Quadro } from './trilho';
import { criarVegetacao } from './vegetacao';

export interface Cena {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  // Avança a câmera até o progresso pedido; devolve true enquanto ainda há movimento.
  atualizar(progresso: number, dt: number, mx: number, my: number): boolean;
  tema(escuro: boolean, imediato?: boolean): void;
  progresso(): number;
  encaixar(progresso: number): void;
  formato(layout: HeroLayout, aspecto: number): void;
  descartar(): void;
}

const LAMBDA = 1.9; // amortecimento do progresso (1/s)
const DURACAO_TEMA = 2.1; // s: percurso do sol e da lua, sem reconstruir a cena

export async function criarCena(renderer: THREE.WebGLRenderer, qualidade: HeroQuality, respiro: () => Promise<void>): Promise<Cena> {
  const baixa = qualidade === 'low';
  instalarBruma();

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xffffff, 0.0019);
  const camera = new THREE.PerspectiveCamera(32, 1.6, 0.3, 1400);

  const aniso = Math.min(baixa ? 2 : 8, renderer.capabilities.getMaxAnisotropy());
  const tex = criarTexturas(aniso, baixa);
  const mats = criarMateriais(tex);
  await respiro();

  atualizarCeu(0);
  const ambiente = criarAmbiente(renderer);
  scene.environment = ambiente.texture;
  scene.environmentIntensity = 0.9;
  const domo = criarDomo(baixa);
  scene.add(domo);

  scene.add(criarTerreno(tex, baixa), criarEstrada(tex));
  await respiro();
  const casa = criarCasa(mats);
  scene.add(casa.grupo);
  await respiro();
  scene.add(criarInterior(mats));
  await respiro();
  scene.add(criarVegetacao(tex, baixa));
  await respiro();

  // Sol baixo: a caixa de sombra é estreita na vertical da luz e por isso rende bem nos 2048 px.
  const sol = new THREE.DirectionalLight(COR_SOL, 6.5);
  const centro = new THREE.Vector3(CENTRO.x, 0, CENTRO.z);
  sol.position.copy(centro).addScaledVector(SOL, 100);
  sol.target.position.copy(centro);
  sol.castShadow = true;
  const sh = sol.shadow;
  sh.mapSize.setScalar(baixa ? 1024 : 2048);
  sh.camera.left = -29;
  sh.camera.right = 29;
  sh.camera.bottom = -8;
  sh.camera.top = 14;
  sh.camera.near = 45; // só o que está a até ~55 m para o lado do sol projeta sombra na casa
  sh.camera.far = 215;
  sh.bias = -0.0005;
  sh.normalBias = 0.035;
  sh.radius = baixa ? 1.6 : 2.4;
  scene.add(sol, sol.target);

  // Luzes quentes de dentro: sem sombra, alcance curto.
  const quente = new THREE.Color('#ffc590');
  const luzes: { l: THREE.PointLight; base: number }[] = [];
  const luz = (x: number, y: number, z: number, i: number, alcance: number) => {
    const l = new THREE.PointLight(quente, i, alcance, 2);
    l.position.set(x, y, z);
    scene.add(l);
    luzes.push({ l, base: i });
    return l;
  };
  luz(5.0, 1.0, -0.4, 10, 13); // preenchimento da sala (faz as vezes da luz rebatida no piso)
  luz(0.3, 2.5, -1.3, 4, 7); // hall
  luz(7.5, 1.72, -2.55, 6, 9); // luminária de piso
  luz(0.3, 2.85, 2.6, 5, 7); // nicho da entrada
  if (!baixa) luz(3.5, 1.95, 1.85, 6, 8); // pendentes do jantar

  // Todos os materiais com bruma compartilham o mesmo estado de noite.
  const materiais = new Set<THREE.Material>();
  scene.traverse(o => { if(o instanceof THREE.Mesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materiais.add(m)); });
  materiais.forEach(m => {
    const anterior = m.onBeforeCompile;
    const chave = m.customProgramCacheKey();
    m.customProgramCacheKey = () => chave + "-tema";
    m.onBeforeCompile = (shader, r) => { anterior.call(m, shader, r); Object.assign(shader.uniforms, UNIFORMES_CEU); };
  });
  const COR_LUA = new THREE.Color('#8caeff');
  let noite = 0; // 0 = dia, 1 = noite (animado)
  let noiteAlvo = 0;
  let layout: HeroLayout = 'wide';
  let trilho = criarTrilho(layout);
  const q: Quadro = { pos: [0, 0, 0], alvo: [0, 0, 0], fov: 32, sx: 0, sy: 0, exp: 1 };
  const alvo = new THREE.Vector3();
  let ps = 0;
  let px = 0;
  let py = 0;

  // Só uniformes e intensidades: nenhum material é recompilado e nenhuma geometria é recriada.
  const iluminar = () => {
    const n = noite * noite * (3 - 2 * noite);
    atualizarCeu(n, layout === 'tall');
    // Valores e direção originais, independentes dos discos visuais no céu.
    scene.environmentIntensity = 0.9 + (0.13 - 0.9) * n;
    sol.intensity = 6.5 + (0.42 - 6.5) * n;
    sol.color.copy(COR_SOL).lerp(COR_LUA, n);
    for (const { l, base } of luzes) l.intensity = base * (1 + 0.5 * n);
  };
  const aplicar = () => {
    trilho(ps, q);
    let y = q.pos[1];
    // fora de casa a câmera nunca desce abaixo do relevo
    if (ps < 0.7) y = Math.max(y, altura(q.pos[0], q.pos[2]) + 1.4);
    camera.position.set(q.pos[0], y, q.pos[2]);
    const ajuste = layout === 'wide' ? Math.max(1, 1.8 / camera.aspect) : 1;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(q.fov / 2)) * ajuste));
    camera.near = 0.3 - 0.22 * suave(0.6, 0.72, ps);
    camera.lookAt(alvo.set(q.alvo[0], q.alvo[1], q.alvo[2]));
    if (px !== 0 || py !== 0) {
      camera.rotateY(-px * 0.013);
      camera.rotateX(py * 0.008);
    }
    camera.updateProjectionMatrix();
    const e = camera.projectionMatrix.elements;
    e[8] = -q.sx;
    e[9] = -q.sy;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    casa.porta.rotation.y = suave(0.64, 0.78, ps) * 1.52;
    renderer.toneMappingExposure = q.exp * (1 - 0.15 * noite);
  };

  return {
    scene,
    camera,
    tema(escuro, imediato = false) {
      noiteAlvo = escuro ? 1 : 0;
      if (imediato) {
        noite = noiteAlvo;
        iluminar();
        aplicar();
      }
    },
    atualizar(progresso, dt, mx, my) {
      let tema = false;
      if (noite !== noiteAlvo) {
        const passo = dt / DURACAO_TEMA;
        noite = noite < noiteAlvo ? Math.min(noiteAlvo, noite + passo) : Math.max(noiteAlvo, noite - passo);
        iluminar();
        tema = true;
      }
      const k = 1 - Math.exp(-LAMBDA * dt);
      ps += (progresso - ps) * k;
      if (Math.abs(progresso - ps) < 0.0002) ps = progresso;
      const k2 = 1 - Math.exp(-3 * dt);
      px += (mx - px) * k2;
      py += (my - py) * k2;
      if (Math.abs(mx - px) < 0.002) px = mx;
      if (Math.abs(my - py) < 0.002) py = my;
      aplicar();
      return tema || ps !== progresso || px !== mx || py !== my;
    },
    progresso: () => ps,
    encaixar(progresso) {
      ps = progresso;
      aplicar();
    },
    formato(novo, aspecto) {
      if (novo !== layout) {
        layout = novo;
        trilho = criarTrilho(layout);
        iluminar();
      }
      camera.aspect = aspecto;
      aplicar();
    },
    descartar() {
      descartar(scene);
      Object.values(tex).forEach((t) => (t as THREE.Texture).dispose());
      mats.descartarClones();
      ambiente.dispose();
      sol.shadow.dispose();
    },
  };
}
