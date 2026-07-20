const test = require("node:test");
const assert = require("node:assert/strict");
const { RKAuth } = require("../js/shared/rk-auth.js");

function criarStorage(valores = {}) {
    const dados = new Map(Object.entries(valores));
    return {
        getItem: chave => dados.has(chave) ? dados.get(chave) : null,
        setItem: (chave, valor) => dados.set(chave, String(valor)),
        removeItem: chave => dados.delete(chave)
    };
}

test("Autenticação remove credenciais e sessões locais antigas", () => {
    global.localStorage = criarStorage({
        vidracaria_sessao_funcionario: JSON.stringify({ logado: true }),
        usuarioLogado: JSON.stringify({ logado: true }),
        vidracaria_configuracoes_sistema: JSON.stringify({
            usuario: "admin",
            senha: "1234",
            nomeUsuario: "Caio",
            nomeEmpresa: "RK Vidraçaria"
        })
    });
    global.sessionStorage = criarStorage({
        vidracaria_sessao_funcionario: JSON.stringify({ logado: true }),
        usuarioLogado: JSON.stringify({ logado: true })
    });

    RKAuth.limparDadosLegados();

    assert.equal(global.localStorage.getItem("vidracaria_sessao_funcionario"), null);
    assert.equal(global.localStorage.getItem("usuarioLogado"), null);
    assert.equal(global.sessionStorage.getItem("vidracaria_sessao_funcionario"), null);
    assert.equal(global.sessionStorage.getItem("usuarioLogado"), null);

    const configuracoes = JSON.parse(global.localStorage.getItem("vidracaria_configuracoes_sistema"));
    assert.equal(configuracoes.usuario, undefined);
    assert.equal(configuracoes.senha, undefined);
    assert.equal(configuracoes.nomeUsuario, "Caio");
    assert.equal(configuracoes.nomeEmpresa, "RK Vidraçaria");

    delete global.localStorage;
    delete global.sessionStorage;
});

test("Sessão interna é derivada do usuário autenticado pelo Firebase", () => {
    global.localStorage = criarStorage({
        vidracaria_configuracoes_sistema: JSON.stringify({ nomeUsuario: "Caio RK" })
    });
    RKAuth.usuarioAtual = {
        uid: "uid-admin-rk",
        email: "admin@rkvidracaria.com.br",
        displayName: "",
        photoURL: "",
        metadata: { lastSignInTime: "2026-07-20T12:00:00.000Z" }
    };
    RKAuth.resolvido = true;

    const sessao = RKAuth.obterSessao();

    assert.equal(sessao.logado, true);
    assert.equal(sessao.uid, "uid-admin-rk");
    assert.equal(sessao.email, "admin@rkvidracaria.com.br");
    assert.equal(sessao.usuario, "admin@rkvidracaria.com.br");
    assert.equal(sessao.nomeUsuario, "Caio RK");
    assert.equal(RKAuth.estaAutenticado(), true);

    RKAuth.usuarioAtual = null;
    RKAuth.resolvido = false;
    delete global.localStorage;
});

test("Telas comerciais sensíveis permanecem classificadas como protegidas", () => {
    [
        "dashboard-comercial.html",
        "clientes.html",
        "orcamento-inteligente.html",
        "arquivos.html",
        "compartilhar-documento.html",
        "medicao-obra.html",
        "nota-servico.html",
        "caixa.html",
        "loading.html",
        "produtos.html"
    ].forEach(pagina => assert.equal(RKAuth.paginaProtegida(pagina), true, pagina));
});
