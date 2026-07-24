const RKAuth = {
    chaveSessao: "vidracaria_sessao_funcionario",
    chaveCompatibilidade: "usuarioLogado",
    chaveConfig: "vidracaria_configuracoes_sistema",
    eventoEstado: "rk:auth-state-changed",
    eventoErro: "rk:auth-error",
    modoAtual: "protected",
    usuarioAtual: null,
    perfilAtual: null,
    resolvido: false,
    erroInicializacao: null,
    _promessaAutenticacao: null,
    _resolverAutenticacao: null,
    _cancelarObservacao: null,
    _timerInicializacao: null,
    _promessaPerfil: null,
    _uidPerfil: "",
    paginasProtegidas: [
        "dashboard-comercial.html",
        "clientes.html",
        "orcamento-inteligente.html",
        "arquivos.html",
        "compartilhar-documento.html",
        "medicao-obra.html",
        "nota-servico.html",
        "caixa.html",
        "loading.html",
        "projetos.html",
        "produtos.html",
        "acessos.html"
    ],

    inicializar(opcoes = {}) {
        this.modoAtual = opcoes.modo || this.obterModoAtual();
        this.prepararEstiloInterno();
        this.limparDadosLegados();
        this.garantirPromessa();

        const autenticacao = this.obterInstanciaFirebase();
        if (!autenticacao) {
            if (["home", "public"].includes(this.modoAtual)) {
                this.processarEstado(null, { redirecionar: false });
            } else {
                this.falharAutenticacao(new Error("Serviço de acesso indisponível."));
            }
            return this._promessaAutenticacao;
        }

        if (typeof window !== "undefined") {
            this._timerInicializacao = window.setTimeout(() => {
                if (!this.resolvido) {
                    this.falharAutenticacao(new Error("Tempo limite ao restaurar o acesso."));
                }
            }, 12000);
        }

        this._cancelarObservacao = autenticacao.onAuthStateChanged(
            usuario => void this.processarEstado(usuario),
            erro => this.falharAutenticacao(erro)
        );

        return this._promessaAutenticacao;
    },

    garantirPromessa() {
        if (!this._promessaAutenticacao) {
            this._promessaAutenticacao = new Promise(resolve => {
                this._resolverAutenticacao = resolve;
            });
        }
        return this._promessaAutenticacao;
    },

    aguardarAutenticacao() {
        if (this.resolvido) {
            return Promise.resolve(this.obterSessao());
        }
        return this.garantirPromessa();
    },

    obterInstanciaFirebase() {
        if (typeof window === "undefined") return null;
        return window.RKFirebaseAuth
            || window.RKFirebase?.auth
            || (typeof window.firebase?.auth === "function" ? window.firebase.auth() : null);
    },

    async processarEstado(usuario, opcoes = {}) {
        if (this._timerInicializacao && typeof window !== "undefined") {
            window.clearTimeout(this._timerInicializacao);
            this._timerInicializacao = null;
        }

        const uidAnterior = String(this.usuarioAtual?.uid || "");
        this.usuarioAtual = usuario || null;
        if (usuario && uidAnterior !== String(usuario.uid || "")) this.resolvido = false;
        if (!usuario) this.limparPerfilAtual();

        const exigePerfil = Boolean(usuario)
            && typeof window !== "undefined"
            && (this.modoAtual === "login" || (this.modoAtual === "protected" && this.paginaAtualProtegida()));
        if (exigePerfil) {
            try {
                const perfil = await this.carregarPerfilAutorizado(usuario);
                if (!perfil?.ativo || !["admin", "funcionario"].includes(perfil.perfil)) {
                    await this.recusarAcesso();
                    return null;
                }
                this.perfilAtual = perfil;
            } catch (erro) {
                this.usuarioAtual = null;
                this.limparPerfilAtual();
                this.falharAutenticacao(new Error("Não foi possível validar seu acesso. Tente novamente."));
                return null;
            }
        }
        this.resolvido = true;
        this.erroInicializacao = null;
        const sessao = this.obterSessao();

        if (this._resolverAutenticacao) {
            this._resolverAutenticacao(sessao);
            this._resolverAutenticacao = null;
        }

        this.notificarEstado(sessao);

        if (this.obterPaginaAtual() === "acessos.html" && sessao?.perfil !== "admin") {
            this.redirecionarDashboard();
            return null;
        }

        if (opcoes.redirecionar === false) {
            this.liberarInterface();
            return sessao;
        }

        if (this.modoAtual === "login") {
            if (sessao) this.redirecionarDashboard();
            else this.liberarInterface();
            return sessao;
        }

        if (["home", "public"].includes(this.modoAtual)) {
            this.liberarInterface();
            return sessao;
        }

        if (this.paginaAtualProtegida() && !sessao) {
            this.redirecionarLogin("sessao_expirada");
            return null;
        }

        this.liberarInterface();
        return sessao;
    },

    falharAutenticacao(erro) {
        if (this.resolvido) return;
        this.erroInicializacao = erro || new Error("Falha de acesso.");
        this.resolvido = true;

        if (this._resolverAutenticacao) {
            this._resolverAutenticacao(null);
            this._resolverAutenticacao = null;
        }

        this.notificarErro(this.erroInicializacao);

        if (this.modoAtual === "protected" && this.paginaAtualProtegida()) {
            this.redirecionarLogin("auth_indisponivel");
            return;
        }

        this.liberarInterface();
    },

    obterSessao() {
        if (!this.usuarioAtual) return null;
        const preferencias = this.obterPreferenciasUsuario();
        const email = String(this.usuarioAtual.email || "").trim();
        const nomeEmail = email.split("@")[0].replace(/[._-]+/g, " ").trim();

        return {
            logado: true,
            uid: String(this.usuarioAtual.uid || ""),
            usuario: email,
            email,
            nomeUsuario: this.usuarioAtual.displayName || this.perfilAtual?.nome || preferencias.nomeUsuario || nomeEmail || "Funcionário RK",
            fotoUsuario: this.usuarioAtual.photoURL || preferencias.fotoUsuario || "",
            entradaEm: this.usuarioAtual.metadata?.lastSignInTime || new Date().toISOString(),
            perfil: this.perfilAtual?.perfil || "",
            ativo: this.perfilAtual ? this.perfilAtual.ativo === true : true
        };
    },

    async carregarPerfilAutorizado(usuario) {
        const uid = String(usuario?.uid || "");
        if (!uid) return null;
        if (this._promessaPerfil && this._uidPerfil === uid) return this._promessaPerfil;
        this._uidPerfil = uid;
        this._promessaPerfil = (async () => {
            const token = await usuario.getIdToken();
            const configuracao = window.RK_FIREBASE_CONFIG || window.RKFirebase?.config || {};
            if (!configuracao.projectId) throw new Error("Configuração do sistema indisponível.");
            const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(configuracao.projectId)}/databases/(default)/documents/usuarios_autorizados/${encodeURIComponent(uid)}`;
            const resposta = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (resposta.status === 403 || resposta.status === 404) return null;
            if (!resposta.ok) throw new Error("Falha ao consultar o perfil de acesso.");
            const documento = await resposta.json();
            return this.converterCamposDocumento(documento.fields || {});
        })();
        return this._promessaPerfil;
    },

    converterCamposDocumento(campos = {}) {
        const converter = valor => {
            if (!valor || typeof valor !== "object") return null;
            if (Object.prototype.hasOwnProperty.call(valor, "stringValue")) return valor.stringValue;
            if (Object.prototype.hasOwnProperty.call(valor, "booleanValue")) return valor.booleanValue;
            if (Object.prototype.hasOwnProperty.call(valor, "integerValue")) return Number(valor.integerValue);
            if (Object.prototype.hasOwnProperty.call(valor, "doubleValue")) return Number(valor.doubleValue);
            if (valor.timestampValue) return valor.timestampValue;
            if (valor.mapValue) return this.converterCamposDocumento(valor.mapValue.fields || {});
            if (valor.arrayValue) return (valor.arrayValue.values || []).map(converter);
            return null;
        };
        return Object.fromEntries(Object.entries(campos).map(([chave, valor]) => [chave, converter(valor)]));
    },

    async recusarAcesso() {
        try { await this.obterInstanciaFirebase()?.signOut?.(); } catch (erro) {}
        this.usuarioAtual = null;
        this.limparPerfilAtual();
        this.resolvido = true;
        if (this._resolverAutenticacao) {
            this._resolverAutenticacao(null);
            this._resolverAutenticacao = null;
        }
        this.notificarEstado(null);
        this.redirecionarLogin("acesso_negado");
    },

    limparPerfilAtual() {
        this.perfilAtual = null;
        this._promessaPerfil = null;
        this._uidPerfil = "";
    },

    estaAutenticado() {
        return Boolean(this.resolvido && this.usuarioAtual);
    },

    salvarSessao() {
        return this.obterSessao();
    },

    limparSessao() {
        this.removerChave(this.chaveSessao);
        this.removerChave(this.chaveCompatibilidade);
    },

    limparDadosLegados() {
        this.limparSessao();
        const armazenamento = this.obterLocalStorage();
        if (!armazenamento) return;

        try {
            const configuracoes = this.lerJSON(armazenamento.getItem(this.chaveConfig));
            if (!configuracoes || typeof configuracoes !== "object") return;
            const possuiaCredenciais = Object.prototype.hasOwnProperty.call(configuracoes, "usuario")
                || Object.prototype.hasOwnProperty.call(configuracoes, "senha");
            if (!possuiaCredenciais) return;
            delete configuracoes.usuario;
            delete configuracoes.senha;
            armazenamento.setItem(this.chaveConfig, JSON.stringify(configuracoes));
        } catch (erro) {
            console.warn("Não foi possível remover credenciais locais antigas:", erro);
        }
    },

    obterPreferenciasUsuario() {
        const armazenamento = this.obterLocalStorage();
        if (!armazenamento) return {};
        return this.lerJSON(armazenamento.getItem(this.chaveConfig)) || {};
    },

    obterLocalStorage() {
        try {
            return typeof localStorage !== "undefined" ? localStorage : null;
        } catch (erro) {
            return null;
        }
    },

    removerChave(chave) {
        try { if (typeof localStorage !== "undefined") localStorage.removeItem(chave); } catch (erro) {}
        try { if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(chave); } catch (erro) {}
    },

    verificarAutenticacao() {
        if (!this.resolvido) return null;
        return this.processarEstado(this.usuarioAtual);
    },

    prepararEstiloInterno() {
        if (typeof document === "undefined") return;
        const deveAguardar = this.modoAtual === "login"
            || (this.modoAtual === "protected" && this.paginaAtualProtegida());
        if (!deveAguardar) return;

        document.documentElement.classList.add("rk-auth-pending");
        if (this.modoAtual === "protected") {
            document.documentElement.classList.add("rk-app-interna-preload");
        }

        if (document.getElementById("rkAuthPendingStyle")) return;
        const estilo = document.createElement("style");
        estilo.id = "rkAuthPendingStyle";
        estilo.textContent = [
            "html.rk-auth-pending body>:not(#rk-global-loading):not(.rk-internal-header):not(.rk-adaptive-mobile-navigation):not(.rk-adaptive-mobile-navigation__backdrop){visibility:hidden!important}",
            "html.rk-auth-pending body>.rk-internal-header,html.rk-auth-pending body>.rk-adaptive-mobile-navigation{visibility:visible!important}",
            "html.rk-auth-pending{background:#071c2b}"
        ].join("");
        document.head.appendChild(estilo);
    },

    liberarInterface() {
        if (typeof document === "undefined") return;
        if (window.RKLoading?.marcarAutenticacaoPronta) {
            window.RKLoading.marcarAutenticacaoPronta();
        } else {
            document.documentElement.classList.remove("rk-auth-pending");
        }
    },

    notificarEstado(sessao) {
        if (typeof window === "undefined" || typeof CustomEvent === "undefined") return;
        window.dispatchEvent(new CustomEvent(this.eventoEstado, {
            detail: { autenticado: Boolean(sessao), sessao }
        }));
    },

    notificarErro(erro) {
        if (typeof window === "undefined" || typeof CustomEvent === "undefined") return;
        window.dispatchEvent(new CustomEvent(this.eventoErro, {
            detail: { mensagem: erro?.message || "Falha de acesso." }
        }));
    },

    async sair(event) {
        if (event && typeof event.preventDefault === "function") event.preventDefault();
        if (typeof document !== "undefined") document.documentElement.classList.add("rk-auth-pending");

        try {
            const autenticacao = this.obterInstanciaFirebase();
            if (autenticacao) await autenticacao.signOut();
        } catch (erro) {
            console.error("Não foi possível encerrar a sessão:", erro);
        } finally {
            this.usuarioAtual = null;
            this.limparPerfilAtual();
            this.limparSessao();
            this.redirecionarLogin();
        }
    },

    redirecionarLogin(motivo = "") {
        const pagina = motivo ? `login.html?erro=${encodeURIComponent(motivo)}` : "login.html";
        this.redirecionar(this.criarHref(pagina));
    },

    redirecionarDashboard() {
        this.redirecionar(this.criarHref("dashboard-comercial.html"));
    },

    redirecionar(destino) {
        if (typeof window === "undefined" || !destino || this.mesmaPagina(destino)) return;
        window.location.replace(destino);
    },

    criarHref(pagina) {
        return this.estaEmPaginas() ? pagina : `paginas/${pagina}`;
    },

    estaEmPaginas() {
        if (typeof window === "undefined") return false;
        return /\/paginas\//.test(window.location.pathname.replace(/\\/g, "/"));
    },

    mesmaPagina(destino) {
        if (typeof document === "undefined" || typeof window === "undefined") return false;
        const link = document.createElement("a");
        link.href = destino;
        return link.href === window.location.href;
    },

    obterModoAtual() {
        if (typeof document === "undefined") return "protected";
        return document.currentScript?.dataset?.rkAuth || "protected";
    },

    obterPaginaAtual() {
        if (typeof window === "undefined") return "index.html";
        return window.location.pathname.replace(/\\/g, "/").split("/").pop() || "index.html";
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

if (typeof window !== "undefined") {
    window.RKAuth = RKAuth;
    window.verificarAutenticacao = () => RKAuth.verificarAutenticacao();
    window.mostrarTelaLogin = () => RKAuth.redirecionarLogin();
    window.esconderTelaLogin = () => {};
    window.mostrarAreaInterna = () => RKAuth.liberarInterface();
    window.esconderAreaInterna = () => document.documentElement.classList.add("rk-auth-pending");
    RKAuth.inicializar();
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { RKAuth };
}
