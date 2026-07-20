const DashboardComercialController = {
    rootId: "dashboardComercialRoot",
    estado: null,

    async carregar() {
        const appState = this.obterAppState();
        const [projetos, orcamentosEmitidos, movimentosCaixa] = await Promise.all([
            this.obterProjetos(),
            this.obterOrcamentosEmitidos(),
            this.obterMovimentosCaixa()
        ]);
        const documento = this.normalizarDocumento(appState.documentoAtual);
        const comercial = this.obterComercial(documento);
        const conversao = this.obterConfiguracao(appState, "conversao");
        const orcamentos = this.montarOrcamentos(orcamentosEmitidos);
        const documentosAprovados = this.montarDocumentosAprovados(documento, comercial, projetos, conversao);
        const projetosConvertidos = this.montarProjetosConvertidos(projetos, conversao);
        const valorNegociacao = this.montarValorNegociacao(orcamentos);
        const atividades = this.montarAtividades(appState, comercial, conversao);
        const acoes = this.montarAcoes(documento, comercial, conversao);
        const resumoOrcamentos = this.montarResumoOrcamentos(orcamentos);
        const resumoObras = this.montarResumoObras(projetos);
        const resumoCaixa = this.montarResumoCaixa(movimentosCaixa);

        this.estado = {
            carregadoEm: new Date().toISOString(),
            kpis: {
                totalOrcamentos: resumoOrcamentos.total,
                totalDocumentosAprovados: documentosAprovados.length,
                totalProjetosConvertidos: projetosConvertidos.length,
                taxaConversao: this.calcularTaxaConversao(resumoOrcamentos.total, resumoOrcamentos.aprovados),
                ticketMedio: resumoOrcamentos.ticketMedio,
                obrasAtivas: resumoObras.ativas,
                saldoCaixa: resumoCaixa.saldo
            },
            resumo: {
                documento,
                comercial,
                conversao,
                documentoValido: this.validarDocumento(documento)
            },
            valorNegociacao,
            resumoOrcamentos,
            resumoObras,
            resumoCaixa,
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

    async obterOrcamentosEmitidos() {
        const locais = typeof Storage !== "undefined" && typeof Config !== "undefined"
            ? Storage.carregar(Config.storage.historicoOrcamentos, []) || []
            : [];

        if (typeof DocumentPdfRepository !== "undefined" && typeof DocumentPdfRepository.buscar === "function") {
            try {
                const resultado = await DocumentPdfRepository.buscar({});
                if (resultado?.sucesso) {
                    return Array.isArray(resultado.registros) ? resultado.registros : [];
                }
            } catch (erro) {
                console.warn("Dashboard nao conseguiu consultar o mesmo repositorio da tela Arquivos.", erro);
            }
        }

        if (typeof RKFirestoreStore === "undefined" || typeof RKFirestoreStore.fetch !== "function") {
            return Array.isArray(locais) ? locais : [];
        }

        try {
            const resposta = await RKFirestoreStore.fetch("/orcamentos");
            const remoto = await resposta.json();
            const registros = Array.isArray(remoto) ? remoto : (Array.isArray(remoto?.dados) ? remoto.dados : []);
            return registros;
        } catch (erro) {
            console.warn("Dashboard nao conseguiu consultar os orcamentos emitidos.", erro);
            return Array.isArray(locais) ? locais : [];
        }
    },

    async obterMovimentosCaixa() {
        if (typeof CaixaService === "undefined" || typeof CaixaService.listar !== "function") {
            return [];
        }

        try {
            const movimentos = await CaixaService.listar();
            return Array.isArray(movimentos) ? movimentos : [];
        } catch (erro) {
            console.warn("Dashboard nao conseguiu consultar o caixa.", erro);
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

    montarOrcamentos(orcamentosEmitidos = []) {
        const itens = orcamentosEmitidos.map(orcamento => {
            const normalizado = this.normalizarOrcamento(
                orcamento.registro || orcamento.dados || orcamento,
                "Arquivo emitido"
            );
            return {
                ...normalizado,
                status: normalizado.status || "finalizado"
            };
        });

        return this.consolidarOrcamentos(itens.filter(item => item.id || item.numero || item.total));
    },

    montarResumoOrcamentos(orcamentos = []) {
        const validos = orcamentos.filter(item => !this.statusDescartado(item.status));
        const comValor = validos.filter(item => this.numero(item.total) > 0);
        const valorTotal = comValor.reduce((total, item) => total + this.numero(item.total), 0);
        const aprovados = orcamentos.filter(item => this.statusAprovado(item.status)).length;
        const referencia = this.referenciaMes(new Date());
        const doMes = orcamentos.filter(item => this.pertenceAoMes(item.atualizadoEm, referencia));
        const valorMes = doMes
            .filter(item => !this.statusDescartado(item.status))
            .reduce((total, item) => total + Math.max(0, this.numero(item.total)), 0);

        return {
            total: orcamentos.length,
            valorTotal,
            ticketMedio: comValor.length ? valorTotal / comValor.length : 0,
            aprovados,
            taxaConversao: this.calcularTaxaConversao(orcamentos.length, aprovados),
            emAberto: orcamentos.filter(item => this.statusEmNegociacao(item.status)).length,
            comValor: comValor.length,
            geradosMes: doMes.length,
            valorMes,
            referencia
        };
    },

    montarResumoObras(projetos = []) {
        const obras = projetos
            .filter(projeto => !projeto.padrao && !projeto.generico && projeto.ativo !== false)
            .map(projeto => ({ ...projeto, statusObra: this.obterStatusObra(projeto) }))
            .filter(projeto => ["aprovado", "em_producao", "em_instalacao", "finalizado", "concluido"].includes(projeto.statusObra));
        const aprovadas = obras.filter(projeto => projeto.statusObra === "aprovado").length;
        const emProducao = obras.filter(projeto => projeto.statusObra === "em_producao").length;
        const emInstalacao = obras.filter(projeto => projeto.statusObra === "em_instalacao").length;
        const concluidas = obras.filter(projeto => ["finalizado", "concluido"].includes(projeto.statusObra)).length;
        const ativas = aprovadas + emProducao + emInstalacao;
        const valores = obras.map(projeto => this.numero(
            projeto.financeiro?.valorTotal || projeto.comercial?.valorFechado ||
            projeto.comercial?.valorEstimado || projeto.orcamento?.total
        )).filter(valor => valor > 0);

        return {
            total: obras.length,
            ativas,
            aprovadas,
            emProducao,
            emInstalacao,
            concluidas,
            valorMedio: valores.length ? valores.reduce((total, valor) => total + valor, 0) / valores.length : 0,
            recentes: this.ordenarPorData(obras.map(projeto => ({
                id: projeto.id,
                titulo: projeto.titulo || projeto.nome || projeto.numero || "Obra",
                cliente: projeto.cliente?.nome || projeto.clienteNome || "",
                status: projeto.statusObra,
                atualizadoEm: projeto.datas?.atualizacao || projeto.atualizadoEm || ""
            }))).slice(0, 5)
        };
    },

    montarResumoCaixa(movimentos = []) {
        const confirmados = movimentos.filter(item => {
            const status = String(item.status || "confirmado").trim().toLowerCase();
            return !status || status === "confirmado";
        });
        const pendentes = movimentos.filter(item => String(item.status || "").trim().toLowerCase() === "pendente");
        const hoje = new Date();
        const referencia = this.referenciaMes(hoje);
        const referenciaAnterior = this.referenciaMes(hoje, -1);
        const doMes = confirmados.filter(item => String(item.mesReferencia || item.mes_referencia || item.data || "").startsWith(referencia));
        const mesAnterior = confirmados.filter(item => String(item.mesReferencia || item.mes_referencia || item.data || "").startsWith(referenciaAnterior));
        const somar = (lista, tipo) => lista
            .filter(item => String(item.tipo || "").toLowerCase() === tipo)
            .reduce((total, item) => total + Math.max(0, this.numero(item.valor)), 0);
        const entradas = somar(doMes, "entrada");
        const saidas = somar(doMes, "saida");
        const entradasTotal = somar(confirmados, "entrada");
        const saidasTotal = somar(confirmados, "saida");
        const resultadoAnterior = somar(mesAnterior, "entrada") - somar(mesAnterior, "saida");

        return {
            saldo: entradasTotal - saidasTotal,
            entradas,
            saidas,
            resultadoMes: entradas - saidas,
            resultadoAnterior,
            referencia,
            pendentes: pendentes.length,
            valorPendente: pendentes.reduce((total, item) => total + Math.max(0, this.numero(item.valor)), 0),
            totalConfirmados: confirmados.length,
            movimentos: this.ordenarPorData(confirmados.map(item => ({
                ...item,
                atualizadoEm: item.data || item.atualizadoEm || item.criadoEm || ""
            }))).slice(0, 5)
        };
    },

    consolidarOrcamentos(lista = []) {
        const consolidados = new Map();

        lista.forEach(item => {
            const chave = this.chaveCanonica(item.numero || item.id);
            if (!chave) return;
            const anterior = consolidados.get(chave);
            if (!anterior) {
                consolidados.set(chave, item);
                return;
            }

            const dataAnterior = this.timestamp(anterior.atualizadoEm);
            const dataAtual = this.timestamp(item.atualizadoEm);
            const principal = dataAtual >= dataAnterior ? item : anterior;
            const complemento = principal === item ? anterior : item;
            consolidados.set(chave, {
                ...complemento,
                ...principal,
                id: principal.id || complemento.id,
                numero: principal.numero || complemento.numero,
                cliente: principal.cliente || complemento.cliente,
                status: principal.status || complemento.status,
                total: this.numero(principal.total) > 0 ? principal.total : complemento.total,
                atualizadoEm: principal.atualizadoEm || complemento.atualizadoEm,
                origem: principal.origem || complemento.origem
            });
        });

        return [...consolidados.values()];
    },

    obterStatusObra(projeto = {}) {
        const status = String(projeto.status || "").trim().toLowerCase();
        const convertido = Boolean(projeto.documentoOrigem || projeto.conversao?.documentoOrigem || this.listaContem(projeto.tags, "convertido"));
        if (convertido && ["", "rascunho", "em_orcamento", "enviado"].includes(status)) return "aprovado";
        return status;
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

    montarValorNegociacao(orcamentos = []) {
        const valoresOrcamento = orcamentos
            .filter(item => this.statusEmNegociacao(item.status))
            .map(item => ({
                id: item.numero || item.id,
                origem: item.origem,
                titulo: item.numero || item.cliente || "Orcamento",
                valor: item.total || 0
            }));
        const itens = this.unicosPorChave(valoresOrcamento.filter(item => item.valor > 0));

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
        const documento = orcamento.documento || {};
        const dadosDocumento = documento.dados || {};
        const cliente = orcamento.cliente || dadosDocumento.cliente || {};
        const projeto = orcamento.projeto || dadosDocumento.projeto || {};
        const totais = orcamento.totais || dadosDocumento.totais || {};
        const metadados = orcamento.metadados || documento.metadados || {};
        const numero = orcamento.numero || orcamento.numero_orcamento || projeto.numero || projeto.id || orcamento.codigo || orcamento.id;

        return {
            id: String(orcamento.id || orcamento.orcamento_id || numero || "").trim(),
            numero: String(numero || "").trim(),
            cliente: cliente.nome || orcamento.clienteNome || orcamento.nomeCliente || "",
            status: String(orcamento.status || dadosDocumento.resumoFinanceiro?.status || metadados.status || "").trim(),
            total: this.numero(orcamento.total ?? orcamento.totalGeral ?? orcamento.valorTotal ?? orcamento.totalFinal ?? totais.totalGeral ?? totais.totalFinal),
            atualizadoEm: orcamento.atualizadoEm || orcamento.criadoEmISO || orcamento.dataEmissao || orcamento.criadoEm || orcamento.data || metadados.geradoEm || orcamento.atualizadoEmISO || "",
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

    calcularTaxaConversao(totalOrcamentos = 0, totalAprovados = 0) {
        if (!totalOrcamentos) {
            return 0;
        }

        return Math.min(100, Math.round((totalAprovados / totalOrcamentos) * 100));
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

    unicosPorChave(lista = []) {
        const unicos = new Map();
        lista.forEach(item => {
            const chave = this.chaveCanonica(item.id || item.numero || item.titulo);
            if (!chave) return;
            const anterior = unicos.get(chave);
            if (!anterior || this.numero(item.valor) > this.numero(anterior.valor)) unicos.set(chave, item);
        });
        return [...unicos.values()];
    },

    listaContem(lista = [], valor = "") {
        return Array.isArray(lista) && lista.includes(valor);
    },

    statusEmNegociacao(status = "") {
        const valor = String(status || "").trim().toLowerCase();

        if (!valor) {
            return true;
        }

        return !["aprovado", "convertido", "em_producao", "em_instalacao", "concluido", "finalizado", "cancelado", "reprovado"].includes(valor);
    },

    statusDescartado(status = "") {
        return ["cancelado", "reprovado"].includes(String(status || "").trim().toLowerCase());
    },

    statusAprovado(status = "") {
        const valor = String(status || "").trim().toLowerCase();
        return ["aprovado", "convertido", "em_producao", "em_instalacao", "concluido", "finalizado"].includes(valor);
    },

    referenciaMes(data = new Date(), deslocamento = 0) {
        const base = new Date(data.getFullYear(), data.getMonth() + deslocamento, 1);
        return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
    },

    pertenceAoMes(valor, referencia = "") {
        if (!valor || !referencia) return false;
        const texto = String(valor);
        if (/^\d{4}-\d{2}/.test(texto)) return texto.startsWith(referencia);
        const data = new Date(valor);
        return !Number.isNaN(data.getTime()) && this.referenciaMes(data) === referencia;
    },

    timestamp(valor) {
        const data = new Date(valor || 0).getTime();
        return Number.isFinite(data) ? data : 0;
    },

    chaveCanonica(valor) {
        return String(valor || "")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase().replace(/[^a-z0-9]/g, "");
    },

    numero(valor) {
        if (typeof Util !== "undefined" && Util && typeof Util.numero === "function") {
            return Util.numero(valor);
        }
        const numero = typeof valor === "string"
            ? Number(valor.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."))
            : Number(valor);
        return Number.isFinite(numero) ? numero : 0;
    },

    criarEstadoVazio() {
        return {
            carregadoEm: "",
            kpis: {
                totalOrcamentos: 0,
                totalDocumentosAprovados: 0,
                totalProjetosConvertidos: 0,
                taxaConversao: 0,
                ticketMedio: 0,
                obrasAtivas: 0,
                saldoCaixa: 0
            },
            resumo: {},
            valorNegociacao: {
                total: 0,
                itens: []
            },
            resumoOrcamentos: { total: 0, valorTotal: 0, ticketMedio: 0, aprovados: 0, taxaConversao: 0, emAberto: 0, comValor: 0, geradosMes: 0, valorMes: 0, referencia: "" },
            resumoObras: { total: 0, ativas: 0, aprovadas: 0, emProducao: 0, emInstalacao: 0, concluidas: 0, valorMedio: 0, recentes: [] },
            resumoCaixa: { saldo: 0, entradas: 0, saidas: 0, resultadoMes: 0, resultadoAnterior: 0, referencia: "", pendentes: 0, valorPendente: 0, totalConfirmados: 0, movimentos: [] },
            orcamentos: [],
            atividades: [],
            acoes: []
        };
    }
};

document.addEventListener("DOMContentLoaded", () => {
    DashboardComercialController.iniciar();
});
