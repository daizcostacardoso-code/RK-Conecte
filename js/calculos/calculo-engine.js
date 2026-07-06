const CalculoEngine = {
    calcular(calculo = {}) {
        const tipo = CalculoModel.normalizarTipoCalculo(calculo.tipoCalculo);

        if (tipo === CalculoModel.tipos.AREA_M2) {
            return this.calcularArea(calculo);
        }

        if (tipo === CalculoModel.tipos.LINEAR_M) {
            return this.calcularLinear(calculo);
        }

        if (tipo === CalculoModel.tipos.UNIDADE) {
            return this.calcularUnidade(calculo);
        }

        return CalculoModel.criarErro(tipo, ["Tipo de calculo personalizado preparado para etapa futura."]);
    },

    calcularArea(dados = {}) {
        const calculo = CalculoModel.normalizar({
            ...dados,
            tipoCalculo: CalculoModel.tipos.AREA_M2
        });
        const area = calculo.largura * calculo.altura * calculo.quantidade;
        const valorCalculado = area * calculo.valorUnitario;

        return this.criarResultado(calculo, valorCalculado, {
            area: CalculoModel.arredondar(area, 4),
            largura: calculo.largura,
            altura: calculo.altura,
            quantidade: calculo.quantidade
        });
    },

    calcularLinear(dados = {}) {
        const calculo = CalculoModel.normalizar({
            ...dados,
            tipoCalculo: CalculoModel.tipos.LINEAR_M
        });
        const metragemLinear = calculo.comprimento * calculo.quantidade;
        const valorCalculado = metragemLinear * calculo.valorUnitario;

        return this.criarResultado(calculo, valorCalculado, {
            metragemLinear: CalculoModel.arredondar(metragemLinear, 4),
            comprimento: calculo.comprimento,
            quantidade: calculo.quantidade
        });
    },

    calcularUnidade(dados = {}) {
        const calculo = CalculoModel.normalizar({
            ...dados,
            tipoCalculo: CalculoModel.tipos.UNIDADE
        });
        const unidades = calculo.quantidade;
        const valorCalculado = unidades * calculo.valorUnitario;

        return this.criarResultado(calculo, valorCalculado, {
            unidades: CalculoModel.arredondar(unidades, 4),
            quantidade: calculo.quantidade
        });
    },

    calcularItensOrcamento(dados = {}) {
        const itensOriginais = Array.isArray(dados.itens) ? dados.itens : [];
        const itens = itensOriginais.map((item, indice) => this.calcularItemOrcamento(item, indice));
        const subtotal = CalculoModel.arredondar(
            itens.reduce((total, item) => total + CalculoModel.numero(item.subtotal, 0), 0),
            2
        );
        const ajustes = this.normalizarAjustes(dados.ajustes || dados);
        const desconto = this.calcularAjuste(subtotal, ajustes.descontoTipo, ajustes.descontoValor);
        const baseAcrescimo = Math.max(0, subtotal - desconto.valor);
        const acrescimo = this.calcularAjuste(baseAcrescimo, ajustes.acrescimoTipo, ajustes.acrescimoValor);
        const totalGeral = CalculoModel.arredondar(Math.max(0, baseAcrescimo + acrescimo.valor), 2);
        const areaTotalM2 = CalculoModel.arredondar(
            itens.reduce((total, item) => total + (CalculoModel.numero(item.areaM2, 0) * CalculoModel.numero(item.quantidade, 0)), 0),
            4
        );

        return CalculoModel.criarResultado({
            sucesso: true,
            tipo: "ORCAMENTO_ITENS",
            valorCalculado: totalGeral,
            unidade: "BRL",
            detalhes: {
                itens,
                quantidadeItens: itens.length,
                areaTotalM2,
                subtotal,
                desconto: desconto.valor,
                descontoTipo: ajustes.descontoTipo,
                descontoValorInformado: ajustes.descontoValor,
                acrescimo: acrescimo.valor,
                acrescimoTipo: ajustes.acrescimoTipo,
                acrescimoValorInformado: ajustes.acrescimoValor,
                totalGeral,
                moeda: ajustes.moeda || "BRL",
                totais: {
                    subtotal,
                    desconto: desconto.valor,
                    acrescimo: acrescimo.valor,
                    totalGeral,
                    areaTotalM2,
                    moeda: ajustes.moeda || "BRL"
                },
                ajustes
            }
        });
    },

    calcularItemOrcamento(item = {}, indice = 0) {
        const produto = item.produto && typeof item.produto === "object" ? item.produto : {};
        const tipoCalculo = this.normalizarTipoItem(item.tipoCalculo || produto.tipoCalculo || item.unidade || produto.unidadeVenda);
        const larguraCm = CalculoModel.numero(item.larguraCm ?? item.largura, 0);
        const alturaCm = CalculoModel.numero(item.alturaCm ?? item.altura, 0);
        const quantidade = CalculoModel.numero(item.quantidade, 1);
        const valorUnitario = CalculoModel.numero(item.valorUnitario ?? item.precoVenda ?? produto.precoVenda, 0);
        const unidade = this.normalizarUnidade(item.unidade || produto.unidadeVenda || CalculoModel.obterUnidade(tipoCalculo) || "m2");
        const tipoDimensao = this.normalizarTipoDimensao(item.tipoDimensao || item.dimensionamento);
        const areaM2 = larguraCm > 0 && alturaCm > 0
            ? CalculoModel.arredondar((larguraCm * alturaCm) / 10000, 4)
            : 0;
        const usaArea = tipoCalculo === CalculoModel.tipos.AREA_M2 || unidade === "m2" || areaM2 > 0;
        const subtotalBase = usaArea ? areaM2 * quantidade * valorUnitario : quantidade * valorUnitario;
        const percentualEngenharia = tipoDimensao === "engenharia"
            ? Math.max(0, CalculoModel.numero(item.percentualEngenharia, 0))
            : 0;
        const valorAdicionalEngenharia = CalculoModel.arredondar(subtotalBase * (percentualEngenharia / 100), 2);
        const subtotalFinal = CalculoModel.arredondar(subtotalBase + valorAdicionalEngenharia, 2);

        return {
            ...item,
            itemId: item.itemId || item.orcamentoItemId || `item_${Date.now()}_${indice}_${Math.random().toString(36).slice(2, 6)}`,
            produtoId: item.produtoId || produto.id || item.id || "",
            id: item.id || produto.id || "",
            produto,
            nome: this.texto(item.nome || produto.nome || item.descricao || `Item ${indice + 1}`),
            descricao: this.texto(item.descricao || produto.descricao || produto.nome || `Item ${indice + 1}`),
            categoria: this.texto(item.categoria || produto.categoria),
            subcategoria: this.texto(item.subcategoria || produto.subcategoria),
            grupoServico: this.texto(item.grupoServico || item.categoria || produto.categoria),
            grupoServicoNome: this.texto(item.grupoServicoNome),
            tipoItem: this.texto(item.tipoItem || item.subcategoria || produto.subcategoria),
            tipoItemNome: this.texto(item.tipoItemNome || item.tipoItemRotulo),
            subtipoItem: this.texto(item.subtipoItem || item.subtipo || item.subcategoria),
            dependencias: Array.isArray(item.dependencias) ? item.dependencias.map(dep => this.texto(dep)).filter(Boolean) : [],
            tipoCalculo,
            unidade,
            tipoDimensao,
            tamanhoPadraoSelecionado: tipoDimensao === "padrao" ? this.texto(item.tamanhoPadraoSelecionado || item.tamanhoPadraoId) : "",
            larguraCm,
            alturaCm,
            quantidade,
            valorUnitario,
            areaM2,
            percentualEngenharia,
            valorAdicionalEngenharia,
            adicionalEngenharia: valorAdicionalEngenharia,
            subtotalBase: CalculoModel.arredondar(subtotalBase, 2),
            subtotalFinal,
            subtotal: subtotalFinal,
            valorTotal: subtotalFinal,
            observacoes: this.texto(item.observacoes || item.observacao),
            observacao: this.texto(item.observacao || item.observacoes)
        };
    },

    normalizarAjustes(ajustes = {}) {
        return {
            descontoTipo: this.normalizarTipoAjuste(ajustes.descontoTipo || ajustes.tipoDesconto || "sem"),
            descontoValor: CalculoModel.numero(ajustes.descontoValor ?? ajustes.desconto, 0),
            acrescimoTipo: this.normalizarTipoAjuste(ajustes.acrescimoTipo || ajustes.tipoAcrescimo || "sem"),
            acrescimoValor: CalculoModel.numero(ajustes.acrescimoValor ?? ajustes.acrescimo, 0),
            moeda: this.texto(ajustes.moeda || "BRL")
        };
    },

    calcularAjuste(base, tipo, valor) {
        const tipoNormalizado = this.normalizarTipoAjuste(tipo);
        const valorNumerico = Math.max(0, CalculoModel.numero(valor, 0));

        if (tipoNormalizado === "percentual") {
            return {
                tipo: tipoNormalizado,
                valorInformado: valorNumerico,
                valor: CalculoModel.arredondar(base * (Math.min(valorNumerico, 100) / 100), 2)
            };
        }

        if (tipoNormalizado === "valor") {
            return {
                tipo: tipoNormalizado,
                valorInformado: valorNumerico,
                valor: CalculoModel.arredondar(valorNumerico, 2)
            };
        }

        return {
            tipo: "sem",
            valorInformado: 0,
            valor: 0
        };
    },

    normalizarTipoAjuste(tipo) {
        const valor = this.slug(tipo);

        if (["percentual", "porcentagem", "porcento", "percent", "pct"].includes(valor)) {
            return "percentual";
        }

        if (["valor", "fixo", "real", "reais", "dinheiro"].includes(valor)) {
            return "valor";
        }

        return "sem";
    },

    normalizarTipoDimensao(tipoDimensao) {
        const valor = this.slug(tipoDimensao);
        return ["padrao", "tamanho_padrao"].includes(valor) ? "padrao" : "engenharia";
    },

    normalizarTipoItem(tipo) {
        const valor = this.slug(tipo);
        const aliases = {
            area: CalculoModel.tipos.AREA_M2,
            area_m2: CalculoModel.tipos.AREA_M2,
            m2: CalculoModel.tipos.AREA_M2,
            metro_quadrado: CalculoModel.tipos.AREA_M2,
            linear: CalculoModel.tipos.LINEAR_M,
            linear_m: CalculoModel.tipos.LINEAR_M,
            metro_linear: CalculoModel.tipos.LINEAR_M,
            m: CalculoModel.tipos.LINEAR_M,
            unidade: CalculoModel.tipos.UNIDADE,
            un: CalculoModel.tipos.UNIDADE,
            quantidade: CalculoModel.tipos.UNIDADE
        };

        return aliases[valor] || CalculoModel.tipos.AREA_M2;
    },

    normalizarUnidade(unidade) {
        const valor = this.slug(unidade);
        const aliases = {
            area_m2: "m2",
            metro_quadrado: "m2",
            metros_quadrados: "m2",
            m2: "m2",
            linear_m: "m",
            metro_linear: "m",
            m: "m",
            unidade: "un",
            quantidade: "un",
            un: "un"
        };

        return aliases[valor] || this.texto(unidade || "m2");
    },

    criarResultado(calculo, valorCalculado, detalhes = {}) {
        return CalculoModel.criarResultado({
            sucesso: true,
            tipo: calculo.tipoCalculo,
            valorCalculado,
            unidade: CalculoModel.obterUnidade(calculo.tipoCalculo),
            detalhes: {
                ...detalhes,
                valorUnitario: calculo.valorUnitario,
                subtotal: CalculoModel.arredondar(valorCalculado, 2),
                observacoes: calculo.observacoes,
                preparadoPara: {
                    perdas: calculo.perdaPercentual,
                    descontos: calculo.desconto,
                    acrescimos: calculo.acrescimo,
                    impostos: false,
                    margem: false,
                    multiplosProdutos: false,
                    kits: false
                }
            }
        });
    },

    slug(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/mÂ²/g, "m2")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    },

    texto(valor) {
        return String(valor || "").trim();
    }
};
