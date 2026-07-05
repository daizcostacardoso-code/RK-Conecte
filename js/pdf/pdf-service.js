const PdfService = {
    gerarModelo(contexto = {}) {
        const dados = this.montarDados(contexto);
        return PdfModel.criar(dados);
    },

    montarDados(contexto = {}) {
        const origem = this.obterOrigem(contexto);
        const resumo = origem.resumo || contexto.resumo || {};
        const condicoesComerciais = origem.condicoesComerciais || contexto.condicoesComerciais || resumo.condicoesComerciais || {};

        return {
            empresa: origem.empresa || contexto.empresa || {},
            cliente: origem.cliente || contexto.cliente || resumo.cliente || {},
            projeto: origem.projeto || contexto.projeto || resumo.projeto || {},
            servico: origem.servico || contexto.servico || resumo.servico || {},
            produtos: origem.produtos || contexto.produtos || [],
            totais: origem.totais || resumo.totais || {},
            observacoes: origem.observacoes || contexto.observacoes || resumo.observacoes || {},
            condicoesComerciais,
            validade: origem.validade || {
                descricao: condicoesComerciais.validadeProposta || ""
            },
            rodape: origem.rodape || {},
            resumo,
            origem: {
                preparadoPara: origem.preparadoPara || "",
                versao: origem.versao || "",
                status: origem.status || contexto.status || "",
                criadoEm: origem.criadoEm || contexto.criadoEm || "",
                atualizadoEm: origem.atualizadoEm || contexto.atualizadoEm || ""
            }
        };
    },

    validarDados(dados = {}) {
        return PdfValidator.validar(dados);
    },

    prepararExportacao(contexto = {}) {
        try {
            const modelo = this.gerarModelo(contexto);
            const validacao = this.validarDados(modelo);

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    modelo,
                    template: null,
                    exportacao: null,
                    erros: validacao.erros,
                    detalhes: {
                        validacao
                    }
                };
            }

            const template = PdfTemplate.criar(modelo);

            return {
                sucesso: true,
                modelo,
                template,
                exportacao: {
                    tipo: "PDF_COMERCIAL",
                    status: "PREPARADO",
                    nomeArquivo: this.montarNomeArquivo(modelo),
                    preparadoEm: modelo.preparadoEm,
                    geracaoEfetiva: false,
                    prontoPara: "SPRINT_4_2"
                },
                erros: [],
                detalhes: {
                    validacao
                }
            };
        } catch (erro) {
            return this.respostaErro(erro);
        }
    },

    obterOrigem(contexto = {}) {
        if (contexto && contexto.orcamentoPreparado && typeof contexto.orcamentoPreparado === "object") {
            return contexto.orcamentoPreparado;
        }

        return contexto || {};
    },

    montarNomeArquivo(modelo = {}) {
        const projeto = modelo.projeto?.numero || modelo.projeto?.id || "orcamento";
        const cliente = this.slug(modelo.cliente?.nome || "cliente");
        return `proposta-comercial-${this.slug(projeto)}-${cliente}.pdf`;
    },

    slug(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "arquivo";
    },

    respostaErro(erro) {
        return {
            sucesso: false,
            modelo: null,
            template: null,
            exportacao: null,
            erros: [erro.message || "Erro ao preparar PDF Comercial."],
            detalhes: {}
        };
    }
};
