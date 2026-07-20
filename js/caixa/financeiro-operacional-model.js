const FinanceiroOperacionalModel = {
    schemaVersion: 1,
    status: ["pendente", "parcial", "quitado", "cancelado"],

    idFinanceiro(projetoId = "") {
        const chave = this.chave(projetoId);
        if (!chave) throw new Error("Projeto obrigatório para abrir o financeiro.");
        return `fin_${chave}`.slice(0, 120);
    },

    normalizar(entrada = {}) {
        const projetoId = this.texto(entrada.projetoId || entrada.projeto_id || entrada.projeto?.id, 120);
        const id = this.texto(entrada.id || entrada.financeiroId || entrada.financeiro_id, 120)
            || (projetoId ? this.idFinanceiro(projetoId) : "");
        const recebimentos = (Array.isArray(entrada.recebimentos) ? entrada.recebimentos : [])
            .map(item => this.normalizarRecebimento(item))
            .filter(Boolean);
        const valorContratadoInformadoEmCentavos = entrada.valorContratadoCentavos ?? entrada.valor_contratado_centavos;
        const valorContratadoCentavos = valorContratadoInformadoEmCentavos !== undefined && valorContratadoInformadoEmCentavos !== null
            ? this.centavos(valorContratadoInformadoEmCentavos, true)
            : this.centavos(entrada.valorContratado ?? entrada.valorTotal);
        const valorRecebidoCentavos = recebimentos
            .filter(item => item.status !== "cancelado")
            .reduce((total, item) => total + item.valorCentavos, 0);
        const saldoCentavos = Math.max(0, valorContratadoCentavos - valorRecebidoCentavos);
        const cancelado = this.normalizarStatus(entrada.status) === "cancelado" || entrada.ativo === false;
        const status = cancelado
            ? "cancelado"
            : this.statusPorValores(valorContratadoCentavos, valorRecebidoCentavos);
        return {
            ...entrada,
            id,
            financeiroId: id,
            financeiro_id: id,
            projetoId,
            projeto_id: projetoId,
            orcamentoId: this.texto(entrada.orcamentoId || entrada.orcamento_id || entrada.orcamento?.id, 120),
            orcamentoNumero: this.texto(entrada.orcamentoNumero || entrada.orcamento_numero || entrada.orcamento?.numero, 80),
            projetoNumero: this.texto(entrada.projetoNumero || entrada.projeto_numero || entrada.projeto?.numero, 80),
            clienteId: this.texto(entrada.clienteId || entrada.cliente_id || entrada.cliente?.id, 120),
            clienteNome: this.texto(entrada.clienteNome || entrada.cliente_nome || entrada.cliente?.nome, 160),
            valorContratadoCentavos,
            valorRecebidoCentavos,
            saldoCentavos,
            valorContratado: this.reais(valorContratadoCentavos),
            valorRecebido: this.reais(valorRecebidoCentavos),
            saldo: this.reais(saldoCentavos),
            status,
            recebimentos,
            historico: Array.isArray(entrada.historico) ? entrada.historico : [],
            ativo: status !== "cancelado",
            schemaVersion: Math.max(this.schemaVersion, Number.parseInt(entrada.schemaVersion, 10) || 0),
            criadoEmISO: this.texto(entrada.criadoEmISO || entrada.criado_em, 40),
            atualizadoEmISO: this.texto(entrada.atualizadoEmISO || entrada.atualizado_em, 40)
        };
    },

    criarOuAtualizar(projeto = {}, existente = null, usuario = null) {
        const anterior = existente ? this.normalizar(existente) : null;
        const projetoId = this.texto(projeto.id || projeto.projetoId, 120);
        const agora = this.agoraISO();
        const valorProjeto = projeto.financeiro?.valorTotal
            ?? projeto.comercial?.valorFechado
            ?? projeto.orcamento?.total;
        const total = valorProjeto !== undefined && valorProjeto !== null
            ? this.centavos(valorProjeto)
            : this.centavos(anterior?.valorContratadoCentavos, true);
        const base = this.normalizar({
            ...(anterior || {}),
            id: this.idFinanceiro(projetoId),
            projetoId,
            projetoNumero: projeto.numero || projeto.codigo || anterior?.projetoNumero || "",
            orcamentoId: projeto.orcamento?.id || anterior?.orcamentoId || "",
            orcamentoNumero: projeto.orcamento?.numero || anterior?.orcamentoNumero || "",
            clienteId: projeto.cliente?.id || projeto.clienteId || anterior?.clienteId || "",
            clienteNome: projeto.cliente?.nome || projeto.clienteNome || anterior?.clienteNome || "",
            valorContratadoCentavos: total,
            status: projeto.status === "cancelado" ? "cancelado" : anterior?.status,
            ativo: projeto.status !== "cancelado" && anterior?.ativo !== false,
            criadoEmISO: anterior?.criadoEmISO || agora,
            atualizadoEmISO: agora
        });
        const erros = this.validar(base);
        if (erros.length) return { sucesso: false, erros, financeiro: base, alterado: false };
        const historico = [...base.historico];
        if (!anterior && !historico.some(item => item.tipo === "financeiro_aberto")) {
            historico.push(this.evento(
                "financeiro_aberto",
                "Controle financeiro aberto a partir do projeto aprovado.",
                usuario,
                { projetoId, valorContratadoCentavos: base.valorContratadoCentavos }
            ));
        }
        const financeiro = this.normalizar({ ...base, historico });
        const alterado = !anterior || this.assinatura(anterior) !== this.assinatura(financeiro);
        return { sucesso: true, erros: [], financeiro: alterado ? financeiro : anterior, alterado, criado: !anterior, idempotente: !alterado };
    },

    registrarRecebimento(financeiro = {}, dados = {}, usuario = null) {
        const atual = this.normalizar(financeiro);
        const id = this.texto(dados.id || dados.recebimentoId, 120);
        if (!id) return { sucesso: false, erros: ["Identificador do recebimento não informado."], financeiro: atual, alterado: false };
        const existente = atual.recebimentos.find(item => item.id === id);
        if (existente) return { sucesso: true, erros: [], financeiro: atual, recebimento: existente, alterado: false, idempotente: true };
        if (atual.status === "cancelado") return { sucesso: false, erros: ["O financeiro deste projeto está cancelado."], financeiro: atual, alterado: false };
        if (atual.status === "quitado") return { sucesso: false, erros: ["Este projeto já está totalmente quitado."], financeiro: atual, alterado: false };

        const valorCentavos = dados.valorCentavos !== undefined && dados.valorCentavos !== null
            ? this.centavos(dados.valorCentavos, true)
            : this.centavos(dados.valor);
        const erros = [];
        if (valorCentavos <= 0) erros.push("Informe um valor de recebimento válido.");
        if (valorCentavos > atual.saldoCentavos) erros.push("O recebimento não pode ser maior que o saldo pendente.");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dados.data || ""))) erros.push("Informe a data do recebimento.");
        if (erros.length) return { sucesso: false, erros, financeiro: atual, alterado: false };

        const recebimento = this.normalizarRecebimento({
            id,
            valorCentavos,
            data: dados.data,
            formaPagamento: dados.formaPagamento || "Não informado",
            observacao: dados.observacao || "",
            status: "confirmado",
            criadoEmISO: this.agoraISO(),
            criadoPor: this.nomeUsuario(usuario)
        });
        const recebimentos = [...atual.recebimentos, recebimento];
        const historico = [...atual.historico, this.evento(
            "recebimento_registrado",
            `Recebimento de ${this.moeda(recebimento.valorCentavos)} registrado.`,
            usuario,
            { recebimentoId: recebimento.id, valorCentavos: recebimento.valorCentavos }
        )];
        const atualizado = this.normalizar({
            ...atual,
            recebimentos,
            historico,
            atualizadoEmISO: this.agoraISO()
        });
        return { sucesso: true, erros: [], financeiro: atualizado, recebimento, alterado: true, idempotente: false };
    },

    cancelar(financeiro = {}, usuario = null, motivo = "") {
        const atual = this.normalizar(financeiro);
        if (atual.status === "cancelado") return { sucesso: true, erros: [], financeiro: atual, alterado: false, idempotente: true };
        const historico = [...atual.historico];
        historico.push(this.evento(
            "financeiro_cancelado",
            this.texto(motivo, 300) || "Controle financeiro cancelado com o projeto.",
            usuario,
            { projetoId: atual.projetoId, saldoCentavos: atual.saldoCentavos }
        ));
        return {
            sucesso: true,
            erros: [],
            alterado: true,
            idempotente: false,
            financeiro: this.normalizar({ ...atual, status: "cancelado", ativo: false, historico, atualizadoEmISO: this.agoraISO() })
        };
    },

    atualizarResumoProjeto(projeto = {}, financeiro = {}, usuario = null) {
        const registro = this.normalizar(financeiro);
        const resumo = {
            ...(projeto.financeiro || {}),
            id: registro.id,
            status: registro.status,
            valorTotal: registro.valorContratado,
            valorRecebido: registro.valorRecebido,
            saldo: registro.saldo,
            atualizadoEmISO: registro.atualizadoEmISO
        };
        if (typeof ProjetoModel === "undefined") return { ...projeto, financeiro: resumo };
        const atual = ProjetoModel.normalizar(projeto);
        let atualizado = ProjetoModel.atualizar(atual, { financeiro: resumo }, this.nomeUsuario(usuario));
        const ultimoRecebimento = registro.recebimentos[registro.recebimentos.length - 1];
        if (ultimoRecebimento && !(atual.historico || []).some(item => item.tipo === "recebimento_registrado" && item.dados?.recebimentoId === ultimoRecebimento.id)) {
            atualizado = ProjetoModel.adicionarEvento(
                atualizado,
                "recebimento_registrado",
                `Recebimento de ${this.moeda(ultimoRecebimento.valorCentavos)} registrado no projeto.`,
                this.nomeUsuario(usuario),
                { recebimentoId: ultimoRecebimento.id, financeiroId: registro.id, valorCentavos: ultimoRecebimento.valorCentavos }
            );
        }
        return ProjetoModel.normalizar(atualizado);
    },

    movimentoCaixa(financeiro = {}, recebimento = {}) {
        const registro = this.normalizar(financeiro);
        const item = this.normalizarRecebimento(recebimento);
        if (!item) throw new Error("Recebimento inválido para o caixa.");
        const referencia = this.referenciaData(item.data);
        return {
            id: `cx_${item.id}`.slice(0, 120),
            descricao: `Recebimento ${registro.projetoNumero || registro.projetoId} - ${registro.clienteNome || "Cliente"}`.slice(0, 160),
            categoria: "venda",
            tipo: "entrada",
            valor: this.reais(item.valorCentavos),
            valor_centavos: item.valorCentavos,
            data_movimento: item.data,
            forma_pagamento: item.formaPagamento,
            origem: "Financeiro operacional",
            observacao: item.observacao,
            responsavel: item.criadoPor,
            status: "confirmado",
            cliente_id: registro.clienteId || null,
            orcamento_id: registro.orcamentoId || null,
            projeto_id: registro.projetoId,
            financeiro_id: registro.id,
            recebimento_id: item.id,
            mes_referencia: referencia.mesReferencia,
            ano_referencia: referencia.anoReferencia,
            dia_referencia: referencia.diaReferencia,
            criado_em: item.criadoEmISO,
            atualizado_em: item.criadoEmISO
        };
    },

    validar(financeiro = {}) {
        const erros = [];
        if (!financeiro.projetoId) erros.push("Projeto obrigatório para o financeiro.");
        if (!financeiro.orcamentoId) erros.push("Orçamento obrigatório para o financeiro.");
        if (financeiro.valorContratadoCentavos < 0) erros.push("Valor contratado inválido.");
        if (financeiro.valorRecebidoCentavos > financeiro.valorContratadoCentavos) erros.push("Recebimentos acima do valor contratado.");
        return erros;
    },

    normalizarRecebimento(item = {}) {
        const id = this.texto(item.id || item.recebimentoId, 120);
        const valorInformadoEmCentavos = item.valorCentavos ?? item.valor_centavos;
        const valorCentavos = valorInformadoEmCentavos !== undefined && valorInformadoEmCentavos !== null
            ? this.centavos(valorInformadoEmCentavos, true)
            : this.centavos(item.valor);
        const data = this.texto(item.data || item.data_movimento, 10);
        if (!id || valorCentavos <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
        return {
            id,
            valorCentavos,
            valor: this.reais(valorCentavos),
            data,
            formaPagamento: this.texto(item.formaPagamento || item.forma_pagamento || "Não informado", 60),
            observacao: this.texto(item.observacao, 500),
            status: item.status === "cancelado" ? "cancelado" : "confirmado",
            criadoEmISO: this.texto(item.criadoEmISO || item.criado_em, 40),
            criadoPor: this.texto(item.criadoPor || item.responsavel || "Sistema", 120)
        };
    },

    assinatura(financeiro = {}) {
        const registro = this.normalizar(financeiro);
        return JSON.stringify({
            projetoId: registro.projetoId,
            orcamentoId: registro.orcamentoId,
            clienteId: registro.clienteId,
            clienteNome: registro.clienteNome,
            valorContratadoCentavos: registro.valorContratadoCentavos,
            status: registro.status,
            recebimentos: registro.recebimentos,
            historico: registro.historico
        });
    },

    statusPorValores(total = 0, recebido = 0) {
        if (total > 0 && recebido >= total) return "quitado";
        if (recebido > 0) return "parcial";
        return "pendente";
    },
    normalizarStatus(status = "") { const valor = this.chave(status); return this.status.includes(valor) ? valor : "pendente"; },
    novoIdRecebimento(projetoId = "") { return `rec_${this.chave(projetoId)}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`.slice(0, 120); },
    evento(tipo, descricao, usuario = null, dados = {}) { return { tipo, descricao, data: this.agoraISO(), usuario: this.nomeUsuario(usuario), dados }; },
    nomeUsuario(usuario = null) { return this.texto(usuario?.nome || usuario?.nomeUsuario || usuario?.email || usuario?.uid || usuario || "Sistema", 120); },
    centavos(valor, jaCentavos = false) {
        if (jaCentavos) {
            const inteiro = Number(valor);
            return Number.isInteger(inteiro) ? Math.max(0, inteiro) : 0;
        }
        const numero = typeof valor === "string"
            ? Number(valor.trim().replace(/\s/g, "").replace(/^R\$/i, "").replace(/\./g, "").replace(",", "."))
            : Number(valor || 0);
        return Number.isFinite(numero) ? Math.max(0, Math.round(numero * 100)) : 0;
    },
    reais(centavos = 0) { return Number((Number(centavos || 0) / 100).toFixed(2)); },
    moeda(centavos = 0) { return this.reais(centavos).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); },
    referenciaData(data = "") { const [ano, mes, dia] = String(data).split("-").map(Number); return { mesReferencia: `${ano}-${String(mes).padStart(2, "0")}`, anoReferencia: ano, diaReferencia: dia }; },
    agoraISO() { return new Date().toISOString(); },
    texto(valor, limite = 1000) { return String(valor ?? "").trim().slice(0, limite); },
    chave(valor = "") { return this.texto(valor, 160).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, ""); }
};

if (typeof window !== "undefined") window.FinanceiroOperacionalModel = FinanceiroOperacionalModel;
if (typeof module !== "undefined" && module.exports) module.exports = { FinanceiroOperacionalModel };
