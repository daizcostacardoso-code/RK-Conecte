const DashboardComercialController = {
    rootId: "dashboardComercialRoot",
    estado: null,
    sessao: null,

    async carregar() {
        const [projetos, orcamentosEmitidos, movimentosCaixa] = await Promise.all([
            this.obterProjetos(),
            this.obterOrcamentosEmitidos(),
            this.obterMovimentosCaixa()
        ]);
        const orcamentos = this.montarOrcamentos(orcamentosEmitidos);
        const resumoOrcamentos = this.montarResumoOrcamentos(orcamentos);
        const resumoObras = this.montarResumoObras(projetos);
        const resumoCaixa = this.montarResumoCaixa(movimentosCaixa);

        this.estado = {
            sessao: this.sessao,
            carregadoEm: new Date().toISOString(),
            kpis: {
                totalOrcamentos: resumoOrcamentos.total,
                emitidos: resumoOrcamentos.emitidos,
                enviados: resumoOrcamentos.enviados,
                aprovados: resumoOrcamentos.aprovados,
                recusados: resumoOrcamentos.recusados,
                valorAprovado: resumoOrcamentos.valorAprovado,
                valorNegociacao: resumoOrcamentos.valorNegociacao,
                taxaAprovacao: resumoOrcamentos.taxaAprovacao,
                obrasAtivas: resumoObras.ativas,
                saldoCaixa: resumoCaixa.saldo
            },
            valorNegociacao: this.montarValorNegociacao(orcamentos),
            resumoOrcamentos,
            resumoObras,
            resumoCaixa,
            orcamentos: this.ordenarPorData(orcamentos).slice(0, 8),
            atividades: this.montarAtividades(orcamentos),
            acoes: this.montarAcoes(orcamentos, projetos)
        };
        return this.estado;
    },

    async atualizar() {
        await this.carregar();
        return this.renderizar();
    },

    renderizar() {
        return typeof DashboardComercialUI !== "undefined" && typeof DashboardComercialUI.renderizar === "function"
            ? DashboardComercialUI.renderizar(this.estado || this.criarEstadoVazio(), this)
            : false;
    },

    async iniciar() {
        this.sessao = await this.aguardarSessao();
        if (!this.sessao) return false;
        await this.carregar();
        return this.renderizar();
    },

    async aguardarSessao() {
        if (typeof window === "undefined" || !window.RKAuth) return null;
        if (typeof window.RKAuth.aguardarAutenticacao === "function") {
            return window.RKAuth.aguardarAutenticacao();
        }
        return typeof window.RKAuth.obterSessao === "function"
            ? window.RKAuth.obterSessao()
            : null;
    },

    async obterOrcamentosEmitidos() {
        if (typeof DocumentPdfRepository === "undefined" || typeof DocumentPdfRepository.buscar !== "function") return [];
        try {
            const resultado = await DocumentPdfRepository.buscar({});
            return resultado?.sucesso && Array.isArray(resultado.registros) ? resultado.registros : [];
        } catch (erro) {
            console.warn("Dashboard Comercial não conseguiu consultar os orçamentos no Firestore.", erro);
            return [];
        }
    },

    async obterProjetos() {
        if (typeof ProjetoService === "undefined" || typeof ProjetoService.listar !== "function") return [];
        try {
            const projetos = await ProjetoService.listar();
            return Array.isArray(projetos) ? projetos : [];
        } catch (erro) {
            console.warn("Dashboard Comercial não conseguiu consultar ProjetoService.", erro);
            return [];
        }
    },

    async obterMovimentosCaixa() {
        if (typeof CaixaService === "undefined" || typeof CaixaService.listar !== "function") return [];
        try {
            const movimentos = await CaixaService.listar();
            return Array.isArray(movimentos) ? movimentos : [];
        } catch (erro) {
            console.warn("Dashboard Comercial não conseguiu consultar o caixa.", erro);
            return [];
        }
    },

    montarOrcamentos(orcamentosEmitidos = []) {
        const unicos = new Map();
        orcamentosEmitidos.forEach(item => {
            const orcamento = this.normalizarOrcamento(item.registro || item.dados || item, "Sistema");
            const chave = orcamento.numero || orcamento.id;
            if (chave) {
                const anterior = unicos.get(chave);
                const maisRecente = !anterior || String(orcamento.atualizadoEm || "") >= String(anterior.atualizadoEm || "");
                if (maisRecente) unicos.set(chave, orcamento);
            }
        });
        return [...unicos.values()];
    },

    normalizarOrcamento(orcamento = {}, origem = "") {
        const registro = typeof OrcamentoAprovacaoModel !== "undefined"
            ? OrcamentoAprovacaoModel.normalizarRegistro(orcamento)
            : { ...orcamento, status: String(orcamento.status || "emitido").toLowerCase() };
        const documento = registro.documento || {};
        const dados = documento.dados || {};
        const cliente = registro.cliente || dados.cliente || {};
        const projeto = registro.projeto || dados.projeto || {};
        const total = typeof OrcamentoAprovacaoModel !== "undefined"
            ? OrcamentoAprovacaoModel.obterTotal(registro)
            : Number(registro.totais?.totalGeral || dados.totais?.totalGeral || 0);
        return {
            ...registro,
            id: String(registro.id || registro.orcamento_id || registro.numero || projeto.numero || projeto.id || "").trim(),
            numero: String(registro.numero || registro.numero_orcamento || projeto.numero || projeto.id || registro.id || "").trim(),
            cliente: cliente.nome || registro.clienteNome || registro.nomeCliente || "",
            total,
            vinculos: registro.vinculos || {},
            solicitacaoId: registro.solicitacaoId || registro.vinculos?.solicitacaoId || "",
            clienteId: registro.clienteId || registro.vinculos?.clienteId || cliente.id || "",
            projetoId: registro.projetoId || registro.vinculos?.projetoId || projeto.id || "",
            atualizadoEm: registro.atualizadoEmISO || registro.atualizadoEm || registro.criadoEmISO || registro.dataEmissao || "",
            origem
        };
    },

    montarResumoOrcamentos(orcamentos = []) {
        const porStatus = status => orcamentos.filter(item => item.status === status);
        const aprovados = porStatus("aprovado");
        const recusados = porStatus("recusado");
        const emNegociacao = orcamentos.filter(item => ["emitido", "enviado"].includes(item.status));
        const valorAprovado = aprovados.reduce((total, item) => {
            const valorRegistrado = Number(item.aprovacao?.valorAprovadoCentavos || 0) / 100;
            return total + (valorRegistrado > 0 ? valorRegistrado : this.numero(item.total));
        }, 0);
        const valorNegociacao = emNegociacao.reduce((total, item) => total + Math.max(0, this.numero(item.total)), 0);
        const decisoes = aprovados.length + recusados.length;
        const referencia = this.referenciaMes(new Date());
        const doMes = orcamentos.filter(item => this.pertenceAoMes(item.atualizadoEm, referencia));
        const comValor = orcamentos.filter(item => this.numero(item.total) > 0);

        return {
            total: orcamentos.length,
            rascunhos: porStatus("rascunho").length,
            emitidos: porStatus("emitido").length,
            enviados: porStatus("enviado").length,
            aprovados: aprovados.length,
            recusados: recusados.length,
            expirados: porStatus("expirado").length,
            cancelados: porStatus("cancelado").length,
            valorAprovado,
            valorNegociacao,
            taxaAprovacao: decisoes ? Math.round((aprovados.length / decisoes) * 100) : 0,
            valorTotal: comValor.reduce((total, item) => total + this.numero(item.total), 0),
            ticketMedio: comValor.length ? comValor.reduce((total, item) => total + this.numero(item.total), 0) / comValor.length : 0,
            emAberto: emNegociacao.length,
            comValor: comValor.length,
            geradosMes: doMes.length,
            valorMes: doMes.reduce((total, item) => total + Math.max(0, this.numero(item.total)), 0),
            referencia
        };
    },

    montarValorNegociacao(orcamentos = []) {
        const itens = orcamentos
            .filter(item => ["emitido", "enviado"].includes(item.status) && this.numero(item.total) > 0)
            .map(item => ({ id: item.id || item.numero, titulo: item.numero || item.cliente || "Orçamento", valor: this.numero(item.total), origem: item.origem }));
        return { total: itens.reduce((total, item) => total + item.valor, 0), itens: itens.slice(0, 6) };
    },

    montarAtividades(orcamentos = []) {
        const atividades = orcamentos.flatMap(orcamento => (orcamento.historicoStatus || []).map(item => ({
            tipo: this.rotuloStatus(item.statusAtual),
            descricao: `${orcamento.numero || orcamento.id || "Orçamento"}: ${this.rotuloAcao(item.acao)}`,
            data: item.realizadoEm || orcamento.atualizadoEm
        })));
        return this.ordenarPorData(atividades, "data").slice(0, 8);
    },

    montarAcoes(orcamentos = [], projetos = []) {
        const enviados = orcamentos.filter(item => item.status === "enviado").length;
        const emitidos = orcamentos.filter(item => item.status === "emitido").length;
        const recusados = orcamentos.filter(item => item.status === "recusado").length;
        const acoes = [];
        if (enviados) acoes.push({ titulo: `${enviados} orçamento(s) aguardando decisão`, status: "enviado" });
        if (emitidos) acoes.push({ titulo: `${emitidos} orçamento(s) prontos para envio`, status: "emitido" });
        if (recusados) acoes.push({ titulo: `${recusados} orçamento(s) recusados para revisão`, status: "recusado" });
        const operacionais = projetos.filter(item => !item.padrao && !item.generico && item.ativo !== false);
        const aguardandoMedicao = operacionais.filter(item => item.status === "aprovado" && !item.operacional?.medicaoId).length;
        const medicaoEmAndamento = operacionais.filter(item => ["medicao_em_andamento", "medicao_concluida", "ordem_em_preparacao"].includes(item.operacional?.status)).length;
        const emProducao = operacionais.filter(item => item.status === "em_producao").length;
        const emInstalacao = operacionais.filter(item => item.status === "em_instalacao").length;
        if (aguardandoMedicao) acoes.push({ titulo: `${aguardandoMedicao} obra(s) aguardando medição`, status: "medicao" });
        if (medicaoEmAndamento) acoes.push({ titulo: `${medicaoEmAndamento} medição(ões) aguardando ordem de serviço`, status: "medicao_concluida" });
        if (emProducao) acoes.push({ titulo: `${emProducao} obra(s) em produção`, status: "em_producao" });
        if (emInstalacao) acoes.push({ titulo: `${emInstalacao} obra(s) em instalação`, status: "em_instalacao" });
        return acoes.length ? acoes : [{ titulo: "Sem pendências comerciais ou operacionais", status: "ok" }];
    },

    montarResumoObras(projetos = []) {
        const obras = projetos.filter(projeto => !projeto.padrao && !projeto.generico && projeto.ativo !== false);
        const porStatus = status => obras.filter(projeto => String(projeto.status || "").toLowerCase() === status);
        const aprovadas = porStatus("aprovado").length;
        const emProducao = porStatus("em_producao").length;
        const emInstalacao = porStatus("em_instalacao").length;
        const concluidas = obras.filter(projeto => ["finalizado", "concluido"].includes(String(projeto.status || "").toLowerCase())).length;
        const valores = obras.map(projeto => this.numero(projeto.financeiro?.valorTotal || projeto.orcamento?.total)).filter(valor => valor > 0);
        return {
            total: obras.length,
            ativas: aprovadas + emProducao + emInstalacao,
            aprovadas,
            emProducao,
            emInstalacao,
            concluidas,
            valorMedio: valores.length ? valores.reduce((total, valor) => total + valor, 0) / valores.length : 0,
            recentes: this.ordenarPorData(obras.map(projeto => ({ titulo: projeto.titulo || projeto.nome || projeto.numero || "Obra", cliente: projeto.cliente?.nome || "", status: projeto.status || "rascunho", atualizadoEm: projeto.datas?.atualizacao || projeto.datas?.criacao || "" }))).slice(0, 3)
        };
    },

    montarResumoCaixa(movimentos = []) {
        const confirmados = movimentos.filter(item => !item.status || String(item.status).toLowerCase() === "confirmado");
        const entradas = confirmados.filter(item => item.tipo === "entrada").reduce((total, item) => total + this.numero(item.valor), 0);
        const saidas = confirmados.filter(item => item.tipo === "saida").reduce((total, item) => total + this.numero(item.valor), 0);
        const pendentes = movimentos.filter(item => String(item.status || "").toLowerCase() === "pendente");
        return { saldo: entradas - saidas, entradas, saidas, resultadoMes: entradas - saidas, totalConfirmados: confirmados.length, pendentes: pendentes.length, valorPendente: pendentes.reduce((total, item) => total + this.numero(item.valor), 0), movimentos: this.ordenarPorData(confirmados, "data").slice(0, 3), referencia: this.referenciaMes(new Date()) };
    },

    rotuloStatus(status = "") { return { rascunho: "Rascunho", emitido: "Emitido", enviado: "Enviado", aprovado: "Aprovado", recusado: "Recusado", expirado: "Expirado", cancelado: "Cancelado" }[String(status).toLowerCase()] || String(status || "Atualização"); },
    rotuloAcao(acao = "") { return { orcamento_normalizado: "registro compatibilizado", orcamento_emitido: "orçamento emitido", orcamento_enviado: "orçamento enviado", orcamento_aprovado: "orçamento aprovado", orcamento_recusado: "orçamento recusado", orcamento_cancelado: "orçamento cancelado", nova_versao_emitida: "nova versão emitida" }[acao] || String(acao || "atualização").replace(/_/g, " "); },
    numero(valor) { const numero = Number(valor || 0); return Number.isFinite(numero) ? numero : 0; },
    calcularTaxaConversao(total = 0, aprovados = 0) { return total ? Math.min(100, Math.round((aprovados / total) * 100)) : 0; },
    ordenarPorData(lista = [], campo = "atualizadoEm") { return [...lista].sort((a, b) => new Date(b[campo] || 0).getTime() - new Date(a[campo] || 0).getTime()); },
    referenciaMes(data = new Date()) { return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`; },
    pertenceAoMes(valor, referencia) { return String(valor || "").startsWith(referencia); },
    criarEstadoVazio() { return { carregadoEm: "", kpis: {}, valorNegociacao: { total: 0, itens: [] }, resumoOrcamentos: { total: 0 }, resumoObras: {}, resumoCaixa: {}, orcamentos: [], atividades: [], acoes: [] }; }
};

document.addEventListener("DOMContentLoaded", () => { void DashboardComercialController.iniciar(); });
