const AprovarDocumentoUseCase = {
    executar(documento = null, opcoes = {}, service = ComercialService) {
        try {
            if (!service || typeof service.aprovar !== "function") {
                return this.respostaErro(["ComercialService indisponivel para aprovacao."]);
            }

            return service.aprovar(documento, opcoes);
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao executar AprovarDocumentoUseCase."]);
        }
    },

    respostaErro(erros = []) {
        return {
            sucesso: false,
            documento: null,
            comercial: null,
            statusComercial: "",
            dataAprovacao: "",
            ultimaAcaoComercial: "",
            evento: null,
            workflowEvento: null,
            exportacao: null,
            erros: Array.isArray(erros) ? erros : [String(erros || "Erro ao aprovar Documento Comercial.")],
            detalhes: {}
        };
    }
};
