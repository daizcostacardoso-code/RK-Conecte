const test = require("node:test");
const assert = require("node:assert/strict");

const { OrcamentoAprovacaoModel } = require("../js/orcamentos/orcamento-aprovacao-model.js");
global.OrcamentoAprovacaoModel = OrcamentoAprovacaoModel;
const { OrcamentoAprovacaoRepository } = require("../js/orcamentos/orcamento-aprovacao-repository.js");

class FirestoreFalso {
    constructor() {
        this.colecoes = new Map();
    }

    mapa(nome) {
        if (!this.colecoes.has(nome)) this.colecoes.set(nome, new Map());
        return this.colecoes.get(nome);
    }

    snapshot(nome, id) {
        const mapa = this.mapa(nome);
        const existe = mapa.has(id);
        return {
            id,
            exists: existe,
            data: () => existe ? structuredClone(mapa.get(id)) : undefined
        };
    }

    collection(nome) {
        const firestore = this;
        return {
            doc(id) {
                return {
                    nome,
                    id,
                    get: async () => firestore.snapshot(nome, id)
                };
            },
            where(campo, operador, valor) {
                assert.equal(operador, "==");
                return {
                    limit() {
                        return {
                            async get() {
                                const docs = [...firestore.mapa(nome)]
                                    .filter(([, dados]) => dados[campo] === valor)
                                    .slice(0, 1)
                                    .map(([id]) => firestore.snapshot(nome, id));
                                return { docs };
                            }
                        };
                    }
                };
            }
        };
    }

    async runTransaction(executor) {
        const firestore = this;
        const transacao = {
            get: referencia => referencia.get(),
            set(referencia, dados, opcoes = {}) {
                const mapa = firestore.mapa(referencia.nome);
                const atual = mapa.get(referencia.id) || {};
                mapa.set(referencia.id, structuredClone(opcoes.merge ? { ...atual, ...dados } : dados));
            }
        };
        return executor(transacao);
    }
}

test("repositório reutiliza documento legado pelo número e evita duplicidade", async () => {
    const firestore = new FirestoreFalso();
    firestore.mapa("orcamentos_emitidos").set("documento-legado", {
        numero: "000123",
        status: "enviado",
        cliente: { id: "cliente-1", nome: "Cliente 1" },
        aprovacao: { versaoOrcamento: 1 },
        historicoStatus: [{
            id: "hist_envio",
            statusAnterior: "emitido",
            statusAtual: "enviado",
            acao: "orcamento_enviado",
            realizadoEm: "2026-07-20T12:00:00.000Z"
        }],
        criadoEmISO: "2026-07-20T10:00:00.000Z",
        atualizadoEmISO: "2026-07-20T12:00:00.000Z"
    });
    global.db = firestore;

    const primeira = await OrcamentoAprovacaoRepository.registrarEmissao({
        id: "000123",
        numero: "000123",
        cliente: { id: "cliente-1", nome: "Cliente 1" },
        projeto: { id: "projeto-1" },
        status: "emitido"
    }, { origem: "TESTE" });

    assert.equal(primeira.sucesso, true);
    assert.equal(primeira.novaVersao, true);
    assert.equal(primeira.registro.id, "documento-legado");
    assert.equal(primeira.registro.revisao, 2);
    assert.equal(primeira.registro.projetoId, "projeto-1");
    assert.equal(firestore.mapa("orcamentos_emitidos").size, 1);
    assert.equal(primeira.registro.historicoStatus.at(-1).acao, "nova_versao_emitida");

    const quantidadeHistorico = primeira.registro.historicoStatus.length;
    const repetida = await OrcamentoAprovacaoRepository.registrarEmissao({
        id: "000123",
        numero: "000123",
        cliente: { id: "cliente-1", nome: "Cliente 1" },
        status: "emitido"
    }, { origem: "TESTE" });

    assert.equal(repetida.sucesso, true);
    assert.equal(repetida.novaVersao, false);
    assert.equal(repetida.registro.revisao, 2);
    assert.equal(repetida.registro.historicoStatus.length, quantidadeHistorico);
    assert.equal(firestore.mapa("orcamentos_emitidos").size, 1);

    const consulta = await OrcamentoAprovacaoRepository.buscarPorIdOuNumero("000123");
    assert.equal(consulta.sucesso, true);
    assert.equal(consulta.registro.id, "documento-legado");
});

test("repositório cria emissão canônica com histórico inicial", async () => {
    const firestore = new FirestoreFalso();
    global.db = firestore;

    const resultado = await OrcamentoAprovacaoRepository.registrarEmissao({
        numero: "ORC 000124",
        cliente: { id: "cliente-2", nome: "Cliente 2" },
        itens: [{ nome: "Box" }],
        total: 900
    }, { origem: "TESTE" });

    assert.equal(resultado.sucesso, true);
    assert.equal(resultado.registro.id, "ORC-000124");
    assert.equal(resultado.registro.schemaVersion, 3);
    assert.equal(resultado.registro.status, "emitido");
    assert.equal(resultado.registro.historicoStatus[0].acao, "orcamento_emitido");
    assert.equal(firestore.mapa("orcamentos_emitidos").size, 1);
});
