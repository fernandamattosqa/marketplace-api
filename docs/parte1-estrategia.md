# Parte 1 - Estrategia e design de testes

## 1) Analise de risco (impacto x probabilidade)

Fluxo de maior risco: aplicacao de cupom no checkout.

Prioridade alta:
- Validacao de elegibilidade de cupom (minimo, validade, limite de uso): impacto direto em receita e margem.
- Acumulo de cupons: alto risco de desconto indevido e fraude por combinacao.
- Escopo do desconto por seller (marketplace multi-seller): risco financeiro e de repasse incorreto aos sellers.
- Regras de estoque no add-item/checkout: risco de venda sem estoque e cancelamento posterior.
- Calculo monetario e arredondamento: divergencia de centavos afeta conciliacao e confianca.

Prioridade media:
- Mensageria de erro e codigos HTTP: afeta DX e depuracao, menor impacto financeiro direto.
- Idempotencia de endpoints de cupom/checkout: importante para resiliencia, mas menor probabilidade no mock.

Baixa prioridade (ou fora do escopo curto):
- Carga/performance.
- Seguranca/autorizacao.
- Compatibilidade cross-browser (nao ha front para validar).

## 2) Perguntas ao PO (ambiguidades do contrato)

- Um cupom rejeitado por limite/validade deve consumir tentativas de uso ou nao?
- Limite de uso de `NOVATO5` e global da plataforma, por cliente, por seller ou por carrinho?
- Em caso de `SELLERB15`, arredondar no item, no subtotal do seller ou no total do desconto?
- Cupom de frete gratis com subtotal >= R$ 100,00 considera subtotal antes ou depois de outros descontos?
- Quando dois cupons sao enviados em chamadas separadas, a API deve rejeitar no segundo `POST /cupom` ou sobrescrever o primeiro?
- Existe limite para total minimo final (nao permitir total negativo)?
- Estoque deve ser validado no add-item, checkout, ou em ambos?
- Cupom deve ser reaplicado automaticamente se o carrinho mudar apos aplicacao?

## 3) Tabela de decisao (validacao de cupom)

| Regra | Cupom existe | Valido na data | Minimo atendido (>=) | Limite de uso disponivel | Carrinho ja tem cupom | Resultado |
|---|---|---|---|---|---|---|
| R1 | N | - | - | - | - | Rejeita `cupom_inexistente` |
| R2 | S | N | - | - | - | Rejeita `cupom_expirado` |
| R3 | S | S | N | - | - | Rejeita `min_compra_nao_atingido` |
| R4 | S | S | S | N | - | Rejeita `limite_de_uso_excedido` |
| R5 | S | S | S | S | S | Rejeita `cupom_nao_acumulavel` |
| R6 | S | S | S | S | N | Aceita e recalcula totais |

## 4) Valores-limite relevantes

- Minimo R$ 50,00 (`PERCENT10`): R$ 49,99 / R$ 50,00 / R$ 50,01.
- Minimo R$ 100,00 (`FRETEGRATIS`): R$ 99,99 / R$ 100,00 / R$ 100,01.
- Limite de uso = 1 (`NOVATO5`): tentativa #1 (aceita), #2 (rejeita).
- Estoque 0 (`p4`): quantidade 1 deve rejeitar.
- Estoque 2 (`p3`): quantidade 2 aceita; quantidade 3 rejeita.
- Arredondamento em desconto percentual (`SELLERB15` sobre 59,90): 8,985 -> 8,99.

## 5) Casos prioritarios rastreaveis

- TC01: Aplicar `PERCENT10` com subtotal > 50 (critico positivo).
- TC02: Aplicar `PERCENT10` com subtotal = 50 (borda inclusiva).
- TC03: Rejeitar `FIXO20` expirado.
- TC04: Rejeitar acumulacao de cupons no mesmo carrinho.
- TC05: Aplicar `SELLERB15` apenas sobre itens sellerB.
- TC06: Rejeitar segundo uso de `NOVATO5` apos primeiro uso global.
- TC07: Rejeitar item sem estoque (`p4`).
- TC08: Rejeitar quantidade acima do estoque (`p3` qtd 3).
- TC09: Rejeitar checkout de carrinho vazio.
