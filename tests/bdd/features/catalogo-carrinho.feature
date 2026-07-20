# language: pt
Funcionalidade: Catálogo e carrinho
  Como QA da Marketplace API
  Quero validar operações essenciais de catálogo e carrinho
  Para garantir o fluxo básico de compra

  Cenário: Listar produtos do catálogo
    Quando eu fizer uma requisição GET para "/produtos"
    Então o status da resposta deve ser 200
    E a lista de produtos deve conter 4 itens

  Cenário: Criar carrinho vazio
    Quando eu criar um novo carrinho
    Então o status da resposta deve ser 201
    E o carrinho deve estar vazio

  Cenário: Adicionar item válido atualiza total do carrinho
    Dado que existe um carrinho criado
    Quando eu adicionar o produto "p1" com quantidade 2 no carrinho atual
    Então o status da resposta deve ser 200
    E o subtotal do carrinho deve ser 59.8
    E o total do carrinho deve ser 79.8
