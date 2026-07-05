const ReprovarDocumentoUseCase = {
    executar(documento = null, motivo = "", opcoes = {}, service = ComercialService) {
        try {
            if (!service || typeof service.reprovar !== "function") {
                return this.respostaErro(["ComercialService indisponivel para reprovacao."]);
            }

            return service.reprovar(documento, motivo, opcoes);
        } catch (erro) {
            return this.respostaErro([erro.message || "Erro ao executar ReprovarDocumentoUseCase."]);
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
            erros: Array.isArray(erros) ? erros : [String(erros || "Erro ao reprovar Documento Comercial.")],
            detalhes: {}
        };
    }
};
