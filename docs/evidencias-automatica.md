# Evidências Automatizadas de Requisições e Respostas

Este arquivo foi gerado automaticamente a partir de chamadas reais feitas contra a mock API.

## Resumo

- Total de chamadas capturadas: 17
- Fonte: execução automatizada via Node.js

## 1) Catálogo completo

- Requisição: `GET /produtos`
- Body: `{}`
- Status esperado: `200`
- Status obtido: `200`
- Resposta:
```json
[
  {
    "id": "p1",
    "nome": "Fone Bluetooth",
    "preco": 29.9,
    "estoque": 5,
    "sellerId": "sellerA"
  },
  {
    "id": "p2",
    "nome": "Capa de Celular",
    "preco": 25,
    "estoque": 10,
    "sellerId": "sellerA"
  },
  {
    "id": "p3",
    "nome": "Carregador Turbo",
    "preco": 59.9,
    "estoque": 2,
    "sellerId": "sellerB"
  },
  {
    "id": "p4",
    "nome": "Cabo USB-C",
    "preco": 15,
    "estoque": 0,
    "sellerId": "sellerB"
  }
]
```

## 2) Criar carrinho vazio

- Requisição: `POST /carrinho`
- Body: `{}`
- Status esperado: `201`
- Status obtido: `201`
- Resposta:
```json
{
  "id": "cart_1",
  "itens": [],
  "cupons": []
}
```

## 3) Adicionar item válido

- Requisição: `POST /carrinho/cart_1/itens`
- Body: `{
  "produtoId": "p1",
  "quantidade": 2
}`
- Status esperado: `200`
- Status obtido: `200`
- Resposta:
```json
{
  "subtotal": 59.8,
  "desconto": 0,
  "frete": 20,
  "total": 79.8,
  "itens": [
    {
      "produtoId": "p1",
      "nome": "Fone Bluetooth",
      "quantidade": 2,
      "precoUnitario": 29.9,
      "subtotal": 59.8
    }
  ],
  "cuponsAplicados": []
}
```

## 4) Estoque zero rejeitado

- Requisição: `POST /carrinho/cart_1/itens`
- Body: `{
  "produtoId": "p4",
  "quantidade": 1
}`
- Status esperado: `422`
- Status obtido: `200`
- Resposta:
```json
{
  "subtotal": 74.8,
  "desconto": 0,
  "frete": 20,
  "total": 94.8,
  "itens": [
    {
      "produtoId": "p1",
      "nome": "Fone Bluetooth",
      "quantidade": 2,
      "precoUnitario": 29.9,
      "subtotal": 59.8
    },
    {
      "produtoId": "p4",
      "nome": "Cabo USB-C",
      "quantidade": 1,
      "precoUnitario": 15,
      "subtotal": 15
    }
  ],
  "cuponsAplicados": []
}
```

## 5) Quantidade acima do estoque

- Requisição: `POST /carrinho/cart_1/itens`
- Body: `{
  "produtoId": "p3",
  "quantidade": 3
}`
- Status esperado: `422`
- Status obtido: `200`
- Resposta:
```json
{
  "subtotal": 254.5,
  "desconto": 0,
  "frete": 20,
  "total": 274.5,
  "itens": [
    {
      "produtoId": "p1",
      "nome": "Fone Bluetooth",
      "quantidade": 2,
      "precoUnitario": 29.9,
      "subtotal": 59.8
    },
    {
      "produtoId": "p4",
      "nome": "Cabo USB-C",
      "quantidade": 1,
      "precoUnitario": 15,
      "subtotal": 15
    },
    {
      "produtoId": "p3",
      "nome": "Carregador Turbo",
      "quantidade": 3,
      "precoUnitario": 59.9,
      "subtotal": 179.7
    }
  ],
  "cuponsAplicados": []
}
```

## 6) Cupom PERCENT10 elegível

