const ProjetoOperacionalRepository = {
    colecaoOrcamentos: "orcamentos_emitidos",
    colecaoProjetos: "projetos",
    colecaoOrdens: "notas_servico",

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
                const projetoAtual = { ...snapshotProjeto.data(), id: snapshotProjeto.id };
                const ordemId = String(projetoAtual.operacional?.notaServicoId || "").trim();
                const referenciaOrdem = ordemId ? db.collection(this.colecaoOrdens).doc(ordemId) : null;
                const snapshotOrdem = referenciaOrdem ? await transacao.get(referenciaOrdem) : null;

                const resultado = ProjetoOperacionalModel.cancelarProjeto(
                    orcamento,
                    projetoAtual,
                    opcoes.usuario,
                    opcoes.observacao
                );
                let ordem = snapshotOrdem?.exists ? { ...snapshotOrdem.data(), id: snapshotOrdem.id } : null;
                let ordemAlterada = false;
                if (ordem && !["cancelado", "concluido"].includes(String(ordem.status || "").toLowerCase())) {
                    const agora = new Date().toISOString();
                    const historicoOperacional = Array.isArray(ordem.historicoOperacional) ? [...ordem.historicoOperacional] : [];
                    if (!historicoOperacional.some(item => item.tipo === "ordem_servico_cancelada")) {
                        historicoOperacional.push({
                            tipo: "ordem_servico_cancelada",
                            status: "cancelado",
                            descricao: "Ordem de serviço cancelada após o cancelamento do orçamento.",
                            data: agora,
                            usuario: opcoes.usuario?.nome || opcoes.usuario?.email || "Sistema"
                        });
                    }
                    ordem = { ...ordem, status: "cancelado", ativo: false, historicoOperacional, atualizadoEmISO: agora, atualizadoEm: agora };
                    ordemAlterada = true;
                }
                if (resultado.alterado) transacao.set(referenciaProjeto, resultado.projeto, { merge: true });
                if (ordemAlterada) transacao.set(referenciaOrdem, ordem, { merge: true });
                return {
                    sucesso: true,
                    erros: [],
                    projeto: resultado.projeto,
                    ordem,
                    orcamento,
                    idempotente: !resultado.alterado && !ordemAlterada
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
