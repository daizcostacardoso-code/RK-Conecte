import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment
} from "@firebase/rules-unit-testing";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    setLogLevel,
    setDoc,
    updateDoc
} from "firebase/firestore";

const ID_PROJETO = "demo-rk-conecte";
const regras = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
let ambiente;

setLogLevel("silent");

function solicitacaoValida(sobrescritas = {}) {
    const cliente = {
        nome: "Cliente Teste",
        telefone: "71999999999",
        email: "cliente@example.com",
        endereco: "Salvador - BA"
    };
    const base = {
        origem: "orcamento_cliente",
        cliente,
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email,
        endereco: cliente.endereco,
        itens: [{ tipoVidro: "Temperado", largura: 100, altura: 100, quantidade: 1 }],
        servico: "Vidro temperado",
        quantidadeItens: 1,
        subtotal: 500,
        desconto: { tipo: "valor", valor: 0 },
        observacoes: "",
        descricao: "",
        mensagem: "Solicitação de orçamento de teste.",
        data: "20/07/2026, 10:00:00",
        criadoEmISO: "2026-07-20T13:00:00.000Z",
        status: "Solicitado"
    };
    return { ...base, ...sobrescritas };
}

async function gravarSemRegras(caminho, dados) {
    await ambiente.withSecurityRulesDisabled(async contexto => {
        await setDoc(doc(contexto.firestore(), caminho), dados);
    });
}

async function autorizar(uid, perfil = "funcionario") {
    await gravarSemRegras(`usuarios_autorizados/${uid}`, {
        ativo: true,
        perfil,
        email: `${uid}@example.com`,
        nome: perfil === "admin" ? "Administrador RK" : "Funcionário RK"
    });
}

before(async () => {
    ambiente = await initializeTestEnvironment({
        projectId: ID_PROJETO,
        firestore: { rules: regras }
    });
});

beforeEach(async () => {
    await ambiente.clearFirestore();
});

after(async () => {
    await ambiente?.cleanup();
});

test("visitante lê somente os valores públicos de configuração", async () => {
    await gravarSemRegras("configuracoes/valores", { vidroComum: 100 });
    await gravarSemRegras("configuracoes/sistema", { nomeEmpresa: "RK" });
    const visitante = ambiente.unauthenticatedContext().firestore();

    await assertSucceeds(getDoc(doc(visitante, "configuracoes", "valores")));
    await assertFails(getDoc(doc(visitante, "configuracoes", "sistema")));
});

test("visitante não lê coleções internas nem solicitações", async () => {
    await gravarSemRegras("clientes/cliente-1", { nome: "Cliente" });
    await gravarSemRegras("solicitacoes_site/solicitacao-1", solicitacaoValida());
    const visitante = ambiente.unauthenticatedContext().firestore();

    await assertFails(getDocs(collection(visitante, "clientes")));
    await assertFails(getDoc(doc(visitante, "solicitacoes_site", "solicitacao-1")));
});

test("visitante cria uma solicitação válida sem poder alterá-la ou excluí-la", async () => {
    const visitante = ambiente.unauthenticatedContext().firestore();
    const referencia = await assertSucceeds(
        addDoc(collection(visitante, "solicitacoes_site"), solicitacaoValida())
    );

    await assertFails(updateDoc(referencia, { status: "Atendida" }));
    await assertFails(deleteDoc(referencia));
});

test("solicitações públicas fora do contrato são bloqueadas", async () => {
    const visitante = ambiente.unauthenticatedContext().firestore();
    const solicitacoes = collection(visitante, "solicitacoes_site");

    await assertFails(addDoc(solicitacoes, solicitacaoValida({ status: "Atendida" })));
    await assertFails(addDoc(solicitacoes, solicitacaoValida({ administrador: true })));
    await assertFails(addDoc(solicitacoes, solicitacaoValida({ observacoes: "x".repeat(2001) })));
    await assertFails(addDoc(solicitacoes, solicitacaoValida({ itens: [], quantidadeItens: 0 })));
});

test("usuário autenticado sem autorização continua bloqueado", async () => {
    const autenticado = ambiente.authenticatedContext("sem-perfil", {
        email: "sem-perfil@example.com"
    }).firestore();

    await assertFails(setDoc(doc(autenticado, "clientes", "cliente-1"), { nome: "Cliente" }));
    await assertFails(getDocs(collection(autenticado, "orcamentos_emitidos")));
});

