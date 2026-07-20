const MedicaoController = {
    estado: null,
    projeto: null,
    editandoId: null,

    async iniciar() {
        const parametros = new URLSearchParams(window.location.search || "");
        MedicaoModel.configurarContexto({
            projetoId: parametros.get("projetoId") || "",
            orcamentoId: parametros.get("orcamentoId") || ""
        });
        this.estado = MedicaoModel.carregar();
        await this.carregarProjetoContexto();
        MedicaoUI.preencherGerais(this.estado);
        MedicaoUI.renderizarMedidas(this.estado.medidas);
        this.registrarEventos();
    },

    async carregarProjetoContexto() {
        const projetoId = MedicaoModel.contexto.projetoId;
        if (!projetoId) return this.renderizarContexto();
        if (typeof db === "undefined" || !db || typeof db.collection !== "function") {
            MedicaoUI.mensagem("Firestore indisponível para carregar o projeto.");
            return;
        }
        try {
            const snapshot = await db.collection("projetos").doc(projetoId).get();
            if (!snapshot.exists) {
                MedicaoUI.mensagem("Projeto operacional não encontrado.");
                return;
            }
            this.projeto = { id: snapshot.id, ...snapshot.data() };
            this.aplicarProjeto(this.projeto);
            MedicaoModel.salvar(this.estado);
            this.renderizarContexto();
        } catch (erro) {
            console.error(erro);
            MedicaoUI.mensagem("Não foi possível carregar o projeto operacional.");
        }
    },

    aplicarProjeto(projeto = {}) {
        const cliente = projeto.cliente || {};
        const obra = projeto.obra || {};
        this.estado.projetoId = projeto.id || this.estado.projetoId || "";
        this.estado.orcamentoId = projeto.orcamento?.id || this.estado.orcamentoId || "";
        this.estado.clienteNome = this.estado.clienteNome || cliente.nome || projeto.clienteNome || "";
        this.estado.clienteDocumento = this.estado.clienteDocumento || cliente.documento || "";
        this.estado.clienteTelefone = this.estado.clienteTelefone || cliente.telefone || "";
        this.estado.obraEndereco = this.estado.obraEndereco || obra.endereco || projeto.enderecoObra || "";
        this.estado.observacoesGerais = this.estado.observacoesGerais || obra.observacoes || projeto.operacional?.observacoes || "";
        return this.estado;
    },

    renderizarContexto() {
        const elemento = document.getElementById("medicaoContexto");
        if (!elemento) return;
        if (!this.projeto) {
            elemento.hidden = true;
            elemento.textContent = "";
            return;
        }
        const numeroProjeto = this.projeto.numero || this.projeto.id;
        const numeroOrcamento = this.projeto.orcamento?.numero || this.estado.orcamentoId || "não informado";
        elemento.textContent = `Projeto ${numeroProjeto} · Orçamento ${numeroOrcamento} · rascunho salvo somente neste dispositivo.`;
        elemento.hidden = false;
    },

    registrarEventos() {
        MedicaoUI.elemento("formMedida").addEventListener("submit", e => { e.preventDefault(); this.salvarMedida(); });
        MedicaoUI.elemento("btnLimparMedida").addEventListener("click", () => this.cancelarEdicao());
        MedicaoUI.elemento("medidasCorpo").addEventListener("click", e => { const b = e.target.closest("button[data-acao]"); if (b) this.acaoMedida(b.dataset.acao, b.dataset.id); });
        MedicaoUI.ids.forEach(id => MedicaoUI.elemento(id).addEventListener("input", () => this.salvarGerais()));
        MedicaoUI.elemento("btnGerarPdf").addEventListener("click", () => this.gerarPdf());
        MedicaoUI.elemento("btnLimparTudo").addEventListener("click", () => this.limparTudo());
    },

    salvarGerais() {
        Object.assign(this.estado, MedicaoUI.lerGerais());
        MedicaoModel.salvar(this.estado);
    },

    salvarMedida() {
        const resultado = MedicaoModel.criarMedida({ ...MedicaoUI.lerMedida(), id: this.editandoId });
        if (resultado.erros.length) { MedicaoUI.mensagem(resultado.erros.join(" ")); return; }
        const indice = this.estado.medidas.findIndex(m => m.id === this.editandoId);
        if (indice >= 0) this.estado.medidas[indice] = resultado.medida; else this.estado.medidas.push(resultado.medida);
        MedicaoModel.salvar(this.estado);
        MedicaoUI.renderizarMedidas(this.estado.medidas);
        this.cancelarEdicao();
        MedicaoUI.mensagem(indice >= 0 ? "Medida atualizada com sucesso." : "Medida adicionada com sucesso.", "sucesso");
        MedicaoUI.manterFormularioMedidaVisivel();
    },

    cancelarEdicao() {
        this.editandoId = null;
        MedicaoUI.limparMedida();
        MedicaoUI.modoEdicao(false);
    },

    acaoMedida(acao, id) {
        const medida = this.estado.medidas.find(m => m.id === id);
        if (!medida) return;
        if (acao === "editar") {
            this.editandoId = id;
            MedicaoUI.preencherMedida(medida);
            MedicaoUI.modoEdicao(true);
            MedicaoUI.elemento("novaMedidaTitulo").scrollIntoView({ behavior: "smooth" });
            return;
        }
        if (acao === "remover" && window.confirm("Remover esta medida?")) {
            this.estado.medidas = this.estado.medidas.filter(m => m.id !== id);
            MedicaoModel.salvar(this.estado);
            MedicaoUI.renderizarMedidas(this.estado.medidas);
            if (this.editandoId === id) this.cancelarEdicao();
            MedicaoUI.mensagem("Medida removida.", "sucesso");
        }
    },

    async gerarPdf() {
        this.salvarGerais();
        if (!this.estado.clienteNome.trim()) { MedicaoUI.mensagem("Informe o nome do cliente antes de gerar o PDF."); MedicaoUI.elemento("clienteNome").focus(); return; }
        if (!this.estado.medidas.length) { MedicaoUI.mensagem("Adicione pelo menos uma medida antes de gerar o PDF."); return; }
        const botao = MedicaoUI.elemento("btnGerarPdf");
        botao.disabled = true;
        botao.textContent = "Gerando PDF...";
        try {
            await MedicaoPDF.gerar(this.estado);
            MedicaoUI.mensagem("PDF de medição gerado com sucesso.", "sucesso");
        } catch (erro) {
            console.error(erro);
            MedicaoUI.mensagem("Não foi possível gerar o PDF. Tente novamente.");
        } finally {
            botao.disabled = false;
            botao.textContent = "Gerar PDF";
        }
    },

    limparTudo() {
        if (!window.confirm("Limpar todos os dados e medidas desta ficha?")) return;
        MedicaoModel.limpar();
        this.estado = MedicaoModel.estadoVazio();
        if (this.projeto) this.aplicarProjeto(this.projeto);
        MedicaoModel.salvar(this.estado);
        this.editandoId = null;
        MedicaoUI.preencherGerais(this.estado);
        MedicaoUI.limparMedida();
        MedicaoUI.modoEdicao(false);
        MedicaoUI.renderizarMedidas([]);
        MedicaoUI.mensagem("Medição limpa. Os dados do projeto foram preservados.", "sucesso");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    void MedicaoController.iniciar().catch(erro => {
        console.error(erro);
        MedicaoUI.mensagem("Não foi possível iniciar a medição.");
    });
});
