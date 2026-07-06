const EXPORT_FORMATS = Object.freeze({
    PDF: "PDF",
    PRINT: "PRINT"
});

const ExportModel = {
    tipo: "EXPORTACAO_DOCUMENTO",
    versao: "4.3",

    criar(dados = {}) {
        return this.normalizar(dados);
    },

    normalizar(dados = {}) {
        const formato = this.normalizarFormato(dados.formato || dados.tipo || dados.adapter);
        const documento = dados.documento || null;
        const html = this.texto(dados.html);

        return {
            tipo: this.tipo,
            versao: this.versao,
            formato,
            status: this.texto(dados.status || "PREPARADO"),
            documento,
            html,
            nomeArquivo: this.montarNomeArquivo(documento, formato, dados.nomeArquivo),
            geracaoEfetiva: false,
            download: false,
            bibliotecaExterna: false,
            criadoEm: this.texto(dados.criadoEm || this.agoraISO()),
            opcoes: dados.opcoes || {},
            metadados: this.normalizarMetadados(dados.metadados, documento, formato)
        };
    },

    normalizarFormato(formato = EXPORT_FORMATS.PDF) {
        const valor = this.texto(formato).toUpperCase();

        if (!valor || valor === "PDF") {
            return EXPORT_FORMATS.PDF;
        }

        if (valor === "IMPRESSAO" || valor === "PRINT" || valor === "IMPRIMIR") {
            return EXPORT_FORMATS.PRINT;
        }

        return valor;
    },

    normalizarMetadados(metadados = {}, documento = {}, formato = EXPORT_FORMATS.PDF) {
        return {
            origem: this.texto(metadados.origem || "DOCUMENT_RENDERER"),
            documentoTipo: this.texto(metadados.documentoTipo || documento?.tipo || "DOCUMENTO_COMERCIAL"),
            documentoVersao: this.texto(metadados.documentoVersao || documento?.versao || ""),
            formato,
            adapter: this.texto(metadados.adapter || formato),
            prontoPara: this.texto(metadados.prontoPara || "PDF_REAL_FUTURO"),
            observacao: this.texto(metadados.observacao || "Estrutura simulada sem geracao de arquivo.")
        };
    },

    montarNomeArquivo(documento = {}, formato = EXPORT_FORMATS.PDF, nomeArquivo = "") {
        if (nomeArquivo) {
            return this.texto(nomeArquivo);
        }

        const numero = this.obterNumeroOrcamento(documento);
        const extensao = formato === EXPORT_FORMATS.PRINT ? "html" : "pdf";

        return `RK-Vidracaria-${this.nomeArquivoSeguro(numero)}.${extensao}`;
    },

    obterNumeroOrcamento(documento = {}) {
        const dados = documento?.dados || documento || {};
        const metadados = dados.metadados || documento?.metadados || {};
        const projeto = dados.projeto || {};

        return this.texto(
            metadados.numeroOrcamento
            || metadados.orcamentoNumero
            || dados.numero
            || dados.orcamentoNumero
            || projeto.numero
            || projeto.id
            || projeto.nome
            || "documento"
        );
    },

    nomeArquivoSeguro(valor) {
        return this.texto(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "") || "documento";
    },

    slug(valor) {
        return this.texto(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "documento";
    },

    texto(valor) {
        return String(valor === undefined || valor === null ? "" : valor).trim();
    },

    agoraISO() {
        return new Date().toISOString();
    }
};

const ExportFormats = EXPORT_FORMATS;
