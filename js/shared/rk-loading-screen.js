(function (global) {
    "use strict";

    if (!global?.document || global.RKLoading) return;

    const documento = global.document;
    const TOKEN_INICIAL = "pagina-inicial";
    const MENSAGEM_INICIAL = "Preparando sua área de trabalho...";
    const TEMPO_MINIMO = 420;
    const TEMPO_ESTABILIZACAO_INICIAL = 320;
    const TEMPO_TRANSICAO = 320;
    const TEMPO_LIMITE_INICIAL = 25000;
    const DICAS_PADRAO = [
        "Confira medidas, endereço e observações antes de liberar uma ordem de serviço.",
        "Orçamentos aprovados seguem para o fluxo operacional sem criar projetos duplicados.",
        "Recebimentos vinculados mantêm o caixa e o saldo do projeto sempre consistentes.",
        "Em caso de conexão instável, aguarde a sincronização antes de repetir uma operação."
    ];

    const estado = {
        ativos: new Set([TOKEN_INICIAL]),
        sequencia: 0,
        progresso: 7,
        exibidoEm: Date.now(),
        mensagem: MENSAGEM_INICIAL,
        temporizador: null,
        temporizadorOcultar: null,
        temporizadorTransicao: null,
        temporizadorRelogio: null,
        temporizadorLimiteInicial: null,
        montado: false,
        falhou: false,
        recursosEssenciaisComFalha: []
    };

    function criarEstilos() {
        if (documento.getElementById("rkLoadingCriticalStyles")) return;
        const estilos = documento.createElement("style");
        estilos.id = "rkLoadingCriticalStyles";
        estilos.textContent = `
            html.rk-loading-active { background: #061c2c; }
            html.rk-loading-active body { overflow: hidden !important; }
            html.rk-loading-active body > * { visibility: hidden !important; }
            html.rk-loading-active body > #rkLoadingScreen { visibility: visible !important; }
            #rkLoadingScreen[hidden] { display: none !important; }
            #rkLoadingScreen {
                --rk-load-blue: #0d69d5;
                --rk-load-cyan: #22d3ee;
                --rk-load-ink: #eaf7ff;
                position: fixed;
                z-index: 2147483600;
                inset: 0;
                min-width: 280px;
                min-height: 100vh;
                min-height: 100dvh;
                display: grid;
                place-items: center;
                overflow: hidden auto;
                box-sizing: border-box;
                background:
                    radial-gradient(circle at 83% 16%, rgba(34, 211, 238, .24), transparent 28%),
                    radial-gradient(circle at 12% 82%, rgba(13, 105, 213, .28), transparent 34%),
                    linear-gradient(145deg, #041522 0%, #082b45 48%, #0a5274 100%);
                color: var(--rk-load-ink);
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                padding: max(20px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
                opacity: 1;
                visibility: visible;
                transition: opacity .28s ease, visibility .28s ease;
            }
            #rkLoadingScreen::before,
            #rkLoadingScreen::after {
                content: "";
                position: absolute;
                pointer-events: none;
                border: 1px solid rgba(255, 255, 255, .12);
                background: linear-gradient(135deg, rgba(255,255,255,.11), rgba(255,255,255,.015));
                box-shadow: inset 0 1px 0 rgba(255,255,255,.12);
                transform: rotate(19deg);
            }
            #rkLoadingScreen::before { width: 42vw; height: 72vh; top: -34vh; right: -8vw; border-radius: 44px; }
            #rkLoadingScreen::after { width: 36vw; height: 56vh; bottom: -32vh; left: -9vw; border-radius: 50%; }
            #rkLoadingScreen.rk-loading-saindo { opacity: 0; visibility: hidden; }
            #rkLoadingScreen.rk-loading-falha .rk-loading-progress > span { background: #ffc857; box-shadow: none; }
            #rkLoadingScreen.rk-loading-falha .rk-loading-message { color: #ffe4a3; }
            .rk-loading-card {
                position: relative;
                z-index: 1;
                width: min(100%, 520px);
                min-width: 0;
                display: grid;
                gap: 20px;
                box-sizing: border-box;
                border: 1px solid rgba(255,255,255,.2);
                border-radius: 28px;
                background: linear-gradient(155deg, rgba(5,31,50,.88), rgba(8,55,81,.78));
                box-shadow: 0 28px 80px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.13);
                backdrop-filter: blur(18px);
                padding: clamp(24px, 5vw, 40px);
                text-align: center;
            }
            .rk-loading-company { display: grid; justify-items: center; gap: 12px; }
            .rk-loading-rk-logo {
                display: none;
                width: 70px;
                height: 70px;
                object-fit: cover;
                border: 4px solid rgba(255,255,255,.9);
                border-radius: 20px;
                background: #fff;
                box-shadow: 0 12px 28px rgba(0,0,0,.24);
            }
            .rk-loading-kicker { color: #79e8f5; font-size: .72rem; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
            .rk-loading-card h1 { max-width: 430px; margin: 0; color: #fff; font-size: clamp(1.65rem, 6vw, 2.35rem); line-height: 1.08; letter-spacing: -.035em; }
            .rk-loading-message { min-height: 1.5em; margin: 0; color: #c7dce9; font-size: clamp(.9rem, 2.8vw, 1rem); line-height: 1.5; }
            .rk-loading-progress-wrap { display: grid; gap: 9px; text-align: left; }
            .rk-loading-progress-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #bcd3e1; font-size: .72rem; font-weight: 750; }
            .rk-loading-progress {
                position: relative;
                height: 9px;
                overflow: hidden;
                border: 1px solid rgba(255,255,255,.13);
                border-radius: 999px;
                background: rgba(0,0,0,.2);
            }
            .rk-loading-progress > span {
                position: absolute;
                inset: 0 auto 0 0;
                width: 100%;
                border-radius: inherit;
                background: linear-gradient(90deg, var(--rk-load-blue), var(--rk-load-cyan), #e5fbff);
                box-shadow: 0 0 18px rgba(34,211,238,.55);
                transform: scaleX(.07);
                transform-origin: left center;
                transition: transform .35s ease;
            }
            .rk-loading-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
            .rk-loading-meta > div { min-width: 0; display: grid; gap: 4px; border: 1px solid rgba(255,255,255,.1); border-radius: 13px; background: rgba(255,255,255,.055); padding: 11px 12px; text-align: left; }
            .rk-loading-meta span { color: #91afc1; font-size: .64rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
            .rk-loading-meta strong { overflow-wrap: anywhere; color: #effaff; font-size: .8rem; }
            .rk-loading-network { display: inline-flex; align-items: center; gap: 7px; }
            .rk-loading-network::before { content: ""; width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: #43e3a0; box-shadow: 0 0 0 4px rgba(67,227,160,.12); }
            #rkLoadingScreen.rk-loading-offline .rk-loading-network::before { background: #ffc857; box-shadow: 0 0 0 4px rgba(255,200,87,.13); }
            .rk-loading-tip { display: grid; gap: 5px; border-left: 3px solid #32d4e8; border-radius: 5px 14px 14px 5px; background: rgba(255,255,255,.065); padding: 12px 14px; text-align: left; }
            .rk-loading-tip strong { color: #7cebf5; font-size: .66rem; letter-spacing: .08em; text-transform: uppercase; }
            .rk-loading-tip p { margin: 0; color: #d3e5ee; font-size: .76rem; line-height: 1.45; }
            .rk-loading-recarregar { min-height: 42px; border: 1px solid rgba(255,255,255,.22); border-radius: 12px; background: rgba(255,255,255,.1); color: #fff; cursor: pointer; font: inherit; font-size: .78rem; font-weight: 800; padding: 9px 14px; }
            .rk-loading-powered { display: grid; justify-items: center; gap: 5px; margin-top: 2px; }
            .rk-loading-powered > span { color: #86a6b9; font-size: .59rem; font-weight: 750; letter-spacing: .06em; text-transform: uppercase; }
            .rk-loading-conecte { width: 126px; height: 51px; object-fit: contain; border-radius: 9px; opacity: .94; }
            @media (max-width: 520px) {
                #rkLoadingScreen { place-items: stretch center; padding-inline: 12px; }
                .rk-loading-card { align-self: center; gap: 16px; border-radius: 22px; padding: 24px 18px; }
                .rk-loading-rk-logo { width: 60px; height: 60px; border-radius: 17px; }
                .rk-loading-meta { grid-template-columns: 1fr; }
                .rk-loading-meta > div { grid-template-columns: 84px minmax(0,1fr); align-items: center; }
            }
            @media (prefers-reduced-motion: reduce) {
                #rkLoadingScreen, .rk-loading-progress > span { transition-duration: .01ms !important; }
            }
        `;
        (documento.head || documento.documentElement).appendChild(estilos);
    }

    function texto(id, valor) {
        const elemento = documento.getElementById(id);
        if (elemento) elemento.textContent = String(valor || "");
    }

    function dicaAtual() {
        return DICAS_PADRAO[Math.floor(Math.random() * DICAS_PADRAO.length)];
    }

    function atualizarRelogio() {
        texto("rkLoadingHorario", new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    }

    function atualizarConexao() {
        const online = global.navigator?.onLine !== false;
        const tela = documento.getElementById("rkLoadingScreen");
        tela?.classList.toggle("rk-loading-offline", !online);
        texto("rkLoadingConexao", online ? "Conexão disponível" : "Modo offline · usando dados salvos");
        if (!online && estado.ativos.size) atualizarMensagem("Sem internet. Preparando o conteúdo disponível neste aparelho...");
    }

    function montar() {
        if (estado.montado || !documento.body) return documento.getElementById("rkLoadingScreen");
        estado.montado = true;
        const tela = documento.createElement("div");
        tela.id = "rkLoadingScreen";
        tela.setAttribute("role", "status");
        tela.setAttribute("aria-live", "polite");
        tela.setAttribute("aria-label", "Carregando informações do sistema");
        tela.innerHTML = `
            <section class="rk-loading-card">
                <div class="rk-loading-company">
                    <img class="rk-loading-rk-logo" src="/imagens/logo.jpeg" alt="Logo RK Vidraçaria">
                    <span class="rk-loading-kicker" id="rkLoadingEmpresa">RK Vidraçaria · Gestão integrada</span>
                    <h1>Preparando tudo para você</h1>
                    <p class="rk-loading-message" id="rkLoadingMensagem">Preparando sua área de trabalho...</p>
                </div>
                <div class="rk-loading-progress-wrap">
                    <div class="rk-loading-progress-top"><span>Carregando informações</span><strong id="rkLoadingPercentual">7%</strong></div>
                    <div class="rk-loading-progress" id="rkLoadingBarra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="7"><span id="rkLoadingProgresso"></span></div>
                </div>
                <div class="rk-loading-meta">
                    <div><span>Situação</span><strong class="rk-loading-network" id="rkLoadingConexao">Verificando conexão</strong></div>
                    <div><span>Horário</span><strong id="rkLoadingHorario">--:--</strong></div>
                </div>
                <aside class="rk-loading-tip"><strong>Dica operacional</strong><p id="rkLoadingDica"></p></aside>
                <button class="rk-loading-recarregar" id="rkLoadingRecarregar" type="button" hidden>Recarregar página</button>
                <footer class="rk-loading-powered">
                    <span>Tecnologia que conecta sua operação</span>
                    <img class="rk-loading-conecte" src="/assets/conecte-logo.png" alt="Conecte">
                </footer>
            </section>`;
        documento.body.prepend(tela);
        atualizarUsuario();
        texto("rkLoadingEmpresa", "RK Vidraçaria · Gestão integrada");
        texto("rkLoadingMensagem", estado.mensagem);
        texto("rkLoadingDica", dicaAtual());
        documento.getElementById("rkLoadingRecarregar")?.addEventListener("click", () => global.location.reload());
        atualizarRelogio();
        atualizarConexao();
        estado.temporizadorRelogio = global.setInterval(atualizarRelogio, 30000);
        atualizarProgresso(estado.progresso);
        iniciarProgressoAutomatico();
        return tela;
    }

    function atualizarMensagem(mensagem) {
        if (mensagem) estado.mensagem = String(mensagem);
        texto("rkLoadingMensagem", estado.mensagem);
    }

    function atualizarProgresso(valor, mensagem) {
        const numero = Math.max(0, Math.min(100, Number(valor) || 0));
        estado.progresso = numero;
        const barra = documento.getElementById("rkLoadingBarra");
        const preenchimento = documento.getElementById("rkLoadingProgresso");
        if (barra) barra.setAttribute("aria-valuenow", String(Math.round(numero)));
        if (preenchimento) preenchimento.style.transform = `scaleX(${numero / 100})`;
        texto("rkLoadingPercentual", `${Math.round(numero)}%`);
        if (mensagem) atualizarMensagem(mensagem);
        return numero;
    }

    function iniciarProgressoAutomatico() {
        if (estado.temporizador || estado.falhou) return;
        estado.temporizador = global.setInterval(() => {
            if (!estado.ativos.size || estado.progresso >= 91) return;
            const incremento = estado.progresso < 45 ? 4 : estado.progresso < 72 ? 2 : .6;
            atualizarProgresso(Math.min(91, estado.progresso + incremento));
        }, 420);
    }

    function mostrar(mensagem, token) {
        const id = token || `carga-${++estado.sequencia}`;
        const cargaInicialEmAndamento = estado.ativos.has(TOKEN_INICIAL);
        estado.ativos.add(id);
        estado.exibidoEm = estado.ativos.size === 1 ? Date.now() : estado.exibidoEm;
        global.clearTimeout(estado.temporizadorOcultar);
        global.clearTimeout(estado.temporizadorTransicao);
        documento.documentElement.classList.add("rk-loading-active");
        const tela = montar();
        if (tela) {
            tela.hidden = false;
            tela.classList.remove("rk-loading-saindo", "rk-loading-falha");
            tela.setAttribute("role", "status");
        }
        estado.falhou = false;
        if (estado.progresso >= 100) atualizarProgresso(8);
        const mensagemVisivel = cargaInicialEmAndamento && id !== TOKEN_INICIAL
            ? (estado.mensagem || MENSAGEM_INICIAL)
            : (mensagem || "Atualizando informações...");
        atualizarMensagem(mensagemVisivel);
        iniciarProgressoAutomatico();
        return id;
    }

    function ocultar(token = TOKEN_INICIAL) {
        estado.ativos.delete(token);
        if (estado.ativos.size) return false;
        estado.falhou = false;
        global.clearTimeout(estado.temporizadorLimiteInicial);
        atualizarProgresso(100, "Tudo pronto.");
        const espera = Math.max(140, TEMPO_MINIMO - (Date.now() - estado.exibidoEm));
        estado.temporizadorOcultar = global.setTimeout(() => {
            const tela = documento.getElementById("rkLoadingScreen");
            tela?.classList.add("rk-loading-saindo");
            estado.temporizadorTransicao = global.setTimeout(() => {
                if (estado.ativos.size) return;
                if (tela) {
                    tela.hidden = true;
                    tela.classList.remove("rk-loading-saindo");
                }
                documento.documentElement.classList.remove("rk-loading-active");
                global.clearInterval(estado.temporizador);
                estado.temporizador = null;
            }, TEMPO_TRANSICAO);
        }, espera);
        return true;
    }

    async function executar(promessaOuFuncao, mensagem = "Carregando informações...") {
        const token = mostrar(mensagem);
        try {
            return await (typeof promessaOuFuncao === "function" ? promessaOuFuncao() : promessaOuFuncao);
        } finally {
            ocultar(token);
        }
    }

    function informarFalha(mensagem = "Não foi possível concluir o carregamento.") {
        estado.falhou = true;
        global.clearInterval(estado.temporizador);
        estado.temporizador = null;
        global.clearTimeout(estado.temporizadorOcultar);
        global.clearTimeout(estado.temporizadorTransicao);
        global.clearTimeout(estado.temporizadorLimiteInicial);
        documento.documentElement.classList.add("rk-loading-active");
        const tela = montar();
        if (tela) {
            tela.hidden = false;
            tela.classList.remove("rk-loading-saindo");
            tela.classList.add("rk-loading-falha");
            tela.setAttribute("role", "alert");
        }
        atualizarMensagem(mensagem);
        const botao = documento.getElementById("rkLoadingRecarregar");
        if (botao) botao.hidden = false;
        atualizarProgresso(Math.min(estado.progresso, 92));
        texto("rkLoadingPercentual", "Atenção");
    }

    function atualizarUsuario(sessao = global.RKAuth?.obterSessao?.()) {
        const nome = String(sessao?.nome || sessao?.usuario?.displayName || sessao?.email || sessao?.usuario?.email || "").trim();
        const meta = documento.querySelector(".rk-loading-meta");
        if (!meta) return;
        let item = documento.getElementById("rkLoadingUsuarioItem");
        if (!nome) { if (item) item.hidden = true; return; }
        if (!item) {
            item = documento.createElement("div");
            item.id = "rkLoadingUsuarioItem";
            item.innerHTML = '<span>Usuário</span><strong id="rkLoadingUsuario"></strong>';
            meta.appendChild(item);
        }
        item.hidden = false;
        texto("rkLoadingUsuario", nome);
    }

    function iniciarLimiteInicial() {
        global.clearTimeout(estado.temporizadorLimiteInicial);
        estado.temporizadorLimiteInicial = global.setTimeout(() => {
            if (!estado.ativos.size) return;
            const offline = global.navigator?.onLine === false;
            informarFalha(offline
                ? "Sem conexao. O carregamento foi interrompido para evitar uma espera infinita."
                : "O carregamento demorou mais que o esperado e foi interrompido. Tente novamente.");
        }, TEMPO_LIMITE_INICIAL);
    }

    function registrarFalhaDeRecurso(evento) {
        const alvo = evento?.target;
        const tag = String(alvo?.tagName || "").toUpperCase();
        const folhaDeEstilo = tag === "LINK" && String(alvo?.rel || "").toLowerCase().includes("stylesheet");
        if (tag !== "SCRIPT" && !folhaDeEstilo) return;

        const origem = alvo?.src || alvo?.href || "recurso essencial";
        estado.recursosEssenciaisComFalha.push(origem);
        informarFalha("Nao foi possivel carregar todos os recursos da pagina. Verifique a conexao e tente novamente.");
    }

    async function concluirCargaInicial() {
        try {
            if (documento.fonts?.ready) await documento.fonts.ready;
            if (global.RKAuth?.aguardarAutenticacao) await global.RKAuth.aguardarAutenticacao();
            await new Promise(resolve => global.requestAnimationFrame(() => global.requestAnimationFrame(resolve)));
            await new Promise(resolve => global.setTimeout(resolve, TEMPO_ESTABILIZACAO_INICIAL));
        } catch (_) {}
        if (estado.recursosEssenciaisComFalha.length) {
            informarFalha("Nao foi possivel carregar todos os recursos da pagina. Verifique a conexao e tente novamente.");
            return;
        }
        ocultar(TOKEN_INICIAL);
    }

    criarEstilos();
    documento.documentElement.classList.add("rk-loading-active");
    iniciarLimiteInicial();
    if (documento.body) montar();
    else documento.addEventListener("DOMContentLoaded", montar, { once: true });

    global.addEventListener("online", atualizarConexao);
    global.addEventListener("offline", atualizarConexao);
    global.addEventListener("rk:auth-state-changed", evento => atualizarUsuario(evento.detail?.sessao));
    global.addEventListener("error", registrarFalhaDeRecurso, true);
    global.addEventListener("load", () => void concluirCargaInicial(), { once: true });

    global.RKLoading = {
        start: mostrar,
        update: atualizarProgresso,
        finish: ocultar,
        run: executar,
        initial: executar,
        isBooting: () => estado.ativos.has(TOKEN_INICIAL),
        fail: informarFalha
    };
})(typeof window !== "undefined" ? window : globalThis);
