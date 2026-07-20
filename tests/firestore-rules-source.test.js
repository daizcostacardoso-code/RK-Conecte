const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const regras = readFileSync(join(__dirname, "..", "firestore.rules"), "utf8");

test("Regras do Firestore não mantêm permissões globais abertas", () => {
    assert.doesNotMatch(regras, /allow\s+read\s*,\s*write\s*:\s*if\s+true/);
    assert.match(regras, /match\s+\/\{documento=\*\*\}/);
    assert.match(regras, /allow\s+read\s*,\s*write\s*:\s*if\s+false/);
});

test("Somente valores e criação validada de solicitação possuem acesso público", () => {
    assert.match(regras, /match\s+\/configuracoes\/valores\s*\{[\s\S]*?allow\s+read\s*:\s*if\s+true/);
    assert.match(regras, /match\s+\/solicitacoes_site\/\{documento\}/);
    assert.match(regras, /allow\s+create\s*:\s*if\s+autorizado\(\)\s*\|\|\s*solicitacaoPublicaValida\(\)/);
    assert.match(regras, /allow\s+read\s*,\s*update\s*,\s*delete\s*:\s*if\s+autorizado\(\)/);
});

test("Acesso interno exige perfil ativo vinculado ao UID autenticado", () => {
    assert.match(regras, /match\s+\/usuarios_autorizados\/\{uid\}/);
    assert.match(regras, /usuarios_autorizados\/\$\(request\.auth\.uid\)/);
    assert.match(regras, /\.data\.ativo\s*==\s*true/);
    assert.match(regras, /\.data\.perfil\s+in\s+\['admin',\s*'funcionario'\]/);
    assert.doesNotMatch(regras, /allow\s+read\s*,\s*write\s*:\s*if\s+request\.auth\s*!=\s*null/);
});

test("financeiro e acessos preservam vínculos e bloqueiam exclusão definitiva", () => {
    assert.match(regras, /match\s+\/financeiro_operacional\/\{documento\}/);
    assert.match(regras, /existsAfter\(\/databases\/\$\(database\)\/documents\/projetos/);
    assert.match(regras, /match\s+\/caixa_empresa\/\{documento\}[\s\S]*?allow\s+delete\s*:\s*if\s+false/);
    assert.match(regras, /match\s+\/usuarios_autorizados\/\{uid\}[\s\S]*?allow\s+delete\s*:\s*if\s+false/);
    assert.match(regras, /administradorPreservaProprioAcesso/);
});
