const CaixaService = {
    repository: CaixaRepository,

    configurar(opcoes = {}) {
        this.repository.configurar(opcoes);
        return this;
    },

    async listar() {
        return this.repository.listar();
    },

    async salvar(dados) {
        const validacao = CaixaValidator.validar(dados);
        if (!validacao.valido) {
            return {
                sucesso: false,
                erros: validacao.erros,
                dados: validacao.dados
            };
        }

        const salvo = await this.repository.salvar(validacao.dados);
        return {
            sucesso: true,
            dados: salvo,
            lista: await this.repository.listar()
        };
    },

    async atualizar(id, dados) {
        const atualizado = await this.repository.atualizar(id, dados);
        return {
            sucesso: Boolean(atualizado),
            dados: atualizado,
            lista: await this.repository.listar()
        };
    },

    async cancelar(id) {
        return this.atualizar(id, {
            status: "cancelado",
            atualizadoEmISO: new Date().toISOString()
        });
    },

    async excluir(id) {
        const sucesso = await this.repository.excluir(id);
        return {
            sucesso,
            lista: await this.repository.listar()
        };
    },

    async exportarJSON() {
        const dados = await this.repository.exportarJSON();
        return CaixaExport.montarBackup(dados);
    },

    async baixarBackupJSON(lista = null) {
        const dados = Array.isArray(lista) ? lista : await this.repository.exportarJSON();
        return CaixaExport.baixar(dados);
    },

    async importarJSON(lista) {
        return this.repository.importarJSON(lista);
    },

    normalizarLista(lista) {
        return CaixaModel.normalizarLista(lista);
    },

    normalizarMovimento(movimento, indice = 0) {
        return CaixaModel.criar(movimento, indice);
    },

    ordenar(lista) {
        return CaixaModel.ordenar(lista);
    },

    chave(movimento, indice = 0) {
        return CaixaModel.chave(movimento, indice);
    }
};

window.CaixaService = CaixaService;