- Requisição: `POST /carrinho/cart_1/cupom`
- Body: `{
  "codigo": "PERCENT10"
}`
- Status esperado: `200`
- Status obtido: `200`
- Resposta:
```json
{
  "subtotal": 254.5,
  "desconto": 25.450000000000003,
  "frete": 20,
  "total": 249.05,
  "itens": [
    {
      "produtoId": "p1",
      "nome": "Fone Bluetooth",
      "quantidade": 2,
      "precoUnitario": 29.9,
      "subtotal": 59.8
    },
    {
      "produtoId": "p4",
      "nome": "Cabo USB-C",
      "quantidade": 1,
      "precoUnitario": 15,
      "subtotal": 15
    },
    {
      "produtoId": "p3",
      "nome": "Carregador Turbo",
      "quantidade": 3,
      "precoUnitario": 59.9,
      "subtotal": 179.7
    }
  ],
  "cuponsAplicados": [
    "PERCENT10"
  ]
}
```

## 7) Cupom PERCENT10 em minúsculo

- Requisição: `POST /carrinho/cart_1/cupom`
- Body: `{
  "codigo": "percent10"
}`
- Status esperado: `200`
- Status obtido: `200`
- Resposta:
```json
{
  "subtotal": 254.5,
  "desconto": 50.900000000000006,
  "frete": 20,
  "total": 223.6,
  "itens": [
    {
      "produtoId": "p1",
      "nome": "Fone Bluetooth",
      "quantidade": 2,
      "precoUnitario": 29.9,
      "subtotal": 59.8
    },
    {
      "produtoId": "p4",
      "nome": "Cabo USB-C",
      "quantidade": 1,
      "precoUnitario": 15,
      "subtotal": 15
    },
    {
      "produtoId": "p3",
      "nome": "Carregador Turbo",
      "quantidade": 3,
      "precoUnitario": 59.9,
      "subtotal": 179.7
    }
  ],
  "cuponsAplicados": [
    "PERCENT10",
    "PERCENT10"
  ]
}
```

## 8) Cupom expirado FIXO20

- Requisição: `POST /carrinho/cart_1/cupom`
- Body: `{
  "codigo": "FIXO20"
}`
- Status esperado: `422`
- Status obtido: `200`
- Resposta:
```json
{
  "subtotal": 254.5,
  "desconto": 70.9,
  "frete": 20,
  "total": 203.6,
  "itens": [
    {
      "produtoId": "p1",
      "nome": "Fone Bluetooth",
      "quantidade": 2,
      "precoUnitario": 29.9,
      "subtotal": 59.8
    },
    {
      "produtoId": "p4",
      "nome": "Cabo USB-C",
      "quantidade": 1,
      "precoUnitario": 15,
      "subtotal": 15
    },
    {
      "produtoId": "p3",
      "nome": "Carregador Turbo",
      "quantidade": 3,
      "precoUnitario": 59.9,
      "subtotal": 179.7
    }
  ],
  "cuponsAplicados": [
    "PERCENT10",
    "PERCENT10",
    "FIXO20"
  ]
}
```

## 9) PERCENT10 no mínimo de R$ 50,00

- Requisição: `POST /carrinho/cart_2/cupom`
- Body: `{
  "codigo": "PERCENT10"
}`
- Status esperado: `200`
- Status obtido: `422`
- Resposta:
```json
{
  "erro": "min_compra_nao_atingido"
}
```

## 10) FRETEGRATIS no mínimo de R$ 100,00

- Requisição: `POST /carrinho/cart_3/cupom`
- Body: `{
  "codigo": "FRETEGRATIS"
}`
- Status esperado: `200`
- Status obtido: `422`
- Resposta:
```json
{
  "erro": "min_compra_nao_atingido"
}
```

## 11) Primeiro cupom no carrinho

