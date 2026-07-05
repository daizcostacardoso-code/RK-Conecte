const DocumentService = {
    gerarDocumento(contexto = {}, dependencias = {}) {
        const dados = this.montarDados(contexto, dependencias);
        const modelo = DocumentModel.criar(dados);
        return DocumentBuilder.montarDocumento(modelo);
    },

    validarDocumento(documento = {}) {
        return DocumentValidator.validar(documento);
    },

    prepararExportacao(contexto = {}, dependencias = {}) {
        try {
            const documento = this.gerarDocumento(contexto, dependencias);
            const validacao = this.validarDocumento(documento);

            if (!validacao.valido) {
                return {
                    sucesso: false,
                    documento,
                    exportacao: null,
                    erros: validacao.erros,
                    detalhes: {
                        validacao
                    }
                };
            }

            return {
                sucesso: true,
                documento,
                exportacao: {
                    tipo: "DOCUMENTO_COMERCIAL",
                    status: "PREPARADO",
                    formatosFuturos: documento.metadados.preparadoPara,
                    geracaoEfetiva: false,
                    prontoPara: "PDF_IMPRESSAO_WHATSAPP_EMAIL_WEB"
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

    montarDados(contexto = {}, dependencias = {}) {
        const deps = this.obterDependencias(dependencias);
        const origem = this.obterOrigem(contexto);
        const resumo = origem.resumo || contexto.resumo || this.montarResumoPorOrquestrador(contexto, deps) || {};
        const totais = origem.totais || resumo.totais || {};
        const condicoesComerciais = origem.condicoesComerciais || contexto.condicoesComerciais || resumo.condicoesComerciais || {};

        return {
            empresa: origem.empresa || contexto.empresa || {},
            cliente: origem.cliente || contexto.cliente || resumo.cliente || {},
            projeto: origem.projeto || contexto.projeto || resumo.projeto || {},
            servico: origem.servico || contexto.servico || resumo.servico || {},
            produtos: origem.produtos || contexto.produtos || [],
            totais,
            resumoFinanceiro: this.montarResumoFinanceiro(origem, resumo, totais, contexto, deps),
            observacoes: origem.observacoes || contexto.observacoes || resumo.observacoes || {},
            condicoesComerciais,
            validade: origem.validade || {
                descricao: condicoesComerciais.validadeProposta || ""
            },
            metadados: this.montarMetadados(origem, contexto, deps)
        };
    },

    montarResumoFinanceiro(origem = {}, resumo = {}, totais = {}, contexto = {}, deps = {}) {
        const calculo = origem.calculo || contexto.calculo || {};
        const validacaoCalculo = this.validarCalculo(calculo, deps);

        return {
            quantidadeProdutos: resumo.quantidadeProdutos ?? (origem.produtos || contexto.produtos || []).length,
            subtotal: totais.subtotal,
            desconto: totais.desconto,
            acrescimo: totais.acrescimo,
            totalGeral: totais.totalGeral,
            tipoCalculo: resumo.tipoCalculo || calculo.tipoCalculo || origem.servico?.tipoCalculo || contexto.servico?.tipoCalculo || "",
            status: resumo.status || origem.status || contexto.status || "",
            moeda: totais.moeda || "BRL",
            calculoValido: validacaoCalculo ? validacaoCalculo.valido : null
        };
    },

    montarMetadados(origem = {}, contexto = {}, deps = {}) {
        return {
            origem: "ORCAMENTO_INTELIGENTE",
            preparadoPara: ["PDF", "IMPRESSAO", "WHATSAPP", "EMAIL", "WEB"],
            status: "PREPARADO",
            versaoOrigem: origem.versao || "",
            criadoEm: origem.criadoEm || contexto.criadoEm || "",
            atualizadoEm: origem.atualizadoEm || contexto.atualizadoEm || "",
            dependencias: {
                OrcamentoOrchestrator: !!deps.orcamentoOrchestrator,
                ClienteService: !!deps.clienteService,
                ProjetoService: !!deps.projetoService,
                ServicoService: !!deps.servicoService,
                ProdutoService: !!deps.produtoService,
                CalculoService: !!deps.calculoService
            }
        };
    },

    obterOrigem(contexto = {}) {
        if (contexto && contexto.orcamentoPreparado && typeof contexto.orcamentoPreparado === "object") {
            return contexto.orcamentoPreparado;
        }

        return contexto || {};
    },

    obterDependencias(dependencias = {}) {
        return {
            orcamentoOrchestrator: dependencias.orcamentoOrchestrator || (typeof OrcamentoOrchestrator !== "undefined" ? OrcamentoOrchestrator : null),
            clienteService: dependencias.clienteService || (typeof ClienteService !== "undefined" ? ClienteService : null),
            projetoService: dependencias.projetoService || (typeof ProjetoService !== "undefined" ? ProjetoService : null),
            servicoService: dependencias.servicoService || (typeof ServicoService !== "undefined" ? ServicoService : null),
            produtoService: dependencias.produtoService || (typeof ProdutoService !== "undefined" ? ProdutoService : null),
            calculoService: dependencias.calculoService || (typeof CalculoService !== "undefined" ? CalculoService : null)
        };
    },

    montarResumoPorOrquestrador(contexto = {}, deps = {}) {
        if (!deps.orcamentoOrchestrator || typeof deps.orcamentoOrchestrator.montarResumo !== "function") {
            return null;
        }

        try {
            return deps.orcamentoOrchestrator.montarResumo(contexto);
        } catch (erro) {
            return null;
        }
    },

    validarCalculo(calculo = {}, deps = {}) {
        if (!calculo || !deps.calculoService || typeof deps.calculoService.validar !== "function") {
            return null;
        }

        try {
            return deps.calculoService.validar(calculo);
        } catch (erro) {
            return null;
        }
    },

    respostaErro(erro) {
        return {
            sucesso: false,
            documento: null,
            exportacao: null,
            erros: [erro.message || "Erro ao preparar Documento Comercial."],
            detalhes: {}
        };
    }
};
