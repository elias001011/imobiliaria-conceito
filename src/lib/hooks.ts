import { useEffect, useRef, useState } from 'react';
import { observeReveals } from './reveal';

// Revelação Connecta: .io-reveal ganha .in ao entrar na tela (uma vez).
export function useReveal() {
  useEffect(() => observeReveals(), []);
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

