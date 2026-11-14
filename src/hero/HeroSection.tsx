import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { HeroLayout, HeroQuality } from './contract';
import { BEATS, beatIndexAt, beatVisibility } from './timeline';
import { createProgress, forcedProgress } from './progress';
import { IconArrow, IconChevronDown, IconSearch } from '../components/Icons';

const HeroScene = lazy(() => import('../hero3d/HeroScene'));

const TEXTOS = [
  { titulo: ['O imóvel que', 'você procura', 'está aqui.'], apoio: 'Conceito de site de imobiliária · explore novas possibilidades.' },
  { titulo: ['Da cidade', 'ao campo.'], apoio: 'Casas, apartamentos e novas possibilidades em um conceito de site de imobiliária.' },
  { titulo: ['Cada imóvel,', 'apresentado', 'como merece.'], apoio: null },
  { titulo: ['Entre e', 'encontre o seu.'], apoio: null },
];

function webglOk(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}

function pickQuality(): HeroQuality {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = matchMedia('(pointer: coarse)').matches;
  if (coarse && innerWidth < 1024) return 'low';
  if ((nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4) return 'low';
  return 'high';
}

// Fração da rolagem em que a câmera chega ao fim; o resto é pausa.
const FIM_CAMERA = 0.9;
// Descarta o 3D depois de ficar este tempo longe da tela.
const DESCARTE_MS = 20_000;

const pickLayout = (): HeroLayout => (innerWidth / innerHeight < 0.9 ? 'tall' : 'wide');

class SceneBoundary extends Component<{ onError: (e: unknown) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    this.props.onError(e);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HeroSection({ onSearch }: { onSearch: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRef = useRef<HTMLSpanElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const completeRef = useRef(false);
  const cueRef = useRef<HTMLDivElement>(null);
  const progress = useMemo(() => createProgress(forcedProgress() ?? 0), []);

  const reduced = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const can3d = useMemo(() => !reduced && typeof IntersectionObserver === 'function' && typeof ResizeObserver === 'function' && webglOk(), [reduced]);
  const quality = useMemo(pickQuality, []);
  const [layout, setLayout] = useState<HeroLayout>(pickLayout);
  const [active, setActive] = useState(false);
  const [montada, setMontada] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const animated = can3d && !failed;

  // Progresso pela rolagem (ou fixo por ?hero=).
  useEffect(() => {
    if (!animated) return;
    const forced = forcedProgress();
    if (forced !== null) {
      progress.set(forced);
      return;
    }
    let raf = 0;
    let startY = 0;
    let retidoDesde = 0;
    // Fim do trecho preso (onde a hero solta a página) em coordenadas do documento.
    const fim = () => {
      const el = sectionRef.current;
      return el ? scrollY + el.getBoundingClientRect().top + el.offsetHeight - innerHeight : 0;
    };
    // Segura a descida só enquanto a câmera ainda não chegou ao último quadro; nunca rola sozinho.
    const segurar = () => {
      // Só no limite da hero: quem chegou mais abaixo (barra de rolagem, link) nunca é retido.
      const y = scrollY;
      const f = fim();
      if (!ready || completeRef.current || y < f - 2 || y > f + 6) {
        retidoDesde = 0;
        return false;
      }
      retidoDesde ||= performance.now();
      return performance.now() - retidoDesde < 1200;
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.deltaY <= 0) return;
      if (segurar()) event.preventDefault();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' ', 'End'].includes(event.key) && segurar()) event.preventDefault();
    };
    const touchStart = (event: TouchEvent) => { startY = event.touches[0]?.clientY ?? 0; };
    const touchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? 0;
      if (y < startY && segurar() && event.cancelable) event.preventDefault();
    };
    const measure = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = el.offsetHeight - innerHeight;
      const raw = span > 0 ? -r.top / span : 0;
      // O último quinto da rolagem é pausa: a câmera termina e repousa antes de a página seguir.
      progress.set(Math.min(1, Math.max(0, raw / FIM_CAMERA)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    addEventListener('wheel', wheel, { passive: false });
    addEventListener('keydown', keyboard);
    addEventListener('touchstart', touchStart, { passive: true });
    addEventListener('touchmove', touchMove, { passive: false });
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      removeEventListener('wheel', wheel);
      removeEventListener('keydown', keyboard);
      removeEventListener('touchstart', touchStart);
      removeEventListener('touchmove', touchMove);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [animated, progress, ready]);

  // Textos, contador e barra seguem o progresso sem re-render.
  useEffect(() => {
    if (!animated) return;
    const paint = (p: number) => {
      BEATS.forEach((_, i) => {
        const el = beatRefs.current[i];
        if (!el) return;
        const v = beatVisibility(p, i);
        el.style.opacity = String(v);
        el.style.transform = `translate3d(0, ${(1 - v) * 28}px, 0)`;
        el.style.filter = v > 0.98 ? 'none' : `blur(${(1 - v) * 8}px)`;
        el.style.visibility = v < 0.01 ? 'hidden' : 'visible';
        el.toggleAttribute('inert', v < 0.5);
      });
      // Dentro da casa o fundo é claro: o degradê da coluna de texto escurece junto com o último tempo.
      sectionRef.current?.style.setProperty('--dentro', String(beatVisibility(p, BEATS.length - 1)));
      const idx = beatIndexAt(p);
      dotRefs.current.forEach((d, k) => d?.classList.toggle('is-on', k <= idx));
      if (barRef.current) barRef.current.style.transform = `scaleY(${p})`;
      if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - p * 14));
    };
    paint(progress.get());
    return progress.subscribe(paint);
  }, [animated, progress]);

  // O 3D só é carregado quando a hero está (ou está prestes a ficar) na tela, e é descartado depois de um tempo longe dela.
  useEffect(() => {
    const el = sectionRef.current;
    if (!animated || !el) return;
    let descarte = 0;
    const perto = new IntersectionObserver(([e]) => {
      clearTimeout(descarte);
      if (e.isIntersecting) setMontada(true);
      else descarte = window.setTimeout(() => { setMontada(false); setReady(false); }, DESCARTE_MS);
    }, { rootMargin: '60% 0px' });
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '10% 0px' });
    perto.observe(el);
    io.observe(el);
    const onResize = () => setLayout(pickLayout());
    addEventListener('resize', onResize);
    return () => {
      clearTimeout(descarte);
      perto.disconnect();
      io.disconnect();
      removeEventListener('resize', onResize);
    };
  }, [animated]);

  const [posterTheme, setPosterTheme] = useState(() => document.documentElement.dataset.theme === 'dark' ? 'noite' : 'dia');
  // Segue o tema também enquanto o 3D está descartado, evitando um pôster antigo na volta.
  useEffect(() => {
    const ler = () => setPosterTheme(document.documentElement.dataset.theme === 'dark' ? 'noite' : 'dia');
    ler();
    const mo = new MutationObserver(ler);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  const poster = `/hero/abertura-${layout === 'tall' ? 'tall' : 'wide'}-${posterTheme}-v6.webp`;
  const posterPicture = (className: string) => <picture>
    {layout !== 'tall' && <source media="(min-aspect-ratio: 9/10) and (max-aspect-ratio: 8/5)" srcSet={`/hero/abertura-medium-${posterTheme}-v6.webp`} />}
    <img className={className} src={poster} alt="" aria-hidden="true" />
  </picture>;

  if (!animated) {
    return (
      <section className="hero hero--static" id="topo" aria-label="Apresentação">
        <div className="hero-stage">
          {posterPicture('hero-poster is-on')}
          <div className="hero-shade" />
          <div className="hero-copy container">
            <div className="hero-beat is-static">
              <h1 className="display">{TEXTOS[0].titulo.map((l) => <span key={l}>{l}</span>)}</h1>
              <p className="hero-sub">{TEXTOS[1].apoio}</p>
              <SearchPill onSearch={onSearch} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero" id="topo" ref={sectionRef} aria-label="Apresentação">
      <div className="hero-stage">
        {posterPicture(`hero-poster${ready ? '' : ' is-on'}`)}
        <div className="hero-canvas" aria-hidden="true">
          {montada && <SceneBoundary onError={() => setFailed(true)}>
            <Suspense fallback={null}>
              <HeroScene
                progress={progress}
                quality={quality}
                active={active}
                layout={layout}
                onProgress={(value) => { completeRef.current = value >= 0.985; }}
                onReady={() => setReady(true)}
                onError={() => setFailed(true)}
              />
            </Suspense>
          </SceneBoundary>}
        </div>
        <div className="hero-shade" />

        <div className="hero-copy container">
          {TEXTOS.map((t, i) => (
            <div key={BEATS[i].id} className={`hero-beat hero-beat--${BEATS[i].id}`} ref={(el) => { beatRefs.current[i] = el; }}>
              {i === 0 ? (
                <h1 className="display">{t.titulo.map((l) => <span key={l}>{l}</span>)}</h1>
              ) : (
                <h2 className="display">{t.titulo.map((l) => <span key={l}>{l}</span>)}</h2>
              )}
              {t.apoio && <p className="hero-sub">{t.apoio}</p>}
              {(i === 0 || i === TEXTOS.length - 1) && <SearchPill onSearch={onSearch} />}
            </div>
          ))}
        </div>

        <div className="hero-meter" aria-hidden="true">
          <span className="hero-meter-track"><span ref={barRef} /></span>
          {BEATS.map((b, k) => <span key={b.id} className="hero-meter-dot" ref={(el) => { dotRefs.current[k] = el; }} />)}
        </div>
        <div className="hero-cue" ref={cueRef} aria-hidden="true">
          <IconChevronDown />
        </div>
      </div>
    </section>
  );
}

function SearchPill({ onSearch }: { onSearch: () => void }) {
  return (
    <div className="hero-actions">
      <button type="button" className="search-pill" onClick={onSearch}>
        <IconSearch />
        <span>Ver todos os imóveis</span>
        <span className="search-pill-go"><IconArrow /></span>
      </button>
    </div>
  );
}
