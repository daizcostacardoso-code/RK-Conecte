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
            const documento = await this.localizarDocumento(valor);
            if (!documento) return { sucesso: false, erros: ["Orçamento não encontrado."], registro: null };
            return { sucesso: true, registro: modelo.normalizarRegistro({ ...documento.data(), id: documento.id }) };
        } catch (erro) {
            return { sucesso: false, erros: [erro.message || "Não foi possível consultar o orçamento."], registro: null };
        }
    },

    async localizarDocumento(identificador = "") {
        const valor = this.modelo().texto(identificador);
        if (!valor) return null;
        const colecao = db.collection(this.colecao);
        const direto = await colecao.doc(valor).get();
        if (direto.exists) return direto;
        const idNormalizado = this.idDocumento(valor);
        if (idNormalizado !== valor) {
            const normalizado = await colecao.doc(idNormalizado).get();
            if (normalizado.exists) return normalizado;
        }

        for (const campo of ["numero", "numero_orcamento", "numeroOrcamento", "orcamento_id", "registro.numero"]) {
            const consulta = await colecao.where(campo, "==", valor).limit(1).get();
            if (consulta.docs?.[0]) return consulta.docs[0];
        }

        return null;
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
        const identificador = modelo.texto(inicial.id || inicial.numero);
        if (!identificador) return { sucesso: false, erros: ["Orçamento sem identificador para salvar."], registro: null };

        try {
            const existente = await this.localizarDocumento(inicial.numero || identificador);
            const id = existente?.id || this.idDocumento(identificador);
            return await db.runTransaction(async transacao => {
                const referencia = db.collection(this.colecao).doc(id);
                const snapshot = await transacao.get(referencia);
                const usuario = modelo.normalizarUsuario(opcoes.usuario);
                const origem = modelo.texto(opcoes.origem) || "sistema";
                let atualizado;
                let novaVersao = false;

                if (!snapshot.exists) {
                    const agora = modelo.agoraISO();
                    atualizado = modelo.normalizarRegistro({
                        ...inicial,
                        id,
                        orcamento_id: id,
                        status: "emitido",
                        criadoEmISO: inicial.criadoEmISO || agora,
                        atualizadoEmISO: agora,
                        historicoStatus: [modelo.criarHistorico({
                            id: `hist_emissao_${modelo.chave(id)}_1`,
                            statusAnterior: null,
                            statusAtual: "emitido",
                            acao: "orcamento_emitido",
                            observacao: "Orçamento emitido e registrado no fluxo comercial.",
                            realizadoEm: agora,
                            realizadoPor: usuario,
                            origem
                        })]
                    });
                } else {
                    const atual = modelo.normalizarRegistro({ ...snapshot.data(), id: snapshot.id });
                    novaVersao = ["enviado", "recusado"].includes(atual.status);
                    const status = novaVersao ? "emitido" : atual.status;
                    const aprovacao = novaVersao
                        ? modelo.limparDecisaoParaNovaVersao(atual.aprovacao)
                        : atual.aprovacao;
                    const vinculos = {
                        solicitacaoId: inicial.vinculos?.solicitacaoId || atual.vinculos?.solicitacaoId || "",
                        clienteId: inicial.vinculos?.clienteId || atual.vinculos?.clienteId || "",
                        projetoId: inicial.vinculos?.projetoId || atual.vinculos?.projetoId || ""
                    };
                    atualizado = modelo.normalizarRegistro({
                        ...atual,
                        ...inicial,
                        id: snapshot.id,
                        orcamento_id: snapshot.id,
                        status,
                        aprovacao,
                        vinculos,
                        historicoStatus: [...atual.historicoStatus],
                        criadoEmISO: atual.criadoEmISO,
                        atualizadoEmISO: modelo.agoraISO()
                    });
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
                return { sucesso: true, registro: atualizado, erros: [], novaVersao };
            });
        } catch (erro) {
            return { sucesso: false, erros: [erro.message || "Não foi possível registrar a emissão do orçamento."], registro: null };
        }
    },

    idDocumento(valor = "") {
        const texto = this.modelo().texto(valor) || `orc_${Date.now()}`;
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 120) || `orc_${Date.now()}`;
    },

    modelo() {
        if (typeof OrcamentoAprovacaoModel === "undefined") throw new Error("Modelo de aprovação de orçamento indisponível.");
        return OrcamentoAprovacaoModel;
    }
};

if (typeof window !== "undefined") window.OrcamentoAprovacaoRepository = OrcamentoAprovacaoRepository;
if (typeof module !== "undefined" && module.exports) module.exports = { OrcamentoAprovacaoRepository };
