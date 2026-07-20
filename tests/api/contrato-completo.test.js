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

async function requestJson(baseUrl, method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

test("GET /produtos retorna o catalogo completo", async () => {
  await withApi(async (baseUrl) => {
    const resp = await requestJson(baseUrl, "GET", "/produtos");

    assert.equal(resp.status, 200);
    assert.equal(Array.isArray(resp.body), true);
    assert.equal(resp.body.length, 4);
    assert.deepEqual(
      resp.body.map((item) => item.id),
      ["p1", "p2", "p3", "p4"]
    );
    assert.equal(resp.body.find((item) => item.id === "p4").estoque, 0);
  });
});

test("POST /carrinho cria carrinho vazio com identificador unico", async () => {
  await withApi(async (baseUrl) => {
    const primeiro = await requestJson(baseUrl, "POST", "/carrinho", {});
    const segundo = await requestJson(baseUrl, "POST", "/carrinho", {});

    assert.equal(primeiro.status, 201);
    assert.equal(segundo.status, 201);
    assert.notEqual(primeiro.body.id, segundo.body.id);
    assert.deepEqual(primeiro.body.itens, []);
    assert.deepEqual(primeiro.body.cupons, []);
  });
});

test("GET /carrinho/:id retorna totais zerados para carrinho vazio", async () => {
  await withApi(async (baseUrl) => {
    const cart = await requestJson(baseUrl, "POST", "/carrinho", {});
    const resp = await requestJson(baseUrl, "GET", `/carrinho/${cart.body.id}`);

    assert.equal(resp.status, 200);
    assert.equal(resp.body.subtotal, 0);
    assert.equal(resp.body.desconto, 0);
    assert.equal(resp.body.frete, 20);
    assert.equal(resp.body.total, 20);
    assert.deepEqual(resp.body.itens, []);
    assert.deepEqual(resp.body.cuponsAplicados, []);
  });
});

test("GET /carrinho/:id rejeita carrinho inexistente", async () => {
  await withApi(async (baseUrl) => {
    const resp = await requestJson(baseUrl, "GET", "/carrinho/cart_inexistente");

    assert.equal(resp.status, 404);
    assert.equal(resp.body.erro, "carrinho_nao_encontrado");
  });
});

test("POST /carrinho/:id/itens rejeita carrinho inexistente", async () => {
  await withApi(async (baseUrl) => {
    const resp = await requestJson(baseUrl, "POST", "/carrinho/cart_inexistente/itens", {
      produtoId: "p1",
      quantidade: 1,
    });

    assert.equal(resp.status, 404);
    assert.equal(resp.body.erro, "carrinho_nao_encontrado");
  });
});

test("POST /carrinho/:id/itens rejeita produto inexistente", async () => {
  await withApi(async (baseUrl) => {
    const cart = await requestJson(baseUrl, "POST", "/carrinho", {});
    const resp = await requestJson(baseUrl, "POST", `/carrinho/${cart.body.id}/itens`, {
      produtoId: "produto_ausente",
      quantidade: 1,
    });

    assert.equal(resp.status, 404);
    assert.equal(resp.body.erro, "produto_nao_encontrado");
  });
});

test("POST /carrinho/:id/itens usa quantidade padrao 1 quando omissa", async () => {
  await withApi(async (baseUrl) => {
    const cart = await requestJson(baseUrl, "POST", "/carrinho", {});
    const resp = await requestJson(baseUrl, "POST", `/carrinho/${cart.body.id}/itens`, {
      produtoId: "p1",
    });

    assert.equal(resp.status, 200);
    assert.equal(resp.body.itens[0].quantidade, 1);
    assert.equal(Math.abs(resp.body.subtotal - 29.9) < 0.001, true);
  });
});

test("GET /carrinho/:id reflete item adicionado e total com frete", async () => {
  await withApi(async (baseUrl) => {
    const cart = await requestJson(baseUrl, "POST", "/carrinho", {});
    await requestJson(baseUrl, "POST", `/carrinho/${cart.body.id}/itens`, {
      produtoId: "p1",
      quantidade: 2,
    });
    const resp = await requestJson(baseUrl, "GET", `/carrinho/${cart.body.id}`);

    assert.equal(resp.status, 200);
    assert.equal(resp.body.itens.length, 1);
    assert.equal(Math.abs(resp.body.subtotal - 59.8) < 0.001, true);
    assert.equal(Math.abs(resp.body.total - 79.8) < 0.001, true);
  });
});

test("PERCENT10 rejeita subtotal abaixo do minimo", async () => {
  await withApi(async (baseUrl) => {
    const cart = await requestJson(baseUrl, "POST", "/carrinho", {});
    await requestJson(baseUrl, "POST", `/carrinho/${cart.body.id}/itens`, {
      produtoId: "p1",
      quantidade: 1,
    });
    const resp = await requestJson(baseUrl, "POST", `/carrinho/${cart.body.id}/cupom`, {
      codigo: "PERCENT10",
    });

    assert.equal(resp.status, 422);
    assert.equal(resp.body.erro, "min_compra_nao_atingido");
  });
});

test("PERCENT10 aceita subtotal exatamente em R$ 50,00 conforme contrato", async () => {
  await withApi(async (baseUrl) => {
    const cart = await requestJson(baseUrl, "POST", "/carrinho", {});
    await requestJson(baseUrl, "POST", `/carrinho/${cart.body.id}/itens`, {
      produtoId: "p2",
      quantidade: 2,
    });
    const resp = await requestJson(baseUrl, "POST", `/carrinho/${cart.body.id}/cupom`, {
      codigo: "PERCENT10",
    });

    assert.equal(resp.status, 200);
  });
});

test("FRETEGRATIS aceita subtotal exatamente em R$ 100,00 conforme contrato", async () => {
  await withApi(async (baseUrl) => {
    const cart = await requestJson(baseUrl, "POST", "/carrinho", {});
    await requestJson(baseUrl, "POST", `/carrinho/${cart.body.id}/itens`, {
      produtoId: "p2",
      quantidade: 4,
    });
    const resp = await requestJson(baseUrl, "POST", `/carrinho/${cart.body.id}/cupom`, {
      codigo: "FRETEGRATIS",
    });

    assert.equal(resp.status, 200);
    assert.equal(resp.body.frete, 0);
  });
});

test("POST /carrinho/:id/cupom rejeita carrinho inexistente", async () => {
  await withApi(async (baseUrl) => {
    const resp = await requestJson(baseUrl, "POST", "/carrinho/cart_inexistente/cupom", {
      codigo: "PERCENT10",
    });

    assert.equal(resp.status, 404);
    assert.equal(resp.body.erro, "carrinho_nao_encontrado");
  });
});

test("POST /carrinho/:id/checkout rejeita carrinho inexistente", async () => {
  await withApi(async (baseUrl) => {
    const resp = await requestJson(baseUrl, "POST", "/carrinho/cart_inexistente/checkout", {});

    assert.equal(resp.status, 404);
    assert.equal(resp.body.erro, "carrinho_nao_encontrado");
  });
});

test("POST /carrinho/:id/checkout confirma pedido com itens", async () => {
  await withApi(async (baseUrl) => {
    const cart = await requestJson(baseUrl, "POST", "/carrinho", {});
    await requestJson(baseUrl, "POST", `/carrinho/${cart.body.id}/itens`, {
      produtoId: "p3",
      quantidade: 1,
    });
    const resp = await requestJson(baseUrl, "POST", `/carrinho/${cart.body.id}/checkout`, {});

    assert.equal(resp.status, 201);
    assert.equal(resp.body.status, "confirmado");
    assert.equal(resp.body.id.startsWith("order_"), true);
  });
});
