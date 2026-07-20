const test = require("node:test");
const assert = require("node:assert/strict");

const memoriaLocal = new Map();
global.localStorage = {
    getItem: chave => memoriaLocal.has(chave) ? memoriaLocal.get(chave) : null,
    setItem: (chave, valor) => memoriaLocal.set(chave, String(valor)),
    removeItem: chave => memoriaLocal.delete(chave)
};
const { ProjetoModel } = require("../js/projetos/projeto-model.js");
global.ProjetoModel = ProjetoModel;
const { NotaServicoModel } = require("../js/notas-servico/nota-servico-model.js");
global.NotaServicoModel = NotaServicoModel;
const { MedicaoOperacionalModel } = require("../js/medicoes/medicao-operacional-model.js");
global.MedicaoOperacionalModel = MedicaoOperacionalModel;
const { MedicaoOperacionalRepository } = require("../js/medicoes/medicao-operacional-repository.js");
const { OrdemServicoOperacionalModel } = require("../js/notas-servico/ordem-servico-operacional-model.js");
global.OrdemServicoOperacionalModel = OrdemServicoOperacionalModel;
const { OrdemServicoOperacionalRepository } = require("../js/notas-servico/ordem-servico-operacional-repository.js");

class FirestoreFalso {
    constructor() { this.colecoes = new Map(); }
    mapa(nome) {
        if (!this.colecoes.has(nome)) this.colecoes.set(nome, new Map());
        return this.colecoes.get(nome);
    }
    referencia(colecao, id) { return { colecao, id: String(id) }; }
    snapshot(referencia) {
        const mapa = this.mapa(referencia.colecao);
        const exists = mapa.has(referencia.id);
        return { id: referencia.id, exists, data: () => exists ? structuredClone(mapa.get(referencia.id)) : undefined };
    }
    collection(nome) {
        const firestore = this;
        return {
            doc(id) {
                const referencia = firestore.referencia(nome, id);
                return { ...referencia, get: async () => firestore.snapshot(referencia) };
            }
        };
    }
    async runTransaction(executor) {
        const firestore = this;
        return executor({
            get: async referencia => firestore.snapshot(referencia),
            set(referencia, dados, opcoes = {}) {
                const mapa = firestore.mapa(referencia.colecao);
                const atual = mapa.get(referencia.id) || {};
                mapa.set(referencia.id, structuredClone(opcoes.merge ? { ...atual, ...dados } : dados));
            }
        });
    }
}

function projeto() {
    return ProjetoModel.normalizar({
        id: "projeto-31",
        numero: "PRJ-000031",
        origem: "orcamento_aprovado",
        status: "aprovado",
        cliente: { id: "cliente-31", nome: "Cliente 31" },
        obra: { endereco: "Rua da Obra, 31" },
        orcamento: { id: "orcamento-31", numero: "000031", status: "aprovado" },
        operacional: { status: "aguardando_medicao" },
        historico: [{ tipo: "operacao_aberta", dados: { orcamentoId: "orcamento-31" } }]
    });
}

function estadoMedicao() {
    return {
        projetoId: "projeto-31",
        clienteNome: "Cliente 31",
        obraEndereco: "Rua da Obra, 31",
        responsavel: "Técnico RK",
        dataMedicao: "2026-07-20",
        medidas: [{ id: "m1", quantidade: 1, tipo: "Porta", descricao: "Porta principal", altura: 210, largura: 90 }]
    };
}

test("repositórios mantêm medição e ordem únicas durante todo o fluxo", async () => {
    const firestore = new FirestoreFalso();
    firestore.mapa("projetos").set("projeto-31", projeto());
    global.db = firestore;

    const rascunho = await MedicaoOperacionalRepository.salvar("projeto-31", estadoMedicao(), { usuario: { nome: "Caio" } });
    assert.equal(rascunho.sucesso, true);
    assert.equal(rascunho.medicao.status, "rascunho");
    assert.equal(firestore.mapa("medicoes").size, 1);

    const ordemAntecipada = await OrdemServicoOperacionalRepository.salvar({
        projetoId: "projeto-31",
        medicaoId: rascunho.medicao.id,
        clienteNome: "Cliente 31",
        servicos: [{ id: "s1", descricao: "Instalação", quantidade: 1, unidade: "un.", valorUnitario: 0 }]
    }, { projetoId: "projeto-31", medicaoId: rascunho.medicao.id, status: "em_producao", usuario: { nome: "Caio" } });
    assert.equal(ordemAntecipada.sucesso, false);

    const concluida = await MedicaoOperacionalRepository.salvar("projeto-31", estadoMedicao(), { concluir: true, usuario: { nome: "Caio" } });
    assert.equal(concluida.medicao.status, "concluida");
    assert.equal(firestore.mapa("medicoes").size, 1);

    const baseOrdem = OrdemServicoOperacionalModel.estadoDoContexto(concluida.projeto, concluida.medicao);
    const producao = await OrdemServicoOperacionalRepository.salvar(baseOrdem, {
        projetoId: "projeto-31",
        medicaoId: concluida.medicao.id,
        status: "em_producao",
        usuario: { nome: "Caio" }
    });
    assert.equal(producao.sucesso, true);
    assert.equal(producao.projeto.status, "em_producao");
    assert.equal(firestore.mapa("notas_servico").size, 1);

    const repetida = await OrdemServicoOperacionalRepository.salvar(producao.ordem, {
        projetoId: "projeto-31",
        medicaoId: concluida.medicao.id,
        status: "em_producao",
        usuario: { nome: "Caio" }
    });
    assert.equal(repetida.idempotente, true);
    assert.equal(firestore.mapa("notas_servico").size, 1);

    const instalacao = await OrdemServicoOperacionalRepository.salvar(repetida.ordem, {
        projetoId: "projeto-31",
        medicaoId: concluida.medicao.id,
        status: "em_instalacao",
        usuario: { nome: "Caio" }
    });
    assert.equal(instalacao.projeto.status, "em_instalacao");

    const finalizada = await OrdemServicoOperacionalRepository.salvar(instalacao.ordem, {
        projetoId: "projeto-31",
        medicaoId: concluida.medicao.id,
        status: "concluido",
        usuario: { nome: "Caio" }
    });
    assert.equal(finalizada.projeto.status, "finalizado");
    assert.equal(finalizada.projeto.operacional.status, "concluido");
    assert.equal(finalizada.projeto.historico.filter(item => item.tipo === "operacao_concluida").length, 1);
});
