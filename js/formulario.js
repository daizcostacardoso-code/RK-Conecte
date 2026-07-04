const Formulario = {
    lerCliente() {
        return {
            nome: Util.$("cliente")?.value?.trim() || "",
            telefone: Util.$("telefone")?.value?.trim() || "",
            email: Util.$("email")?.value?.trim() || "",
            endereco: Util.$("endereco")?.value?.trim() || ""
        };
    },

    lerObra() {
        return {
            endereco: Util.$("enderecoObra")?.value?.trim() || Util.$("endereco")?.value?.trim() || "",
            observacoes: Util.$("observacoesObra")?.value || ""
        };
    },

    lerItem() {
        return {
            categoria: Util.$("categoria")?.value || "vidro_avulso",
            descricao: Util.$("descricaoItem")?.value?.trim() || "",
            tipoVidro: Util.$("tipoVidro")?.value || "",
            espessura: Util.$("espessura")?.value || "",
            cor: Util.$("cor")?.value || "",
            largura: Util.numero(Util.$("largura")?.value),
            altura: Util.numero(Util.$("altura")?.value),
            quantidade: Math.max(1, Util.numero(Util.$("quantidade")?.value || 1)),
            valorM2: Math.max(0, Util.numero(Util.$("valorM2")?.value)),
            valorFerragens: Math.max(0, Util.numero(Util.$("valorFerragens")?.value ?? Util.$("acessorios")?.value)),
            valorServico: Math.max(0, Util.numero(Util.$("valorServico")?.value)),
            acessorios: Math.max(0, Util.numero(Util.$("valorFerragens")?.value ?? Util.$("acessorios")?.value)),
            observacoes: Util.$("observacoesItem")?.value?.trim() || ""
        };
    },

    preencherCalculo(dados) {
        if (Util.$("area")) Util.$("area").value = Util.decimal(dados.areaM2 ?? dados.area, 3);
        if (Util.$("valorVidro")) Util.$("valorVidro").value = Util.moeda(dados.valorVidro);
        if (Util.$("valorCor")) Util.$("valorCor").value = Util.moeda(dados.valorCor);
        if (Util.$("aluminio")) Util.$("aluminio").value = Util.moeda(dados.totalAluminio ?? 0);
        if (Util.$("despesa")) Util.$("despesa").value = Util.moeda(dados.totalAluminio ?? 0);
        if (Util.$("acessorios")) Util.$("acessorios").value = dados.acessorios ? String(dados.acessorios) : Util.$("acessorios").value;
        if (Util.$("totalItem")) Util.$("totalItem").value = Util.moeda(dados.total);
        if (Util.$("resultado")) Util.$("resultado").textContent = Util.moeda(dados.total);
    },

    limparItem() {
        if (Util.$("descricaoItem")) Util.$("descricaoItem").value = "";
        if (Util.$("largura")) Util.$("largura").value = "";
        if (Util.$("altura")) Util.$("altura").value = "";
        if (Util.$("quantidade")) Util.$("quantidade").value = "1";
        if (Util.$("area")) Util.$("area").value = "";
        if (Util.$("valorM2")) Util.$("valorM2").value = "";
        if (Util.$("valorFerragens")) Util.$("valorFerragens").value = "";
        if (Util.$("valorServico")) Util.$("valorServico").value = "";
        if (Util.$("totalItem")) Util.$("totalItem").value = "";
        if (Util.$("observacoesItem")) Util.$("observacoesItem").value = "";
        if (Util.$("aluminio")) Util.$("aluminio").value = "";
        if (Util.$("despesa")) Util.$("despesa").value = "";
        if (Util.$("acessorios")) Util.$("acessorios").value = "";
        if (Util.$("resultado")) Util.$("resultado").textContent = Util.moeda(0);
    },

    lerDesconto() {
        const resumo = this.lerResumoFinanceiro();

        return {
            tipo: Util.$("tipoDesconto")?.value || "valor",
            valor: Math.max(0, Util.numero(Util.$("desconto")?.value)),
            ...resumo
        };
    },

    lerResumoFinanceiro() {
        const descontoValor = Math.max(0, Util.numero(Util.$("descontoValor")?.value ?? Util.$("desconto")?.value));
        const descontoPercentual = Math.min(100, Math.max(0, Util.numero(Util.$("descontoPercentual")?.value)));

        if (typeof OrcamentoUI !== "undefined") {
            OrcamentoUI.sincronizarDescontoLegado();
        }

        return {
            descontoValor,
            descontoPercentual,
            acrescimo: Math.max(0, Util.numero(Util.$("acrescimo")?.value)),
            frete: Math.max(0, Util.numero(Util.$("frete")?.value)),
            instalacao: Math.max(0, Util.numero(Util.$("instalacao")?.value))
        };
    },

    preencherTotais(totais) {
        if (typeof OrcamentoUI !== "undefined") {
            OrcamentoUI.preencherResumo(totais);
            OrcamentoUI.atualizarCustosPorTotais(totais);
            return;
        }

        if (Util.$("subtotal")) Util.$("subtotal").textContent = Util.moeda(totais.subtotal);
        if (Util.$("valorDesconto")) Util.$("valorDesconto").textContent = Util.moeda(totais.desconto);
        if (Util.$("totalGeral")) Util.$("totalGeral").textContent = Util.moeda(totais.total);
    },

    lerPagamento() {
        return {
            forma: Util.$("formaPagamento")?.value || "",
            entrada: Math.max(0, Util.numero(Util.$("entradaPagamento")?.value)),
            parcelas: Math.max(1, Util.numero(Util.$("parcelasPagamento")?.value || 1)),
            observacoes: Util.$("observacaoPagamento")?.value || ""
        };
    },

    lerCustosInternos(totalFinal = 0) {
        if (typeof OrcamentoCalculos === "undefined") {
            return {};
        }

        return OrcamentoCalculos.calcularCustosInternos({
            custoVidro: Util.$("custoVidro")?.value,
            custoFerragens: Util.$("custoFerragens")?.value,
            custoMaoObra: Util.$("custoMaoObra")?.value,
            custoTransporte: Util.$("custoTransporte")?.value,
            comissao: Util.$("comissao")?.value
        }, totalFinal);
    },

    lerObservacoes() {
        return Util.$("observacoes")?.value || "";
    }
};
