const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const raiz = resolve(__dirname, "..");
const paginas = [
    "404.html",
    "index.html",
    "paginas/acessos.html",
    "paginas/arquivos.html",
    "paginas/caixa.html",
    "paginas/clientes.html",
    "paginas/compartilhar-documento.html",
    "paginas/contato.html",
    "paginas/dashboard-comercial.html",
    "paginas/funcionario.html",
    "paginas/galeria.html",
    "paginas/loading.html",
    "paginas/login.html",
    "paginas/medicao-obra.html",
    "paginas/nota-servico.html",
    "paginas/novo-orcamento.html",
    "paginas/orcamento-inteligente.html",
    "paginas/orcamento.html",
    "paginas/produtos-publico.html",
    "paginas/produtos.html",
    "paginas/projetos.html",
    "paginas/servicos-publico.html",
    "paginas/valores.html"
];

test("todas as páginas carregam a proteção visual antes dos estilos", () => {
    paginas.forEach(caminho => {
        const html = readFileSync(resolve(raiz, caminho), "utf8");
        const carregamento = html.indexOf('/js/shared/rk-loading-screen.js?v=1.0.3');
        const primeiroEstilo = html.indexOf('<link rel="stylesheet"');
        assert.ok(carregamento >= 0, caminho);
        assert.ok(primeiroEstilo < 0 || carregamento < primeiroEstilo, caminho);
    });
});

test("tela padrão informa progresso e permanece disponível no aparelho", () => {
    const fonte = readFileSync(resolve(raiz, "js/shared/rk-loading-screen.js"), "utf8");
    assert.doesNotMatch(fonte, /localStorage|sessionStorage|storageKey/);
    assert.match(fonte, /role=\"progressbar\"/);
    assert.match(fonte, /\/imagens\/logo\.jpeg/);
    assert.match(fonte, /\/assets\/conecte-logo\.png/);
    assert.match(fonte, /addEventListener\(\"offline\"/);
    assert.match(fonte, /start:\s*mostrar/);
    assert.match(fonte, /finish:\s*ocultar/);
    assert.match(fonte, /run:\s*executar/);
    assert.match(fonte, /registrarFalhaDeRecurso/);
    assert.match(fonte, /recursosEssenciaisComFalha/);
    assert.match(fonte, /TEMPO_ESTABILIZACAO_INICIAL/);
    assert.match(fonte, /TEMPO_LIMITE_INICIAL\s*=\s*25000/);
    assert.match(fonte, /iniciarLimiteInicial/);
    assert.match(fonte, /rk-loading-falha/);
    assert.match(fonte, /initial:\s*executar/);
    assert.match(fonte, /isBooting/);
});

test("service worker armazena a tela e antecipa páginas em conexão lenta", () => {
    const fonte = readFileSync(resolve(raiz, "sw.js"), "utf8");
    assert.match(fonte, /rk-conecte-v0\.9\.1-loading-v5/);
    assert.match(fonte, /\/js\/shared\/rk-loading-screen\.js/);
    assert.match(fonte, /\/paginas\/dashboard-comercial\.html/);
    assert.match(fonte, /Promise\.allSettled/);
    assert.match(fonte, /request\.mode === 'navigate'/);
    assert.match(fonte, /redeSegura[\s\S]*catch\(\(\) => cached\)/);
    assert.match(fonte, /setTimeout\(\(\) => resolve\(cached\), 550\)/);
});

test("consultas centrais mantêm a tela ativa até os dados terminarem", () => {
    const dashboard = readFileSync(resolve(raiz, "js/dashboard-comercial/dashboard-comercial-controller.js"), "utf8");
    const acessos = readFileSync(resolve(raiz, "js/acessos/acesso-controller.js"), "utf8");
    const entrada = readFileSync(resolve(raiz, "paginas/loading.html"), "utf8");
    const arquivos = readFileSync(resolve(raiz, "js/documentos/document-archive-controller.js"), "utf8");
    const navegacao = readFileSync(resolve(raiz, "js/shared/rk-navigation.js"), "utf8");
    const firestore = readFileSync(resolve(raiz, "js/shared/rk-firestore-store.js"), "utf8");
    const servicos = readFileSync(resolve(raiz, "js/servicos/servico-controller.js"), "utf8");
    const orcamentoPublico = readFileSync(resolve(raiz, "js/orcamento-cliente.js"), "utf8");
    assert.match(dashboard, /RKLoading\?\.start\("Reunindo orçamentos, obras e movimentações/);
    assert.match(dashboard, /RKLoading\?\.finish\(token\)/);
    assert.match(acessos, /RKLoading\?\.start\("Carregando os acessos da equipe/);
    assert.match(entrada, /RKLoading\?\.start\("Validando seu acesso/);
    assert.match(arquivos, /RKLoading\?\.start\("Carregando os arquivos e dados do Firestore/);
    assert.match(arquivos, /RKLoading\?\.finish\(tokenCarregamento\)/);
    assert.match(navegacao, /RKLoading\?\.start\("Preparando o menu e seu acesso/);
    assert.match(firestore, /RKLoading\?\.isBooting/);
    assert.match(firestore, /RKLoading\?\.finish\(tokenCarregamento\)/);
    assert.match(servicos, /RKLoading\.initial\(\(\) => ServicoController\.iniciar\(\)/);
    assert.match(orcamentoPublico, /RKLoading\.initial\(\(\) => OrcamentoCliente\.iniciar\(\)/);
    assert.doesNotMatch(entrada, /v0\.4\.2/);
});
