const OrcamentoInteligenteUI = {
    elementos: {},
    etapas: [
        { chave: "cliente", rotulo: "Cliente", status: "CLIENTE_SELECIONADO" },
        { chave: "projeto", rotulo: "Projeto", status: "PROJETO_SELECIONADO" },
        { chave: "servico", rotulo: "Servi\u00e7o", status: "SERVICO_SELECIONADO" },
        { chave: "produtos", rotulo: "Produtos", status: "PRODUTOS_ADICIONADOS" },
        { chave: "calculo", rotulo: "C\u00e1lculo", status: "CALCULADO" },
        { chave: "resumo", rotulo: "Resumo", status: "FINALIZADO" }
    ],

    iniciar() {
        this.mapearElementos();
    },

    mapearElementos() {
        this.elementos = {
            btnNovo: document.getElementById("btnNovoOrcamentoInteligente"),
            status: document.getElementById("orcamentoInteligenteStatus"),
            etapas: document.getElementById("orcamentoInteligenteEtapas"),
            cliente: document.getElementById("orcamentoInteligenteCliente"),
            projeto: document.getElementById("orcamentoInteligenteProjeto"),
            servico: document.getElementById("orcamentoInteligenteServico"),
            produtos: document.getElementById("orcamentoInteligenteProdutos"),
            calculo: document.getElementById("orcamentoInteligenteCalculo"),
            resumo: document.getElementById("orcamentoInteligenteResumo")
        };
    },

    renderizarEtapas(contexto = {}) {
        const container = this.elementos.etapas;
        if (!container) return;

        const statusAtual = contexto.status || "INICIADO";
        const indiceAtual = this.indiceEtapa(statusAtual);

        container.innerHTML = this.etapas.map((etapa, indice) => {
            const estado = indice < indiceAtual ? "concluida" : indice === indiceAtual ? "ativa" : "pendente";
            return `
                <article class="orcamento-inteligente-etapa ${estado}">
                    <span>${indice + 1}</span>
                    <strong>${this.escapar(etapa.rotulo)}</strong>
                </article>
            `;
        }).join("");

        if (this.elementos.status) {
            this.elementos.status.textContent = `Status: ${this.rotuloStatus(statusAtual)}`;
        }
    },

    renderizarEstadoVazio(contexto = {}) {
        this.renderizarPlaceholder("cliente", contexto.cliente
            ? this.resumoEntidade(contexto.cliente, "Cliente selecionado.")
            : "Nenhum cliente selecionado.");
        this.renderizarPlaceholder("projeto", contexto.projeto
            ? this.resumoEntidade(contexto.projeto, "Projeto selecionado.")
            : "Nenhum projeto selecionado.");
        this.renderizarPlaceholder("servico", contexto.servico
            ? this.resumoEntidade(contexto.servico, "Servi\u00e7o selecionado.")
            : "Nenhum servi\u00e7o selecionado.");
        this.renderizarPlaceholder("produtos", this.resumoProdutos(contexto.produtos));
        this.renderizarPlaceholder("calculo", contexto.resultado
            ? this.resumoResultado(contexto.resultado)
            : "C\u00e1lculo ainda n\u00e3o realizado.");
    },

    renderizarResumo(contexto = {}) {
        const container = this.elementos.resumo;
        if (!container) return;

        const campos = [
            ["Status", this.rotuloStatus(contexto.status || "INICIADO")],
            ["Cliente", this.nomeEntidade(contexto.cliente) || "Nenhum cliente selecionado."],
            ["Projeto", this.nomeEntidade(contexto.projeto) || "Nenhum projeto selecionado."],
            ["Servi\u00e7o", this.nomeEntidade(contexto.servico) || "Nenhum servi\u00e7o selecionado."],
            ["Produtos", `${Array.isArray(contexto.produtos) ? contexto.produtos.length : 0}`],
            ["Resultado", contexto.resultado ? this.resumoResultado(contexto.resultado) : "C\u00e1lculo ainda n\u00e3o realizado."],
            ["Criado em", this.formatarData(contexto.criadoEm)],
            ["Atualizado em", this.formatarData(contexto.atualizadoEm)]
        ];

        container.innerHTML = `
            <dl>
                ${campos.map(([rotulo, valor]) => `
                    <div>
                        <dt>${this.escapar(rotulo)}</dt>
                        <dd>${this.escapar(valor)}</dd>
                    </div>
                `).join("")}
            </dl>
        `;
    },

    renderizarPlaceholder(chave, conteudo) {
        const elemento = this.elementos[chave];
        if (!elemento) return;

        elemento.innerHTML = `<p>${this.escapar(conteudo)}</p>`;
    },

    resumoProdutos(produtos = []) {
        if (!Array.isArray(produtos) || !produtos.length) {
            return "Nenhum produto adicionado.";
        }

        return produtos.map(produto => this.nomeEntidade(produto) || "Produto").join(", ");
    },

    resumoEntidade(entidade = {}, fallback) {
        return this.nomeEntidade(entidade) || fallback;
    },

    nomeEntidade(entidade = {}) {
        if (!entidade) return "";
        return entidade.nome || entidade.titulo || entidade.numero || entidade.codigo || entidade.id || "";
    },

    resumoResultado(resultado = {}) {
        if (!resultado || resultado.sucesso === false) {
            return "C\u00e1lculo ainda n\u00e3o realizado.";
        }

        const unidade = resultado.unidade ? ` ${resultado.unidade}` : "";
        return `${resultado.valorCalculado ?? 0}${unidade}`;
    },

    indiceEtapa(status) {
        const indice = this.etapas.findIndex(etapa => etapa.status === status);
        if (status === "INICIADO") return 0;
        if (indice < 0) return 0;
        return indice;
    },

    rotuloStatus(status) {
        const rotulos = {
            INICIADO: "Iniciado",
            CLIENTE_SELECIONADO: "Cliente selecionado",
            PROJETO_SELECIONADO: "Projeto selecionado",
            SERVICO_SELECIONADO: "Servi\u00e7o selecionado",
            PRODUTOS_ADICIONADOS: "Produtos adicionados",
            CALCULADO: "Calculado",
            VALIDADO: "Validado",
            FINALIZADO: "Finalizado"
        };

        return rotulos[status] || status || "Iniciado";
    },

    formatarData(valor) {
        if (!valor) return "N\u00e3o informado";

        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) {
            return "N\u00e3o informado";
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
    }
};
