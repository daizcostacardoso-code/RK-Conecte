const OrcamentoAprovacaoStatus = Object.freeze({
    RASCUNHO: "rascunho",
    EMITIDO: "emitido",
    ENVIADO: "enviado",
    APROVADO: "aprovado",
    RECUSADO: "recusado",
    EXPIRADO: "expirado",
    CANCELADO: "cancelado"
});

const OrcamentoAprovacaoModel = {
    status: OrcamentoAprovacaoStatus,
    schemaVersion: 3,
    colecaoCanonica: "orcamentos_emitidos",

    normalizarRegistro(registro = {}) {
        const base = this.copiar(registro);
        const documento = base.documento || base.documentoComercial || {};
        const dadosDocumento = documento.dados || base.dados || {};
        const metadados = dadosDocumento.metadados || documento.metadados || base.metadados || {};
        const cliente = this.primeiroObjeto(base.cliente, base.registro?.cliente, dadosDocumento.cliente);
        const projeto = this.primeiroObjeto(base.projeto, base.registro?.projeto, dadosDocumento.projeto);
        const numero = this.texto(
            base.numero
            || base.numero_orcamento
            || base.registro?.numero
            || metadados.numeroOrcamento
            || metadados.orcamentoNumero
            || projeto.numero
            || projeto.id
            || base.id
        );
        const id = this.texto(base.id || base.orcamento_id || numero);
        const vinculos = this.normalizarVinculos(base, cliente, projeto, metadados);
        const status = this.normalizarStatus(base.status || base.aprovacao?.status);
        const aprovacao = this.normalizarAprovacao({
            ...(base.aprovacao || {}),
            versaoOrcamento: base.aprovacao?.versaoOrcamento || base.revisao || base.versaoOrcamento
        }, status);
        const historicoOriginal = Array.isArray(base.historicoStatus) ? base.historicoStatus : [];
        const criadoEmISO = this.dataISO(
            base.criadoEmISO
            || base.criado_em
            || base.criadoEm
            || base.dataEmissao
            || metadados.geradoEm
            || metadados.criadoEm
        );
        const atualizadoEmISO = this.dataISO(
            base.atualizadoEmISO
            || base.atualizado_em
            || base.atualizadoEm
            || metadados.atualizadoEm
            || criadoEmISO
        ) || this.agoraISO();
        const historicoStatus = historicoOriginal.length
            ? historicoOriginal.map(item => this.normalizarHistorico(item, status))
            : [this.criarHistorico({
                id: this.idHistoricoNormalizacao(id || numero),
                statusAnterior: null,
                statusAtual: status,
                acao: "orcamento_normalizado",
                observacao: "Registro anterior compatibilizado com o fluxo comercial.",
                realizadoEm: criadoEmISO || atualizadoEmISO,
                origem: "normalizacao"
            })];

        return {
            ...base,
            id,
            orcamento_id: id,
            numero,
            numero_orcamento: numero,
            cliente,
            projeto,
            clienteNome: this.texto(base.clienteNome || base.nomeCliente || cliente.nome),
            clienteNomeBusca: this.normalizarBusca(base.clienteNomeBusca || base.clienteNome || base.nomeCliente || cliente.nome),
            vinculos,
            solicitacaoId: vinculos.solicitacaoId,
            clienteId: vinculos.clienteId,
            projetoId: vinculos.projetoId,
            revisao: aprovacao.versaoOrcamento,
            schemaVersion: Math.max(this.schemaVersion, Number.parseInt(base.schemaVersion, 10) || 0),
            fonteCanonica: this.colecaoCanonica,
            status,
            aprovacao,
            historicoStatus,
            criadoEmISO: criadoEmISO || atualizadoEmISO,
            atualizadoEmISO
        };
    },

    normalizarVinculos(registro = {}, cliente = {}, projeto = {}, metadados = {}) {
        const vinculos = registro.vinculos && typeof registro.vinculos === "object" ? registro.vinculos : {};
        return {
            solicitacaoId: this.texto(
                vinculos.solicitacaoId
                || registro.solicitacaoId
                || registro.origemSolicitacaoId
                || metadados.solicitacaoId
            ),
            clienteId: this.texto(
                vinculos.clienteId
                || registro.clienteId
                || cliente.id
                || cliente.cliente_id
                || metadados.clienteId
            ),
            projetoId: this.texto(
                vinculos.projetoId
                || registro.projetoId
                || projeto.id
                || projeto.projeto_id
                || metadados.projetoId
            )
        };
    },

    idHistoricoNormalizacao(identificador = "") {
        const chave = this.chave(identificador) || "legado";
        return `hist_normalizacao_${chave}`;
    },

    normalizarBusca(valor) {
        return this.texto(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    },

    primeiroObjeto(...valores) {
        return valores.find(valor => valor && typeof valor === "object" && Object.keys(valor).length) || {};
    },

    normalizarStatus(valor, padrao = OrcamentoAprovacaoStatus.EMITIDO) {
        const chave = this.chave(valor);
        const mapa = {
            rascunho: OrcamentoAprovacaoStatus.RASCUNHO,
            emitido: OrcamentoAprovacaoStatus.EMITIDO,
            enviado: OrcamentoAprovacaoStatus.ENVIADO,
            aprovado: OrcamentoAprovacaoStatus.APROVADO,
            recusado: OrcamentoAprovacaoStatus.RECUSADO,
            reprovado: OrcamentoAprovacaoStatus.RECUSADO,
            expirado: OrcamentoAprovacaoStatus.EXPIRADO,
            cancelado: OrcamentoAprovacaoStatus.CANCELADO,
            em_revisao: OrcamentoAprovacaoStatus.ENVIADO,
            finalizado: OrcamentoAprovacaoStatus.EMITIDO,
            calculado: OrcamentoAprovacaoStatus.EMITIDO,
            preparado: OrcamentoAprovacaoStatus.EMITIDO
        };
        return mapa[chave] || padrao;
    },

    normalizarAprovacao(aprovacao = {}, status = OrcamentoAprovacaoStatus.EMITIDO) {
        const origem = aprovacao && typeof aprovacao === "object" ? aprovacao : {};
        const statusAprovacao = this.statusDaAprovacao(status, origem.status);
        return {
            ...origem,
            status: statusAprovacao,
            aprovadoEm: this.dataISO(origem.aprovadoEm) || null,
            recusadoEm: this.dataISO(origem.recusadoEm) || null,
            canceladoEm: this.dataISO(origem.canceladoEm) || null,
            aprovadoPor: this.normalizarUsuario(origem.aprovadoPor),
            recusadoPor: this.normalizarUsuario(origem.recusadoPor),
            canceladoPor: this.normalizarUsuario(origem.canceladoPor),
            observacao: this.texto(origem.observacao),
            motivoRecusa: this.texto(origem.motivoRecusa),
            valorAprovadoCentavos: this.centavos(origem.valorAprovadoCentavos),
            versaoOrcamento: Math.max(1, Number.parseInt(origem.versaoOrcamento, 10) || 1)
        };
    },

    statusDaAprovacao(status, valorAtual = "") {
        if (status === OrcamentoAprovacaoStatus.APROVADO) return "aprovado";
        if (status === OrcamentoAprovacaoStatus.RECUSADO) return "recusado";
        if (status === OrcamentoAprovacaoStatus.CANCELADO) return "cancelado";
        const atual = this.chave(valorAtual);
        return ["aprovado", "recusado", "cancelado"].includes(atual) ? atual : "pendente";
    },

    criarHistorico(dados = {}) {
        return {
            id: this.texto(dados.id) || this.identificador(),
            statusAnterior: dados.statusAnterior === null ? null : this.normalizarStatus(dados.statusAnterior),
            statusAtual: this.normalizarStatus(dados.statusAtual),
            acao: this.texto(dados.acao),
            observacao: this.texto(dados.observacao),
            realizadoEm: this.dataISO(dados.realizadoEm) || this.agoraISO(),
            realizadoPor: this.normalizarUsuario(dados.realizadoPor),
            origem: this.texto(dados.origem) || "sistema"
        };
    },

    normalizarHistorico(item = {}, statusPadrao = OrcamentoAprovacaoStatus.EMITIDO) {
        return this.criarHistorico({
            ...item,
            statusAnterior: item.statusAnterior === null ? null : (item.statusAnterior || statusPadrao),
            statusAtual: item.statusAtual || statusPadrao,
            realizadoEm: item.realizadoEm || item.data,
            realizadoPor: item.realizadoPor || { uid: item.usuario || "", nome: item.usuario || "", email: "" }
        });
    },

    limparDecisaoParaNovaVersao(aprovacao = {}) {
        const atual = this.normalizarAprovacao(aprovacao);
        return {
            ...atual,
            status: "pendente",
            aprovadoEm: null,
            recusadoEm: null,
            canceladoEm: null,
            aprovadoPor: null,
            recusadoPor: null,
            canceladoPor: null,
            observacao: "",
            motivoRecusa: "",
            valorAprovadoCentavos: 0,
            versaoOrcamento: atual.versaoOrcamento + 1
        };
    },

    obterCliente(registro = {}) {
        return this.primeiroObjeto(registro.cliente, registro.registro?.cliente, registro.documento?.dados?.cliente, registro.dados?.cliente);
    },

    obterItens(registro = {}) {
        const candidatos = [registro.itens, registro.registro?.itens, registro.documento?.dados?.produtos, registro.dados?.produtos];
        return candidatos.find(itens => Array.isArray(itens) && itens.length)
            || candidatos.find(Array.isArray)
            || [];
    },

    obterTotal(registro = {}) {
        const totais = this.primeiroObjeto(registro.totais, registro.registro?.totais, registro.documento?.dados?.totais, registro.dados?.totais);
        const valor = registro.total ?? registro.totalGeral ?? registro.valorTotal ?? registro.totalFinal
            ?? registro.registro?.total ?? registro.registro?.totalGeral ?? registro.registro?.valorTotal ?? registro.registro?.totalFinal
            ?? totais.totalGeral ?? totais.totalFinal ?? totais.total;
        return this.numero(valor);
    },

    normalizarUsuario(usuario = null) {
        if (!usuario || typeof usuario !== "object") return null;
        return {
            uid: this.texto(usuario.uid || usuario.id || usuario.usuario),
            nome: this.texto(usuario.nome || usuario.nomeUsuario || usuario.usuario),
            email: this.texto(usuario.email)
        };
    },

    centavos(valor) {
        const numero = this.numero(valor);
        return Number.isFinite(numero) ? Math.max(0, Math.round(numero)) : 0;
    },

    valorEmCentavos(valor) {
        return Math.max(0, Math.round(this.numero(valor) * 100));
    },

    numero(valor) {
        if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
        const texto = this.texto(valor);
        if (!texto) return 0;
        const normalizado = texto.includes(",")
            ? texto.replace(/\./g, "").replace(",", ".")
            : texto;
        const numero = Number(normalizado);
        return Number.isFinite(numero) ? numero : 0;
    },

    dataISO(valor) {
        if (!valor) return "";
        if (typeof valor?.toDate === "function") return this.dataISO(valor.toDate());
        const data = new Date(valor);
        return Number.isNaN(data.getTime()) ? "" : data.toISOString();
    },

    chave(valor) {
        return this.texto(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    },

    texto(valor) {
        return String(valor === undefined || valor === null ? "" : valor).trim();
    },

    copiar(valor) {
        if (Array.isArray(valor)) return valor.map(item => this.copiar(item));
        if (valor && Object.prototype.toString.call(valor) === "[object Object]") {
            return Object.keys(valor).reduce((copia, chave) => {
                copia[chave] = this.copiar(valor[chave]);
                return copia;
            }, {});
        }
        return valor;
    },

    identificador() {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
        return `hist_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    },

    agoraISO() {
        return new Date().toISOString();
    }
};

if (typeof window !== "undefined") {
    window.OrcamentoAprovacaoStatus = OrcamentoAprovacaoStatus;
    window.OrcamentoAprovacaoModel = OrcamentoAprovacaoModel;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { OrcamentoAprovacaoStatus, OrcamentoAprovacaoModel };
}
