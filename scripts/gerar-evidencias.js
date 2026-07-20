const fs = require("node:fs");
const path = require("node:path");
const { criarServidor } = require("../mock-marketplace-api");

async function request(baseUrl, method, route, body) {
  const options = {
    method,
    headers: body && !["GET", "HEAD"].includes(method) ? { "Content-Type": "application/json" } : undefined,
    body: body && !["GET", "HEAD"].includes(method) ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(`${baseUrl}${route}`, {
    ...options,
  });

  let responseBody;
  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  return {
    method,
    route,
    body: body || {},
    status: response.status,
    responseBody,
  };
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function responseSummary(responseBody) {
  if (responseBody == null) {
    return "null";
  }

  return formatJson(responseBody);
}

async function withApi(callback) {
  const server = criarServidor();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    return await callback(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function main() {
  const scenarios = await withApi(async (baseUrl) => {
    const rows = [];

    async function capture(title, method, route, body, expected) {
      const response = await request(baseUrl, method, route, body);
      rows.push({ title, expected, ...response });
    }

    await capture("Catálogo completo", "GET", "/produtos", undefined, 200);

    await capture("Criar carrinho vazio", "POST", "/carrinho", {}, 201);

    const carrinhoBase = rows.find((item) => item.title === "Criar carrinho vazio").responseBody.id;
    await capture("Adicionar item válido", "POST", `/carrinho/${carrinhoBase}/itens`, { produtoId: "p1", quantidade: 2 }, 200);
    await capture("Estoque zero rejeitado", "POST", `/carrinho/${carrinhoBase}/itens`, { produtoId: "p4", quantidade: 1 }, 422);
    await capture("Quantidade acima do estoque", "POST", `/carrinho/${carrinhoBase}/itens`, { produtoId: "p3", quantidade: 3 }, 422);
    await capture("Cupom PERCENT10 elegível", "POST", `/carrinho/${carrinhoBase}/cupom`, { codigo: "PERCENT10" }, 200);
    await capture("Cupom PERCENT10 em minúsculo", "POST", `/carrinho/${carrinhoBase}/cupom`, { codigo: "percent10" }, 200);
    await capture("Cupom expirado FIXO20", "POST", `/carrinho/${carrinhoBase}/cupom`, { codigo: "FIXO20" }, 422);

    const carrinhoMinimo50 = (await request(baseUrl, "POST", "/carrinho", {})).responseBody.id;
    await request(baseUrl, "POST", `/carrinho/${carrinhoMinimo50}/itens`, { produtoId: "p2", quantidade: 2 });
    await capture("PERCENT10 no mínimo de R$ 50,00", "POST", `/carrinho/${carrinhoMinimo50}/cupom`, { codigo: "PERCENT10" }, 200);

    const carrinhoMinimo100 = (await request(baseUrl, "POST", "/carrinho", {})).responseBody.id;
    await request(baseUrl, "POST", `/carrinho/${carrinhoMinimo100}/itens`, { produtoId: "p2", quantidade: 4 });
    await capture("FRETEGRATIS no mínimo de R$ 100,00", "POST", `/carrinho/${carrinhoMinimo100}/cupom`, { codigo: "FRETEGRATIS" }, 200);

    const carrinhoAcumulo = (await request(baseUrl, "POST", "/carrinho", {})).responseBody.id;
    await request(baseUrl, "POST", `/carrinho/${carrinhoAcumulo}/itens`, { produtoId: "p3", quantidade: 1 });
    await capture("Primeiro cupom no carrinho", "POST", `/carrinho/${carrinhoAcumulo}/cupom`, { codigo: "PERCENT10" }, 200);
    await capture("Segundo cupom no mesmo carrinho", "POST", `/carrinho/${carrinhoAcumulo}/cupom`, { codigo: "FRETEGRATIS" }, 422);

    const carrinhoSeller = (await request(baseUrl, "POST", "/carrinho", {})).responseBody.id;
    await request(baseUrl, "POST", `/carrinho/${carrinhoSeller}/itens`, { produtoId: "p1", quantidade: 1 });
    await request(baseUrl, "POST", `/carrinho/${carrinhoSeller}/itens`, { produtoId: "p3", quantidade: 1 });
    await capture("Cupom SELLERB15", "POST", `/carrinho/${carrinhoSeller}/cupom`, { codigo: "SELLERB15" }, 200);

    const carrinhoNovato1 = (await request(baseUrl, "POST", "/carrinho", {})).responseBody.id;
    await request(baseUrl, "POST", `/carrinho/${carrinhoNovato1}/itens`, { produtoId: "p1", quantidade: 1 });
    await capture("Primeiro uso do NOVATO5", "POST", `/carrinho/${carrinhoNovato1}/cupom`, { codigo: "NOVATO5" }, 200);

    const carrinhoNovato2 = (await request(baseUrl, "POST", "/carrinho", {})).responseBody.id;
    await request(baseUrl, "POST", `/carrinho/${carrinhoNovato2}/itens`, { produtoId: "p1", quantidade: 1 });
    await capture("Segundo uso do NOVATO5", "POST", `/carrinho/${carrinhoNovato2}/cupom`, { codigo: "NOVATO5" }, 422);

    await capture("Checkout de carrinho vazio", "POST", `/carrinho/${carrinhoNovato2}/checkout`, {}, 422);
    await capture("Carrinho inexistente", "GET", "/carrinho/cart_inexistente", undefined, 404);

    return rows;
  });

  const sections = [];
  sections.push("# Evidências Automatizadas de Requisições e Respostas");
  sections.push("");
  sections.push("Este arquivo foi gerado automaticamente a partir de chamadas reais feitas contra a mock API.");
  sections.push("");
  sections.push("## Resumo");
  sections.push("");
  sections.push(`- Total de chamadas capturadas: ${scenarios.length}`);
  sections.push(`- Fonte: execução automatizada via Node.js`);
  sections.push("");

  scenarios.forEach((scenario, index) => {
    sections.push(`## ${index + 1}) ${scenario.title}`);
    sections.push("");
    sections.push(`- Requisição: \`${scenario.method} ${scenario.route}\``);
    sections.push(`- Body: \`${formatJson(scenario.body)}\``);
    sections.push(`- Status esperado: \`${scenario.expected}\``);
    sections.push(`- Status obtido: \`${scenario.status}\``);
    sections.push("- Resposta:");
    sections.push("```json");
    sections.push(responseSummary(scenario.responseBody));
    sections.push("```");
    sections.push("");
  });

  const output = sections.join("\n");
  const outputPath = path.join(__dirname, "..", "docs", "evidencias-automatica.md");
  fs.writeFileSync(outputPath, output, "utf8");
  console.log(`Evidências geradas em ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
