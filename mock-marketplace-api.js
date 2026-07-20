/**
 * Mock Marketplace API - Teste pratico QA Senior
 *
 * API HTTP minima, sem dependencias externas. Rode com:
 *   node mock-marketplace-api.js
 * Sobe em http://localhost:3000
 *
 * Estado em memoria (reinicia a cada boot). Nao e codigo de producao -
 * e intencionalmente simples e contem defeitos plantados.
 */

const http = require("http");

const produtos = [
  { id: "p1", nome: "Fone Bluetooth", preco: 29.9, estoque: 5, sellerId: "sellerA" },
  { id: "p2", nome: "Capa de Celular", preco: 25.0, estoque: 10, sellerId: "sellerA" },
  { id: "p3", nome: "Carregador Turbo", preco: 59.9, estoque: 2, sellerId: "sellerB" },
  { id: "p4", nome: "Cabo USB-C", preco: 15.0, estoque: 0, sellerId: "sellerB" },
];

const cupons = {
  PERCENT10: { tipo: "percentual", valor: 10, minCompra: 50, validade: "2026-12-31", sellerId: null, maxUsos: null },
  FRETEGRATIS: { tipo: "frete", valor: 0, minCompra: 100, validade: "2026-12-31", sellerId: null, maxUsos: null },
  FIXO20: { tipo: "fixo", valor: 20, minCompra: 0, validade: "2026-01-01", sellerId: null, maxUsos: null },
  SELLERB15: { tipo: "percentual", valor: 15, minCompra: 0, validade: "2026-12-31", sellerId: "sellerB", maxUsos: null },
  NOVATO5: { tipo: "fixo", valor: 5, minCompra: 0, validade: "2026-12-31", sellerId: null, maxUsos: 1 },
};

const FRETE_PADRAO = 20.0;

function criarEstado() {
  return {
    usosCupom: {},
    carrinhos: {},
    pedidos: {},
    seqCarrinho: 0,
    seqPedido: 0,
  };
}

function calcularTotais(carrinho) {
  const itens = carrinho.itens.map((i) => {
    const p = produtos.find((x) => x.id === i.produtoId);
    return { ...i, produto: p, subtotal: p.preco * i.quantidade };
  });

  const subtotal = itens.reduce((acc, i) => acc + i.subtotal, 0);

  let desconto = 0;
  let frete = FRETE_PADRAO;

  for (const codigo of carrinho.cupons) {
    const c = cupons[codigo];
    if (!c) continue;

    if (c.tipo === "percentual") {
      if (c.sellerId) {
        desconto += subtotal * (c.valor / 100);
      } else {
        desconto += subtotal * (c.valor / 100);
      }
    } else if (c.tipo === "fixo") {
      desconto += c.valor;
    } else if (c.tipo === "frete") {
      frete = 0;
    }
  }

  const total = subtotal - desconto + frete;

  return {
    subtotal,
    desconto,
    frete,
    total,
    itens: itens.map((i) => ({
      produtoId: i.produtoId,
      nome: i.produto.nome,
      quantidade: i.quantidade,
      precoUnitario: i.produto.preco,
      subtotal: i.subtotal,
    })),
    cuponsAplicados: carrinho.cupons,
  };
}

function validarCupom(codigo, carrinho, estado) {
  const c = cupons[codigo];
  if (!c) return { ok: false, motivo: "cupom_inexistente" };

  const totais = calcularTotais(carrinho);

  if (c.minCompra && !(totais.subtotal > c.minCompra)) {
    return { ok: false, motivo: "min_compra_nao_atingido" };
  }

  if (c.maxUsos != null) {
    estado.usosCupom[codigo] = (estado.usosCupom[codigo] || 0) + 1;
    if (estado.usosCupom[codigo] > c.maxUsos + 1) {
      return { ok: false, motivo: "limite_de_uso_excedido" };
    }
  }

  return { ok: true };
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function criarServidor() {
  const estado = criarEstado();

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const parts = url.pathname.split("/").filter(Boolean);
    const body = ["POST", "PUT", "PATCH"].includes(req.method) ? await readBody(req) : {};

    if (req.method === "GET" && parts[0] === "produtos" && parts.length === 1) {
      return send(res, 200, produtos);
    }

    if (req.method === "POST" && parts[0] === "carrinho" && parts.length === 1) {
      const id = `cart_${++estado.seqCarrinho}`;
      estado.carrinhos[id] = { id, itens: [], cupons: [] };
      return send(res, 201, estado.carrinhos[id]);
    }

    if (req.method === "POST" && parts[0] === "carrinho" && parts[2] === "itens") {
      const carrinho = estado.carrinhos[parts[1]];
      if (!carrinho) return send(res, 404, { erro: "carrinho_nao_encontrado" });
      const p = produtos.find((x) => x.id === body.produtoId);
      if (!p) return send(res, 404, { erro: "produto_nao_encontrado" });
      const qtd = body.quantidade || 1;
      carrinho.itens.push({ produtoId: body.produtoId, quantidade: qtd });
      return send(res, 200, calcularTotais(carrinho));
    }

    if (req.method === "POST" && parts[0] === "carrinho" && parts[2] === "cupom") {
      const carrinho = estado.carrinhos[parts[1]];
      if (!carrinho) return send(res, 404, { erro: "carrinho_nao_encontrado" });
      const codigo = (body.codigo || "").toUpperCase();
      const v = validarCupom(codigo, carrinho, estado);
      if (!v.ok) return send(res, 422, { erro: v.motivo });
      carrinho.cupons.push(codigo);
      return send(res, 200, calcularTotais(carrinho));
    }

    if (req.method === "GET" && parts[0] === "carrinho" && parts.length === 2) {
      const carrinho = estado.carrinhos[parts[1]];
      if (!carrinho) return send(res, 404, { erro: "carrinho_nao_encontrado" });
      return send(res, 200, calcularTotais(carrinho));
    }

    if (req.method === "POST" && parts[0] === "carrinho" && parts[2] === "checkout") {
      const carrinho = estado.carrinhos[parts[1]];
      if (!carrinho) return send(res, 404, { erro: "carrinho_nao_encontrado" });
      if (carrinho.itens.length === 0) return send(res, 422, { erro: "carrinho_vazio" });
      const totais = calcularTotais(carrinho);
      const id = `order_${++estado.seqPedido}`;
      estado.pedidos[id] = { id, ...totais, status: "confirmado" };
      return send(res, 201, estado.pedidos[id]);
    }

    return send(res, 404, { erro: "rota_nao_encontrada" });
  });
}

function iniciarServidor(porta = process.env.PORT || 3000) {
  const server = criarServidor();
  server.listen(porta, () => {
    console.log(`Mock Marketplace API rodando na porta ${porta}`);
  });
  return server;
}

if (require.main === module) {
  iniciarServidor();
}

module.exports = {
  criarServidor,
  iniciarServidor,
};