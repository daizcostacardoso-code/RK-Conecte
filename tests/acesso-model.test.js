const test = require("node:test");
const assert = require("node:assert/strict");
const { AcessoModel } = require("../js/acessos/acesso-model.js");

test("controle de acessos cria perfil auditável sem persistir senha", () => {
    const admin = { uid: "admin-1", nomeUsuario: "Admin RK", email: "admin@example.com" };
    const resultado = AcessoModel.criar({
        nome: "Funcionário Teste",
        email: "funcionario@example.com",
        perfil: "funcionario",
        senhaTemporaria: "Senha@Temporaria1"
    }, "func-1", admin);
    assert.deepEqual(resultado.erros, []);
    assert.equal(resultado.perfil.ativo, true);
    assert.equal(resultado.perfil.historicoAcesso[0].tipo, "acesso_criado");
    assert.equal(Object.hasOwn(AcessoModel.paraPersistencia(resultado.perfil), "senhaTemporaria"), false);
});

test("administrador não remove o próprio perfil nem desativa o próprio acesso", () => {
    const admin = { uid: "admin-1", nomeUsuario: "Admin RK" };
    const atual = AcessoModel.criar({ nome: "Admin RK", email: "admin@example.com", perfil: "admin" }, "admin-1", admin).perfil;
    const inativo = AcessoModel.atualizar(atual, { ativo: false }, admin);
    const rebaixado = AcessoModel.atualizar(atual, { perfil: "funcionario" }, admin);
    assert.equal(inativo.sucesso, false);
    assert.equal(rebaixado.sucesso, false);
});

test("senha temporária gerada atende ao tamanho mínimo e combina caracteres", () => {
    const senha = AcessoModel.gerarSenhaTemporaria();
    assert.ok(senha.length >= 14);
    assert.match(senha, /[A-Z]/);
    assert.match(senha, /[a-z]/);
    assert.match(senha, /[0-9]/);
    assert.match(senha, /[!@#$%]/);
});
