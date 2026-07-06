const ProjetoVisualUI = {
    rootId: "projetosRoot",
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

        root.innerHTML = [
            `<section class="projetos-shell">`,
            `<header class="projetos-cabecalho">`,
            `<div>`,
            `<span class="projetos-label">Centro Comercial</span>`,
            `<h1>Projetos</h1>`,
            `<p>Selecione um Projeto para seguir para o Orcamento Inteligente.</p>`,
            `</div>`,
            `<div class="projetos-acoes">`,
            `<a class="botao" href="clientes.html">Clientes</a>`,
            `<a class="botao" href="orcamento-inteligente.html">Orcamento Inteligente</a>`,
            `</div>`,
            `</header>`,
            `<section class="projetos-grid">`,
            `<div class="projetos-painel">`,
            `<div class="projetos-painel-topo">`,
            `<div>`,
            `<h2>Projetos disponiveis</h2>`,
            `<p>${this.escapar(this.resumoLista(estado.projetos || []))}</p>`,
            `</div>`,
            `</div>`,
            `<div class="projetos-lista">`,
            this.renderizarProjetos(estado.projetos || []),
            `</div>`,
            `</div>`,
            `<aside class="projetos-painel">`,
            `<div class="projetos-painel-topo">`,
            `<div>`,
            `<span class="projetos-label">Projeto atual</span>`,
            `<h2>Selecao para orcamento</h2>`,
            `</div>`,
            `</div>`,
            this.renderizarSelecionado(estado.projetoSelecionado),
            `</aside>`,
            `</section>`,
            `</section>`
        ].join("");

        this.registrarEventos(root);
        return true;
    },

    renderizarProjetos(projetos = []) {
        if (!projetos.length) {
            return `<div class="projetos-vazio">Nenhum Projeto encontrado.</div>`;
        }

        return projetos.map(projeto => [
            `<article class="projeto-card">`,
            `<span class="projetos-status">${this.escapar(projeto.status || "rascunho")}</span>`,
            `<h3>${this.escapar(projeto.titulo || projeto.numero || projeto.id || "Projeto")}</h3>`,
            `<p>${this.escapar(projeto.obra?.endereco || projeto.cliente?.nome || "Projeto de demonstracao.")}</p>`,
            this.renderizarMeta(projeto),
            `<div class="projetos-acoes">`,
            `<button type="button" class="botao" data-projeto-action="selecionar" data-projeto-id="${this.escaparAtributo(projeto.id)}">Selecionar</button>`,
            `<a class="botao botao-claro" href="orcamento-inteligente.html">Usar no orcamento</a>`,
            `</div>`,
            `</article>`
        ].join("")).join("");
    },

    renderizarMeta(projeto = {}) {
        const campos = [
            ["Numero", projeto.numero || projeto.codigo || projeto.id || "-"],
            ["Cliente", projeto.cliente?.nome || "-"],
            ["Responsavel", projeto.comercial?.responsavel || projeto.operacional?.responsavel || "-"],
            ["Prioridade", projeto.prioridade || "-"]
        ];

        return [
            `<div class="projeto-meta">`,
            ...campos.map(([rotulo, valor]) => [
                `<div>`,
                `<span>${this.escapar(rotulo)}</span>`,
                `<strong>${this.escapar(valor)}</strong>`,
                `</div>`
            ].join("")),
            `</div>`
        ].join("");
    },

    renderizarSelecionado(projeto = null) {
        if (!projeto) {
            return `<div class="projetos-selecionado">Selecione um Projeto para continuar.</div>`;
        }

        return [
            `<div class="projetos-selecionado">`,
            `<strong>${this.escapar(projeto.titulo || projeto.numero || projeto.id)}</strong>`,
            `<p>Cliente: ${this.escapar(projeto.cliente?.nome || "-")}</p>`,
            `<p>Status: ${this.escapar(projeto.status || "-")}</p>`,
            `<div class="projetos-acoes">`,
            `<a class="botao" href="orcamento-inteligente.html">Seguir para Orcamento</a>`,
            `<a class="botao botao-claro" href="compartilhar-documento.html">Documento Comercial</a>`,
            `</div>`,
            `</div>`
        ].join("");
    },

    registrarEventos(root) {
        root.querySelectorAll("[data-projeto-action='selecionar']").forEach(botao => {
            botao.addEventListener("click", () => {
                if (this.controller && typeof this.controller.selecionarProjeto === "function") {
                    this.controller.selecionarProjeto(botao.dataset.projetoId);
                }
            });
        });
    },

    resumoLista(projetos = []) {
        return projetos.length === 1 ? "1 Projeto listado" : `${projetos.length} Projetos listados`;
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
