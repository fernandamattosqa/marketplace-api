# Parte 3 - Relatorio de bugs

## Resumo executivo

A mock API apresenta falhas consistentes em regras centrais de negocio. O risco principal esta em perdas financeiras diretas: desconto aplicado fora das regras, validade ignorada, acumulacao de cupons, uso excedente de promocao e falta de validacao de estoque.

### Impacto geral

- Bugs criticos: 3
- Bugs altos: 3
- Bugs medios: 0
- Bugs baixos: 0

## Achados por prioridade

### 1. Estoque nao e validado ao adicionar itens

- ID: BUG-01
- Severidade: Critica
- Prioridade: Alta
- Impacto: permite vender itens sem estoque ou acima do limite disponivel.

Passos para reproduzir:
1. Criar um carrinho.
2. Adicionar `p4` com quantidade 1, ou `p3` com quantidade 3.

Resultado esperado:
- A API deveria rejeitar a operacao com `422` e mensagem de erro de estoque.

Resultado obtido:
- A operacao e aceita e o item entra no carrinho.

Evidencia:
- Falhas automatizadas em `deve rejeitar item sem estoque` e `deve rejeitar quantidade acima do estoque`.

### 2. Minimo de compra nao e tratado de forma inclusiva

- ID: BUG-02
- Severidade: Alta
- Prioridade: Alta
- Impacto: cliente que chega exatamente no valor minimo e barrado indevidamente.

Passos para reproduzir:
1. Criar um carrinho.
2. Adicionar `p2` com quantidade 2, totalizando R$ 50,00.
3. Aplicar `PERCENT10`.

Resultado esperado:
- O cupom deveria ser aceito, pois o contrato define minimo inclusivo.

Resultado obtido:
- A API responde `422` com erro de minimo nao atingido.

Evidencia:
- Falhas automatizadas nos testes de borda para `PERCENT10` em R$ 50,00.

### 3. Cupom expirado `FIXO20` continua sendo aceito

- ID: BUG-03
- Severidade: Critica
- Prioridade: Alta
- Impacto: desconto indevido e risco direto de perda financeira.

Passos para reproduzir:
1. Criar um carrinho com qualquer item.
2. Aplicar `FIXO20`.

Resultado esperado:
- Rejeicao por validade expirada com `422`.

Resultado obtido:
- A API aceita o cupom e calcula desconto normalmente.

Evidencia:
- Teste de validade do cupom falha no arquivo de bordas.

### 4. A API permite acumulo de cupons no mesmo carrinho

- ID: BUG-04
- Severidade: Critica
- Prioridade: Alta
- Impacto: acumulo indevido de desconto e quebra da politica comercial.

Passos para reproduzir:
1. Criar um carrinho elegivel.
2. Aplicar `PERCENT10`.
3. Tentar aplicar `FRETEGRATIS` no mesmo carrinho.

Resultado esperado:
- A segunda aplicacao deveria ser bloqueada.

Resultado obtido:
- O segundo cupom e aceito.

Evidencia:
- Falha automatizada em `nao permite acumular cupons no mesmo carrinho`.

### 5. `SELLERB15` calcula desconto sobre o subtotal inteiro

- ID: BUG-05
- Severidade: Alta
- Prioridade: Media
- Impacto: desconto incorreto para marketplace multi-seller e repasse errado entre sellers.

Passos para reproduzir:
1. Criar carrinho com itens de sellerA e sellerB.
2. Aplicar `SELLERB15`.

Resultado esperado:
- O desconto deveria incidir somente sobre os itens do sellerB.

Resultado obtido:
- O desconto incide sobre o subtotal total.

Evidencia:
- Falha automatizada no teste de escopo por seller.

### 6. O limite de uso do `NOVATO5` nao e respeitado

- ID: BUG-06
- Severidade: Alta
- Prioridade: Media
- Impacto: promoacao continua valida alem do limite definido.

Passos para reproduzir:
1. Aplicar `NOVATO5` em um primeiro carrinho.
2. Aplicar `NOVATO5` em um segundo carrinho.

Resultado esperado:
- O segundo uso deveria ser rejeitado.

Resultado obtido:
- O segundo uso e aceito.

Evidencia:
- Falha automatizada no teste de limite global do cupom.

## Leitura executiva

Se eu tivesse que priorizar a correcao, eu atacaria nesta ordem:
1. Validacao de estoque.
2. Regra de minimo inclusivo.
3. Validade de cupom.
4. Bloqueio de acumulacao.
5. Escopo por seller.
6. Limite de uso promocional.

## Observacao de qualidade

Os bugs acima sao reproduziveis por teste automatizado e cobrem areas de alto impacto financeiro. Isso ajuda a transformar a entrega em um artefato de QA mais forte do que apenas uma lista de casos.
