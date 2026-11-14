# Imobiliária — conceito por Connecta

Experiência de portfólio criada pela **Connecta** para demonstrar desenvolvimento de interfaces, animação por rolagem e renderização 3D na web.

**[Preview na VPS — imob.connectabr.digital](https://imob.connectabr.digital)** · [Connecta](https://connectabr.digital) · [Licença de consulta](LICENSE.md)

> Código público para avaliação técnica. Todos os direitos sobre os elementos originais são reservados à Connecta. Não é um template livre: reutilização, redistribuição, derivados e uso comercial exigem autorização escrita. Consulte a licença, inclusive a ressalva sobre as permissões do GitHub e os materiais de terceiros.

## A experiência

- Hero com casa e paisagem procedurais em Three.js. A câmera percorre deck, fachada, porta e interior conforme a rolagem.
- Temas claro e escuro com iluminação correspondente na cena e transição suave de cores.
- Catálogo com pesquisa local por tipo, código e palavra, além de seis destaques na página inicial.
- Cartões com fotografias empilhadas, ficha em diálogo nativo e galeria ampliada dentro da ficha.
- Demonstração panorâmica 360° no primeiro imóvel, com retorno à ficha e à posição anterior.
- Layout responsivo, navegação por teclado, movimento reduzido e imagem estática quando a experiência WebGL não está disponível.

Os imóveis, valores e características são fictícios. As fotografias são ilustrativas. O formulário é demonstrativo: não envia nem armazena os dados preenchidos.

O preview oficial é hospedado na VPS da Connecta em **https://imob.connectabr.digital**. Este repositório guarda o código versionado do site; GitHub Pages não é utilizado para hospedagem.

## Arquitetura

**React 19 · TypeScript · Vite · Three.js · CSS nativo**

O resultado de produção é exclusivamente estático: HTML, CSS, JavaScript, fontes e imagens em `dist/`. Não há API, banco de dados, SSR ou processo Node em produção. Node é usado somente para desenvolvimento, verificações e build.

```text
src/
  components/    navegação, catálogo, fichas e experiência 360°
  data/          catálogo demonstrativo
  hero/          progresso, textos e ciclo de vida do hero
  hero3d/        câmera, geometria, materiais e iluminação procedurais
  lib/           filtros, tema e utilitários
  styles/        estilos e adaptação responsiva
public/          imagens, panorama, fontes e identidade visual locais
tests/           testes de comportamento sem dependências adicionais
deploy/          exemplo independente de configuração Caddy
docs/            proveniência dos recursos e notas técnicas
```

Rotas: `/` (apresentação), `/imoveis` e `/imoveis/` (catálogo), `/tour360` (panorama). O servidor de produção deve limitar o fallback de HTML a essas rotas; caminhos desconhecidos retornam 404.

## Verificação técnica

As instruções abaixo documentam o processo de manutenção pela Connecta. Não ampliam as permissões da licença.

Requisito: Node.js 22.12 ou superior e npm. Não há variáveis secretas nem arquivo `.env` necessário.

```sh
npm ci
npm run lint
npm test
npm run build
npm audit
```

`npm run dev` inicia o ambiente de desenvolvimento; `npm run preview` permite conferir o build localmente. Ambos são ferramentas locais, não servidores de produção.

Os testes cobrem filtros combinados, busca sem acentos, parâmetros inválidos, integridade do catálogo 360°, validação do retorno do tour e continuidade numérica do trajeto da câmera em formatos vertical e horizontal. A integração contínua executa lint, testes, build e auditoria de dependências.

## Publicação estática e segurança

Apenas `dist/` deve ser publicado. O [exemplo Caddy](deploy/Caddyfile.example) documenta CSP, isolamento de origem, HTTPS, métodos de leitura, proteção de caminhos sensíveis e cache. Adapte domínio e diretório no ambiente de hospedagem. Cabeçalhos dependem do servidor; Vite não os incorpora automaticamente ao build.

As imagens e fontes usadas pela aplicação são locais. Não há scripts de analytics, iframes ou requisições a APIs externas. O tema usa `localStorage`; o retorno do tour usa `sessionStorage`. Links externos de crédito e indicação só são acessados por ação do visitante.

Ao atualizar, publique os novos arquivos antes do HTML e preserve temporariamente os chunks com hash da versão anterior: uma aba aberta pode solicitá-los posteriormente. Consulte as [notas de segurança e revisão](docs/REVISAO.md).

## Autoria e recursos

Concepção e desenvolvimento: **Connecta**. Os direitos sobre código e elementos originais seguem [LICENSE.md](LICENSE.md).

Fontes, fotografias, panorama, referências e dependências têm direitos próprios. Consulte [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), [fontes das fotos](docs/FOTOS.json) e [fonte do panorama](docs/PANORAMA.json). A licença restritiva do projeto não altera as licenças desses materiais.
