const OrcamentoUI = {
    prepararCamposIniciais(dados = {}) {
        const normalizado = OrcamentoModel.normalizar(dados);
        this.valor("numeroOrcamento", normalizado.numero || OrcamentoModel.numeroProvisorio());
        this.valor("dataCriacao", normalizado.datas.criacao);
        this.valor("dataValidade", normalizado.datas.validade);
        this.valor("statusOrcamento", normalizado.status);
        this.valor("usuarioCriacao", normalizado.usuarios.criacao || normalizado.vendedor || "Sistema");
        this.valor("dataAtualizacao", this.formatarDataHora(normalizado.datas.atualizacao));
    },

    preencherFormulario(dados = {}) {
        const normalizado = OrcamentoModel.normalizar(dados);
        this.prepararCamposIniciais(normalizado);

        this.valor("cliente", normalizado.cliente.nome);
        this.valor("telefone", normalizado.cliente.telefone);
        this.valor("email", normalizado.cliente.email);
        this.valor("endereco", normalizado.cliente.endereco);
        this.valor("enderecoObra", normalizado.obra.endereco);
        this.valor("observacoesObra", normalizado.obra.observacoes);
        this.valor("vendedor", normalizado.vendedor);
        this.valor("observacoes", normalizado.observacoes);
        this.valor("formaPagamento", normalizado.pagamento.forma);
        this.valor("entradaPagamento", normalizado.pagamento.entrada);
        this.valor("parcelasPagamento", normalizado.pagamento.parcelas);
        this.valor("observacaoPagamento", normalizado.pagamento.observacoes);
        this.preencherAjustes(normalizado.totais, normalizado.desconto);
        this.preencherCustos(normalizado.custosInternos);
    },

    preencherAjustes(totais = {}, desconto = {}) {
        const descontoValor = totais.descontoValor ?? (desconto.tipo === "valor" ? desconto.valor : 0) ?? 0;
        const descontoPercentual = totais.descontoPercentual ?? (desconto.tipo === "percentual" ? desconto.valor : 0) ?? 0;

        this.valor("descontoValor", descontoValor);
        this.valor("descontoPercentual", descontoPercentual);
        this.valor("acrescimo", totais.acrescimo || 0);
        this.valor("frete", totais.frete || 0);
        this.valor("instalacao", totais.instalacao || 0);
        this.sincronizarDescontoLegado();
    },

    preencherResumo(totais = {}) {
        this.texto("quantidadeItensResumo", String(totais.quantidadeItens || 0));
        this.texto("areaTotalResumo", `${Util.decimal(totais.areaTotalM2 || 0, 3)} m²`);
        this.texto("subtotal", Util.moeda(totais.subtotal || 0));
        this.texto("valorDesconto", Util.moeda(totais.descontoTotal ?? totais.desconto ?? 0));
        this.texto("totalGeral", Util.moeda(totais.totalFinal ?? totais.total ?? 0));
    },

    preencherCustos(custos = {}) {
        this.valor("custoVidro", custos.custoVidro || 0);
        this.valor("custoFerragens", custos.custoFerragens || 0);
        this.valor("custoMaoObra", custos.custoMaoObra || 0);
        this.valor("custoTransporte", custos.custoTransporte || 0);
        this.valor("comissao", custos.comissao || 0);
        this.textoOuValor("lucroBruto", Util.moeda(custos.lucroBruto || 0));
        this.textoOuValor("margemLucro", `${Util.decimal(custos.margemLucro || 0, 2)}%`);
    },

    atualizarCustosPorTotais(totais = {}) {
        const custos = Formulario.lerCustosInternos(totais.totalFinal ?? totais.total ?? 0);
        this.preencherCustos(custos);
        return custos;
    },

    sincronizarDescontoLegado() {
        const valor = Util.numero(Util.$("descontoValor")?.value);
        const percentual = Util.numero(Util.$("descontoPercentual")?.value);
        this.valor("tipoDesconto", percentual > 0 && valor === 0 ? "percentual" : "valor");
        this.valor("desconto", percentual > 0 && valor === 0 ? percentual : valor);
    },

    formatarDataHora(valor) {
        if (!valor) return "";
        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return valor;
        return data.toLocaleString("pt-BR");
    },

    valor(id, valor) {
        const campo = Util.$(id);
        if (campo) campo.value = valor ?? "";
    },

    texto(id, valor) {
        const elemento = Util.$(id);
        if (elemento) elemento.textContent = valor ?? "";
    },

    textoOuValor(id, valor) {
        const elemento = Util.$(id);
        if (!elemento) return;
        if ("value" in elemento) elemento.value = valor ?? "";
        else elemento.textContent = valor ?? "";
    }
};
