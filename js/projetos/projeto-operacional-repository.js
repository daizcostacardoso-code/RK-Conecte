const ProjetoOperacionalRepository = {
    colecaoOrcamentos: "orcamentos_emitidos",
    colecaoProjetos: "projetos",

    firestoreDisponivel() {
        return typeof db !== "undefined" && !!db && typeof db.runTransaction === "function";
    },

    async abrirDeOrcamento(orcamentoId = "", opcoes = {}) {
        const id = String(orcamentoId || "").trim();
        if (!id) return this.erro("Informe o orçamento aprovado.");
        if (!this.firestoreDisponivel()) return this.erro("Firestore indisponível.");

        try {
            return await db.runTransaction(async transacao => {
                const referenciaOrcamento = db.collection(this.colecaoOrcamentos).doc(id);
                const snapshotOrcamento = await transacao.get(referenciaOrcamento);
                if (!snapshotOrcamento.exists) return this.erro("Orçamento não encontrado.");

                const orcamento = OrcamentoAprovacaoModel.normalizarRegistro({
                    ...snapshotOrcamento.data(),
                    id: snapshotOrcamento.id
                });
                if (orcamento.status !== "aprovado") {
                    return this.erro("Somente orçamentos aprovados podem abrir a operação.", orcamento);
                }

                const projetoId = ProjetoOperacionalModel.idProjeto(orcamento);
                const referenciaProjeto = db.collection(this.colecaoProjetos).doc(projetoId);
                const snapshotProjeto = await transacao.get(referenciaProjeto);
                const existente = snapshotProjeto.exists ? { ...snapshotProjeto.data(), id: snapshotProjeto.id } : null;
                const resultadoProjeto = ProjetoOperacionalModel.criarOuAtualizar(orcamento, existente, opcoes.usuario);
                const resultadoOrcamento = ProjetoOperacionalModel.vincularOrcamento(orcamento, resultadoProjeto.projeto, opcoes.usuario);

                if (resultadoProjeto.alterado) {
                    transacao.set(referenciaProjeto, resultadoProjeto.projeto, { merge: true });
                }
                if (resultadoOrcamento.alterado) {
                    transacao.set(referenciaOrcamento, resultadoOrcamento.orcamento, { merge: true });
                }

                return {
                    sucesso: true,
                    erros: [],
                    projeto: resultadoProjeto.projeto,
                    orcamento: resultadoOrcamento.orcamento,
                    criado: resultadoProjeto.criado,
                    idempotente: !resultadoProjeto.alterado && !resultadoOrcamento.alterado
                };
            });
        } catch (erro) {
            return this.erro(erro.message || "Não foi possível abrir a operação.");
        }
    },

    async cancelarDeOrcamento(orcamentoId = "", opcoes = {}) {
        const id = String(orcamentoId || "").trim();
        if (!id) return this.erro("Informe o orçamento cancelado.");
        if (!this.firestoreDisponivel()) return this.erro("Firestore indisponível.");

        try {
            return await db.runTransaction(async transacao => {
                const referenciaOrcamento = db.collection(this.colecaoOrcamentos).doc(id);
                const snapshotOrcamento = await transacao.get(referenciaOrcamento);
                if (!snapshotOrcamento.exists) return this.erro("Orçamento não encontrado.");
                const orcamento = OrcamentoAprovacaoModel.normalizarRegistro({ ...snapshotOrcamento.data(), id: snapshotOrcamento.id });
                if (orcamento.status !== "cancelado") return this.erro("O orçamento precisa estar cancelado para encerrar a operação.", orcamento);

                const projetoId = String(orcamento.operacao?.projetoId || orcamento.vinculos?.projetoId || "").trim();
                if (!projetoId) return { sucesso: true, erros: [], projeto: null, orcamento, idempotente: true };
                const referenciaProjeto = db.collection(this.colecaoProjetos).doc(projetoId);
                const snapshotProjeto = await transacao.get(referenciaProjeto);
                if (!snapshotProjeto.exists) return { sucesso: true, erros: [], projeto: null, orcamento, idempotente: true };

                const resultado = ProjetoOperacionalModel.cancelarProjeto(
                    orcamento,
                    { ...snapshotProjeto.data(), id: snapshotProjeto.id },
                    opcoes.usuario,
                    opcoes.observacao
                );
                if (resultado.alterado) transacao.set(referenciaProjeto, resultado.projeto, { merge: true });
                return {
                    sucesso: true,
                    erros: [],
                    projeto: resultado.projeto,
                    orcamento,
                    idempotente: !resultado.alterado
                };
            });
        } catch (erro) {
            return this.erro(erro.message || "Não foi possível cancelar a operação.");
        }
    },

    erro(mensagem, orcamento = null) {
        return { sucesso: false, erros: [mensagem], projeto: null, orcamento };
    }
};

if (typeof window !== "undefined") window.ProjetoOperacionalRepository = ProjetoOperacionalRepository;
if (typeof module !== "undefined" && module.exports) module.exports = { ProjetoOperacionalRepository };
