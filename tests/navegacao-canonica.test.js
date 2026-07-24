const test = require("node:test");
const assert = require("node:assert/strict");
const { existsSync, readFileSync, readdirSync } = require("node:fs");
const { dirname, resolve } = require("node:path");

const raiz = resolve(__dirname, "..");
const ler = caminho => readFileSync(resolve(raiz, caminho), "utf8");
const rotasLegadas = ["funcionario.html", "novo-orcamento.html", "valores.html"];

test("fluxos legados foram removidos e possuem redirecionamentos canônicos", () => {
    for (const pagina of rotasLegadas) {
        assert.equal(existsSync(resolve(raiz, "paginas", pagina)), false, pagina);
    }

    for (const script of ["funcionario.js", "valores.js", "app-orcamento.js", "formulario.js", "itens.js", "tabela.js", "orcamento.js", "eventos.js", "pdf.js"]) {
        assert.equal(existsSync(resolve(raiz, "js", script)), false, script);
    }

    const firebase = JSON.parse(ler("firebase.json"));
    const redirects = new Map(firebase.hosting.redirects.map(item => [item.source, item.destination]));
    assert.equal(redirects.get("/paginas/funcionario.html"), "/paginas/dashboard-comercial.html");
    assert.equal(redirects.get("/paginas/novo-orcamento.html"), "/paginas/orcamento-inteligente.html");
    assert.equal(redirects.get("/paginas/valores.html"), "/paginas/produtos.html");
});

test("navegação compartilhada não expõe rotas antigas", () => {
    const navegacao = ler("js/shared/rk-navigation.js");
    const autenticacao = ler("js/shared/rk-auth.js");
    const serviceWorker = ler("sw.js");

    for (const rota of rotasLegadas) {
        assert.doesNotMatch(navegacao, new RegExp(rota.replace(".", "\\.")), rota);
        assert.doesNotMatch(autenticacao, new RegExp(rota.replace(".", "\\.")), rota);
        assert.doesNotMatch(serviceWorker, new RegExp(rota.replace(".", "\\.")), rota);
    }
});

test("telas internas atuais usam o cabeçalho canônico compartilhado", () => {
    const paginas = [
        "acessos.html",
        "arquivos.html",
        "caixa.html",
        "clientes.html",
        "compartilhar-documento.html",
        "dashboard-comercial.html",
        "medicao-obra.html",
        "nota-servico.html",
        "orcamento-inteligente.html",
        "produtos.html",
        "projetos.html"
    ];

    for (const pagina of paginas) {
        const html = ler(`paginas/${pagina}`);
        assert.equal((html.match(/data-rk-internal-header/g) || []).length, 1, pagina);
        assert.doesNotMatch(html, /<header[^>]*>[\s\S]*?<nav>/, pagina);
    }

    const navegacao = ler("js/shared/rk-navigation.js");
    const estilos = ler("css/style.css");
    assert.match(navegacao, /renderizarCabecalhoInterno/);
    assert.match(navegacao, /rk-internal-header__brand/);
    assert.match(navegacao, /rk-internal-header__crossover/);
    assert.match(estilos, /Cabeçalho interno canônico/);
    assert.match(estilos, /rk-header-settings__trigger/);
    assert.doesNotMatch(navegacao, /rk-header-profile__logout/);
});

test("páginas HTML não apontam para arquivos locais inexistentes", () => {
    const arquivos = [
        resolve(raiz, "index.html"),
        resolve(raiz, "404.html"),
        ...readdirSync(resolve(raiz, "paginas"))
            .filter(nome => nome.endsWith(".html"))
            .map(nome => resolve(raiz, "paginas", nome))
    ];

    for (const arquivo of arquivos) {
        const html = readFileSync(arquivo, "utf8");
        const referencias = [...html.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)].map(resultado => resultado[1]);
        for (const referenciaOriginal of referencias) {
            const referencia = referenciaOriginal.split("?")[0].split("#")[0];
            if (!referencia || /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(referencia)) continue;
            const destino = referencia.startsWith("/")
                ? resolve(raiz, referencia.replace(/^\/+/, ""))
                : resolve(dirname(arquivo), referencia);
            assert.equal(existsSync(destino), true, `${arquivo}: ${referenciaOriginal}`);
        }
    }
});

