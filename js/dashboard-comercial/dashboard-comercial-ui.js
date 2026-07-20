const DashboardComercialUI = {
    rootId: "dashboardComercialRoot",
    controller: null,

    renderizar(estado = {}, controller = null) {
        this.controller = controller || this.controller;
        const root = this.obterRoot();
        if (!root) return false;

        root.innerHTML = [
            `<section class="dashboard-comercial-shell" aria-labelledby="dashboardComercialTitulo">`,
            this.renderizarCabecalho(estado),
            `<div class="dashboard-comercial-content">`,
            this.renderizarAtalhos(estado.sessao || {}),
            this.renderizarCards(estado.kpis || {}, estado.resumoOrcamentos || {}, estado.resumoObras || {}, estado.resumoCaixa || {}),
            `<div class="dashboard-comercial-operacao-grid">`,
            this.renderizarCaixa(estado.resumoCaixa || {}),
            this.renderizarObras(estado.resumoObras || {}),
            `</div>`,
            `<div class="dashboard-comercial-insights-grid">`,
            this.renderizarValorNegociacao(estado.valorNegociacao || {}, estado.resumoOrcamentos || {}),
            this.renderizarAcoes(estado.acoes || []),
            `</div>`,
            `<section class="dashboard-comercial-section dashboard-comercial-orcamentos" aria-labelledby="ultimosOrcamentosTitulo">`,
            this.renderizarTituloSecao("ultimosOrcamentosTitulo", "Or&ccedil;amentos recentes", "Hist&oacute;rico consolidado do sistema", "orcamento-inteligente.html", "Criar or&ccedil;amento"),
            this.renderizarTabela(estado.orcamentos || []),
            `</section>`,
            `<section class="dashboard-comercial-section dashboard-comercial-atividades" aria-labelledby="ultimasAtividadesTitulo">`,
            this.renderizarTituloSecao("ultimasAtividadesTitulo", "Atividade recente", "Movimenta&ccedil;&otilde;es do fluxo comercial"),
            this.renderizarAtividades(estado.atividades || []),
            `</section>`,
            `</div>`,
            `</section>`
        ].join("");

        this.registrarEventos(root);
        return true;
    },

    renderizarCabecalho(estado = {}) {
        const hora = new Date().getHours();
        const saudacao = hora < 12 ? "Bom dia" : (hora < 18 ? "Boa tarde" : "Boa noite");
        return [
            `<header class="dashboard-comercial-header">`,
            `<div class="dashboard-comercial-header-copy">`,
            `<span class="dashboard-comercial-eyebrow"><i aria-hidden="true"></i> Vis&atilde;o geral da empresa</span>`,
            `<h1 id="dashboardComercialTitulo">${saudacao}, equipe RK.</h1>`,
            `<p class="dashboard-comercial-subtitle">Or&ccedil;amentos, obras e financeiro em uma &uacute;nica vis&atilde;o.</p>`,
            `</div>`,
            `<div class="dashboard-comercial-header-meta">`,
            `<span>Atualizado ${this.escapar(this.formatarDataCurta(estado.carregadoEm))}</span>`,
            `<button type="button" class="dashboard-comercial-refresh" data-dashboard-action="atualizar" aria-label="Atualizar indicadores">${this.icone("refresh")}<span>Atualizar</span></button>`,
            `</div>`,
            `</header>`
        ].join("");
    },

    renderizarAtalhos(sessao = {}) {
        const atalhos = [
            { rotulo: "Novo or&ccedil;amento", descricao: "Montar proposta", icone: "file", href: "orcamento-inteligente.html", destaque: true },
            { rotulo: "Ordens de servi&ccedil;o", descricao: "Produ&ccedil;&atilde;o e instala&ccedil;&atilde;o", icone: "note", href: "nota-servico.html" },
            { rotulo: "Medir obra", descricao: "Registrar medidas", icone: "measure", href: "medicao-obra.html" },
            { rotulo: "Clientes", descricao: "Consultar cadastro", icone: "users", href: "clientes.html" },
            { rotulo: "Caixa", descricao: "Ver movimenta&ccedil;&otilde;es", icone: "wallet", href: "caixa.html" }
        ];
        const administrador = sessao?.perfil === "admin";
        if (administrador) {
            atalhos.push({ rotulo: "Controle de acessos", descricao: "Equipe e permiss&otilde;es", icone: "shield", href: "acessos.html" });
        }
        return [
            `<nav class="dashboard-comercial-shortcuts${administrador ? " has-admin-access" : ""}" aria-label="Acesso r&aacute;pido">`,
            ...atalhos.map(atalho => [
                `<a class="dashboard-comercial-shortcut${atalho.destaque ? " is-primary" : ""}" href="${this.escaparAtributo(atalho.href)}">`,
                `<span class="dashboard-comercial-shortcut-icon" aria-hidden="true">${this.icone(atalho.icone)}</span>`,
                `<span class="dashboard-comercial-shortcut-copy"><strong>${atalho.rotulo}</strong><small>${atalho.descricao}</small></span>`,
                `<span class="dashboard-comercial-shortcut-arrow" aria-hidden="true">&rsaquo;</span>`,
                `</a>`
            ].join("")),
            `</nav>`
        ].join("");
    },

    renderizarCards(kpis = {}, resumo = {}, obras = {}, caixa = {}) {
        const cards = [
            { titulo: "Or&ccedil;amentos gerados", valor: this.formatarNumero(kpis.totalOrcamentos), detalhe: `${this.formatarNumero(resumo.geradosMes)} neste m&ecirc;s &middot; ${this.formatarNumero(resumo.emAberto)} em aberto`, icone: "file", tom: "blue", ajuda: "Registros únicos consolidados por número." },
            { titulo: "Ticket m&eacute;dio", valor: this.formatarMoedaCompacta(kpis.ticketMedio), detalhe: `${this.formatarNumero(resumo.comValor)} propostas v&aacute;lidas`, icone: "trend", tom: "violet", ajuda: "Média dos orçamentos com valor, sem cancelados ou reprovados." },
            { titulo: "Obras ativas", valor: this.formatarNumero(kpis.obrasAtivas), detalhe: `${this.formatarNumero(obras.aprovadas)} aprovadas &middot; ${this.formatarNumero(Number(obras.emProducao || 0) + Number(obras.emInstalacao || 0))} em execu&ccedil;&atilde;o`, icone: "building", tom: "amber", ajuda: "Aprovadas, em produção ou em instalação." },
            { titulo: "Saldo em caixa", valor: this.formatarMoedaCompacta(kpis.saldoCaixa), detalhe: `${this.formatarNumero(caixa.totalConfirmados)} lan&ccedil;amentos confirmados`, icone: "wallet", tom: Number(kpis.saldoCaixa) < 0 ? "red" : "green", ajuda: "Entradas confirmadas menos saídas confirmadas, em todo o período." }
        ];
        return [
            `<section class="dashboard-comercial-kpis" aria-label="Indicadores principais">`,
            ...cards.map(card => [
                `<article class="dashboard-comercial-card is-${card.tom}" title="${this.escaparAtributo(card.ajuda)}">`,
                `<div class="dashboard-comercial-card-top"><span>${card.titulo}</span><i aria-hidden="true">${this.icone(card.icone)}</i></div>`,
                `<strong>${this.escapar(card.valor)}</strong>`,
                `<small>${card.detalhe}</small>`,
                `</article>`
            ].join("")),
            `</section>`
        ].join("");
    },

    renderizarCaixa(caixa = {}) {
        const maior = Math.max(Number(caixa.entradas || 0), Number(caixa.saidas || 0), 1);
        const entradaPct = Math.round(Number(caixa.entradas || 0) / maior * 100);
        const saidaPct = Math.round(Number(caixa.saidas || 0) / maior * 100);
        return [
            `<section class="dashboard-comercial-section dashboard-comercial-caixa" aria-labelledby="resumoCaixaTitulo">`,
            this.renderizarTituloSecao("resumoCaixaTitulo", "Resumo de caixa", this.formatarMes(caixa.referencia), "caixa.html", "Abrir caixa"),
            `<div class="dashboard-comercial-cash-result${Number(caixa.resultadoMes) < 0 ? " is-negative" : ""}">`,
            `<span>Resultado do m&ecirc;s</span><strong>${this.escapar(this.formatarMoeda(caixa.resultadoMes))}</strong>`,
            `</div>`,
            `<div class="dashboard-comercial-cash-basis"><span>${this.formatarNumero(caixa.totalConfirmados)} confirmados na base</span>${Number(caixa.pendentes) > 0 ? `<strong>${this.formatarNumero(caixa.pendentes)} pendente${Number(caixa.pendentes) === 1 ? "" : "s"} (${this.escapar(this.formatarMoeda(caixa.valorPendente))}) fora do saldo</strong>` : `<strong>Sem pend&ecirc;ncias</strong>`}</div>`,
            `<div class="dashboard-comercial-cash-bars">`,
            this.renderizarBarraCaixa("Entradas", caixa.entradas, entradaPct, "entrada"),
            this.renderizarBarraCaixa("Sa&iacute;das", caixa.saidas, saidaPct, "saida"),
            `</div>`,
            this.renderizarMovimentos(caixa.movimentos || []),
            `</section>`
        ].join("");
    },

    renderizarBarraCaixa(rotulo, valor, percentual, tipo) {
        return `<div class="dashboard-comercial-cash-row"><div><span>${rotulo}</span><strong>${this.escapar(this.formatarMoeda(valor))}</strong></div><div class="dashboard-comercial-bar"><i class="is-${tipo}" style="--dashboard-width:${Math.max(0, Math.min(100, percentual))}%"></i></div></div>`;
    },

    renderizarMovimentos(movimentos = []) {
        if (!movimentos.length) return `<p class="dashboard-comercial-inline-empty">Nenhum lan&ccedil;amento confirmado.</p>`;
        return [
            `<div class="dashboard-comercial-mini-list">`,
            ...movimentos.slice(0, 3).map(item => [
                `<div>`,
                `<span class="dashboard-comercial-mini-icon is-${item.tipo === "entrada" ? "entrada" : "saida"}">${item.tipo === "entrada" ? "&uarr;" : "&darr;"}</span>`,
                `<p><strong>${this.escapar(item.descricao || item.categoria || "Lan&ccedil;amento")}</strong><small>${this.escapar(this.formatarDataSimples(item.data))}</small></p>`,
                `<b class="is-${item.tipo === "entrada" ? "entrada" : "saida"}">${item.tipo === "entrada" ? "+" : "-"}${this.escapar(this.formatarMoeda(item.valor))}</b>`,
                `</div>`
            ].join("")),
            `</div>`
        ].join("");
    },

    renderizarObras(obras = {}) {
        const total = Math.max(Number(obras.total || 0), 1);
        const etapas = [
            { rotulo: "Aprovadas", valor: obras.aprovadas, classe: "active" },
            { rotulo: "Produ&ccedil;&atilde;o", valor: obras.emProducao, classe: "production" },
            { rotulo: "Instala&ccedil;&atilde;o", valor: obras.emInstalacao, classe: "installation" },
            { rotulo: "Conclu&iacute;das", valor: obras.concluidas, classe: "done" }
        ];
        return [
            `<section class="dashboard-comercial-section dashboard-comercial-obras" aria-labelledby="resumoObrasTitulo">`,
            this.renderizarTituloSecao("resumoObrasTitulo", "Obras", `${this.formatarNumero(obras.total)} a partir da aprova&ccedil;&atilde;o`, "projetos.html", "Ver projetos"),
            `<div class="dashboard-comercial-work-stats">`,
            ...etapas.map(etapa => `<div class="is-${etapa.classe}"><span>${etapa.rotulo}</span><strong>${this.formatarNumero(etapa.valor)}</strong><i style="--dashboard-width:${Math.round(Number(etapa.valor || 0) / total * 100)}%"></i></div>`),
            `</div>`,
            `<div class="dashboard-comercial-work-average"><span>Valor m&eacute;dio por obra</span><strong>${this.escapar(this.formatarMoeda(obras.valorMedio))}</strong></div>`,
            this.renderizarListaObras(obras.recentes || []),
            `</section>`
        ].join("");
    },

    renderizarListaObras(obras = []) {
        if (!obras.length) return `<p class="dashboard-comercial-inline-empty">Nenhuma obra cadastrada.</p>`;
        return `<div class="dashboard-comercial-work-list">${obras.slice(0, 3).map(obra => `<div><p><strong>${this.escapar(obra.titulo)}</strong><small>${this.escapar(obra.cliente || "Cliente não informado")}</small></p><span class="dashboard-comercial-status is-${this.slug(obra.status)}">${this.escapar(this.rotuloStatus(obra.status))}</span></div>`).join("")}</div>`;
    },

    renderizarValorNegociacao(valorNegociacao = {}, resumoOrcamentos = {}) {
        const itens = Array.isArray(valorNegociacao.itens) ? valorNegociacao.itens : [];
        return [
            `<article class="dashboard-comercial-section dashboard-comercial-panel-valor" aria-labelledby="valorNegociacaoTitulo">`,
            this.renderizarTituloSecao("valorNegociacaoTitulo", "Pipeline comercial", `${this.formatarNumero(itens.length)} oportunidades &middot; ${this.formatarNumero(resumoOrcamentos.taxaConversao)}% de convers&atilde;o`),
            `<div class="dashboard-comercial-pipeline-total"><span>Valor em negocia&ccedil;&atilde;o</span><strong>${this.escapar(this.formatarMoeda(valorNegociacao.total))}</strong></div>`,
            `<div class="dashboard-comercial-value-list">`,
            ...(itens.length ? itens.slice(0, 4).map(item => `<div><span>${this.escapar(item.titulo || item.origem || "Or&ccedil;amento")}</span><strong>${this.escapar(this.formatarMoeda(item.valor))}</strong></div>`) : [`<p class="dashboard-comercial-inline-empty">Nenhuma negocia&ccedil;&atilde;o em aberto.</p>`]),
            `</div></article>`
        ].join("");
    },

    renderizarAcoes(acoes = []) {
        return [
            `<article class="dashboard-comercial-section dashboard-comercial-panel-acoes" aria-labelledby="proximasAcoesTitulo">`,
            this.renderizarTituloSecao("proximasAcoesTitulo", "Pr&oacute;ximas a&ccedil;&otilde;es", "Prioridades do fluxo"),
            `<div class="dashboard-comercial-actions">`,
            ...acoes.map((acao, indice) => `<div><span>${indice + 1}</span><p><strong>${this.escapar(acao.titulo || "A&ccedil;&atilde;o")}</strong><small>${this.escapar(this.rotuloStatus(acao.status))}</small></p>${this.icone("arrow")}</div>`),
            `</div></article>`
        ].join("");
    },

    renderizarTituloSecao(id, titulo, apoio = "", href = "", link = "") {
        return `<div class="dashboard-comercial-section-top"><div><h2 id="${id}">${titulo}</h2>${apoio ? `<span>${apoio}</span>` : ""}</div>${href ? `<a href="${this.escaparAtributo(href)}">${link}${this.icone("arrow")}</a>` : ""}</div>`;
    },

    renderizarTabela(orcamentos = []) {
        if (!orcamentos.length) return `<div class="dashboard-comercial-empty"><p>Nenhum or&ccedil;amento encontrado.</p></div>`;
        return [
            `<div class="dashboard-comercial-table-wrap"><table class="dashboard-comercial-table">`,
            `<thead><tr><th>Or&ccedil;amento</th><th>Cliente</th><th>Data</th><th>Status</th><th class="is-number">Valor</th></tr></thead><tbody>`,
            ...orcamentos.map(orcamento => `<tr><td><strong>${this.escapar(orcamento.numero || orcamento.id || "-")}</strong><small>${this.escapar(orcamento.origem || "Sistema")}</small></td><td>${this.escapar(orcamento.cliente || "Não informado")}</td><td>${this.escapar(this.formatarDataSimples(orcamento.atualizadoEm))}</td><td><span class="dashboard-comercial-status is-${this.slug(orcamento.status)}">${this.escapar(this.rotuloStatus(orcamento.status))}</span></td><td class="is-number"><strong>${this.escapar(this.formatarMoeda(orcamento.total))}</strong></td></tr>`),
            `</tbody></table></div>`
        ].join("");
    },

    renderizarAtividades(atividades = []) {
        if (!atividades.length) return `<div class="dashboard-comercial-empty"><p>Nenhuma atividade recente.</p></div>`;
        return `<div class="dashboard-comercial-activities">${atividades.map(atividade => `<article><i></i><div><span>${this.escapar(atividade.tipo || "Atividade")}</span><strong>${this.escapar(atividade.descricao || "-")}</strong><small>${this.escapar(this.formatarData(atividade.data))}</small></div></article>`).join("")}</div>`;
    },

    registrarEventos(root) {
        root.querySelectorAll("[data-dashboard-action]").forEach(botao => botao.addEventListener("click", async () => {
            const acao = botao.getAttribute("data-dashboard-action");
            if (!this.controller || typeof this.controller[acao] !== "function") return;
            botao.classList.add("is-loading");
            botao.disabled = true;
            try { await this.controller[acao](); } finally { botao.disabled = false; botao.classList.remove("is-loading"); }
        }));
    },

    icone(nome) {
        const caminhos = {
            refresh: `<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>`,
            file: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>`,
            note: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/>`,
            measure: `<path d="M3 17 17 3l4 4L7 21H3z"/><path d="m14 6 4 4M11 9l2 2M8 12l2 2"/>`,
            users: `<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>`,
            shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>`,
            wallet: `<path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v12H5a3 3 0 0 1-3-3V6"/><path d="M16 14h2"/>`,
            trend: `<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>`,
            building: `<path d="M3 21h18M6 21V5l6-3v19M18 21V9l-6-2M9 9h.01M9 13h.01M9 17h.01M15 13h.01M15 17h.01"/>`,
            arrow: `<path d="M5 12h14M13 6l6 6-6 6"/>`
        };
        return `<svg viewBox="0 0 24 24" aria-hidden="true">${caminhos[nome] || caminhos.arrow}</svg>`;
    },

    obterRoot() { return document.getElementById(this.rootId); },
    formatarNumero(valor) { const numero = Number(valor || 0); return Number.isFinite(numero) ? numero.toLocaleString("pt-BR") : "0"; },
    formatarMoeda(valor) { const numero = Number(valor || 0); return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(numero) ? numero : 0); },
    formatarMoedaCompacta(valor) { const numero = Number(valor || 0); return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: Math.abs(numero) >= 100000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(Number.isFinite(numero) ? numero : 0); },
    formatarData(valor) { if (!valor) return ""; const data = new Date(valor); return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); },
    formatarDataCurta(valor) { if (!valor) return "agora"; const data = new Date(valor); return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); },
    formatarDataSimples(valor) { if (!valor) return "-"; const data = new Date(`${String(valor).slice(0, 10)}T12:00:00`); return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }); },
    formatarMes(referencia) { if (!referencia) return "M&ecirc;s atual"; const [ano, mes] = String(referencia).split("-"); const data = new Date(Number(ano), Number(mes) - 1, 1); return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }); },
    rotuloStatus(status = "") { const chave = this.slug(status); const rotulos = { vazio: "Sem status", em_orcamento: "Em orçamento", medicao: "Aguardando medição", medicao_concluida: "Medição concluída", em_producao: "Em produção", em_instalacao: "Em instalação", finalizado: "Finalizado", concluido: "Concluído", aprovado: "Aprovado", enviado: "Enviado", rascunho: "Rascunho", pendente: "Pendente", pronto: "Pronto", proximo: "Próximo", ok: "Em dia" }; return rotulos[chave] || String(status || "Sem status").replace(/_/g, " "); },
    slug(valor) { const slug = String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); return slug || "vazio"; },
    escapar(valor) { return String(valor === undefined || valor === null ? "" : valor).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); },
    escaparAtributo(valor) { return this.escapar(valor).replace(/`/g, "&#096;"); }
};
