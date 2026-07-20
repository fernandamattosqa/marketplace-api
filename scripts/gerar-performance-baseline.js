const fs = require("node:fs");
const path = require("node:path");
const { performance } = require("node:perf_hooks");
const { criarServidor } = require("../mock-marketplace-api");

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
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

async function timedFetch(baseUrl, route, method = "GET", body) {
  const start = performance.now();
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const end = performance.now();

  return {
    ms: end - start,
    status: response.status,
    ok: response.ok,
  };
}

async function runScenario(baseUrl, config) {
  const latencies = [];
  let errors = 0;
  const total = config.totalRequests;
  const batchSize = config.concurrency;
  const started = performance.now();

  for (let i = 0; i < total; i += batchSize) {
    const currentBatch = Math.min(batchSize, total - i);
    const calls = [];

    for (let j = 0; j < currentBatch; j += 1) {
      calls.push(timedFetch(baseUrl, config.route, config.method, config.body));
    }

    const results = await Promise.all(calls);
    for (const result of results) {
      latencies.push(result.ms);
      if (!result.ok) {
        errors += 1;
      }
    }
  }

  const ended = performance.now();
  const durationMs = ended - started;

  return {
    name: config.name,
    route: config.route,
    method: config.method,
    totalRequests: total,
    concurrency: config.concurrency,
    durationMs,
    rps: total / (durationMs / 1000),
    avgMs: latencies.reduce((acc, v) => acc + v, 0) / latencies.length,
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
    maxMs: Math.max(...latencies),
    errors,
  };
}

function toMarkdown(report) {
  const lines = [];
  lines.push("# Baseline de Performance - Marketplace API");
  lines.push("");
  lines.push(`Gerado em: ${report.generatedAt}`);
  lines.push(`Node: ${report.node}`);
  lines.push("");
  lines.push("## Configuração");
  lines.push("");
  lines.push(`- Total de cenários: ${report.scenarios.length}`);
  lines.push(`- Observação: baseline de referência, não teste de carga de produção.`);
  lines.push("");
  lines.push("## Resultados");
  lines.push("");
  lines.push("| Cenário | Requisições | Concorrência | Duração (ms) | RPS | Avg (ms) | P95 (ms) | P99 (ms) | Máx (ms) | Erros |");
  lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|");

  for (const s of report.scenarios) {
    lines.push(`| ${s.name} | ${s.totalRequests} | ${s.concurrency} | ${s.durationMs.toFixed(2)} | ${s.rps.toFixed(2)} | ${s.avgMs.toFixed(2)} | ${s.p95Ms.toFixed(2)} | ${s.p99Ms.toFixed(2)} | ${s.maxMs.toFixed(2)} | ${s.errors} |`);
  }

  return lines.join("\n");
}

async function main() {
  const scenariosConfig = [
    {
      name: "Leitura de catálogo",
      route: "/produtos",
      method: "GET",
      totalRequests: 200,
      concurrency: 20,
    },
    {
      name: "Criação de carrinho",
      route: "/carrinho",
      method: "POST",
      body: {},
      totalRequests: 120,
      concurrency: 15,
    },
  ];

  const report = await withApi(async (baseUrl) => {
    const scenarios = [];
    for (const config of scenariosConfig) {
      scenarios.push(await runScenario(baseUrl, config));
    }

    return {
      generatedAt: new Date().toISOString(),
      node: process.version,
      scenarios,
    };
  });

  const jsonPath = path.join(__dirname, "..", "docs", "performance-baseline.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

  const mdPath = path.join(__dirname, "..", "docs", "performance-baseline.md");
  fs.writeFileSync(mdPath, toMarkdown(report), "utf8");

  console.log(`Baseline de performance gerado em ${mdPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
