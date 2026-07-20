# Baseline de Performance - Marketplace API

Gerado em: 2026-07-20T23:31:51.388Z
Node: v24.16.0

## Configuração

- Total de cenários: 2
- Observação: baseline de referência, não teste de carga de produção.

## Resultados

| Cenário | Requisições | Concorrência | Duração (ms) | RPS | Avg (ms) | P95 (ms) | P99 (ms) | Máx (ms) | Erros |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Leitura de catálogo | 200 | 20 | 697.01 | 286.94 | 43.03 | 147.74 | 148.69 | 309.28 | 0 |
| Criação de carrinho | 120 | 15 | 296.48 | 404.75 | 28.81 | 47.15 | 47.80 | 49.10 | 0 |