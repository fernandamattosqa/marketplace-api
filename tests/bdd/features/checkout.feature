# language: pt
Funcionalidade: Checkout
  Como QA da Marketplace API
  Quero validar o fechamento do pedido
  Para confirmar regras de negócio críticas

  Cenário: Checkout de carrinho vazio deve falhar
    Dado que existe um carrinho criado
    Quando eu fizer checkout do carrinho atual
    Então o status da resposta deve ser 422
    E o erro da resposta deve ser "carrinho_vazio"

  Cenário: Checkout com item no carrinho deve confirmar pedido
    Dado que existe um carrinho criado
    E eu adicionar o produto "p3" com quantidade 1 no carrinho atual
    Quando eu fizer checkout do carrinho atual
    Então o status da resposta deve ser 201
    E o pedido deve ser confirmado
