import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IMOVEIS, CONTATO_DEMO, rotuloTipo, TIPOS, type Imovel } from '../data/imoveis';
import { Icon360, IconArea, IconArrow, IconBath, IconBed, IconCar, IconClose, IconPin, IconSearch, IconWhatsApp } from './Icons';

import { AnimatedHikeCard, type Stat } from './ui/card-25';

import { filtrar, type Filtro } from '../lib/catalogo';

const foto = (id: string, w: 640 | 1200) => id.startsWith('panorama:') ? '/panorama/interior-360.webp?v=2' : `/imoveis/${id}-${w}.webp?v=2`;
// Guarda onde a pessoa estava para o App devolvê-la ao mesmo ponto quando ela fechar o 360°.
const guardarPosicao = () => { try { sessionStorage.setItem('imobiliaria-volta', JSON.stringify({ caminho: location.pathname, y: Math.round(scrollY) })); } catch { /* opcional */ } };
const tourHref = (i: Imovel) => `/tour360?imovel=${i.codigo}&origem=${location.pathname.startsWith('/imoveis') ? 'catalogo' : 'inicio'}`;

export function Busca({ filtro, onChange, inputRef }: { filtro: Filtro; onChange: (f: Filtro) => void; inputRef: React.RefObject<HTMLInputElement | null> }) {
  const total = filtrar(filtro).length;
  const slot = useRef<HTMLDivElement>(null);
  const [compacta, setCompacta] = useState(false);
  const [expandida, setExpandida] = useState(false);
  const actionTimer = useRef(0);
  useEffect(() => () => clearTimeout(actionTimer.current), []);
  useEffect(() => {
    let frame = 0;
    let navHeight = 0;
    const update = () => {
      frame = 0;
      setCompacta((slot.current?.getBoundingClientRect().top ?? 0) < navHeight - 160);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      navHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
      schedule();
    };
    measure();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('scroll', schedule);
      removeEventListener('resize', measure);
    };
  }, []);
  useEffect(() => { if (!compacta) setExpandida(false); }, [compacta]);
  // Teclado aberto + campo que some (pílula) deslocava a tela no celular: solta o foco antes de esconder.
  useEffect(() => { if (compacta && !expandida) inputRef.current?.blur(); }, [compacta, expandida, inputRef]);
  const recolher = () => { clearTimeout(actionTimer.current); inputRef.current?.blur(); setExpandida(false); };
  return (
    <>
    <div ref={slot} aria-hidden="true" />
    <section className={`busca catalogo-busca${compacta ? ' busca--compacta' : ''}${expandida ? ' busca--expandida' : ''}`} id="busca" aria-label="Pesquisar imóveis">
      <div className="container busca-shell">
        <form className="busca-form" role="search" onSubmit={(e) => { e.preventDefault(); recolher(); actionTimer.current = window.setTimeout(() => document.getElementById('imoveis')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }), 320); }}>
          <div className="busca-barra">
          <button type="button" className="busca-abrir icon-btn" tabIndex={compacta ? 0 : -1} aria-hidden={!compacta} aria-label={expandida ? 'Recolher pesquisa' : 'Expandir pesquisa'} onClick={() => { if (expandida) { recolher(); return; } setExpandida(true); if (matchMedia('(pointer: fine)').matches) actionTimer.current = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 420); }}><IconSearch /></button>
          <div className="chips" role="group" aria-label="Tipo de imóvel">
            {[{ id: 'todos' as const, plural: 'Todos' }, ...TIPOS].map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={filtro.tipo === t.id}
                className={`chip${filtro.tipo === t.id ? ' is-on' : ''}`}
                onClick={() => onChange({ ...filtro, tipo: t.id })}
              >
                {t.plural}
              </button>
            ))}
          </div>
          </div>
          <div className="busca-extra"><div className="busca-extra-miolo">
          <div className="busca-campos">
            <label className="campo campo--grow">
              <span className="campo-rotulo mono">Código ou palavra</span>
              <span className="campo-input">
                <IconSearch />
                <input ref={inputRef} aria-label="Código ou palavra" type="search" inputMode="search" placeholder="Busque por casa, apartamento ou código" value={filtro.codigo} onChange={(e) => onChange({ ...filtro, codigo: e.target.value })} />
              </span>
            </label>
            <button className="btn btn-primary busca-go" type="submit">
              Ver {total} {total === 1 ? 'imóvel' : 'imóveis'} <IconArrow className="btn-ic" />
            </button>
          </div>
          <p className="nota" aria-live="polite">{total} {total === 1 ? 'imóvel ilustrativo' : 'imóveis ilustrativos'} · conceito de site</p>
        
          </div></div>
        </form>
      </div>
    </section>
    </>
  );
}

