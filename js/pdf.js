const PDF = {
    margem: 15,
    larguraPagina: 210,
    alturaPagina: 297,

    gerar() {
        if (!window.jspdf) {
            alert("Não foi possível carregar a biblioteca do PDF. Verifique sua conexão com a internet e tente novamente.");
            return;
        }

        this.carregarLogo()
            .then((logo) => {
                this.criarPDF(logo);
            })
            .catch(() => {
                this.criarPDF(null);
            });
    },

    carregarLogo() {
        return new Promise((resolve, reject) => {
            const logo = new Image();
            logo.onload = () => resolve(logo);
            logo.onerror = () => reject();
            const caminhoPadrao = window.location.pathname.includes("/paginas/") ? "../imagens/logo.jpeg" : "imagens/logo.jpeg";
            logo.src = Util.$("logo")?.value || Config.empresa.logo || caminhoPadrao;
        });
    },

    criarPDF(logo) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const cliente = Formulario.lerCliente();
        const itens = Itens.todos();
        const desconto = Formulario.lerDesconto();
        const totais = Calculos.calcularTotais(itens, desconto);
        const observacoes = Formulario.lerObservacoes();
        const empresa = this.obterEmpresa();

        const numero = this.obterNumeroOrcamento();

        let y = 15;

        y = this.desenharCabecalho(doc, logo, numero, y, empresa);
        y = this.desenharCliente(doc, cliente, y);
        y = this.desenharTabela(doc, itens, y);
        y = this.desenharTotais(doc, totais, y);
        y = this.desenharObservacoes(doc, observacoes, y);
        this.desenharRodape(doc);

        this.salvarOrcamentoEmitido(numero, cliente, itens, desconto, totais, observacoes, empresa);

        doc.save(`orcamento_${numero}.pdf`);
    },

    salvarOrcamentoEmitido(numero, cliente, itens, desconto, totais, observacoes, empresa) {
        const dados = {
            numero,
            cliente,
            itens,
            desconto,
            totais,
            observacoes,
            empresa,
            criadoEm: Util.agora(),
            criadoEmISO: new Date().toISOString()
        };

        Storage.salvar(Config.storage.historicoOrcamentos, [
            ...(Storage.carregar(Config.storage.historicoOrcamentos, []) || []),
            dados
        ]);

        if (typeof db !== "undefined" && db) {
            db.collection("orcamentos_emitidos")
                .doc(numero)
                .set(dados)
                .catch(erro => console.error("Erro ao salvar orçamento emitido no Firestore:", erro));
        }
    },

    obterNumeroOrcamento() {
        let numero = Storage.carregar(Config.storage.numeroOrcamento, 1);

        if (!numero || isNaN(numero)) {
            numero = 1;
        }

        Storage.salvar(Config.storage.numeroOrcamento, numero + 1);

        return String(numero).padStart(6, "0");
    },

    obterEmpresa() {
        return {
            nome: Util.$("empresa")?.value || "RK VIDRAÇARIA",
            cnpj: Util.$("cnpj")?.value || "00.000.000/0000-00",
            endereco: Util.$("endEmpresa")?.value || "Endereço da empresa",
            telefone: Util.$("foneEmpresa")?.value || "(00) 00000-0000",
            email: Util.$("emailEmpresa")?.value || "contato@email.com"
        };
    },

    desenharCabecalho(doc, logo, numero, y, empresa) {
        doc.setDrawColor(80);
        doc.setLineWidth(0.3);
        doc.rect(15, 10, 180, 38);

        if (logo) {
            try {
                doc.addImage(logo, "JPEG", 18, 13, 28, 28);
            } catch (e) {
                console.log("Logo não carregada no PDF.");
            }
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(empresa.nome, 105, 17, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(empresa.endereco, 105, 24, { align: "center" });
        doc.text(`Telefone / WhatsApp: ${empresa.telefone}`, 105, 29, { align: "center" });
        doc.text(`E-mail: ${empresa.email}`, 105, 34, { align: "center" });
        doc.text(`CNPJ: ${empresa.cnpj}`, 105, 39, { align: "center" });

        y = 58;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text("ORÇAMENTO", 105, y, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Nº ${numero}`, 105, y + 5, { align: "center" });

        y += 6;

        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Data: ${Util.hoje()}`, 15, y);
        doc.text(`Hora: ${new Date().toLocaleTimeString("pt-BR")}`, 165, y);

        return y + 10;
    },

    desenharCliente(doc, cliente, y) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Dados do Cliente", 15, y);

        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Cliente: ${cliente.nome || ""}`, 15, y);
        y += 6;
        doc.text(`Telefone: ${cliente.telefone || ""}`, 15, y);
        y += 6;
        doc.text(`Endereço: ${cliente.endereco || ""}`, 15, y);

        y += 8;
        doc.line(15, y, 195, y);

        return y + 8;
    },

    desenharTabela(doc, itens, y) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Itens do Orçamento", 15, y);

        y += 7;

        y = this.desenharCabecalhoTabela(doc, y);

        itens.forEach((item, index) => {
            if (y > 260) {
                doc.addPage();
                y = 20;
                y = this.desenharCabecalhoTabela(doc, y);
            }

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);

            doc.rect(15, y - 5, 180, 8);

            const medidas = `${item.largura || ""}x${item.altura || ""}`;
            const produto = `${item.tipoVidro || ""} ${item.espessura || ""}mm ${item.cor || ""}`.trim();

            doc.text(String(index + 1), 18, y);
            doc.text(doc.splitTextToSize(produto, 42)[0] || "", 26, y);
            doc.text(medidas, 72, y);
            doc.text(String(item.quantidade || ""), 95, y);
            doc.text(Util.decimal(item.area || 0), 106, y);
            doc.text(Util.moeda(item.totalVidro ?? Math.max(0, Util.numero(item.total) - Util.numero(item.totalAluminio) - Util.numero(item.totalAcessorios ?? item.acessorios))), 142, y, { align: "right" });
            doc.text(Util.moeda(item.totalAluminio ?? 0), 163, y, { align: "right" });
            doc.text(Util.moeda(item.totalAcessorios ?? item.acessorios ?? 0), 181, y, { align: "right" });
            doc.text(Util.moeda(item.total || 0), 194, y, { align: "right" });

            y += 8;
        });

        return y + 6;
    },

    desenharCabecalhoTabela(doc, y) {
        doc.setFillColor(230, 230, 230);
        doc.rect(15, y - 5, 180, 8, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);

        doc.text("#", 18, y);
        doc.text("Produto", 26, y);
        doc.text("Medidas", 72, y);
        doc.text("Qtd", 95, y);
        doc.text("Área", 106, y);
        doc.text("Vidro", 142, y, { align: "right" });
        doc.text("Alum.", 163, y, { align: "right" });
        doc.text("Acess.", 181, y, { align: "right" });
        doc.text("Total", 194, y, { align: "right" });

        return y + 8;
    },

    desenharTotais(doc, totais, y) {
        if (y > 245) {
            doc.addPage();
            y = 25;
        }

        doc.line(120, y, 195, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Subtotal:", 135, y);
        doc.text(Util.moeda(totais.subtotal), 195, y, { align: "right" });

        y += 7;
        doc.text("Desconto:", 135, y);
        doc.text(Util.moeda(totais.desconto), 195, y, { align: "right" });

        y += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("TOTAL GERAL:", 135, y);
        doc.text(Util.moeda(totais.total), 195, y, { align: "right" });

        return y + 12;
    },

    desenharObservacoes(doc, observacoes, y) {
        if (!observacoes) {
            return y;
        }

        if (y > 245) {
            doc.addPage();
            y = 25;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Observações", 15, y);

        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        const linhas = doc.splitTextToSize(observacoes, 180);
        doc.text(linhas, 15, y);

        return y + linhas.length * 5 + 10;
    },

    desenharRodape(doc) {
        const totalPaginas = doc.getNumberOfPages();

        for (let i = 1; i <= totalPaginas; i++) {
            doc.setPage(i);

            doc.setDrawColor(180);
            doc.line(15, 280, 195, 280);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);

            doc.text("Validade do orçamento: 15 dias.", 15, 286);
            doc.text("Obrigado pela preferência!", 105, 286, { align: "center" });
            doc.text(`Página ${i} de ${totalPaginas}`, 195, 286, { align: "right" });
        }
    }
};