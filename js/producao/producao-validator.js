const ProducaoValidator = {
    validar(ordem = {}) {
        const erros = [];

        if (!ordem || typeof ordem !== "object") {
            return {
                valido: false,
                erros: ["Ordem de producao invalida."]
            };
        }

        if (!String(ordem.id || "").trim()) {
            erros.push("Id da ordem de producao e obrigatorio.");
        }

        if (!String(ordem.projetoId || "").trim()) {
            erros.push("Projeto da ordem de producao e obrigatorio.");
        }

        if (!this.statusValido(ordem.status)) {
            erros.push("Status da ordem de producao invalido.");
        }

        if (!this.dataValida(ordem.dataCriacao)) {
            erros.push("Data de criacao da ordem de producao invalida.");
        }

        if (!String(ordem.responsavel || "").trim()) {
            erros.push("Responsavel da ordem de producao e obrigatorio.");
        }

        if (!String(ordem.prioridade || "").trim()) {
            erros.push("Prioridade da ordem de producao e obrigatoria.");
        }

        if (ordem.historico && !Array.isArray(ordem.historico)) {
            erros.push("Historico da ordem de producao invalido.");
        }

        return {
            valido: erros.length === 0,
            erros
        };
    },

    validarTransicao(statusAtual, novoStatus) {
        const origem = this.normalizarStatus(statusAtual);
        const destino = this.normalizarStatus(novoStatus);
        const valido = typeof ProducaoModel !== "undefined" &&
            typeof ProducaoModel.podeTransicionar === "function" &&
            ProducaoModel.podeTransicionar(origem, destino);

        return {
            valido,
            origem,
            destino,
            erros: valido ? [] : [`Transicao de producao invalida: ${origem} -> ${destino}.`]
        };
    },

    statusValido(status) {
        if (typeof ProducaoModel !== "undefined" && typeof ProducaoModel.statusValido === "function") {
            return ProducaoModel.statusValido(status);
        }

        return ["PENDENTE", "PLANEJADA", "EM_PRODUCAO", "FINALIZADA"].includes(String(status || "").trim());
    },

    normalizarStatus(status) {
        if (typeof ProducaoModel !== "undefined" && typeof ProducaoModel.normalizarStatus === "function") {
            return ProducaoModel.normalizarStatus(status);
        }

        return String(status || "").trim();
    },

    dataValida(valor) {
        if (!valor) {
            return false;
        }

        return !Number.isNaN(new Date(valor).getTime());
    }
};
