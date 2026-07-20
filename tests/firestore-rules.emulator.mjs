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
        "orcamentos/atual",
        "orcamentos_emitidos/000001",
        "solicitacoes_site/solicitacao-1",
        "projetos/projeto-1",
        "caixa_empresa/lancamento-1",
        "clientes/cliente-1",
        "produtos/produto-1",
        "itens/item-1",
        "item_dependencias/dependencia-1",
        "tamanhos_padrao/tamanho-1",
        "unidades_medida/unidade-1",
        "categorias_produto/categoria-1",
        "categorias_item/categoria-1",
        "notas_servico/nota-1"
    ];

    for (const caminho of caminhos) {
        const referencia = doc(equipe, caminho);
        await assertSucceeds(setDoc(referencia, { teste: true }));
        await assertSucceeds(getDoc(referencia));
        await assertSucceeds(updateDoc(referencia, { atualizado: true }));
        await assertSucceeds(deleteDoc(referencia));
    }
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
    await assertSucceeds(deleteDoc(funcionario));
    await assertFails(deleteDoc(doc(admin, "usuarios_autorizados", "admin-1")));
});

test("coleção não mapeada permanece bloqueada até para usuário autorizado", async () => {
    await autorizar("funcionario-1");
    const equipe = ambiente.authenticatedContext("funcionario-1").firestore();
    await assertFails(setDoc(doc(equipe, "colecao_nao_mapeada", "registro-1"), { teste: true }));
});
