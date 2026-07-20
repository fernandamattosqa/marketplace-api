# Teste pratico QA - Marketplace API (node:test)

Projeto de automacao API com runner nativo do Node para o desafio de cupom no checkout.

## Fluxo rapido

1. Executar a suite de testes.
2. Gerar evidencias automatizadas de request/response.
3. Gerar dashboard HTML para apresentacao.

Comandos:

```bash
npm test
npm run report:evidence
npm run report:html
```

## Requisitos

- Node.js 18+
- npm 9+

## Instalar

```bash
npm install
```

Observacao: para executar os testes deste projeto, o Node ja e suficiente.
`npm install` so e necessario se voce quiser manter lockfile/dependencias sincronizados.

## Rodar API mock

```bash
npm run mock:api
```

API sobe em `http://localhost:3000`.

## Executar testes

```bash
npm test
```

Modo watch:

```bash
npm run test:watch
```

## Comandos principais

| Comando | Objetivo |
|---|---|
| `npm test` | Executa todos os testes de API (`node:test`). |
| `npm run test:watch` | Executa testes em modo watch. |
| `npm run report:evidence` | Gera evidencias automatizadas de requisicoes e respostas. |
| `npm run report:perf` | Gera baseline de performance (RPS, média, P95/P99). |
| `npm run report:html` | Gera dashboard HTML para apresentacao. |
| `npm run mock:api` | Sobe a mock API localmente em `http://localhost:3000`. |

## Pipeline CI no GitHub

Este projeto ja inclui pipeline em GitHub Actions:

- `.github/workflows/ci.yml`

Fluxo da pipeline em push/PR:
1. Instala dependencias.
2. Executa `npm test` (modo nao bloqueante, para manter o fluxo de bug report do desafio).
3. Gera evidencias, baseline de performance e dashboard.
4. Publica artefatos em `Actions > Artifacts`.

Se quiser transformar em gate estrito (pipeline quebrando com teste falhando), altere no workflow:

- `CI_STRICT: "true"`

## Como interpretar o resultado dos testes

- Esta entrega foi desenhada para validar o contrato esperado e evidenciar divergencias da mock API.
- Portanto, cenarios falhando indicam defeitos reais da implementacao mock (e nao instabilidade do teste).
- Em ambiente real, o objetivo seria corrigir o backend ate a suite ficar 100% verde.

## Arquivos principais da entrega

- [docs/relatorio-dashboard.html](docs/relatorio-dashboard.html): dashboard visual para apresentacao.
- [docs/relatorio-executivo.md](docs/relatorio-executivo.md): resumo executivo com escopo, riscos e priorizacao.
- [docs/evidencias-automatica.md](docs/evidencias-automatica.md): evidencias geradas automaticamente a partir de chamadas reais.
- [docs/evidencias-requisicoes.md](docs/evidencias-requisicoes.md): evidencias em formato descritivo tipo Postman/Insomnia.
- [docs/parte1-estrategia.md](docs/parte1-estrategia.md): estrategia e design de testes.
- [docs/parte2-estrategia-e2e.md](docs/parte2-estrategia-e2e.md): estrategia E2E sem implementacao.
- [docs/parte3-bugs.md](docs/parte3-bugs.md): relatorio de bugs com severidade e prioridade.
- [docs/tradeoffs.md](docs/tradeoffs.md): nota de trade-offs e riscos remanescentes.

## Estrutura

- `mock-marketplace-api.js`: API mock recebida no enunciado
- `tests/api`: testes de contrato e casos de borda com `node:test`
- `docs/relatorio-executivo.md`: resumo executivo com cobertura, riscos e bugs
- `docs/evidencias-requisicoes.md`: evidencias de requisicoes, respostas e status no estilo Postman/Insomnia
- `docs/parte1-estrategia.md`: analise de risco, perguntas ao PO, design e priorizacao
- `docs/parte2-estrategia-e2e.md`: estrategia de distribuicao E2E x API x unitario
- `docs/parte3-bugs.md`: relatorio de bugs com reproducao e severidade/prioridade
- `docs/tradeoffs.md`: nota de trade-offs e riscos remanescentes

## Limitacoes conhecidas

- A mock API contem defeitos intencionais do desafio.
- A cobertura foi focada em API; nao ha front Vue em execucao para E2E real.
- O objetivo principal desta entrega e demonstrar priorizacao, rastreabilidade e comunicacao de risco.

## Como subir no GitHub

1. Criar um repositorio vazio no GitHub.
2. Rodar localmente:

```bash
git remote add origin <url-do-repositorio>
git add .
git commit -m "chore: add QA suite, reports and CI"
git branch -M main
git push -u origin main
```

3. Abrir a aba Actions no GitHub e acompanhar a execucao da pipeline QA API CI.
