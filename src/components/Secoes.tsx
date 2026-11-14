import { useEffect, useRef, useState } from 'react';
import { CONTATO_DEMO, TIPOS, type Tipo } from '../data/imoveis';
import { Icon360, IconArrow, IconBuilding, IconCalc, IconField, IconHouse, IconKey, IconLeaf, IconPin, IconPlot, IconStamp, IconTag, IconTree, IconWhatsApp, } from './Icons';
import type { ComponentType, SVGProps } from 'react';

const ICONE_TIPO: Record<Tipo, ComponentType<SVGProps<SVGSVGElement>>> = { casa: IconHouse, apartamento: IconBuilding, terreno: IconPlot, chacara: IconTree, area: IconField };

/* ---------- Categorias ---------- */


export function Categorias({ onTipo }: { onTipo: (t: Tipo) => void }) {
  return (
    <section className="categorias" id="categorias" aria-labelledby="cat-titulo">
      <div className="container cat-grid">
        <div className="io-reveal">
          <h2 id="cat-titulo" className="display display--md">Um tipo para cada plano.</h2>
        </div>
        <ul className="cat-lista">
          {TIPOS.map((t, k) => {
            const Icone = ICONE_TIPO[t.id];
            return (
              <li key={t.id} className="io-reveal" style={{ transitionDelay: `${k * 50}ms` }}>
                <button type="button" className="cat-row" onClick={() => onTipo(t.id)}>
                  <span className="cat-ic"><Icone /></span>
                  <span className="cat-nome">{t.plural}</span>
                  <span className="cat-meta mono">Localização fica aqui</span>
                  <span className="cat-go"><IconArrow /></span>
                </button>
              </li>
            );
          })}

        </ul>
      </div>
    </section>
  );
}

/* ---------- Campo ---------- */

export function Campo({ onAreas }: { onAreas: () => void }) {
  return (
    <section className="campo-sec" aria-labelledby="campo-titulo">
      <div className="container">
        <div className="campo-top">
          <div className="io-reveal">
            <h2 id="campo-titulo" className="display display--lg">
              <span>Um lugar para</span> <span>cultivar planos.</span> <span className="tom">Perto da natureza.</span>
            </h2>
          </div>
          <div className="campo-acoes io-reveal">
            <button type="button" className="btn btn-light" onClick={onAreas}>Ver áreas de terra <IconArrow className="btn-ic" /></button>
            <a className="btn btn-ghost-light" href={CONTATO_DEMO} ><IconWhatsApp className="btn-ic" /> Falar com o corretor</a>
          </div>
        </div>
        <ul className="campo-casos">
          <li className="io-reveal"><span className="campo-onde"><IconPin />Localização fica aqui</span><strong>16 ha</strong><p>Um exemplo de área rural para apresentar novas possibilidades.</p></li>
          <li className="io-reveal"><span className="campo-onde"><IconPin />Localização fica aqui</span><strong>35 ha</strong><p>Horizonte aberto e espaço para imaginar o próximo projeto.</p></li>
          <li className="io-reveal"><span className="campo-onde"><IconPin />Localização fica aqui</span><strong>Seu plano</strong><p>Casas de campo, chácaras e áreas de terra neste catálogo ilustrativo.</p></li>
        </ul>
        <p className="nota">Conceito de site · imóveis fictícios · imagens ilustrativas</p>
      </div>
    </section>
  );
}

/* ---------- Manifesto: palavras acendem na rolagem ---------- */

const MANIFESTO = 'Um conceito de site pensado para aproximar pessoas de novos lugares. Transparência e atenção de corretor especializado. Compra, venda e toda a assessoria para uma transação segura e tranquila, com acompanhamento jurídico e operacional.';

export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = [...el.querySelectorAll<HTMLSpanElement>('span')];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      words.forEach((w) => (w.style.opacity = '1'));
      return;
    }
    let raf = 0;
    const paint = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
      const lit = p * words.length;
      words.forEach((w, i) => (w.style.opacity = String(0.2 + 0.8 * Math.min(1, Math.max(0, lit - i)))));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(paint); };
    paint();
    addEventListener('scroll', on, { passive: true });
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', on); };
  }, []);
  return (
    <section className="manifesto" id="sobre" aria-label="Sobre este conceito">
      <div className="container">
        <p className="manifesto-txt" ref={ref}>
          {MANIFESTO.split(' ').map((w, i) => <span key={i}>{w} </span>)}
        </p>
        <p className="manifesto-assina mono">Imobiliária · conceito por Connecta Digital</p>
      </div>
    </section>
  );
}

