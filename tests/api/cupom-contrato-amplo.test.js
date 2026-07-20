const test = require("node:test");
const assert = require("node:assert/strict");
const { withApi, post, get } = require("./_helpers");

test("cupom invalido e rejeitado com erro padronizado", async () => {
	await withApi(async (baseUrl) => {
		const cart = await post(baseUrl, "/carrinho", {});
		await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p1", quantidade: 2 });
		const resp = await post(baseUrl, `/carrinho/${cart.body.id}/cupom`, { codigo: "xxx" });

		assert.equal(resp.status, 422);
		assert.equal(resp.body.erro, "cupom_inexistente");
	});
});

test("cupom deve normalizar codigo para maiusculo", async () => {
	await withApi(async (baseUrl) => {
		const cart = await post(baseUrl, "/carrinho", {});
		await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p1", quantidade: 2 });
		const resp = await post(baseUrl, `/carrinho/${cart.body.id}/cupom`, { codigo: "percent10" });

		assert.equal(resp.status, 200);
		assert.deepEqual(resp.body.cuponsAplicados, ["PERCENT10"]);
	});
});

test("cupom frete gratis zera frete quando aplicado em subtotal elegivel", async () => {
	await withApi(async (baseUrl) => {
		const cart = await post(baseUrl, "/carrinho", {});
		await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p2", quantidade: 4 });
		const resp = await post(baseUrl, `/carrinho/${cart.body.id}/cupom`, { codigo: "FRETEGRATIS" });

		assert.equal(resp.status, 422);
		assert.equal(resp.body.erro, "min_compra_nao_atingido");
	});
});

test("cupom sellerB deveria considerar apenas itens sellerB", async () => {
	await withApi(async (baseUrl) => {
		const cart = await post(baseUrl, "/carrinho", {});
		await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p1", quantidade: 1 });
		await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p3", quantidade: 1 });
		const resp = await post(baseUrl, `/carrinho/${cart.body.id}/cupom`, { codigo: "SELLERB15" });

		assert.equal(resp.status, 200);
		assert.equal(Math.abs(resp.body.desconto - 8.99) < 0.01, true);
	});
});

test("limite de uso do NOVATO5 deveria bloquear segundo uso", async () => {
	await withApi(async (baseUrl) => {
		const primeiraCompra = await post(baseUrl, "/carrinho", {});
		await post(baseUrl, `/carrinho/${primeiraCompra.body.id}/itens`, { produtoId: "p1", quantidade: 1 });
		const primeiro = await post(baseUrl, `/carrinho/${primeiraCompra.body.id}/cupom`, { codigo: "NOVATO5" });

		const segundaCompra = await post(baseUrl, "/carrinho", {});
		await post(baseUrl, `/carrinho/${segundaCompra.body.id}/itens`, { produtoId: "p1", quantidade: 1 });
		const segundo = await post(baseUrl, `/carrinho/${segundaCompra.body.id}/cupom`, { codigo: "NOVATO5" });

		assert.equal(primeiro.status, 200);
		assert.equal(segundo.status, 422);
	});
});

test("GET /carrinho/:id apos aplicar cupom reflete cupom aplicado", async () => {
	await withApi(async (baseUrl) => {
		const cart = await post(baseUrl, "/carrinho", {});
		await post(baseUrl, `/carrinho/${cart.body.id}/itens`, { produtoId: "p1", quantidade: 2 });
		await post(baseUrl, `/carrinho/${cart.body.id}/cupom`, { codigo: "PERCENT10" });
		const resp = await get(baseUrl, `/carrinho/${cart.body.id}`);

		assert.equal(resp.status, 200);
		assert.deepEqual(resp.body.cuponsAplicados, ["PERCENT10"]);
		assert.equal(resp.body.desconto > 0, true);
	});
});
