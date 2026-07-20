const OrcamentoAprovacaoValidator = {
    transicoes: {
        rascunho: ["emitido", "cancelado"],
        emitido: ["enviado", "aprovado", "recusado", "cancelado"],
        enviado: ["aprovado", "recusado", "cancelado"],
        recusado: ["enviado", "cancelado"],
        expirado: ["enviado", "cancelado"],
        aprovado: ["cancelado"],
        cancelado: []
    },

    destinoDaAcao(acao = "") {
        const destinos = {
            emitir: "emitido",
            enviar: "enviado",
            aprovar: "aprovado",
            recusar: "recusado",
            cancelar: "cancelado",
            expirar: "expirado"
        };
        return destinos[this.chave(acao)] || "";
    },

    validarTransicao(statusAtual = "", statusDestino = "") {
        const modelo = this.modelo();
        const origem = modelo.normalizarStatus(statusAtual);
        const destino = modelo.normalizarStatus(statusDestino);
        return {
            valido: (this.transicoes[origem] || []).includes(destino),
            origem,
            destino,
            proximos: [...(this.transicoes[origem] || [])]
        };
    },

    validarAcao(registro = {}, acao = "", dados = {}) {
        const modelo = this.modelo();
        const atual = modelo.normalizarRegistro(registro);
        const acaoNormalizada = this.chave(acao);
        const destino = this.destinoDaAcao(acaoNormalizada);
        const erros = [];

        if (!destino) erros.push("Ação comercial inválida.");
        if (acaoNormalizada === "recusar" && !modelo.texto(dados.motivoRecusa)) {
            erros.push("Informe o motivo da recusa.");
        }
        if (acaoNormalizada === "cancelar" && dados.confirmado !== true) {
            erros.push("Confirme o cancelamento do orçamento.");
        }
        if (acaoNormalizada === "aprovar") erros.push(...this.validarDadosParaAprovacao(atual));

        const transicao = this.validarTransicao(atual.status, destino);
        if (!transicao.valido && !(acaoNormalizada === "aprovar" && atual.status === "aprovado")) {
            if (atual.status === "cancelado") erros.push("Orçamento cancelado não pode receber nova aprovação.");
            else erros.push(`Não é permitido alterar o orçamento de ${atual.status} para ${destino}.`);
        }

        return {
            valido: erros.length === 0,
            erros: [...new Set(erros)],
            acao: acaoNormalizada,
            destino,
            registro: atual,
            transicao
        };
    },

    validarDadosParaAprovacao(registro = {}) {
        const modelo = this.modelo();
        const erros = [];
        const cliente = modelo.obterCliente(registro);
        const clienteNome = modelo.texto(cliente.nome || registro.clienteNome || registro.nomeCliente);
        if (!clienteNome) erros.push("Informe o cliente antes de aprovar o orçamento.");
        if (!modelo.obterItens(registro).length) erros.push("Inclua pelo menos um item antes de aprovar o orçamento.");
        if (modelo.obterTotal(registro) <= 0) erros.push("Informe um valor total válido antes de aprovar o orçamento.");
        return erros;
    },

    acoesDisponiveis(registro = {}) {
        const modelo = this.modelo();
        const atual = modelo.normalizarRegistro(registro);
        const acoes = [];
        const incluir = (chave, rotulo, destaque = false) => {
            const validacao = this.validarAcao(atual, chave, { motivoRecusa: "motivo", confirmado: true });
            if (validacao.transicao.valido || (chave === "aprovar" && atual.status === "aprovado")) {
                acoes.push({ chave, rotulo, destaque });
            }
        };
        incluir("emitir", "Marcar como emitido");
        incluir("enviar", "Marcar como enviado");
        incluir("aprovar", "Aprovar", true);
        incluir("recusar", "Recusar");
        incluir("cancelar", "Cancelar");
        return acoes;
    },

    chave(valor) {
        return this.modelo().chave(valor);
    },

    modelo() {
        if (typeof OrcamentoAprovacaoModel === "undefined") {
            throw new Error("Modelo de aprovação de orçamento indisponível.");
        }
        return OrcamentoAprovacaoModel;
    }
};

if (typeof window !== "undefined") window.OrcamentoAprovacaoValidator = OrcamentoAprovacaoValidator;
if (typeof module !== "undefined" && module.exports) module.exports = { OrcamentoAprovacaoValidator };
