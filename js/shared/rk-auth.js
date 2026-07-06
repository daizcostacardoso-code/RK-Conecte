const RKAuth = {
    chaveSessao: "vidracaria_sessao_funcionario",
    chaveCompatibilidade: "usuarioLogado",
    modoAtual: "protected",
    paginasProtegidas: [
        "dashboard-comercial.html",
        "clientes.html",
        "projetos.html",
        "orcamento-inteligente.html",
        "compartilhar-documento.html",
        "aprovacao-comercial.html",
        "converter-projeto.html",
        "producao.html",
        "funcionario.html",
        "novo-orcamento.html",
        "valores.html",
        "produtos.html",
        "servicos.html"
    ],

    obterSessao() {
        const sessao = this.lerJSON(localStorage.getItem(this.chaveSessao));

        if (sessao && sessao.logado) {
            return sessao;
        }

        const usuarioCompatibilidade = this.lerJSON(localStorage.getItem(this.chaveCompatibilidade));
        if (usuarioCompatibilidade && usuarioCompatibilidade.logado) {
            return usuarioCompatibilidade;
        }

        return null;
    },

    estaAutenticado() {
        return Boolean(this.obterSessao());
    },

    salvarSessao(dados = {}) {
        const sessao = {
            logado: true,
            usuario: dados.usuario || "admin",
            nomeUsuario: dados.nomeUsuario || dados.usuario || "Funcionario RK",
            fotoUsuario: dados.fotoUsuario || "",
            entradaEm: dados.entradaEm || new Date().toISOString()
        };

        localStorage.setItem(this.chaveSessao, JSON.stringify(sessao));
        localStorage.setItem(this.chaveCompatibilidade, JSON.stringify(sessao));
        return sessao;
    },

    limparSessao() {
        localStorage.removeItem(this.chaveSessao);
        localStorage.removeItem(this.chaveCompatibilidade);
        sessionStorage.removeItem(this.chaveSessao);
        sessionStorage.removeItem(this.chaveCompatibilidade);
    },

    verificarAutenticacao(opcoes = {}) {
        const modo = opcoes.modo || this.obterModoAtual();
        const sessao = this.obterSessao();
        this.modoAtual = modo;

        if (modo === "login" || modo === "home" || modo === "public") {
            return sessao;
        }

        if (!this.paginaAtualProtegida()) {
            return sessao;
        }

        if (!sessao) {
            this.redirecionarLogin();
            return null;
        }

        return sessao;
    },

    sair(event) {
        if (event && typeof event.preventDefault === "function") {
            event.preventDefault();
        }

        this.limparSessao();
        this.redirecionarLogin();
    },

    redirecionarLogin() {
        const destino = this.criarHref("login.html");
        this.redirecionar(destino);
    },

    redirecionarDashboard() {
        const destino = this.criarHref("dashboard-comercial.html");
        this.redirecionar(destino);
    },

    redirecionar(destino) {
        if (!destino || this.mesmaPagina(destino)) {
            return;
        }

        window.location.replace(destino);
    },

    criarHref(pagina) {
        return this.estaEmPaginas() ? pagina : `paginas/${pagina}`;
    },

    estaEmPaginas() {
        return /\/paginas\//.test(window.location.pathname.replace(/\\/g, "/"));
    },

    mesmaPagina(destino) {
        const link = document.createElement("a");
        link.href = destino;
        return link.href === window.location.href;
    },

    obterModoAtual() {
        const script = document.currentScript;
        return script?.dataset?.rkAuth || "protected";
    },

    obterPaginaAtual() {
        return window.location.pathname
            .replace(/\\/g, "/")
            .split("/")
            .pop() || "index.html";
    },

    paginaAtualProtegida() {
        return this.paginasProtegidas.includes(this.obterPaginaAtual());
    },

    paginaProtegida(pagina) {
        const nomePagina = String(pagina || "")
            .split("?")[0]
            .split("#")[0]
            .replace(/\\/g, "/")
            .split("/")
            .pop();
        return this.paginasProtegidas.includes(nomePagina);
    },

    lerJSON(valor) {
        try {
            return JSON.parse(valor || "null");
        } catch (erro) {
            return null;
        }
    }
};

window.RKAuth = RKAuth;
window.verificarAutenticacao = () => RKAuth.verificarAutenticacao();
window.mostrarTelaLogin = () => RKAuth.redirecionarLogin();
window.esconderTelaLogin = () => {};
window.mostrarAreaInterna = () => {};
window.esconderAreaInterna = () => {};

RKAuth.verificarAutenticacao();
