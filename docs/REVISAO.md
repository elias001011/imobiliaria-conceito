# Revisão técnica — 14/11/2026

## Escopo e decisões

Revisão do aplicativo, estilos, cena 3D, ativos, dependências e configuração de publicação estática. O histórico de implantação e arquivos internos da infraestrutura não integram esta publicação pública.

- Barra de filtros no celular: substituição das margens negativas e da largura intrínseca por uma grade com espaço animado para o ícone. O contêiner de categorias mantém largura limitada e não usa ancoragem de rolagem horizontal.
- Ciclo de vida: cancelamento de quadros e temporizadores ao desmontar componentes; cancelamento do foco adiado ao recolher a pesquisa.
- Retorno do tour: validação do registro de sessão e interrupção das tentativas de reposicionar assim que há interação do visitante.
- Filtros: lógica pura isolada da interface e validação centralizada dos tipos recebidos pela URL.
- Dependências: override restrito de minimatch em typescript-estree até uma versão corrigida; reavaliar quando a dependência superior incorporar a correção. Lint, testes e build devem validar alterações nesse override.

## Limites de produção

O site é uma demonstração estática. O formulário não faz requisições; não há endpoints de envio, autenticação ou persistência de dados de contato. Não publique código-fonte, dependências de build, backups ou credenciais junto com `dist/`.

O exemplo Caddy aplica CSP sem `unsafe-inline` ou `unsafe-eval` para scripts, impede incorporação por frames, isola recursos na mesma origem e restringe métodos a GET e HEAD. Respostas de erro não devem receber cache permanente. Não habilite listagem de diretórios ou fallback irrestrito para o HTML.

Preserve chunks com hash de versões anteriores durante atualizações para não quebrar imports dinâmicos de abas já abertas. Substitua o HTML somente após disponibilizar seus arquivos de referência. A infraestrutura pode adicionar limites e políticas próprios conforme a hospedagem.

## Reprodução das verificações

```sh
npm ci
npm run lint
npm test
npm run build
npm audit
```

Confira também no servidor real: códigos 200 nas rotas conhecidas, 404 para arquivos inexistentes e caminhos sensíveis, 405 para métodos de escrita, presença dos cabeçalhos e `Cache-Control: no-store` em erros. Verifique a barra de filtros em rolagem nos dois sentidos em larguras de celular.

Uma revisão e uma auditoria de dependências são verificações delimitadas no tempo; não constituem certificação de ausência de falhas futuras.