test("shell oferece configuracoes no cabecalho e opcoes opacas no menu expandido", () => {
    const navegacao = ler("js/shared/rk-navigation.js");
    const estilos = ler("css/style.css");

    assert.match(navegacao, /rk-header-settings__trigger/);
    assert.match(navegacao, /rk-header-notifications__trigger/);
    assert.match(navegacao, /renderizarAlertaSistema\("conexao"/);
    assert.match(navegacao, /renderizarAlertaSistema\("atualizacao"/);
    assert.match(navegacao, /renderizarAlertaSistema\("visual"/);
    assert.match(navegacao, /data-rk-notifications-read/);
    assert.match(navegacao, /data-rk-density="normal"/);
    assert.match(navegacao, /data-rk-density="compact"/);
    assert.match(navegacao, /data-rk-settings-logout/);
    assert.match(navegacao, /rk:interface-density-changed/);
    assert.match(estilos, /\.rk-header-settings__panel\[hidden\]/);
    assert.match(estilos, /body\.rk-app-interna\.rk-header-panel-aberto > header\.rk-internal-header/);
    assert.match(estilos, /background: linear-gradient\(180deg, #fffdf4 0%, #fff5cf 100%\)/);
    assert.match(estilos, /background: linear-gradient\(180deg, #f6faff 0%, #eaf3fb 100%\)/);
    assert.match(navegacao, /classList\.toggle\("rk-header-panel-aberto", existePainelAberto\)/);
    assert.match(estilos, /\.rk-header-action-button\s*\{[\s\S]*?background:\s*transparent !important;/);
    assert.match(estilos, /\.rk-header-notifications__panel\[hidden\]/);
    assert.match(estilos, /\.rk-adaptive-mobile-navigation\[data-state="expanded"\] \.rk-adaptive-mobile-navigation__group a\s*\{[\s\S]*?background:\s*#fff !important;/);
    assert.match(estilos, /\.rk-adaptive-mobile-navigation\[data-state="expanded"\] \.rk-adaptive-mobile-navigation__group a\s*\{[\s\S]*?opacity:\s*1 !important;/);
});

test("sino e engrenagem fazem parte do shell anterior à autenticação", () => {
    const navegacao = ler("js/shared/rk-navigation.js");
    const inicioShell = navegacao.indexOf("prepararShellInicial()");
    const fimShell = navegacao.indexOf('window.dispatchEvent(new CustomEvent("rk:shell-ready")', inicioShell);
    const acoes = navegacao.indexOf("this.renderizarPerfilHeader();", inicioShell);

    assert.ok(acoes > inicioShell && acoes < fimShell);
    assert.match(navegacao, /Conta em validação/);
    assert.match(navegacao, /Validando acesso\.\.\./);
    assert.doesNotMatch(navegacao, /querySelectorAll\("\.rk-header-profile, \.rk-header-actions/);
});

test("ações do header são atualizadas sem recriar botões e ícones", () => {
    const navegacao = ler("js/shared/rk-navigation.js");
    assert.match(navegacao, /if \(acoes\.isConnected\) \{\s*this\.atualizarAcoesHeaderAutenticado\(acoes, sessao\)/);
    assert.match(navegacao, /data-rk-settings-user-name/);
    assert.match(navegacao, /data-rk-settings-user-profile/);
    assert.match(navegacao, /data-rk-settings-admin-link/);
    assert.match(navegacao, /sair\.disabled = !autenticado/);
});

test("decoração desktop permanece contida ao abrir painéis do header", () => {
    const estilos = ler("css/style.css");
    assert.match(estilos, /body\.rk-app-interna > header\.rk-internal-header::after\s*\{[\s\S]*?height:\s*auto;[\s\S]*?transform:\s*none;/);
    assert.doesNotMatch(estilos, /rk-header-panel-aberto > header\.rk-internal-header::after/);
});
