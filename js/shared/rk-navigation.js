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

        lista.innerHTML = this.obterLinksVisiveis().map(link => this.renderizarLink(link)).join("");
        lista.classList.add("rk-nav-principal");
        this.garantirBotaoFecharDrawer(lista);
        this.renderizarPerfilHeader();
        document.documentElement.classList.remove("rk-app-interna-preload");
        this.removerAtalhosSistema();
        this.renderizarMenuInferior();
        this.protegerLinksInternos(lista);

        return true;
    },

    obterLinksVisiveis() {
        const links = [...this.links];
        const sessao = window.RKAuth?.obterSessao?.();
        if (sessao?.perfil === "admin") {
            links.push({ rotulo: "Acessos", pagina: "acessos.html" });
        }
        return links;
    },

    removerAtalhosSistema() {
        document.querySelectorAll(".rk-system-shortcuts").forEach(elemento => elemento.remove());
        return true;
    },

    renderizarMenuInferior() {
        document.querySelectorAll(".rk-menu-inferior, .rk-mobile-nav-handle, .rk-mobile-more").forEach(elemento => elemento.remove());
        const itens = [
            { area: "inicio", rotulo: "Início", pagina: "dashboard-comercial.html", icone: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"></path><path d="M9 21v-7h6v7"></path>' },
            { area: "orcamentos", rotulo: "Orçamentos", pagina: "orcamento-inteligente.html", icone: '<path d="M6 3h9l3 3v15H6z"></path><path d="M15 3v4h4M9 12h6M9 16h6"></path>' },
            { area: "obras", rotulo: "Obras", pagina: "projetos.html", icone: '<path d="M4 20h16M6 20V10l6-5 6 5v10M9 20v-5h6v5"></path>' },
            { area: "clientes", rotulo: "Clientes", pagina: "clientes.html", icone: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M19 8v6M22 11h-6"></path>' }
        ];
        const areaAtiva = this.obterAreaMobileAtual();
        const menu = document.createElement("nav");
        menu.className = "rk-menu-inferior";
        menu.id = "rkMenuInferior";
        menu.setAttribute("aria-label", "Navegação principal");
        menu.innerHTML = itens.map(item => `<a href="${this.escaparAtributo(this.criarHref(item.pagina))}"${areaAtiva === item.area ? ' aria-current="page"' : ""}><svg viewBox="0 0 24 24" aria-hidden="true">${item.icone}</svg><span>${this.escapar(item.rotulo)}</span></a>`).join("");
        const mais = document.createElement("button");
        mais.type = "button";
        mais.className = "rk-menu-inferior__mais";
        mais.setAttribute("aria-expanded", "false");
        mais.setAttribute("aria-controls", "rkMobileMore");
        if (areaAtiva === "mais") mais.setAttribute("aria-current", "page");
        mais.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="19" cy="12" r="1.5"></circle></svg><span>Mais</span>';
        menu.appendChild(mais);

        const painel = this.criarPainelMaisMobile();
        const alca = document.createElement("button");
        alca.type = "button";
        alca.className = "rk-mobile-nav-handle";
        alca.setAttribute("aria-label", "Mostrar navegação principal");
        alca.setAttribute("aria-controls", "rkMenuInferior");
        alca.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg><span>Menu</span>';

        const definirVisibilidade = oculto => {
            const inicio = areaAtiva === "inicio";
            menu.classList.toggle("rk-menu-inferior--oculto", oculto && !inicio);
            alca.classList.toggle("rk-mobile-nav-handle--visivel", oculto && !inicio);
        };
        this.configurarOcultacaoMenuMobile(definirVisibilidade, areaAtiva === "inicio");
        alca.addEventListener("click", () => definirVisibilidade(false));
        this.configurarPainelMaisMobile({ mais, painel, menu, definirVisibilidade });

        document.body.appendChild(menu);
        document.body.appendChild(alca);
        document.body.appendChild(painel);
        this.protegerLinksInternos(menu);
    },

    obterAreaMobileAtual() {
        const pagina = this.obterPaginaAtual();
        if (["dashboard-comercial.html", "index.html"].includes(pagina)) return "inicio";
        if (["orcamento.html", "orcamento-inteligente.html", "novo-orcamento.html", "arquivos.html", "compartilhar-documento.html"].includes(pagina)) return "orcamentos";
        if (["projetos.html", "medicao-obra.html", "nota-servico.html"].includes(pagina)) return "obras";
        if (pagina === "clientes.html") return "clientes";
        return "mais";
    },

    criarPainelMaisMobile() {
        const links = [
            { rotulo: "Arquivos", pagina: "arquivos.html" }, { rotulo: "Medições", pagina: "medicao-obra.html" },
            { rotulo: "Notas de serviço", pagina: "nota-servico.html" }, { rotulo: "Caixa", pagina: "caixa.html" },
            { rotulo: "Produtos", pagina: "produtos.html" }, { rotulo: "Valores", pagina: "valores.html" },
            { rotulo: "Funcionários", pagina: "funcionario.html" }
        ];
        if (window.RKAuth?.obterSessao?.()?.perfil === "admin") links.push({ rotulo: "Acessos", pagina: "acessos.html" });
        const painel = document.createElement("div");
        painel.className = "rk-mobile-more";
        painel.id = "rkMobileMore";
        painel.hidden = true;
        painel.innerHTML = `<div class="rk-mobile-more__backdrop" data-rk-more-close></div><section class="rk-mobile-more__sheet" role="dialog" aria-modal="true" aria-labelledby="rkMobileMoreTitle"><div class="rk-mobile-more__topo"><h2 id="rkMobileMoreTitle">Mais opções</h2><button type="button" data-rk-more-close aria-label="Fechar mais opções">×</button></div><nav aria-label="Opções secundárias">${links.map(link => `<a href="${this.escaparAtributo(this.criarHref(link.pagina))}">${this.escapar(link.rotulo)}</a>`).join("")}</nav></section>`;
        return painel;
    },

    configurarPainelMaisMobile({ mais, painel, menu, definirVisibilidade }) {
        let focoAnterior = null;
        const fechar = () => {
            if (painel.hidden) return;
            painel.classList.remove("rk-mobile-more--aberto");
            document.body.classList.remove("rk-mobile-more-aberto");
            mais.setAttribute("aria-expanded", "false");
            window.setTimeout(() => { painel.hidden = true; focoAnterior?.focus(); }, 180);
        };
        const abrir = () => {
            focoAnterior = document.activeElement;
            painel.hidden = false;
            requestAnimationFrame(() => painel.classList.add("rk-mobile-more--aberto"));
            document.body.classList.add("rk-mobile-more-aberto");
            mais.setAttribute("aria-expanded", "true");
            definirVisibilidade(false);
            painel.querySelector("[data-rk-more-close]")?.focus();
        };
        mais.addEventListener("click", abrir);
        painel.addEventListener("click", evento => { if (evento.target.matches("[data-rk-more-close]")) fechar(); });
        painel.addEventListener("keydown", evento => {
            if (evento.key === "Escape") fechar();
            if (evento.key === "Tab") {
                const foco = [...painel.querySelectorAll("button, a")].filter(elemento => !elemento.disabled);
                    const primeiro = foco[0], ultimo = foco[foco.length - 1];
                if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
                if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
            }
        });
        menu.addEventListener("click", evento => { if (evento.target.closest("a")) definirVisibilidade(false); });
    },

    configurarOcultacaoMenuMobile(definirVisibilidade, manterVisivel) {
        if (manterVisivel) return;
        let ultimaPosicao = window.scrollY;
        let pendente = false;
        const tolerancia = 12;
        window.addEventListener("scroll", () => {
            if (pendente) return;
            pendente = true;
            requestAnimationFrame(() => {
                const atual = window.scrollY;
                const diferenca = atual - ultimaPosicao;
                if (Math.abs(diferenca) >= tolerancia) {
                    if (diferenca > 0 && atual > 48) definirVisibilidade(true);
                    if (diferenca < 0) definirVisibilidade(false);
                    ultimaPosicao = atual;
                }
                pendente = false;
            });
        }, { passive: true });
    },

    prepararTelaInterna(lista) {
        document.body.classList.add("rk-app-interna");
        this.prepararMenuMobile(lista);
        this.atualizarCacheAplicacao();
        this.carregarVersao(() => this.renderizarAssinaturaVersao());
    },

    atualizarCacheAplicacao() {
        if (!navigator.serviceWorker || window.__rkCacheAtualizado) return;
        window.__rkCacheAtualizado = true;
        const chaveRecarga = "rk-cache-atualizado-nesta-pagina";
        sessionStorage.removeItem(chaveRecarga);

        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (sessionStorage.getItem(chaveRecarga) === "true") return;
            sessionStorage.setItem(chaveRecarga, "true");
            window.location.reload();
        });

        navigator.serviceWorker.getRegistration()
            .then(registro => registro?.update())
            .catch(() => null);
    },

    prepararMenuMobile(lista) {
        const nav = lista?.closest("nav");

        if (!nav || nav.dataset.rkMenuPreparado === "true") {
            this.garantirBotaoFecharDrawer(lista);
            return;
        }

        nav.dataset.rkMenuPreparado = "true";
        nav.classList.add("rk-nav-shell");
        const backdrop = document.createElement("button");
        backdrop.type = "button";
        backdrop.className = "rk-nav-backdrop";
        backdrop.setAttribute("aria-label", "Fechar menu de navegação");
        backdrop.hidden = true;
        document.body.appendChild(backdrop);

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

        const fecharItem = this.garantirBotaoFecharDrawer(lista);

        const fechar = () => {
            nav.classList.remove("rk-nav-mobile-aberto");
            document.body.classList.remove("rk-nav-drawer-aberto");
            backdrop.hidden = true;
            botao.setAttribute("aria-expanded", "false");
        };

        botao.addEventListener("click", () => {
            const aberto = nav.classList.toggle("rk-nav-mobile-aberto");
            botao.setAttribute("aria-expanded", String(aberto));
            document.body.classList.toggle("rk-nav-drawer-aberto", aberto);
            backdrop.hidden = !aberto;
            if (aberto) lista.querySelector(".rk-nav-drawer-close button")?.focus();
        });

        backdrop.addEventListener("click", fechar);
        fecharItem.querySelector("button").addEventListener("click", fechar);

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

    garantirBotaoFecharDrawer(lista) {
        if (!lista || lista.querySelector(".rk-nav-drawer-close")) return lista?.querySelector(".rk-nav-drawer-close") || null;
        const item = document.createElement("li");
        item.className = "rk-nav-drawer-close";
        item.innerHTML = '<button type="button" aria-label="Fechar menu">×</button>';
        item.querySelector("button").addEventListener("click", () => lista.closest("nav")?.querySelector(".rk-nav-mobile-toggle")?.click());
        lista.prepend(item);
        return item;
    },

    carregarVersao(callback) {
        if (window.RK_VERSION || document.querySelector("script[data-rk-version]")) {
            callback();
            return;
        }

        const script = document.createElement("script");
        script.src = `${this.estaEmPaginas() ? "../" : ""}js/shared/rk-version.js?v=1.0.0`;
        script.dataset.rkVersion = "true";
        script.onload = callback;
        script.onerror = callback;
        document.head.appendChild(script);
    },

    renderizarAssinaturaVersao() {
        if (document.body.classList.contains("rk-app-interna")) {
            return;
        }

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
        return String(window.RK_VERSION || "v1.0.0");
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

    renderizarPerfilHeader() {
        document.querySelectorAll(".rk-header-profile").forEach(elemento => elemento.remove());
        const container = document.querySelector("body > header > .container");
        const sessao = window.RKAuth?.obterSessao?.();
        if (!container || !sessao) return false;

        const nome = String(sessao.nomeUsuario || sessao.email || "Usuário").trim();
        const cargo = sessao.perfil === "admin" ? "Administrador" : "Funcionário";
        const iniciais = nome.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]).join("").toUpperCase() || "U";
        const foto = String(sessao.fotoUsuario || "").trim();
        const perfil = document.createElement("section");
        perfil.className = "rk-header-profile";
        perfil.innerHTML = [
            `<button type="button" class="rk-header-profile__trigger" aria-label="Abrir menu do perfil de ${this.escaparAtributo(nome)}" aria-expanded="false" aria-controls="rkHeaderProfileMenu">`,
            `<span class="rk-header-profile__avatar" aria-hidden="true"><span>${this.escapar(iniciais)}</span>${foto ? `<img src="${this.escaparAtributo(foto)}" alt="">` : ""}</span>`,
            `<span class="rk-header-profile__copy"><strong title="${this.escaparAtributo(nome)}">${this.escapar(nome)}</strong><small>${cargo}</small></span>`,
            `<span class="rk-header-profile__chevron" aria-hidden="true">⌄</span>`,
            `</button>`,
            `<div class="rk-header-profile__menu" id="rkHeaderProfileMenu" role="menu" hidden>`,
            `<a role="menuitem" href="${this.escaparAtributo(this.criarHref("funcionario.html"))}">Meu perfil</a>`,
            `<button type="button" role="menuitem" data-rk-profile-logout>Sair</button>`,
            `</div>`
        ].join("");
        container.appendChild(perfil);

        const trigger = perfil.querySelector(".rk-header-profile__trigger");
        const menu = perfil.querySelector(".rk-header-profile__menu");
        const fechar = () => {
            menu.hidden = true;
            trigger.setAttribute("aria-expanded", "false");
        };
        const abrir = () => {
            menu.hidden = false;
            trigger.setAttribute("aria-expanded", "true");
            menu.querySelector("a, button")?.focus();
        };
        trigger.addEventListener("click", () => menu.hidden ? abrir() : fechar());
        perfil.querySelector("[data-rk-profile-logout]").addEventListener("click", evento => window.RKAuth?.sair(evento));
        perfil.querySelector("img")?.addEventListener("error", evento => evento.currentTarget.remove());
        document.addEventListener("click", evento => { if (!perfil.contains(evento.target)) fechar(); });
        document.addEventListener("keydown", evento => { if (evento.key === "Escape") { fechar(); trigger.focus(); } });
        return true;
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
