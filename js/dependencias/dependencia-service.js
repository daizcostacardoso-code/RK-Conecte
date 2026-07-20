const ItemDependenciaService = {
    repository: ItemDependenciaRepository,

    configurar(repository) {
        this.repository = repository || ItemDependenciaRepository;
    },

    sucesso(chave, valor, extras = {}) {
        return { sucesso: true, [chave]: valor, ...extras };
    },

    falha(error) {
        const mensagem = error?.message || String(error) || "Erro inesperado.";
        return { sucesso: false, mensagem, erros: [mensagem] };
    },

    async listarDependencias() {
        try {
            return this.sucesso("dependencias", await this.repository.listar());
        } catch (error) {
            return this.falha(error);
        }
    },

    async buscarDependencia(id) {
        try {
            return this.sucesso("dependencia", await this.repository.buscarPorId(id));
        } catch (error) {
            return this.falha(error);
        }
    },

    async criarDependencia(dados = {}) {
        try {
            this.validar(dados);
            const dependencia = await this.repository.salvar(dados);
            return this.sucesso("dependencia", dependencia, { mensagem: dependencia.mensagem || "Dependencia cadastrada com sucesso." });
        } catch (error) {
            return this.falha(error);
        }
    },

    async atualizarDependencia(id, dados = {}) {
        try {
            this.validar(dados);
            const dependencia = await this.repository.atualizar(id, dados);
            return this.sucesso("dependencia", dependencia, { mensagem: dependencia.mensagem || "Dependencia atualizada com sucesso." });
        } catch (error) {
            return this.falha(error);
        }
    },

    async excluirDependencia(id) {
        try {
            await this.repository.excluir(id);
            return { sucesso: true, mensagem: "Dependencia removida com sucesso." };
        } catch (error) {
            return this.falha(error);
        }
    },

    async listarItensAtivos() {
        try {
            return this.sucesso("itens", await this.repository.listarItensAtivos());
        } catch (error) {
            return this.falha(error);
        }
    },

    async listarProdutosAtivos() {
        try {
            return this.sucesso("produtos", await this.repository.listarProdutosAtivos());
        } catch (error) {
            return this.falha(error);
        }
    },

    validar(dados = {}) {
        if (!Number(dados.item_id)) throw new Error("Item e obrigatorio.");
        if (!Number(dados.produto_id)) throw new Error("Produto e obrigatorio.");
        if (Number(dados.quantidade) <= 0) throw new Error("Quantidade deve ser maior que zero.");
    }
};

window.ItemDependenciaService = ItemDependenciaService;
