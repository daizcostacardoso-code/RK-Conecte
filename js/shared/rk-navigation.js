const RKNavigation = {
    // Metadados únicos usados pelo desktop e pelos dois estados mobile.
    navigationConfig: [
        { id: "visao-geral", rotulo: "Visão geral", items: [{ rotulo: "Dashboard", pagina: "dashboard-comercial.html", atalho: true, ordemAtalho: 1, icone: "inicio" }] },
        { id: "comercial", rotulo: "Comercial", items: [{ rotulo: "Clientes", pagina: "clientes.html", atalho: true, ordemAtalho: 2, icone: "clientes" }, { rotulo: "Projetos", pagina: "projetos.html", icone: "obras" }, { rotulo: "Produtos", pagina: "produtos.html" }, { rotulo: "Orçamento", pagina: "orcamento-inteligente.html", atalho: true, ordemAtalho: 4, destaque: true, icone: "orcamentos" }] },
        { id: "operacao", rotulo: "Operação", items: [{ rotulo: "Medições", rotuloAtalho: "Medir obra", pagina: "medicao-obra.html", atalho: true, ordemAtalho: 3, icone: "medicao" }, { rotulo: "Notas", pagina: "nota-servico.html" }, { rotulo: "Arquivos", pagina: "arquivos.html" }, { rotulo: "Caixa", pagina: "caixa.html" }] },
        { id: "conta", rotulo: "Conta", items: [{ rotulo: "Acessos", pagina: "acessos.html", perfis: ["admin"] }] }
    ],
    // Conjunto Lucide incorporado localmente para preservar consistência e uso offline.
    iconsMobile: {
        inicio: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
        clientes: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle>',
        obras: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path><path d="M8 10v4"></path><path d="M12 10v2"></path><path d="M16 10v6"></path>',
        medicao: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"></path><path d="m14.5 12.5 2-2"></path><path d="m11.5 9.5 2-2"></path><path d="m8.5 6.5 2-2"></path><path d="m17.5 15.5 2-2"></path>',
        orcamentos: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>',
        mais: '<circle cx="4" cy="12" r="1.6"></circle><circle cx="12" cy="12" r="1.6"></circle><circle cx="20" cy="12" r="1.6"></circle>',
        fechar: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
        padrao: '<path d="M12 5v14"></path><path d="M5 12h14"></path>'
    },
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
        "nota-servico.html",
        "login.html",
        "loading.html"
    ],
    monitorConexaoPreparado: false,
    controladorPainelConfiguracoes: null,
    controladorPainelNotificacoes: null,
    chavePreferenciasInterface: "rk_preferencias_interface",
    shellInicialPreparado: false,
    iconesConfiguracoes: {
        engrenagem: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle>',
        notificacoes: '<path d="M10.3 21a2 2 0 0 0 3.4 0"></path><path d="M4 17h16"></path><path d="M18 17v-6a6 6 0 1 0-12 0v6"></path>',
        funcionamento: '<path d="M20 7h-9"></path><path d="M14 17H5"></path><circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle>',
        empresa: '<path d="M3 21h18"></path><path d="M6 21V5l6-3 6 3v16"></path><path d="M9 9h.01"></path><path d="M15 9h.01"></path><path d="M9 13h.01"></path><path d="M15 13h.01"></path><path d="M9 17h.01"></path><path d="M15 17h.01"></path>',
        usuario: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
        sair: '<path d="M10 17l5-5-5-5"></path><path d="M15 12H3"></path><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>',
        fechar: '<path d="m18 6-12 12"></path><path d="m6 6 12 12"></path>',
        chevron: '<path d="m9 18 6-6-6-6"></path>'
    },

    iniciar() {
        const paginaPublica = this.paginaPublica();
        if (!paginaPublica) {
            this.aplicarPreferenciasInterface();
            this.configurarIndicadorConexao();
            this.renderizarCabecalhoInterno();
        }
        const lista = document.querySelector("header nav ul");

        if (!lista) {
            return false;
        }

        if (paginaPublica) {
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
        if (window.matchMedia("(min-width: 701px)").matches) this.garantirBotaoFecharDrawer(lista);
        this.renderizarPerfilHeader();
        document.documentElement.classList.remove("rk-app-interna-preload");
        this.removerAtalhosSistema();
        this.renderizarMenuInferior();
        this.protegerLinksInternos(lista);

        return true;
    },

    prepararShellInicial() {
        if (this.shellInicialPreparado || this.paginaPublica() || !document.body) return false;
        document.body.classList.add("rk-app-interna");
        this.aplicarPreferenciasInterface();
        this.configurarIndicadorConexao();
        const header = this.renderizarCabecalhoInterno();
        const lista = header.querySelector("nav ul");
        lista.innerHTML = this.obterLinksVisiveis().map(link => this.renderizarLink(link)).join("");
        lista.classList.add("rk-nav-principal");
        this.prepararTelaInterna(lista);
        this.renderizarPerfilHeader();
        this.renderizarMenuInferior();
        this.protegerLinksInternos(lista);
        this.shellInicialPreparado = true;
        document.documentElement.classList.remove("rk-app-interna-preload");
        window.dispatchEvent(new CustomEvent("rk:shell-ready"));
        window.RKLoading?.marcarShellPronto?.();
        return true;
    },

    configurarIndicadorConexao() {
        const atualizar = () => document.documentElement.classList.toggle("rk-offline", navigator.onLine === false);
        atualizar();
        if (this.monitorConexaoPreparado) return;
        this.monitorConexaoPreparado = true;
        window.addEventListener("online", atualizar);
        window.addEventListener("offline", atualizar);
    },

    renderizarCabecalhoInterno() {
        let header = document.querySelector("body > header");
        if (!header) {
            header = document.createElement("header");
            document.body.prepend(header);
        }
        header.className = "rk-internal-header";
        header.dataset.rkInternalHeader = "true";
        if (!header.querySelector(":scope > .container")) {
            header.innerHTML = `<span class="rk-internal-header__crossover" aria-hidden="true"></span><div class="container"><a class="marca-header marca-header-compacta rk-internal-header__brand" href="${this.escaparAtributo(this.criarHref("dashboard-comercial.html"))}" aria-label="RK Vidraçaria — abrir dashboard"><img src="/imagens/logo.jpeg" alt="Logo RK Vidraçaria"><span><strong>RK Vidraçaria</strong><small>Sistema interno</small></span></a><nav aria-label="Navegação principal"><ul></ul></nav></div>`;
        }
        return header;
    },

    obterLinksVisiveis() { return this.obterItensNavegacao(); },
    obterItensNavegacao() {
        const perfil = window.RKAuth?.obterSessao?.()?.perfil;
        return this.navigationConfig.flatMap(grupo => grupo.items.filter(item => !item.perfis || item.perfis.includes(perfil)));
    },
    obterGruposNavegacao() {
        const itens = this.obterItensNavegacao();
        return this.navigationConfig.map(grupo => ({ ...grupo, items: grupo.items.filter(item => itens.includes(item)) })).filter(grupo => grupo.items.length);
    },

    removerAtalhosSistema() {
        document.querySelectorAll(".rk-system-shortcuts").forEach(elemento => elemento.remove());
        return true;
    },

    renderizarNavegacaoAdaptativa() {
        let backdrop = document.querySelector(".rk-adaptive-mobile-navigation__backdrop");
        let nav = document.querySelector(".rk-adaptive-mobile-navigation");
        const atalhos = this.obterItensNavegacao()
            .filter(item => item.atalho)
            .sort((itemA, itemB) => itemA.ordemAtalho - itemB.ordemAtalho)
            .slice(0, 4);
        const paginaAtualEmAtalho = atalhos.some(item => this.paginaAtual(item.pagina));
        const grupos = this.obterGruposNavegacao().map(grupo => ({ ...grupo, items: grupo.items.filter(item => !item.atalho) })).filter(grupo => grupo.items.length);
        const grupoAtivo = grupos.find(grupo => grupo.items.some(item => this.paginaAtual(item.pagina)))?.id || grupos[0]?.id;
        const sessao = window.RKAuth?.obterSessao?.() || {};
        const nomePerfil = String(sessao.nomeUsuario || sessao.email || "Conta").trim();
        const cargoPerfil = sessao.perfil === "admin" ? "Administrador" : (sessao.logado ? "Funcionário" : "Acesso em validação");
        const iniciaisPerfil = nomePerfil.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]).join("").toUpperCase() || "U";
        const fotoPerfil = String(sessao.fotoUsuario || "").trim();
        const perfilMobile = `<section class="rk-adaptive-mobile-navigation__profile"><div class="rk-adaptive-mobile-navigation__cover" aria-hidden="true"></div><div class="rk-adaptive-mobile-navigation__profile-body"><span class="rk-adaptive-mobile-navigation__avatar" aria-hidden="true"><span>${this.escapar(iniciaisPerfil)}</span>${fotoPerfil ? `<img src="${this.escaparAtributo(fotoPerfil)}" alt="">` : ""}</span><div class="rk-adaptive-mobile-navigation__profile-copy"><strong>${this.escapar(nomePerfil)}</strong><small>${this.escapar(cargoPerfil)}</small></div><span class="rk-adaptive-mobile-navigation__profile-label">Perfil</span></div></section>`;
        if (!backdrop) backdrop = document.createElement("button");
        backdrop.type = "button";
        backdrop.className = "rk-adaptive-mobile-navigation__backdrop";
        backdrop.dataset.state = "collapsed";
        backdrop.setAttribute("aria-label", "Recolher navegação");
        if (!nav) nav = document.createElement("nav");
        nav.className = "rk-adaptive-mobile-navigation";
        nav.id = "rkAdaptiveMobileNavigation";
        nav.dataset.state = "collapsed";
        nav.dataset.currentPage = paginaAtualEmAtalho ? "shortcut" : "more";
        nav.dataset.scrollVisibility = "shown";
        nav.setAttribute("aria-label", "Navegação principal");
        nav.innerHTML = `<div class="rk-adaptive-mobile-navigation__header">${perfilMobile}</div><div class="rk-adaptive-mobile-navigation__content">${grupos.map(grupo => `<section class="rk-adaptive-mobile-navigation__group" data-group="${this.escaparAtributo(grupo.id)}"><button type="button" aria-expanded="${grupo.id === grupoAtivo}" aria-controls="rkGroup${this.escaparAtributo(grupo.id)}"><span>${this.escapar(grupo.rotulo)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"></path></svg></button><div id="rkGroup${this.escaparAtributo(grupo.id)}">${grupo.items.map(item => this.renderizarLinkMobile(item)).join("")}</div></section>`).join("")}</div><div class="rk-adaptive-mobile-navigation__shortcuts">${this.renderizarAtalhosMobile(atalhos)}<button type="button" class="rk-adaptive-mobile-navigation__toggle" aria-label="Abrir navegação" aria-expanded="false" aria-controls="rkAdaptiveMobileNavigation"><svg viewBox="0 0 24 24" aria-hidden="true"><g data-icon-more>${this.iconsMobile.mais}</g><g data-icon-close>${this.iconsMobile.fechar}</g></svg><span>Mais</span></button></div>`;
        if (!backdrop.isConnected) document.body.appendChild(backdrop);
        if (!nav.isConnected) document.body.appendChild(nav);
        this.configurarNavegacaoAdaptativa(nav, backdrop);
        nav.querySelector(".rk-adaptive-mobile-navigation__avatar img")?.addEventListener("error", evento => evento.currentTarget.remove());
        this.protegerLinksInternos(nav);
    },

    renderizarLinkMobile(item) {
        const ativo = this.paginaAtual(item.pagina);
        return `<a href="${this.escaparAtributo(this.criarHref(item.pagina))}"${ativo ? ' aria-current="page"' : ""}>${this.escapar(item.rotulo)}</a>`;
    },

    renderizarAtalhosMobile(itens) {
        return itens.map(item => `<a href="${this.escaparAtributo(this.criarHref(item.pagina))}"${this.paginaAtual(item.pagina) ? ' aria-current="page"' : ""}${item.destaque ? ' class="rk-adaptive-mobile-navigation__action"' : ""}><svg viewBox="0 0 24 24" aria-hidden="true">${this.iconsMobile[item.icone] || this.iconsMobile.padrao}</svg><span>${this.escapar(item.rotuloAtalho || item.rotulo)}</span></a>`).join("");
    },

    configurarNavegacaoAdaptativa(nav, backdrop) {
        const toggle = nav.querySelector(".rk-adaptive-mobile-navigation__toggle"), labelToggle = toggle.querySelector("span");
        let opener = null, previousOverflow = "", fechamentoPendente = null;
        let ultimaRolagem = Math.max(0, window.scrollY), rolagemAgendada = false;
        const mostrarBarra = () => { nav.dataset.scrollVisibility = "shown"; };
        const atualizarBarraPelaRolagem = () => {
            rolagemAgendada = false;
            const rolagemAtual = Math.max(0, window.scrollY);
            if (nav.dataset.state !== "collapsed") {
                ultimaRolagem = rolagemAtual;
                mostrarBarra();
                return;
            }
            const deslocamento = rolagemAtual - ultimaRolagem;
            if (Math.abs(deslocamento) < 8) return;
            nav.dataset.scrollVisibility = deslocamento > 0 ? "hidden" : "shown";
            ultimaRolagem = rolagemAtual;
        };
        const aoRolar = () => {
            if (rolagemAgendada) return;
            rolagemAgendada = true;
            window.requestAnimationFrame(atualizarBarraPelaRolagem);
        };
        if (this.aoRolarNavegacaoAdaptativa) window.removeEventListener("scroll", this.aoRolarNavegacaoAdaptativa);
        this.aoRolarNavegacaoAdaptativa = aoRolar;
        window.addEventListener("scroll", aoRolar, { passive: true });
        const resetar = () => {
            window.clearTimeout(fechamentoPendente);
            fechamentoPendente = null;
            mostrarBarra();
            nav.dataset.state = "collapsed";
            backdrop.dataset.state = "collapsed";
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Abrir navegação");
            labelToggle.textContent = "Mais";
            document.body.style.overflow = previousOverflow;
            opener = null;
        };
        const fechar = () => {
            if (nav.dataset.state !== "expanded") return;
            nav.dataset.state = "closing";
            backdrop.dataset.state = "collapsed";
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Abrir navegação");
            labelToggle.textContent = "Mais";
            fechamentoPendente = window.setTimeout(() => {
                nav.dataset.state = "collapsed";
                document.body.style.overflow = previousOverflow;
                opener?.focus({ preventScroll: true });
                opener = null;
                fechamentoPendente = null;
            }, 320);
        };
        const abrir = () => { window.clearTimeout(fechamentoPendente); fechamentoPendente = null; mostrarBarra(); opener = document.activeElement; previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; nav.dataset.state = "expanded"; backdrop.dataset.state = "expanded"; toggle.setAttribute("aria-expanded", "true"); toggle.setAttribute("aria-label", "Fechar navegação"); labelToggle.textContent = "Fechar"; nav.querySelector(".rk-adaptive-mobile-navigation__group > button")?.focus({ preventScroll: true }); };
        toggle.addEventListener("click", () => nav.dataset.state === "collapsed" ? abrir() : fechar());
        backdrop.addEventListener("click", fechar);
        nav.addEventListener("click", event => { if (event.target.closest("a")) fechar(); const group = event.target.closest(".rk-adaptive-mobile-navigation__group > button"); if (group) nav.querySelectorAll(".rk-adaptive-mobile-navigation__group > button").forEach(button => button.setAttribute("aria-expanded", String(button === group && button.getAttribute("aria-expanded") !== "true"))); });
        nav.addEventListener("keydown", event => {
            if (event.key === "Escape") fechar();
            if (event.key === "Tab" && nav.dataset.state === "expanded") {
                const focaveis = [...nav.querySelectorAll("a, button")].filter(elemento => !elemento.disabled);
                const primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
                if (event.shiftKey && document.activeElement === primeiro) { event.preventDefault(); ultimo?.focus(); }
                if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primeiro?.focus(); }
            }
        });
        const desktopMedia = window.matchMedia("(min-width: 701px)");
        const fecharAoMudarParaDesktop = event => { if (event.matches) { mostrarBarra(); fechar(); } };
        if (typeof desktopMedia.addEventListener === "function") desktopMedia.addEventListener("change", fecharAoMudarParaDesktop);
        else desktopMedia.addListener?.(fecharAoMudarParaDesktop);
        window.addEventListener("rk:loading-start", resetar);
        window.addEventListener("rk:loading-end", resetar);
    },

    renderizarMenuInferior() {
        this.renderizarNavegacaoAdaptativa();
    },

    prepararTelaInterna(lista) {
        document.body.classList.add("rk-app-interna");
        const desktopMedia = window.matchMedia("(min-width: 701px)");
        if (desktopMedia.matches) this.prepararMenuMobile(lista);
        else {
            const aoMudarParaDesktop = event => { if (event.matches) this.prepararMenuMobile(lista); };
            if (typeof desktopMedia.addEventListener === "function") desktopMedia.addEventListener("change", aoMudarParaDesktop, { once: true });
            else desktopMedia.addListener?.(aoMudarParaDesktop);
        }
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
        document.body.classList.remove("rk-header-panel-aberto");
        const container = document.querySelector("body > header > .container");
        const sessao = window.RKAuth?.obterSessao?.() || {};
        if (!container) return false;

        const autenticado = Boolean(sessao.logado);
        const nome = String(sessao.nomeUsuario || sessao.email || "Conta em validação").trim();
        const cargo = sessao.perfil === "admin" ? "Administrador" : (autenticado ? "Funcionário" : "Aguardando autenticação");
        const email = String(sessao.email || "").trim();
        const empresaConfigurada = typeof Config !== "undefined" ? Config?.empresa?.nome : window.Config?.empresa?.nome;
        const empresa = String(empresaConfigurada || "RK Vidraçaria").trim();
        const densidade = this.obterPreferenciasInterface().densidade;
        const acoes = container.querySelector(":scope > .rk-header-actions") || document.createElement("section");
        const notificacoes = acoes.querySelector(":scope > .rk-header-notifications") || document.createElement("section");
        const configuracoes = acoes.querySelector(":scope > .rk-header-settings") || document.createElement("section");
        acoes.className = "rk-header-actions";
        acoes.setAttribute("aria-label", "Ações do sistema");
        notificacoes.className = "rk-header-notifications";
        configuracoes.className = "rk-header-settings";
        notificacoes.innerHTML = [
            `<button type="button" class="rk-header-action-button rk-header-notifications__trigger" aria-label="Abrir notificações — 3 alertas" aria-haspopup="dialog" aria-expanded="false" aria-controls="rkHeaderNotificationsPanel" title="Notificações">`,
            `<svg viewBox="0 0 24 24" aria-hidden="true">${this.iconesConfiguracoes.notificacoes}</svg>`,
            `<span class="rk-header-notifications__badge" aria-hidden="true">3</span>`,
            `</button>`,
            `<div class="rk-header-notifications__panel" id="rkHeaderNotificationsPanel" role="dialog" aria-modal="false" aria-labelledby="rkHeaderNotificationsTitle" hidden>`,
            `<header class="rk-header-notifications__header">`,
            `<div><small>Central de alertas</small><strong id="rkHeaderNotificationsTitle">Notificações</strong></div>`,
            `<button type="button" class="rk-header-notifications__close" aria-label="Fechar notificações"><svg viewBox="0 0 24 24" aria-hidden="true">${this.iconesConfiguracoes.fechar}</svg></button>`,
            `</header>`,
            `<div class="rk-header-notifications__list">`,
            this.renderizarAlertaSistema("conexao", navigator.onLine === false ? "Conexão indisponível" : "Sistema conectado", navigator.onLine === false ? "Alguns recursos podem ficar limitados até a internet voltar." : "A sincronização e os serviços online estão disponíveis.", navigator.onLine === false ? "critical" : "success"),
            this.renderizarAlertaSistema("atualizacao", "Sistema atualizado", `${this.obterVersao()} em uso, com verificação automática de novas versões.`, "info"),
            this.renderizarAlertaSistema("visual", "Preferência visual", `O modo ${densidade === "compact" ? "compacto" : "normal"} está ativo nesta tela.`, "neutral"),
            `</div>`,
            `<footer class="rk-header-notifications__footer">`,
            `<button type="button" data-rk-notifications-read>Marcar alertas como lidos</button>`,
            `</footer>`,
            `</div>`
        ].join("");
        configuracoes.innerHTML = [
            `<button type="button" class="rk-header-action-button rk-header-settings__trigger" aria-label="Abrir configurações" aria-haspopup="dialog" aria-expanded="false" aria-controls="rkHeaderSettingsPanel" title="Configurações">`,
            `<svg viewBox="0 0 24 24" aria-hidden="true">${this.iconesConfiguracoes.engrenagem}</svg>`,
            `</button>`,
            `<div class="rk-header-settings__panel" id="rkHeaderSettingsPanel" role="dialog" aria-modal="false" aria-labelledby="rkHeaderSettingsTitle" hidden>`,
            `<header class="rk-header-settings__panel-header">`,
            `<div><small>Central do sistema</small><strong id="rkHeaderSettingsTitle">Configurações</strong></div>`,
            `<button type="button" class="rk-header-settings__close" aria-label="Fechar configurações"><svg viewBox="0 0 24 24" aria-hidden="true">${this.iconesConfiguracoes.fechar}</svg></button>`,
            `</header>`,
            `<div class="rk-header-settings__panel-body">`,
            `<section class="rk-header-settings__appearance" aria-labelledby="rkSettingsAppearanceTitle">`,
            `<div><strong id="rkSettingsAppearanceTitle">Visual da interface</strong><small>Escolha a densidade das informações.</small></div>`,
            `<div class="rk-header-settings__density" role="group" aria-label="Densidade da interface">`,
            `<button type="button" data-rk-density="normal" aria-pressed="${densidade === "normal"}">Normal</button>`,
            `<button type="button" data-rk-density="compact" aria-pressed="${densidade === "compact"}">Compacto</button>`,
            `</div>`,
            `</section>`,
            `<div class="rk-header-settings__sections" aria-label="Áreas de configuração">`,
            this.renderizarSecaoConfiguracoes("funcionamento", "Funcionamento", "Regras e preferências do sistema", [
                `<span><b>Conectividade</b><small data-rk-settings-connection>${navigator.onLine === false ? "Sem conexão" : "Sistema conectado"}</small></span>`,
                `<span><b>Atualizações</b><small>Atualização automática ativa</small></span>`
            ].join("")),
            this.renderizarSecaoConfiguracoes("empresa", "Empresa", "Identidade e dados corporativos", [
                `<span><b>Empresa atual</b><small>${this.escapar(empresa)}</small></span>`,
                `<span class="rk-header-settings__future"><b>Novas opções</b><small>Área preparada para dados fiscais e preferências</small></span>`
            ].join("")),
            this.renderizarSecaoConfiguracoes("usuario", "Configuração do usuário", "Conta, perfil e permissões", [
                `<span><b>${this.escapar(nome)}</b><small>${this.escapar(email || cargo)}</small></span>`,
                `<span><b>Perfil</b><small>${this.escapar(cargo)}</small></span>`,
                sessao.perfil === "admin" ? `<a href="${this.escaparAtributo(this.criarHref("acessos.html"))}">Gerenciar usuários e acessos<svg viewBox="0 0 24 24" aria-hidden="true">${this.iconesConfiguracoes.chevron}</svg></a>` : ""
            ].join("")),
            `</div>`,
            `<p class="rk-header-settings__status" data-rk-settings-status role="status" aria-live="polite"></p>`,
            `</div>`,
            `<footer class="rk-header-settings__footer">`,
            `<button type="button" class="rk-header-settings__logout" data-rk-settings-logout${autenticado ? "" : " disabled"}><svg viewBox="0 0 24 24" aria-hidden="true">${this.iconesConfiguracoes.sair}</svg><span>${autenticado ? "Sair do sistema" : "Validando acesso..."}</span></button>`,
            `</footer>`,
            `</div>`
        ].join("");
        acoes.append(notificacoes, configuracoes);
        if (!acoes.isConnected) container.appendChild(acoes);

        this.configurarPainelNotificacoes(notificacoes);
        this.configurarPainelConfiguracoes(configuracoes);
        return true;
    },

    renderizarAlertaSistema(tipo, titulo, descricao, estado = "neutral") {
        const icone = tipo === "conexao" ? this.iconesConfiguracoes.funcionamento : tipo === "visual" ? this.iconesConfiguracoes.engrenagem : this.iconesConfiguracoes.notificacoes;
        return [
            `<article class="rk-header-notifications__item is-${this.escaparAtributo(estado)}" data-rk-system-alert="${this.escaparAtributo(tipo)}">`,
            `<span class="rk-header-notifications__item-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${icone}</svg></span>`,
            `<div><strong>${this.escapar(titulo)}</strong><p>${this.escapar(descricao)}</p><small>Agora</small></div>`,
            `</article>`
        ].join("");
    },

    renderizarSecaoConfiguracoes(id, titulo, descricao, conteudo) {
        const identificador = `rkSettingsSection${id[0].toUpperCase()}${id.slice(1)}`;
        return [
            `<section class="rk-header-settings__section" data-rk-settings-section="${this.escaparAtributo(id)}">`,
            `<button type="button" class="rk-header-settings__section-trigger" aria-expanded="false" aria-controls="${identificador}">`,
            `<span class="rk-header-settings__section-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${this.iconesConfiguracoes[id]}</svg></span>`,
            `<span><strong>${this.escapar(titulo)}</strong><small>${this.escapar(descricao)}</small></span>`,
            `<svg class="rk-header-settings__section-chevron" viewBox="0 0 24 24" aria-hidden="true">${this.iconesConfiguracoes.chevron}</svg>`,
            `</button>`,
            `<div class="rk-header-settings__section-content" id="${identificador}" hidden>${conteudo}</div>`,
            `</section>`
        ].join("");
    },

    configurarPainelNotificacoes(notificacoes) {
        this.controladorPainelNotificacoes?.abort();
        this.controladorPainelNotificacoes = new AbortController();
        const signal = this.controladorPainelNotificacoes.signal;
        const gatilho = notificacoes.querySelector(".rk-header-notifications__trigger");
        const painel = notificacoes.querySelector(".rk-header-notifications__panel");
        const fecharBotao = notificacoes.querySelector(".rk-header-notifications__close");
        const badge = notificacoes.querySelector(".rk-header-notifications__badge");
        const atualizarCamada = () => {
            const existePainelAberto = Boolean(document.querySelector(".rk-header-settings.is-open, .rk-header-notifications.is-open"));
            document.body.classList.toggle("rk-header-panel-aberto", existePainelAberto);
        };
        const fechar = ({ devolverFoco = false } = {}) => {
            painel.hidden = true;
            gatilho.setAttribute("aria-expanded", "false");
            notificacoes.classList.remove("is-open");
            atualizarCamada();
            if (devolverFoco) gatilho.focus({ preventScroll: true });
        };
        const abrir = () => {
            painel.hidden = false;
            gatilho.setAttribute("aria-expanded", "true");
            notificacoes.classList.add("is-open");
            atualizarCamada();
            fecharBotao.focus({ preventScroll: true });
        };
        const atualizarConexao = () => {
            const alerta = notificacoes.querySelector('[data-rk-system-alert="conexao"]');
            if (!alerta) return;
            const online = navigator.onLine !== false;
            alerta.classList.toggle("is-critical", !online);
            alerta.classList.toggle("is-success", online);
            alerta.querySelector("strong").textContent = online ? "Sistema conectado" : "Conexão indisponível";
            alerta.querySelector("p").textContent = online
                ? "A sincronização e os serviços online estão disponíveis."
                : "Alguns recursos podem ficar limitados até a internet voltar.";
        };

        gatilho.addEventListener("click", () => painel.hidden ? abrir() : fechar({ devolverFoco: true }), { signal });
        fecharBotao.addEventListener("click", () => {
            fechar();
            fecharBotao.blur();
        }, { signal });
        notificacoes.querySelector("[data-rk-notifications-read]").addEventListener("click", evento => {
            badge.hidden = true;
            gatilho.setAttribute("aria-label", "Abrir notificações — alertas lidos");
            evento.currentTarget.textContent = "Alertas lidos";
            evento.currentTarget.disabled = true;
            notificacoes.querySelectorAll(".rk-header-notifications__item").forEach(item => item.classList.add("is-read"));
        }, { signal });
        document.addEventListener("pointerdown", evento => {
            if (!painel.hidden && !notificacoes.contains(evento.target)) fechar();
        }, { signal });
        document.addEventListener("keydown", evento => {
            if (evento.key === "Escape" && !painel.hidden) fechar({ devolverFoco: true });
        }, { signal });
        window.addEventListener("online", atualizarConexao, { signal });
        window.addEventListener("offline", atualizarConexao, { signal });
    },

    configurarPainelConfiguracoes(configuracoes) {
        this.controladorPainelConfiguracoes?.abort();
        this.controladorPainelConfiguracoes = new AbortController();
        const signal = this.controladorPainelConfiguracoes.signal;
        const gatilho = configuracoes.querySelector(".rk-header-settings__trigger");
        const painel = configuracoes.querySelector(".rk-header-settings__panel");
        const fecharBotao = configuracoes.querySelector(".rk-header-settings__close");
        const status = configuracoes.querySelector("[data-rk-settings-status]");
        const atualizarCamada = () => {
            const existePainelAberto = Boolean(document.querySelector(".rk-header-settings.is-open, .rk-header-notifications.is-open"));
            document.body.classList.toggle("rk-header-panel-aberto", existePainelAberto);
        };
        const atualizarSelecaoDensidade = densidade => {
            configuracoes.querySelectorAll("[data-rk-density]").forEach(botao => {
                botao.setAttribute("aria-pressed", String(botao.dataset.rkDensity === densidade));
            });
        };
        const fechar = ({ devolverFoco = false } = {}) => {
            painel.hidden = true;
            gatilho.setAttribute("aria-expanded", "false");
            configuracoes.classList.remove("is-open");
            atualizarCamada();
            if (devolverFoco) gatilho.focus({ preventScroll: true });
        };
        const abrir = () => {
            painel.hidden = false;
            gatilho.setAttribute("aria-expanded", "true");
            configuracoes.classList.add("is-open");
            atualizarCamada();
            fecharBotao.focus({ preventScroll: true });
        };

        gatilho.addEventListener("click", () => painel.hidden ? abrir() : fechar({ devolverFoco: true }), { signal });
        fecharBotao.addEventListener("click", () => fechar({ devolverFoco: true }), { signal });
        configuracoes.querySelector("[data-rk-settings-logout]").addEventListener("click", evento => window.RKAuth?.sair(evento), { signal });
        configuracoes.querySelectorAll("[data-rk-density]").forEach(botao => botao.addEventListener("click", () => {
            const densidade = this.definirDensidadeInterface(botao.dataset.rkDensity);
            atualizarSelecaoDensidade(densidade);
            status.textContent = densidade === "compact" ? "Visual compacto ativado." : "Visual normal ativado.";
            const alertaVisual = configuracoes.closest(".rk-header-actions")?.querySelector('[data-rk-system-alert="visual"] p');
            if (alertaVisual) alertaVisual.textContent = `O modo ${densidade === "compact" ? "compacto" : "normal"} está ativo nesta tela.`;
        }, { signal }));
        configuracoes.querySelectorAll(".rk-header-settings__section-trigger").forEach(botao => botao.addEventListener("click", () => {
            const conteudo = configuracoes.querySelector(`#${botao.getAttribute("aria-controls")}`);
            const expandir = botao.getAttribute("aria-expanded") !== "true";
            botao.setAttribute("aria-expanded", String(expandir));
            conteudo.hidden = !expandir;
            const secao = botao.closest("[data-rk-settings-section]")?.dataset.rkSettingsSection || "";
            window.dispatchEvent(new CustomEvent("rk:settings-section", { detail: { secao, expandida: expandir } }));
        }, { signal }));
        configuracoes.querySelectorAll("a").forEach(link => link.addEventListener("click", () => fechar(), { signal }));
        document.addEventListener("pointerdown", evento => {
            if (!painel.hidden && !configuracoes.contains(evento.target)) fechar();
        }, { signal });
        document.addEventListener("keydown", evento => {
            if (evento.key === "Escape" && !painel.hidden) fechar({ devolverFoco: true });
        }, { signal });
        const atualizarConexao = () => {
            const indicador = configuracoes.querySelector("[data-rk-settings-connection]");
            if (indicador) indicador.textContent = navigator.onLine === false ? "Sem conexão" : "Sistema conectado";
        };
        window.addEventListener("online", atualizarConexao, { signal });
        window.addEventListener("offline", atualizarConexao, { signal });
    },

    obterPreferenciasInterface() {
        let preferencias = {};
        try {
            preferencias = JSON.parse(localStorage.getItem(this.chavePreferenciasInterface) || "{}") || {};
        } catch (erro) {
            preferencias = {};
        }
        return {
            ...preferencias,
            densidade: preferencias.densidade === "compact" ? "compact" : "normal"
        };
    },

    aplicarPreferenciasInterface() {
        const preferencias = this.obterPreferenciasInterface();
        document.documentElement.dataset.rkDensity = preferencias.densidade;
        document.body?.classList.toggle("rk-density-compact", preferencias.densidade === "compact");
        return preferencias;
    },

    definirDensidadeInterface(densidade) {
        const valor = densidade === "compact" ? "compact" : "normal";
        const preferencias = { ...this.obterPreferenciasInterface(), densidade: valor };
        try {
            localStorage.setItem(this.chavePreferenciasInterface, JSON.stringify(preferencias));
        } catch (erro) {}
        document.documentElement.dataset.rkDensity = valor;
        document.body?.classList.toggle("rk-density-compact", valor === "compact");
        window.dispatchEvent(new CustomEvent("rk:interface-density-changed", { detail: { densidade: valor } }));
        return valor;
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

if (!RKNavigation.prepararShellInicial()) window.RKLoading?.marcarShellPronto?.();

document.addEventListener("DOMContentLoaded", async () => {
    if (!RKNavigation.prepararShellInicial()) window.RKLoading?.marcarShellPronto?.();
    if (window.RKAuth?.paginaAtualProtegida()) {
        const sessao = await RKAuth.aguardarAutenticacao();
        if (!sessao) return;
    }
    RKNavigation.iniciar();
});

window.addEventListener("rk:auth-state-changed", () => {
    if (document.readyState !== "loading") RKNavigation.iniciar();
});
