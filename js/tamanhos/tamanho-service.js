const TamanhoPadraoService = {
    repository: TamanhoPadraoRepository,

    configurar(repository) {
        this.repository = repository || TamanhoPadraoRepository;
    },

    sucesso(chave, valor, extras = {}) {
        return { sucesso: true, [chave]: valor, ...extras };
    },

    falha(error) {
        const mensagem = error?.message || String(error) || "Erro inesperado.";
        return { sucesso: false, mensagem, erros: [mensagem] };
    },

    async listarTamanhos(filtros = {}) {
        try {
            return this.sucesso("tamanhos", await this.repository.listar(filtros));
        } catch (error) {
            return this.falha(error);
        }
    },

    async buscarTamanho(id) {
        try {
            return this.sucesso("tamanho", await this.repository.buscarPorId(id));
        } catch (error) {
            return this.falha(error);
        }
    },

    async criarTamanho(dados = {}) {
        try {
            this.validar(dados);
            const tamanho = await this.repository.salvar(dados);
            return this.sucesso("tamanho", tamanho, { mensagem: tamanho.mensagem || "Tamanho padrao cadastrado com sucesso." });
        } catch (error) {
            return this.falha(error);
        }
    },

    async atualizarTamanho(id, dados = {}) {
        try {
            this.validar(dados);
            const tamanho = await this.repository.atualizar(id, dados);
            return this.sucesso("tamanho", tamanho, { mensagem: tamanho.mensagem || "Tamanho padrao atualizado com sucesso." });
        } catch (error) {
            return this.falha(error);
        }
    },

    async excluirTamanho(id) {
        try {
            await this.repository.excluir(id);
            return { sucesso: true, mensagem: "Tamanho padrao inativado com sucesso." };
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

    validar(dados = {}) {
        if (!Number(dados.item_id)) throw new Error("Item e obrigatorio.");
        if (!String(dados.descricao || "").trim()) throw new Error("Descricao do tamanho e obrigatoria.");
        if (String(dados.descricao || "").trim().length > 100) throw new Error("Descricao deve ter no maximo 100 caracteres.");
        if (Number(dados.altura) <= 0) throw new Error("Altura deve ser maior que zero.");
        if (Number(dados.largura) <= 0) throw new Error("Largura deve ser maior que zero.");
    }
};

window.TamanhoPadraoService = TamanhoPadraoService;