test("usuário autorizado opera todas as coleções internas mapeadas", async () => {
    await autorizar("funcionario-1");
    const equipe = ambiente.authenticatedContext("funcionario-1", {
        email: "funcionario@rkvidracaria.com.br"
    }).firestore();
    const caminhos = [
        "configuracoes/sistema",
        "solicitacoes_site/solicitacao-1",
        "servicos/servico-1",
        "caixa_empresa/lancamento-1",
        "clientes/cliente-1",
        "produtos/produto-1",
        "itens/item-1",
        "item_dependencias/dependencia-1",
        "tamanhos_padrao/tamanho-1",
        "unidades_medida/unidade-1",
        "categorias_produto/categoria-1",
        "categorias_item/categoria-1"
    ];

    for (const caminho of caminhos) {
        const referencia = doc(equipe, caminho);
        await assertSucceeds(setDoc(referencia, { teste: true }));
        await assertSucceeds(getDoc(referencia));
        await assertSucceeds(updateDoc(referencia, { atualizado: true }));
        if (caminho.startsWith("caixa_empresa/")) await assertFails(deleteDoc(referencia));
        else await assertSucceeds(deleteDoc(referencia));
    }
});

test("notas de serviço legadas continuam editáveis sem exclusão definitiva", async () => {
    await autorizar("funcionario-1");
    const equipe = ambiente.authenticatedContext("funcionario-1").firestore();
    const nota = doc(equipe, "notas_servico", "nota-legada");
    await assertSucceeds(setDoc(nota, { numeroNota: "NS-LEGADA", status: "rascunho" }));
    await assertSucceeds(updateDoc(nota, { status: "cancelado" }));
    await assertFails(deleteDoc(nota));
});

test("projeto operacional exige orçamento aprovado e preserva histórico", async () => {
    await autorizar("funcionario-1");
    const equipe = ambiente.authenticatedContext("funcionario-1").firestore();
    const orcamento = doc(equipe, "orcamentos_emitidos", "orcamento-1");
    const projeto = doc(equipe, "projetos", "prj_orc_orcamento-1");

    await assertSucceeds(setDoc(orcamento, { numero: "000001", status: "aprovado" }));
    await assertSucceeds(setDoc(projeto, {
        origem: "orcamento_aprovado",
        status: "aprovado",
        orcamento: { id: "orcamento-1", numero: "000001" },
        historico: [{ tipo: "operacao_aberta" }]
    }));
    await assertSucceeds(updateDoc(projeto, { status: "em_producao" }));
    await assertSucceeds(updateDoc(orcamento, { status: "cancelado" }));
    await assertSucceeds(updateDoc(projeto, { status: "cancelado" }));
    await assertFails(deleteDoc(projeto));
});

test("projeto operacional não abre para orçamento sem aprovação", async () => {
    await autorizar("funcionario-1");
    const equipe = ambiente.authenticatedContext("funcionario-1").firestore();
    await assertSucceeds(setDoc(doc(equipe, "orcamentos_emitidos", "orcamento-2"), {
        numero: "000002",
        status: "enviado"
    }));
    await assertFails(setDoc(doc(equipe, "projetos", "prj_orc_orcamento-2"), {
        origem: "orcamento_aprovado",
        status: "aprovado",
        orcamento: { id: "orcamento-2", numero: "000002" }
    }));
});

test("medição canônica exige projeto ativo e preserva o vínculo", async () => {
    await autorizar("funcionario-1");
    const equipe = ambiente.authenticatedContext("funcionario-1").firestore();
    const orcamento = doc(equipe, "orcamentos_emitidos", "orcamento-medicao");
    const projeto = doc(equipe, "projetos", "projeto-medicao");
    const medicao = doc(equipe, "medicoes", "med_projeto-medicao");

    await assertSucceeds(setDoc(orcamento, { numero: "000010", status: "aprovado" }));
    await assertSucceeds(setDoc(projeto, {
        origem: "orcamento_aprovado",
        status: "aprovado",
        orcamento: { id: "orcamento-medicao" },
        historico: [{ tipo: "operacao_aberta" }]
    }));
    await assertSucceeds(setDoc(medicao, {
        projetoId: "projeto-medicao",
        status: "rascunho",
        medidas: [{ quantidade: 1, altura: 100, largura: 80 }]
    }));
    await assertSucceeds(updateDoc(medicao, { status: "concluida" }));
    await assertFails(updateDoc(medicao, { projetoId: "outro-projeto" }));
    await assertFails(deleteDoc(medicao));

    await assertSucceeds(updateDoc(projeto, { status: "cancelado" }));
    await assertFails(updateDoc(medicao, { observacoesGerais: "Alteração posterior ao cancelamento." }));

    await assertFails(setDoc(doc(equipe, "medicoes", "med-sem-projeto"), {
        projetoId: "sem-projeto",
        status: "rascunho",
        medidas: [{ quantidade: 1, altura: 10, largura: 10 }]
    }));
});

