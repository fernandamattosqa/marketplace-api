const test = require("node:test");
const assert = require("node:assert/strict");
const { withApi, request, post } = require("./_helpers");

test("POST /carrinho/:id/checkout rejeita carrinho inexistente", async () => {
	await withApi(async (baseUrl) => {
		const resp = await post(baseUrl, "/carrinho/cart_inexistente/checkout", {});

		assert.equal(resp.status, 404);
		assert.equal(resp.body.erro, "carrinho_nao_encontrado");
	});
});

test("checkout de carrinho vazio retorna erro de negocio", async () => {
	await withApi(async (baseUrl) => {
		const cart = await post(baseUrl, "/carrinho", {});
		const resp = await post(baseUrl, `/carrinho/${cart.body.id}/checkout`, {});

		assert.equal(resp.status, 422);
		assert.equal(resp.body.erro, "carrinho_vazio");
	});
});

test("checkout confirma pedido e preserva totais do carrinho", async () => {
	await withApi(async (baseUrl) => {
		const cart = await post(baseUrl, "/carrinho", {});
		await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p1", quantidade: 2 });
		await post(baseUrl, `/carrinho/${cart.body.id}/cupom`, { codigo: "PERCENT10" });

		const resp = await post(baseUrl, `/carrinho/${cart.body.id}/checkout`, {});

		assert.equal(resp.status, 201);
		assert.equal(resp.body.status, "confirmado");
		assert.equal(resp.body.id.startsWith("order_"), true);
		assert.equal(Math.abs(resp.body.subtotal - 59.8) < 0.001, true);
		assert.equal(Math.abs(resp.body.desconto - 5.98) < 0.001, true);
		assert.equal(Math.abs(resp.body.total - 73.82) < 0.001, true);
	});
});

test("dois checkouts consecutivos geram pedidos distintos", async () => {
	await withApi(async (baseUrl) => {
		const cartA = await post(baseUrl, "/carrinho", {});
		await post(baseUrl, `/carrinho/${cartA.body.id}/itens`, { produtoId: "p3", quantidade: 1 });
		const pedidoA = await post(baseUrl, `/carrinho/${cartA.body.id}/checkout`, {});

		const cartB = await post(baseUrl, "/carrinho", {});
		await post(baseUrl, `/carrinho/${cartB.body.id}/itens`, { produtoId: "p2", quantidade: 2 });
		const pedidoB = await post(baseUrl, `/carrinho/${cartB.body.id}/checkout`, {});

		assert.equal(pedidoA.status, 201);
		assert.equal(pedidoB.status, 201);
		assert.notEqual(pedidoA.body.id, pedidoB.body.id);
	});
});
