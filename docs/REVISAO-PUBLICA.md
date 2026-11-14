# Revisão do repositório público — 14/11/2026

Base da revisão: `c4a26e3ad23f294b77c81cf851bcf8f580d22de1`. Escopo: aplicação, ciclo de vida do WebGL, filtros, diálogos, panorama, dependências, ativos, documentação e publicação estática. Esta revisão preserva geometria, trajetória da câmera, posição do sol, cores e intensidades de iluminação. A alteração visual solicitada foi remover o subtítulo “imóveis” da marca na navegação.

## Correções

- Um ajuste adaptativo de resolução podia agendar dois ciclos de animação simultâneos. Um agendador único agora combina pedidos de redesenho e cancela o quadro pendente ao pausar ou desmontar a cena.
- Elementos removidos pelos filtros deixam de ficar registrados no observador de revelações. O fallback sem IntersectionObserver também revela novos resultados.
- A imagem de abertura acompanha o tema enquanto o WebGL está descartado fora da tela. Navegadores sem os observadores necessários usam a apresentação estática; o contexto temporário usado para testar WebGL é liberado.
- Navegação por hash sincroniza a ficha aberta; trocar o imóvel reinicia sua fotografia e fecha a ampliação anterior.
- O panorama trata perda de contexto, descarta recursos carregados após falha/desmontagem, encerra arrastos corretamente e preserva atalhos de zoom do navegador.

## Verificações automatizadas

Instalação limpa com `npm ci --ignore-scripts`, lint sem avisos, **18 testes aprovados**, TypeScript e build de produção aprovados. `npm audit` não reportou vulnerabilidades conhecidas na árvore instalada na data da revisão; isso inclui dependências de desenvolvimento.

O ESLint foi atualizado da versão 9 para 10; o requisito mínimo passou a Node 22.13 ou 24+. A [política de suporte oficial](https://eslint.org/version-support/) informa o fim do suporte da versão 9. A integração contínua usa Node 24 e repete instalação, lint, testes, build e auditoria.

`scripts/check-static.mjs` verifica os **81 arquivos** do build: caminhos autorizados, ausência de links simbólicos, arquivos ocultos, source maps e padrões conhecidos de credenciais; scripts externos/inline e SVGs ativos; existência de imports JavaScript, recursos CSS, fotografias, imagens de abertura, panorama e licenças. Os testes incluem falhas deliberadas para referências ausentes, arquivos proibidos e links simbólicos.

Os sete commits anteriores da base pública foram examinados para padrões de chaves privadas e tokens comuns, sem ocorrências. Os SVGs locais foram examinados sem scripts, eventos ou referências externas. Essa busca por padrões não prova ausência de todo tipo de informação sensível.

## Navegação e hospedagem

Conferidos em navegador: filtros combinados, abertura da ficha pelo cartão, ampliação da foto dentro da ficha, retorno por Esc, navegação para contato, controles e retorno do tour 360°, menu e troca de tema. Em larguras de 320 e 360 px, o cabeçalho ficou sem transbordamento horizontal; a posição dos botões permaneceu estável na rolagem nos dois sentidos.

Conferidos no servidor HTTPS: rotas conhecidas retornam 200; caminhos desconhecidos, arquivos ausentes, `/.env` e `/.git/config` retornam 404; POST retorna 405 com `Allow: GET, HEAD`. As respostas mantêm CSP, HSTS, nosniff, proteção contra frames, Permissions-Policy e isolamento de origem; erros usam `Cache-Control: no-store`. Não foram enviados cookies nessas respostas.

O preview oficial permanece em **https://imob.connectabr.digital**. Só o build estático é publicado; não há backend ou processo Node atendendo o site. A implantação mantém os arquivos com hash da versão anterior para abas já abertas.

## Autoria e limites

A licença restritiva de consulta e a autoria Connecta foram preservadas. Os textos integrais de licença de React, React DOM, Scheduler e Three.js acompanham o site; a proveniência das fontes foi ajustada aos quatro arquivos realmente usados.

Foi identificado o autor da referência `card-25`: Ravi Katiyar. A página pública consultada não informa licença para esse componente; a autorização de redistribuição permanece sem confirmação, registrada em [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). A revisão técnica não resolve essa pendência de direitos de terceiros nem representa certificação de segurança.
