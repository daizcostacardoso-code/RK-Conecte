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

test("textos visíveis não expõem nomes da infraestrutura interna", () => {
    const paginas = ["login.html", "funcionario.html", "projetos.html", "medicao-obra.html", "nota-servico.html", "caixa.html", "acessos.html"];
    paginas.forEach(nome => {
        const html = readFileSync(resolve(raiz, "paginas", nome), "utf8")
            .replace(/<script\b[\s\S]*?<\/script>/gi, "")
            .replace(/<[^>]+>/g, " ");
        assert.doesNotMatch(html, /firebase|firestore|authentication|api\s*key|\buid\b/i, nome);
    });
});
