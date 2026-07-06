const DashboardComercialUI = {
    rootId: "dashboardComercialRoot",
    controller: null,

    renderizar(estado = {}, controller = null) {
        this.controller = controller || this.controller;
        const root = this.obterRoot();

        if (!root) {
            return false;
        }

        root.innerHTML = [
            `<section class="dashboard-comercial-shell" aria-labelledby="dashboardComercialTitulo">`,
            `<header class="dashboard-comercial-header">`,
            `<div>`,
            `<p class="dashboard-comercial-eyebrow">Dashboard Comercial</p>`,
            `<h1 id="dashboardComercialTitulo">Dashboard Comercial</h1>`,
            `</div>`,
            `<button type="button" class="dashboard-comercial-refresh" data-dashboard-action="atualizar">Atualizar</button>`,
            `</header>`,
            `<div class="dashboard-comercial-content">`,
            `<section class="dashboard-comercial-section" aria-labelledby="resumoComercialTitulo">`,
            `<div class="dashboard-comercial-section-top">`,
            `<h2 id="resumoComercialTitulo">Resumo Comercial</h2>`,
            `<span>${this.escapar(this.formatarData(estado.carregadoEm))}</span>`,
            `</div>`,
            this.renderizarCards(estado.kpis || {}),
            `</section>`,
            this.renderizarAtalhos(),
            `<section class="dashboard-comercial-section dashboard-comercial-grid">`,
            this.renderizarValorNegociacao(estado.valorNegociacao || {}),
            this.renderizarAcoes(estado.acoes || []),
            `</section>`,
            `<section class="dashboard-comercial-section" aria-labelledby="ultimosOrcamentosTitulo">`,
            `<div class="dashboard-comercial-section-top">`,
            `<h2 id="ultimosOrcamentosTitulo">Ultimos Orcamentos</h2>`,
            `</div>`,
            this.renderizarTabela(estado.orcamentos || []),
            `</section>`,
            `<section class="dashboard-comercial-section" aria-labelledby="ultimasAtividadesTitulo">`,
            `<div class="dashboard-comercial-section-top">`,
            `<h2 id="ultimasAtividadesTitulo">Ultimas Atividades</h2>`,
            `</div>`,
            this.renderizarAtividades(estado.atividades || []),
            `</section>`,
            `</div>`,
            `</section>`
        ].join("");

        this.registrarEventos(root);
        return true;
    },

    renderizarAtalhos() {
        const atalhos = [
            { rotulo: "Novo Cliente", href: "clientes.html" },
            { rotulo: "Novo Orcamento", href: "orcamento-inteligente.html" },
            { rotulo: "Ver Aprovacoes", href: "aprovacao-comercial.html" },
            { rotulo: "Producao", href: "producao.html" }
        ];

        return [
            `<section class="dashboard-comercial-section" aria-labelledby="atalhosComerciaisTitulo">`,
            `<div class="dashboard-comercial-section-top">`,
            `<h2 id="atalhosComerciaisTitulo">Atalhos</h2>`,
            `<span>Fluxo visual E2E</span>`,
            `</div>`,
            `<div class="dashboard-comercial-shortcuts">`,
            ...atalhos.map(atalho => `<a class="botao" href="${this.escaparAtributo(atalho.href)}">${this.escapar(atalho.rotulo)}</a>`),
            `</div>`,
            `</section>`
        ].join("");
    },

    renderizarCards(kpis = {}) {
        const cards = [
            {
                titulo: "Total de Orcamentos",
                valor: this.formatarNumero(kpis.totalOrcamentos),
                detalhe: "Registros consultados"
            },
            {
                titulo: "Documentos Aprovados",
                valor: this.formatarNumero(kpis.totalDocumentosAprovados),
                detalhe: "Documento Comercial"
            },
            {
                titulo: "Projetos Convertidos",
                valor: this.formatarNumero(kpis.totalProjetosConvertidos),
                detalhe: "Projeto Executivo"
            },
            {
                titulo: "Taxa de Conversao",
                valor: `${this.formatarNumero(kpis.taxaConversao)}%`,
                detalhe: "Convertidos / aprovados"
            }
        ];

        return [
            `<div class="dashboard-comercial-cards">`,
            ...cards.map(card => [
                `<article class="dashboard-comercial-card">`,
                `<span>${this.escapar(card.titulo)}</span>`,
                `<strong>${this.escapar(card.valor)}</strong>`,
                `<small>${this.escapar(card.detalhe)}</small>`,
                `</article>`
            ].join("")),
            `</div>`
        ].join("");
    },

    renderizarTabela(orcamentos = []) {
        if (!orcamentos.length) {
            return [
                `<div class="dashboard-comercial-empty">`,
                `<p>Nenhum orcamento encontrado.</p>`,
                `</div>`
            ].join("");
        }

        return [
            `<div class="dashboard-comercial-table-wrap">`,
            `<table class="dashboard-comercial-table">`,
            `<thead>`,
            `<tr>`,
            `<th>Numero</th>`,
            `<th>Cliente</th>`,
            `<th>Status</th>`,
            `<th>Valor</th>`,
            `<th>Origem</th>`,
            `</tr>`,
            `</thead>`,
            `<tbody>`,
            ...orcamentos.map(orcamento => [
                `<tr>`,
                `<td>${this.escapar(orcamento.numero || orcamento.id || "-")}</td>`,
                `<td>${this.escapar(orcamento.cliente || "-")}</td>`,
                `<td>${this.escapar(orcamento.status || "-")}</td>`,
                `<td>${this.escapar(this.formatarMoeda(orcamento.total))}</td>`,
                `<td>${this.escapar(orcamento.origem || "-")}</td>`,
                `</tr>`
            ].join("")),
            `</tbody>`,
            `</table>`,
            `</div>`
        ].join("");
    },

    renderizarAtividades(atividades = []) {
        if (!atividades.length) {
            return [
                `<div class="dashboard-comercial-empty">`,
                `<p>Nenhuma atividade encontrada.</p>`,
                `</div>`
            ].join("");
        }

        return [
            `<div class="dashboard-comercial-activities">`,
            ...atividades.map(atividade => [
                `<article class="dashboard-comercial-activity">`,
                `<span>${this.escapar(atividade.tipo || "Atividade")}</span>`,
                `<strong>${this.escapar(atividade.descricao || "-")}</strong>`,
                `<small>${this.escapar(this.formatarData(atividade.data))}</small>`,
                `</article>`
            ].join("")),
            `</div>`
        ].join("");
    },

    renderizarAcoes(acoes = []) {
        return [
            `<article class="dashboard-comercial-panel" aria-labelledby="proximasAcoesTitulo">`,
            `<div class="dashboard-comercial-section-top">`,
            `<h2 id="proximasAcoesTitulo">Proximas Acoes</h2>`,
            `</div>`,
            `<div class="dashboard-comercial-actions">`,
            ...acoes.map(acao => [
                `<div class="dashboard-comercial-action">`,
                `<span>${this.escapar(acao.titulo || "-")}</span>`,
                `<strong>${this.escapar(acao.status || "")}</strong>`,
                `</div>`
            ].join("")),
            `</div>`,
            `</article>`
        ].join("");
    },

    renderizarValorNegociacao(valorNegociacao = {}) {
        const itens = Array.isArray(valorNegociacao.itens) ? valorNegociacao.itens : [];

        return [
            `<article class="dashboard-comercial-panel" aria-labelledby="valorNegociacaoTitulo">`,
            `<div class="dashboard-comercial-section-top">`,
            `<h2 id="valorNegociacaoTitulo">Valor em Negociacao</h2>`,
            `</div>`,
            `<div class="dashboard-comercial-value">`,
            `<strong>${this.escapar(this.formatarMoeda(valorNegociacao.total))}</strong>`,
            `<span>${this.escapar(this.formatarNumero(itens.length))} fontes</span>`,
            `</div>`,
            `<div class="dashboard-comercial-value-list">`,
            ...(itens.length ? itens.map(item => [
                `<div>`,
                `<span>${this.escapar(item.titulo || item.origem || "-")}</span>`,
                `<strong>${this.escapar(this.formatarMoeda(item.valor))}</strong>`,
                `</div>`
            ].join("")) : [`<p>Nenhum valor comercial encontrado.</p>`]),
            `</div>`,
            `</article>`
        ].join("");
    },

    registrarEventos(root) {
        root.querySelectorAll("[data-dashboard-action]").forEach(botao => {
            botao.addEventListener("click", () => {
                const acao = botao.getAttribute("data-dashboard-action");

                if (this.controller && typeof this.controller[acao] === "function") {
                    this.controller[acao]();
                }
            });
        });
    },

    obterRoot() {
        return document.getElementById(this.rootId);
    },

    formatarNumero(valor) {
        const numero = Number(valor || 0);
        return Number.isFinite(numero) ? numero.toLocaleString("pt-BR") : "0";
    },

    formatarMoeda(valor) {
        const numero = Number(valor || 0);

        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(Number.isFinite(numero) ? numero : 0);
    },

    formatarData(valor) {
        if (!valor) {
            return "";
        }

        const data = new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return String(valor);
        }

        return data.toLocaleString("pt-BR");
    },

    escapar(valor) {
        return String(valor === undefined || valor === null ? "" : valor)
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
