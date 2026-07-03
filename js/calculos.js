const Calculos = {
    calcularArea(largura, altura) {
        const area = (Util.numero(largura) * Util.numero(altura)) / 10000;
        return Util.arredondar(area, 3);
    },

    calcularMetroAluminio(largura, altura, quantidade = 1) {
        const larguraCm = Util.numero(largura);
        const alturaCm = Util.numero(altura);
        const qtd = Math.max(1, Util.numero(quantidade) || 1);

        if (larguraCm <= 0 && alturaCm <= 0) return 0;

        // Regra solicitada: alumínio por metro reto, sem cálculo de perímetro e sem m².
        // Usa a maior medida informada como referência do trilho/perfil principal.
        // Ex.: valor R$100/m -> 100cm = R$100 | 150cm = R$150.
        const maiorMedidaCm = Math.max(larguraCm, alturaCm);
        const metrosRetos = (maiorMedidaCm / 100) * qtd;
        return Util.arredondar(metrosRetos, 3);
    },

    calcularItem(item, valores) {
        const largura = Util.numero(item.largura);
        const altura = Util.numero(item.altura);
        const quantidade = Math.max(1, Util.numero(item.quantidade) || 1);

        const area = this.calcularArea(largura, altura);
        const metrosAluminio = this.calcularMetroAluminio(largura, altura, quantidade);

        const chaveEspessura = "mm" + item.espessura;
        const valorVidro = Math.max(0, Util.numero(valores[chaveEspessura]));

        const corNormalizada = String(item.cor || "incolor").toLowerCase();
        const cor = corNormalizada.charAt(0).toUpperCase() + corNormalizada.slice(1);

        const chaveCorValor = "valor" + cor;
        const chaveCorPerc = "perc" + cor;

        const valorCor = Math.max(0, Util.numero(valores[chaveCorValor]));
        const percCor = Math.max(0, Util.numero(valores[chaveCorPerc]));

        // Compatibilidade: versões antigas salvavam como "despesa".
        // Agora o campo é o preço do alumínio por metro reto.
        const aluminio = Math.max(0, Util.numero(valores.aluminio ?? valores.despesa));
        const acessorios = Math.max(0, Util.numero(item.acessorios));

        const adicionalPercentual = valorVidro * (percCor / 100);
        const valorMetro = valorVidro + valorCor + adicionalPercentual;

        const totalVidro = valorMetro * area * quantidade;
        const totalAluminio = aluminio * metrosAluminio;
        const total = totalVidro + totalAluminio + acessorios;

        return {
            ...item,
            largura,
            altura,
            quantidade,
            area,
            metrosAluminio,
            metroLinear: metrosAluminio,
            valorVidro,
            valorCor: valorCor + adicionalPercentual,
            aluminio,
            despesa: aluminio,
            acessorios,
            valorMetro,
            totalVidro: Util.arredondar(totalVidro, 2),
            totalAluminio: Util.arredondar(totalAluminio, 2),
            totalAcessorios: Util.arredondar(acessorios, 2),
            total: Util.arredondar(total, 2)
        };
    },

    calcularTotais(itens, desconto) {
        const lista = Array.isArray(itens) ? itens : [];
        const subtotal = lista.reduce((soma, item) => soma + Math.max(0, Util.numero(item.total)), 0);

        const tipo = desconto?.tipo || "valor";
        const descontoInformado = Math.max(0, Util.numero(desconto?.valor));
        let valorDesconto = 0;

        if (tipo === "percentual") {
            valorDesconto = subtotal * (Math.min(descontoInformado, 100) / 100);
        } else {
            valorDesconto = Math.min(descontoInformado, subtotal);
        }

        const total = subtotal - valorDesconto;

        return {
            subtotal: Util.arredondar(subtotal, 2),
            desconto: Util.arredondar(valorDesconto, 2),
            total: Util.arredondar(total < 0 ? 0 : total, 2)
        };
    }
};
