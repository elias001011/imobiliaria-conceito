// Cena 3D do hero. Three.js direto (sem R3F): só desenha quando a rolagem muda algo, e para de vez com active=false.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { HeroLayout, HeroSceneProps } from '../hero/contract';
import { criarCena, type Cena } from './cena';
import { createFrameScheduler } from '../lib/frames';

interface Controle {
  ativo(v: boolean): void;
  formato(l: HeroLayout): void;
}

export default function HeroScene({ progress, quality, active, layout, onReady, onError, onProgress }: HeroSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const controle = useRef<Controle | null>(null);
  const atual = useRef({ active, layout, onReady, onError, onProgress });

  useEffect(() => {
    atual.current = { active, layout, onReady, onError, onProgress };
    controle.current?.ativo(active);
    controle.current?.formato(layout);
  }, [active, layout, onReady, onError, onProgress]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let morto = false;
    let preparada = false;
    let cena: Cena | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    const limpar: (() => void)[] = [];
    const falhar = (e: unknown) => {
      if (!morto) atual.current.onError(e);
    };

    // Canvas novo a cada montagem: um contexto descartado não pode ser reaproveitado.
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    canvas.dataset.stage = 'preparando';
    el.appendChild(canvas);
    const perdido = (ev: Event) => {
      ev.preventDefault();
      falhar(new Error('contexto WebGL perdido'));
    };
    canvas.addEventListener('webglcontextlost', perdido);

    const baixa = quality === 'low';
    let ativo = atual.current.active;
    let formato = atual.current.layout;
    let ultimo = 0;
    let mx = 0;
    let my = 0;
    // Resolução adaptativa: se a rolagem ficar abaixo de ~45 qps, baixa a densidade de pixels e não volta a subir.
    const tetoPixels = baixa ? 750_000 : 1_500_000;
    let dpr = Math.min(window.devicePixelRatio || 1, baixa ? 1 : 1.5, Math.sqrt(tetoPixels / Math.max(1, el.clientWidth * el.clientHeight)));
    const dprMin = Math.min(dpr, baixa ? 0.75 : 1);
    let soma = 0;
    let conta = 0;

    const quadro = (t: number) => {
      if (morto || !cena || !renderer || !ativo) return;
      const bruto = ultimo ? (t - ultimo) / 1000 : 0;
      const dt = bruto ? Math.min(0.05, bruto) : 1 / 60;
      ultimo = t;
      if (bruto > 0 && bruto < 0.25) {
        soma += bruto;
        if (++conta === 40) {
          if (soma / conta > 1 / 45 && dpr > dprMin) {
            dpr = Math.max(dprMin, dpr - 0.25);
            medir(false);
          }
          soma = 0;
          conta = 0;
        }
      }
      const movendo = cena.atualizar(progress.get(), dt, mx, my);
      renderer.render(cena.scene, cena.camera);
      canvas.dataset.progress = cena.progresso().toFixed(4);
      atual.current.onProgress?.(cena.progresso());
      if (movendo) pedir();
      else ultimo = 0;
    };
    const frames = createFrameScheduler(quadro);
    const pedir = () => {
      if (!morto && cena && ativo && preparada) frames.request();
    };

    const medir = (redesenhar = true) => {
      if (!renderer || !cena) return;
      const w = Math.max(1, el.clientWidth);
      const h = Math.max(1, el.clientHeight);
      renderer.setPixelRatio(Math.min(dpr, Math.sqrt(tetoPixels / (w * h))));
      renderer.setSize(w, h, false);
      cena.formato(formato, w / h);
      // setSize limpa o canvas: redesenhar no mesmo quadro evita o flash preto (F11, girar a tela).
      if (redesenhar && preparada && ativo) renderer.render(cena.scene, cena.camera);
      if (redesenhar) pedir();
    };

    controle.current = {
      ativo(v) {
        if (v === ativo) return;
        ativo = v;
        if (v) {
          cena?.tema(document.documentElement.dataset.theme === 'dark', true);
          pedir();
        }
        else {
          frames.cancel();
          ultimo = 0;
        }
      },
      formato(l) {
        if (l === formato) return;
        formato = l;
        medir();
      },
    };

    const respiro = () =>
      new Promise<void>((ok, erro) => {
        requestAnimationFrame(() => (morto ? erro(new Error('desmontado')) : ok()));
      });

    (async () => {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, stencil: false, powerPreference: 'high-performance' });
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      const pronta = await criarCena(renderer, quality, respiro);
      if (morto) {
        pronta.descartar();
        return;
      }
      canvas.dataset.stage = 'geometria-pronta';
      cena = pronta;
      medir();
      cena.encaixar(progress.get());
      const escuro = () => document.documentElement.dataset.theme === 'dark';
      cena.tema(escuro(), true);
      const aplicarTema = () => {
        // Fora da tela não há o que animar: aplica direto e desenha quando voltar.
        cena?.tema(escuro(), !ativo || !preparada || matchMedia('(prefers-reduced-motion: reduce)').matches);
        pedir();
      };
      const temaObserver = new MutationObserver(aplicarTema);
      temaObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      limpar.push(() => temaObserver.disconnect());
      canvas.dataset.stage = 'compilando';
      if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(cena.scene, cena.camera);
      else renderer.compile(cena.scene, cena.camera);
      if (morto) return;
      canvas.dataset.stage = 'renderizando';
      // Renderiza só o enquadramento visível; evita desenhar a vegetação inteira no primeiro quadro.
      renderer.render(cena.scene, cena.camera);
      renderer.shadowMap.autoUpdate = false;
      preparada = true;
      canvas.dataset.stage = 'pronta';
      pedir();

      const ro = new ResizeObserver(() => medir());
      ro.observe(el);
      limpar.push(() => ro.disconnect());
      limpar.push(progress.subscribe(pedir));
      if (!baixa && matchMedia('(pointer: fine)').matches) {
        const mover = (ev: PointerEvent) => {
          mx = (ev.clientX / innerWidth) * 2 - 1;
          my = (ev.clientY / innerHeight) * 2 - 1;
          pedir();
        };
        addEventListener('pointermove', mover, { passive: true });
        limpar.push(() => removeEventListener('pointermove', mover));
      }
      requestAnimationFrame(() => {
        if (!morto) atual.current.onReady();
      });
    })().catch((e) => {
      if (!morto) falhar(e);
    });

    return () => {
      morto = true;
      controle.current = null;
      frames.cancel();
      limpar.forEach((f) => f());
      canvas.removeEventListener('webglcontextlost', perdido);
      cena?.descartar();
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
      canvas.remove();
    };
  }, [progress, quality]);

  return <div ref={host} style={{ position: 'absolute', inset: 0 }} />;
}
