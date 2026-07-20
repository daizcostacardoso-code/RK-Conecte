const OrcamentoPDF = {
    dadosPublicos(dados = {}) {
        const normalizado = OrcamentoModel.normalizar(dados);
        const { custosInternos, historico, usuarios, ...publico } = normalizado;
        return publico;
    },

    rotuloPagamento(forma) {
        const formas = {
            dinheiro: "Dinheiro",
            pix: "PIX",
            cartao: "Cartão",
            boleto: "Boleto",
            parcelado: "Parcelado"
        };

        return formas[forma] || "A definir";
    },

    desenharPagamento(doc, pagamento = {}, y) {
        if (y > 245) {
            doc.addPage();
            y = 25;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Forma de Pagamento", 15, y);

        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Forma: ${this.rotuloPagamento(pagamento.forma)}`, 15, y);
        doc.text(`Entrada: ${Util.moeda(pagamento.entrada || 0)}`, 85, y);
        doc.text(`Parcelas: ${pagamento.parcelas || 1}`, 145, y);

        if (pagamento.observacoes) {
            y += 6;
            const linhas = doc.splitTextToSize(`Observação: ${pagamento.observacoes}`, 180);
            doc.text(linhas, 15, y);
            y += linhas.length * 5;
        }

        return y + 8;
    },

    desenharAceite(doc, y) {
        if (y > 235) {
            doc.addPage();
            y = 25;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Aceite do Cliente", 15, y);

        y += 14;
        doc.setDrawColor(120);
        doc.line(15, y, 95, y);
        doc.line(115, y, 195, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Assinatura", 55, y + 5, { align: "center" });
        doc.text("Data", 155, y + 5, { align: "center" });

        return y + 12;
    }
};
