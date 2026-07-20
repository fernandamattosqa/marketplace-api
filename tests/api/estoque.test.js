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

test("deve rejeitar item sem estoque", async () => {
  await withApi(async (baseUrl) => {
    const carrinho = await post(baseUrl, "/carrinho", {});
    const resp = await post(baseUrl, `/carrinho/${carrinho.body.id}/itens`, { produtoId: "p4", quantidade: 1 });

    assert.equal(resp.status, 422);
  });
});

test("deve rejeitar quantidade acima do estoque", async () => {
  await withApi(async (baseUrl) => {
    const carrinho = await post(baseUrl, "/carrinho", {});
    const resp = await post(baseUrl, `/carrinho/${carrinho.body.id}/itens`, { produtoId: "p3", quantidade: 3 });

    assert.equal(resp.status, 422);
  });
});

test("deve permitir checkout quando os itens respeitam estoque", async () => {
  await withApi(async (baseUrl) => {
    const carrinho = await post(baseUrl, "/carrinho", {});
    await post(baseUrl, `/carrinho/${carrinho.body.id}/itens`, { produtoId: "p3", quantidade: 2 });
    const resp = await post(baseUrl, `/carrinho/${carrinho.body.id}/checkout`, {});

    assert.equal(resp.status, 201);
    assert.equal(resp.body.status, "confirmado");
  });
});
