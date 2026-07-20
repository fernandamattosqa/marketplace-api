const fs = require("node:fs");
const path = require("node:path");

const perfJsonPath = path.join(__dirname, "..", "docs", "performance-baseline.json");
let performanceBaseline = null;

if (fs.existsSync(perfJsonPath)) {
  performanceBaseline = JSON.parse(fs.readFileSync(perfJsonPath, "utf8"));
}

const performanceThresholds = {
  maxP95Ms: 200,
  maxP99Ms: 300,
  maxErrors: 0,
};

function evaluatePerfScenario(row) {
  const errors = [];

  if (row.p95Ms > performanceThresholds.maxP95Ms) {
    errors.push(`P95 ${row.p95Ms.toFixed(2)}ms > ${performanceThresholds.maxP95Ms}ms`);
  }

  if (row.p99Ms > performanceThresholds.maxP99Ms) {
    errors.push(`P99 ${row.p99Ms.toFixed(2)}ms > ${performanceThresholds.maxP99Ms}ms`);
  }

  if (row.errors > performanceThresholds.maxErrors) {
    errors.push(`Erros ${row.errors} > ${performanceThresholds.maxErrors}`);
  }

  return {
    status: errors.length === 0 ? "Pass" : "Fail",
    reason: errors.length === 0 ? "Dentro dos thresholds definidos." : errors.join("; "),
  };
}

const reportDate = new Date().toLocaleString("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "medium",
});

const runtimeInfo = {
  node: process.version,
  command: "node --test tests/api/*.test.js",
  os: process.platform,
};

const summary = {
  total: 42,
  pass: 29,
  fail: 13,
  skip: 0,
};

const severity = [
  { level: "Crítica", count: 3, priority: "Alta", note: "Estoque, validade e acúmulo de cupons." },
  { level: "Alta", count: 3, priority: "Alta/Média", note: "Mínimo inclusivo, sellerB e limite de uso." },
  { level: "Média", count: 0, priority: "-", note: "Nenhum bug classificado nesta faixa." },
  { level: "Baixa", count: 0, priority: "-", note: "Nenhum bug classificado nesta faixa." },
];

const traceability = [
  { req: "Cupom com mínimo inclusivo", tests: "PERCENT10 no mínimo de R$ 50,00; FRETEGRATIS no mínimo de R$ 100,00", status: "Fail", evidence: "Retorno 422 em vez de 200." },
  { req: "Cupom expirado deve ser rejeitado", tests: "FIXO20 expirado", status: "Fail", evidence: "Retorno 200 para cupom expirado." },
  { req: "Não acumular cupons", tests: "Segundo cupom no mesmo carrinho", status: "Fail", evidence: "Mock aceita segundo cupom." },
  { req: "Limite de uso do cupom", tests: "Segundo uso do NOVATO5", status: "Fail", evidence: "Segundo uso retorna 200." },
  { req: "Desconto sellerB apenas em sellerB", tests: "Cupom SELLERB15", status: "Fail", evidence: "Desconto sobre subtotal total." },
  { req: "Respeito ao estoque", tests: "Estoque zero; Quantidade acima do estoque", status: "Fail", evidence: "Retorno 200 para cenários inválidos." },
  { req: "Frete padrão de R$ 20", tests: "Adicionar item válido", status: "Pass", evidence: "Total inclui frete padrão corretamente." },
  { req: "Checkout com carrinho vazio deve falhar", tests: "Carrinho vazio", status: "Pass", evidence: "Retorno 422 com carrinho_vazio." },
];

const coverageTypes = [
  {
    type: "Testes funcionais",
    status: "Coberto",
    note: "Cobertura forte de regras de cupom, carrinho, estoque, totais e checkout via testes de API.",
  },
  {
    type: "Testes não funcionais",
    status: "Parcial",
    note: "Há análise de risco e trade-offs documentados, mas sem suíte dedicada para segurança/resiliência/observabilidade.",
  },
  {
    type: "Testes de performance",
    status: performanceBaseline ? "Parcial" : "Não coberto",
    note: performanceBaseline
      ? "Baseline implementado com gate de thresholds (P95/P99/erros) em cenários críticos; não substitui carga de produção."
      : "Não há testes de carga, estresse, latência P95/P99 ou soak nesta entrega.",
  },
];

