const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const vm = require("node:vm");

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

test("carregador inicializa antes do body sem interromper a proteção visual", () => {
    const fonte = readFileSync(resolve(raiz, "js/shared/rk-loading-screen.js"), "utf8");
    const classes = new Set();
    const ouvintes = {};
    const documento = {
        body: null,
        head: { appendChild() {} },
        documentElement: {
            appendChild() {},
            classList: {
                add: (...nomes) => nomes.forEach(nome => classes.add(nome)),
                remove: (...nomes) => nomes.forEach(nome => classes.delete(nome))
            }
        },
        fonts: null,
        getElementById: () => null,
        createElement: () => ({ id: "", textContent: "" }),
        addEventListener: (tipo, callback) => { ouvintes[tipo] = callback; }
    };
    const janela = {
        document: documento,
        navigator: { onLine: true },
        location: { reload() {} },
        addEventListener: (tipo, callback) => { ouvintes[tipo] = callback; },
        setTimeout: () => 1,
        clearTimeout() {},
        setInterval: () => 1,
        clearInterval() {},
        requestAnimationFrame: callback => callback()
    };

    assert.doesNotThrow(() => vm.runInNewContext(fonte, { window: janela, globalThis: janela, console, Date, Math, Set, Promise }));
    assert.equal(typeof janela.RKLoading?.start, "function");
    assert.equal(typeof janela.RKLoading?.finish, "function");
    assert.ok(classes.has("rk-loading-active"));
});

test("todas as páginas carregam a proteção visual antes dos estilos", () => {
    paginas.forEach(caminho => {
        const html = readFileSync(resolve(raiz, caminho), "utf8");
        const carregamento = html.indexOf('/js/shared/rk-loading-screen.js?v=1.0.5');
        const primeiroEstilo = html.indexOf('<link rel="stylesheet"');
        assert.ok(carregamento >= 0, caminho);
        assert.ok(primeiroEstilo < 0 || carregamento < primeiroEstilo, caminho);
    });
});

test("tela padrão informa progresso e permanece disponível no aparelho", () => {
    const fonte = readFileSync(resolve(raiz, "js/shared/rk-loading-screen.js"), "utf8");
    assert.doesNotMatch(fonte, /localStorage|sessionStorage|storageKey/);
    assert.match(fonte, /role=\"progressbar\"/);
    assert.match(fonte, /\/imagens\/icons\/rk-splash-mark-256\.png/);
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
    assert.doesNotMatch(fonte, /SUPRIMIR_CARGA_INICIAL/);
    assert.match(fonte, /temporizadorTransicao/);
    assert.match(fonte, /body > \*/);
    assert.match(fonte, /body > #rkLoadingScreen/);
    assert.match(fonte, /cargaInicialEmAndamento[\s\S]*MENSAGEM_INICIAL/);
    const esconderTela = fonte.indexOf("tela.hidden = true");
    const liberarConteudo = fonte.indexOf('classList.remove("rk-loading-active")');
    assert.ok(esconderTela >= 0 && liberarConteudo > esconderTela, "o conteúdo só pode aparecer após o overlay ser ocultado");
});



test("entrada do PWA possui primeira pintura estática compatível com a tela padrão", () => {
    const entrada = readFileSync(resolve(raiz, "paginas/loading.html"), "utf8");
    assert.match(entrada, /id="rkPwaBootStyles"/);
    assert.match(entrada, /id="rkPwaBootScreen"/);
    assert.match(entrada, /Preparando tudo para você/);
    assert.match(entrada, /Validando seu acesso e preparando o dashboard/);
    assert.match(entrada, /linear-gradient\(145deg, #041522/);
    assert.match(entrada, /html:not\(\.rk-loading-active\) #rkPwaBootScreen/);
    assert.match(entrada, /window\.addEventListener\("DOMContentLoaded"/);
});

test("service worker armazena a tela e antecipa páginas em conexão lenta", () => {
    const fonte = readFileSync(resolve(raiz, "sw.js"), "utf8");
    assert.match(fonte, /rk-conecte-v0\.9\.1-splash-seamless-v9/);
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
