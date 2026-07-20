const FinanceiroOperacionalRepository = {
    colecaoFinanceiro: "financeiro_operacional",
    colecaoProjetos: "projetos",
    colecaoCaixa: "caixa_empresa",

    async listar() {
        if (!this.disponivel()) return this.erro("Dados financeiros temporariamente indisponíveis.");
        try {
            const snapshot = await db.collection(this.colecaoFinanceiro).get();
            const financeiros = snapshot.docs
                .map(doc => FinanceiroOperacionalModel.normalizar({ ...doc.data(), id: doc.id }))
                .sort((a, b) => String(b.atualizadoEmISO || b.criadoEmISO).localeCompare(String(a.atualizadoEmISO || a.criadoEmISO)));
            return { sucesso: true, erros: [], financeiros };
        } catch (erro) {
            return this.erro(erro.message || "Não foi possível carregar o financeiro.");
        }
    },

    async sincronizarProjetos(usuario = null) {
        if (!this.disponivel()) return this.erro("Dados financeiros temporariamente indisponíveis.");
        try {
            const snapshot = await db.collection(this.colecaoProjetos).get();
            const projetos = snapshot.docs
                .map(doc => ({ ...doc.data(), id: doc.id }))
                .filter(projeto => projeto.origem === "orcamento_aprovado" && Number(projeto.financeiro?.valorTotal || projeto.orcamento?.total || 0) >= 0);
            for (const projeto of projetos) await this.garantirProjeto(projeto.id, usuario);
            return this.listar();
        } catch (erro) {
            return this.erro(erro.message || "Não foi possível sincronizar os projetos financeiros.");
        }
    },

    async garantirProjeto(projetoId = "", usuario = null) {
        const id = FinanceiroOperacionalModel.texto(projetoId, 120);
        if (!id) return this.erro("Projeto obrigatório para o financeiro.");
        if (!this.disponivel()) return this.erro("Dados financeiros temporariamente indisponíveis.");
        try {
            return await db.runTransaction(async transacao => {
                const referenciaProjeto = db.collection(this.colecaoProjetos).doc(id);
                const referenciaFinanceiro = db.collection(this.colecaoFinanceiro).doc(FinanceiroOperacionalModel.idFinanceiro(id));
                const snapshotProjeto = await transacao.get(referenciaProjeto);
                const snapshotFinanceiro = await transacao.get(referenciaFinanceiro);
                if (!snapshotProjeto.exists) return this.erro("Projeto não encontrado.");
                const projeto = { ...snapshotProjeto.data(), id: snapshotProjeto.id };
                const existente = snapshotFinanceiro.exists ? { ...snapshotFinanceiro.data(), id: snapshotFinanceiro.id } : null;
                const resultado = FinanceiroOperacionalModel.criarOuAtualizar(projeto, existente, usuario);
                if (!resultado.sucesso) return resultado;
                const projetoAtualizado = FinanceiroOperacionalModel.atualizarResumoProjeto(projeto, resultado.financeiro, usuario);
                if (resultado.alterado) transacao.set(referenciaFinanceiro, resultado.financeiro, { merge: true });
                transacao.set(referenciaProjeto, projetoAtualizado, { merge: true });
                return { ...resultado, projeto: projetoAtualizado };
            });
        } catch (erro) {
            return this.erro(erro.message || "Não foi possível preparar o financeiro do projeto.");
        }
    },

    async registrarRecebimento(projetoId = "", dados = {}, usuario = null) {
        const idProjeto = FinanceiroOperacionalModel.texto(projetoId, 120);
        if (!idProjeto) return this.erro("Projeto obrigatório para registrar o recebimento.");
        if (!this.disponivel()) return this.erro("Dados financeiros temporariamente indisponíveis.");
        const recebimentoId = FinanceiroOperacionalModel.texto(dados.id || dados.recebimentoId, 120)
            || FinanceiroOperacionalModel.novoIdRecebimento(idProjeto);
        try {
            return await db.runTransaction(async transacao => {
                const referenciaProjeto = db.collection(this.colecaoProjetos).doc(idProjeto);
                const referenciaFinanceiro = db.collection(this.colecaoFinanceiro).doc(FinanceiroOperacionalModel.idFinanceiro(idProjeto));
                const referenciaCaixa = db.collection(this.colecaoCaixa).doc(`cx_${recebimentoId}`.slice(0, 120));
                const snapshotProjeto = await transacao.get(referenciaProjeto);
                const snapshotFinanceiro = await transacao.get(referenciaFinanceiro);
                const snapshotCaixa = await transacao.get(referenciaCaixa);
                if (!snapshotProjeto.exists) return this.erro("Projeto não encontrado.");
                const projeto = { ...snapshotProjeto.data(), id: snapshotProjeto.id };
                const inicial = FinanceiroOperacionalModel.criarOuAtualizar(
                    projeto,
                    snapshotFinanceiro.exists ? { ...snapshotFinanceiro.data(), id: snapshotFinanceiro.id } : null,
                    usuario
                );
                if (!inicial.sucesso) return inicial;
                const resultado = FinanceiroOperacionalModel.registrarRecebimento(
                    inicial.financeiro,
                    { ...dados, id: recebimentoId },
                    usuario
                );
                if (!resultado.sucesso) return resultado;
                const projetoAtualizado = FinanceiroOperacionalModel.atualizarResumoProjeto(projeto, resultado.financeiro, usuario);
                const movimento = FinanceiroOperacionalModel.movimentoCaixa(resultado.financeiro, resultado.recebimento);
                if (resultado.alterado || inicial.alterado) transacao.set(referenciaFinanceiro, resultado.financeiro, { merge: true });
                if (!snapshotCaixa.exists) transacao.set(referenciaCaixa, movimento, { merge: false });
                transacao.set(referenciaProjeto, projetoAtualizado, { merge: true });
                return {
                    ...resultado,
                    projeto: projetoAtualizado,
                    movimento,
                    idempotente: resultado.idempotente === true && snapshotCaixa.exists
                };
            });
        } catch (erro) {
            return this.erro(erro.message || "Não foi possível registrar o recebimento.");
        }
    },

    disponivel() { return typeof db !== "undefined" && db && typeof db.collection === "function" && typeof db.runTransaction === "function"; },
    erro(mensagem) { return { sucesso: false, erros: [mensagem], financeiros: [], financeiro: null, projeto: null, alterado: false }; }
};

if (typeof window !== "undefined") window.FinanceiroOperacionalRepository = FinanceiroOperacionalRepository;
if (typeof module !== "undefined" && module.exports) module.exports = { FinanceiroOperacionalRepository };
