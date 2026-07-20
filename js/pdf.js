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

    async criarPDF(logo) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const dadosOrcamento = typeof OrcamentoModel !== "undefined"
            ? OrcamentoModel.montar(Orcamento.dadosAtuais || {})
            : {
                cliente: Formulario.lerCliente(),
                obra: Formulario.lerObra ? Formulario.lerObra() : {},
                itens: Itens.todos(),
                desconto: Formulario.lerDesconto(),
                totais: Calculos.calcularTotais(Itens.todos(), Formulario.lerDesconto()),
                pagamento: Formulario.lerPagamento ? Formulario.lerPagamento() : {},
                datas: {},
                observacoes: Formulario.lerObservacoes()
            };
        const dadosPublicos = typeof OrcamentoPDF !== "undefined"
            ? OrcamentoPDF.dadosPublicos(dadosOrcamento)
            : dadosOrcamento;
        const cliente = dadosPublicos.cliente || {};
        const obra = dadosPublicos.obra || {};
        const itens = dadosPublicos.itens || [];
        const totais = dadosPublicos.totais || Calculos.calcularTotais(itens, dadosPublicos.desconto || {});
        const observacoes = dadosPublicos.observacoes || "";
        const empresa = this.obterEmpresa();

        let numero = "";
        try {
            numero = await this.obterNumeroOrcamento(dadosPublicos.numero);
        } catch (erro) {
            console.error("Erro ao reservar numero do orcamento:", erro);
            alert(erro?.message || "Nao foi possivel reservar o numero do orcamento.");
            return;
        }
        dadosPublicos.numero = numero;

        let y = 15;

        y = this.desenharCabecalho(doc, logo, numero, y, empresa, dadosPublicos);
        y = this.desenharCliente(doc, cliente, obra, y);
        y = this.desenharTabela(doc, itens, y);
        y = this.desenharTotais(doc, totais, y);
        if (typeof OrcamentoPDF !== "undefined") {
            y = OrcamentoPDF.desenharPagamento(doc, dadosPublicos.pagamento || {}, y);
        }
        y = this.desenharObservacoes(doc, observacoes, y);
        if (typeof OrcamentoPDF !== "undefined") {
            y = OrcamentoPDF.desenharAceite(doc, y);
        }
        this.desenharRodape(doc, dadosPublicos);

        await this.salvarOrcamentoEmitido(numero, dadosPublicos, empresa);

        doc.save(this.montarNomeArquivo(numero));
    },

    async salvarOrcamentoEmitido(numero, dadosOrcamento, empresa) {
        const dados = {
            ...dadosOrcamento,
            numero,
            empresa,
            criadoEm: Util.agora(),
            criadoEmISO: new Date().toISOString()
        };

        if (typeof DocumentPdfRepository !== "undefined" && DocumentPdfRepository) {
            return DocumentPdfRepository.salvar(dados, {
                numero,
                origem: "NOVO_ORCAMENTO",
                nomeArquivo: this.montarNomeArquivo(numero)
            });
            return;
        }

        const historico = Storage.carregar(Config.storage.historicoOrcamentos, []) || [];
        const semDuplicidade = historico.filter(item => String(item.numero || "") !== String(numero));
        Storage.salvar(Config.storage.historicoOrcamentos, [
            ...semDuplicidade,
            dados
        ]);

        if (typeof db !== "undefined" && db) {
            return db.collection("orcamentos_emitidos")
                .doc(numero)
                .set(dados)
                .catch(erro => console.error("Erro ao salvar orçamento emitido no Firestore:", erro));
        }
    },

    async obterNumeroOrcamento(numeroInformado = "") {
        const numeroExistente = String(numeroInformado || "").trim();

        if (numeroExistente) {
            return numeroExistente;
        }

        if (typeof RKFirestoreStore === "undefined" || typeof RKFirestoreStore.reservarNumeroOrcamento !== "function") {
            throw new Error("Contador central de orcamentos indisponivel. Verifique a conexao e tente novamente.");
        }

        try {
            const numero = await RKFirestoreStore.reservarNumeroOrcamento();
            const sequencia = Number(String(numero).replace(/\D/g, ""));
            if (Number.isSafeInteger(sequencia)) {
                Storage.salvar(Config.storage.numeroOrcamento, sequencia + 1);
            }
            return numero;
        } catch (erro) {
            console.error("Erro ao reservar numero central do orcamento:", erro);
            throw new Error("Nao foi possivel reservar o numero do orcamento no banco. Verifique a conexao e tente novamente.");
        }
    },

    montarNomeArquivo(numero) {
        return `RK-Vidracaria-${this.nomeArquivoSeguro(numero)}.pdf`;
    },

    nomeArquivoSeguro(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "") || "documento";
    },

    obterEmpresa() {
        return {
            nome: Util.$("empresa")?.value || "RK VIDRAÇARIA",
            cnpj: Util.$("cnpj")?.value || Config.empresa.cnpj || "60.332.101/0001-91",
            endereco: Util.$("endEmpresa")?.value || "Endereço da empresa",
            telefone: Util.$("foneEmpresa")?.value || "(00) 00000-0000",
            email: Util.$("emailEmpresa")?.value || "rkvidracaria@outlook.com"
        };
    },

    desenharCabecalho(doc, logo, numero, y, empresa, dadosOrcamento = {}) {
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
        doc.text(`Data: ${this.formatarData(dadosOrcamento.datas?.criacao) || Util.hoje()}`, 15, y);
        doc.text(`Validade: ${this.formatarData(dadosOrcamento.datas?.validade) || "15 dias"}`, 75, y);
        doc.text(`Hora: ${new Date().toLocaleTimeString("pt-BR")}`, 165, y);

        return y + 10;
    },

    desenharCliente(doc, cliente, obra, y) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Dados do Cliente e Obra", 15, y);

        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Cliente: ${cliente.nome || ""}`, 15, y);
        y += 6;
        doc.text(`Telefone: ${cliente.telefone || ""}`, 15, y);
        if (cliente.email) {
            doc.text(`E-mail: ${cliente.email}`, 95, y);
        }
        y += 6;
        doc.text(`Endereço do cliente: ${cliente.endereco || ""}`, 15, y);
        y += 6;
        doc.text(`Endereço da obra: ${obra.endereco || cliente.endereco || ""}`, 15, y);

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

            const medidas = this.formatarMedidasItem(item);
            const categoria = typeof OrcamentoModel !== "undefined"
                ? OrcamentoModel.rotuloCategoria(item.categoria)
                : item.categoria;
            const produto = this.limparItemManual(item.descricao || categoria || item.tipoVidro || "");
            const vidro = `${item.tipoVidro || ""} ${item.espessura || ""}mm ${item.cor || ""}`.trim();
            const area = this.obterAreaItem(item);

            doc.text(String(index + 1), 18, y);
            doc.text(doc.splitTextToSize(produto, 45)[0] || "", 26, y);
            doc.text(doc.splitTextToSize(vidro, 34)[0] || "", 74, y);
            doc.text(medidas, 112, y);
            doc.text(String(item.quantidade || ""), 136, y);
            doc.text(`${Util.decimal(area || 0)} m²`, 148, y);
            doc.text(Util.moeda(this.obterTotalItem(item)), 194, y, { align: "right" });

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
        doc.text("Vidro", 74, y);
        doc.text("Medidas", 112, y);
        doc.text("Qtd", 136, y);
        doc.text("Área", 148, y);
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

        const adicionais = Array.isArray(totais.adicionais) ? totais.adicionais : [];
        const totalFerragensAcessorios = Util.numero(totais.totalAdicionais) > 0
            ? Util.numero(totais.totalAdicionais)
            : adicionais.reduce((total, adicional) => total + Math.max(0, Util.numero(adicional.valor)), 0);

        if (totalFerragensAcessorios > 0) {
            if (y > 258) {
                doc.addPage();
                y = 25;
            }
            y += 7;
            doc.text("Ferragens/Acess\u00f3rios:", 135, y);
            doc.text(Util.moeda(totalFerragensAcessorios), 195, y, { align: "right" });
        }

        y += 7;
        doc.text("Desconto:", 135, y);
        doc.text(Util.moeda(totais.descontoTotal ?? totais.desconto), 195, y, { align: "right" });

        if (Util.numero(totais.acrescimo) > 0) {
            y += 7;
            doc.text("Acréscimo:", 135, y);
            doc.text(Util.moeda(totais.acrescimo), 195, y, { align: "right" });
        }

        if (Util.numero(totais.instalacao) > 0) {
            y += 7;
            doc.text("Instalação:", 135, y);
            doc.text(Util.moeda(totais.instalacao), 195, y, { align: "right" });
        }

        if (Util.numero(totais.frete) > 0) {
            y += 7;
            doc.text("Frete:", 135, y);
            doc.text(Util.moeda(totais.frete), 195, y, { align: "right" });
        }

        y += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("TOTAL FINAL:", 135, y);
        doc.text(Util.moeda(totais.totalFinal ?? totais.total), 195, y, { align: "right" });

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

    desenharRodape(doc, dadosOrcamento = {}) {
        const totalPaginas = doc.getNumberOfPages();
        const validade = this.formatarData(dadosOrcamento.datas?.validade) || "15 dias";

        for (let i = 1; i <= totalPaginas; i++) {
            doc.setPage(i);

            doc.setDrawColor(180);
            doc.line(15, 280, 195, 280);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);

            doc.text(`Validade do orçamento: ${validade}.`, 15, 286);
            doc.text("Obrigado pela preferência!", 105, 286, { align: "center" });
            doc.text(`Página ${i} de ${totalPaginas}`, 195, 286, { align: "right" });
        }
    },

    formatarMedidasItem(item = {}) {
        const largura = this.primeiroNumero(item, ["larguraCm", "largura"], 0);
        const altura = this.primeiroNumero(item, ["alturaCm", "altura"], 0);
        return `${this.formatarMedidaNumero(altura)} x ${this.formatarMedidaNumero(largura)} cm`;
    },

    limparItemManual(valor) {
        return String(valor || "")
            .replace(/item[\s_-]*manual/gi, " ")
            .replace(/preencher[\s_-]*manualmente/gi, " ")
            .replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();
    },

    formatarMedidaNumero(valor) {
        const numero = Number(valor || 0);

        if (!Number.isFinite(numero)) {
            return "0";
        }

        if (Number.isInteger(numero)) {
            return String(numero);
        }

        return numero.toLocaleString("pt-BR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    },

    obterAreaItem(item = {}) {
        const largura = this.primeiroNumero(item, ["larguraCm", "largura"], 0);
        const altura = this.primeiroNumero(item, ["alturaCm", "altura"], 0);

        if (largura > 0 && altura > 0) {
            return (largura * altura) / 10000;
        }

        return this.primeiroNumero(item, ["areaM2", "area"], 0);
    },

    obterTotalItem(item = {}) {
        const total = this.primeiroNumero(item, ["subtotalFinal", "valorTotal", "total", "totalGeral", "subtotal"], 0);
        return Math.max(0, total - Math.max(0, Util.numero(item.valorAdicional)));
    },

    primeiroNumero(objeto = {}, chaves = [], padrao = 0) {
        const chave = chaves.find(nome => {
            const valor = objeto[nome];
            return valor !== undefined && valor !== null && valor !== "";
        });

        if (!chave) {
            return padrao;
        }

        const numero = Util.numero(objeto[chave]);
        return Number.isFinite(numero) ? numero : padrao;
    },

    formatarData(valor) {
        if (!valor) return "";
        const partes = String(valor).slice(0, 10).split("-");
        if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
        return valor;
    }
};
