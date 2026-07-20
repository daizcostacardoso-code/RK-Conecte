const OrcamentoAprovacaoRepository = {
    colecao: "orcamentos_emitidos",

    firestoreDisponivel() {
        return typeof db !== "undefined" && !!db && typeof db.runTransaction === "function";
    },

    async buscarPorIdOuNumero(identificador = "") {
        const modelo = this.modelo();
        const valor = modelo.texto(identificador);
        if (!valor) return { sucesso: false, erros: ["Informe o identificador do orçamento."], registro: null };
        if (!this.firestoreDisponivel()) return { sucesso: false, erros: ["Firestore indisponível."], registro: null };

        try {
            const referencia = db.collection(this.colecao).doc(valor);
            const direto = await referencia.get();
            if (direto.exists) return { sucesso: true, registro: modelo.normalizarRegistro({ ...direto.data(), id: direto.id }) };

            const consulta = await db.collection(this.colecao).where("numero", "==", valor).limit(1).get();
            const documento = consulta.docs?.[0];
            if (!documento) return { sucesso: false, erros: ["Orçamento não encontrado."], registro: null };
            return { sucesso: true, registro: modelo.normalizarRegistro({ ...documento.data(), id: documento.id }) };
        } catch (erro) {
            return { sucesso: false, erros: [erro.message || "Não foi possível consultar o orçamento."], registro: null };
        }
    },

    async executarTransacao(id = "", executor) {
        if (!this.firestoreDisponivel()) return { sucesso: false, erros: ["Firestore indisponível."], registro: null };
        const modelo = this.modelo();

        try {
            return await db.runTransaction(async transacao => {
                const referencia = db.collection(this.colecao).doc(String(id));
                const snapshot = await transacao.get(referencia);
                if (!snapshot.exists) return { sucesso: false, erros: ["Orçamento não encontrado."], registro: null };

                const atual = modelo.normalizarRegistro({ ...snapshot.data(), id: snapshot.id });
                const resultado = await executor(atual);
                if (resultado?.sucesso && resultado.escrever !== false) {
                    transacao.set(referencia, resultado.registro, { merge: true });
                }
                return resultado;
            });
        } catch (erro) {
            return { sucesso: false, erros: [erro.message || "Não foi possível atualizar o orçamento."], registro: null };
        }
    },

    async registrarEmissao(registro = {}, opcoes = {}) {
        if (!this.firestoreDisponivel()) return { sucesso: false, erros: ["Firestore indisponível."], registro: null };
        const modelo = this.modelo();
        const inicial = modelo.normalizarRegistro({ ...registro, status: registro.status || "emitido" });
        const id = modelo.texto(inicial.id || inicial.numero);
        if (!id) return { sucesso: false, erros: ["Orçamento sem identificador para salvar."], registro: null };

        try {
            return await db.runTransaction(async transacao => {
                const referencia = db.collection(this.colecao).doc(id);
                const snapshot = await transacao.get(referencia);
                const usuario = modelo.normalizarUsuario(opcoes.usuario);
                const origem = modelo.texto(opcoes.origem) || "sistema";
                let atualizado;

                if (!snapshot.exists) {
                    atualizado = { ...inicial, id, status: "emitido" };
                } else {
                    const atual = modelo.normalizarRegistro({ ...snapshot.data(), id: snapshot.id });
                    const novaVersao = ["enviado", "recusado"].includes(atual.status);
                    atualizado = {
                        ...atual,
                        ...inicial,
                        id: snapshot.id,
                        status: novaVersao ? "emitido" : atual.status,
                        aprovacao: novaVersao ? modelo.limparDecisaoParaNovaVersao(atual.aprovacao) : atual.aprovacao,
                        historicoStatus: [...atual.historicoStatus],
                        atualizadoEmISO: modelo.agoraISO()
                    };
                    if (novaVersao) {
                        atualizado.historicoStatus.push(modelo.criarHistorico({
                            statusAnterior: atual.status,
                            statusAtual: "emitido",
                            acao: "nova_versao_emitida",
                            observacao: "Nova versão do orçamento emitida após revisão.",
                            realizadoPor: usuario,
                            origem
                        }));
                    }
                }

                transacao.set(referencia, atualizado, { merge: true });
                return { sucesso: true, registro: atualizado, erros: [], novaVersao: !!snapshot.exists && ["enviado", "recusado"].includes(modelo.normalizarRegistro(snapshot.data() || {}).status) };
            });
        } catch (erro) {
            return { sucesso: false, erros: [erro.message || "Não foi possível registrar a emissão do orçamento."], registro: null };
        }
    },

    modelo() {
        if (typeof OrcamentoAprovacaoModel === "undefined") throw new Error("Modelo de aprovação de orçamento indisponível.");
        return OrcamentoAprovacaoModel;
    }
};

if (typeof window !== "undefined") window.OrcamentoAprovacaoRepository = OrcamentoAprovacaoRepository;
if (typeof module !== "undefined" && module.exports) module.exports = { OrcamentoAprovacaoRepository };