test("ordem operacional exige medição concluída e mantém os vínculos", async () => {
    await autorizar("funcionario-1");
    const equipe = ambiente.authenticatedContext("funcionario-1").firestore();
    await assertSucceeds(setDoc(doc(equipe, "orcamentos_emitidos", "orcamento-os"), { numero: "000011", status: "aprovado" }));
    await assertSucceeds(setDoc(doc(equipe, "projetos", "projeto-os"), {
        origem: "orcamento_aprovado",
        status: "aprovado",
        orcamento: { id: "orcamento-os" },
        historico: [{ tipo: "operacao_aberta" }]
    }));
    const medicao = doc(equipe, "medicoes", "med_projeto-os");
    await assertSucceeds(setDoc(medicao, {
        projetoId: "projeto-os",
        status: "rascunho",
        medidas: [{ quantidade: 1, altura: 100, largura: 80 }]
    }));
    const ordem = doc(equipe, "notas_servico", "os_projeto-os");
    const dadosOrdem = {
        origem: "projeto_operacional",
        projetoId: "projeto-os",
        medicaoId: "med_projeto-os",
        status: "em_producao"
    };
    await assertFails(setDoc(ordem, dadosOrdem));
    await assertSucceeds(updateDoc(medicao, { status: "concluida" }));
    await assertSucceeds(setDoc(ordem, dadosOrdem));
    await assertFails(updateDoc(ordem, { status: "rascunho" }));
    await assertSucceeds(updateDoc(ordem, { status: "em_instalacao" }));
    await assertSucceeds(updateDoc(ordem, { status: "concluido" }));
    await assertFails(updateDoc(ordem, { projetoId: "outro-projeto" }));
    await assertFails(deleteDoc(ordem));
});

test("orçamento canônico pode ser atualizado sem exclusão definitiva", async () => {
    await autorizar("funcionario-1");
    const equipe = ambiente.authenticatedContext("funcionario-1").firestore();
    const orcamento = doc(equipe, "orcamentos_emitidos", "000001");

    await assertSucceeds(setDoc(orcamento, { numero: "000001", status: "emitido" }));
    await assertSucceeds(getDoc(orcamento));
    await assertSucceeds(updateDoc(orcamento, { status: "cancelado" }));
    await assertFails(deleteDoc(orcamento));
});

test("coleção legada de orçamento é somente leitura para usuário autorizado", async () => {
    await autorizar("funcionario-1");
    await gravarSemRegras("orcamentos/atual", { status: "rascunho", cliente: { nome: "Legado" } });
    const equipe = ambiente.authenticatedContext("funcionario-1").firestore();
    const legado = doc(equipe, "orcamentos", "atual");

    await assertSucceeds(getDoc(legado));
    await assertFails(setDoc(legado, { status: "emitido" }, { merge: true }));
    await assertFails(updateDoc(legado, { status: "emitido" }));
    await assertFails(deleteDoc(legado));
});

test("funcionário lê o próprio perfil sem administrar outros usuários", async () => {
    await autorizar("funcionario-1");
    const equipe = ambiente.authenticatedContext("funcionario-1").firestore();

    await assertSucceeds(getDoc(doc(equipe, "usuarios_autorizados", "funcionario-1")));
    await assertFails(getDocs(collection(equipe, "usuarios_autorizados")));
    await assertFails(setDoc(doc(equipe, "usuarios_autorizados", "funcionario-2"), {
        ativo: true,
        perfil: "funcionario",
        email: "funcionario-2@example.com",
        nome: "Outro Funcionário"
    }));
});

