# Evidências de Requisições e Respostas

Este arquivo concentra as transações mais importantes da suíte de API em um formato próximo de Postman/Insomnia: rota, payload, status e resposta esperada/obtida.

## Como ler as evidências

- **Requisição**: método e endpoint testado.
- **Body**: payload enviado.
- **Status esperado**: o que o contrato pede.
- **Status obtido**: o que a mock devolve hoje.
- **Observação**: leitura de negócio do resultado.

## 1) Catálogo

### GET /produtos

| Campo | Valor |
|---|---|
| Requisição | `GET /produtos` |
| Body | `{}` |
| Status esperado | `200` |
| Status obtido | `200` |
| Resposta observada | Lista com 4 produtos: `p1`, `p2`, `p3`, `p4` |
| Observação | O catálogo está consistente com o enunciado. |

## 2) Criação de carrinho

### POST /carrinho

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho` |
| Body | `{}` |
| Status esperado | `201` |
| Status obtido | `201` |
| Resposta observada | `{ "id": "cart_1", "itens": [], "cupons": [] }` |
| Observação | Carrinho inicial criado corretamente. |

## 3) Adição de itens

### POST /carrinho/:id/itens com produto válido

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/itens` |
| Body | `{ "produtoId": "p1", "quantidade": 2 }` |
| Status esperado | `200` |
| Status obtido | `200` |
| Resposta observada | `subtotal: 59.8`, `frete: 20`, `total: 79.8` |
| Observação | Cálculo monetário e total com frete estão coerentes neste cenário. |

### POST /carrinho/:id/itens com estoque zerado

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/itens` |
| Body | `{ "produtoId": "p4", "quantidade": 1 }` |
| Status esperado | `422` |
| Status obtido | `200` |
| Resposta observada | Item aceito no carrinho |
| Observação | Defeito crítico: a mock não respeita estoque zero. |

### POST /carrinho/:id/itens com quantidade acima do estoque

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/itens` |
| Body | `{ "produtoId": "p3", "quantidade": 3 }` |
| Status esperado | `422` |
| Status obtido | `200` |
| Resposta observada | Item aceito no carrinho |
| Observação | Defeito crítico: a mock permite exceder estoque disponível. |

## 4) Cupons

### POST /carrinho/:id/cupom com código válido em maiúsculo

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/cupom` |
| Body | `{ "codigo": "PERCENT10" }` |
| Status esperado | `200` |
| Status obtido | `200` ou `422` conforme subtotal do carrinho |
| Resposta observada | Quando elegível, retorna subtotais com desconto aplicado |
| Observação | A regra de mínimo interfere diretamente na aceitação. |

### POST /carrinho/:id/cupom com código em minúsculo

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/cupom` |
| Body | `{ "codigo": "percent10" }` |
| Status esperado | `200` |
| Status obtido | `200` |
| Resposta observada | Cupom normalizado para `PERCENT10` |
| Observação | A API converte para maiúsculo corretamente. |

### POST /carrinho/:id/cupom com cupom inexistente

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/cupom` |
| Body | `{ "codigo": "INEXISTENTE" }` |
| Status esperado | `422` |
| Status obtido | `422` |
| Resposta observada | `{ "erro": "cupom_inexistente" }` |
| Observação | Rejeição consistente. |

### POST /carrinho/:id/cupom com cupom expirado

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/cupom` |
| Body | `{ "codigo": "FIXO20" }` |
| Status esperado | `422` |
| Status obtido | `200` |
| Resposta observada | Cupom aceito e desconto aplicado |
| Observação | Defeito crítico: validade não é validada. |

### POST /carrinho/:id/cupom em carrinho com subtotal exato de R$ 50,00

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/cupom` |
| Body | `{ "codigo": "PERCENT10" }` |
| Status esperado | `200` |
| Status obtido | `422` |
| Resposta observada | `{ "erro": "min_compra_nao_atingido" }` |
| Observação | Defeito funcional: o contrato pede mínimo inclusivo. |

### POST /carrinho/:id/cupom com FRETEGRATIS em subtotal exato de R$ 100,00

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/cupom` |
| Body | `{ "codigo": "FRETEGRATIS" }` |
| Status esperado | `200` |
| Status obtido | `422` |
| Resposta observada | `{ "erro": "min_compra_nao_atingido" }` |
| Observação | Outra divergência de mínimo inclusivo. |

### POST /carrinho/:id/cupom com acumulacao de cupom

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/cupom` seguido de `POST /carrinho/cart_1/cupom` |
| Body | `{ "codigo": "PERCENT10" }` e depois `{ "codigo": "FRETEGRATIS" }` |
| Status esperado | Segunda chamada `422` |
| Status obtido | Segunda chamada `200` |
| Resposta observada | A mock aceita mais de um cupom no mesmo carrinho |
| Observação | Defeito crítico de regra comercial. |

### POST /carrinho/:id/cupom com SELLERB15

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/cupom` |
| Body | `{ "codigo": "SELLERB15" }` |
| Status esperado | `200` |
| Status obtido | `200` |
| Resposta observada | Desconto calculado sobre subtotal total |
| Observação | O escopo por seller não é respeitado. |

### POST /carrinho/:id/cupom com NOVATO5 em uso repetido

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/cupom` em dois carrinhos diferentes |
| Body | `{ "codigo": "NOVATO5" }` |
| Status esperado | Primeiro uso `200`, segundo uso `422` |
| Status obtido | Primeiro uso `200`, segundo uso `200` |
| Resposta observada | Cupom ainda aceito no segundo uso |
| Observação | O limite de uso não é respeitado. |

## 5) Checkout

### POST /carrinho/:id/checkout com carrinho vazio

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/checkout` |
| Body | `{}` |
| Status esperado | `422` |
| Status obtido | `422` |
| Resposta observada | `{ "erro": "carrinho_vazio" }` |
| Observação | Regra consistente. |

### POST /carrinho/:id/checkout com itens válidos

| Campo | Valor |
|---|---|
| Requisição | `POST /carrinho/cart_1/checkout` |
| Body | `{}` |
| Status esperado | `201` |
| Status obtido | `201` |
| Resposta observada | `{ id, status: "confirmado", subtotal, desconto, frete, total }` |
| Observação | Fluxo base de checkout funciona. |

## 6) Como automatizar esse tipo de evidência

A forma mais simples e útil e registrar cada chamada em um array de evidencias dentro do helper de teste. O helper pode salvar:

- metodo;
- rota;
- body enviado;
- status retornado;
- corpo da resposta.

Com isso, ao fim da execucao, e possivel gerar automaticamente um arquivo Markdown ou JSON com cara de Postman/Insomnia, sem depender de captura manual de tela.

Sugestao pratica:

1. usar um helper como `requestWithEvidence`;
2. salvar o resultado em `docs/evidencias-output.md` ou `artifacts/evidencias.json`;
3. anexar esse arquivo na entrega final.

Isso melhora a leitura do avaliador e deixa o projeto mais profissional.
