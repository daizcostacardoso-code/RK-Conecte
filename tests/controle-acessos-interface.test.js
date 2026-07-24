const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const raiz = resolve(__dirname, "..");

test("tela administrativa controla criação, perfil, situação e recuperação", () => {
    const html = readFileSync(resolve(raiz, "paginas/acessos.html"), "utf8");
    const repositorio = readFileSync(resolve(raiz, "js/acessos/acesso-repository.js"), "utf8");
    assert.match(html, /Controle de acessos/);
    assert.match(html, /Senha temporária/);
    assert.match(html, /Funcionário/);
    assert.match(html, /Administrador/);
    assert.match(repositorio, /obterAdministradorAtual/);
    assert.match(repositorio, /sendPasswordResetEmail/);
    assert.match(repositorio, /appSecundario/);
});

test("controle de acessos aparece somente no cabeçalho do administrador", () => {
    const interfaceDashboard = readFileSync(resolve(raiz, "js/dashboard-comercial/dashboard-comercial-ui.js"), "utf8");
    const controller = readFileSync(resolve(raiz, "js/dashboard-comercial/dashboard-comercial-controller.js"), "utf8");
    const navegacao = readFileSync(resolve(raiz, "js/shared/rk-navigation.js"), "utf8");
    assert.doesNotMatch(interfaceDashboard, /acessos\.html|Controle de acessos/);
    assert.match(navegacao, /sessao\?\.perfil === "admin"/);
    assert.match(navegacao, /rotulo: "Acessos", pagina: "acessos\.html"/);
    assert.match(controller, /this\.sessao = await this\.aguardarSessao\(\)/);
    assert.match(interfaceDashboard, /dashboard-comercial-shortcuts/);
});

test("controle de acessos transforma a tabela em cartões no celular", () => {
    const estilos = readFileSync(resolve(raiz, "css/acessos.css"), "utf8");
    const controller = readFileSync(resolve(raiz, "js/acessos/acesso-controller.js"), "utf8");
    assert.match(estilos, /@media\s*\(max-width:\s*720px\)/);
    assert.match(estilos, /\.acesso-tabela thead\s*\{\s*display:\s*none/);
    assert.match(estilos, /content:\s*attr\(data-label\)/);
    assert.match(estilos, /\.acesso-page \[hidden\]\s*\{\s*display:\s*none !important/);
    assert.match(controller, /data-label="Usuário"/);
    assert.match(controller, /data-label="Ações"/);
});

test("dashboard usa metatag atual e configuração sem persistência obsoleta", () => {
    const html = readFileSync(resolve(raiz, "paginas/dashboard-comercial.html"), "utf8");
    const configuracao = readFileSync(resolve(raiz, "js/firebase-config.js"), "utf8");
    assert.match(html, /name="mobile-web-app-capable" content="yes"/);
    assert.doesNotMatch(configuracao, /enable(?:MultiTabIndexedDb)?Persistence|enablePersistence/);
});

test("textos visíveis não expõem nomes da infraestrutura interna", () => {
    const paginas = ["login.html", "funcionario.html", "projetos.html", "medicao-obra.html", "nota-servico.html", "caixa.html", "acessos.html"];
    paginas.forEach(nome => {
        const html = readFileSync(resolve(raiz, "paginas", nome), "utf8")
            .replace(/<script\b[\s\S]*?<\/script>/gi, "")
            .replace(/<[^>]+>/g, " ");
        assert.doesNotMatch(html, /firebase|firestore|authentication|api\s*key|\buid\b/i, nome);
    });
});
