const OrcamentoCalculos = {
    usarFormulaProfissional(item = {}) {
        if (item.modelo === "legado") return false;
        if (item.modelo === "profissional") return true;

        return [
            "valorM2",
            "valorFerragens",
            "valorServico",
            "observacoesTecnicas"
        ].some(campo => item[campo] !== undefined && item[campo] !== null && item[campo] !== "");
    },

    calcularAreaM2(largura, altura) {
        const area = (Util.numero(largura) * Util.numero(altura)) / 10000;
        return Util.arredondar(area, 3);
    },

    calcularItem(item = {}) {
        const largura = Math.max(0, Util.numero(item.largura));
        const altura = Math.max(0, Util.numero(item.altura));
        const quantidade = Math.max(1, Util.numero(item.quantidade) || 1);
        const areaM2 = this.calcularAreaM2(largura, altura);
        const valorM2 = Math.max(0, Util.numero(item.valorM2 ?? item.valorMetro));
        const valorFerragens = Math.max(0, Util.numero(item.valorFerragens ?? item.ferragens ?? item.acessorios));
        const valorServico = Math.max(0, Util.numero(item.valorServico ?? item.servicos ?? item.maoObra));
        const valorAdicional = Math.max(0, Util.numero(item.valorAdicional));
        const totalVidro = areaM2 * valorM2 * quantidade;
        const total = totalVidro + valorFerragens + valorServico + valorAdicional;

        return {
            ...item,
            modelo: "profissional",
            id: item.id || this.criarId("item"),
            categoria: item.categoria || "vidro_avulso",
            descricao: item.descricao || "",
            tipoVidro: item.tipoVidro || "",
            espessura: item.espessura || "",
            cor: item.cor || "",
            largura,
            altura,
            quantidade,
            area: areaM2,
            areaM2,
            valorM2,
            valorMetro: valorM2,
            valorFerragens,
            valorServico,
            valorAdicional,
            descricaoAdicional: item.descricaoAdicional || "",
            acessorios: valorFerragens,
            totalVidro: Util.arredondar(totalVidro, 2),
            totalFerragens: Util.arredondar(valorFerragens, 2),
            totalAcessorios: Util.arredondar(valorFerragens, 2),
            totalServico: Util.arredondar(valorServico, 2),
            totalAdicional: Util.arredondar(valorAdicional, 2),
            totalAluminio: 0,
            aluminio: 0,
            despesa: 0,
            total: Util.arredondar(total, 2),
            observacoes: item.observacoes || item.observacoesTecnicas || ""
        };
    },

    calcularTotais(itens = [], ajustes = {}) {
        const lista = Array.isArray(itens) ? itens : [];
        const ajustesNormalizados = this.normalizarAjustes(ajustes);
        const totalItens = lista.reduce((soma, item) => soma + Math.max(0, Util.numero(item.total)), 0);
        const totalAdicionais = lista.reduce((soma, item) => soma + Math.max(0, Util.numero(item.valorAdicional)), 0);
        const subtotal = Math.max(0, totalItens - totalAdicionais);
        const areaTotalM2 = lista.reduce((soma, item) => {
            const area = Util.numero(item.areaM2 ?? item.area);
            const quantidade = Math.max(1, Util.numero(item.quantidade) || 1);
            return soma + (area * quantidade);
        }, 0);

        const descontoValor = Math.max(0, Util.numero(ajustesNormalizados.descontoValor));
        const descontoPercentual = Math.min(100, Math.max(0, Util.numero(ajustesNormalizados.descontoPercentual)));
        const descontoPercentualValor = totalItens * (descontoPercentual / 100);
        const descontoTotal = Math.min(totalItens, descontoValor + descontoPercentualValor);
        const acrescimo = Math.max(0, Util.numero(ajustesNormalizados.acrescimo));
        const frete = Math.max(0, Util.numero(ajustesNormalizados.frete));
        const instalacao = Math.max(0, Util.numero(ajustesNormalizados.instalacao));
        const totalFinal = Math.max(0, totalItens - descontoTotal + acrescimo + frete + instalacao);
        const adicionais = lista
            .filter(item => Util.numero(item.valorAdicional) > 0)
            .map(item => ({
                descricao: String(item.descricaoAdicional || "Adicional").trim(),
                valor: Util.arredondar(Util.numero(item.valorAdicional), 2)
            }));

        return {
            quantidadeItens: lista.length,
            areaTotalM2: Util.arredondar(areaTotalM2, 3),
            subtotal: Util.arredondar(subtotal, 2),
            totalAdicionais: Util.arredondar(totalAdicionais, 2),
            descontoValor: Util.arredondar(descontoValor, 2),
            descontoPercentual: Util.arredondar(descontoPercentual, 2),
            descontoPercentualValor: Util.arredondar(descontoPercentualValor, 2),
            descontoTotal: Util.arredondar(descontoTotal, 2),
            desconto: Util.arredondar(descontoTotal, 2),
            acrescimo: Util.arredondar(acrescimo, 2),
            frete: Util.arredondar(frete, 2),
            instalacao: Util.arredondar(instalacao, 2),
            adicionais,
            totalFinal: Util.arredondar(totalFinal, 2),
            total: Util.arredondar(totalFinal, 2)
        };
    },

    normalizarAjustes(ajustes = {}) {
        if (ajustes.descontoValor !== undefined || ajustes.descontoPercentual !== undefined) {
            return {
                descontoValor: ajustes.descontoValor,
                descontoPercentual: ajustes.descontoPercentual,
                acrescimo: ajustes.acrescimo,
                frete: ajustes.frete,
                instalacao: ajustes.instalacao
            };
        }

        const valor = Math.max(0, Util.numero(ajustes.valor));

        return {
            descontoValor: ajustes.tipo === "percentual" ? 0 : valor,
            descontoPercentual: ajustes.tipo === "percentual" ? valor : 0,
            acrescimo: ajustes.acrescimo,
            frete: ajustes.frete,
            instalacao: ajustes.instalacao
        };
    },

    calcularCustosInternos(custos = {}, totalFinal = 0) {
        const custoVidro = Math.max(0, Util.numero(custos.custoVidro));
        const custoFerragens = Math.max(0, Util.numero(custos.custoFerragens));
        const custoMaoObra = Math.max(0, Util.numero(custos.custoMaoObra));
        const custoTransporte = Math.max(0, Util.numero(custos.custoTransporte));
        const comissao = Math.max(0, Util.numero(custos.comissao));
        const custosTotais = custoVidro + custoFerragens + custoMaoObra + custoTransporte + comissao;
        const total = Math.max(0, Util.numero(totalFinal));
        const lucroBruto = total - custosTotais;
        const margemLucro = total > 0 ? (lucroBruto / total) * 100 : 0;

        return {
            custoVidro: Util.arredondar(custoVidro, 2),
            custoFerragens: Util.arredondar(custoFerragens, 2),
            custoMaoObra: Util.arredondar(custoMaoObra, 2),
            custoTransporte: Util.arredondar(custoTransporte, 2),
            comissao: Util.arredondar(comissao, 2),
            lucroBruto: Util.arredondar(lucroBruto, 2),
            margemLucro: Util.arredondar(margemLucro, 2)
        };
    },

    criarId(prefixo = "id") {
        return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
};
