const NotaServicoRepository = {
    async request(path, options = {}) {
        if (typeof RKFirestoreStore === "undefined" || typeof RKFirestoreStore.fetch !== "function") {
            throw new Error("Dados temporariamente indisponiveis.");
        }

        const resposta = await RKFirestoreStore.fetch(path, {
            headers: { "Content-Type": "application/json", ...(options.headers || {}) },
            ...options
        });
        const dados = await resposta.json().catch(() => null);
        if (!resposta.ok) throw new Error(dados?.mensagem || "Nao foi possivel acessar as notas.");
        return dados;
    },

    normalizarDoFirestore(registro = {}) {
        return NotaServicoModel.normalizar({
            ...registro,
            id: registro.id || registro.nota_id || registro._rkDocumentoId
        });
    },

    normalizarParaFirestore(nota = {}) {
        const normalizada = NotaServicoModel.normalizar(nota);
        return JSON.parse(JSON.stringify({
            ...normalizada,
            nota_id: normalizada.id,
            subtotal: NotaServicoModel.subtotal(normalizada),
            total: NotaServicoModel.total(normalizada)
        }));
    },

    async listar() {
        const resposta = await this.request("/notas");
        const itens = Array.isArray(resposta?.dados) ? resposta.dados : [];
        return itens.map(item => this.normalizarDoFirestore(item)).sort((a, b) => {
            const dataA = Date.parse(a.atualizadoEm || a.emitidaEm || 0) || 0;
            const dataB = Date.parse(b.atualizadoEm || b.emitidaEm || 0) || 0;
            return dataB - dataA;
        });
    },

    async salvar(nota = {}) {
        const resposta = await this.request("/notas", {
            method: "POST",
            body: JSON.stringify(this.normalizarParaFirestore(nota))
        });
        return this.normalizarDoFirestore(resposta?.dados || nota);
    },

    async excluir(id) {
        if (!id) return false;
        await this.request(`/notas/${encodeURIComponent(id)}`, { method: "DELETE" });
        return true;
    }
};

window.NotaServicoRepository = NotaServicoRepository;
