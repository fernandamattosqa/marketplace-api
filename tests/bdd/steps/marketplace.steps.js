const assert = require("node:assert/strict");
const { Given, When, Then, defineStep } = require("@cucumber/cucumber");

async function apiRequest(baseUrl, method, route, body) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

When("eu fizer uma requisição GET para {string}", async function (route) {
  this.lastResponse = await apiRequest(this.baseUrl, "GET", route);
});

When("eu criar um novo carrinho", async function () {
  this.lastResponse = await apiRequest(this.baseUrl, "POST", "/carrinho", {});
  if (this.lastResponse.status === 201) {
    this.currentCartId = this.lastResponse.body.id;
  }
});

Given("que existe um carrinho criado", async function () {
  const created = await apiRequest(this.baseUrl, "POST", "/carrinho", {});
  assert.equal(created.status, 201);
  this.currentCartId = created.body.id;
  this.lastResponse = created;
});

defineStep(
  "eu adicionar o produto {string} com quantidade {int} no carrinho atual",
  async function (produtoId, quantidade) {
    this.lastResponse = await apiRequest(this.baseUrl, "POST", `/carrinho/${this.currentCartId}/itens`, {
      produtoId,
      quantidade,
    });
  }
);

When("eu fizer checkout do carrinho atual", async function () {
  this.lastResponse = await apiRequest(this.baseUrl, "POST", `/carrinho/${this.currentCartId}/checkout`, {});
});

Then("o status da resposta deve ser {int}", function (statusCode) {
  assert.equal(this.lastResponse.status, statusCode);
});

Then("a lista de produtos deve conter {int} itens", function (quantidadeEsperada) {
  assert.equal(Array.isArray(this.lastResponse.body), true);
  assert.equal(this.lastResponse.body.length, quantidadeEsperada);
});

Then("o carrinho deve estar vazio", function () {
  assert.deepEqual(this.lastResponse.body.itens, []);
  assert.deepEqual(this.lastResponse.body.cupons, []);
});

Then("o subtotal do carrinho deve ser {float}", function (subtotalEsperado) {
  assert.equal(Math.abs(this.lastResponse.body.subtotal - subtotalEsperado) < 0.001, true);
});

Then("o total do carrinho deve ser {float}", function (totalEsperado) {
  assert.equal(Math.abs(this.lastResponse.body.total - totalEsperado) < 0.001, true);
});

Then("o erro da resposta deve ser {string}", function (erroEsperado) {
  assert.equal(this.lastResponse.body.erro, erroEsperado);
});

Then("o pedido deve ser confirmado", function () {
  assert.equal(this.lastResponse.body.status, "confirmado");
  assert.equal(this.lastResponse.body.id.startsWith("order_"), true);
});