test("administrador gerencia perfis sem poder excluir o próprio acesso", async () => {
    await autorizar("admin-1", "admin");
    const admin = ambiente.authenticatedContext("admin-1").firestore();
    const funcionario = doc(admin, "usuarios_autorizados", "funcionario-2");

    await assertSucceeds(setDoc(funcionario, {
        ativo: true,
        perfil: "funcionario",
        email: "funcionario-2@example.com",
        nome: "Outro Funcionário"
    }));
    await assertSucceeds(getDocs(collection(admin, "usuarios_autorizados")));
    await assertSucceeds(updateDoc(funcionario, { ativo: false }));
    await assertFails(deleteDoc(funcionario));
    await assertFails(updateDoc(doc(admin, "usuarios_autorizados", "admin-1"), { ativo: false }));
    await assertFails(updateDoc(doc(admin, "usuarios_autorizados", "admin-1"), { perfil: "funcionario" }));
    await assertFails(deleteDoc(doc(admin, "usuarios_autorizados", "admin-1")));
});

test("funcionário registra somente o horário do próprio acesso", async () => {
    await autorizar("funcionario-1");
    const equipe = ambiente.authenticatedContext("funcionario-1").firestore();
    const proprio = doc(equipe, "usuarios_autorizados", "funcionario-1");
    await assertSucceeds(updateDoc(proprio, {
        ultimoAcessoEm: "2026-07-20T12:00:00.000Z",
        atualizadoEmISO: "2026-07-20T12:00:00.000Z"
    }));
    await assertFails(updateDoc(proprio, { nome: "Nome alterado sem autorização" }));
});

test("financeiro operacional vincula projeto, recebimentos e caixa sem exclusão", async () => {
    await autorizar("funcionario-1");
    const equipe = ambiente.authenticatedContext("funcionario-1").firestore();
    await assertSucceeds(setDoc(doc(equipe, "orcamentos_emitidos", "orc-fin"), { numero: "000200", status: "aprovado" }));
    await assertSucceeds(setDoc(doc(equipe, "projetos", "projeto-fin"), {
        origem: "orcamento_aprovado",
        status: "aprovado",
        orcamento: { id: "orc-fin" },
        historico: [{ tipo: "operacao_aberta" }]
    }));
    const financeiro = doc(equipe, "financeiro_operacional", "fin_projeto-fin");
    await assertSucceeds(setDoc(financeiro, {
        projetoId: "projeto-fin",
        orcamentoId: "orc-fin",
        valorContratadoCentavos: 100000,
        valorRecebidoCentavos: 0,
        saldoCentavos: 100000,
        status: "pendente",
        recebimentos: []
    }));
    await assertSucceeds(updateDoc(financeiro, {
        valorRecebidoCentavos: 25000,
        saldoCentavos: 75000,
        status: "parcial",
        recebimentos: [{ id: "rec-1", valorCentavos: 25000, data: "2026-07-20" }]
    }));
    await assertFails(updateDoc(financeiro, { projetoId: "outro-projeto" }));
    await assertFails(updateDoc(financeiro, { valorRecebidoCentavos: 20000, saldoCentavos: 80000 }));
    await assertFails(deleteDoc(financeiro));

    const movimento = doc(equipe, "caixa_empresa", "cx_rec-1");
    await assertSucceeds(setDoc(movimento, { tipo: "entrada", projeto_id: "projeto-fin", recebimento_id: "rec-1" }));
    await assertFails(deleteDoc(movimento));
});

test("financeiro não aceita projeto inexistente nem totais inconsistentes", async () => {
    await autorizar("funcionario-1");
    const equipe = ambiente.authenticatedContext("funcionario-1").firestore();
    await assertFails(setDoc(doc(equipe, "financeiro_operacional", "fin-sem-projeto"), {
        projetoId: "sem-projeto",
        orcamentoId: "orc-inexistente",
        valorContratadoCentavos: 10000,
        valorRecebidoCentavos: 2000,
        saldoCentavos: 9000,
        status: "parcial",
        recebimentos: []
    }));
});

test("coleção não mapeada permanece bloqueada até para usuário autorizado", async () => {
    await autorizar("funcionario-1");
    const equipe = ambiente.authenticatedContext("funcionario-1").firestore();
    await assertFails(setDoc(doc(equipe, "colecao_nao_mapeada", "registro-1"), { teste: true }));
});
