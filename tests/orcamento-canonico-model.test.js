const test = require("node:test");
const assert = require("node:assert/strict");

const { OrcamentoAprovacaoModel } = require("../js/orcamentos/orcamento-aprovacao-model.js");
global.OrcamentoAprovacaoModel = OrcamentoAprovacaoModel;
const { OrcamentoAprovacaoValidator } = require("../js/orcamentos/orcamento-aprovacao-validator.js");

test("modelo canônico normaliza orçamento legado sem perder vínculos", () => {
    const legado = {
        id: "documento-legado",
        numero_orcamento: "000321",
        origemSolicitacaoId: "solicitacao-9",
        cliente: { id: "cliente-7", nome: "Cliente Canônico" },
        projeto: { id: "projeto-4", numero: "PRJ-4" },
        status: "finalizado",
        totalFinal: 1250.5,
        criadoEmISO: "2026-07-20T10:00:00.000Z"
    };

    const normalizado = OrcamentoAprovacaoModel.normalizarRegistro(legado);
    const repetido = OrcamentoAprovacaoModel.normalizarRegistro(legado);

    assert.equal(normalizado.id, "documento-legado");
    assert.equal(normalizado.numero, "000321");
    assert.equal(normalizado.status, "emitido");
    assert.equal(normalizado.schemaVersion, 4);
    assert.equal(normalizado.fonteCanonica, "orcamentos_emitidos");
    assert.deepEqual(normalizado.vinculos, {
        solicitacaoId: "solicitacao-9",
        clienteId: "cliente-7",
        projetoId: "projeto-4"
    });
    assert.equal(normalizado.revisao, 1);
    assert.equal(normalizado.historicoStatus[0].id, "hist_normalizacao_documento_legado");
    assert.deepEqual(normalizado.historicoStatus, repetido.historicoStatus);
});

test("modelo canônico extrai identidade do documento comercial", () => {
    const registro = OrcamentoAprovacaoModel.normalizarRegistro({
        documento: {
            dados: {
                cliente: { id: "cliente-doc", nome: "Cliente Documento" },
                projeto: { id: "projeto-doc", numero: "PRJ-99" },
                metadados: {
                    numeroOrcamento: "000999",
                    geradoEm: "2026-07-20T11:00:00.000Z"
                }
            }
        }
    });

    assert.equal(registro.numero, "000999");
    assert.equal(registro.clienteId, "cliente-doc");
    assert.equal(registro.projetoId, "projeto-doc");
    assert.equal(registro.clienteNome, "Cliente Documento");
});

test("modelo canônico lê o envelope registro usado pela camada Firestore antiga", () => {
    const normalizado = OrcamentoAprovacaoModel.normalizarRegistro({
        id: "envelope-legado",
        registro: {
            numero: "000777",
            cliente: { id: "cliente-envelope", nome: "Cliente Envelope" },
            itens: [{ nome: "Janela" }],
            totais: { totalGeral: 780 }
        },
        criado_em: "2026-07-20T09:00:00.000Z"
    });

    assert.equal(normalizado.numero, "000777");
    assert.equal(normalizado.clienteId, "cliente-envelope");
    assert.equal(OrcamentoAprovacaoModel.obterItens(normalizado).length, 1);
    assert.equal(OrcamentoAprovacaoModel.obterTotal(normalizado), 780);
});

test("cancelamento auditável é permitido para qualquer orçamento ainda ativo", () => {
    ["rascunho", "emitido", "enviado", "aprovado", "recusado", "expirado"].forEach(status => {
        const validacao = OrcamentoAprovacaoValidator.validarAcao({
            id: `orc-${status}`,
            numero: `orc-${status}`,
            status,
            criadoEmISO: "2026-07-20T10:00:00.000Z"
        }, "cancelar", { confirmado: true });
        assert.equal(validacao.valido, true, `cancelamento bloqueado para ${status}`);
    });

    const repetido = OrcamentoAprovacaoValidator.validarAcao({
        id: "orc-cancelado",
        status: "cancelado"
    }, "cancelar", { confirmado: true });
    assert.equal(repetido.valido, false);
});
