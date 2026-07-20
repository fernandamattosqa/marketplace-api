# Nota de trade-offs

A suite foi mantida enxuta no desenho inicial, mas a cobertura foi ampliada para 25 cenarios no total, cobrindo catalogo, ciclo de vida do carrinho, validacoes de rota, cupom, frete, checkout e estoque. Eu mantive o foco em API porque o front nao foi disponibilizado, e essa camada permite validar a maior parte da logica de negocio com rapidez.

O que ficou de fora por tempo:
- testes de resiliencia (timeouts, retries, falhas transientes);
- testes de concorrencia (corrida em limite de uso e estoque);
- casos de contrato HTTP mais detalhados (schema completo, headers, observabilidade);
- matriz completa de combinacoes entre todos os cupons e todos os sellers.

Com mais tempo, eu adicionaria:
- validacao automatica de schema (OpenAPI/JSON Schema);
- testes de regressao com dados tabulares para cupons;
- pipeline CI com relatorio JUnit + HTML;
- cenarios E2E reais no front (mensagens, estados visuais e persistencia no fluxo).

Riscos remanescentes:
- possiveis divergencias de arredondamento em cenarios nao cobertos;
- comportamento sob concorrencia (especialmente `NOVATO5` e estoque);
- ausencia de verificacao de seguranca/autorizacao neste escopo.