/* ---------- Serviços: grade de linhas da Connecta ---------- */

const SERVICOS = [
  { Icone: IconKey, titulo: 'Quero comprar', txt: 'Uma busca simples para encontrar um lugar que combina com você.', acao: 'Pedir uma busca', url: '/#contato' },
  { Icone: IconTag, titulo: 'Quero vender', txt: 'Cadastre seu imóvel e encontramos o melhor negócio.', acao: 'Cadastrar meu imóvel', url: '/#contato' },
  { Icone: IconCalc, titulo: 'Financiamento', txt: 'Espaço para apresentar opções de financiamento e orientar cada etapa.', acao: 'Conhecer possibilidades', url: '/#contato' },
  { Icone: IconStamp, titulo: 'Assessoria documental', txt: 'Espaço para explicar o apoio com a documentação de compra e venda.', acao: 'Saber mais', url: '/#contato' },
  { Icone: IconLeaf, titulo: 'Avaliação de imóveis', txt: 'Uma apresentação clara dos diferenciais de cada propriedade.', acao: 'Saber mais', url: '/#contato' },
  { Icone: Icon360, titulo: 'Tour virtual 360°', txt: 'Imóveis com fotos 360°: explore um ambiente real e olhe ao redor nesta demonstração interativa.', acao: 'Experimentar em 360°', proposta: true },
];

export function Servicos() {
  return (
    <section className="servicos" id="servicos" aria-labelledby="serv-titulo">
      <div className="container">
        <div className="sec-head io-reveal">
          <div>
            <h2 id="serv-titulo" className="display display--md">Do primeiro contato<br />ao negócio fechado.</h2>
          </div>
        </div>
        <ul className="serv-grid">
          {SERVICOS.map((s, k) => (
            <li key={s.titulo} className={`serv-cell io-reveal${s.proposta ? ' is-proposta' : ''}`} style={{ transitionDelay: `${(k % 3) * 70}ms` }}>
              <span className="serv-ic"><s.Icone /></span>
              <h3>{s.titulo}</h3>
              <p>{s.txt}</p>
              {s.proposta ? (
                <a className="link-arrow" href="/tour360">{s.acao} <IconArrow /></a>
              ) : (
                <a className="link-arrow" href={s.url}>
                  {s.acao} <IconArrow />
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Contato ---------- */

export function Contato() {
 const [enviado,setEnviado] = useState(false);
 return <section className="contato" id="contato" aria-labelledby="contato-titulo"><div className="container contato-grid">
  <div className="io-reveal"><h2 id="contato-titulo" className="display display--md">Toda mudança<br/>começa com uma conversa.</h2>
  <p className="contato-sub">Esta é uma demonstração de site para imobiliárias. Experimente o formulário: os dados não são enviados nem armazenados.</p>
  <form className="contato-form" onSubmit={e => {e.preventDefault();setEnviado(true);}}>
   <label className="campo"><span className="campo-rotulo mono">Seu nome</span><input name="nome" placeholder="Como podemos chamar você?" required maxLength={80}/></label>
   <label className="campo"><span className="campo-rotulo mono">Seu interesse</span><select name="tipo"><option>Comprar um imóvel</option><option>Vender um imóvel</option><option>Conhecer este conceito</option></select></label>
   <label className="campo"><span className="campo-rotulo mono">Mensagem</span><textarea name="mensagem" placeholder="Conte o que você imagina." rows={4} maxLength={600}/></label>
   <button className="btn btn-primary" type="submit">Experimentar contato <IconArrow className="btn-ic"/></button>
   <p role="status" className="nota">{enviado ? 'Demonstração concluída. Nenhuma mensagem foi enviada.' : 'Formulário demonstrativo · sem envio de dados'}</p>
  </form></div>
  <aside className="contato-card io-reveal"><img src="/brand/imobiliaria.svg" width="56" height="56" alt=""/><p className="contato-nome">Imobiliária</p><p className="mono contato-creci">Conceito de site · Connecta Digital</p><ul className="contato-lista"><li><span className="mono">Endereço</span><span>Localização fica aqui</span></li><li><span className="mono">Atendimento</span><span>Seus canais de contato ficam aqui.</span></li></ul><p className="nota">Uma identidade genérica, um catálogo ilustrativo e espaço para a sua próxima ideia.</p></aside>
 </div></section>;
}