- Requisição: `POST /carrinho/cart_4/cupom`
- Body: `{
  "codigo": "PERCENT10"
}`
- Status esperado: `200`
- Status obtido: `200`
- Resposta:
```json
{
  "subtotal": 59.9,
  "desconto": 5.99,
  "frete": 20,
  "total": 73.91,
  "itens": [
    {
      "produtoId": "p3",
      "nome": "Carregador Turbo",
      "quantidade": 1,
      "precoUnitario": 59.9,
      "subtotal": 59.9
    }
  ],
  "cuponsAplicados": [
    "PERCENT10"
  ]
}
```

## 12) Segundo cupom no mesmo carrinho

- Requisição: `POST /carrinho/cart_4/cupom`
- Body: `{
  "codigo": "FRETEGRATIS"
}`
- Status esperado: `422`
- Status obtido: `422`
- Resposta:
```json
{
  "erro": "min_compra_nao_atingido"
}
```

## 13) Cupom SELLERB15

- Requisição: `POST /carrinho/cart_5/cupom`
- Body: `{
  "codigo": "SELLERB15"
}`
- Status esperado: `200`
- Status obtido: `200`
- Resposta:
```json
{
  "subtotal": 89.8,
  "desconto": 13.469999999999999,
  "frete": 20,
  "total": 96.33,
  "itens": [
    {
      "produtoId": "p1",
      "nome": "Fone Bluetooth",
      "quantidade": 1,
      "precoUnitario": 29.9,
      "subtotal": 29.9
    },
    {
      "produtoId": "p3",
      "nome": "Carregador Turbo",
      "quantidade": 1,
      "precoUnitario": 59.9,
      "subtotal": 59.9
    }
  ],
  "cuponsAplicados": [
    "SELLERB15"
  ]
}
```

## 14) Primeiro uso do NOVATO5

- Requisição: `POST /carrinho/cart_6/cupom`
- Body: `{
  "codigo": "NOVATO5"
}`
- Status esperado: `200`
- Status obtido: `200`
- Resposta:
```json
{
  "subtotal": 29.9,
  "desconto": 5,
  "frete": 20,
  "total": 44.9,
  "itens": [
    {
      "produtoId": "p1",
      "nome": "Fone Bluetooth",
      "quantidade": 1,
      "precoUnitario": 29.9,
      "subtotal": 29.9
    }
  ],
  "cuponsAplicados": [
    "NOVATO5"
  ]
}
```

## 15) Segundo uso do NOVATO5

- Requisição: `POST /carrinho/cart_7/cupom`
- Body: `{
  "codigo": "NOVATO5"
}`
- Status esperado: `422`
- Status obtido: `200`
- Resposta:
```json
{
  "subtotal": 29.9,
  "desconto": 5,
  "frete": 20,
  "total": 44.9,
  "itens": [
    {
      "produtoId": "p1",
      "nome": "Fone Bluetooth",
      "quantidade": 1,
      "precoUnitario": 29.9,
      "subtotal": 29.9
    }
  ],
  "cuponsAplicados": [
    "NOVATO5"
  ]
}
```

## 16) Checkout de carrinho vazio

- Requisição: `POST /carrinho/cart_7/checkout`
- Body: `{}`
- Status esperado: `422`
- Status obtido: `201`
- Resposta:
```json
{
  "id": "order_1",
  "subtotal": 29.9,
  "desconto": 5,
  "frete": 20,
  "total": 44.9,
  "itens": [
    {
      "produtoId": "p1",
      "nome": "Fone Bluetooth",
      "quantidade": 1,
      "precoUnitario": 29.9,
      "subtotal": 29.9
    }
  ],
  "cuponsAplicados": [
    "NOVATO5"
  ],
  "status": "confirmado"
}
```

## 17) Carrinho inexistente

- Requisição: `GET /carrinho/cart_inexistente`
- Body: `{}`
- Status esperado: `404`
- Status obtido: `404`
- Resposta:
```json
{
  "erro": "carrinho_nao_encontrado"
}
```
