const Formulario = {
    lerCliente() {
        return {
            nome: Util.$("cliente")?.value?.trim() || "",
            telefone: Util.$("telefone")?.value?.trim() || "",
            endereco: Util.$("endereco")?.value?.trim() || ""
        };
    },

    lerItem() {
        return {
            tipoVidro: Util.$("tipoVidro")?.value || "",
            espessura: Util.$("espessura")?.value || "",
            cor: Util.$("cor")?.value || "",
            largura: Util.numero(Util.$("largura")?.value),
            altura: Util.numero(Util.$("altura")?.value),
            quantidade: Math.max(1, Util.numero(Util.$("quantidade")?.value || 1)),
            acessorios: Math.max(0, Util.numero(Util.$("acessorios")?.value))
        };
    },

    preencherCalculo(dados) {
        if (Util.$("area")) Util.$("area").value = Util.decimal(dados.area, 3);
        if (Util.$("valorVidro")) Util.$("valorVidro").value = Util.moeda(dados.valorVidro);
        if (Util.$("valorCor")) Util.$("valorCor").value = Util.moeda(dados.valorCor);
        if (Util.$("aluminio")) Util.$("aluminio").value = Util.moeda(dados.totalAluminio ?? 0);
        if (Util.$("despesa")) Util.$("despesa").value = Util.moeda(dados.totalAluminio ?? 0);
        if (Util.$("acessorios")) Util.$("acessorios").value = dados.acessorios ? String(dados.acessorios) : Util.$("acessorios").value;
        if (Util.$("resultado")) Util.$("resultado").textContent = Util.moeda(dados.total);
    },

    limparItem() {
        if (Util.$("largura")) Util.$("largura").value = "";
        if (Util.$("altura")) Util.$("altura").value = "";
        if (Util.$("quantidade")) Util.$("quantidade").value = "1";
        if (Util.$("area")) Util.$("area").value = "";
        if (Util.$("aluminio")) Util.$("aluminio").value = "";
        if (Util.$("despesa")) Util.$("despesa").value = "";
        if (Util.$("acessorios")) Util.$("acessorios").value = "";
        if (Util.$("resultado")) Util.$("resultado").textContent = Util.moeda(0);
    },

    lerDesconto() {
        return {
            tipo: Util.$("tipoDesconto")?.value || "valor",
            valor: Math.max(0, Util.numero(Util.$("desconto")?.value))
        };
    },

    preencherTotais(totais) {
        if (Util.$("subtotal")) Util.$("subtotal").textContent = Util.moeda(totais.subtotal);
        if (Util.$("valorDesconto")) Util.$("valorDesconto").textContent = Util.moeda(totais.desconto);
        if (Util.$("totalGeral")) Util.$("totalGeral").textContent = Util.moeda(totais.total);
    },

    lerObservacoes() {
        return Util.$("observacoes")?.value || "";
    }
};
