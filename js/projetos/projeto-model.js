const ProjetoModel = {
    status: {
        rascunho: "Rascunho",
        em_orcamento: "Em orcamento",
        enviado: "Enviado",
        aprovado: "Aprovado",
        em_producao: "Em producao",
        em_instalacao: "Em instalacao",
        concluido: "Concluido",
        cancelado: "Cancelado"
    },

    etapas: {
        comercial: "Comercial",
        producao: "Producao",
        instalacao: "Instalacao",
        financeiro: "Financeiro",
        finalizado: "Finalizado"
    },

    prioridades: {
        baixa: "Baixa",
        media: "Media",
        alta: "Alta",
        urgente: "Urgente"
    },

    origens: {
        site: "Site",
        whatsapp: "WhatsApp",
        telefone: "Telefone",
        indicacao: "Indicacao",
        presencial: "Presencial",
        cliente_antigo: "Cliente antigo",
        manual: "Manual"
    },

    criar(dados = {}) {
        const agora = this.agoraISO();
        const numero = dados.numero || dados.codigo || this.criarNumero();
        const status = dados.status || this.statusPadrao();
        const projeto = this.normalizar({
            ...dados,
            id: dados.id || this.criarId("prj"),
            numero,
            codigo: dados.codigo || numero,
            status,
            etapaAtual: dados.etapaAtual || dados.etapa || this.etapaPorStatus(status),
            datas: {
                ...(dados.datas || {}),
                criacao: dados.datas?.criacao || agora,
                atualizacao: agora
            },
            criadoPor: dados.criadoPor || dados.usuario || "",
            atualizadoPor: dados.atualizadoPor || dados.usuario || ""
        });

        if (!projeto.historico.length) {
            return this.adicionarEvento(projeto, "criado", "Projeto criado", dados.usuario || projeto.criadoPor || "Sistema");
        }

        return projeto;
    },

    normalizar(dados = {}) {
        const agora = this.agoraISO();
        const numero = dados.numero || dados.codigo || this.criarNumero();
        const status = dados.status || this.statusPadrao();
        const etapaAtual = dados.etapaAtual || dados.etapa || this.etapaPorStatus(status);
        const datasEntrada = dados.datas || {};

        return {
            id: dados.id || this.criarId("prj"),
            numero,
            codigo: dados.codigo || numero,
            titulo: dados.titulo || this.criarTitulo(dados),
            origem: dados.origem || "manual",
            status,
            etapaAtual,
            etapa: etapaAtual,
            prioridade: dados.prioridade || "media",
            cliente: this.normalizarCliente(dados.cliente || dados),
            obra: this.normalizarObra(dados.obra || dados),
            orcamento: this.normalizarOrcamento(dados.orcamento || {}),
            comercial: this.normalizarComercial(dados.comercial || dados),
            operacional: this.normalizarOperacional(dados.operacional || {}),
            financeiro: this.normalizarFinanceiro(dados.financeiro || {}),
            historico: Array.isArray(dados.historico) ? dados.historico : [],
            arquivos: Array.isArray(dados.arquivos) ? dados.arquivos : [],
            fotos: Array.isArray(dados.fotos) ? dados.fotos : [],
            datas: {
                criacao: datasEntrada.criacao || dados.criadoEmISO || agora,
                atualizacao: datasEntrada.atualizacao || dados.atualizadoEmISO || agora,
                ultimoContato: datasEntrada.ultimoContato || "",
                proximoContato: datasEntrada.proximoContato || dados.proximoContato || "",
                aprovacao: datasEntrada.aprovacao || "",
                cancelamento: datasEntrada.cancelamento || "",
                conclusao: datasEntrada.conclusao || null,
                finalizacao: datasEntrada.finalizacao || ""
            },
            criadoPor: dados.criadoPor || "",
            atualizadoPor: dados.atualizadoPor || "",
            tags: Array.isArray(dados.tags) ? dados.tags : []
        };
    },

    normalizarCliente(dados = {}) {
        return {
            id: dados.id || dados.clienteId || "",
            nome: dados.nome || dados.clienteNome || "",
            telefone: dados.telefone || dados.clienteTelefone || "",
            email: dados.email || dados.clienteEmail || "",
            documento: dados.documento || dados.cpfCnpj || "",
            endereco: dados.endereco || dados.clienteEndereco || ""
        };
    },

    normalizarObra(dados = {}) {
        return {
            endereco: dados.endereco || dados.enderecoObra || "",
            bairro: dados.bairro || "",
            cidade: dados.cidade || "Porto Seguro",
            referencia: dados.referencia || "",
            observacoes: dados.observacoes || dados.observacoesObra || ""
        };
    },

    normalizarOrcamento(dados = {}) {
        return {
            id: dados.id || dados.orcamentoId || "",
            numero: dados.numero || "",
            status: dados.status || "",
            total: this.numero(dados.total ?? dados.totalFinal),
            pdfUrl: dados.pdfUrl || ""
        };
    },

    normalizarComercial(dados = {}) {
        return {
            responsavel: dados.responsavel || dados.vendedor || "",
            vendedor: dados.vendedor || dados.responsavel || "",
            canal: dados.canal || dados.origem || "",
            probabilidade: this.numero(dados.probabilidade),
            valorEstimado: this.numero(dados.valorEstimado),
            valorFechado: this.numero(dados.valorFechado),
            motivoCancelamento: dados.motivoCancelamento || "",
            proximoContato: dados.proximoContato || "",
            observacoes: dados.observacoesComerciais || dados.observacoes || ""
        };
    },

    normalizarOperacional(dados = {}) {
        return {
            responsavel: dados.responsavel || "",
            status: dados.status || "",
            previsaoProducao: dados.previsaoProducao || "",
            previsaoInstalacao: dados.previsaoInstalacao || "",
            observacoes: dados.observacoes || ""
        };
    },

    normalizarFinanceiro(dados = {}) {
        const valorTotal = this.numero(dados.valorTotal);
        const valorRecebido = this.numero(dados.valorRecebido);

        return {
            status: dados.status || "",
            valorTotal,
            valorRecebido,
            saldo: dados.saldo !== undefined ? this.numero(dados.saldo) : this.arredondar(valorTotal - valorRecebido),
            observacoes: dados.observacoes || ""
        };
    },

    atualizar(projeto = {}, alteracoes = {}, usuario = "Sistema") {
        const anterior = this.normalizar(projeto);
        const atualizado = this.normalizar({
            ...anterior,
            ...alteracoes,
            cliente: {
                ...anterior.cliente,
                ...(alteracoes.cliente || {})
            },
            obra: {
                ...anterior.obra,
                ...(alteracoes.obra || {})
            },
            orcamento: {
                ...anterior.orcamento,
                ...(alteracoes.orcamento || {})
            },
            comercial: {
                ...anterior.comercial,
                ...(alteracoes.comercial || {})
            },
            operacional: {
                ...anterior.operacional,
                ...(alteracoes.operacional || {})
            },
            financeiro: {
                ...anterior.financeiro,
                ...(alteracoes.financeiro || {})
            },
            datas: {
                ...anterior.datas,
                ...(alteracoes.datas || {}),
                atualizacao: this.agoraISO()
            },
            historico: [...anterior.historico],
            arquivos: alteracoes.arquivos || anterior.arquivos,
            fotos: alteracoes.fotos || anterior.fotos,
            atualizadoPor: usuario || anterior.atualizadoPor
        });

        if (alteracoes.status && alteracoes.status !== anterior.status) {
            const comEtapa = {
                ...atualizado,
                etapaAtual: alteracoes.etapaAtual || alteracoes.etapa || this.etapaPorStatus(alteracoes.status),
                etapa: alteracoes.etapaAtual || alteracoes.etapa || this.etapaPorStatus(alteracoes.status)
            };

            return this.adicionarEvento(
                comEtapa,
                "status_alterado",
                `Status alterado para ${this.rotuloStatus(alteracoes.status)}`,
                usuario
            );
        }

        return atualizado;
    },

    registrarContato(projeto = {}, contato = {}, usuario = "Sistema") {
        const descricao = contato.descricao || contato.observacoes || "Contato registrado";
        const atualizado = this.atualizar(projeto, {
            datas: {
                ultimoContato: this.agoraISO(),
                proximoContato: contato.proximoContato || projeto.datas?.proximoContato || ""
            },
            comercial: {
                proximoContato: contato.proximoContato || projeto.comercial?.proximoContato || ""
            }
        }, usuario);

        return this.adicionarEvento(atualizado, contato.tipo || "contato", descricao, usuario, contato);
    },

    vincularOrcamento(projeto = {}, orcamento = {}, usuario = "Sistema") {
        const statusAtual = projeto.status || this.statusPadrao();
        const deveMoverParaOrcamento = statusAtual === this.statusPadrao();
        const atualizado = this.atualizar(projeto, {
            status: deveMoverParaOrcamento ? this.statusOrcamento() : statusAtual,
            orcamento: this.normalizarOrcamento(orcamento),
            comercial: {
                valorEstimado: this.numero(orcamento.total ?? orcamento.totalFinal ?? projeto.comercial?.valorEstimado)
            }
        }, usuario);

        return this.adicionarEvento(atualizado, "orcamento_vinculado", "Orcamento vinculado ao Projeto", usuario, {
            numero: atualizado.orcamento.numero,
            total: atualizado.orcamento.total
        });
    },

    adicionarEvento(projeto, tipo, descricao, usuario = "Sistema", dados = {}) {
        if (typeof adicionarEventoHistorico === "function") {
            return adicionarEventoHistorico(projeto, tipo, descricao, usuario, dados);
        }

        const historico = Array.isArray(projeto.historico) ? [...projeto.historico] : [];
        historico.push(this.criarEvento(tipo, descricao, usuario, dados));

        return {
            ...projeto,
            historico,
            datas: {
                ...(projeto.datas || {}),
                atualizacao: this.agoraISO()
            },
            atualizadoPor: usuario || projeto.atualizadoPor || ""
        };
    },

    criarEvento(tipo, descricao, usuario = "Sistema", dados = {}) {
        if (typeof criarEventoHistorico === "function") {
            return criarEventoHistorico(tipo, descricao, usuario, dados);
        }

        return {
            tipo,
            data: this.agoraISO(),
            usuario,
            descricao,
            dados
        };
    },

    etapaPorStatus(status) {
        if (typeof ProjetoStatus !== "undefined" && ProjetoStatus.etapaPorStatus) {
            return ProjetoStatus.etapaPorStatus(status);
        }

        const mapa = {
            rascunho: "comercial",
            em_orcamento: "comercial",
            enviado: "comercial",
            aprovado: "comercial",
            em_producao: "producao",
            em_instalacao: "instalacao",
            concluido: "finalizado",
            cancelado: "finalizado"
        };

        return mapa[status] || "comercial";
    },

    criarTitulo(dados = {}) {
        const cliente = dados.cliente?.nome || dados.nome || dados.clienteNome || "Cliente";
        const obra = dados.obra?.endereco || dados.enderecoObra || dados.endereco || "";
        return obra ? `${cliente} - ${obra}` : String(cliente);
    },

    rotuloStatus(status) {
        if (typeof ProjetoStatus !== "undefined" && ProjetoStatus.rotulo) {
            return ProjetoStatus.rotulo(status);
        }

        return this.status[status] || status || "";
    },

    rotuloEtapa(etapa) {
        return this.etapas[etapa] || etapa || "";
    },

    statusPadrao() {
        return typeof STATUS_PROJETO !== "undefined" ? STATUS_PROJETO.RASCUNHO : "rascunho";
    },

    statusOrcamento() {
        return typeof STATUS_PROJETO !== "undefined" ? STATUS_PROJETO.EM_ORCAMENTO : "em_orcamento";
    },

    criarId(prefixo = "id") {
        return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    },

    criarNumero() {
        const data = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const sufixo = String(Date.now()).slice(-4);
        return `PRJ-${data}-${sufixo}`;
    },

    criarCodigo() {
        return this.criarNumero();
    },

    agoraISO() {
        return new Date().toISOString();
    },

    numero(valor) {
        if (typeof Util !== "undefined" && Util.numero) return Util.numero(valor);
        return Number(valor || 0) || 0;
    },

    arredondar(valor, casas = 2) {
        if (typeof Util !== "undefined" && Util.arredondar) return Util.arredondar(valor, casas);
        return Number(Number(valor || 0).toFixed(casas));
    }
};

function criarProjetoBase(dados = {}) {
    return ProjetoModel.criar(dados);
}
