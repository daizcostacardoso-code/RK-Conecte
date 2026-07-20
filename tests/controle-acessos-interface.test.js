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

test("dashboard principal exibe o controle de acessos somente para administrador", () => {
    const interfaceDashboard = readFileSync(resolve(raiz, "js/dashboard-comercial/dashboard-comercial-ui.js"), "utf8");
    const controller = readFileSync(resolve(raiz, "js/dashboard-comercial/dashboard-comercial-controller.js"), "utf8");
    const estilos = readFileSync(resolve(raiz, "css/dashboard-comercial.css"), "utf8");
    assert.match(interfaceDashboard, /renderizarAtalhos\(estado\.sessao/);
    assert.match(interfaceDashboard, /sessao\?\.perfil === "admin"/);
    assert.match(interfaceDashboard, /href: "acessos\.html"/);
    assert.match(interfaceDashboard, /Controle de acessos/);
    assert.match(controller, /this\.sessao = await this\.aguardarSessao\(\)/);
    assert.match(estilos, /shortcuts\.has-admin-access[\s\S]*repeat\(3/);
    assert.doesNotMatch(estilos, /grid-template-columns:\s*repeat\(auto-fit/);
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
