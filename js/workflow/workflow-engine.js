const WorkflowEngine = {
    alterarEstado(projeto = {}, novoEstado, usuario = "") {
        const estadoAtual = projeto.status || projeto.estado || WORKFLOW_STATE.RASCUNHO;

        if (!this.validar(estadoAtual, novoEstado)) {
            return {
                sucesso: false,
                projeto,
                evento: null,
                erro: "Transicao de workflow invalida."
            };
        }

        const atualizado = {
            ...projeto,
            status: novoEstado,
            estado: novoEstado,
            datas: {
                ...(projeto.datas || {}),
                atualizacao: new Date().toISOString()
            }
        };

        const evento = this.registrar({
            tipo: "status_alterado",
            descricao: `Status alterado de ${estadoAtual} para ${novoEstado}`,
            usuario,
            projetoId: atualizado.id || atualizado.projetoId || "",
            dados: {
                estadoAnterior: estadoAtual,
                novoEstado
            }
        });

        return {
            sucesso: true,
            projeto: atualizado,
            evento,
            erro: null
        };
    },

    validar(estadoAtual, novoEstado) {
        return validarTransicao(estadoAtual, novoEstado);
    },

    registrar(evento = {}) {
        return registrarEvento(evento);
    },

    obterProximosEstados(estadoAtual) {
        return obterProximosEstados(estadoAtual);
    },

    podeExecutar(projeto = {}, novoEstado) {
        const estadoAtual = projeto.status || projeto.estado || WORKFLOW_STATE.RASCUNHO;
        return this.validar(estadoAtual, novoEstado);
    }
};

