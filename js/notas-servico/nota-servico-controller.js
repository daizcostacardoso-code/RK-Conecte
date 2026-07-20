const NotaServicoController = {
    estado: null,
    historico: [],
    editandoId: null,
    timerRascunho: null,

    async iniciar() {
        this.estado = NotaServicoModel.carregarRascunho();
        NotaServicoUI.preencher(this.estado);
        NotaServicoUI.renderizarHistorico([]);
        this.registrarEventos();
        await this.carregarHistorico(true);
    },

    registrarEventos() {
        NotaServicoUI.el("formServico").addEventListener("submit", evento => { evento.preventDefault(); this.salvarServico(); });
        NotaServicoUI.el("btnCancelarServico").addEventListener("click", () => this.cancelarEdicao());
        NotaServicoUI.el("servicosCorpo").addEventListener("click", evento => {
            const botao = evento.target.closest("button[data-acao]");
            if (botao) this.acaoServico(botao.dataset.acao, botao.dataset.id);
        });
        NotaServicoUI.idsGerais.forEach(id => {
            const evento = ["status", "formaPagamento"].includes(id) ? "change" : "input";
            NotaServicoUI.el(id).addEventListener(evento, () => this.agendarRascunho());
        });
        NotaServicoUI.el("desconto").addEventListener("blur", () => { this.sincronizarGerais(); NotaServicoUI.preencher(this.estado); });
        NotaServicoUI.el("btnSalvarRascunho").addEventListener("click", () => this.salvarRascunho(true));
        NotaServicoUI.el("btnGerarPdf").addEventListener("click", () => this.emitir());
        NotaServicoUI.el("btnNovaNota").addEventListener("click", () => this.novaNota());
        NotaServicoUI.el("historicoLista").addEventListener("click", evento => {
            const botao = evento.target.closest("button[data-historico]");
            if (botao) this.acaoHistorico(botao.dataset.historico, botao.dataset.id);
        });
    },

    async carregarHistorico(migrarLocais = false) {
        try {
            let remotas = await NotaServicoRepository.listar();
            if (migrarLocais) {
                const idsRemotos = new Set(remotas.map(nota => nota.id));
                const pendentes = NotaServicoModel.historico().filter(nota => !idsRemotos.has(nota.id));
                for (const nota of pendentes) await NotaServicoRepository.salvar(nota);
                if (pendentes.length) remotas = await NotaServicoRepository.listar();
            }
            this.historico = remotas;
            NotaServicoUI.renderizarHistorico(this.historico);
            return true;
        } catch (erro) {
            console.error("Nao foi possivel carregar as notas do Firestore:", erro);
            this.historico = NotaServicoModel.historico();
            NotaServicoUI.renderizarHistorico(this.historico);
            NotaServicoUI.mensagem("Firestore indisponível. O histórico local foi mantido.");
            return false;
        }
    },

    sincronizarGerais() {
        Object.assign(this.estado, NotaServicoUI.lerGerais());
    },

    agendarRascunho() {
        NotaServicoUI.marcarRascunho("Alterações pendentes");
        window.clearTimeout(this.timerRascunho);
        this.timerRascunho = window.setTimeout(() => this.salvarRascunho(false), 500);
    },

    async salvarRascunho(mostrarMensagem) {
        this.sincronizarGerais();
        NotaServicoModel.salvarRascunho(this.estado);
        NotaServicoUI.renderizarServicos(this.estado);
        NotaServicoUI.marcarRascunho();
        if (!mostrarMensagem) return true;

        const botao = NotaServicoUI.el("btnSalvarRascunho");
        botao.disabled = true;
        botao.textContent = "Salvando...";
        try {
            this.estado = NotaServicoModel.normalizar(await NotaServicoRepository.salvar(this.estado));
            NotaServicoModel.salvarRascunho(this.estado);
            await this.carregarHistorico(false);
            NotaServicoUI.marcarRascunho("Salvo no Firestore");
            NotaServicoUI.mensagem("Rascunho salvo no Firestore.", "sucesso");
            return true;
        } catch (erro) {
            console.error("Nao foi possivel salvar o rascunho no Firestore:", erro);
            NotaServicoUI.marcarRascunho("Salvo somente neste dispositivo");
            NotaServicoUI.mensagem("O rascunho ficou salvo neste dispositivo, mas não foi enviado ao Firestore.");
            return false;
        } finally {
            botao.disabled = false;
            botao.textContent = "Salvar rascunho";
        }
    },

    salvarServico() {
        const resultado = NotaServicoModel.criarServico({ ...NotaServicoUI.lerServico(), id: this.editandoId });
        if (resultado.erros.length) { NotaServicoUI.mensagem(resultado.erros.join(" ")); return; }
        const indice = this.estado.servicos.findIndex(item => item.id === this.editandoId);
        if (indice >= 0) this.estado.servicos[indice] = resultado.servico;
        else this.estado.servicos.push(resultado.servico);
        this.salvarRascunho(false);
        NotaServicoUI.renderizarServicos(this.estado);
        this.cancelarEdicao();
        NotaServicoUI.mensagem(indice >= 0 ? "Serviço atualizado." : "Serviço adicionado.", "sucesso");
    },

    cancelarEdicao() {
        this.editandoId = null;
        NotaServicoUI.limparServico();
        NotaServicoUI.modoEdicao(false);
    },

    acaoServico(acao, id) {
        const item = this.estado.servicos.find(servico => servico.id === id);
        if (!item) return;
        if (acao === "editar") {
            this.editandoId = id;
            NotaServicoUI.preencherServico(item);
            NotaServicoUI.modoEdicao(true);
            NotaServicoUI.el("novoServicoTitulo").scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }
        if (acao === "excluir" && window.confirm("Excluir este serviço da nota?")) {
            this.estado.servicos = this.estado.servicos.filter(servico => servico.id !== id);
            if (this.editandoId === id) this.cancelarEdicao();
            this.salvarRascunho(false);
            NotaServicoUI.renderizarServicos(this.estado);
            NotaServicoUI.mensagem("Serviço excluído.", "sucesso");
        }
    },

    async emitir() {
        this.sincronizarGerais();
        const erros = NotaServicoModel.validar(this.estado);
        if (erros.length) {
            NotaServicoUI.mensagem(erros.join(" "));
            const foco = !this.estado.clienteNome.trim() ? "clienteNome" : (!this.estado.servicos.length ? "servicoDescricao" : "numeroNota");
            NotaServicoUI.el(foco).focus();
            return;
        }

        const botao = NotaServicoUI.el("btnGerarPdf");
        botao.disabled = true;
        botao.textContent = "Gerando PDF...";
        try {
            const eraNova = !this.estado.emitidaEm;
            await NotaServicoPDF.gerar(this.estado);
            const agora = new Date().toISOString();
            this.estado.emitidaEm = this.estado.emitidaEm || agora;
            this.estado.atualizadoEm = agora;
            NotaServicoModel.registrarEmissao(this.estado);
            if (eraNova) NotaServicoModel.avancarSequencia();
            NotaServicoModel.salvarRascunho(this.estado);

            try {
                this.estado = NotaServicoModel.normalizar(await NotaServicoRepository.salvar(this.estado));
                await this.carregarHistorico(false);
                NotaServicoUI.marcarRascunho("Nota salva no Firestore");
                NotaServicoUI.mensagem("Nota emitida, salva no Firestore e PDF gerado com sucesso.", "sucesso");
            } catch (erroFirestore) {
                console.error("PDF gerado, mas a nota nao foi salva no Firestore:", erroFirestore);
                NotaServicoUI.marcarRascunho("Salvo somente neste dispositivo");
                NotaServicoUI.renderizarHistorico(NotaServicoModel.historico());
                NotaServicoUI.mensagem("O PDF foi gerado, mas a nota não foi salva no Firestore.");
            }
        } catch (erro) {
            console.error(erro);
            NotaServicoUI.mensagem("Não foi possível gerar o PDF. Tente novamente.");
        } finally {
            botao.disabled = false;
            botao.textContent = "Emitir e gerar PDF";
        }
    },

    novaNota() {
        if (!window.confirm("Iniciar uma nova nota? O rascunho atual será substituído.")) return;
        NotaServicoModel.prepararNumeroNovaNota(this.estado?.numeroNota);
        NotaServicoModel.limparRascunho();
        this.estado = NotaServicoModel.estadoVazio();
        this.editandoId = null;
        NotaServicoUI.preencher(this.estado);
        this.cancelarEdicao();
        NotaServicoModel.salvarRascunho(this.estado);
        NotaServicoUI.marcarRascunho();
        window.scrollTo({ top: 0, behavior: "smooth" });
    },

    async acaoHistorico(acao, id) {
        const item = this.historico.find(nota => nota.id === id);
        if (!item) return;
        if (acao === "abrir") {
            this.estado = NotaServicoModel.normalizar(JSON.parse(JSON.stringify(item)));
            NotaServicoModel.salvarRascunho(this.estado);
            NotaServicoUI.preencher(this.estado);
            this.cancelarEdicao();
            NotaServicoUI.marcarRascunho("Nota carregada do Firestore");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        if (acao === "pdf") {
            try { await NotaServicoPDF.gerar(item); NotaServicoUI.mensagem("PDF gerado novamente.", "sucesso"); }
            catch (erro) { console.error(erro); NotaServicoUI.mensagem("Não foi possível gerar o PDF."); }
            return;
        }
        if (acao === "excluir" && window.confirm("Excluir esta nota do Firestore?")) {
            try {
                await NotaServicoRepository.excluir(id);
                NotaServicoModel.excluirHistorico(id);
                this.historico = this.historico.filter(nota => nota.id !== id);
                NotaServicoUI.renderizarHistorico(this.historico);
                NotaServicoUI.mensagem("Nota removida do Firestore.", "sucesso");
            } catch (erro) {
                console.error("Nao foi possivel excluir a nota do Firestore:", erro);
                NotaServicoUI.mensagem("Não foi possível excluir a nota do Firestore.");
            }
        }
    }
};

document.addEventListener("DOMContentLoaded", () => NotaServicoController.iniciar());
