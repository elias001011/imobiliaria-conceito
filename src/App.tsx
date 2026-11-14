import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import HeroSection from './hero/HeroSection';
import Nav from './components/Nav';
import { Busca, Ficha, Vitrine } from './components/Imoveis';
import { FILTRO_VAZIO, tipoValido, type Filtro } from './lib/catalogo';
import { Campo, Categorias, Contato, Manifesto, Servicos } from './components/Secoes';
import RodapeConnecta from './components/RodapeConnecta';
import { IMOVEIS, type Imovel, type Tipo } from './data/imoveis';
import { useReveal } from './lib/hooks';
import { lerRetorno } from './lib/retorno';
const Tour360 = lazy(() => import('./components/Tour360'));
const doHash = () => IMOVEIS.find(i => `#imovel-${i.codigo}` === location.hash) ?? null;
export default function App() {
 useReveal();
 // Links como /#servicos vindos de outra página: o destino só existe depois que o React renderiza.
 useLayoutEffect(() => {
  let id = '';
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { /* hash malformado: sem destino */ }
  const alvo = id && !id.startsWith('imovel-') ? document.getElementById(id) : null;
  if (alvo) alvo.scrollIntoView({ behavior: 'instant', block: 'start' });
  // Volta do 360°: devolve a rolagem ao ponto de onde a pessoa saiu (uma vez só).
  try {
    const salvo = lerRetorno(sessionStorage.getItem('imobiliaria-volta'));
    // Na página do 360° o registro tem que ficar guardado; só é consumido na página de origem.
    if (salvo && salvo.caminho === location.pathname) sessionStorage.removeItem('imobiliaria-volta');
    if (salvo && salvo.caminho === location.pathname && !alvo) {
      // A página ainda cresce (imagens, fontes): reaplica por ~2 s, parando assim que a pessoa rolar por conta própria.
      let ultimo = -1;
      let interrompido = false;
      const parar = () => { interrompido = true; };
      const eventos = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
      eventos.forEach(evento => addEventListener(evento, parar, { passive: true }));
      const aplicar = () => {
        if (interrompido || (ultimo >= 0 && Math.abs(scrollY - ultimo) > 6)) return;
        scrollTo({ top: salvo.y, behavior: 'instant' });
        ultimo = scrollY;
      };
      aplicar();
      const timers = [120, 300, 600, 1000, 1600].map(t => window.setTimeout(aplicar, t));
      const limpar = () => eventos.forEach(evento => removeEventListener(evento, parar));
      timers.push(window.setTimeout(limpar, 1700));
      return () => { timers.forEach(clearTimeout); limpar(); };
    }
  } catch { /* sem armazenamento: fica no topo */ }
 }, []);
 const catalogo = /^\/imoveis\/?$/.test(location.pathname);
 const [filtro, setFiltro] = useState<Filtro>(() => ({...FILTRO_VAZIO, tipo: tipoValido(new URLSearchParams(location.search).get('tipo'))}));
 const [aberto, setAberto] = useState<Imovel | null>(doHash);
 const buscaInput = useRef<HTMLInputElement>(null);
 useEffect(() => { const pop = () => setAberto(doHash()); addEventListener('popstate',pop); return () => removeEventListener('popstate',pop); }, []);
 const abrir = useCallback((i: Imovel) => { history.pushState(null,'',`#imovel-${i.codigo}`); setAberto(i); },[]);
 const fechar = useCallback(() => { if(doHash()) history.replaceState(null,'',location.pathname+location.search); setAberto(null); },[]);
 const porTipo = (t: Tipo) => { location.href = `/imoveis?tipo=${t}`; };
 if (location.pathname === '/tour360') return <main><Suspense fallback={<p className="tour-loading" role="status">Carregando demonstração 360°…</p>}><Tour360 onFechar={() => {const params=new URLSearchParams(location.search);const item=IMOVEIS.find(i=>i.codigo===params.get('imovel'));location.href=item ? `${params.get('origem')==='catalogo' ? '/imoveis' : '/'}#imovel-${item.codigo}` : '/#servicos';}} /></Suspense></main>;
 return <div className={new URLSearchParams(location.search).has('scene') ? 'apenas-cena' : undefined}>
  <a className="skip mono" href={catalogo ? '#busca' : '#imoveis'}>Pular para os imóveis</a>
  <Nav />
  <main>
   {catalogo ? <>
    <section className="catalogo-intro container"><p className="eyebrow mono">CATÁLOGO · CONCEITO DE SITE</p><h1 className="display display--lg">Seu próximo lugar<br/>começa aqui.</h1><p>Explore todos os imóveis deste catálogo demonstrativo. Fotos, valores e características são ilustrativos.</p></section>
    <Busca filtro={filtro} onChange={setFiltro} inputRef={buscaInput} />
    <Vitrine catalogo filtro={filtro} onLimpar={() => setFiltro(FILTRO_VAZIO)} onAbrir={abrir} />
   </> : <>
    <HeroSection onSearch={() => { location.href = '/imoveis'; }} />
    <Vitrine filtro={FILTRO_VAZIO} onLimpar={() => {}} onAbrir={abrir} />
    <Categorias onTipo={porTipo} /><Campo onAreas={() => porTipo('area')} /><Manifesto /><Servicos /><Contato />
   </>}
  </main>
  <RodapeConnecta /><Ficha imovel={aberto} onFechar={fechar} />
 </div>;
}
