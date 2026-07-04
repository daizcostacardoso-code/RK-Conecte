const DashboardUtils = {
    formatarStatus(status) {
        if (typeof ProjetoStatus !== "undefined" && typeof ProjetoStatus.rotulo === "function") {
            return ProjetoStatus.rotulo(status);
        }

        if (typeof WorkflowState !== "undefined" && typeof WorkflowState.rotulo === "function") {
            return WorkflowState.rotulo(status);
        }

        const rotulos = {
            rascunho: "Rascunho",
            em_orcamento: "Em orcamento",
            enviado: "Enviado",
            aprovado: "Aprovado",
            em_producao: "Em producao",
            em_instalacao: "Em instalacao",
            concluido: "Concluido",
            cancelado: "Cancelado"
        };

        return rotulos[status] || status || "";
    },

    formatarQuantidade(quantidade) {
        const numero = Number(quantidade || 0);
        return Number.isFinite(numero) ? numero.toLocaleString("pt-BR") : "0";
    },

    agruparPorStatus(projetos = []) {
        return projetos.reduce((grupos, projeto) => {
            const status = projeto.status || "sem_status";
            grupos[status] = (grupos[status] || 0) + 1;
            return grupos;
        }, {});
    },

    ordenarPorData(lista = [], campo = "datas.atualizacao", direcao = "desc") {
        const fator = direcao === "asc" ? 1 : -1;

        return [...lista].sort((a, b) => {
            const dataA = this.valorData(this.obterValor(a, campo));
            const dataB = this.valorData(this.obterValor(b, campo));
            return (dataA - dataB) * fator;
        });
    },

    obterValor(objeto = {}, caminho = "") {
        return String(caminho || "").split(".").reduce((valor, chave) => {
            if (!chave) return valor;
            return valor && valor[chave] !== undefined ? valor[chave] : "";
        }, objeto);
    },

    valorData(valor) {
        const data = new Date(valor || 0).getTime();
        return Number.isFinite(data) ? data : 0;
    }
};
