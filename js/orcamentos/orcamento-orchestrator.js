const OrcamentoOrchestrator = {
    async iniciar(dados = {}) {
        const contexto = OrcamentoFactory.criar(dados);
        return this.respostaSucesso(contexto);
    },

    async selecionarCliente(contexto = {}, entrada) {
        const resultado = await this.resolverCliente(entrada);
        if (!resultado.sucesso) {
            return this.respostaErro(contexto, resultado.erros);
        }

        const atualizado = this.atualizarStatus(
            contexto,
            ORCAMENTO_STATE.CLIENTE_SELECIONADO,
            {
                cliente: resultado.cliente
            },
            "cliente_selecionado",
            "Cliente selecionado para o orcamento.",
            {
                clienteId: resultado.cliente?.id || ""
            }
        );

        return this.respostaSucesso(atualizado);
    },

    async selecionarProjeto(contexto = {}, entrada) {
        const resultado = await this.resolverProjeto(entrada);
        if (!resultado.sucesso) {
            return this.respostaErro(contexto, resultado.erros);
        }

        const workflow = this.obterWorkflowProjeto(resultado.projeto);
        const atualizado = this.atualizarStatus(
            contexto,
            ORCAMENTO_STATE.PROJETO_SELECIONADO,
            {
                projeto: resultado.projeto
            },
            "projeto_selecionado",
            "Projeto selecionado para o orcamento.",
            {
                projetoId: resultado.projeto?.id || "",
                workflow
            }
        );

        return this.respostaSucesso(atualizado);
    },

    async selecionarServico(contexto = {}, entrada) {
        const resultado = await this.resolverServico(entrada);
        if (!resultado.sucesso) {
            return this.respostaErro(contexto, resultado.erros);
        }

        const atualizado = this.atualizarStatus(
            contexto,
            ORCAMENTO_STATE.SERVICO_SELECIONADO,
            {
                servico: resultado.servico
            },
            "servico_selecionado",
            "Servico selecionado para o orcamento.",
            {
                servicoId: resultado.servico?.id || "",
                tipoCalculo: resultado.servico?.tipoCalculo || ""
            }
        );

        return this.respostaSucesso(atualizado);
    },

    async adicionarProduto(contexto = {}, entrada) {
        const resultado = await this.resolverProduto(entrada);
        if (!resultado.sucesso) {
            return this.respostaErro(contexto, resultado.erros);
        }

        const atual = OrcamentoContext.normalizar(contexto);
        const produtos = [...atual.produtos, resultado.produto];
        const atualizado = this.atualizarStatus(
            atual,
            ORCAMENTO_STATE.PRODUTOS_ADICIONADOS,
            {
                produtos
            },
            "produto_adicionado",
            "Produto adicionado ao orcamento.",
            {
                produtoId: resultado.produto?.id || "",
                totalProdutos: produtos.length
            }
        );

        return this.respostaSucesso(atualizado);
    },

    async calcular(contexto = {}, dadosCalculo = {}) {
        const atual = OrcamentoContext.normalizar(contexto);
        const calculo = this.montarCalculo(atual, dadosCalculo);
        const resultado = CalculoService.calcular(calculo);

        if (!resultado.sucesso) {
            const comErro = OrcamentoContext.atualizar(atual, {
                calculo,
                resultado
            });
            return this.respostaErro(comErro, resultado.detalhes?.erros || ["Erro ao calcular orcamento."]);
        }

        const atualizado = this.atualizarStatus(
            atual,
            ORCAMENTO_STATE.CALCULADO,
            {
                calculo,
                resultado
            },
            "orcamento_calculado",
            "Orcamento calculado pelo motor comercial.",
            {
                tipo: resultado.tipo,
                valorCalculado: resultado.valorCalculado,
                unidade: resultado.unidade
            }
        );

        return this.respostaSucesso(atualizado);
    },

    async validar(contexto = {}) {
        const atual = OrcamentoContext.normalizar(contexto);
        const erros = [];

        if (!atual.cliente) {
            erros.push("Cliente e obrigatorio para validar o orcamento.");
        }

        if (!atual.projeto) {
            erros.push("Projeto e obrigatorio para validar o orcamento.");
        }

        if (!atual.servico) {
            erros.push("Servico e obrigatorio para validar o orcamento.");
        }

        if (!atual.calculo) {
            erros.push("Calculo e obrigatorio para validar o orcamento.");
        } else {
            const validacaoCalculo = CalculoService.validar(atual.calculo);
            if (!validacaoCalculo.valido) {
                erros.push(...validacaoCalculo.erros);
            }
        }

        if (!atual.resultado || atual.resultado.sucesso !== true) {
            erros.push("Resultado de calculo valido e obrigatorio.");
        }

        const workflow = this.obterWorkflowProjeto(atual.projeto);

        if (erros.length) {
            return this.respostaErro(atual, erros, { workflow });
        }

        const atualizado = this.atualizarStatus(
            atual,
            ORCAMENTO_STATE.VALIDADO,
            {},
            "orcamento_validado",
            "Orcamento validado pelo orquestrador.",
            {
                workflow
            }
        );

        return this.respostaSucesso(atualizado, { workflow });
    },

    async finalizar(contexto = {}) {
        const validacao = await this.validar(contexto);
        if (!validacao.sucesso) {
            return validacao;
        }

        const atualizado = this.atualizarStatus(
            validacao.contexto,
            ORCAMENTO_STATE.FINALIZADO,
            {},
            "orcamento_finalizado",
            "Orcamento finalizado pelo orquestrador.",
            {
                projetoId: validacao.contexto.projeto?.id || "",
                valorCalculado: validacao.contexto.resultado?.valorCalculado || 0
            }
        );

        return this.respostaSucesso(atualizado);
    },

    montarCalculo(contexto = {}, dadosCalculo = {}) {
        const produtoReferencia = Array.isArray(contexto.produtos) ? contexto.produtos[0] : null;

        return {
            ...(contexto.calculo || {}),
            tipoCalculo: dadosCalculo.tipoCalculo
                || contexto.calculo?.tipoCalculo
                || contexto.servico?.tipoCalculo
                || produtoReferencia?.tipoCalculo
                || CalculoModel.tipos.PERSONALIZADO,
            quantidade: dadosCalculo.quantidade ?? contexto.calculo?.quantidade ?? 1,
            largura: dadosCalculo.largura ?? contexto.calculo?.largura ?? 0,
            altura: dadosCalculo.altura ?? contexto.calculo?.altura ?? 0,
            comprimento: dadosCalculo.comprimento ?? contexto.calculo?.comprimento ?? 0,
            valorUnitario: dadosCalculo.valorUnitario
                ?? contexto.calculo?.valorUnitario
                ?? produtoReferencia?.precoVenda
                ?? 0,
            perdaPercentual: dadosCalculo.perdaPercentual ?? contexto.calculo?.perdaPercentual ?? 0,
            desconto: dadosCalculo.desconto ?? contexto.calculo?.desconto ?? 0,
            acrescimo: dadosCalculo.acrescimo ?? contexto.calculo?.acrescimo ?? 0,
            resultado: dadosCalculo.resultado ?? contexto.calculo?.resultado ?? 0,
            observacoes: dadosCalculo.observacoes ?? contexto.calculo?.observacoes ?? ""
        };
    },

    async resolverCliente(entrada) {
        return this.resolverPorService(
            entrada,
            typeof ClienteService !== "undefined" ? ClienteService : null,
            "buscarCliente",
            "cliente",
            "Cliente nao encontrado."
        );
    },

    async resolverProjeto(entrada) {
        if (entrada && typeof entrada === "object") {
            return {
                sucesso: true,
                projeto: entrada,
                erros: []
            };
        }

        const id = this.obterId(entrada);

        if (id && typeof ProjetoService !== "undefined" && typeof ProjetoService.carregar === "function") {
            try {
                const projeto = await ProjetoService.carregar(id);
                if (projeto) {
                    return {
                        sucesso: true,
                        projeto,
                        erros: []
                    };
                }
            } catch (erro) {
                return {
                    sucesso: false,
                    projeto: null,
                    erros: [erro.message || "Erro ao buscar Projeto."]
                };
            }
        }

        return {
            sucesso: false,
            projeto: null,
            erros: ["Projeto nao encontrado."]
        };
    },

    async resolverServico(entrada) {
        return this.resolverPorService(
            entrada,
            typeof ServicoService !== "undefined" ? ServicoService : null,
            "buscarServico",
            "servico",
            "Servico nao encontrado."
        );
    },

    async resolverProduto(entrada) {
        return this.resolverPorService(
            entrada,
            typeof ProdutoService !== "undefined" ? ProdutoService : null,
            "buscarProduto",
            "produto",
            "Produto nao encontrado."
        );
    },

    async resolverPorService(entrada, service, metodo, chave, mensagemNaoEncontrado) {
        const id = this.obterId(entrada);

        if (id && service && typeof service[metodo] === "function") {
            const resultado = await service[metodo](id);
            if (resultado?.sucesso && resultado[chave]) {
                return {
                    sucesso: true,
                    [chave]: resultado[chave],
                    erros: []
                };
            }

            return {
                sucesso: false,
                [chave]: null,
                erros: resultado?.erros || [mensagemNaoEncontrado]
            };
        }

        if (entrada && typeof entrada === "object") {
            return {
                sucesso: true,
                [chave]: entrada,
                erros: []
            };
        }

        return {
            sucesso: false,
            [chave]: null,
            erros: [mensagemNaoEncontrado]
        };
    },

    obterWorkflowProjeto(projeto = {}) {
        if (!projeto) {
            return {
                estadoAtual: "",
                proximosEstados: []
            };
        }

        const estadoAtual = projeto.status || projeto.estado || (typeof WORKFLOW_STATE !== "undefined" ? WORKFLOW_STATE.RASCUNHO : "rascunho");
        const proximosEstados = typeof WorkflowEngine !== "undefined" && typeof WorkflowEngine.obterProximosEstados === "function"
            ? WorkflowEngine.obterProximosEstados(estadoAtual)
            : [];

        return {
            estadoAtual,
            proximosEstados
        };
    },

    atualizarStatus(contexto, status, alteracoes, tipoEvento, descricaoEvento, dadosEvento = {}) {
        const atual = OrcamentoContext.normalizar(contexto);
        const proximoStatus = OrcamentoState.podeAvancar(atual.status, status) ? status : atual.status;

        return OrcamentoContext.atualizar(
            atual,
            {
                ...alteracoes,
                status: proximoStatus
            },
            {
                tipo: tipoEvento,
                descricao: descricaoEvento,
                dados: {
                    statusAnterior: atual.status,
                    statusNovo: proximoStatus,
                    ...dadosEvento
                }
            }
        );
    },

    obterId(entrada) {
        if (!entrada) return "";
        if (typeof entrada === "string") return entrada;
        if (typeof entrada === "number") return String(entrada);
        return entrada.id || entrada.clienteId || entrada.projetoId || entrada.servicoId || entrada.produtoId || "";
    },

    respostaSucesso(contexto, detalhes = {}) {
        return {
            sucesso: true,
            contexto: OrcamentoContext.normalizar(contexto),
            erros: [],
            detalhes
        };
    },

    respostaErro(contexto, erros = [], detalhes = {}) {
        return {
            sucesso: false,
            contexto: OrcamentoContext.normalizar(contexto),
            erros: Array.isArray(erros) ? erros : [String(erros || "Erro no orquestrador de orcamento.")],
            detalhes
        };
    }
};
