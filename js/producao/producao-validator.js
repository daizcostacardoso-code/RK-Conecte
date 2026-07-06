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

        if (!this.prioridadeValida(ordem.prioridade)) {
            erros.push("Prioridade da ordem de producao invalida.");
        }

        if (!this.dataValida(ordem.criadoEm || ordem.dataCriacao)) {
            erros.push("Data de criacao da ordem de producao invalida.");
        }

        if (ordem.historico && !Array.isArray(ordem.historico)) {
            erros.push("Historico da ordem de producao invalido.");
        }

        if (!Array.isArray(ordem.checklist)) {
            erros.push("Checklist da ordem de producao invalido.");
        } else {
            this.validarChecklist(ordem.checklist).forEach(erro => erros.push(erro));
        }

        return {
            valido: erros.length === 0,
            erros
        };
    },

    validarPlanejamento(ordem = {}) {
        const erros = [];

        if (!String(ordem.responsavel || "").trim()) {
            erros.push("Responsavel da ordem de producao e obrigatorio para liberar.");
        }

        if (!String(ordem.previsaoEntrega || "").trim()) {
            erros.push("Previsao de entrega da ordem de producao e obrigatoria para liberar.");
        }

        return {
            valido: erros.length === 0,
            erros
        };
    },

    validarChecklist(checklist = []) {
        return checklist.reduce((erros, item, indice) => {
            if (!String(item.id || "").trim()) {
                erros.push(`Item ${indice + 1} do checklist precisa de id.`);
            }

            if (!String(item.titulo || "").trim()) {
                erros.push(`Item ${indice + 1} do checklist precisa de titulo.`);
            }

            if (typeof item.concluido !== "boolean") {
                erros.push(`Item ${indice + 1} do checklist precisa informar se foi concluido.`);
            }

            if (!this.dataValida(item.atualizadoEm)) {
                erros.push(`Item ${indice + 1} do checklist possui data invalida.`);
            }

            return erros;
        }, []);
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

        return ["PENDENTE", "PLANEJADA", "LIBERADA", "EM_PRODUCAO", "FINALIZADA"].includes(String(status || "").trim());
    },

    prioridadeValida(prioridade) {
        if (typeof ProducaoModel !== "undefined" && typeof ProducaoModel.prioridadeValida === "function") {
            return ProducaoModel.prioridadeValida(prioridade);
        }

        return ["BAIXA", "NORMAL", "ALTA", "URGENTE"].includes(String(prioridade || "").trim());
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
