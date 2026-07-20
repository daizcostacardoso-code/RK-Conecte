const ItemDependenciaRepository = {
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
        if (Array.isArray(resposta?.dependencias)) return resposta.dependencias;
        if (Array.isArray(resposta?.itens)) return resposta.itens;
        if (Array.isArray(resposta?.produtos)) return resposta.produtos;
        if (Array.isArray(resposta?.data)) return resposta.data;
        return [];
    },

    extrairObjeto(resposta) {
        if (resposta?.dados && !Array.isArray(resposta.dados)) return resposta.dados;
        if (resposta?.dependencia) return resposta.dependencia;
        if (resposta?.data && !Array.isArray(resposta.data)) return resposta.data;
        return resposta || {};
    },

    normalizarDependencia(dependencia = {}) {
        const id = dependencia.dependencia_id ?? dependencia.id;
        return {
            ...dependencia,
            id: id != null ? String(id) : "",
            dependencia_id: id,
            item_id: dependencia.item_id ?? "",
            produto_id: dependencia.produto_id ?? "",
            item_descricao: dependencia.item_descricao || dependencia.item || "",
            produto_descricao: dependencia.produto_descricao || dependencia.produto || "",
            produto_unidade_sigla: dependencia.produto_unidade_sigla || dependencia.unidade_sigla || "",
            quantidade: Number(dependencia.quantidade ?? 1),
            obrigatorio: dependencia.obrigatorio === true || dependencia.obrigatorio === 1 || dependencia.obrigatorio === "1",
            observacao: dependencia.observacao || ""
        };
    },

    normalizarParaFirestore(dependencia = {}) {
        return {
            item_id: String(dependencia.item_id || dependencia.itemId || "").startsWith("rk_")
                ? String(dependencia.item_id || dependencia.itemId) : Number(dependencia.item_id || dependencia.itemId || 0),
            produto_id: String(dependencia.produto_id || dependencia.produtoId || "").startsWith("rk_")
                ? String(dependencia.produto_id || dependencia.produtoId) : Number(dependencia.produto_id || dependencia.produtoId || 0),
            quantidade: Number(dependencia.quantidade || 1),
            obrigatorio: dependencia.obrigatorio === true || dependencia.obrigatorio === 1 || dependencia.obrigatorio === "true" || dependencia.obrigatorio === "1",
            observacao: String(dependencia.observacao || "").trim()
        };
    },

    async listar() {
        const resposta = await this.request("/item-dependencias");
        return this.normalizarLista(resposta, "dependencias").map(dependencia => this.normalizarDependencia(dependencia));
    },

    async buscarPorId(id) {
        const resposta = await this.request(`/item-dependencias/${encodeURIComponent(id)}`);
        return this.normalizarDependencia(this.extrairObjeto(resposta));
    },

    async salvar(dependencia) {
        const resposta = await this.request("/item-dependencias", {
            method: "POST",
            body: JSON.stringify(this.normalizarParaFirestore(dependencia))
        });
        return this.normalizarDependencia({
            ...dependencia,
            dependencia_id: resposta.dependencia_id || resposta.id || resposta.insertId,
            mensagem: resposta.mensagem || "Dependencia cadastrada com sucesso."
        });
    },

    async atualizar(id, dependencia) {
        const resposta = await this.request(`/item-dependencias/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: JSON.stringify(this.normalizarParaFirestore(dependencia))
        });
        return this.normalizarDependencia({
            ...dependencia,
            dependencia_id: id,
            mensagem: resposta.mensagem || "Dependencia atualizada com sucesso."
        });
    },

    async excluir(id) {
        await this.request(`/item-dependencias/${encodeURIComponent(id)}`, { method: "DELETE" });
        return true;
    },

    async listarItensAtivos() {
        const resposta = await this.request("/itens?status=ativo");
        return this.normalizarLista(resposta, "itens");
    },

    async listarProdutosAtivos() {
        const resposta = await this.request("/produtos?status=ativo");
        return this.normalizarLista(resposta, "produtos");
    }
};

window.ItemDependenciaRepository = ItemDependenciaRepository;
