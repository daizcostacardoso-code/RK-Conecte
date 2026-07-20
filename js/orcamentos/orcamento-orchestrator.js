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
                cliente: resultado.cliente,
                projeto: null,
                servico: null,
                servicosSelecionados: [],
                produtos: [],
                calculo: null,
                resultado: null,
                ajustesFinanceiros: {},
                resumo: null,
                validacaoFinal: null,
                orcamentoPreparado: null
            },
            "cliente_selecionado",
            "Cliente selecionado para o orcamento.",
            {
                clienteId: resultado.cliente?.id || ""
            },
            {
                permitirRetorno: true
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
                projeto: resultado.projeto,
                servico: null,
                servicosSelecionados: [],
                produtos: [],
                calculo: null,
                resultado: null,
                ajustesFinanceiros: {},
                resumo: null,
                validacaoFinal: null,
                orcamentoPreparado: null
            },
            "projeto_selecionado",
            "Projeto selecionado para o orcamento.",
            {
                projetoId: resultado.projeto?.id || "",
                workflow
            },
            {
                permitirRetorno: true
            }
        );

        return this.respostaSucesso(atualizado);
    },

    async selecionarServico(contexto = {}, entrada) {
        if (Array.isArray(entrada)) {
            return this.selecionarServicos(contexto, entrada);
        }

        const resultado = await this.resolverServico(entrada);
        if (!resultado.sucesso) {
            return this.respostaErro(contexto, resultado.erros);
        }

        return this.selecionarServicos(contexto, [resultado.servico]);
    },

    async selecionarServicos(contexto = {}, entradas = []) {
        const servicos = this.normalizarServicosSelecionados(entradas);

        if (!servicos.length) {
            return this.respostaErro(contexto, ["Selecione pelo menos um tipo de servico."]);
        }

        const atual = OrcamentoContext.normalizar(contexto);
        const servicoAgregado = this.montarServicoAgregado(servicos);
        const gruposAtivos = new Set(servicos.map(servico => servico.id));
        const produtosMantidos = atual.produtos.filter(produto => gruposAtivos.has(this.normalizarChave(produto.grupoServico || produto.categoria)));
        const atualizado = this.atualizarStatus(
            atual,
            ORCAMENTO_STATE.SERVICO_SELECIONADO,
            {
                servico: servicoAgregado,
                servicosSelecionados: servicos,
                produtos: produtosMantidos,
                calculo: null,
                resultado: null,
                ajustesFinanceiros: {},
                resumo: null,
                validacaoFinal: null,
                orcamentoPreparado: null
            },
            "servico_selecionado",
            "Tipos de servico selecionados para o orcamento.",
            {
                servicoId: servicoAgregado.id,
                servicos: servicos.map(servico => servico.id),
                tipoCalculo: servicoAgregado.tipoCalculo || ""
            },
            {
                permitirRetorno: true
            }
        );

        if (produtosMantidos.length) {
            return this.recalcularProdutos(
                atualizado,
                produtosMantidos,
                "servicos_recalculados",
                "Itens mantidos apos ajuste dos tipos de servico.",
                {
                    totalProdutos: produtosMantidos.length
                }
            );
        }

        return this.respostaSucesso(atualizado);
    },

    async adicionarProduto(contexto = {}, entrada) {
        const resultado = await this.resolverProduto(entrada);
        if (!resultado.sucesso) {
            return this.respostaErro(contexto, resultado.erros);
        }

        const atual = OrcamentoContext.normalizar(contexto);
        const item = this.montarItemOrcamento(resultado.produto, entrada, atual.produtos.length);
        const produtos = [...atual.produtos, item];

        return this.recalcularProdutos(
            atual,
            produtos,
            "produto_adicionado",
            "Item adicionado ao orcamento.",
            {
                produtoId: resultado.produto?.id || "",
                itemId: item.itemId || "",
                totalProdutos: produtos.length
            }
        );
    },

    async removerProduto(contexto = {}, entrada) {
        const atual = OrcamentoContext.normalizar(contexto);
        const produtos = [...atual.produtos];
        const indice = this.obterIndiceProduto(produtos, entrada);

        if (indice < 0) {
            return this.respostaErro(atual, ["Produto nao encontrado no orcamento."]);
        }

        const [produtoRemovido] = produtos.splice(indice, 1);
        const status = produtos.length
            ? ORCAMENTO_STATE.PRODUTOS_ADICIONADOS
            : ORCAMENTO_STATE.SERVICO_SELECIONADO;

        if (!produtos.length) {
            const atualizado = this.atualizarStatus(
                atual,
                status,
                {
                    produtos,
                    calculo: null,
                    resultado: null,
                    resumo: null,
                    validacaoFinal: null,
                    orcamentoPreparado: null
                },
                "produto_removido",
                "Item removido do orcamento.",
                {
                    produtoId: produtoRemovido?.id || produtoRemovido?.produtoId || "",
                    totalProdutos: produtos.length
                },
                {
                    permitirRetorno: true
                }
            );

            return this.respostaSucesso(atualizado);
        }

        return this.recalcularProdutos(
            atual,
            produtos,
            "produto_removido",
            "Item removido do orcamento.",
            {
                produtoId: produtoRemovido?.id || produtoRemovido?.produtoId || "",
                totalProdutos: produtos.length
            }
        );
    },

    async calcular(contexto = {}, dadosCalculo = {}) {
        const atual = OrcamentoContext.normalizar(contexto);
        const itensEntrada = Array.isArray(dadosCalculo.itens) ? dadosCalculo.itens : atual.produtos;
        const ajustesFinanceiros = OrcamentoContext.normalizarAjustesFinanceiros({
            ...atual.ajustesFinanceiros,
            ...(dadosCalculo.ajustesFinanceiros || dadosCalculo.ajustes || {}),
            descontoTipo: dadosCalculo.descontoTipo ?? dadosCalculo.tipoDesconto ?? atual.ajustesFinanceiros?.descontoTipo,
            descontoValor: dadosCalculo.descontoValor ?? dadosCalculo.desconto ?? atual.ajustesFinanceiros?.descontoValor,
            acrescimoTipo: dadosCalculo.acrescimoTipo ?? dadosCalculo.tipoAcrescimo ?? atual.ajustesFinanceiros?.acrescimoTipo,
            acrescimoValor: dadosCalculo.acrescimoValor ?? dadosCalculo.acrescimo ?? atual.ajustesFinanceiros?.acrescimoValor
        });
        const calculo = this.montarCalculo(
            {
                ...atual,
                produtos: itensEntrada,
                ajustesFinanceiros
            },
            dadosCalculo
        );
        const resultado = CalculoService.calcularItens({
            itens: calculo.itens,
            ajustes: ajustesFinanceiros
        });

        if (!resultado.sucesso) {
            const comErro = OrcamentoContext.atualizar(atual, {
                calculo,
                resultado
            });
            return this.respostaErro(comErro, resultado.detalhes?.erros || ["Erro ao calcular orcamento."]);
        }

        const itensCalculados = resultado.detalhes?.itens || calculo.itens;

        const atualizado = this.atualizarStatus(
            atual,
            ORCAMENTO_STATE.CALCULADO,
            {
                produtos: itensCalculados,
                calculo,
                resultado,
                ajustesFinanceiros,
                resumo: this.montarResumo({
                    ...atual,
                    produtos: itensCalculados,
                    calculo,
                    resultado,
                    ajustesFinanceiros
                }),
                validacaoFinal: null,
                orcamentoPreparado: null
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

    async atualizarItens(contexto = {}, entrada = {}) {
        const atual = OrcamentoContext.normalizar(contexto);
        const itens = Array.isArray(entrada.itens) ? entrada.itens : [];
        const produtos = itens.map((item, indice) => {
            const existente = this.obterItemExistente(atual.produtos, item, indice);
            const produto = existente?.produto || this.obterProdutoContexto(atual.produtos, item) || {};
            return this.montarItemOrcamento(produto, {
                ...existente,
                ...item,
                produto
            }, indice);
        });

        if (!produtos.length) {
            const atualizado = OrcamentoContext.atualizar(atual, {
                produtos: [],
                calculo: null,
                resultado: null,
                resumo: null,
                validacaoFinal: null,
                orcamentoPreparado: null
            });

            return this.respostaSucesso(atualizado);
        }

        return this.recalcularProdutos(
            atual,
            produtos,
            "itens_atualizados",
            "Itens do orcamento atualizados.",
            {
                totalProdutos: produtos.length
            }
        );
    },

    async validar(contexto = {}) {
        const atual = OrcamentoContext.normalizar(contexto);
        const erros = [];

        if (!atual.cliente) {
            erros.push("Cliente e obrigatorio para validar o orcamento.");
        }

        if (!atual.servico && !atual.servicosSelecionados.length) {
            erros.push("Pelo menos um tipo de servico e obrigatorio para validar o orcamento.");
        }

        if (!Array.isArray(atual.produtos) || !atual.produtos.length) {
            erros.push("Pelo menos um produto e obrigatorio para validar o orcamento.");
        }

        if (!atual.calculo) {
            erros.push("Calculo e obrigatorio para validar o orcamento.");
        } else if (Array.isArray(atual.calculo.itens)) {
            const validacaoItens = CalculoService.validarItens({
                itens: atual.produtos,
                ajustes: atual.ajustesFinanceiros
            });

            if (!validacaoItens.valido) {
                erros.push(...validacaoItens.erros);
            }
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
            const comValidacao = OrcamentoContext.atualizar(atual, {
                validacaoFinal: {
                    valido: false,
                    erros
                }
            });
            return this.respostaErro(comValidacao, erros, { workflow });
        }

        const atualizado = this.atualizarStatus(
            atual,
            ORCAMENTO_STATE.VALIDADO,
            {
                resumo: this.montarResumo(atual),
                validacaoFinal: {
                    valido: true,
                    erros: []
                }
            },
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

        const contextoFinal = {
            ...validacao.contexto,
            status: ORCAMENTO_STATE.FINALIZADO
        };
        const resumo = this.montarResumo(contextoFinal);
        const atualizado = this.atualizarStatus(
            validacao.contexto,
            ORCAMENTO_STATE.FINALIZADO,
            {
                resumo,
                orcamentoPreparado: null,
                validacaoFinal: {
                    valido: true,
                    erros: []
                }
            },
            "orcamento_finalizado",
            "Orcamento finalizado pelo orquestrador.",
            {
                projetoId: validacao.contexto.projeto?.id || "",
                valorCalculado: validacao.contexto.resultado?.valorCalculado || 0
            }
        );

        const finalizado = OrcamentoContext.atualizar(atualizado, {
            orcamentoPreparado: this.montarOrcamentoPreparado(atualizado, resumo)
        });

        return this.respostaSucesso(finalizado);
    },

    async atualizarComplementos(contexto = {}, dados = {}) {
        const atual = OrcamentoContext.normalizar(contexto);
        const ajustesFinanceiros = OrcamentoContext.normalizarAjustesFinanceiros({
            ...atual.ajustesFinanceiros,
            ...(dados.ajustesFinanceiros || dados.ajustes || {})
        });
        const complementado = {
            ...atual,
            ajustesFinanceiros,
            observacoes: {
                ...atual.observacoes,
                ...(dados.observacoes || {})
            },
            condicoesComerciais: {
                ...atual.condicoesComerciais,
                ...(dados.condicoesComerciais || {})
            }
        };
        const calculado = await this.calcular(complementado, { ajustesFinanceiros });
        const base = calculado.sucesso ? calculado.contexto : complementado;
        const atualizado = OrcamentoContext.atualizar(
            base,
            {
                ajustesFinanceiros,
                observacoes: complementado.observacoes,
                condicoesComerciais: complementado.condicoesComerciais,
                resumo: this.montarResumo({
                    ...base,
                    ajustesFinanceiros,
                    observacoes: complementado.observacoes,
                    condicoesComerciais: complementado.condicoesComerciais
                }),
                orcamentoPreparado: null
            },
            {
                tipo: "orcamento_complementos_atualizados",
                descricao: "Complementos do orcamento atualizados.",
                dados: {
                    possuiObservacoes: !!dados.observacoes,
                    possuiCondicoes: !!dados.condicoesComerciais,
                    possuiAjustes: !!(dados.ajustesFinanceiros || dados.ajustes)
                }
            }
        );

        return this.respostaSucesso(atualizado);
    },

    montarResumo(contexto = {}) {
        const atual = OrcamentoContext.normalizar(contexto);
        const produtos = Array.isArray(atual.produtos) ? atual.produtos : [];
        const totais = this.montarTotais(atual);
        const servicosSelecionados = this.normalizarServicosSelecionados(atual.servicosSelecionados.length ? atual.servicosSelecionados : atual.servico ? [atual.servico] : []);
        const servicoResumo = servicosSelecionados.length ? this.montarServicoAgregado(servicosSelecionados) : (atual.servico || {});

        return {
            numero: atual.numero || "",
            cliente: {
                id: atual.cliente?.id || "",
                nome: atual.cliente?.nome || atual.cliente?.nomeFantasia || ""
            },
            projeto: {
                id: atual.projeto?.id || "",
                nome: atual.projeto?.titulo || atual.projeto?.numero || atual.projeto?.codigo || ""
            },
            servico: {
                id: servicoResumo.id || "",
                nome: servicoResumo.nome || "",
                tipoCalculo: atual.calculo?.tipoCalculo || servicoResumo.tipoCalculo || ""
            },
            servicos: servicosSelecionados,
            tiposServico: servicosSelecionados.map(servico => servico.nome).filter(Boolean),
            quantidadeProdutos: produtos.length,
            valorTotal: totais.totalGeral,
            areaTotalM2: totais.areaTotalM2 || 0,
            tipoCalculo: atual.calculo?.tipoCalculo || servicoResumo.tipoCalculo || "",
            status: atual.status,
            itens: produtos,
            totais,
            ajustesFinanceiros: atual.ajustesFinanceiros,
            observacoes: atual.observacoes,
            condicoesComerciais: atual.condicoesComerciais
        };
    },

    montarTotais(contexto = {}) {
        const resultado = contexto.resultado || {};
        const detalhes = resultado.detalhes || {};
        const totaisResultado = detalhes.totais || {};
        const subtotal = this.numero(totaisResultado.subtotal ?? detalhes.subtotal ?? resultado.valorCalculado);

        return {
            subtotal,
            totalAdicionais: this.numero(totaisResultado.totalAdicionais ?? detalhes.totalAdicionais),
            totalAluminio: this.numero(totaisResultado.totalAluminio ?? detalhes.totalAluminio),
            totalJato: this.numero(totaisResultado.totalJato ?? detalhes.totalJato),
            desconto: this.numero(totaisResultado.desconto ?? detalhes.desconto),
            acrescimo: this.numero(totaisResultado.acrescimo ?? detalhes.acrescimo),
            totalGeral: this.numero(totaisResultado.totalGeral ?? detalhes.totalGeral ?? resultado.valorCalculado),
            areaTotalM2: this.numero(totaisResultado.areaTotalM2 ?? detalhes.areaTotalM2),
            moeda: totaisResultado.moeda || detalhes.moeda || "BRL"
        };
    },

    montarOrcamentoPreparado(contexto = {}, resumo = null) {
        const atual = OrcamentoContext.normalizar(contexto);
        const resumoFinal = resumo || this.montarResumo(atual);
        const numero = atual.numero || resumoFinal.numero || "";

        return {
            numero,
            orcamentoNumero: numero,
            preparadoPara: "PDF_COMERCIAL",
            versao: "5.2.1",
            status: atual.status,
            geradoEm: OrcamentoContext.agoraISO(),
            cliente: atual.cliente,
            projeto: atual.projeto,
            servico: atual.servico,
            servicosSelecionados: atual.servicosSelecionados,
            servicos: atual.servicosSelecionados,
            produtos: atual.produtos,
            calculo: atual.calculo,
            resultado: atual.resultado,
            totais: resumoFinal.totais,
            ajustesFinanceiros: atual.ajustesFinanceiros,
            observacoes: atual.observacoes,
            condicoesComerciais: atual.condicoesComerciais,
            historico: atual.historico,
            resumo: resumoFinal
        };
    },

    montarCalculo(contexto = {}, dadosCalculo = {}) {
        const itens = this.normalizarItensParaCalculo(
            Array.isArray(dadosCalculo.itens) ? dadosCalculo.itens : contexto.produtos,
            contexto
        );
        const ajustesFinanceiros = OrcamentoContext.normalizarAjustesFinanceiros({
            ...contexto.ajustesFinanceiros,
            ...(dadosCalculo.ajustesFinanceiros || dadosCalculo.ajustes || {})
        });

        return {
            ...(contexto.calculo || {}),
            tipoCalculo: "ORCAMENTO_ITENS",
            itens,
            ajustesFinanceiros,
            descontoTipo: ajustesFinanceiros.descontoTipo,
            descontoValor: ajustesFinanceiros.descontoValor,
            acrescimoTipo: ajustesFinanceiros.acrescimoTipo,
            acrescimoValor: ajustesFinanceiros.acrescimoValor,
            observacoes: dadosCalculo.observacoes ?? contexto.calculo?.observacoes ?? ""
        };
    },

    recalcularProdutos(contexto = {}, produtos = [], tipoEvento = "itens_atualizados", descricaoEvento = "Itens atualizados.", dadosEvento = {}) {
        const atual = OrcamentoContext.normalizar(contexto);
        const ajustesFinanceiros = atual.ajustesFinanceiros;
        const calculo = this.montarCalculo({
            ...atual,
            produtos,
            ajustesFinanceiros
        });
        const resultado = CalculoService.calcularItens({
            itens: calculo.itens,
            ajustes: ajustesFinanceiros
        });

        if (!resultado.sucesso) {
            const comErro = OrcamentoContext.atualizar(atual, {
                produtos,
                calculo,
                resultado,
                resumo: this.montarResumo({
                    ...atual,
                    produtos,
                    calculo,
                    resultado,
                    ajustesFinanceiros
                }),
                validacaoFinal: null,
                orcamentoPreparado: null
            });

            return this.respostaErro(comErro, resultado.detalhes?.erros || ["Erro ao calcular itens do orcamento."]);
        }

        const itensCalculados = resultado.detalhes?.itens || produtos;
        const atualizado = this.atualizarStatus(
            atual,
            ORCAMENTO_STATE.CALCULADO,
            {
                produtos: itensCalculados,
                calculo: {
                    ...calculo,
                    itens: itensCalculados
                },
                resultado,
                resumo: this.montarResumo({
                    ...atual,
                    produtos: itensCalculados,
                    calculo: {
                        ...calculo,
                        itens: itensCalculados
                    },
                    resultado,
                    ajustesFinanceiros
                }),
                validacaoFinal: null,
                orcamentoPreparado: null
            },
            tipoEvento,
            descricaoEvento,
            dadosEvento,
            {
                permitirRetorno: true
            }
        );

        return this.respostaSucesso(atualizado);
    },

    normalizarItensParaCalculo(itens = [], contexto = {}) {
        const lista = Array.isArray(itens) ? itens : [];

        return lista.map((item, indice) => {
            const produto = item.produto || this.obterProdutoContexto(contexto.produtos, item) || {};
            return this.montarItemOrcamento(produto, item, indice);
        });
    },

    montarItemOrcamento(produto = {}, entrada = {}, indice = 0) {
        const origem = entrada && typeof entrada === "object" ? entrada : {};
        const itemId = origem.itemId || origem.orcamentoItemId || `orc_item_${Date.now()}_${indice}_${Math.random().toString(36).slice(2, 7)}`;
        const unidade = origem.unidade || produto.unidadeVenda || (produto.tipoCalculo === "unidade" ? "un" : "m2");
        const grupoServico = this.normalizarChave(origem.grupoServico || produto.categoria || origem.categoria || "outros");
        const servicoConfig = this.obterServicoConfig(grupoServico);
        const tipoConfig = this.obterTipoItemConfig(grupoServico, origem.tipoItem || produto.subcategoria || origem.subcategoria);
        const tipoItem = tipoConfig?.id || this.texto(origem.tipoItem || produto.subcategoria || origem.subcategoria);
        const tipoItemNome = this.texto(origem.tipoItemNome || tipoConfig?.nome || origem.tipoItem || produto.nome || origem.descricao);
        const subtipoItem = this.texto(origem.subtipoItem || origem.subtipo || origem.subcategoria);
        const permitePadrao = this.permiteTamanhoPadrao(grupoServico);
        const tipoDimensao = this.normalizarTipoDimensao(origem.tipoDimensao, grupoServico);
        const tamanhoPadrao = tipoDimensao === "padrao"
            ? this.obterTamanhoPadraoConfig(grupoServico, origem.tamanhoPadraoSelecionado || origem.tamanhoPadraoId)
            : null;
        const larguraCm = tamanhoPadrao?.larguraCm ?? this.numero(origem.larguraCm ?? origem.largura, 0);
        const alturaCm = tamanhoPadrao?.alturaCm ?? this.numero(origem.alturaCm ?? origem.altura, 0);
        const dependencias = this.normalizarDependencias(origem.dependencias, grupoServico, tipoItem);

        return {
            itemId,
            orcamentoItemId: itemId,
            id: produto.id || origem.id || "",
            produtoId: produto.id || origem.produtoId || origem.id || "",
            itemProntoId: this.texto(origem.itemProntoId || origem.itemCadastroId),
            itemCadastroId: this.texto(origem.itemCadastroId || origem.itemProntoId),
            produto,
            nome: this.texto(origem.nome || tipoItemNome || produto.nome || origem.descricao || `Item ${indice + 1}`),
            descricao: this.texto(origem.descricao || this.montarDescricaoItem({ tipoItemNome, subtipoItem }) || produto.descricao || produto.nome || `Item ${indice + 1}`),
            categoria: this.texto(origem.categoria || produto.categoria || grupoServico),
            subcategoria: this.texto(origem.subcategoria || produto.subcategoria || tipoItem),
            grupoServico,
            grupoServicoNome: this.texto(origem.grupoServicoNome || servicoConfig?.nome || grupoServico),
            tipoItem,
            tipoItemNome,
            subtipoItem,
            dependencias,
            tipoCalculo: origem.tipoCalculo || produto.tipoCalculo || (unidade === "un" ? "unidade" : "area_m2"),
            tipoDimensao,
            tamanhoPadraoSelecionado: tamanhoPadrao?.id || this.texto(origem.tamanhoPadraoSelecionado || origem.tamanhoPadraoId),
            tamanhoPadraoNome: tamanhoPadrao?.nome || this.texto(origem.tamanhoPadraoNome),
            larguraCm,
            alturaCm,
            quantidade: this.numero(origem.quantidade, 1),
            unidade,
            valorUnitario: this.numero(origem.valorUnitario ?? produto.precoVenda ?? produto.valorVenda ?? this.obterValorUnitarioPadrao(grupoServico), 0),
            valorAdicional: this.numero(origem.valorAdicional, 0),
            descricaoAdicional: this.texto(origem.descricaoAdicional),
            valorAluminio: this.numero(origem.valorAluminio, 0),
            totalAluminio: this.numero(origem.totalAluminio, 0),
            valorJato: this.numero(origem.valorJato ?? origem.adicionalJato, 0),
            areaM2: this.numero(origem.areaM2, 0),
            subtotalBase: this.numero(origem.subtotalBase, 0),
            subtotalFinal: this.numero(origem.subtotalFinal ?? origem.valorTotal ?? origem.total ?? origem.totalGeral ?? origem.subtotal, 0),
            subtotal: this.numero(origem.subtotalFinal ?? origem.valorTotal ?? origem.total ?? origem.totalGeral ?? origem.subtotal, 0),
            valorTotal: this.numero(origem.subtotalFinal ?? origem.valorTotal ?? origem.total ?? origem.totalGeral ?? origem.subtotal, 0),
            observacoes: this.texto(origem.observacoes || origem.observacao),
            observacao: this.texto(origem.observacao || origem.observacoes),
            permiteTamanhoPadrao: permitePadrao
        };
    },

    normalizarServicosSelecionados(entradas = []) {
        const lista = Array.isArray(entradas) ? entradas : [entradas];
        const vistos = new Set();

        return lista
            .map(entrada => this.normalizarServicoSelecionado(entrada))
            .filter(servico => {
                if (!servico.id || vistos.has(servico.id)) {
                    return false;
                }

                vistos.add(servico.id);
                return true;
            });
    },

    normalizarServicoSelecionado(entrada = {}) {
        const config = typeof OrcamentoItemConfig !== "undefined" ? OrcamentoItemConfig : null;
        const idEntrada = this.normalizarChave(
            typeof entrada === "object"
                ? entrada.id || entrada.grupoServico || entrada.categoria || entrada.nome
                : entrada
        );
        const servicoConfig = config && typeof config.obterServico === "function" ? config.obterServico(idEntrada) : null;

        if (servicoConfig) {
            return {
                id: servicoConfig.id,
                nome: servicoConfig.nome,
                plural: servicoConfig.plural || servicoConfig.nome,
                itemSingular: servicoConfig.itemSingular || servicoConfig.nome,
                tipoCalculo: "ORCAMENTO_ITENS",
                unidadeVenda: "m2",
                categoria: servicoConfig.id,
                descricao: `Tipo de servico: ${servicoConfig.nome}`
            };
        }

        if (entrada && typeof entrada === "object") {
            return {
                ...entrada,
                id: idEntrada || this.normalizarChave(entrada.nome),
                nome: this.texto(entrada.nome || entrada.rotulo || entrada.id),
                tipoCalculo: entrada.tipoCalculo || "ORCAMENTO_ITENS",
                unidadeVenda: entrada.unidadeVenda || "m2",
                categoria: entrada.categoria || idEntrada
            };
        }

        return {
            id: idEntrada,
            nome: this.texto(entrada),
            tipoCalculo: "ORCAMENTO_ITENS",
            unidadeVenda: "m2",
            categoria: idEntrada
        };
    },

    montarServicoAgregado(servicos = []) {
        const lista = this.normalizarServicosSelecionados(servicos);
        const nomes = lista.map(servico => servico.nome).filter(Boolean);

        return {
            id: nomes.length > 1 ? "multiplos_servicos" : lista[0]?.id || "",
            nome: nomes.join(", "),
            categoria: nomes.length > 1 ? "multiplos" : lista[0]?.categoria || lista[0]?.id || "",
            tipoCalculo: "ORCAMENTO_ITENS",
            unidadeVenda: "m2",
            descricao: nomes.length ? `Tipos de servico: ${nomes.join(", ")}` : ""
        };
    },

    obterServicoConfig(grupoServico) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterServico === "function") {
            return OrcamentoItemConfig.obterServico(grupoServico);
        }

        return null;
    },

    obterTipoItemConfig(grupoServico, tipoItem) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterTipoItem === "function") {
            return OrcamentoItemConfig.obterTipoItem(grupoServico, tipoItem);
        }

        return null;
    },

    obterTamanhoPadraoConfig(grupoServico, tamanhoId) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterTamanhoPadrao === "function") {
            return OrcamentoItemConfig.obterTamanhoPadrao(grupoServico, tamanhoId);
        }

        return null;
    },

    permiteTamanhoPadrao(grupoServico) {
        return typeof OrcamentoItemConfig !== "undefined"
            && typeof OrcamentoItemConfig.permiteTamanhoPadrao === "function"
            && OrcamentoItemConfig.permiteTamanhoPadrao(grupoServico);
    },

    obterValorUnitarioPadrao(grupoServico) {
        return typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterValorUnitarioPadrao === "function"
            ? OrcamentoItemConfig.obterValorUnitarioPadrao(grupoServico)
            : 0;
    },

    normalizarTipoDimensao(tipoDimensao, grupoServico) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.normalizarTipoDimensao === "function") {
            return OrcamentoItemConfig.normalizarTipoDimensao(tipoDimensao, grupoServico);
        }

        const valor = this.normalizarChave(tipoDimensao);
        return valor === "padrao" ? "padrao" : "engenharia";
    },

    normalizarDependencias(dependencias, grupoServico, tipoItem) {
        if (Array.isArray(dependencias) && dependencias.length) {
            return dependencias.map(dep => this.texto(dep)).filter(Boolean);
        }

        if (typeof dependencias === "string" && dependencias.trim()) {
            return dependencias.split(",").map(dep => this.texto(dep)).filter(Boolean);
        }

        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterDependencias === "function") {
            return OrcamentoItemConfig.obterDependencias(grupoServico, tipoItem);
        }

        return [];
    },

    montarDescricaoItem(item = {}) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.montarDescricaoItem === "function") {
            return OrcamentoItemConfig.montarDescricaoItem(item);
        }

        return [item.tipoItemNome || item.tipoItem, item.subtipoItem].filter(Boolean).join(" - ");
    },

    normalizarChave(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    },

    obterItemExistente(produtos = [], item = {}, indice = 0) {
        const itemId = item.itemId || item.orcamentoItemId || "";
        const produtoId = item.produtoId || item.id || "";

        if (itemId) {
            const porItem = produtos.find(produto => (produto.itemId || produto.orcamentoItemId) === itemId);
            if (porItem) return porItem;
        }

        if (produtoId) {
            const porProduto = produtos.find(produto => (produto.produtoId || produto.id) === produtoId);
            if (porProduto) return porProduto;
        }

        return produtos[indice] || null;
    },

    obterProdutoContexto(produtos = [], item = {}) {
        const existente = this.obterItemExistente(produtos, item);
        return existente?.produto || existente || {};
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
        const id = this.obterId(entrada);
        const servicoConfig = this.obterServicoConfig(id || entrada);

        if (servicoConfig) {
            return {
                sucesso: true,
                servico: this.normalizarServicoSelecionado(servicoConfig),
                erros: []
            };
        }

        return this.resolverPorService(
            entrada,
            typeof ServicoService !== "undefined" ? ServicoService : null,
            "buscarServico",
            "servico",
            "Servico nao encontrado."
        );
    },

    async resolverProduto(entrada) {
        if (entrada?.produto && typeof entrada.produto === "object") {
            return {
                sucesso: true,
                produto: entrada.produto,
                erros: []
            };
        }

        if (entrada && typeof entrada === "object" && entrada.produtoId && (!entrada.id || entrada.id !== entrada.produtoId)) {
            return this.resolverProduto(entrada.produtoId);
        }

        return this.resolverPorService(
            entrada,
            typeof ProdutoService !== "undefined" ? ProdutoService : null,
            "buscarProduto",
            "produto",
            "Produto nao encontrado."
        );
    },

    async resolverPorService(entrada, service, metodo, chave, mensagemNaoEncontrado) {
        if (entrada && typeof entrada === "object") {
            return {
                sucesso: true,
                [chave]: entrada,
                erros: []
            };
        }

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

    atualizarStatus(contexto, status, alteracoes, tipoEvento, descricaoEvento, dadosEvento = {}, opcoes = {}) {
        const atual = OrcamentoContext.normalizar(contexto);
        const podeRetornar = opcoes.permitirRetorno === true;
        const proximoStatus = (podeRetornar || OrcamentoState.podeAvancar(atual.status, status)) ? status : atual.status;

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

    obterIndiceProduto(produtos = [], entrada) {
        if (typeof entrada === "number" && Number.isInteger(entrada)) {
            return entrada >= 0 && entrada < produtos.length ? entrada : -1;
        }

        if (entrada && typeof entrada === "object" && Number.isInteger(entrada.indice)) {
            return entrada.indice >= 0 && entrada.indice < produtos.length ? entrada.indice : -1;
        }

        const id = this.obterId(entrada);
        if (!id) return -1;

        return produtos.findIndex(produto => {
            const produtoId = this.obterId(produto);
            return produtoId === id
                || produto?.itemId === id
                || produto?.orcamentoItemId === id;
        });
    },

    numero(valor) {
        if (valor === undefined || valor === null || valor === "") {
            return 0;
        }

        const numero = Number(String(valor).replace(",", "."));
        return Number.isFinite(numero) ? numero : 0;
    },

    texto(valor) {
        return String(valor || "").trim();
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
