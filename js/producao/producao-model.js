const PRODUCAO_STATUS = Object.freeze({
    PENDENTE: "PENDENTE",
    PLANEJADA: "PLANEJADA",
    LIBERADA: "LIBERADA",
    EM_PRODUCAO: "EM_PRODUCAO",
    FINALIZADA: "FINALIZADA"
});

const PRODUCAO_PRIORIDADE = Object.freeze({
    BAIXA: "BAIXA",
    NORMAL: "NORMAL",
    ALTA: "ALTA",
    URGENTE: "URGENTE"
});

const PRODUCAO_CHECKLIST_PADRAO = Object.freeze([
    { id: "projeto_conferido", titulo: "Projeto conferido" },
    { id: "medidas_conferidas", titulo: "Medidas conferidas" },
    { id: "material_definido", titulo: "Material definido" },
    { id: "ferragens_definidas", titulo: "Ferragens definidas" },
    { id: "producao_autorizada", titulo: "Producao autorizada" }
]);

const ProducaoModel = {
    status: PRODUCAO_STATUS,
    prioridades: PRODUCAO_PRIORIDADE,
    checklistPadrao: PRODUCAO_CHECKLIST_PADRAO,

    rotulosStatus: {
        PENDENTE: "Pendente",
        PLANEJADA: "Planejada",
        LIBERADA: "Liberada",
        EM_PRODUCAO: "Em producao",
        FINALIZADA: "Finalizada"
    },

    rotulosPrioridade: {
        BAIXA: "Baixa",
        NORMAL: "Normal",
        ALTA: "Alta",
        URGENTE: "Urgente"
    },

    transicoes: {
        PENDENTE: ["PLANEJADA"],
        PLANEJADA: ["LIBERADA"],
        LIBERADA: ["EM_PRODUCAO"],
        EM_PRODUCAO: ["FINALIZADA"],
        FINALIZADA: []
    },

    criar(dados = {}) {
        const agora = this.agoraISO();
        const ordem = this.normalizar({
            ...dados,
            id: dados.id || this.criarId(),
            numero: dados.numero || this.criarNumero(),
            status: dados.status || PRODUCAO_STATUS.PENDENTE,
            criadoEm: dados.criadoEm || dados.dataCriacao || agora,
            atualizadoEm: dados.atualizadoEm || dados.dataAtualizacao || agora
        });

        if (!ordem.historico.length) {
            return this.adicionarEvento(
                ordem,
                "criada",
                "Ordem criada",
                dados.usuario || "Sistema"
            );
        }

        return ordem;
    },

    normalizar(dados = {}) {
        const agora = this.agoraISO();
        const projeto = dados.projeto || {};
        const cliente = dados.cliente || projeto.cliente || {};
        const criadoEm = dados.criadoEm || dados.dataCriacao || dados.criadoEmISO || agora;
        const atualizadoEm = dados.atualizadoEm || dados.dataAtualizacao || dados.atualizadoEmISO || criadoEm;
        const numero = this.texto(dados.numero || dados.codigo || "");

        return {
            id: this.texto(dados.id) || this.criarId(),
            projetoId: this.texto(dados.projetoId || projeto.id),
            clienteId: this.texto(dados.clienteId || cliente.id || projeto.clienteId),
            numero: numero || this.criarNumero(),
            status: this.normalizarStatus(dados.status),
            prioridade: this.normalizarPrioridade(dados.prioridade),
            responsavel: this.texto(dados.responsavel),
            previsaoInicio: this.texto(dados.previsaoInicio),
            previsaoEntrega: this.texto(dados.previsaoEntrega),
            tempoEstimado: this.texto(dados.tempoEstimado),
            descricao: this.texto(dados.descricao),
            observacoes: this.texto(dados.observacoes),
            checklist: this.normalizarChecklist(dados.checklist, atualizadoEm),
            historico: this.normalizarHistorico(dados.historico),
            criadoEm,
            atualizadoEm,
            dataCriacao: criadoEm,
            dataAtualizacao: atualizadoEm
        };
    },

    atualizar(ordem = {}, alteracoes = {}) {
        const anterior = this.normalizar(ordem);
        const atualizadoEm = this.agoraISO();

        return this.normalizar({
            ...anterior,
            ...alteracoes,
            id: anterior.id,
            criadoEm: anterior.criadoEm,
            dataCriacao: anterior.criadoEm,
            atualizadoEm,
            dataAtualizacao: atualizadoEm,
            historico: [...anterior.historico],
            checklist: alteracoes.checklist || anterior.checklist
        });
    },

    planejar(ordem = {}, alteracoes = {}, usuario = "Sistema") {
        const anterior = this.normalizar(ordem);
        const status = anterior.status === PRODUCAO_STATUS.PENDENTE
            ? PRODUCAO_STATUS.PLANEJADA
            : anterior.status;
        const camposPlanejamento = [
            "responsavel",
            "prioridade",
            "previsaoInicio",
            "previsaoEntrega",
            "tempoEstimado",
            "descricao",
            "observacoes"
        ];
        const dadosPlanejamento = camposPlanejamento.reduce((dados, chave) => {
            if (Object.prototype.hasOwnProperty.call(alteracoes, chave)) {
                dados[chave] = alteracoes[chave];
            }

            return dados;
        }, { status });
        const atualizado = this.atualizar(anterior, dadosPlanejamento);
        let comHistorico = atualizado;

        if (
            Object.prototype.hasOwnProperty.call(alteracoes, "responsavel") &&
            atualizado.responsavel !== anterior.responsavel
        ) {
            comHistorico = this.adicionarEvento(
                comHistorico,
                "responsavel_definido",
                "Responsavel definido",
                usuario,
                {
                    responsavelAnterior: anterior.responsavel,
                    responsavelDestino: atualizado.responsavel
                }
            );
        }

        if (
            Object.prototype.hasOwnProperty.call(alteracoes, "prioridade") &&
            atualizado.prioridade !== anterior.prioridade
        ) {
            comHistorico = this.adicionarEvento(
                comHistorico,
                "prioridade_alterada",
                "Prioridade alterada",
                usuario,
                {
                    prioridadeAnterior: anterior.prioridade,
                    prioridadeDestino: atualizado.prioridade
                }
            );
        }

        return this.adicionarEvento(
            comHistorico,
            "planejamento_atualizado",
            anterior.status === PRODUCAO_STATUS.PENDENTE ? "Ordem planejada" : "Planejamento atualizado",
            usuario,
            {
                statusAnterior: anterior.status,
                statusDestino: status
            }
        );
    },

    definirResponsavel(ordem = {}, responsavel = "", usuario = "Sistema") {
        const anterior = this.normalizar(ordem);
        const atualizado = this.atualizar(anterior, { responsavel });

        return this.adicionarEvento(
            atualizado,
            "responsavel_definido",
            "Responsavel definido",
            usuario,
            {
                responsavelAnterior: anterior.responsavel,
                responsavelDestino: atualizado.responsavel
            }
        );
    },

    alterarPrioridade(ordem = {}, prioridade = PRODUCAO_PRIORIDADE.NORMAL, usuario = "Sistema") {
        const anterior = this.normalizar(ordem);
        const atualizado = this.atualizar(anterior, {
            prioridade: this.normalizarPrioridade(prioridade)
        });

        return this.adicionarEvento(
            atualizado,
            "prioridade_alterada",
            "Prioridade alterada",
            usuario,
            {
                prioridadeAnterior: anterior.prioridade,
                prioridadeDestino: atualizado.prioridade
            }
        );
    },

    atualizarChecklist(ordem = {}, itemId = "", concluido = false, usuario = "Sistema") {
        const anterior = this.normalizar(ordem);
        const agora = this.agoraISO();
        const checklist = anterior.checklist.map(item => {
            if (item.id !== itemId) {
                return item;
            }

            return {
                ...item,
                concluido: Boolean(concluido),
                atualizadoEm: agora
            };
        });
        const atualizado = this.atualizar(anterior, { checklist });

        return this.adicionarEvento(
            atualizado,
            "checklist_atualizado",
            "Checklist atualizado",
            usuario,
            {
                itemId,
                concluido: Boolean(concluido)
            }
        );
    },

    liberar(ordem = {}, usuario = "Sistema") {
        const anterior = this.normalizar(ordem);
        const atualizado = this.alterarStatus(anterior, PRODUCAO_STATUS.LIBERADA, usuario);

        return this.adicionarEvento(
            atualizado,
            "liberada",
            "Producao liberada",
            usuario,
            {
                statusAnterior: anterior.status,
                statusDestino: PRODUCAO_STATUS.LIBERADA
            }
        );
    },

    alterarStatus(ordem = {}, novoStatus, usuario = "Sistema") {
        const anterior = this.normalizar(ordem);
        const statusDestino = this.normalizarStatus(novoStatus);
        const atualizado = this.atualizar(anterior, { status: statusDestino });

        return this.adicionarEvento(
            atualizado,
            "status_alterado",
            `Status alterado de ${anterior.status} para ${statusDestino}`,
            usuario,
            {
                statusAnterior: anterior.status,
                statusDestino
            }
        );
    },

    adicionarEvento(ordem = {}, tipo, descricao, usuario = "Sistema", dados = {}) {
        const evento = this.criarEvento(tipo, descricao, usuario, dados);
        const historico = Array.isArray(ordem.historico) ? [...ordem.historico, evento] : [evento];

        return {
            ...ordem,
            historico,
            atualizadoEm: evento.data,
            dataAtualizacao: evento.data
        };
    },

    criarEvento(tipo, descricao, usuario = "Sistema", dados = {}) {
        return {
            tipo: tipo || "evento",
            descricao: descricao || "",
            usuario: usuario || "Sistema",
            data: this.agoraISO(),
            dados: dados || {}
        };
    },

    normalizarChecklist(checklist = [], atualizadoEm = "") {
        const entrada = Array.isArray(checklist) ? checklist : [];
        const porId = entrada.reduce((mapa, item) => {
            const normalizado = this.normalizarItemChecklist(item, atualizadoEm);
            mapa[normalizado.id] = normalizado;
            return mapa;
        }, {});
        const padrao = PRODUCAO_CHECKLIST_PADRAO.map(item => this.normalizarItemChecklist({
            ...item,
            ...(porId[item.id] || {})
        }, atualizadoEm));
        const extras = entrada
            .map(item => this.normalizarItemChecklist(item, atualizadoEm))
            .filter(item => !PRODUCAO_CHECKLIST_PADRAO.some(padraoItem => padraoItem.id === item.id));

        return [...padrao, ...extras];
    },

    normalizarItemChecklist(item = {}, atualizadoEm = "") {
        const titulo = this.texto(item.titulo || item.nome || "Item operacional");

        return {
            id: this.texto(item.id) || this.slug(titulo).toLowerCase(),
            titulo,
            concluido: Boolean(item.concluido),
            atualizadoEm: item.atualizadoEm || atualizadoEm || this.agoraISO()
        };
    },

    normalizarHistorico(historico = []) {
        if (!Array.isArray(historico)) {
            return [];
        }

        return historico.map(evento => ({
            tipo: this.texto(evento.tipo || "evento"),
            descricao: this.texto(evento.descricao),
            usuario: this.texto(evento.usuario || "Sistema"),
            data: evento.data || evento.criadoEm || this.agoraISO(),
            dados: evento.dados && typeof evento.dados === "object" ? evento.dados : {}
        }));
    },

    normalizarStatus(status) {
        const valor = this.slug(status || PRODUCAO_STATUS.PENDENTE);
        const aliases = {
            PENDENTE: PRODUCAO_STATUS.PENDENTE,
            PLANEJADA: PRODUCAO_STATUS.PLANEJADA,
            PLANEJADO: PRODUCAO_STATUS.PLANEJADA,
            LIBERADA: PRODUCAO_STATUS.LIBERADA,
            LIBERADO: PRODUCAO_STATUS.LIBERADA,
            AUTORIZADA: PRODUCAO_STATUS.LIBERADA,
            AUTORIZADO: PRODUCAO_STATUS.LIBERADA,
            EM_PRODUCAO: PRODUCAO_STATUS.EM_PRODUCAO,
            PRODUCAO: PRODUCAO_STATUS.EM_PRODUCAO,
            INICIADA: PRODUCAO_STATUS.EM_PRODUCAO,
            INICIADO: PRODUCAO_STATUS.EM_PRODUCAO,
            EM_ANDAMENTO: PRODUCAO_STATUS.EM_PRODUCAO,
            FINALIZADA: PRODUCAO_STATUS.FINALIZADA,
            FINALIZADO: PRODUCAO_STATUS.FINALIZADA
        };

        return aliases[valor] || valor;
    },

    normalizarPrioridade(prioridade) {
        const valor = this.slug(prioridade || PRODUCAO_PRIORIDADE.NORMAL);
        const aliases = {
            BAIXA: PRODUCAO_PRIORIDADE.BAIXA,
            BAIXO: PRODUCAO_PRIORIDADE.BAIXA,
            NORMAL: PRODUCAO_PRIORIDADE.NORMAL,
            MEDIA: PRODUCAO_PRIORIDADE.NORMAL,
            MEDIO: PRODUCAO_PRIORIDADE.NORMAL,
            ALTA: PRODUCAO_PRIORIDADE.ALTA,
            ALTO: PRODUCAO_PRIORIDADE.ALTA,
            URGENTE: PRODUCAO_PRIORIDADE.URGENTE
        };

        return aliases[valor] || PRODUCAO_PRIORIDADE.NORMAL;
    },

    statusValido(status) {
        return Object.values(PRODUCAO_STATUS).includes(this.normalizarStatus(status));
    },

    prioridadeValida(prioridade) {
        return Object.values(PRODUCAO_PRIORIDADE).includes(this.normalizarPrioridade(prioridade));
    },

    podeTransicionar(statusAtual, novoStatus) {
        const origem = this.normalizarStatus(statusAtual);
        const destino = this.normalizarStatus(novoStatus);
        return origem === destino || (this.transicoes[origem] || []).includes(destino);
    },

    obterProximosStatus(statusAtual) {
        const origem = this.normalizarStatus(statusAtual);
        return [...(this.transicoes[origem] || [])];
    },

    rotuloStatus(status) {
        return this.rotulosStatus[this.normalizarStatus(status)] || status || "";
    },

    rotuloPrioridade(prioridade) {
        return this.rotulosPrioridade[this.normalizarPrioridade(prioridade)] || prioridade || "";
    },

    slug(valor) {
        return this.removerAcentos(valor)
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    },

    removerAcentos(valor) {
        return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    },

    texto(valor) {
        return String(valor ?? "").trim();
    },

    criarId(prefixo = "op") {
        return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    },

    criarNumero() {
        const data = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const sufixo = String(Date.now()).slice(-4);
        return `OP-${data}-${sufixo}`;
    },

    agoraISO() {
        return new Date().toISOString();
    }
};

const OrdemProducaoModel = ProducaoModel;

function criarOrdemProducaoBase(dados = {}) {
    return ProducaoModel.criar(dados);
}
