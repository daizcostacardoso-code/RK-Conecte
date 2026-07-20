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
        const produtosCalculados = this.obterItensCalculados(origem, contexto);
        const totais = origem.totais || resumo.totais || this.obterTotaisCalculados(origem, contexto) || {};
        const condicoesComerciais = origem.condicoesComerciais || contexto.condicoesComerciais || resumo.condicoesComerciais || {};

        return {
            empresa: origem.empresa || contexto.empresa || {},
            cliente: origem.cliente || contexto.cliente || resumo.cliente || {},
            projeto: this.projetoInformado(origem.projeto || contexto.projeto) ? (origem.projeto || contexto.projeto) : {},
            servico: origem.servico || contexto.servico || resumo.servico || {},
            servicos: origem.servicos || origem.servicosSelecionados || contexto.servicosSelecionados || resumo.servicos || [],
            produtos: produtosCalculados || origem.produtos || contexto.produtos || [],
            totais,
            resumoFinanceiro: this.montarResumoFinanceiro(origem, resumo, totais, contexto, deps),
            observacoes: origem.observacoes || contexto.observacoes || resumo.observacoes || {},
            condicoesComerciais,
            ajustesFinanceiros: origem.ajustesFinanceiros || contexto.ajustesFinanceiros || resumo.ajustesFinanceiros || {},
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
            areaTotalM2: totais.areaTotalM2,
            tipoCalculo: resumo.tipoCalculo || calculo.tipoCalculo || origem.servico?.tipoCalculo || contexto.servico?.tipoCalculo || "",
            status: resumo.status || origem.status || contexto.status || "",
            moeda: totais.moeda || "BRL",
            calculoValido: validacaoCalculo ? validacaoCalculo.valido : null
        };
    },

    projetoInformado(projeto = null) {
        if (!projeto || typeof projeto !== "object" || projeto.manualOrcamento !== true) {
            return false;
        }

        return !!String(projeto.descricao || projeto.nome || projeto.titulo || projeto.numero || "").trim();
    },

    montarMetadados(origem = {}, contexto = {}, deps = {}) {
        const numeroOrcamento = String(
            origem.numero
            || origem.orcamentoNumero
            || contexto.numero
            || contexto.orcamentoNumero
            || contexto.resumo?.numero
            || ""
        ).trim();

        return {
            origem: "ORCAMENTO_INTELIGENTE",
            numeroOrcamento,
            orcamentoNumero: numeroOrcamento,
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

    obterItensCalculados(origem = {}, contexto = {}) {
        const candidatos = [
            origem.resultado?.detalhes?.itens,
            contexto.resultado?.detalhes?.itens,
            origem.calculo?.itens,
            contexto.calculo?.itens
        ];

        return candidatos.find(lista => Array.isArray(lista) && lista.length) || null;
    },

    obterTotaisCalculados(origem = {}, contexto = {}) {
        const candidatos = [
            origem.resultado?.detalhes?.totais,
            contexto.resultado?.detalhes?.totais
        ];

        return candidatos.find(totais => totais && typeof totais === "object") || null;
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
