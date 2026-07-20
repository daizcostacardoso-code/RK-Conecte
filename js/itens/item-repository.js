const CadastroItemRepository = {
    async request(path, options = {}) {
        let resposta = null;

        try {
            resposta = await RKFirestoreStore.fetch(path, {
                headers: { "Content-Type": "application/json", ...(options.headers || {}) },
                ...options
            });
        } catch (_) {
            throw new Error("Nao foi possivel acessar os dados.");
        }

        let dados = null;
        try { dados = await resposta.json(); } catch (_) { dados = null; }

        if (!resposta.ok) {
            const mensagem = dados?.mensagem || dados?.message || dados?.erro || dados?.error || "Nao foi possivel concluir a operacao.";
            const erros = Array.isArray(dados?.erros) ? ` ${dados.erros.join(" ")}` : "";
            throw new Error(`${mensagem}${erros}`.trim());
        }

        return dados;
    },

    normalizarLista(resposta) {
        if (Array.isArray(resposta)) return resposta;
        if (Array.isArray(resposta?.dados)) return resposta.dados;
        if (Array.isArray(resposta?.itens)) return resposta.itens;
        if (Array.isArray(resposta?.categorias)) return resposta.categorias;
        if (Array.isArray(resposta?.data)) return resposta.data;
        return [];
    },

    extrairObjeto(resposta) {
        if (resposta?.dados && !Array.isArray(resposta.dados)) return resposta.dados;
        if (resposta?.item) return resposta.item;
        if (resposta?.data && !Array.isArray(resposta.data)) return resposta.data;
        return resposta || {};
    },

    normalizarItem(item = {}) {
        const id = item.item_id ?? item.id;
        return {
            ...item,
            id: id != null ? String(id) : "",
            item_id: id,
            categoria_item_id: item.categoria_item_id ?? "",
            categoria_descricao: item.categoria_descricao || item.categoria || "",
            descricao: item.descricao || item.nome || "",
            ativo: item.ativo === true || item.ativo === 1 || item.ativo === "1"
        };
    },

    normalizarParaFirestore(item = {}) {
        return {
            categoria_item_id: Number(item.categoria_item_id || item.categoriaItemId || 0),
            descricao: String(item.descricao || item.nome || "").trim(),
            ativo: item.ativo === true || item.ativo === 1 || item.ativo === "true" || item.ativo === "1"
        };
    },

    async listar(filtros = {}) {
        const params = new URLSearchParams();
        if (filtros.busca) params.set("busca", filtros.busca);
        if (filtros.status) params.set("status", filtros.status);
        const query = params.toString() ? `?${params.toString()}` : "";
        const resposta = await this.request(`/itens${query}`);
        return this.normalizarLista(resposta).map(item => this.normalizarItem(item));
    },

    async buscarPorId(id) {
        const resposta = await this.request(`/itens/${encodeURIComponent(id)}`);
        return this.normalizarItem(this.extrairObjeto(resposta));
    },

    async salvar(item) {
        const resposta = await this.request("/itens", {
            method: "POST",
            body: JSON.stringify(this.normalizarParaFirestore(item))
        });
        return this.normalizarItem({
            ...item,
            item_id: resposta.item_id || resposta.id || resposta.insertId,
            mensagem: resposta.mensagem || "Item cadastrado com sucesso."
        });
    },

    async atualizar(id, item) {
        const resposta = await this.request(`/itens/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: JSON.stringify(this.normalizarParaFirestore(item))
        });
        return this.normalizarItem({
            ...item,
            item_id: id,
            mensagem: resposta.mensagem || "Item atualizado com sucesso."
        });
    },

    async excluir(id) {
        await this.request(`/itens/${encodeURIComponent(id)}`, { method: "DELETE" });
        return true;
    },

    async listarCategoriasItem() {
        const resposta = await this.request("/categorias/itens");
        return this.normalizarLista(resposta);
    }
};

window.CadastroItemRepository = CadastroItemRepository;
