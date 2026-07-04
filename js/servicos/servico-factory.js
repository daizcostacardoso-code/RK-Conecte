const ServicoFactory = {
    criar(dados = {}) {
        if (typeof criarServicoBase === "function") {
            return criarServicoBase(dados);
        }

        return ServicoModel.criar(dados);
    },

    criarPadrao(dados = {}) {
        return this.criar({
            categoria: "projeto_personalizado",
            tipoCalculo: "personalizado",
            unidadeVenda: "servico",
            ativo: true,
            ...dados
        });
    },

    criarVazio() {
        return this.criarPadrao({
            nome: "Servico"
        });
    }
};
