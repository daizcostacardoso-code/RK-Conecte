const TamanhoPadraoController = {
    async iniciar() {
        TamanhoPadraoService.configurar(TamanhoPadraoRepository);
        TamanhoPadraoUI.iniciar({
            aoSalvarTamanho: dados => this.salvarTamanho(dados),
            aoEditarTamanho: id => this.editarTamanho(id),
            aoInativarTamanho: id => this.inativarTamanho(id)
        });

        await this.carregarItens();
        await this.listarTamanhos();
    },

    async carregarItens() {
        const resultado = await TamanhoPadraoService.listarItensAtivos();

        if (!resultado.sucesso) {
            TamanhoPadraoUI.mostrarAviso(this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        TamanhoPadraoUI.carregarItens(resultado.itens || []);
        return resultado;
    },

    async listarTamanhos() {
        const resultado = await TamanhoPadraoService.listarTamanhos();

        if (!resultado.sucesso) {
            TamanhoPadraoUI.renderizarLista([]);
            TamanhoPadraoUI.mostrarAviso(resultado.mensagem || this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        TamanhoPadraoUI.renderizarLista(resultado.tamanhos || []);
        return resultado;
    },

    async salvarTamanho(dados = {}) {
        TamanhoPadraoUI.definirCarregando(true);
        TamanhoPadraoUI.mostrarAviso("Salvando tamanho padrao...", "info");

        try {
            const resultado = dados.id
                ? await TamanhoPadraoService.atualizarTamanho(dados.id, dados)
                : await TamanhoPadraoService.criarTamanho(dados);

            if (!resultado.sucesso) {
                TamanhoPadraoUI.mostrarAviso(resultado.mensagem || this.formatarErros(resultado.erros), "erro");
                return resultado;
            }

            TamanhoPadraoUI.mostrarAviso(
                resultado.mensagem || (dados.id ? "Tamanho padrao atualizado com sucesso." : "Tamanho padrao cadastrado com sucesso."),
                "sucesso"
            );
            TamanhoPadraoUI.limparFormulario(false);
            await this.listarTamanhos();
            return resultado;
        } catch (error) {
            const mensagem = error?.message || "Nao foi possivel salvar o tamanho padrao.";
            TamanhoPadraoUI.mostrarAviso(mensagem, "erro");
            return { sucesso: false, mensagem, erros: [mensagem] };
        } finally {
            TamanhoPadraoUI.definirCarregando(false);
        }
    },

    async editarTamanho(id) {
        const resultado = await TamanhoPadraoService.buscarTamanho(id);

        if (!resultado.sucesso) {
            TamanhoPadraoUI.mostrarAviso(resultado.mensagem || this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        TamanhoPadraoUI.preencherFormulario(resultado.tamanho);
        return resultado;
    },

    async inativarTamanho(id) {
        const resultado = await TamanhoPadraoService.excluirTamanho(id);

        if (!resultado.sucesso) {
            TamanhoPadraoUI.mostrarAviso(resultado.mensagem || this.formatarErros(resultado.erros), "erro");
            return resultado;
        }

        TamanhoPadraoUI.mostrarAviso(resultado.mensagem || "Tamanho padrao inativado com sucesso.", "sucesso");
        await this.listarTamanhos();
        return resultado;
    },

    formatarErros(erros = []) {
        return Array.isArray(erros) ? erros.join(" ") : String(erros || "Erro inesperado.");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("formTamanho")) {
        TamanhoPadraoController.iniciar();
    }
});

window.TamanhoPadraoController = TamanhoPadraoController;
