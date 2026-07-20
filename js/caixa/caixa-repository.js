const CaixaRepository = {
    configurar() {
        return this;
    },

    async request(path, options = {}) {
        let resposta;
        const controlador = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = controlador ? window.setTimeout(() => controlador.abort(), 10000) : null;
        try {
            resposta = await RKFirestoreStore.fetch(path, {
                headers: { "Content-Type": "application/json", ...(options.headers || {}) },
                ...options,
                signal: options.signal || controlador?.signal
            });
        } catch (_) {
            throw new Error("Nao foi possivel acessar os dados do caixa.");
        } finally {
            if (timer) window.clearTimeout(timer);
        }

        const dados = await resposta.json().catch(() => null);
        if (!resposta.ok) {
            const mensagem = dados?.mensagem || dados?.message || "Nao foi possivel concluir a operacao.";
            const erros = Array.isArray(dados?.erros) ? ` ${dados.erros.join(" ")}` : "";
            throw new Error(`${mensagem}${erros}`.trim());
        }
        return dados;
    },

    extrairLista(resposta) {
        if (Array.isArray(resposta)) return resposta;
        return Array.isArray(resposta?.dados) ? resposta.dados : [];
    },

    extrairObjeto(resposta) {
        return resposta?.dados && !Array.isArray(resposta.dados) ? resposta.dados : resposta || {};
    },

    normalizarDoFirestore(registro = {}) {
        return CaixaModel.criar({
            caixaId: registro.caixa_id,
            descricao: registro.descricao,
            categoria: registro.categoria,
            tipo: registro.tipo,
            valor: Number(registro.valor || 0),
            data: registro.data_movimento,
            formaPagamento: registro.forma_pagamento,
            origem: registro.origem,
            observacao: registro.observacao,
            responsavel: registro.responsavel,
            status: registro.status,
            clienteId: registro.cliente_id,
            orcamentoId: registro.orcamento_id,
            projetoId: registro.projeto_id,
            financeiroId: registro.financeiro_id,
            recebimentoId: registro.recebimento_id,
            usuarioId: registro.usuario_id,
            mesReferencia: registro.mes_referencia,
            anoReferencia: registro.ano_referencia,
            diaReferencia: registro.dia_referencia,
            criadoEm: registro.criado_em,
            atualizadoEm: registro.atualizado_em
        });
    },

    normalizarParaFirestore(movimento = {}) {
        const dataMovimento = CaixaModel.normalizarData(movimento.data || movimento.data_movimento);
        const referencia = CaixaModel.obterReferencia(dataMovimento);
        return {
            descricao: String(movimento.descricao || "").trim(),
            categoria: movimento.categoria,
            tipo: movimento.tipo,
            valor: Number(movimento.valor || 0),
            data_movimento: dataMovimento,
            forma_pagamento: movimento.formaPagamento,
            origem: movimento.origem,
            observacao: movimento.observacao,
            responsavel: movimento.responsavel,
            status: movimento.status,
            cliente_id: movimento.clienteId || null,
            orcamento_id: movimento.orcamentoId || null,
            projeto_id: movimento.projetoId || null,
            financeiro_id: movimento.financeiroId || null,
            recebimento_id: movimento.recebimentoId || null,
            usuario_id: movimento.usuarioId || null,
            mes_referencia: movimento.mesReferencia || referencia.mesReferencia,
            ano_referencia: Number(movimento.anoReferencia) || referencia.anoReferencia,
            dia_referencia: Number(movimento.diaReferencia) || referencia.diaReferencia
        };
    },

    async listar() {
        const resposta = await this.request("/caixa");
        return CaixaModel.ordenar(this.extrairLista(resposta).map(registro => this.normalizarDoFirestore(registro)));
    },

    async buscarPorId(caixaId) {
        const resposta = await this.request(`/caixa/${encodeURIComponent(caixaId)}`);
        return this.normalizarDoFirestore(this.extrairObjeto(resposta));
    },

    async salvar(movimento) {
        const normalizado = CaixaModel.criar(movimento);
        const resposta = await this.request("/caixa", {
            method: "POST",
            body: JSON.stringify(this.normalizarParaFirestore(normalizado))
        });
        return this.buscarPorId(resposta.caixa_id);
    },

    async atualizar(caixaId, dados = {}) {
        const atual = await this.buscarPorId(caixaId);
        const atualizado = CaixaModel.criar({ ...atual, ...dados, caixaId: atual.caixaId });
        await this.request(`/caixa/${encodeURIComponent(caixaId)}`, {
            method: "PUT",
            body: JSON.stringify(this.normalizarParaFirestore(atualizado))
        });
        return this.buscarPorId(caixaId);
    },

    async excluir(caixaId) {
        await this.request(`/caixa/${encodeURIComponent(caixaId)}`, { method: "DELETE" });
        return true;
    },

    async exportarJSON() {
        return this.listar();
    },

    async importarJSON(lista) {
        const salvos = [];
        for (const movimento of CaixaModel.normalizarLista(lista)) salvos.push(await this.salvar(movimento));
        return CaixaModel.ordenar(salvos);
    }
};

window.CaixaRepository = CaixaRepository;
