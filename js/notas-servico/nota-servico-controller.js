const NotaServicoController = {
    estado: null,
    historico: [],
    editandoId: null,
    timerRascunho: null,
    projeto: null,
    medicao: null,
    ordemRemota: null,
    contextoOperacionalInvalido: false,

    async iniciar() {
        const parametros = new URLSearchParams(window.location.search || "");
        NotaServicoModel.configurarContexto({
            projetoId: parametros.get("projetoId") || "",
            medicaoId: parametros.get("medicaoId") || ""
        });
        this.estado = NotaServicoModel.carregarRascunho();
        await this.carregarContextoOperacional();
        NotaServicoUI.preencher(this.estado);
        this.renderizarContextoOperacional();
        this.atualizarAcoesOperacionais();
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
        NotaServicoUI.el("btnIniciarInstalacao")?.addEventListener("click", () => this.avancarOperacao("em_instalacao"));
        NotaServicoUI.el("btnConcluirOrdem")?.addEventListener("click", () => this.avancarOperacao("concluido"));
        NotaServicoUI.el("btnNovaNota").addEventListener("click", () => this.novaNota());
        NotaServicoUI.el("historicoLista").addEventListener("click", evento => {
            const botao = evento.target.closest("button[data-historico]");
            if (botao) this.acaoHistorico(botao.dataset.historico, botao.dataset.id);
        });
    },

    async carregarContextoOperacional() {
        const projetoId = NotaServicoModel.contexto.projetoId;
        if (!projetoId) return false;
        if (typeof db === "undefined" || !db || typeof db.collection !== "function") {
            NotaServicoUI.mensagem("Firestore indisponível para carregar o projeto.");
            return false;
        }
        try {
            const snapshotProjeto = await db.collection("projetos").doc(projetoId).get();
            if (!snapshotProjeto.exists) throw new Error("Projeto operacional não encontrado.");
            this.projeto = { id: snapshotProjeto.id, ...snapshotProjeto.data() };
            const medicaoId = NotaServicoModel.contexto.medicaoId || this.projeto.operacional?.medicaoId || "";
            if (!medicaoId) throw new Error("O projeto ainda não possui medição concluída.");
            const snapshotMedicao = await db.collection("medicoes").doc(medicaoId).get();
            if (!snapshotMedicao.exists) throw new Error("Medição vinculada não encontrada.");
            this.medicao = typeof MedicaoOperacionalModel !== "undefined"
                ? MedicaoOperacionalModel.normalizar({ ...snapshotMedicao.data(), id: snapshotMedicao.id })
                : { ...snapshotMedicao.data(), id: snapshotMedicao.id };
            if (this.medicao.status !== "concluida") throw new Error("Conclua a medição antes de preparar a ordem de serviço.");

            const consulta = typeof OrdemServicoOperacionalRepository !== "undefined"
                ? await OrdemServicoOperacionalRepository.buscarPorProjeto(projetoId)
                : { sucesso: true, ordem: null };
            this.ordemRemota = consulta.sucesso ? consulta.ordem : null;
            const contexto = OrdemServicoOperacionalModel.estadoDoContexto(this.projeto, this.medicao, this.ordemRemota);
            const rascunhoLocal = this.estado;
            this.estado = this.ordemRemota
                ? NotaServicoModel.normalizar(contexto)
                : NotaServicoModel.normalizar({
                    ...contexto,
                    ...rascunhoLocal,
                    id: contexto.id,
                    numeroNota: contexto.numeroNota,
                    projetoId,
                    medicaoId: this.medicao.id,
                    orcamentoId: contexto.orcamentoId,
                    clienteNome: rascunhoLocal.clienteNome || contexto.clienteNome,
                    clienteDocumento: rascunhoLocal.clienteDocumento || contexto.clienteDocumento,
                    clienteTelefone: rascunhoLocal.clienteTelefone || contexto.clienteTelefone,
                    clienteEndereco: rascunhoLocal.clienteEndereco || contexto.clienteEndereco,
                    clienteEmail: rascunhoLocal.clienteEmail || contexto.clienteEmail,
                    localServico: rascunhoLocal.localServico || contexto.localServico,
                    servicos: rascunhoLocal.servicos?.length ? rascunhoLocal.servicos : contexto.servicos
                });
            NotaServicoModel.salvarRascunho(this.estado);
            return true;
        } catch (erro) {
            this.contextoOperacionalInvalido = true;
            console.error("Não foi possível carregar o contexto operacional:", erro);
            NotaServicoUI.mensagem(erro.message || "Não foi possível carregar o contexto operacional.");
            return false;
        }
    },

    renderizarContextoOperacional() {
        const elemento = NotaServicoUI.el("notaContexto");
        if (!elemento) return;
        if (!this.projeto) {
            elemento.hidden = true;
            elemento.textContent = "";
            return;
        }
        elemento.hidden = false;
        elemento.textContent = `Projeto ${this.projeto.numero || this.projeto.id} · medição ${this.medicao?.id || "não informada"} · ${NotaServicoModel.rotuloStatus(this.estado.status)}.`;
    },

    async carregarHistorico(migrarLocais = false) {
        try {
            let remotas = await NotaServicoRepository.listar();
            if (migrarLocais) {
                const idsRemotos = new Set(remotas.map(nota => nota.id));
                const pendentes = NotaServicoModel.historico().filter(nota => !nota.projetoId && !idsRemotos.has(nota.id));
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
        if (NotaServicoModel.contexto.projetoId && (!this.projeto || !this.medicao)) {
            NotaServicoUI.mensagem("Conclua a medição do projeto antes de salvar a ordem de serviço.");
            return false;
        }

        const botao = NotaServicoUI.el("btnSalvarRascunho");
        botao.disabled = true;
        botao.textContent = "Salvando...";
        try {
            this.estado = NotaServicoModel.normalizar(await this.salvarRemoto(this.estado, { status: this.estado.status }));
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

    async salvarRemoto(nota = {}, opcoes = {}) {
        if (NotaServicoModel.contexto.projetoId && (!this.projeto || !this.medicao)) throw new Error("Contexto operacional incompleto.");
        if (!this.projeto) return NotaServicoRepository.salvar(nota);
        if (typeof OrdemServicoOperacionalRepository === "undefined") throw new Error("Repositório operacional indisponível.");
        const resultado = await OrdemServicoOperacionalRepository.salvar(nota, {
            ...opcoes,
            projetoId: this.projeto.id,
            medicaoId: this.medicao?.id || nota.medicaoId,
            usuario: this.usuarioAtual()
        });
        if (!resultado.sucesso) throw new Error((resultado.erros || ["Não foi possível salvar a ordem de serviço."]).join(" "));
        this.projeto = resultado.projeto || this.projeto;
        this.ordemRemota = resultado.ordem;
        return resultado.ordem;
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
        if (NotaServicoModel.contexto.projetoId && (!this.projeto || !this.medicao)) {
            NotaServicoUI.mensagem("Conclua a medição do projeto antes de emitir a ordem de serviço.");
            return;
        }
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
            if (this.projeto && this.estado.status === "rascunho") this.estado.status = "em_producao";
            await NotaServicoPDF.gerar(this.estado);
            const agora = new Date().toISOString();
            this.estado.emitidaEm = this.estado.emitidaEm || agora;
            this.estado.atualizadoEm = agora;
            NotaServicoModel.registrarEmissao(this.estado);
            if (eraNova && !this.projeto) NotaServicoModel.avancarSequencia();
            NotaServicoModel.salvarRascunho(this.estado);

            try {
                this.estado = NotaServicoModel.normalizar(await this.salvarRemoto(this.estado, { status: this.estado.status }));
                await this.carregarHistorico(false);
                this.renderizarContextoOperacional();
                this.atualizarAcoesOperacionais();
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
            this.atualizarAcoesOperacionais();
        }
    },

    async avancarOperacao(status) {
        if (!this.projeto || !this.ordemRemota) {
            NotaServicoUI.mensagem("Emita a ordem de serviço antes de avançar a operação.");
            return null;
        }
        const rotulo = NotaServicoModel.rotuloStatus(status);
        if (!window.confirm(`Alterar a operação para ${rotulo}?`)) return null;
        try {
            this.estado.status = status;
            this.estado = NotaServicoModel.normalizar(await this.salvarRemoto(this.estado, { status }));
            NotaServicoModel.salvarRascunho(this.estado);
            NotaServicoUI.preencher(this.estado);
            this.renderizarContextoOperacional();
            this.atualizarAcoesOperacionais();
            await this.carregarHistorico(false);
            NotaServicoUI.mensagem(`Operação atualizada para ${rotulo}.`, "sucesso");
            return this.estado;
        } catch (erro) {
            console.error(erro);
            NotaServicoUI.mensagem(erro.message || "Não foi possível avançar a operação.");
            return null;
        }
    },

    atualizarAcoesOperacionais() {
        const instalacao = NotaServicoUI.el("btnIniciarInstalacao");
        const concluir = NotaServicoUI.el("btnConcluirOrdem");
        const operacional = !!NotaServicoModel.contexto.projetoId;
        const pronto = !!this.projeto && !!this.medicao && !this.contextoOperacionalInvalido;
        if (instalacao) instalacao.hidden = !pronto || this.estado.status !== "em_producao";
        if (concluir) concluir.hidden = !pronto || this.estado.status !== "em_instalacao";
        const emitir = NotaServicoUI.el("btnGerarPdf");
        if (emitir && operacional) emitir.textContent = this.estado.status === "rascunho" ? "Emitir OS e iniciar produção" : "Gerar PDF da ordem";
        if (emitir) emitir.disabled = operacional && !pronto;
        const salvar = NotaServicoUI.el("btnSalvarRascunho");
        if (salvar) salvar.disabled = operacional && !pronto;
        const status = NotaServicoUI.el("status");
        if (status) status.disabled = operacional;
    },

    usuarioAtual() {
        const sessao = typeof RKAuth !== "undefined" && typeof RKAuth.obterSessao === "function" ? RKAuth.obterSessao() : null;
        return sessao ? { uid: sessao.uid || "", nome: sessao.nomeUsuario || sessao.nome || sessao.email || "", email: sessao.email || "" } : null;
    },

    novaNota() {
        if (NotaServicoModel.contexto.projetoId) {
            NotaServicoUI.mensagem("A ordem vinculada ao projeto é única e não pode ser substituída por uma nota avulsa.");
            return;
        }
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
            if (item.projetoId) {
                window.location.href = `nota-servico.html?projetoId=${encodeURIComponent(item.projetoId)}&medicaoId=${encodeURIComponent(item.medicaoId || "")}`;
                return;
            }
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
        if (acao === "excluir" && window.confirm("Cancelar esta nota? O registro permanecerá no histórico.")) {
            try {
                if (item.projetoId && typeof OrdemServicoOperacionalRepository !== "undefined") {
                    const resultado = await OrdemServicoOperacionalRepository.cancelar(item.projetoId, { usuario: this.usuarioAtual() });
                    if (!resultado.sucesso) throw new Error((resultado.erros || []).join(" "));
                } else {
                    await NotaServicoRepository.excluir(id);
                }
                await this.carregarHistorico(false);
                NotaServicoUI.mensagem("Nota cancelada com histórico preservado.", "sucesso");
            } catch (erro) {
                console.error("Nao foi possivel cancelar a nota no Firestore:", erro);
                NotaServicoUI.mensagem("Não foi possível cancelar a nota no Firestore.");
            }
        }
    }
};

document.addEventListener("DOMContentLoaded", () => NotaServicoController.iniciar());
