const RKNavigation = {
    links: [
        { rotulo: "Dashboard", pagina: "dashboard-comercial.html" },
        { rotulo: "Clientes", pagina: "clientes.html" },
        { rotulo: "Projetos", pagina: "projetos.html" },
        { rotulo: "Servicos", pagina: "servicos.html" },
        { rotulo: "Produtos", pagina: "produtos.html" },
        { rotulo: "Orcamento", pagina: "orcamento-inteligente.html" },
        { rotulo: "Documento", pagina: "compartilhar-documento.html" },
        { rotulo: "Aprovacao", pagina: "aprovacao-comercial.html" },
        { rotulo: "Conversao", pagina: "converter-projeto.html" },
        { rotulo: "Producao", pagina: "producao.html" }
    ],

    iniciar() {
        const lista = document.querySelector("header nav ul");

        if (!lista) {
            return false;
        }

        lista.classList.add("rk-nav-principal");

        if (this.paginaPublica()) {
            this.protegerLinksInternos(lista);
            return true;
        }

        if (!this.usuarioAutenticado()) {
            this.protegerLinksInternos(lista);
            return false;
        }

        lista.innerHTML = [
            ...this.links.map(link => this.renderizarLink(link)),
            this.renderizarSair()
        ].join("");
        this.protegerLinksInternos(lista);

        return true;
    },

    renderizarLink(link) {
        const ativo = this.paginaAtual(link.pagina);
        return [
            `<li>`,
            `<a href="${this.escaparAtributo(this.criarHref(link.pagina))}"${ativo ? ' class="rk-nav-ativo"' : ""}>`,
            `${this.escapar(link.rotulo)}`,
            `</a>`,
            `</li>`
        ].join("");
    },

    renderizarLogin() {
        return [
            `<li>`,
            `<a class="login" href="${this.escaparAtributo(this.criarHref("login.html"))}">Login</a>`,
            `</li>`
        ].join("");
    },

    renderizarSair() {
        return [
            `<li>`,
            `<a class="login rk-nav-sair" href="${this.escaparAtributo(this.criarHref("login.html"))}" onclick="RKAuth.sair(event)">Sair</a>`,
            `</li>`
        ].join("");
    },

    usuarioAutenticado() {
        if (window.RKAuth) {
            return RKAuth.estaAutenticado();
        }

        try {
            const sessao = JSON.parse(localStorage.getItem("vidracaria_sessao_funcionario") || "null");
            return Boolean(sessao && sessao.logado);
        } catch (erro) {
            return false;
        }
    },

    protegerLinksInternos(lista) {
        lista.addEventListener("click", (event) => {
            const link = event.target.closest("a");
            if (!link || link.classList.contains("login")) {
                return;
            }

            if (!this.linkProtegido(link) || this.usuarioAutenticado()) {
                return;
            }

            event.preventDefault();
            if (window.RKAuth) {
                RKAuth.redirecionarLogin();
            } else {
                window.location.href = this.criarHref("login.html");
            }
        });
    },

    paginaPublica() {
        if (window.RKAuth) {
            return !RKAuth.paginaAtualProtegida();
        }

        return ["index.html", "contato.html", "login.html", "orcamento.html", "loading.html"].includes(this.obterPaginaAtual());
    },

    linkProtegido(link) {
        const pagina = this.obterPaginaPorHref(link.getAttribute("href") || "");
        if (!pagina) {
            return false;
        }

        if (window.RKAuth) {
            return RKAuth.paginaProtegida(pagina);
        }

        return [
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
        ].includes(pagina);
    },

    criarHref(pagina) {
        const emPaginas = this.estaEmPaginas();
        return emPaginas ? pagina : `paginas/${pagina}`;
    },

    estaEmPaginas() {
        return /\/paginas\//.test(window.location.pathname.replace(/\\/g, "/"));
    },

    paginaAtual(pagina) {
        const caminho = window.location.pathname.replace(/\\/g, "/");
        return caminho.endsWith(`/paginas/${pagina}`) || caminho.endsWith(`/${pagina}`);
    },

    obterPaginaAtual() {
        return window.location.pathname
            .replace(/\\/g, "/")
            .split("/")
            .pop() || "index.html";
    },

    obterPaginaPorHref(href) {
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
            return "";
        }

        const caminho = href
            .split("?")[0]
            .split("#")[0]
            .replace(/\\/g, "/");

        return caminho.split("/").pop();
    },

    escapar(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    escaparAtributo(valor) {
        return this.escapar(valor).replace(/`/g, "&#096;");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    RKNavigation.iniciar();
});
