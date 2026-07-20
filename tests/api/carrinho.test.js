const test = require("node:test");
const assert = require("node:assert/strict");
const { withApi, request } = require("./_helpers");

test("POST /carrinho cria carrinho vazio", async () => {
  await withApi(async (baseUrl) => {
    const resp = await request(baseUrl, "POST", "/carrinho", {});

    assert.equal(resp.status, 201);
    assert.equal(resp.body.id.startsWith("cart_"), true);
    assert.deepEqual(resp.body.itens, []);
    assert.deepEqual(resp.body.cupons, []);
  });
});

test("GET /carrinho/:id de carrinho inexistente retorna 404", async () => {
  await withApi(async (baseUrl) => {
    const resp = await request(baseUrl, "GET", "/carrinho/cart_inexistente");

    assert.equal(resp.status, 404);
    assert.equal(resp.body.erro, "carrinho_nao_encontrado");
  });
});

test("POST /carrinho/:id/itens com produto inexistente retorna 404", async () => {
  await withApi(async (baseUrl) => {
    const cart = await request(baseUrl, "POST", "/carrinho", {});
    const resp = await request(baseUrl, "POST", `/carrinho/${cart.body.id}/itens`, { produtoId: "px", quantidade: 1 });

    assert.equal(resp.status, 404);
    assert.equal(resp.body.erro, "produto_nao_encontrado");
  });
});

test("adicionar item atualiza subtotal e total", async () => {
  await withApi(async (baseUrl) => {
    const cart = await request(baseUrl, "POST", "/carrinho", {});
    const resp = await request(baseUrl, "POST", `/carrinho/${cart.body.id}/itens`, { produtoId: "p1", quantidade: 2 });

    assert.equal(resp.status, 200);
    assert.equal(Math.abs(resp.body.subtotal - 59.8) < 0.001, true);
    assert.equal(Math.abs(resp.body.total - 79.8) < 0.001, true);
  });
});

test("quantidade zero deve ser rejeitada", async () => {
  await withApi(async (baseUrl) => {
    const cart = await request(baseUrl, "POST", "/carrinho", {});
    const resp = await request(baseUrl, "POST", `/carrinho/${cart.body.id}/itens`, { produtoId: "p1", quantidade: 0 });

    assert.equal(resp.status, 422);
  });
});

test("quantidade negativa deve ser rejeitada", async () => {
  await withApi(async (baseUrl) => {
    const cart = await request(baseUrl, "POST", "/carrinho", {});
    const resp = await request(baseUrl, "POST", `/carrinho/${cart.body.id}/itens`, { produtoId: "p1", quantidade: -1 });

    assert.equal(resp.status, 422);
  });
});
