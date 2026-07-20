const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const raiz = join(__dirname, "..");
const ler = caminho => readFileSync(join(raiz, caminho), "utf8");

test("medição carrega modelo e repositório canônicos antes do controller", () => {
    const html = ler("paginas/medicao-obra.html");
    const ordem = [
        "projeto-model.js",
        "medicao-operacional-model.js",
        "medicao-operacional-repository.js",
        "medicao-controller.js"
    ].map(arquivo => html.indexOf(arquivo));
    assert.ok(ordem.every(indice => indice >= 0));
    assert.deepEqual(ordem, [...ordem].sort((a, b) => a - b));
    assert.match(html, /id="btnConcluirMedicao"/);
    assert.match(html, /id="btnAbrirOrdemServico"/);
});

test("ordem de serviço carrega o contrato operacional na ordem segura", () => {
    const html = ler("paginas/nota-servico.html");
    const ordem = [
        "projeto-model.js",
        "medicao-operacional-model.js",
        "nota-servico-model.js",
        "ordem-servico-operacional-model.js",
        "ordem-servico-operacional-repository.js",
        "nota-servico-controller.js"
    ].map(arquivo => html.indexOf(arquivo));
    assert.ok(ordem.every(indice => indice >= 0));
    assert.deepEqual(ordem, [...ordem].sort((a, b) => a - b));
    assert.match(html, /id="btnIniciarInstalacao"/);
    assert.match(html, /id="btnConcluirOrdem"/);
    assert.match(html, /nota-servico-model\.js\?v=0\.8\.0/);
    assert.match(html, /nota-servico-controller\.js\?v=0\.8\.0/);
});

test("medições e ordens operacionais preservam vínculos e histórico", () => {
    const regras = ler("firestore.rules");
    const store = ler("js/shared/rk-firestore-store.js");
    assert.match(regras, /match \/medicoes\/\{documento\}/);
    assert.match(regras, /medicaoOperacionalValida/);
    assert.match(regras, /ordemServicoOperacionalValida/);
    assert.match(regras, /vinculoOrdemServicoPreservado/);
    assert.match(regras, /match \/notas_servico\/\{documento\} \{[\s\S]*?allow delete: if false/);
    assert.match(store, /notas: \{ colecao: "notas_servico", id: "nota_id", excluir: "cancelar" \}/);
});

test("dashboard inclui pendências de medição, produção e instalação", () => {
    const controller = ler("js/dashboard-comercial/dashboard-comercial-controller.js");
    const html = ler("paginas/dashboard-comercial.html");
    assert.match(controller, /aguardandoMedicao/);
    assert.match(controller, /medicaoEmAndamento/);
    assert.match(controller, /emProducao/);
    assert.match(controller, /emInstalacao/);
    assert.match(controller, /this\.montarAcoes\(orcamentos, projetos\)/);
    assert.match(html, /dashboard-comercial-controller\.js\?v=0\.8\.0/);
});

test("cancelamento comercial também encerra ordem operacional ativa", () => {
    const repositorio = ler("js/projetos/projeto-operacional-repository.js");
    assert.match(repositorio, /colecaoOrdens: "notas_servico"/);
    assert.match(repositorio, /ordem_servico_cancelada/);
    assert.match(repositorio, /status: "cancelado"/);
});
