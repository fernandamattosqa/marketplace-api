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

test("aplica PERCENT10 quando subtotal e maior que R$ 50,00", async () => {
  await withApi(async (baseUrl) => {
    const cart = await post(baseUrl, "/carrinho", {});
    await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p1", quantidade: 2 });

    const resp = await post(baseUrl, `/carrinho/${cart.body.id}/cupom`, { codigo: "PERCENT10" });

    assert.equal(resp.status, 200);
    assert.deepEqual(resp.body.cuponsAplicados, ["PERCENT10"]);
    assert.equal(Math.abs(resp.body.desconto - 5.98) < 0.001, true);
  });
});

test("rejeita cupom inexistente", async () => {
  await withApi(async (baseUrl) => {
    const cart = await post(baseUrl, "/carrinho", {});
    await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p1", quantidade: 2 });

    const resp = await post(baseUrl, `/carrinho/${cart.body.id}/cupom`, { codigo: "INEXISTENTE" });

    assert.equal(resp.status, 422);
    assert.equal(resp.body.erro, "cupom_inexistente");
  });
});

test("nao permite acumular cupons no mesmo carrinho", async () => {
  await withApi(async (baseUrl) => {
    const cart = await post(baseUrl, "/carrinho", {});
    await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p1", quantidade: 4 });

    const primeira = await post(baseUrl, `/carrinho/${cart.body.id}/cupom`, { codigo: "PERCENT10" });
    const segunda = await post(baseUrl, `/carrinho/${cart.body.id}/cupom`, { codigo: "FRETEGRATIS" });

    assert.equal(primeira.status, 200);
    assert.equal(segunda.status, 422);
  });
});

test("checkout de carrinho vazio deve falhar", async () => {
  await withApi(async (baseUrl) => {
    const cart = await post(baseUrl, "/carrinho", {});
    const resp = await post(baseUrl, `/carrinho/${cart.body.id}/checkout`, {});

    assert.equal(resp.status, 422);
    assert.equal(resp.body.erro, "carrinho_vazio");
  });
});
