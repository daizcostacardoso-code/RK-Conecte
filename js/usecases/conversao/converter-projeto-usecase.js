const ConverterProjetoUseCase = {
    executar(documento = null, opcoes = {}, service = ConversaoService) {
        try {
            if (!service || typeof service.converter !== "function") {
                return this.respostaErro(["ConversaoService indisponivel para converter Projeto."]);
            }

            return service.converter(documento, opcoes);
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao executar ConverterProjetoUseCase."]);
        }
    },

    respostaErro(erros = []) {
        return {
            sucesso: false,
            projeto: null,
            documento: null,
            documentoOrigem: null,
            dataConversao: "",
            conversao: null,
            workflowEvento: null,
            eventos: {
                criado: null,
                convertido: null
            },
            appState: false,
            erros: Array.isArray(erros) ? erros : [String(erros || "Erro ao converter Documento Comercial em Projeto.")],
            detalhes: {}
        };
    }
};
