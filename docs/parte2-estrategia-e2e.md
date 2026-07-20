# Parte 2 - Estrategia E2E (sem implementacao)

## Distribuicao de cobertura por camada

API (maior fatia):
- Regras de cupom, calculo de totais, frete e estoque.
- Motivo: alta variacao combinatoria e retorno rapido sem custo de UI.

Unitario (back):
- Funcoes puras de calculo (`calcularTotais`) e validacao (`validarCupom`).
- Motivo: validar rapidamente combinacoes de borda e rounding com granularidade.

E2E (Vue):
- Fluxos ponta a ponta criticos com integracao real de UI + API.
- Motivo: validar ligacao de camadas (estado de carrinho, exibicao de erros, totalizacao no checkout).

## O que vai para cada camada

Unitario:
- Arredondamento de moeda para 2 casas.
- Regras de minimo inclusivo.
- Escopo por seller (`SELLERB15`).
- Nao acumulacao de cupom.

API:
- Status code + body de erro por regra de cupom.
- Estoque no add-item e no checkout.
- Persistencia de carrinho e efeitos de aplicar cupom.

E2E:
- Jornada "adiciona itens, aplica cupom, confere total, finaliza pedido".
- Mensagens de erro de cupom invalido/expirado e bloqueio visual de segundo cupom.

## Cenarios E2E criticos (Gherkin)

```gherkin
Cenario: Aplicar PERCENT10 no limite minimo de compra
  Dado que adicionei itens totalizando R$ 50,00 ao carrinho
  Quando aplico o cupom "PERCENT10"
  Entao o sistema aceita o cupom
  E mostra desconto de R$ 5,00
  E total com frete padrao corretamente recalculado
```

```gherkin
Cenario: Impedir acumulacao de cupons
  Dado que tenho um carrinho com cupom "PERCENT10" aplicado
  Quando tento aplicar o cupom "FRETEGRATIS"
  Entao o sistema bloqueia a operacao
  E exibe mensagem informando que nao e permitido acumular cupons
```
