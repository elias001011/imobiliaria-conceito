import { useEffect, useRef, useState } from 'react';

// Revelação Connecta: .io-reveal ganha .in ao entrar na tela (uma vez).
export function useReveal() {
  useEffect(() => {
    const els = () => document.querySelectorAll<HTMLElement>('.io-reveal:not(.in)');
    if (!('IntersectionObserver' in window)) {
      els().forEach((e) => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    const observe = () => els().forEach((e) => io.observe(e));
    observe();
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}

export type Theme = 'light' | 'dark';

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const timer = useRef(0);
  useEffect(() => () => { clearTimeout(timer.current); document.documentElement.classList.remove('theme-fade'); }, []);
  const toggle = () => {
    const root = document.documentElement;
    const next: Theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    // Troca simples e suave: só as cores fazem transição; a cena 3D apenas ajusta a iluminação.
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('theme-fade');
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => root.classList.remove('theme-fade'), 700);
    }
    root.dataset.theme = next;
    setTheme(next);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0b0c0a' : '#f0efec');
    try { localStorage.setItem('imobiliaria-theme', next); } catch { /* armazenamento opcional */ }
  };
  return [theme, toggle];
}