export function Vitrine({ filtro, onLimpar, onAbrir, catalogo = false }: { catalogo?: boolean; filtro: Filtro; onLimpar: () => void; onAbrir: (i: Imovel) => void }) {
  const lista = useMemo(() => catalogo ? filtrar(filtro) : IMOVEIS.slice(0,6), [filtro, catalogo]);
  const filtrado = filtro.tipo !== 'todos' || filtro.codigo.trim();
  return (
    <section className="vitrine" id="imoveis" aria-labelledby="vitrine-titulo">
      <div className="container">
        <div className="sec-head io-reveal">
          <div>
            <h2 id="vitrine-titulo" className="display display--md">
              {filtrado ? `${lista.length} ${lista.length === 1 ? 'resultado' : 'resultados'}.` : catalogo ? 'Todos os imóveis.' : 'Imóveis em destaque.'}
            </h2>
          </div>
          {filtrado ? (
            <button type="button" className="link-arrow" onClick={onLimpar}>Limpar filtros <IconClose /></button>
          ) : !catalogo ? (
            <a className="link-arrow" href="/imoveis">Ver todos os imóveis <IconArrow /></a>
          ) : null}
        </div>

        <p className="vitrine-nota">Uma seleção de possibilidades. Este é um conceito de site de imobiliária, com imóveis e valores ilustrativos.</p>
        {lista.length ? (
          <ul className="grid-imoveis">
            {lista.map((i, k) => (
              <li key={i.codigo} className="io-reveal" style={{ transitionDelay: `${(k % 3) * 70}ms` }}>
                <Card imovel={i} onAbrir={() => onAbrir(i)} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="vazio io-reveal">
            <p className="display display--sm">Nada por aqui com esses filtros.</p>
            <p>Conte o que você procura e o corretor busca para você.</p>
            <div className="acoes">
              <a className="btn btn-primary" href={CONTATO_DEMO} ><IconWhatsApp className="btn-ic" /> Pedir ao corretor</a>
              <button type="button" className="btn btn-secondary" onClick={onLimpar}>Limpar filtros</button>
            </div>
          </div>
        )}
        {!catalogo && <a className="btn catalogo-cta" href="/imoveis">Explorar todos os imóveis <IconArrow className="btn-ic" /></a>}
      </div>
    </section>
  );
}

function Card({imovel:i,onAbrir}: {imovel:Imovel;onAbrir:()=>void}) {
  const stats: Stat[] = [{icon: i.tour360 ? <Icon360/> : <IconArea/>,label:i.area}];
  if(i.dormitorios)stats.push({icon:<IconBed/>,label:i.dormitorios.split(' ')[0]});
  if(i.banheiros)stats.push({icon:<IconBath/>,label:String(i.banheiros)});
  if(i.vagas)stats.push({icon:<IconCar/>,label:String(i.vagas)});
  return <article className={`card property-card${i.tour360 ? ' property-card--360' : ''}`}>
    <AnimatedHikeCard title={i.titulo} images={i.fotos.map(f=>foto(f,640))} stats={stats}
      description={i.tour360 ? 'Conheça um ambiente real em uma demonstração interativa de 360°.' : 'Um novo espaço para imaginar seus planos. Fotografias e valores ilustrativos.'}
      href={`#imovel-${i.codigo}`} label={`${rotuloTipo(i.tipo)} · ${i.codigo}${i.tour360 ? ' · 360°' : ''}`}
      onClick={event=>{event.preventDefault();onAbrir();}} />
    <div className="property-bottom"><div><p className="property-price">{i.preco ?? 'Sob consulta'}</p><p className="property-note">{i.tour360 ? 'Panorama ilustrativo' : 'Conceito de site'}</p></div>
      {i.tour360 ? <a href={tourHref(i)} onClick={guardarPosicao} className="btn property-view" aria-label="Ver demonstração 360°"><Icon360 className="btn-ic"/> Ver</a> : <button className="property-details icon-btn" type="button" onClick={onAbrir} aria-label={`Ver detalhes: ${i.titulo}`}><IconArrow/></button>}
    </div>
  </article>;
}

export function Ficha({ imovel, onFechar }: { imovel: Imovel | null; onFechar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [atual, setAtual] = useState(0);
  const [ampliada, setAmpliada] = useState(false);
  const fechamento = useRef(0);
  const fechar = useCallback(() => {
    const d = ref.current;
    if (!d?.open || fechamento.current) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { d.close(); return; }
    d.classList.add('is-closing');
    fechamento.current = window.setTimeout(() => d.close(), 140);
  }, []);
  useEffect(() => () => clearTimeout(fechamento.current), []);
  const ultimo = useRef<Imovel | null>(null);
  if (imovel) ultimo.current = imovel;
  const i = imovel ?? ultimo.current;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (imovel) {
      clearTimeout(fechamento.current);
      fechamento.current = 0;
      d.classList.remove('is-closing');
      if (d.open) return;
      setAtual(0);
      d.showModal();
      d.querySelector<HTMLElement>('#ficha-titulo')?.focus({ preventScroll: true });
      document.body.classList.add('ficha-aberta');
    } else if (d.open) {
      fechar();
    }
  }, [imovel, fechar]);

  if (!i) return <dialog ref={ref} className="ficha" />;

  return (
    <dialog
      ref={ref}
      className="ficha"
      aria-labelledby="ficha-titulo"
      onCancel={e => { if (e.target === e.currentTarget) { e.preventDefault(); fechar(); } }}
      onClose={e => {
        if (e.target !== e.currentTarget) return;
        clearTimeout(fechamento.current);
        fechamento.current = 0;
        ref.current?.classList.remove('is-closing');
        document.body.classList.remove('ficha-aberta');
        setAmpliada(false);
        onFechar();
      }}
      onClick={e => { if (e.target === e.currentTarget) fechar(); }}
    >
      <div className="ficha-painel">
        <button type="button" className="icon-btn ficha-x" onClick={fechar} aria-label="Fechar"><IconClose /></button>
        <div className="ficha-galeria">
          <div className="ficha-foto-wrap"><button className="ficha-ampliar" type="button" aria-label="Ampliar foto em tela cheia" onClick={() => setAmpliada(true)}><img key={i.fotos[atual]} className="ficha-foto" src={foto(i.fotos[atual], 1200)} alt={`${i.titulo} — foto ${atual + 1} de 2`} /></button>
          {i.tour360 && atual === 0 && <a className="btn ficha-tour-ver" href={tourHref(i)} onClick={guardarPosicao} aria-label="Ver demonstração 360°"><Icon360 className="btn-ic"/> Ver</a>}
          </div>
          <Galeria aberta={ampliada} fotos={i.fotos} titulo={i.titulo} inicio={atual} onFechar={() => setAmpliada(false)} />
          <div className="ficha-thumbs">
            {i.fotos.map((f, k) => (
              <button key={f} type="button" className={k === atual ? 'is-on' : ''} onClick={() => setAtual(k)} aria-label={`Ver foto ${k + 1}`}>
                <img src={foto(f, 640)} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="ficha-info">
          <h2 id="ficha-titulo" className="display display--sm" tabIndex={-1}>{i.titulo}</h2>
          <p className="ficha-local"><IconPin />Localização fica aqui</p>
          <div className="ficha-preco">
            <strong>{i.preco ?? 'Sob consulta'}</strong>
            {i.condicao && <em>{i.condicao}</em>}
          </div>
          <dl className="ficha-dados">
            <div><dt className="mono">Tipo</dt><dd>{rotuloTipo(i.tipo)}</dd></div>
            <div><dt className="mono">Código</dt><dd>{i.codigo}</dd></div>
            <div><dt className="mono">{i.tour360 ? "Experiência" : "Área"}</dt><dd>{i.area}</dd></div>
            {i.dormitorios && <div><dt className="mono">Dormitórios</dt><dd>{i.dormitorios}</dd></div>}
            {i.banheiros && <div><dt className="mono">Banheiros</dt><dd>{i.banheiros}</dd></div>}
            {i.vagas && <div><dt className="mono">Vagas</dt><dd>{i.vagas}</dd></div>}
          </dl>
          <ul className="ficha-destaques">
            {i.destaques.map((d) => <li key={d}>{d}</li>)}
          </ul>
          <div className="acoes">
            {i.tour360 && <a className="btn property-view" href={tourHref(i)} onClick={guardarPosicao}><Icon360 className="btn-ic"/> Ver demonstração 360°</a>}
            <a className="btn btn-primary" href={CONTATO_DEMO} ><IconWhatsApp className="btn-ic" /> Conhecer o conceito</a>
            <a className="btn btn-secondary" href="/imoveis">Ver todos os imóveis <IconArrow className="btn-ic" /></a>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function Galeria({aberta, fotos, titulo, inicio = 0, onFechar}: {aberta: boolean; fotos: [string,string]; titulo: string; inicio?: number; onFechar: () => void}) {
 const ref = useRef<HTMLDialogElement>(null);
 const [index, setIndex] = useState(inicio);
 useEffect(() => { const d = ref.current; if(!d)return; if(aberta && !d.open){setIndex(inicio); d.showModal(); document.body.classList.add('galeria-aberta');} else if(!aberta && d.open)d.close(); },[aberta,inicio]);
 return <dialog ref={ref} className="galeria" aria-label={`Fotos ampliadas: ${titulo}`} onClose={() => {document.body.classList.remove('galeria-aberta'); onFechar();}} onKeyDown={e => {if(e.key === 'ArrowRight' || e.key === 'ArrowLeft')setIndex(v => 1-v);}}>
  <div className="galeria-top"><p>{titulo} <span className="mono">{index+1} / {fotos.length}</span></p><button type="button" className="icon-btn" aria-label="Fechar fotos ampliadas" onClick={() => ref.current?.close()}><IconClose /></button></div>
  <img src={foto(fotos[index],1200)} alt={`${titulo} — foto ${index+1}. Fotografia ilustrativa.`} />
  <button type="button" className="galeria-prev icon-btn" aria-label="Foto anterior" onClick={() => setIndex(v => 1-v)}>←</button><button type="button" className="galeria-next icon-btn" aria-label="Próxima foto" onClick={() => setIndex(v => 1-v)}>→</button>
  <p className="galeria-nota mono">Fotografia ilustrativa · conceito de site</p>
 </dialog>;
}
