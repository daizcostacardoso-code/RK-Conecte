const TamanhoPadraoRepository = {
    async request(path, options = {}) {
        let resposta = null;

        try {
            resposta = await RKFirestoreStore.fetch(path, {
                headers: { "Content-Type": "application/json", ...(options.headers || {}) },
                ...options
            });
        } catch (_) {
            throw new Error("Nao foi possivel acessar os dados no Firestore.");
        }

        let dados = null;
        try { dados = await resposta.json(); } catch (_) { dados = null; }

        if (!resposta.ok) {
            const mensagem = dados?.mensagem || dados?.message || dados?.erro || dados?.error || "Nao foi possivel concluir a operacao no Firestore.";
            const erros = Array.isArray(dados?.erros) ? ` ${dados.erros.join(" ")}` : "";
            throw new Error(`${mensagem}${erros}`.trim());
        }

        return dados;
    },

    normalizarLista(resposta, chave) {
        if (Array.isArray(resposta)) return resposta;
        if (Array.isArray(resposta?.dados)) return resposta.dados;
        if (chave && Array.isArray(resposta?.[chave])) return resposta[chave];
        if (Array.isArray(resposta?.tamanhos)) return resposta.tamanhos;
        if (Array.isArray(resposta?.itens)) return resposta.itens;
        if (Array.isArray(resposta?.data)) return resposta.data;
        return [];
    },

    extrairObjeto(resposta) {
        if (resposta?.dados && !Array.isArray(resposta.dados)) return resposta.dados;
        if (resposta?.tamanho) return resposta.tamanho;
        if (resposta?.data && !Array.isArray(resposta.data)) return resposta.data;
        return resposta || {};
    },

    normalizarTamanho(tamanho = {}) {
        const id = tamanho.tamanho_id ?? tamanho.id;
        return {
            ...tamanho,
            id: id != null ? String(id) : "",
            tamanho_id: id,
            item_id: tamanho.item_id ?? "",
            item_descricao: tamanho.item_descricao || tamanho.item || "",
            item_categoria_descricao: tamanho.item_categoria_descricao || tamanho.categoria_descricao || "",
            descricao: tamanho.descricao || tamanho.nome || "",
            altura: Number(tamanho.altura ?? 0),
            largura: Number(tamanho.largura ?? 0),
            ativo: tamanho.ativo === true || tamanho.ativo === 1 || tamanho.ativo === "1"
        };
    },

    normalizarParaFirestore(tamanho = {}) {
        return {
            item_id: String(tamanho.item_id || tamanho.itemId || "").startsWith("rk_")
                ? String(tamanho.item_id || tamanho.itemId) : Number(tamanho.item_id || tamanho.itemId || 0),
            descricao: String(tamanho.descricao || tamanho.nome || "").trim(),
            altura: Number(tamanho.altura || 0),
            largura: Number(tamanho.largura || 0),
            ativo: tamanho.ativo === true || tamanho.ativo === 1 || tamanho.ativo === "true" || tamanho.ativo === "1"
        };
    },

    async listar(filtros = {}) {
        const params = new URLSearchParams();
        if (filtros.busca) params.set("busca", filtros.busca);
        if (filtros.status) params.set("status", filtros.status);
        if (filtros.item_id) params.set("item_id", filtros.item_id);
        const query = params.toString() ? `?${params.toString()}` : "";
        const resposta = await this.request(`/tamanhos-padrao${query}`);
        return this.normalizarLista(resposta, "tamanhos").map(tamanho => this.normalizarTamanho(tamanho));
    },

    async buscarPorId(id) {
        const resposta = await this.request(`/tamanhos-padrao/${encodeURIComponent(id)}`);
        return this.normalizarTamanho(this.extrairObjeto(resposta));
    },

    async salvar(tamanho) {
        const resposta = await this.request("/tamanhos-padrao", {
            method: "POST",
            body: JSON.stringify(this.normalizarParaFirestore(tamanho))
        });
        return this.normalizarTamanho({
            ...tamanho,
            tamanho_id: resposta.tamanho_id || resposta.id || resposta.insertId,
            mensagem: resposta.mensagem || "Tamanho padrao cadastrado com sucesso."
        });
    },

    async atualizar(id, tamanho) {
        const resposta = await this.request(`/tamanhos-padrao/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: JSON.stringify(this.normalizarParaFirestore(tamanho))
        });
        return this.normalizarTamanho({
            ...tamanho,
            tamanho_id: id,
            mensagem: resposta.mensagem || "Tamanho padrao atualizado com sucesso."
        });
    },

    async excluir(id) {
        await this.request(`/tamanhos-padrao/${encodeURIComponent(id)}`, { method: "DELETE" });
        return true;
    },

    async listarItensAtivos() {
        const resposta = await this.request("/itens?status=ativo");
        return this.normalizarLista(resposta, "itens");
    }
};

window.TamanhoPadraoRepository = TamanhoPadraoRepository;
