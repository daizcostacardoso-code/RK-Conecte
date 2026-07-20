const RKNavigation = {
    links: [
        { rotulo: "Dashboard", pagina: "dashboard-comercial.html" },
        { rotulo: "Clientes", pagina: "clientes.html" },
        { rotulo: "Projetos", pagina: "projetos.html" },
        { rotulo: "Produtos", pagina: "produtos.html" },
        { rotulo: "Orcamento", pagina: "orcamento-inteligente.html" },
        { rotulo: "Medições", pagina: "medicao-obra.html" },
        { rotulo: "Notas", pagina: "nota-servico.html" },
        { rotulo: "Arquivos", pagina: "arquivos.html" },
        { rotulo: "Caixa", pagina: "caixa.html" }
    ],
    atalhosSistema: [
        {
            chave: "medicao",
            titulo: "Medir Obra",
            descricao: "Registrar medidas",
            pagina: "medicao-obra.html",
            fallback: "Régua"
        },
        {
            chave: "clientes",
            titulo: "Novo Cliente",
            descricao: "Cadastrar contato",
            pagina: "clientes.html",
            fallback: "+"
        },
        {
            chave: "orcamento",
            titulo: "Novo Orcamento",
            tituloHtml: "Novo Or&ccedil;amento",
            descricao: "Criar proposta",
            pagina: "orcamento-inteligente.html",
            fallback: "R$"
        },
        {
            chave: "notaServico",
            titulo: "Nota de Serviço",
            descricao: "Emitir nota em PDF",
            pagina: "nota-servico.html",
            fallback: "NS"
        },
        {
            chave: "arquivos",
            titulo: "Arquivos",
            descricao: "Buscar or\u00e7amentos",
            pagina: "arquivos.html",
            fallback: "PDF"
        },
        {
            chave: "caixa",
            titulo: "Caixa",
            descricao: "Entradas e sa\u00eddas",
            pagina: "caixa.html",
            fallback: "R$"
        }
    ],
    arquivosIconesAtalho: {
        medicao: "Medirobra-Atalho.json",
        clientes: "Cliente-Atalho.json",
        orcamento: "Orcamento-Atalho.json",
        arquivos: "Arquivos-Atalho.json",
        caixa: "Caixa-Atalho.json"
    },
    paginasSemAtalhos: [
        "dashboard-comercial.html",
        "orcamento.html",
        "orcamento-inteligente.html",
        "novo-orcamento.html",
        "nota-servico.html",
        "funcionario.html",
        "login.html",
        "loading.html"
    ],

    iniciar() {
        const lista = document.querySelector("header nav ul");

        if (!lista) {
            return false;
        }

        if (this.paginaPublica()) {
            lista.classList.add("rk-nav-principal");
            this.protegerLinksInternos(lista);
            return true;
        }

        this.prepararTelaInterna(lista);

        if (!this.usuarioAutenticado()) {
            this.protegerLinksInternos(lista);
            return false;
        }

        lista.innerHTML = [
            ...this.links.map(link => this.renderizarLink(link)),
            this.renderizarSair()
        ].join("");
        lista.classList.add("rk-nav-principal");
        document.documentElement.classList.remove("rk-app-interna-preload");
        this.removerAtalhosSistema();
        this.protegerLinksInternos(lista);

        return true;
    },

    removerAtalhosSistema() {
        document.querySelectorAll(".rk-system-shortcuts").forEach(elemento => elemento.remove());
        return true;
    },

    prepararTelaInterna(lista) {
        document.body.classList.add("rk-app-interna");
        this.prepararMenuMobile(lista);
        this.carregarVersao(() => this.renderizarAssinaturaVersao());
    },

    prepararMenuMobile(lista) {
        const nav = lista?.closest("nav");

        if (!nav || nav.dataset.rkMenuPreparado === "true") {
            return;
        }

        nav.dataset.rkMenuPreparado = "true";
        nav.classList.add("rk-nav-shell");

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "rk-nav-mobile-toggle";
        botao.setAttribute("aria-expanded", "false");
        botao.setAttribute("aria-controls", "rkNavPrincipal");
        botao.textContent = "Menu do sistema";

        if (!lista.id) {
            lista.id = "rkNavPrincipal";
        }

        nav.insertBefore(botao, lista);

        const fechar = () => {
            nav.classList.remove("rk-nav-mobile-aberto");
            botao.setAttribute("aria-expanded", "false");
        };

        botao.addEventListener("click", () => {
            const aberto = nav.classList.toggle("rk-nav-mobile-aberto");
            botao.setAttribute("aria-expanded", String(aberto));
        });

        lista.addEventListener("click", event => {
            if (event.target.closest("a")) {
                fechar();
            }
        });

        document.addEventListener("click", event => {
            if (!nav.contains(event.target)) {
                fechar();
            }
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                fechar();
            }
        });
    },

    carregarVersao(callback) {
        if (window.RK_VERSION || document.querySelector("script[data-rk-version]")) {
            callback();
            return;
        }

        const script = document.createElement("script");
        script.src = `${this.estaEmPaginas() ? "../" : ""}js/shared/rk-version.js?v=0.4.2`;
        script.dataset.rkVersion = "true";
        script.onload = callback;
        script.onerror = callback;
        document.head.appendChild(script);
    },

    renderizarAssinaturaVersao() {
        if (document.querySelector(".conecte-signature, .rk-version-signature")) {
            return;
        }

        const footer = document.querySelector("body > footer:last-of-type");

        if (!footer) {
            return;
        }

        const assinatura = document.createElement("div");
        assinatura.className = "rk-version-signature conecte-signature";
        assinatura.setAttribute("role", "contentinfo");
        assinatura.setAttribute("aria-label", "Conecte");

        const logo = document.createElement("img");
        logo.src = `${this.estaEmPaginas() ? "../" : ""}assets/conecte-logo.png`;
        logo.alt = "Conecte";
        assinatura.appendChild(logo);
        footer.insertAdjacentElement("afterend", assinatura);
    },

    renderizarAtalhosSistema() {
        if (this.deveOmitirAtalhosSistema() || document.querySelector(".rk-system-shortcuts")) {
            return false;
        }

        const header = document.querySelector("body > header");
        if (!header) {
            return false;
        }

        const secoes = document.createElement("section");
        secoes.className = "rk-system-shortcuts";
        secoes.setAttribute("aria-label", "Atalhos do sistema");
        secoes.innerHTML = [
            `<div class="container rk-system-shortcuts__inner">`,
            ...this.atalhosSistema.map(atalho => this.renderizarAtalhoSistema(atalho)),
            `</div>`
        ].join("");

        header.insertAdjacentElement("afterend", secoes);
        this.prepararMidiasAtalhos(secoes);
        return true;
    },

    deveOmitirAtalhosSistema() {
        const pagina = this.obterPaginaAtual();
        return this.paginasSemAtalhos.includes(pagina) || !this.linkProtegido({ getAttribute: () => pagina });
    },

    renderizarAtalhoSistema(atalho) {
        return [
            `<a class="rk-system-shortcut" href="${this.escaparAtributo(this.criarHref(atalho.pagina))}" data-rk-shortcut="${this.escaparAtributo(atalho.chave)}" aria-label="${this.escaparAtributo(atalho.titulo)}">`,
            this.renderizarMidiaAtalho(atalho),
            `<span class="rk-system-shortcut__copy">`,
            `<strong>${atalho.tituloHtml || this.escapar(atalho.titulo)}</strong>`,
            `<small>${this.escapar(atalho.descricao)}</small>`,
            `</span>`,
            `</a>`
        ].join("");
    },

    renderizarMidiaAtalho(atalho) {
        const arquivo = this.obterArquivoIconeAtalho(atalho.chave);
        const tipo = this.obterTipoMidia(arquivo);
        const src = arquivo ? `${this.obterPrefixoRaiz()}Icones/${this.codificarCaminho(arquivo)}` : "";
        const fallback = `<span class="rk-system-shortcut__fallback" aria-hidden="true">${this.escapar(atalho.fallback)}</span>`;

        if (!src) {
            return `<span class="rk-system-shortcut__media rk-system-shortcut__media--fallback">${fallback}</span>`;
        }

        if (tipo === "json") {
            return `<span class="rk-system-shortcut__media" data-rk-icon-type="json" data-rk-icon-src="${this.escaparAtributo(src)}">${fallback}</span>`;
        }

        if (tipo === "mp4") {
            return [
                `<span class="rk-system-shortcut__media" data-rk-icon-type="mp4">`,
                `<video src="${this.escaparAtributo(src)}" muted autoplay loop playsinline aria-hidden="true"></video>`,
                fallback,
                `</span>`
            ].join("");
        }

        return [
            `<span class="rk-system-shortcut__media" data-rk-icon-type="${this.escaparAtributo(tipo || "image")}">`,
            `<img src="${this.escaparAtributo(src)}" alt="" loading="lazy" decoding="async" onerror="this.closest('.rk-system-shortcut__media').classList.add('rk-system-shortcut__media--erro')">`,
            fallback,
            `</span>`
        ].join("");
    },

    obterArquivoIconeAtalho(chave) {
        return this.arquivosIconesAtalho[chave] || "";
    },

    obterTipoMidia(arquivo = "") {
        const extensao = String(arquivo).split(".").pop().toLowerCase();

        if (["json", "webp", "gif", "apng", "png", "jpg", "jpeg", "svg", "mp4"].includes(extensao)) {
            return extensao;
        }

        return "";
    },

    prepararMidiasAtalhos(root) {
        const reduzMovimento = this.movimentoReduzido();

        root.querySelectorAll(".rk-system-shortcut").forEach((atalho, indice) => {
            atalho.style.setProperty("--rk-shortcut-index", String(indice));
        });

        root.querySelectorAll(".rk-system-shortcut__media[data-rk-icon-type='json']").forEach(media => {
            this.carregarLottiePlayer(() => this.hidratarLottieAtalho(media));
        });

        root.querySelectorAll(".rk-system-shortcut").forEach(atalho => {
            const animar = () => this.animarAtalho(atalho);
            atalho.addEventListener("pointerdown", animar);
            atalho.addEventListener("focusin", animar);
        });
    },

    carregarLottiePlayer(callback) {
        if (window.customElements?.get("lottie-player")) {
            callback();
            return;
        }

        const existente = document.querySelector("script[data-rk-lottie-player='true']");
        if (existente) {
            existente.addEventListener("load", callback, { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = "https://unpkg.com/@lottiefiles/lottie-player@2.0.12/dist/lottie-player.js";
        script.async = true;
        script.dataset.rkLottiePlayer = "true";
        script.addEventListener("load", callback, { once: true });
        document.head.appendChild(script);
    },

    hidratarLottieAtalho(media) {
        if (!window.customElements?.get("lottie-player") || media.querySelector("lottie-player")) {
            return;
        }

        const player = document.createElement("lottie-player");
        player.setAttribute("src", media.dataset.rkIconSrc || "");
        player.setAttribute("background", "transparent");
        player.setAttribute("speed", "1");
        player.setAttribute("loop", "");
        player.setAttribute("aria-hidden", "true");
        media.appendChild(player);
        media.classList.add("rk-system-shortcut__media--loaded");

        const atalho = media.closest(".rk-system-shortcut");
        if (!atalho) {
            return;
        }

        const tocar = () => {
            if (this.movimentoReduzido()) {
                return;
            }

            player.stop?.();
            player.play?.();
        };
        const parar = () => player.stop?.();

        atalho.addEventListener("pointerenter", tocar);
        atalho.addEventListener("pointerleave", parar);
        atalho.addEventListener("focusin", tocar);
        atalho.addEventListener("blur", parar);
        atalho.addEventListener("pointerdown", () => {
            tocar();
            window.setTimeout(parar, 1200);
        });
    },

    animarAtalho(atalho) {
        if (this.movimentoReduzido()) {
            return;
        }

        atalho.classList.remove("rk-system-shortcut--pulse");
        void atalho.offsetWidth;
        atalho.classList.add("rk-system-shortcut--pulse");
    },

    movimentoReduzido() {
        return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false;
    },

    obterPrefixoRaiz() {
        return this.estaEmPaginas() ? "../" : "";
    },

    codificarCaminho(caminho = "") {
        return String(caminho).split("/").map(parte => encodeURIComponent(parte)).join("/");
    },

    normalizarTexto(valor = "") {
        return String(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\.[^.]+$/, "")
            .replace(/-atalho$/i, "")
            .replace(/[^a-z0-9]+/gi, "")
            .toLowerCase();
    },

    obterVersao() {
        return String(window.RK_VERSION || "v0.4.2");
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
        if (lista.dataset.rkLinksProtegidos === "true") return;
        lista.dataset.rkLinksProtegidos = "true";
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
            "orcamento-inteligente.html",
            
            
            
            
            "funcionario.html",
            "novo-orcamento.html",
            "valores.html",
            "produtos.html",
            "arquivos.html",
            "medicao-obra.html",
            "nota-servico.html",
            "caixa.html"
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

document.addEventListener("DOMContentLoaded", async () => {
    if (window.RKAuth?.paginaAtualProtegida()) {
        const sessao = await RKAuth.aguardarAutenticacao();
        if (!sessao) return;
    }
    RKNavigation.iniciar();
});

window.addEventListener("rk:auth-state-changed", () => {
    if (document.readyState !== "loading") RKNavigation.iniciar();
});
