const DashboardComercialController = {
    rootId: "dashboardComercialRoot",
    estado: null,

    async carregar() {
        const appState = this.obterAppState();
        const projetos = await this.obterProjetos();
        const documento = this.normalizarDocumento(appState.documentoAtual);
        const comercial = this.obterComercial(documento);
        const conversao = this.obterConfiguracao(appState, "conversao");
        const orcamentos = this.montarOrcamentos(appState, projetos, documento);
        const documentosAprovados = this.montarDocumentosAprovados(documento, comercial, projetos, conversao);
        const projetosConvertidos = this.montarProjetosConvertidos(projetos, conversao);
        const valorNegociacao = this.montarValorNegociacao(orcamentos, projetos);
        const atividades = this.montarAtividades(appState, comercial, conversao);
        const acoes = this.montarAcoes(documento, comercial, conversao);

        this.estado = {
            carregadoEm: new Date().toISOString(),
            kpis: {
                totalOrcamentos: orcamentos.length,
                totalDocumentosAprovados: documentosAprovados.length,
                totalProjetosConvertidos: projetosConvertidos.length,
                taxaConversao: this.calcularTaxaConversao(documentosAprovados.length, projetosConvertidos.length)
            },
            resumo: {
                documento,
                comercial,
                conversao,
                documentoValido: this.validarDocumento(documento)
            },
            valorNegociacao,
            orcamentos: this.ordenarPorData(orcamentos).slice(0, 8),
            atividades,
            acoes
        };

        return this.estado;
    },

    async atualizar() {
        await this.carregar();
        return this.renderizar();
    },

    renderizar() {
        if (typeof DashboardComercialUI !== "undefined" && typeof DashboardComercialUI.renderizar === "function") {
            return DashboardComercialUI.renderizar(this.estado || this.criarEstadoVazio(), this);
        }

        return false;
    },

    async iniciar() {
        await this.carregar();
        return this.renderizar();
    },

    obterAppState() {
        if (typeof AppStateService !== "undefined" && typeof AppStateService.getState === "function") {
            return AppStateService.getState() || {};
        }

        if (typeof AppState !== "undefined" && typeof AppState.getState === "function") {
            return AppState.getState() || {};
        }

        return {};
    },

    async obterProjetos() {
        if (typeof ProjetoService === "undefined" || typeof ProjetoService.listar !== "function") {
            return [];
        }

        try {
            const projetos = await ProjetoService.listar();
            return Array.isArray(projetos) ? projetos : [];
        } catch (erro) {
            console.warn("Dashboard Comercial nao conseguiu consultar ProjetoService.", erro);
            return [];
        }
    },

    obterComercial(documento = null) {
        if (!documento || typeof ComercialService === "undefined" || typeof ComercialService.obterRegistroAtual !== "function") {
            return null;
        }

        try {
            return ComercialService.obterRegistroAtual(documento);
        } catch (erro) {
            return null;
        }
    },

    obterConfiguracao(appState = {}, chave = "") {
        const configuracoes = appState.configuracoes || {};
        return configuracoes[chave] || {};
    },

    montarOrcamentos(appState = {}, projetos = [], documento = null) {
        const itens = [];

        if (appState.orcamentoAtual) {
            itens.push(this.normalizarOrcamento(appState.orcamentoAtual, "AppState"));
        }

        if (documento) {
            itens.push(this.normalizarOrcamento({
                id: documento.id || documento.documentoId || documento.dados?.projeto?.id,
                numero: documento.dados?.projeto?.numero || documento.dados?.projeto?.id,
                cliente: documento.dados?.cliente,
                total: documento.dados?.totais?.totalGeral,
                status: documento.dados?.resumoFinanceiro?.status || documento.metadados?.status,
                atualizadoEm: documento.metadados?.geradoEm
            }, "Documento Comercial"));
        }

        projetos.forEach(projeto => {
            if (projeto.orcamento && (projeto.orcamento.id || projeto.orcamento.numero || projeto.orcamento.total)) {
                itens.push(this.normalizarOrcamento({
                    ...projeto.orcamento,
                    cliente: projeto.cliente,
                    status: projeto.orcamento.status || projeto.status,
                    atualizadoEm: projeto.datas?.atualizacao
                }, "ProjetoService"));
            }
        });

        return this.unicosPorId(itens.filter(item => item.id || item.numero || item.total));
    },

    montarDocumentosAprovados(documento = null, comercial = null, projetos = [], conversao = {}) {
        const documentos = [];

        if (documento && comercial?.statusComercial === "APROVADO") {
            documentos.push(this.normalizarDocumentoAprovado(documento, comercial, "AppState"));
        }

        projetos.forEach(projeto => {
            if (projeto.documentoOrigem || projeto.conversao?.documentoOrigem) {
                const documentoOrigem = projeto.documentoOrigem || projeto.conversao.documentoOrigem;
                documentos.push({
                    id: documentoOrigem.id || documentoOrigem.numero || projeto.id,
                    titulo: documentoOrigem.projetoNome || projeto.titulo || projeto.numero,
                    cliente: documentoOrigem.clienteNome || projeto.cliente?.nome || "",
                    aprovadoEm: projeto.datas?.aprovacao || projeto.conversao?.dataConversao || "",
                    origem: "Projeto convertido"
                });
            }
        });

        if (conversao.documentoOrigem) {
            documentos.push({
                id: conversao.documentoOrigem.id || conversao.documentoOrigem.numero,
                titulo: conversao.documentoOrigem.projetoNome || conversao.documentoOrigem.numero || "",
                cliente: conversao.documentoOrigem.clienteNome || "",
                aprovadoEm: conversao.dataConversao || "",
                origem: "Conversao"
            });
        }

        return this.unicosPorId(documentos);
    },

    montarProjetosConvertidos(projetos = [], conversao = {}) {
        const convertidos = projetos
            .filter(projeto => projeto.documentoOrigem || projeto.conversao?.documentoOrigem || this.listaContem(projeto.tags, "convertido"))
            .map(projeto => ({
                id: projeto.id || projeto.numero,
                numero: projeto.numero || projeto.codigo || projeto.id,
                cliente: projeto.cliente?.nome || "",
                status: projeto.status || "",
                dataConversao: projeto.conversao?.dataConversao || projeto.datas?.criacao || projeto.datas?.atualizacao || "",
                origem: "ProjetoService"
            }));

        if (conversao.projetoAtual) {
            convertidos.push({
                id: conversao.projetoAtual.id || conversao.projetoAtual.numero,
                numero: conversao.projetoAtual.numero || conversao.projetoAtual.codigo || conversao.projetoAtual.id,
                cliente: conversao.projetoAtual.cliente?.nome || "",
                status: conversao.projetoAtual.status || "",
                dataConversao: conversao.dataConversao || "",
                origem: "AppState"
            });
        }

        return this.unicosPorId(convertidos);
    },

    montarValorNegociacao(orcamentos = [], projetos = []) {
        const valoresOrcamento = orcamentos
            .filter(item => this.statusEmNegociacao(item.status))
            .map(item => ({
                id: item.id || item.numero,
                origem: item.origem,
                titulo: item.numero || item.cliente || "Orcamento",
                valor: item.total || 0
            }));
        const valoresProjeto = projetos
            .filter(projeto => this.statusEmNegociacao(projeto.status))
            .map(projeto => ({
                id: projeto.id || projeto.numero,
                origem: "ProjetoService",
                titulo: projeto.numero || projeto.codigo || projeto.titulo || "Projeto",
                valor: this.numero(projeto.comercial?.valorEstimado || projeto.comercial?.valorFechado || projeto.financeiro?.valorTotal)
            }));
        const itens = this.unicosPorId([...valoresOrcamento, ...valoresProjeto].filter(item => item.valor > 0));

        return {
            total: itens.reduce((total, item) => total + item.valor, 0),
            itens: itens.slice(0, 6)
        };
    },

    montarAtividades(appState = {}, comercial = null, conversao = {}) {
        const atividades = [];

        if (comercial?.ultimaAcaoComercial) {
            atividades.push({
                tipo: "Comercial",
                descricao: comercial.ultimaAcaoComercial,
                data: comercial.atualizadoEm || comercial.dataAprovacao || ""
            });
        }

        if (conversao.ultimaAcaoConversao) {
            atividades.push({
                tipo: "Conversao",
                descricao: conversao.ultimaAcaoConversao,
                data: conversao.dataConversao || ""
            });
        }

        if (appState.documentoAtual?.metadados?.geradoEm) {
            atividades.push({
                tipo: "Documento",
                descricao: "Documento Comercial disponivel no AppState.",
                data: appState.documentoAtual.metadados.geradoEm
            });
        }

        if (typeof WorkflowEvents !== "undefined" && typeof WorkflowEvents.listarEventos === "function") {
            WorkflowEvents.listarEventos().slice(-5).forEach(evento => {
                atividades.push({
                    tipo: evento.tipo || "Workflow",
                    descricao: evento.descricao || "",
                    data: evento.data || ""
                });
            });
        }

        return this.ordenarPorData(atividades, "data").slice(0, 8);
    },

    montarAcoes(documento = null, comercial = null, conversao = {}) {
        const acoes = [];
        const statusComercial = comercial?.statusComercial || "RASCUNHO";

        if (!documento) {
            acoes.push({ titulo: "Gerar Documento Comercial", status: "pendente" });
        }

        if (documento && statusComercial !== "APROVADO") {
            acoes.push({ titulo: "Concluir aprovacao comercial", status: statusComercial });
        }

        if (documento && statusComercial === "APROVADO" && !conversao.convertido) {
            acoes.push({ titulo: "Converter Documento em Projeto", status: "pronto" });
        }

        if (conversao.convertido) {
            acoes.push({ titulo: "Preparar entrada em Producao", status: "proximo" });
        }

        return acoes.length ? acoes : [{ titulo: "Sem proximas acoes comerciais", status: "ok" }];
    },

    normalizarOrcamento(orcamento = {}, origem = "") {
        const cliente = orcamento.cliente || {};

        return {
            id: String(orcamento.id || orcamento.numero || orcamento.codigo || origem || "").trim(),
            numero: String(orcamento.numero || orcamento.codigo || orcamento.id || "").trim(),
            cliente: cliente.nome || orcamento.clienteNome || orcamento.nomeCliente || "",
            status: String(orcamento.status || "").trim(),
            total: this.numero(orcamento.total ?? orcamento.totalGeral ?? orcamento.valorTotal ?? orcamento.totalFinal),
            atualizadoEm: orcamento.atualizadoEm || orcamento.criadoEm || orcamento.data || "",
            origem
        };
    },

    normalizarDocumentoAprovado(documento = {}, comercial = {}, origem = "") {
        const dados = documento.dados || {};

        return {
            id: documento.id || documento.documentoId || dados.projeto?.numero || dados.projeto?.id || "documento-atual",
            titulo: dados.projeto?.nome || dados.projeto?.numero || dados.projeto?.id || "Documento Comercial",
            cliente: dados.cliente?.nome || "",
            aprovadoEm: comercial.dataAprovacao || "",
            origem
        };
    },

    validarDocumento(documento = null) {
        if (!documento || typeof DocumentService === "undefined" || typeof DocumentService.validarDocumento !== "function") {
            return {
                valido: false,
                erros: documento ? [] : ["Nenhum Documento Comercial carregado."]
            };
        }

        return DocumentService.validarDocumento(documento);
    },

    normalizarDocumento(documento = null) {
        if (!documento) {
            return null;
        }

        if (typeof ComercialService !== "undefined" && typeof ComercialService.normalizarDocumento === "function") {
            return ComercialService.normalizarDocumento(documento);
        }

        return documento.documento || documento;
    },

    calcularTaxaConversao(totalAprovados = 0, totalConvertidos = 0) {
        if (!totalAprovados) {
            return 0;
        }

        return Math.round((totalConvertidos / totalAprovados) * 100);
    },

    ordenarPorData(lista = [], campo = "atualizadoEm") {
        return [...lista].sort((a, b) => {
            const dataA = new Date(a[campo] || 0).getTime();
            const dataB = new Date(b[campo] || 0).getTime();
            return (Number.isFinite(dataB) ? dataB : 0) - (Number.isFinite(dataA) ? dataA : 0);
        });
    },

    unicosPorId(lista = []) {
        const vistos = new Set();

        return lista.filter(item => {
            const id = String(item.id || item.numero || item.titulo || "").trim();

            if (!id || vistos.has(id)) {
                return false;
            }

            vistos.add(id);
            return true;
        });
    },

    listaContem(lista = [], valor = "") {
        return Array.isArray(lista) && lista.includes(valor);
    },

    statusEmNegociacao(status = "") {
        const valor = String(status || "").trim().toLowerCase();

        if (!valor) {
            return true;
        }

        return !["aprovado", "convertido", "concluido", "cancelado", "reprovado"].includes(valor);
    },

    numero(valor) {
        const numero = Number(valor);
        return Number.isFinite(numero) ? numero : 0;
    },

    criarEstadoVazio() {
        return {
            carregadoEm: "",
            kpis: {
                totalOrcamentos: 0,
                totalDocumentosAprovados: 0,
                totalProjetosConvertidos: 0,
                taxaConversao: 0
            },
            resumo: {},
            valorNegociacao: {
                total: 0,
                itens: []
            },
            orcamentos: [],
            atividades: [],
            acoes: []
        };
    }
};

document.addEventListener("DOMContentLoaded", () => {
    DashboardComercialController.iniciar();
});
