const CadastroItemService = {
    repository: CadastroItemRepository,

    configurar(repository) {
        this.repository = repository || CadastroItemRepository;
    },

    sucesso(chave, valor, extras = {}) {
        return { sucesso: true, [chave]: valor, ...extras };
    },

    falha(error) {
        const mensagem = error?.message || String(error) || "Erro inesperado.";
        return { sucesso: false, mensagem, erros: [mensagem] };
    },

    async listarItens(filtros = {}) {
        try {
            return this.sucesso("itens", await this.repository.listar(filtros));
        } catch (error) {
            return this.falha(error);
        }
    },

    async buscarItem(id) {
        try {
            return this.sucesso("item", await this.repository.buscarPorId(id));
        } catch (error) {
            return this.falha(error);
        }
    },

    async criarItem(dados = {}) {
        try {
            this.validar(dados);
            const item = await this.repository.salvar(dados);
            return this.sucesso("item", item, { mensagem: item.mensagem || "Item cadastrado com sucesso." });
        } catch (error) {
            return this.falha(error);
        }
    },

    async atualizarItem(id, dados = {}) {
        try {
            this.validar(dados);
            const item = await this.repository.atualizar(id, dados);
            return this.sucesso("item", item, { mensagem: item.mensagem || "Item atualizado com sucesso." });
        } catch (error) {
            return this.falha(error);
        }
    },

    async excluirItem(id) {
        try {
            await this.repository.excluir(id);
            return { sucesso: true, mensagem: "Item inativado com sucesso." };
        } catch (error) {
            return this.falha(error);
        }
    },

    async listarCategoriasItem() {
        try {
            return this.sucesso("categorias", await this.repository.listarCategoriasItem());
        } catch (error) {
            return this.falha(error);
        }
    },

    validar(dados = {}) {
        if (!Number(dados.categoria_item_id)) throw new Error("Categoria do item e obrigatoria.");
        if (!String(dados.descricao || "").trim()) throw new Error("Descricao do item e obrigatoria.");
    }
};

window.CadastroItemService = CadastroItemService;
