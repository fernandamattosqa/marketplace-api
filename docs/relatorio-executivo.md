# Relatorio Executivo - QA Marketplace API

## Visao geral

Este projeto avalia a funcionalidade de cupom no carrinho e no checkout de um marketplace multi-seller. A cobertura foi desenhada para priorizar risco financeiro, regras de elegibilidade, estoque, arredondamento e comportamento de checkout.

## Escopo validado

- Catalogo de produtos.
- Criacao e consulta de carrinho.
- Adicao de itens com validacoes de produto e estoque.
- Aplicacao de cupons.
- Calcululo de subtotal, desconto, frete e total.
- Checkout do pedido.
- Regras de negocio para minimo de compra, validade, exclusividade de cupom, escopo por seller e limite de uso.

## Cobertura automatizada

- 42 cenarios no total.
- 29 passaram.
- 13 falharam e representam defeitos reais da mock API.

## Evidencias de requisicoes e respostas

Para deixar a entrega mais parecida com o que se veria em Insomnia/Postman, a recomendacao e registrar cada transacao com:

- metodo e rota;
- payload enviado;
- status HTTP;
- corpo da resposta;
- observacao de negocio quando houver divergencia.

Exemplo de transacao valida:

| Campo | Valor |
|---|---|
| Requisicao | `POST /carrinho` |
| Body | `{}` |
| Status | `201` |
| Resposta | `{ "id": "cart_1", "itens": [], "cupons": [] }` |

Exemplo de transacao com cupom:

| Campo | Valor |
|---|---|
| Requisicao | `POST /carrinho/cart_1/cupom` |
| Body | `{ "codigo": "PERCENT10" }` |
| Status esperado | `200` |
| Resposta esperada | subtotal, desconto, frete, total e `cuponsAplicados` |

Exemplo de falha de negocio:

| Campo | Valor |
|---|---|
| Requisicao | `POST /carrinho/cart_1/itens` |
| Body | `{ "produtoId": "p4", "quantidade": 1 }` |
| Status esperado | `422` |
| Resultado obtido | `200` |

## Como otimizar o projeto para esse tipo de evidencia

1. Centralizar as chamadas em um helper unico de request, para capturar request e response sem repetir logica.
2. Gerar um arquivo de saida em Markdown ou JSON com as transacoes executadas, no formato de colecao de evidencias.
3. Separar o que e verificacao automatizada do que e documentacao executiva.
4. Manter poucos cenarios, mas com payloads e respostas explicitados, para reproduzir rapidamente no estilo Postman.

Isso deixa a entrega mais forte porque o avaliador enxerga nao so o teste, mas tambem a trilha de requisicao, resposta e impacto de negocio.

## Principais riscos identificados

1. Venda sem estoque.
2. Aplicacao de cupom fora das regras.
3. Desconto em escopo incorreto para marketplace multi-seller.
4. Promocoes sendo aceitas fora do limite de uso.

## Sumario dos bugs

- Estoque nao validado no add-item.
- Minimo de compra nao inclusivo.
- Cupom expirado ainda aceito.
- Acumulo de cupons permitido.
- `SELLERB15` aplicado sobre o subtotal total.
- `NOVATO5` aceito acima do limite.

## Prioridade de correção

1. Estoque.
2. Validade de cupons.
3. Minimo inclusivo.
4. Nao acumulacao.
5. Escopo por seller.
6. Limite de uso.

## Onde olhar

- Estrategia e analise: [parte1-estrategia.md](parte1-estrategia.md)
- Estrategia E2E: [parte2-estrategia-e2e.md](parte2-estrategia-e2e.md)
- Relatorio de bugs: [parte3-bugs.md](parte3-bugs.md)
- Trade-offs: [tradeoffs.md](tradeoffs.md)

## Conclusao

A suite atual nao e apenas uma lista de asserts: ela funciona como uma bateria de QA orientada a risco, com falhas que apontam diretamente para defeitos de negocio de maior impacto.