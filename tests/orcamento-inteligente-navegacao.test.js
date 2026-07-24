const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const assert = require("node:assert/strict");

const carregarController = () => {
    const caminho = join(__dirname, "..", "js", "orcamentos", "orcamento-inteligente-controller.js");
    const codigo = `${readFileSync(caminho, "utf8")}\nglobalThis.OrcamentoInteligenteControllerTeste = OrcamentoInteligenteController;`;
    const contexto = {
        console,
        window: {},
        document: {
            addEventListener: () => {}
        }
    };

    vm.runInNewContext(codigo, contexto, { filename: caminho });
    return {
        contexto,
        controller: contexto.OrcamentoInteligenteControllerTeste
    };
};

test("cliente selecionado avanca diretamente para itens no mobile", async () => {
    const { contexto, controller } = carregarController();
    const cliente = { id: "cliente-1", nome: "Cliente Teste" };

    contexto.OrcamentoOrchestrator = {
        selecionarCliente: async () => ({
            sucesso: true,
            contexto: { cliente, produtos: [] },
            erros: []
        })
    };

    controller.contexto = { produtos: [] };
    controller.etapaAtual = "cliente";
    controller.obterClientePorId = () => cliente;
    controller.estaEmMobile = () => true;
    controller.garantirServicoPadrao = () => {};
    controller.renderizarEtapaAtual = () => {};
    controller.atualizarResumo = () => {};
    controller.sincronizarFluxo = () => {};
    controller.prepararEtapaAoEntrar = () => {};
    controller.mostrarAviso = () => {};

    await controller.selecionarCliente(cliente.id);

    assert.equal(controller.etapaAtual, "produtos");
});

test("cadastro rapido reutiliza a selecao que conduz para itens", async () => {
    const { contexto, controller } = carregarController();
    const cliente = { id: "cliente-novo", nome: "Cliente Novo" };
    let clienteSelecionado = "";

    contexto.CriarClienteUseCase = {
        executar: async () => ({
            sucesso: true,
            cliente,
            erros: []
        })
    };

    controller.dados = { clientes: [] };
    controller.prepararDadosNovoCliente = dados => dados;
    controller.persistirClientesFluxo = () => {};
    controller.selecionarCliente = async clienteId => {
        clienteSelecionado = clienteId;
    };
    controller.mostrarAviso = () => {};

    await controller.criarClienteRapido({
        nome: cliente.nome,
        telefonePrincipal: "73999999999"
    });

    assert.equal(clienteSelecionado, cliente.id);
});

test("interface de itens possui uma unica acao de adicionar e oferece limpar", () => {
    const caminho = join(__dirname, "..", "js", "orcamentos", "orcamento-inteligente-ui.js");
    const codigo = readFileSync(caminho, "utf8");
    const adicionar = codigo.match(/data-orcamento-action="adicionar-item"/g) || [];
    const limpar = codigo.match(/data-orcamento-action="limpar-item"/g) || [];

    assert.equal(adicionar.length, 1);
    assert.equal(limpar.length, 1);
    assert.match(codigo, /orcamento-inteligente-controle-unidade/);
    assert.match(codigo, /orcamento-inteligente-dependencias-texto/);
    assert.match(codigo, /orcamento-inteligente-campo-item-selecao/);
    assert.equal((codigo.match(/orcamento-inteligente-campo-dimensao/g) || []).length, 2);
    assert.doesNotMatch(codigo, /<div class="orcamento-inteligente-grupo-topo">/);
});

test("limpar item preserva contexto, etapa e itens adicionados", () => {
    const { controller } = carregarController();
    const contextoOriginal = {
        cliente: { id: "cliente-1" },
        produtos: [{ id: "item-adicionado" }]
    };
    const descricao = {
        dataset: {
            autogerada: "true",
            itemPronto: "true"
        }
    };
    let resetExecutado = false;
    let formularioAtualizado = false;
    let obrigatoriedadeAtualizada = false;
    let persistenciaAgendada = false;
    let focoAplicado = false;
    let aviso = "";

    const primeiroCampo = {
        focus: () => {
            focoAplicado = true;
        }
    };
    const form = {
        reset: () => {
            resetExecutado = true;
        },
        querySelector: seletor => {
            if (seletor === "[name='descricao']") return descricao;
            if (seletor === "[name='itemProntoId']") return primeiroCampo;
            return null;
        }
    };
    const botao = {
        closest: seletor => seletor === "[data-orcamento-form='produto']" ? form : null
    };

    controller.contexto = contextoOriginal;
    controller.etapaAtual = "produtos";
    controller.formularioNovoItemPendente = { descricao: "rascunho" };
    controller.atualizarFormularioItem = formulario => {
        formularioAtualizado = formulario === form;
    };
    controller.atualizarObrigatoriedadeAdicional = formulario => {
        obrigatoriedadeAtualizada = formulario === form;
    };
    controller.agendarPersistenciaRascunho = () => {
        persistenciaAgendada = true;
    };
    controller.mostrarAviso = mensagem => {
        aviso = mensagem;
    };

    const resultado = controller.limparItemAtual(botao);

    assert.equal(resultado, true);
    assert.equal(resetExecutado, true);
    assert.equal(formularioAtualizado, true);
    assert.equal(obrigatoriedadeAtualizada, true);
    assert.equal(persistenciaAgendada, true);
    assert.equal(focoAplicado, true);
    assert.equal(aviso, "Campos do item limpos.");
    assert.equal(controller.contexto, contextoOriginal);
    assert.equal(controller.contexto.produtos.length, 1);
    assert.equal(controller.etapaAtual, "produtos");
    assert.equal(controller.formularioNovoItemPendente, null);
    assert.equal(descricao.dataset.autogerada, "false");
    assert.equal("itemPronto" in descricao.dataset, false);
});
