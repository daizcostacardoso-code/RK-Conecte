const ClienteRepository = {
    async request(path, options = {}) {
        let resposta;
        const controlador = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = controlador ? window.setTimeout(() => controlador.abort(), 8000) : null;
        try {
            resposta = await RKFirestoreStore.fetch(path, {
                headers: { "Content-Type": "application/json", ...(options.headers || {}) },
                ...options,
                signal: options.signal || controlador?.signal
            });
        } catch (_) {
            throw new Error("Nao foi possivel acessar os dados.");
        } finally {
            if (timer) window.clearTimeout(timer);
        }

        const dados = await resposta.json().catch(() => null);
        if (!resposta.ok) {
            const mensagem = dados?.mensagem || dados?.message || dados?.erro || "Nao foi possivel concluir a operacao.";
            const erros = Array.isArray(dados?.erros) ? ` ${dados.erros.join(" ")}` : "";
            throw new Error(`${mensagem}${erros}`.trim());
        }
        return dados;
    },

    extrairLista(resposta) {
        if (Array.isArray(resposta)) return resposta;
        if (Array.isArray(resposta?.dados)) return resposta.dados;
        if (Array.isArray(resposta?.clientes)) return resposta.clientes;
        return [];
    },

    extrairObjeto(resposta) {
        return resposta?.dados && !Array.isArray(resposta.dados) ? resposta.dados : resposta?.cliente || resposta || {};
    },

    normalizarDoFirestore(cliente = {}) {
        const documento = String(cliente.cpf_cnpj || "").replace(/\D/g, "");
        return ClienteModel.normalizar({
            id: String(cliente.cliente_id ?? ""),
            nome: cliente.nome,
            nomeFantasia: cliente.nome_fantasia,
            tipoPessoa: documento.length > 11 ? "juridica" : "fisica",
            cpfCnpj: documento,
            telefonePrincipal: cliente.telefone_principal,
            telefoneSecundario: cliente.telefone_secundario,
            email: cliente.email,
            observacoes: cliente.observacoes,
            status: Number(cliente.ativo) === 0 ? "inativo" : "ativo",
            dataCadastro: cliente.criado_em,
            ultimaAtualizacao: cliente.atualizado_em
        });
    },

    normalizarParaFirestore(cliente = {}) {
        return {
            tipo_pessoa: cliente.tipoPessoa || "fisica",
            nome: String(cliente.nome || "").trim(),
            nome_fantasia: String(cliente.nomeFantasia || "").trim(),
            cpf_cnpj: String(cliente.cpfCnpj || "").trim(),
            telefone_principal: String(cliente.telefonePrincipal || "").trim(),
            telefone_secundario: String(cliente.telefoneSecundario || "").trim(),
            email: String(cliente.email || "").trim(),
            observacoes: String(cliente.observacoes || "").trim(),
            ativo: cliente.status === "inativo" ? 0 : 1
        };
    },

    async salvarCliente(cliente, opcoes = {}) {
        // ClienteModel gera um ID local para objetos novos. Por isso, a presenca
        // de `cliente.id` sozinha nao pode ser usada para decidir entre POST e PUT.
        const novo = opcoes.novo === true || !String(cliente.id || "").trim();
        const resposta = await this.request(novo ? "/clientes" : `/clientes/${encodeURIComponent(cliente.id)}`, {
            method: novo ? "POST" : "PUT",
            body: JSON.stringify(this.normalizarParaFirestore(cliente))
        });
        const id = novo ? resposta.cliente_id || resposta.id : cliente.id;
        return this.buscarCliente(id);
    },

    async buscarCliente(id) {
        if (!id) return null;
        return this.normalizarDoFirestore(this.extrairObjeto(await this.request(`/clientes/${encodeURIComponent(id)}`)));
    },

    async listarClientes(filtros = {}) {
        const params = new URLSearchParams();
        if (filtros.busca) params.set("busca", filtros.busca);
        if (filtros.status) params.set("status", filtros.status);
        const query = params.toString() ? `?${params.toString()}` : "";
        const resposta = await this.request(`/clientes${query}`);
        return this.extrairLista(resposta).map(cliente => this.normalizarDoFirestore(cliente));
    },

    async atualizarCliente(id, dados) {
        return this.salvarCliente({ ...dados, id });
    },

    async removerCliente(id) {
        if (!id) return false;
        await this.request(`/clientes/${encodeURIComponent(id)}`, { method: "DELETE" });
        return true;
    }
};

function criarClienteRepository() {
    return ClienteRepository;
}
