const test = require("node:test");
const assert = require("node:assert/strict");

const { OrcamentoAprovacaoModel } = require("../js/orcamentos/orcamento-aprovacao-model.js");
const { OrcamentoAprovacaoValidator } = require("../js/orcamentos/orcamento-aprovacao-validator.js");
global.OrcamentoAprovacaoModel = OrcamentoAprovacaoModel;
global.OrcamentoAprovacaoValidator = OrcamentoAprovacaoValidator;
global.RKAuth = {
    obterSessao: () => ({ uid: "admin-1", nomeUsuario: "Admin RK", email: "admin@example.com" })
};

function criarCenario() {
    let atual = OrcamentoAprovacaoModel.normalizarRegistro({
        id: "orcamento-integracao",
        numero: "000300",
        status: "enviado",
        cliente: { id: "cliente-3", nome: "Cliente Integração" },
        itens: [{ nome: "Box frontal" }],
        total: 1800,
        historicoStatus: [{
            id: "hist-envio",
            statusAnterior: "emitido",
            statusAtual: "enviado",
            acao: "orcamento_enviado",
            realizadoEm: "2026-07-20T08:00:00.000Z"
        }]
    });
    const chamadas = { abertura: 0, cancelamento: 0 };
    global.OrcamentoAprovacaoRepository = {
        buscarPorIdOuNumero: async () => ({ sucesso: true, registro: atual }),
        async executarTransacao(_id, executor) {
            const resultado = await executor(atual);
            if (resultado.sucesso && resultado.escrever !== false) atual = resultado.registro;
            return resultado;
        }
    };
    global.ProjetoOperacionalService = {
        async garantirAbertura(_id, opcoes) {
            chamadas.abertura += 1;
            atual = OrcamentoAprovacaoModel.normalizarRegistro({
                ...opcoes.orcamento,
                vinculos: { ...opcoes.orcamento.vinculos, projetoId: "prj_orc_integracao" },
                projetoId: "prj_orc_integracao",
                operacao: { projetoId: "prj_orc_integracao", status: "aberta", abertaEm: new Date().toISOString(), abertaPor: opcoes.usuario }
            });
            return { sucesso: true, orcamento: atual, projeto: { id: "prj_orc_integracao" }, criado: true, idempotente: chamadas.abertura > 1, mensagem: "Operação aberta." };
        },
        async cancelarDeOrcamento() {
            chamadas.cancelamento += 1;
            return { sucesso: true, projeto: { id: "prj_orc_integracao", status: "cancelado" }, idempotente: false, mensagem: "Operação cancelada." };
        }
    };
    return { chamadas, obterAtual: () => atual };
}

test("aprovação abre operação inclusive em repetição idempotente", async () => {
    const cenario = criarCenario();
    delete require.cache[require.resolve("../js/orcamentos/orcamento-aprovacao-service.js")];
    const { OrcamentoAprovacaoService } = require("../js/orcamentos/orcamento-aprovacao-service.js");

    const aprovado = await OrcamentoAprovacaoService.aprovar("orcamento-integracao");
    assert.equal(aprovado.sucesso, true);
    assert.equal(aprovado.registro.status, "aprovado");
    assert.equal(aprovado.registro.operacao.projetoId, "prj_orc_integracao");
    assert.equal(cenario.chamadas.abertura, 1);

    const repetido = await OrcamentoAprovacaoService.aprovar("orcamento-integracao");
    assert.equal(repetido.sucesso, true);
    assert.equal(repetido.operacaoIdempotente, true);
    assert.equal(cenario.chamadas.abertura, 2);
});

test("cancelamento comercial encerra o projeto vinculado", async () => {
    const cenario = criarCenario();
    delete require.cache[require.resolve("../js/orcamentos/orcamento-aprovacao-service.js")];
    const { OrcamentoAprovacaoService } = require("../js/orcamentos/orcamento-aprovacao-service.js");
    await OrcamentoAprovacaoService.aprovar("orcamento-integracao");
    const cancelado = await OrcamentoAprovacaoService.cancelar("orcamento-integracao", { confirmado: true, observacao: "Cancelamento de teste." });

    assert.equal(cancelado.sucesso, true);
    assert.equal(cenario.obterAtual().status, "cancelado");
    assert.equal(cenario.obterAtual().operacao.status, "cancelada");
    assert.equal(cenario.chamadas.cancelamento, 1);
    assert.equal(cancelado.projeto.status, "cancelado");
});
