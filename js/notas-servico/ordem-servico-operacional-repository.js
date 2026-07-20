const OrdemServicoOperacionalRepository = {
    colecaoOrdens: "notas_servico",
    colecaoProjetos: "projetos",
    colecaoMedicoes: "medicoes",

    async buscarPorProjeto(projetoId = "") {
        if (!this.firestoreDisponivel()) return this.erro("Dados temporariamente indisponíveis.");
        try {
            const id = OrdemServicoOperacionalModel.idOrdem(projetoId);
            const snapshot = await db.collection(this.colecaoOrdens).doc(id).get();
            return { sucesso: true, ordem: snapshot.exists ? OrdemServicoOperacionalModel.normalizar({ ...snapshot.data(), id: snapshot.id }) : null, erros: [] };
        } catch (erro) {
            return this.erro(erro.message || "Não foi possível consultar a ordem de serviço.");
        }
    },

    async salvar(nota = {}, opcoes = {}) {
        if (!this.firestoreDisponivel()) return this.erro("Dados temporariamente indisponíveis.");
        const projetoId = OrdemServicoOperacionalModel.texto(opcoes.projetoId || nota.projetoId, 120);
        if (!projetoId) return this.erro("Projeto obrigatório para salvar a ordem de serviço.");
        try {
            return await db.runTransaction(async transacao => {
                const referenciaProjeto = db.collection(this.colecaoProjetos).doc(projetoId);
                const snapshotProjeto = await transacao.get(referenciaProjeto);
                if (!snapshotProjeto.exists) return this.erro("Projeto operacional não encontrado.");
                const projeto = typeof ProjetoModel !== "undefined"
                    ? ProjetoModel.normalizar({ ...snapshotProjeto.data(), id: snapshotProjeto.id })
                    : { ...snapshotProjeto.data(), id: snapshotProjeto.id };
                if (projeto.status === "cancelado" || projeto.ativo === false) return this.erro("Projeto cancelado não aceita ordem de serviço.");

                const medicaoId = OrdemServicoOperacionalModel.texto(opcoes.medicaoId || nota.medicaoId || projeto.operacional?.medicaoId, 120);
                if (!medicaoId) return this.erro("Medição concluída obrigatória para gerar a ordem de serviço.");
                const referenciaMedicao = db.collection(this.colecaoMedicoes).doc(medicaoId);
                const snapshotMedicao = await transacao.get(referenciaMedicao);
                if (!snapshotMedicao.exists) return this.erro("Medição vinculada não encontrada.");
                const medicao = typeof MedicaoOperacionalModel !== "undefined"
                    ? MedicaoOperacionalModel.normalizar({ ...snapshotMedicao.data(), id: snapshotMedicao.id })
                    : { ...snapshotMedicao.data(), id: snapshotMedicao.id };
                if (medicao.projetoId !== projetoId || medicao.status !== "concluida") return this.erro("A medição precisa estar concluída e pertencer ao projeto.");

                const ordemId = OrdemServicoOperacionalModel.idOrdem(projetoId);
                const referenciaOrdem = db.collection(this.colecaoOrdens).doc(ordemId);
                const snapshotOrdem = await transacao.get(referenciaOrdem);
                const existente = snapshotOrdem.exists ? { ...snapshotOrdem.data(), id: snapshotOrdem.id } : null;
                const resultado = OrdemServicoOperacionalModel.criarOuAtualizar(nota, projeto, medicao, existente, opcoes.usuario, opcoes);
                if (!resultado.sucesso) return resultado;
                const projetoAtualizado = OrdemServicoOperacionalModel.atualizarProjeto(projeto, resultado.ordem, opcoes.usuario);

                if (resultado.alterado) transacao.set(referenciaOrdem, resultado.ordem, { merge: true });
                transacao.set(referenciaProjeto, projetoAtualizado, { merge: true });
                return { ...resultado, projeto: projetoAtualizado, medicao, criado: !existente };
            });
        } catch (erro) {
            return this.erro(erro.message || "Não foi possível salvar a ordem de serviço.");
        }
    },

    async cancelar(projetoId = "", opcoes = {}) {
        const consulta = await this.buscarPorProjeto(projetoId);
        if (!consulta.sucesso || !consulta.ordem) return consulta.sucesso ? this.erro("Ordem de serviço não encontrada.") : consulta;
        return this.salvar(consulta.ordem, { ...opcoes, projetoId, medicaoId: consulta.ordem.medicaoId, status: "cancelado" });
    },

    firestoreDisponivel() { return typeof db !== "undefined" && db && typeof db.collection === "function" && typeof db.runTransaction === "function"; },
    erro(mensagem) { return { sucesso: false, erros: [mensagem], ordem: null, projeto: null, alterado: false }; }
};

if (typeof window !== "undefined") window.OrdemServicoOperacionalRepository = OrdemServicoOperacionalRepository;
if (typeof module !== "undefined" && module.exports) module.exports = { OrdemServicoOperacionalRepository };
