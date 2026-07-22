const ItemDependenciaController = {
    async iniciar() {
        ItemDependenciaService.configurar(ItemDependenciaRepository);
        ItemDependenciaUI.iniciar({
            aoSalvarDependencia: dados => this.salvarDependencia(dados),
            aoEditarDependencia: id => this.editarDependencia(id),
            aoRemoverDependencia: id => this.removerDependencia(id)
        });

        await this.carregarCombos();
        await this.listarDependencias();
    },

    async carregarCombos() {
        const [itens, produtos] = await Promise.all([
            ItemDependenciaService.listarItensAtivos(),
            ItemDependenciaService.listarProdutosAtivos()
        ]);

        if (itens.sucesso) ItemDependenciaUI.carregarItens(itens.itens || []);
        else ItemDependenciaUI.mostrarAviso(this.formatarErros(itens.erros), "erro");

        if (produtos.sucesso) ItemDependenciaUI.carregarProdutos(produtos.produtos || []);
        else ItemDependenciaUI.mostrarAviso(this.formatarErros(produtos.erros), "erro");
    },

    async listarDependencias() {
        const resultado = await ItemDependenciaService.listarDependencias();

        if (!resultado.sucesso) {
            ItemDependenciaUI.renderizarLista([]);
            ItemDependenciaUI.mostrarAviso(resultado.mensagem || this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        ItemDependenciaUI.renderizarLista(resultado.dependencias || []);
        return resultado;
    },

    async salvarDependencia(dados = {}) {
        ItemDependenciaUI.definirCarregando(true);
        ItemDependenciaUI.mostrarAviso("Salvando dependencia...", "info");

        try {
            const resultado = dados.id
                ? await ItemDependenciaService.atualizarDependencia(dados.id, dados)
                : await ItemDependenciaService.criarDependencia(dados);

            if (!resultado.sucesso) {
                ItemDependenciaUI.mostrarAviso(resultado.mensagem || this.formatarErros(resultado.erros), "erro");
                return resultado;
            }

            ItemDependenciaUI.mostrarAviso(
                resultado.mensagem || (dados.id ? "Dependencia atualizada com sucesso." : "Dependencia cadastrada com sucesso."),
                "sucesso"
            );
            ItemDependenciaUI.limparFormulario(false);
            await this.listarDependencias();
            return resultado;
        } catch (error) {
            const mensagem = error?.message || "Nao foi possivel salvar a dependencia.";
            ItemDependenciaUI.mostrarAviso(mensagem, "erro");
            return { sucesso: false, mensagem, erros: [mensagem] };
        } finally {
            ItemDependenciaUI.definirCarregando(false);
        }
    },

    async editarDependencia(id) {
        const resultado = await ItemDependenciaService.buscarDependencia(id);

        if (!resultado.sucesso) {
            ItemDependenciaUI.mostrarAviso(resultado.mensagem || this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        ItemDependenciaUI.preencherFormulario(resultado.dependencia);
        return resultado;
    },

    async removerDependencia(id) {
        const resultado = await ItemDependenciaService.excluirDependencia(id);

        if (!resultado.sucesso) {
            ItemDependenciaUI.mostrarAviso(resultado.mensagem || this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        ItemDependenciaUI.mostrarAviso(resultado.mensagem || "Dependencia removida com sucesso.", "sucesso");
        await this.listarDependencias();
        return resultado;
    },

    formatarErros(erros = []) {
        return Array.isArray(erros) ? erros.join(" ") : String(erros || "Erro inesperado.");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("formDependencia")) {
        void (window.RKLoading?.initial
            ? RKLoading.initial(() => ItemDependenciaController.iniciar(), "Carregando dependencias...")
            : ItemDependenciaController.iniciar());
    }
});

window.ItemDependenciaController = ItemDependenciaController;
