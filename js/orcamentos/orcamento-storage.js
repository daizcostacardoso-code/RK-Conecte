const OrcamentoStorage = {
    async carregarAtual() {
        return Storage.carregar(Config.storage.orcamentoAtual, null);
    },

    async salvarAtual(dados) {
        Storage.salvar(Config.storage.orcamentoAtual, dados);
        return true;
    },

    limparAtual() {
        Storage.remover(Config.storage.orcamentoAtual);
    }
};
