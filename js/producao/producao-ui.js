const ProducaoUI = {
    rootId: "producaoRoot",
    controller: null,

    configurar(controller) {
        this.controller = controller;
        return this;
    },

    renderizar(estado = {}) {
        const root = document.getElementById(this.rootId);

        if (!root) {
            return false;
        }

        const ordens = estado.ordens || [];
        const ordemSelecionada = this.obterOrdemSelecionada(estado);

        root.innerHTML = [
            `<section class="producao-shell">`,
            this.renderizarCabecalho(),
            this.renderizarIndicadores(estado.indicadores || {}),
            this.renderizarMensagem(estado.mensagem, estado.tipoMensagem),
            `<section class="producao-grid">`,
            `<div class="producao-painel">`,
            `<div class="producao-painel-topo">`,
            `<div>`,
            `<h2>Ordens de Producao</h2>`,
            `<p>${this.escapar(this.resumoLista(ordens))}</p>`,
            `</div>`,
            `</div>`,
            `<div class="producao-lista">`,
            this.renderizarOrdens(ordens, estado.ordemSelecionadaId),
            `</div>`,
            `</div>`,
            `<aside class="producao-painel producao-detalhes">`,
            this.renderizarDetalhes(ordemSelecionada, estado.projeto),
            `</aside>`,
            `</section>`,
            `</section>`
        ].join("");

        this.registrarEventos(root);
        return true;
    },

    renderizarCabecalho() {
        return [
            `<header class="producao-cabecalho">`,
            `<div>`,
            `<span class="producao-label">Centro de Producao</span>`,
            `<h1>Planejamento da Producao</h1>`,
            `<p>Ordens de Producao com responsavel, prioridade, previsoes, checklist e historico.</p>`,
            `</div>`,
            `<div class="producao-acoes">`,
            `<button type="button" class="botao" data-producao-action="criarOrdemDemo">Criar ordem demo</button>`,
            `<a class="botao botao-claro" href="converter-projeto.html">Conversao</a>`,
            `</div>`,
            `</header>`
        ].join("");
    },

    renderizarIndicadores(indicadores = {}) {
        const itens = [
            ["Pendentes", indicadores.pendentes || 0],
            ["Planejadas", indicadores.planejadas || 0],
            ["Liberadas", indicadores.liberadas || 0],
            ["Em producao", indicadores.emProducao || 0],
            ["Finalizadas", indicadores.finalizadas || 0],
            ["Urgentes", indicadores.urgentes || 0]
        ];

        return [
            `<section class="producao-indicadores" aria-label="Indicadores de producao">`,
            ...itens.map(([rotulo, valor]) => [
                `<div class="producao-indicador">`,
                `<span>${this.escapar(rotulo)}</span>`,
                `<strong>${this.escapar(valor)}</strong>`,
                `</div>`
            ].join("")),
            `</section>`
        ].join("");
    },

    renderizarOrdens(ordens = [], selecionadaId = "") {
        if (!ordens.length) {
            return `<div class="producao-vazio">Nenhuma Ordem de Producao criada ainda.</div>`;
        }

        return ordens.map(ordem => {
            const selecionada = ordem.id === selecionadaId;

            return [
                `<button type="button" class="producao-card${selecionada ? " producao-card-ativo" : ""}" data-producao-select="${this.escaparAtributo(ordem.id)}">`,
                `<span class="producao-status producao-status-${this.escaparAtributo(String(ordem.status || "").toLowerCase())}">${this.escapar(this.rotuloStatus(ordem.status))}</span>`,
                `<h3>${this.escapar(ordem.numero || ordem.id || "Ordem de Producao")}</h3>`,
                `<p>${this.escapar(ordem.clienteNome || ordem.projetoTitulo || ordem.projetoId || "Projeto vinculado")}</p>`,
                this.renderizarMeta(ordem),
                `</button>`
            ].join("");
        }).join("");
    },

    renderizarMeta(ordem = {}) {
        const campos = [
            ["Responsavel", ordem.responsavel || "-"],
            ["Prioridade", this.rotuloPrioridade(ordem.prioridade) || "-"],
            ["Status", this.rotuloStatus(ordem.status) || "-"],
            ["Entrega", this.formatarData(ordem.previsaoEntrega)]
        ];

        return [
            `<div class="producao-meta">`,
            ...campos.map(([rotulo, valor]) => [
                `<div>`,
                `<span>${this.escapar(rotulo)}</span>`,
                `<strong>${this.escapar(valor)}</strong>`,
                `</div>`
            ].join("")),
            `</div>`
        ].join("");
    },

    renderizarDetalhes(ordem = null, projeto = null) {
        if (!ordem) {
            return [
                `<div class="producao-painel-topo">`,
                `<div>`,
                `<span class="producao-label">Planejamento</span>`,
                `<h2>Selecione uma ordem</h2>`,
                `</div>`,
                `</div>`,
                `<div class="producao-vazio">Nenhuma ordem selecionada.</div>`,
                this.renderizarProjeto(projeto)
            ].join("");
        }

        return [
            `<div class="producao-painel-topo">`,
            `<div>`,
            `<span class="producao-label">Ordem selecionada</span>`,
            `<h2>${this.escapar(ordem.numero || ordem.id)}</h2>`,
            `</div>`,
            `<span class="producao-status">${this.escapar(this.rotuloStatus(ordem.status))}</span>`,
            `</div>`,
            this.renderizarResumoOrdem(ordem, projeto),
            this.renderizarPlanejamento(ordem),
            this.renderizarChecklist(ordem),
            this.renderizarHistorico(ordem)
        ].join("");
    },

    renderizarResumoOrdem(ordem = {}, projeto = null) {
        const campos = [
            ["Projeto", ordem.projetoTitulo || projeto?.titulo || ordem.projetoId || "-"],
            ["Cliente", ordem.clienteNome || projeto?.cliente?.nome || ordem.clienteId || "-"],
            ["Criada em", this.formatarDataHora(ordem.criadoEm || ordem.dataCriacao)],
            ["Atualizada em", this.formatarDataHora(ordem.atualizadoEm || ordem.dataAtualizacao)]
        ];

        return [
            `<section class="producao-detalhe-section">`,
            `<h3>Resumo</h3>`,
            `<div class="producao-resumo-grid">`,
            ...campos.map(([rotulo, valor]) => [
                `<div>`,
                `<span>${this.escapar(rotulo)}</span>`,
                `<strong>${this.escapar(valor)}</strong>`,
                `</div>`
            ].join("")),
            `</div>`,
            `</section>`
        ].join("");
    },

    renderizarPlanejamento(ordem = {}) {
        const podeLiberar = ordem.status === this.statusConstante("PLANEJADA");
        const bloqueada = ordem.status === this.statusConstante("FINALIZADA");

        return [
            `<section class="producao-detalhe-section">`,
            `<h3>Planejamento</h3>`,
            `<form class="producao-form" data-producao-planejamento data-ordem-id="${this.escaparAtributo(ordem.id)}">`,
            `<label>`,
            `<span>Responsavel</span>`,
            `<input type="text" name="responsavel" value="${this.escaparAtributo(ordem.responsavel || "")}" data-producao-responsavel data-ordem-id="${this.escaparAtributo(ordem.id)}"${bloqueada ? " disabled" : ""}>`,
            `</label>`,
            `<label>`,
            `<span>Prioridade</span>`,
            `<select name="prioridade" data-producao-prioridade data-ordem-id="${this.escaparAtributo(ordem.id)}"${bloqueada ? " disabled" : ""}>`,
            this.renderizarOpcoesPrioridade(ordem.prioridade),
            `</select>`,
            `</label>`,
            `<label>`,
            `<span>Previsao de inicio</span>`,
            `<input type="date" name="previsaoInicio" value="${this.escaparAtributo(this.formatarDataInput(ordem.previsaoInicio))}"${bloqueada ? " disabled" : ""}>`,
            `</label>`,
            `<label>`,
            `<span>Previsao de entrega</span>`,
            `<input type="date" name="previsaoEntrega" value="${this.escaparAtributo(this.formatarDataInput(ordem.previsaoEntrega))}"${bloqueada ? " disabled" : ""}>`,
            `</label>`,
            `<label>`,
            `<span>Tempo estimado</span>`,
            `<input type="text" name="tempoEstimado" value="${this.escaparAtributo(ordem.tempoEstimado || "")}" placeholder="Ex.: 6 horas"${bloqueada ? " disabled" : ""}>`,
            `</label>`,
            `<label class="producao-form-largo">`,
            `<span>Descricao</span>`,
            `<textarea name="descricao" rows="3"${bloqueada ? " disabled" : ""}>${this.escapar(ordem.descricao || "")}</textarea>`,
            `</label>`,
            `<label class="producao-form-largo">`,
            `<span>Observacoes</span>`,
            `<textarea name="observacoes" rows="4"${bloqueada ? " disabled" : ""}>${this.escapar(ordem.observacoes || "")}</textarea>`,
            `</label>`,
            `<div class="producao-form-acoes">`,
            `<button type="submit" class="botao"${bloqueada ? " disabled" : ""}>Salvar planejamento</button>`,
            `<button type="button" class="botao botao-claro" data-producao-action="liberarProducao" data-ordem-id="${this.escaparAtributo(ordem.id)}"${podeLiberar ? "" : " disabled"}>Liberar producao</button>`,
            `</div>`,
            `</form>`,
            `</section>`
        ].join("");
    },

    renderizarOpcoesPrioridade(prioridadeAtual = "") {
        const prioridades = typeof ProducaoModel !== "undefined"
            ? Object.values(ProducaoModel.prioridades)
            : ["BAIXA", "NORMAL", "ALTA", "URGENTE"];
        const atual = this.prioridadeConstante(prioridadeAtual);

        return prioridades.map(prioridade => [
            `<option value="${this.escaparAtributo(prioridade)}"${prioridade === atual ? " selected" : ""}>`,
            `${this.escapar(this.rotuloPrioridade(prioridade))}`,
            `</option>`
        ].join("")).join("");
    },

    renderizarChecklist(ordem = {}) {
        const checklist = Array.isArray(ordem.checklist) ? ordem.checklist : [];

        return [
            `<section class="producao-detalhe-section">`,
            `<h3>Checklist operacional</h3>`,
            `<div class="producao-checklist">`,
            ...checklist.map(item => [
                `<label class="producao-check-item">`,
                `<input type="checkbox" data-producao-checklist data-ordem-id="${this.escaparAtributo(ordem.id)}" data-item-id="${this.escaparAtributo(item.id)}"${item.concluido ? " checked" : ""}>`,
                `<span>${this.escapar(item.titulo)}</span>`,
                `<small>${this.escapar(this.formatarDataHora(item.atualizadoEm))}</small>`,
                `</label>`
            ].join("")),
            `</div>`,
            `</section>`
        ].join("");
    },

    renderizarHistorico(ordem = {}) {
        const historico = Array.isArray(ordem.historico) ? [...ordem.historico].reverse() : [];

        return [
            `<section class="producao-detalhe-section">`,
            `<h3>Historico</h3>`,
            historico.length
                ? `<ol class="producao-historico">${historico.map(evento => [
                    `<li>`,
                    `<strong>${this.escapar(evento.descricao || evento.tipo || "Evento")}</strong>`,
                    `<span>${this.escapar(evento.usuario || "Sistema")} - ${this.escapar(this.formatarDataHora(evento.data))}</span>`,
                    `</li>`
                ].join("")).join("")}</ol>`
                : `<div class="producao-vazio">Nenhum historico registrado.</div>`,
            `</section>`
        ].join("");
    },

    renderizarProjeto(projeto = null) {
        if (!projeto) {
            return `<div class="producao-selecionado">Nenhum Projeto convertido ou selecionado encontrado.</div>`;
        }

        return [
            `<div class="producao-selecionado">`,
            `<strong>${this.escapar(projeto.titulo || projeto.numero || projeto.id)}</strong>`,
            `<p>Cliente: ${this.escapar(projeto.cliente?.nome || "-")}</p>`,
            `<p>Status: ${this.escapar(projeto.status || "-")}</p>`,
            `</div>`
        ].join("");
    },

    renderizarMensagem(mensagem = null, tipo = "info") {
        if (!mensagem) {
            return "";
        }

        return `<div class="producao-aviso producao-aviso-${this.escaparAtributo(tipo || "info")}">${this.escapar(mensagem)}</div>`;
    },

    registrarEventos(root) {
        root.querySelectorAll("[data-producao-action]").forEach(botao => {
            botao.addEventListener("click", () => {
                if (botao.disabled) {
                    return;
                }

                const acao = botao.getAttribute("data-producao-action");
                const ordemId = botao.getAttribute("data-ordem-id");

                if (this.controller && typeof this.controller[acao] === "function") {
                    this.controller[acao](ordemId);
                }
            });
        });

        root.querySelectorAll("[data-producao-select]").forEach(botao => {
            botao.addEventListener("click", () => {
                this.controller?.selecionarOrdem(botao.getAttribute("data-producao-select"));
            });
        });

        root.querySelectorAll("[data-producao-planejamento]").forEach(form => {
            form.addEventListener("submit", event => {
                event.preventDefault();
                const dados = Object.fromEntries(new FormData(form).entries());
                this.controller?.salvarPlanejamento(form.getAttribute("data-ordem-id"), dados);
            });
        });

        root.querySelectorAll("[data-producao-responsavel]").forEach(campo => {
            campo.addEventListener("change", () => {
                this.controller?.alterarResponsavel(campo.getAttribute("data-ordem-id"), campo.value);
            });
        });

        root.querySelectorAll("[data-producao-prioridade]").forEach(campo => {
            campo.addEventListener("change", () => {
                this.controller?.alterarPrioridade(campo.getAttribute("data-ordem-id"), campo.value);
            });
        });

        root.querySelectorAll("[data-producao-checklist]").forEach(campo => {
            campo.addEventListener("change", () => {
                this.controller?.atualizarChecklist(
                    campo.getAttribute("data-ordem-id"),
                    campo.getAttribute("data-item-id"),
                    campo.checked
                );
            });
        });
    },

    obterOrdemSelecionada(estado = {}) {
        const ordens = estado.ordens || [];
        return ordens.find(ordem => ordem.id === estado.ordemSelecionadaId) || ordens[0] || null;
    },

    resumoLista(ordens = []) {
        return ordens.length === 1 ? "1 ordem listada" : `${ordens.length} ordens listadas`;
    },

    statusConstante(chave) {
        if (typeof ProducaoModel !== "undefined" && ProducaoModel.status?.[chave]) {
            return ProducaoModel.status[chave];
        }

        return chave;
    },

    prioridadeConstante(prioridade) {
        if (typeof ProducaoModel !== "undefined" && typeof ProducaoModel.normalizarPrioridade === "function") {
            return ProducaoModel.normalizarPrioridade(prioridade);
        }

        return String(prioridade || "NORMAL").trim().toUpperCase();
    },

    rotuloStatus(status) {
        if (typeof ProducaoModel !== "undefined" && typeof ProducaoModel.rotuloStatus === "function") {
            return ProducaoModel.rotuloStatus(status);
        }

        return status || "";
    },

    rotuloPrioridade(prioridade) {
        if (typeof ProducaoModel !== "undefined" && typeof ProducaoModel.rotuloPrioridade === "function") {
            return ProducaoModel.rotuloPrioridade(prioridade);
        }

        return prioridade || "";
    },

    formatarDataInput(valor) {
        if (!valor) {
            return "";
        }

        const data = new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return String(valor).slice(0, 10);
        }

        return data.toISOString().slice(0, 10);
    },

    formatarData(valor) {
        if (!valor) {
            return "-";
        }

        const data = new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return String(valor);
        }

        return data.toLocaleDateString("pt-BR");
    },

    formatarDataHora(valor) {
        if (!valor) {
            return "-";
        }

        const data = new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return String(valor);
        }

        return data.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
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
