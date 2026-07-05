const COMERCIAL_STATUS = Object.freeze({
    RASCUNHO: "RASCUNHO",
    EM_REVISAO: "EM_REVISAO",
    APROVADO: "APROVADO",
    REPROVADO: "REPROVADO"
});

const ComercialModel = {
    tipo: "APROVACAO_COMERCIAL",
    versao: "4.6",

    criar(dados = {}) {
        const documento = this.normalizarDocumento(dados.documento);
        const statusComercial = this.normalizarStatus(dados.statusComercial);

        return {
            tipo: this.tipo,
            versao: this.versao,
            documento,
            documentoId: this.obterDocumentoId(documento),
            projetoId: this.obterProjetoId(documento),
            clienteId: this.obterClienteId(documento),
            statusComercial,
            dataSolicitacao: this.texto(dados.dataSolicitacao),
            dataAprovacao: this.texto(dados.dataAprovacao),
            dataReprovacao: this.texto(dados.dataReprovacao),
            motivoReprovacao: this.texto(dados.motivoReprovacao),
            ultimaAcaoComercial: this.texto(dados.ultimaAcaoComercial || "Fluxo comercial iniciado."),
            atualizadoEm: this.texto(dados.atualizadoEm || this.agoraISO()),
            historico: this.normalizarHistorico(dados.historico),
            metadados: this.normalizarMetadados(dados.metadados)
        };
    },

    atualizarStatus(registro = {}, statusComercial = COMERCIAL_STATUS.RASCUNHO, dados = {}) {
        const status = this.normalizarStatus(statusComercial);
        const agora = this.agoraISO();
        const base = this.criar({
            ...registro,
            statusComercial: registro.statusComercial || COMERCIAL_STATUS.RASCUNHO
        });
        const entradaHistorico = this.criarEntradaHistorico({
            acao: dados.acao || status,
            statusAnterior: base.statusComercial,
            statusAtual: status,
            usuario: dados.usuario,
            observacao: dados.observacao || dados.motivoReprovacao,
            data: agora
        });

        return this.criar({
            ...base,
            statusComercial: status,
            dataSolicitacao: status === COMERCIAL_STATUS.EM_REVISAO
                ? (base.dataSolicitacao || agora)
                : base.dataSolicitacao,
            dataAprovacao: status === COMERCIAL_STATUS.APROVADO
                ? agora
                : (status === COMERCIAL_STATUS.EM_REVISAO ? "" : base.dataAprovacao),
            dataReprovacao: status === COMERCIAL_STATUS.REPROVADO
                ? agora
                : (status === COMERCIAL_STATUS.EM_REVISAO ? "" : base.dataReprovacao),
            motivoReprovacao: status === COMERCIAL_STATUS.REPROVADO
                ? this.texto(dados.motivoReprovacao || dados.observacao)
                : (status === COMERCIAL_STATUS.EM_REVISAO ? "" : base.motivoReprovacao),
            ultimaAcaoComercial: dados.ultimaAcaoComercial || entradaHistorico.descricao,
            atualizadoEm: agora,
            historico: [
                ...base.historico,
                entradaHistorico
            ],
            metadados: {
                ...base.metadados,
                origemUltimaAcao: dados.origem || "ComercialService"
            }
        });
    },

    criarEntradaHistorico(dados = {}) {
        return {
            acao: this.texto(dados.acao),
            statusAnterior: this.normalizarStatus(dados.statusAnterior),
            statusAtual: this.normalizarStatus(dados.statusAtual),
            usuario: this.texto(dados.usuario),
            observacao: this.texto(dados.observacao),
            descricao: this.montarDescricao(dados),
            data: this.texto(dados.data || this.agoraISO())
        };
    },

    normalizarDocumento(documento = null) {
        if (!documento || typeof documento !== "object") {
            return null;
        }

        return this.copiarValor(documento);
    },

    normalizarHistorico(historico = []) {
        return Array.isArray(historico)
            ? historico.map(item => ({
                acao: this.texto(item.acao),
                statusAnterior: this.normalizarStatus(item.statusAnterior),
                statusAtual: this.normalizarStatus(item.statusAtual),
                usuario: this.texto(item.usuario),
                observacao: this.texto(item.observacao),
                descricao: this.texto(item.descricao),
                data: this.texto(item.data)
            }))
            : [];
    },

    normalizarMetadados(metadados = {}) {
        return {
            origem: this.texto(metadados.origem || "DOCUMENTO_COMERCIAL"),
            preparadoPara: this.lista(metadados.preparadoPara, ["CONVERSAO_PROJETO", "HISTORICO_COMERCIAL"]),
            persistencia: this.texto(metadados.persistencia || "APP_STATE"),
            origemUltimaAcao: this.texto(metadados.origemUltimaAcao || "")
        };
    },

    normalizarStatus(status = COMERCIAL_STATUS.RASCUNHO) {
        const valor = this.texto(status).toUpperCase();
        return Object.values(COMERCIAL_STATUS).includes(valor) ? valor : COMERCIAL_STATUS.RASCUNHO;
    },

    obterDocumentoId(documento = {}) {
        return this.texto(
            documento?.id ||
            documento?.documentoId ||
            documento?.metadados?.id ||
            documento?.dados?.metadados?.id ||
            documento?.dados?.projeto?.numero ||
            documento?.dados?.projeto?.id
        );
    },

    obterProjetoId(documento = {}) {
        return this.texto(
            documento?.projetoId ||
            documento?.dados?.projeto?.id ||
            documento?.dados?.projeto?.numero ||
            documento?.secoes?.projeto?.dados?.id
        );
    },

    obterClienteId(documento = {}) {
        return this.texto(
            documento?.clienteId ||
            documento?.dados?.cliente?.id ||
            documento?.secoes?.cliente?.dados?.id
        );
    },

    montarDescricao(dados = {}) {
        const statusAnterior = this.normalizarStatus(dados.statusAnterior);
        const statusAtual = this.normalizarStatus(dados.statusAtual);
        const acao = this.texto(dados.acao || statusAtual);

        return `Acao comercial ${acao}: ${statusAnterior} -> ${statusAtual}`;
    },

    copiarValor(valor) {
        if (typeof structuredClone === "function") {
            try {
                return structuredClone(valor);
            } catch (erro) {
                return this.copiarValorManual(valor);
            }
        }

        return this.copiarValorManual(valor);
    },

    copiarValorManual(valor) {
        if (Array.isArray(valor)) {
            return valor.map(item => this.copiarValorManual(item));
        }

        if (valor && Object.prototype.toString.call(valor) === "[object Object]") {
            return Object.keys(valor).reduce((copia, chave) => {
                copia[chave] = this.copiarValorManual(valor[chave]);
                return copia;
            }, {});
        }

        return valor;
    },

    lista(valor, padrao = []) {
        return Array.isArray(valor) && valor.length ? [...valor] : [...padrao];
    },

    texto(valor) {
        return String(valor === undefined || valor === null ? "" : valor).trim();
    },

    agoraISO() {
        return new Date().toISOString();
    }
};

const ComercialStatus = COMERCIAL_STATUS;
