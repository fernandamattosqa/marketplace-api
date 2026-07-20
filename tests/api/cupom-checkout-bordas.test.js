const test = require("node:test");
const assert = require("node:assert/strict");
const { criarServidor } = require("../../mock-marketplace-api");

async function withApi(callback) {
  const server = criarServidor();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await callback(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function post(baseUrl, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });

  return {
    status: res.status,
    body: await res.json(),
  };
}

test("aceita PERCENT10 com subtotal exatamente igual a R$ 50,00", async () => {
  await withApi(async (baseUrl) => {
    const cart = await post(baseUrl, "/carrinho", {});
    await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p2", quantidade: 2 });

    const resp = await post(baseUrl, `/carrinho/${cart.body.id}/cupom`, { codigo: "PERCENT10" });

    assert.equal(resp.status, 200);
    assert.equal(Math.abs(resp.body.desconto - 5) < 0.001, true);
  });
});

test("rejeita FIXO20 por estar fora da validade", async () => {
  await withApi(async (baseUrl) => {
    const cart = await post(baseUrl, "/carrinho", {});
    await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p1", quantidade: 1 });

    const resp = await post(baseUrl, `/carrinho/${cart.body.id}/cupom`, { codigo: "FIXO20" });

    assert.equal(resp.status, 422);
  });
});

test("SELLERB15 deve aplicar desconto apenas sobre sellerB", async () => {
  await withApi(async (baseUrl) => {
    const cart = await post(baseUrl, "/carrinho", {});
    await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p1", quantidade: 1 });
    await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p3", quantidade: 1 });

    const resp = await post(baseUrl, `/carrinho/${cart.body.id}/cupom`, { codigo: "SELLERB15" });

    assert.equal(resp.status, 200);
    assert.equal(Math.abs(resp.body.desconto - 8.99) < 0.01, true);
    assert.equal(Math.abs(resp.body.total - 100.81) < 0.01, true);
  });
});

test("NOVATO5 deve aceitar somente um uso global", async () => {
  await withApi(async (baseUrl) => {
    const carrinhoA = await post(baseUrl, "/carrinho", {});
    await post(baseUrl, `/carrinho/${carrinhoA.body.id}/itens`, { produtoId: "p1", quantidade: 1 });
    const primeiroUso = await post(baseUrl, `/carrinho/${carrinhoA.body.id}/cupom`, { codigo: "NOVATO5" });

    const carrinhoB = await post(baseUrl, "/carrinho", {});
    await post(baseUrl, `/carrinho/${carrinhoB.body.id}/itens`, { produtoId: "p1", quantidade: 1 });
    const segundoUso = await post(baseUrl, `/carrinho/${carrinhoB.body.id}/cupom`, { codigo: "NOVATO5" });

    assert.equal(primeiroUso.status, 200);
    assert.equal(segundoUso.status, 422);
  });
});
