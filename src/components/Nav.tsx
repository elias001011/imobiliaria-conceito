import { useEffect, useRef, useState } from 'react';
import { CONTATO_DEMO } from '../data/imoveis';
import { useTheme } from '../lib/hooks';
import { IconMoon, IconSun, IconWhatsApp } from './Icons';

const LINKS = [
  { href: '/imoveis', rotulo: 'Imóveis' },
  { href: '/#categorias', rotulo: 'Categorias' },
  { href: '/#servicos', rotulo: 'Serviços' },
  { href: '/#sobre', rotulo: 'Sobre' },
  { href: '/#contato', rotulo: 'Contato' },
];

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <span className="marca">
      <svg className="marca-simbolo" viewBox="0 0 64 64" width="40" height="40" fill="none" aria-hidden="true">
        <circle cx="44" cy="19" r="6" fill="#d9a332" />
        <path d="M7 42c13-8 31-9 50 1a27 27 0 0 1-50-1Z" fill="#92ad52" />
        <path d="M10 46c13-5 26-1 41 6a27 27 0 0 1-41-6Z" fill="#597d37" />
        <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="32" r="27" />
          <path d="m14 34 13-12 13 12M18 31v14h18V31M25 45v-9h6v9" />
        </g>
      </svg>
      {!compacta && (
        <span className="marca-texto">
          <span className="marca-nome">Imobiliária</span>
          <span className="marca-sub mono">imóveis</span>
        </span>
      )}
    </span>
  );
}

export default function Nav() {
  const [theme, toggle] = useTheme();
  const [onDark, setOnDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLSpanElement>(null);
  const caminho = typeof location === 'undefined' ? '' : location.pathname;

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const hero = document.getElementById('topo');
      const heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
      setOnDark(heroBottom > 64);
      setScrolled(scrollY > 8);
      const max = document.documentElement.scrollHeight - innerHeight;
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('menu-open');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const desktop = matchMedia('(min-width: 1001px)');
    const onDesktop = () => desktop.matches && setOpen(false);
    addEventListener('keydown', onKey);
    desktop.addEventListener('change', onDesktop);
    return () => {
      document.body.classList.remove('menu-open');
      removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onDesktop);
    };
  }, [open]);

  const wa = CONTATO_DEMO;

  return (
    <header className={`nav${onDark && !open ? ' nav--on-dark' : ''}${(scrolled && !onDark) || open ? ' nav--solid' : ''}${open ? ' nav--aberta' : ''}`}>
      <div className="container nav-inner">
        <a className="nav-brand" href="/" aria-label="Imobiliária · conceito, início">
          <Marca />
        </a>
        <nav className="nav-links mono" aria-label="Seções">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.rotulo}</a>
          ))}
        </nav>
        <div className="nav-actions">
          <button type="button" id="theme-toggle" className="icon-btn" onClick={toggle} aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}>
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          <a className="btn btn-primary nav-wa" aria-label="Contato demonstrativo" href={wa}>
            <IconWhatsApp className="btn-ic" />
            <span>Contato</span>
          </a>
          <button type="button" className={`icon-btn nav-menu-btn nav-burger${open ? ' is-open' : ''}`} aria-expanded={open} aria-controls="menu-movel" aria-label={open ? 'Fechar menu' : 'Abrir menu'} onClick={() => setOpen((o) => !o)}>
            <span className="nav-burger-box" aria-hidden="true"><i /><i /><i /></span>
          </button>
        </div>
      </div>
      {/* Como no menu da Tec2D: o painel cresce dentro do header, que pinta uma superfície só. */}
      <div className="menu-movel" id="menu-movel" inert={!open}>
        <div className="menu-movel-miolo">
          <nav className="menu-movel-grid" aria-label="Menu">
            {LINKS.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                className={`menu-pill${caminho === l.href ? ' is-active' : ''}`}
                aria-current={caminho === l.href ? 'page' : undefined}
                onClick={() => setOpen(false)}
                style={{ transitionDelay: open ? `${i * 35}ms` : '0ms' }}
              >
                {l.rotulo}
              </a>
            ))}
            <a className="menu-wa" href={wa} onClick={() => setOpen(false)} style={{ transitionDelay: open ? `${LINKS.length * 35 + 40}ms` : '0ms' }}>
              <IconWhatsApp className="btn-ic" /> WhatsApp
            </a>
          </nav>
        </div>
      </div>
      <span className="nav-progress" ref={barRef} aria-hidden="true" />
    </header>
  );
}
