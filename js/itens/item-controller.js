const CadastroItemController = {
    async iniciar() {
        CadastroItemService.configurar(CadastroItemRepository);
        CadastroItemUI.iniciar({
            aoSalvarItem: dados => this.salvarItem(dados),
            aoEditarItem: id => this.editarItem(id),
            aoInativarItem: id => this.inativarItem(id)
        });

        await this.carregarCategorias();
        await this.listarItens();
    },

    async carregarCategorias() {
        const resultado = await CadastroItemService.listarCategoriasItem();

        if (!resultado.sucesso) {
            CadastroItemUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        CadastroItemUI.carregarCategorias(resultado.categorias || []);
        return resultado;
    },

    async listarItens() {
        const resultado = await CadastroItemService.listarItens();

        if (!resultado.sucesso) {
            CadastroItemUI.renderizarLista([]);
            CadastroItemUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        CadastroItemUI.renderizarLista(resultado.itens || []);
        return resultado;
    },

    async salvarItem(dados = {}) {
        CadastroItemUI.definirCarregando(true);
        CadastroItemUI.mostrarAviso("Salvando item...", "info");

        try {
            const resultado = dados.id
                ? await CadastroItemService.atualizarItem(dados.id, dados)
                : await CadastroItemService.criarItem(dados);

            if (!resultado.sucesso) {
                CadastroItemUI.mostrarAviso(resultado.mensagem || this.formatarErros(resultado.erros), "erro");
                return resultado;
            }

            CadastroItemUI.mostrarAviso(
                resultado.mensagem || (dados.id ? "Item atualizado com sucesso." : "Item cadastrado com sucesso."),
                "sucesso"
            );
            CadastroItemUI.limparFormulario(false);
            await this.listarItens();
            return resultado;
        } catch (error) {
            const mensagem = error?.message || "Nao foi possivel salvar o item.";
            CadastroItemUI.mostrarAviso(mensagem, "erro");
            return { sucesso: false, mensagem, erros: [mensagem] };
        } finally {
            CadastroItemUI.definirCarregando(false);
        }
    },

    async editarItem(id) {
        const resultado = await CadastroItemService.buscarItem(id);

        if (!resultado.sucesso) {
            CadastroItemUI.mostrarAviso(resultado.mensagem || this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        CadastroItemUI.preencherFormulario(resultado.item);
        return resultado;
    },

    async inativarItem(id) {
        const resultado = await CadastroItemService.excluirItem(id);

        if (!resultado.sucesso) {
            CadastroItemUI.mostrarAviso(resultado.mensagem || this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        CadastroItemUI.mostrarAviso(resultado.mensagem || "Item inativado com sucesso.", "sucesso");
        await this.listarItens();
        return resultado;
    },

    formatarErros(erros = []) {
        return Array.isArray(erros) ? erros.join(" ") : String(erros || "Erro inesperado.");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("formItem")) {
        CadastroItemController.iniciar();
    }
});

window.CadastroItemController = CadastroItemController;