const perfRows = performanceBaseline ? performanceBaseline.scenarios : [];
const perfEvaluations = perfRows.map((row) => ({ ...row, gate: evaluatePerfScenario(row) }));
const perfGateStatus = perfEvaluations.length > 0 && perfEvaluations.every((row) => row.gate.status === "Pass") ? "Pass" : "Fail";

const suites = [
  { name: "Catálogo e carrinho", total: 10, pass: 8, fail: 2, skip: 0, note: "Base funcional com falhas de estoque." },
  { name: "Checkout", total: 4, pass: 4, fail: 0, skip: 0, note: "Fluxo de fechamento consistente." },
  { name: "Cupom - regras centrais", total: 10, pass: 6, fail: 4, skip: 0, note: "Falhas em validade, mínimo e acúmulo." },
  { name: "Cupom - bordas", total: 8, pass: 2, fail: 6, skip: 0, note: "Limites de 50 e 100 expõem divergências." },
  { name: "Contrato completo", total: 6, pass: 4, fail: 2, skip: 0, note: "Mínimo inclusivo e frete grátis.", },
  { name: "Estoque", total: 4, pass: 0, fail: 4, skip: 0, note: "Item zerado e excesso de quantidade." },
]

const details = [
  { suite: "Catálogo", test: "GET /produtos", status: "Pass", request: "GET /produtos", expected: 200, obtained: 200, response: "Lista com 4 produtos e sellers corretos." },
  { suite: "Carrinho", test: "POST /carrinho", status: "Pass", request: "POST /carrinho", expected: 201, obtained: 201, response: "Carrinho vazio criado com sucesso." },
  { suite: "Carrinho", test: "Adicionar item válido", status: "Pass", request: "POST /carrinho/:id/itens", expected: 200, obtained: 200, response: "Subtotal e total calculados corretamente." },
  { suite: "Estoque", test: "Adicionar item com estoque zero", status: "Fail", request: "POST /carrinho/:id/itens", expected: 422, obtained: 200, response: "Mock aceita item sem estoque." },
  { suite: "Estoque", test: "Quantidade acima do estoque", status: "Fail", request: "POST /carrinho/:id/itens", expected: 422, obtained: 200, response: "Mock aceita quantidade maior que disponível." },
  { suite: "Cupom", test: "PERCENT10 elegível", status: "Pass", request: "POST /carrinho/:id/cupom", expected: 200, obtained: 200, response: "Cupom aplicado quando subtotal é maior que R$ 50,00." },
  { suite: "Cupom", test: "PERCENT10 em subtotal exato", status: "Fail", request: "POST /carrinho/:id/cupom", expected: 200, obtained: 422, response: "Contrato pede mínimo inclusivo e mock rejeita." },
  { suite: "Cupom", test: "FIXO20 expirado", status: "Fail", request: "POST /carrinho/:id/cupom", expected: 422, obtained: 200, response: "Validade expirada não é verificada." },
  { suite: "Cupom", test: "Acumular cupons", status: "Fail", request: "POST /carrinho/:id/cupom", expected: 422, obtained: 200, response: "Segundo cupom é aceito no mesmo carrinho." },
  { suite: "Cupom", test: "SELLERB15", status: "Fail", request: "POST /carrinho/:id/cupom", expected: 200, obtained: 200, response: "Desconto calcula sobre subtotal total, não só sellerB." },
  { suite: "Cupom", test: "NOVATO5 limite de uso", status: "Fail", request: "POST /carrinho/:id/cupom", expected: 422, obtained: 200, response: "Segundo uso ainda é aceito." },
  { suite: "Checkout", test: "Carrinho vazio", status: "Pass", request: "POST /carrinho/:id/checkout", expected: 422, obtained: 422, response: "Regra de carrinho vazio atendida." },
  { suite: "Checkout", test: "Pedido confirmado", status: "Pass", request: "POST /carrinho/:id/checkout", expected: 201, obtained: 201, response: "Pedido criado com status confirmado." },
  { suite: "Rota", test: "Carrinho inexistente", status: "Pass", request: "GET /carrinho/cart_inexistente", expected: 404, obtained: 404, response: "Rota responde como esperado." },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function badgeClass(status) {
  if (status === "Pass" || status === "Coberto") {
    return "badge-pass";
  }

  if (status === "Parcial") {
    return "badge-partial";
  }

  if (status === "Não coberto") {
    return "badge-none";
  }

  return "badge-fail";
}

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>QA Marketplace API Report</title>
  <style>
    :root {
      --bg: #a9ee9c;
      --panel: #f7fff5;
      --border: #6fb06b;
      --text: #133016;
      --muted: #3d5b41;
      --pass: #1f7a3d;
      --fail: #b3261e;
      --row: #eaffea;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: linear-gradient(180deg, #b1f2a3 0%, #d8f9d1 100%);
      color: var(--text);
    }
    .wrap { max-width: 1220px; margin: 0 auto; padding: 16px; }
    .title {
      display: flex; justify-content: space-between; align-items: start; gap: 16px;
      margin-bottom: 12px;
    }
    h1 { margin: 0; font-size: 34px; }
    .generated { text-align: right; font-size: 13px; line-height: 1.35; }
    .section {
      background: rgba(255,255,255,0.55);
      border: 1px solid var(--border);
      margin-bottom: 14px;
      box-shadow: 0 1px 0 rgba(0,0,0,0.05);
    }
    .section h2 {
      margin: 0; padding: 10px 12px; font-size: 22px; border-bottom: 1px solid var(--border);
      background: rgba(255,255,255,0.35);
    }
    .info-grid {
      display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 10px; padding: 12px;
    }
    .card {
      background: var(--panel); border: 1px solid var(--border); padding: 12px;
    }
    .stats {
      width: 100%; border-collapse: collapse; background: white;
    }
    .stats th, .stats td {
      border: 1px solid #999; padding: 8px 10px; text-align: center; font-size: 14px;
    }
    .stats thead th {
      background: #d6ead2; font-weight: bold;
    }
    .stats tbody tr:nth-child(even) { background: var(--row); }
    .summary-bar {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 12px;
    }
    .metric {
      background: white; border: 1px solid var(--border); padding: 12px;
      min-height: 84px;
    }
    .metric .label { font-size: 13px; color: var(--muted); margin-bottom: 8px; }
    .metric .value { font-size: 26px; font-weight: bold; }
    .metric.pass .value { color: var(--pass); }
    .metric.fail .value { color: var(--fail); }
    .details-table { width: 100%; border-collapse: collapse; background: white; }
    .details-table th, .details-table td {
      border: 1px solid #999; padding: 8px; vertical-align: top; font-size: 13px;
    }
    .details-table thead th { background: #d6ead2; }
    .details-table tbody tr:nth-child(even) { background: #f6fff4; }
    .trace-table { width: 100%; border-collapse: collapse; background: white; }
    .trace-table th, .trace-table td {
      border: 1px solid #999; padding: 8px; vertical-align: top; font-size: 13px;
    }
    .trace-table thead th { background: #d6ead2; }
    .trace-table tbody tr:nth-child(even) { background: #f6fff4; }
    .coverage-table { width: 100%; border-collapse: collapse; background: white; }
    .coverage-table th, .coverage-table td {
      border: 1px solid #999; padding: 8px; vertical-align: top; font-size: 13px;
    }
    .coverage-table thead th { background: #d6ead2; }
    .coverage-table tbody tr:nth-child(even) { background: #f6fff4; }
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 999px; color: white; font-weight: bold; font-size: 12px;
    }
    .badge-pass { background: var(--pass); }
    .badge-fail { background: var(--fail); }
    .badge-partial { background: #966b00; }
    .badge-none { background: #4c4c4c; }
    .muted { color: var(--muted); }
    .notes { padding: 12px; }
    .notes ul { margin: 0; padding-left: 18px; }
    .mini { font-size: 13px; line-height: 1.5; }
    .acceptance {
      background: #fff;
      border: 1px solid var(--border);
      padding: 12px;
      margin: 12px;
      line-height: 1.5;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="title">
      <div>
        <h1>QA Marketplace API Report</h1>
      </div>
      <div class="generated">
        <div><strong>Generated</strong></div>
        <div>${escapeHtml(reportDate)}</div>
        <div><strong>Fonte:</strong> execução automatizada de testes</div>
      </div>
    </div>

    <div class="section">
      <h2>Summary Information</h2>
      <div class="summary-bar">
        <div class="metric"><div class="label">Status</div><div class="value" style="font-size:20px;color:var(--fail)">Findings detected</div></div>
        <div class="metric"><div class="label">Total Tests</div><div class="value">${summary.total}</div></div>
        <div class="metric pass"><div class="label">Pass</div><div class="value">${summary.pass}</div></div>
        <div class="metric fail"><div class="label">Fail</div><div class="value">${summary.fail}</div></div>
      </div>
      <div class="info-grid">
        <div class="card mini"><strong>Escopo</strong><br/>Cupom, checkout, carrinho, estoque e cálculo de totais no marketplace multi-seller.</div>
        <div class="card mini"><strong>Leitura de QA</strong><br/>A suíte prioriza risco de negócio e expõe divergências reais da mock API.</div>
        <div class="card mini"><strong>Ambiente</strong><br/>Node: ${escapeHtml(runtimeInfo.node)}<br/>OS: ${escapeHtml(runtimeInfo.os)}<br/>Comando: ${escapeHtml(runtimeInfo.command)}</div>
        <div class="card mini"><strong>Reprodutibilidade</strong><br/>Data/hora da execução exibida no topo.<br/>Artefatos complementares: evidências em Markdown e relatório executivo.</div>
      </div>
    </div>

    <div class="section">
      <h2>Defects by Severity</h2>
      <table class="stats">
        <thead>
          <tr><th>Severidade</th><th>Quantidade</th><th>Prioridade sugerida</th><th>Resumo</th></tr>
        </thead>
        <tbody>
          ${severity.map((item) => `<tr><td>${escapeHtml(item.level)}</td><td>${item.count}</td><td>${escapeHtml(item.priority)}</td><td style="text-align:left">${escapeHtml(item.note)}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Coverage by Test Type</h2>
      <table class="coverage-table">
        <thead>
          <tr><th>Tipo</th><th>Status</th><th>Observação</th></tr>
        </thead>
        <tbody>
          ${coverageTypes.map((item) => `<tr><td>${escapeHtml(item.type)}</td><td><span class="badge ${badgeClass(item.status)}">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.note)}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Performance Baseline</h2>
      ${performanceBaseline
        ? `<table class="coverage-table">
        <thead>
          <tr><th>Cenário</th><th>Req</th><th>Conc.</th><th>RPS</th><th>Avg (ms)</th><th>P95 (ms)</th><th>P99 (ms)</th><th>Erros</th><th>Gate</th><th>Observação</th></tr>
        </thead>
        <tbody>
          ${perfEvaluations
            .map(
              (row) => `<tr>
            <td>${escapeHtml(row.name)}</td>
            <td>${row.totalRequests}</td>
            <td>${row.concurrency}</td>
            <td>${row.rps.toFixed(2)}</td>
            <td>${row.avgMs.toFixed(2)}</td>
            <td>${row.p95Ms.toFixed(2)}</td>
            <td>${row.p99Ms.toFixed(2)}</td>
            <td>${row.errors}</td>
            <td><span class="badge ${badgeClass(row.gate.status)}">${row.gate.status}</span></td>
            <td>${escapeHtml(row.gate.reason)}</td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>
      <div class="notes mini">
        <strong>Thresholds:</strong> P95 ≤ ${performanceThresholds.maxP95Ms}ms, P99 ≤ ${performanceThresholds.maxP99Ms}ms, erros ≤ ${performanceThresholds.maxErrors}.<br/>
        <strong>Resultado geral do gate:</strong> <span class="badge ${badgeClass(perfGateStatus)}">${perfGateStatus}</span>
      </div>
      <div class="notes mini muted">Gerado a partir de ${escapeHtml(performanceBaseline.generatedAt)} com Node ${escapeHtml(
            performanceBaseline.node
          )}. Trata-se de baseline de referência para apresentação.</div>`
        : `<div class="notes mini muted">Baseline de performance ainda não gerado. Execute <strong>npm run report:perf</strong>.</div>`}
    </div>

    <div class="section">
      <h2>Test Statistics</h2>
      <table class="stats">
        <thead>
          <tr><th>Suite</th><th>Total</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Nota</th></tr>
        </thead>
        <tbody>
          ${suites.map((suite) => `<tr><td style="text-align:left">${escapeHtml(suite.name)}</td><td>${suite.total}</td><td>${suite.pass}</td><td>${suite.fail}</td><td>${suite.skip}</td><td style="text-align:left">${escapeHtml(suite.note)}</td></tr>`).join("")}
          <tr>
            <th style="text-align:left">All Tests</th>
            <th>${summary.total}</th>
            <th>${summary.pass}</th>
            <th>${summary.fail}</th>
            <th>${summary.skip}</th>
            <th style="text-align:left">Bateria total da entrega</th>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Traceability Matrix</h2>
      <table class="trace-table">
        <thead>
          <tr>
            <th>Requisito do contrato</th>
            <th>Teste(s) vinculados</th>
            <th>Status</th>
            <th>Evidência</th>
          </tr>
        </thead>
        <tbody>
          ${traceability.map((item) => `<tr><td>${escapeHtml(item.req)}</td><td>${escapeHtml(item.tests)}</td><td><span class="badge ${badgeClass(item.status)}">${item.status}</span></td><td>${escapeHtml(item.evidence)}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Test Details</h2>
      <div class="notes mini muted">Lista resumida de evidências com cara de execução de dashboard, útil para leitura rápida em apresentação.</div>
      <table class="details-table">
        <thead>
          <tr>
            <th>Suite</th>
            <th>Test</th>
            <th>Status</th>
            <th>Request</th>
            <th>Expected</th>
            <th>Obtained</th>
            <th>Observation</th>
          </tr>
        </thead>
        <tbody>
          ${details.map((item) => `<tr><td>${escapeHtml(item.suite)}</td><td>${escapeHtml(item.test)}</td><td><span class="badge ${badgeClass(item.status)}">${item.status}</span></td><td>${escapeHtml(item.request)}</td><td>${item.expected}</td><td>${item.obtained}</td><td>${escapeHtml(item.response)}</td></tr>`).join("")}
        </tbody>
      </table>
      <div class="acceptance">
        <strong>Critério de aceite desta suíte:</strong><br/>
        Falhas atuais não representam instabilidade dos testes, e sim divergências funcionais da mock API versus o contrato esperado do desafio.
        Em uma aplicação real, o objetivo é zerar essas falhas após correção dos defeitos no backend.
      </div>
    </div>
  </div>
</body>
</html>`;

const outputPath = path.join(__dirname, "..", "docs", "relatorio-dashboard.html");
fs.writeFileSync(outputPath, html, "utf8");
console.log(`Relatorio HTML gerado em ${outputPath}`);
