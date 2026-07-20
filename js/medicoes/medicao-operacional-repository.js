const MedicaoOperacionalRepository = {
    colecaoMedicoes: "medicoes",
    colecaoProjetos: "projetos",

    async buscarPorProjeto(projetoId = "") {
        if (!this.firestoreDisponivel()) return this.erro("Dados temporariamente indisponíveis.");
        try {
            const id = MedicaoOperacionalModel.idMedicao(projetoId);
            const snapshot = await db.collection(this.colecaoMedicoes).doc(id).get();
            return {
                sucesso: true,
                medicao: snapshot.exists ? MedicaoOperacionalModel.normalizar({ ...snapshot.data(), id: snapshot.id }) : null,
                erros: []
            };
        } catch (erro) {
            return this.erro(erro.message || "Não foi possível consultar a medição.");
        }
    },

    async salvar(projetoId = "", estado = {}, opcoes = {}) {
        if (!this.firestoreDisponivel()) return this.erro("Dados temporariamente indisponíveis.");
        const idProjeto = MedicaoOperacionalModel.texto(projetoId || estado.projetoId, 120);
        if (!idProjeto) return this.erro("Projeto obrigatório para salvar a medição.");
        try {
            return await db.runTransaction(async transacao => {
                const referenciaProjeto = db.collection(this.colecaoProjetos).doc(idProjeto);
                const snapshotProjeto = await transacao.get(referenciaProjeto);
                if (!snapshotProjeto.exists) return this.erro("Projeto operacional não encontrado.");
                const projeto = typeof ProjetoModel !== "undefined"
                    ? ProjetoModel.normalizar({ ...snapshotProjeto.data(), id: snapshotProjeto.id })
                    : { ...snapshotProjeto.data(), id: snapshotProjeto.id };
                if (projeto.status === "cancelado" || projeto.ativo === false) return this.erro("Projeto cancelado não aceita novas medições.");

                const medicaoId = MedicaoOperacionalModel.idMedicao(idProjeto);
                const referenciaMedicao = db.collection(this.colecaoMedicoes).doc(medicaoId);
                const snapshotMedicao = await transacao.get(referenciaMedicao);
                const existente = snapshotMedicao.exists ? { ...snapshotMedicao.data(), id: snapshotMedicao.id } : null;
                const resultado = MedicaoOperacionalModel.criarOuAtualizar(estado, projeto, existente, opcoes.usuario, opcoes);
                if (!resultado.sucesso) return resultado;
                const projetoAtualizado = MedicaoOperacionalModel.atualizarProjeto(projeto, resultado.medicao, opcoes.usuario);

                if (resultado.alterado) transacao.set(referenciaMedicao, resultado.medicao, { merge: true });
                transacao.set(referenciaProjeto, projetoAtualizado, { merge: true });
                return { ...resultado, projeto: projetoAtualizado, criado: !existente };
            });
        } catch (erro) {
            return this.erro(erro.message || "Não foi possível salvar a medição.");
        }
    },

    firestoreDisponivel() { return typeof db !== "undefined" && db && typeof db.collection === "function" && typeof db.runTransaction === "function"; },
    erro(mensagem) { return { sucesso: false, erros: [mensagem], medicao: null, projeto: null, alterado: false }; }
};

if (typeof window !== "undefined") window.MedicaoOperacionalRepository = MedicaoOperacionalRepository;
if (typeof module !== "undefined" && module.exports) module.exports = { MedicaoOperacionalRepository };
