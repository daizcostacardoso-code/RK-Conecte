const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const vm = require("node:vm");

const raiz = resolve(__dirname, "..");
const interfaceDashboard = readFileSync(resolve(raiz, "js/dashboard-comercial/dashboard-comercial-ui.js"), "utf8");
const controllerDashboard = readFileSync(resolve(raiz, "js/dashboard-comercial/dashboard-comercial-controller.js"), "utf8");
const estilosDashboard = readFileSync(resolve(raiz, "css/dashboard-comercial.css"), "utf8");

test("dashboard cumprimenta o usuario autenticado pelo primeiro nome", () => {
    assert.match(interfaceDashboard, /obterNomeSaudacao\(estado\.sessao\)/);
    assert.match(interfaceDashboard, /\$\{saudacao\}, \$\{this\.escapar\(nomeUsuario\)\}\./);
    assert.doesNotMatch(interfaceDashboard, /equipe RK\./);
});

test("dashboard mobile mantém somente indicadores comercial e operacional na visão geral", () => {
    assert.match(interfaceDashboard, /renderizarCards\(estado\.kpis \|\| \{\}.*"overview"\)/);
    assert.match(interfaceDashboard, /dashboard-comercial-kpis is-overview/);
    assert.match(interfaceDashboard, /const cardsPrincipais = \[cards\[0\], cards\[2\]\]/);
    assert.match(interfaceDashboard, /<h2>Comercial\/Opera&ccedil;&atilde;o<\/h2>/);
    assert.doesNotMatch(interfaceDashboard, /<h2>Opera&ccedil;&atilde;o e financeiro<\/h2>/);
    assert.match(estilosDashboard, /\.dashboard-comercial-kpi-group > div \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test("indicadores mobile usam superfície escura sem ícones ou faixas", () => {
    assert.match(estilosDashboard, /\.dashboard-comercial-kpis\.is-overview \.dashboard-comercial-card::before,[\s\S]*display: none/);
    assert.match(estilosDashboard, /\.dashboard-comercial-kpis\.is-overview \.dashboard-comercial-card-top i \{[\s\S]*display: none/);
    assert.match(estilosDashboard, /background: rgba\(5, 34, 57, \.20\)/);
    assert.match(estilosDashboard, /border: 1px solid rgba\(185, 211, 226, \.23\)/);
});

test("resumo financeiro mobile permanece fora da visão geral com dados dinâmicos", () => {
    assert.match(interfaceDashboard, /renderizarResumoFinanceiro\(estado\.resumoCaixa \|\| \{\}\)/);
    assert.match(interfaceDashboard, /dashboard-comercial-financial-summary/);
    assert.match(interfaceDashboard, /this\.formatarMoeda\(caixa\.entradas\)/);
    assert.match(interfaceDashboard, /this\.formatarMoeda\(caixa\.saidas\)/);
    assert.match(interfaceDashboard, /this\.formatarMoeda\(saldo\)/);
    assert.match(estilosDashboard, /\.dashboard-comercial-financial-values \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) 58px/);
    assert.match(interfaceDashboard, /renderizarGraficoMensal\(caixa\)/);
    assert.match(interfaceDashboard, /<span aria-hidden="true">M&ecirc;s<\/span>/);
    assert.match(interfaceDashboard, /Resultado mensal \$\{estado\}/);
    assert.match(interfaceDashboard, /dashboard-comercial-chart-area/);
    assert.match(interfaceDashboard, /dashboard-comercial-chart-line/);
    assert.match(interfaceDashboard, /dashboard-comercial-chart-halo/);
    assert.match(estilosDashboard, /\.dashboard-comercial-monthly-chart\.is-positive \{ color: #19a74c; \}/);
    assert.match(estilosDashboard, /\.dashboard-comercial-monthly-chart\.is-negative \{ color: #df3038; \}/);
    assert.match(estilosDashboard, /@media \(prefers-reduced-motion: reduce\)/);
});

test("atualização manual mantém nome acessível e expõe estado ocupado", () => {
    assert.match(interfaceDashboard, /aria-label="Atualizar indicadores"/);
    assert.match(interfaceDashboard, /setAttribute\("aria-busy", "true"\)/);
    assert.match(interfaceDashboard, /setAttribute\("aria-busy", "false"\)/);
    assert.match(estilosDashboard, /\.dashboard-comercial-refresh\[aria-busy="true"\]/);
    assert.match(estilosDashboard, /place-items: center/);
});

test("gráfico mensal acumula somente lançamentos confirmados do mês", () => {
    const contexto = {
        document: { addEventListener() {} },
        resultado: null
    };
    vm.runInNewContext(`${controllerDashboard}
        resultado = DashboardComercialController.montarSerieMensal([
            { data: "2026-07-02", tipo: "entrada", valor: 100 },
            { data: "2026-07-05", tipo: "saida", valor: 40 },
            { data: "2026-06-30", tipo: "entrada", valor: 500 }
        ], "2026-07");`, contexto);
    assert.deepEqual(Array.from(contexto.resultado), [0, 100, 60]);
});
