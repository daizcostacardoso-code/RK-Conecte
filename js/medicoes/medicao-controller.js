const MedicaoController = {
    estado: MedicaoModel.carregar(), editandoId: null,
    iniciar() {
        MedicaoUI.preencherGerais(this.estado); MedicaoUI.renderizarMedidas(this.estado.medidas); this.registrarEventos();
    },
    registrarEventos() {
        MedicaoUI.elemento("formMedida").addEventListener("submit", e => { e.preventDefault(); this.salvarMedida(); });
        MedicaoUI.elemento("btnLimparMedida").addEventListener("click", () => this.cancelarEdicao());
        MedicaoUI.elemento("medidasCorpo").addEventListener("click", e => { const b = e.target.closest("button[data-acao]"); if (b) this.acaoMedida(b.dataset.acao, b.dataset.id); });
        MedicaoUI.ids.forEach(id => MedicaoUI.elemento(id).addEventListener("input", () => this.salvarGerais()));
        MedicaoUI.elemento("btnGerarPdf").addEventListener("click", () => this.gerarPdf());
        MedicaoUI.elemento("btnLimparTudo").addEventListener("click", () => this.limparTudo());
    },
    salvarGerais() { Object.assign(this.estado, MedicaoUI.lerGerais()); MedicaoModel.salvar(this.estado); },
    salvarMedida() {
        const resultado = MedicaoModel.criarMedida({ ...MedicaoUI.lerMedida(), id: this.editandoId });
        if (resultado.erros.length) { MedicaoUI.mensagem(resultado.erros.join(" ")); return; }
        const indice = this.estado.medidas.findIndex(m => m.id === this.editandoId);
        if (indice >= 0) this.estado.medidas[indice] = resultado.medida; else this.estado.medidas.push(resultado.medida);
        MedicaoModel.salvar(this.estado); MedicaoUI.renderizarMedidas(this.estado.medidas); this.cancelarEdicao(); MedicaoUI.mensagem(indice >= 0 ? "Medida atualizada com sucesso." : "Medida adicionada com sucesso.", "sucesso"); MedicaoUI.manterFormularioMedidaVisivel();
    },
    cancelarEdicao() { this.editandoId = null; MedicaoUI.limparMedida(); MedicaoUI.modoEdicao(false); },
    acaoMedida(acao, id) {
        const medida = this.estado.medidas.find(m => m.id === id); if (!medida) return;
        if (acao === "editar") { this.editandoId = id; MedicaoUI.preencherMedida(medida); MedicaoUI.modoEdicao(true); MedicaoUI.elemento("novaMedidaTitulo").scrollIntoView({ behavior: "smooth" }); return; }
        if (acao === "remover" && window.confirm("Remover esta medida?")) { this.estado.medidas = this.estado.medidas.filter(m => m.id !== id); MedicaoModel.salvar(this.estado); MedicaoUI.renderizarMedidas(this.estado.medidas); if (this.editandoId === id) this.cancelarEdicao(); MedicaoUI.mensagem("Medida removida.", "sucesso"); }
    },
    async gerarPdf() {
        this.salvarGerais();
        if (!this.estado.clienteNome.trim()) { MedicaoUI.mensagem("Informe o nome do cliente antes de gerar o PDF."); MedicaoUI.elemento("clienteNome").focus(); return; }
        if (!this.estado.medidas.length) { MedicaoUI.mensagem("Adicione pelo menos uma medida antes de gerar o PDF."); return; }
        const botao = MedicaoUI.elemento("btnGerarPdf"); botao.disabled = true; botao.textContent = "Gerando PDF...";
        try { await MedicaoPDF.gerar(this.estado); MedicaoUI.mensagem("PDF de medição gerado com sucesso.", "sucesso"); } catch (erro) { console.error(erro); MedicaoUI.mensagem("Não foi possível gerar o PDF. Tente novamente."); } finally { botao.disabled = false; botao.textContent = "Gerar PDF"; }
    },
    limparTudo() {
        if (!window.confirm("Limpar todos os dados e medidas desta ficha?")) return;
        MedicaoModel.limpar(); this.estado = MedicaoModel.estadoVazio(); this.editandoId = null; MedicaoUI.preencherGerais(this.estado); MedicaoUI.limparMedida(); MedicaoUI.modoEdicao(false); MedicaoUI.renderizarMedidas([]); MedicaoUI.mensagem("Medição limpa.", "sucesso");
    }
};
document.addEventListener("DOMContentLoaded", () => MedicaoController.iniciar());
