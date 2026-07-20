const ClienteFactory = {
    criar(dados = {}) {
        if (typeof criarClienteBase === "function") {
            return criarClienteBase(dados);
        }

        return ClienteModel.criar(dados);
    },

    criarPessoaFisica(dados = {}) {
        return this.criar({
            ...dados,
            tipoPessoa: "fisica"
        });
    },

    criarPessoaJuridica(dados = {}) {
        return this.criar({
            ...dados,
            tipoPessoa: "juridica"
        });
    },

    criarVazio() {
        return this.criar({
            nome: "Cliente",
            tipoPessoa: "fisica"
        });
    }
};
