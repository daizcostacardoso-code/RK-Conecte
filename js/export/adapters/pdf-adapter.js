const PdfAdapter = {
    tipo: "PDF",
    pdfLibPromise: null,

    gerar(entrada = {}) {
        const preparo = this.preparar(entrada);

        if (!preparo.sucesso) {
            return preparo;
        }

        const arquivo = this.criarArquivo(preparo.exportacao);

        return {
            sucesso: true,
            formato: this.tipo,
            arquivo,
            blob: null,
            url: null,
            exportacao: {
                tipo: "PDF_COMERCIAL",
                status: "GERACAO_REAL_PREPARADA",
                nomeArquivo: arquivo.nomeArquivo,
                mimeType: arquivo.mimeType,
                extensao: arquivo.extensao,
                origemDocumento: true,
                origemHtml: false,
                geracaoEfetiva: true,
                download: false,
                bibliotecaExterna: "pdf-lib",
                prontoPara: "PDF_BYTES"
            },
            erros: [],
            detalhes: {
                simulado: false,
                bibliotecaExterna: "pdf-lib",
                geracaoEfetiva: true,
                download: false,
                preparadoPara: {
                    logoReal: true,
                    qrCode: true,
                    assinaturaDigital: true
                }
            }
        };
    },

    validar(entrada = {}) {
        const exportacao = this.normalizarEntrada(entrada);
        const documento = exportacao.documento;
        const dados = exportacao.dados;
        const erros = [];

        if (!exportacao || typeof exportacao !== "object") {
            erros.push("Exportacao PDF invalida.");
        }

        if (exportacao.formato !== "PDF") {
            erros.push("PdfAdapter aceita apenas formato PDF.");
        }

        if (!documento || typeof documento !== "object") {
            erros.push("PdfAdapter precisa receber Documento Comercial.");
        }

        if (documento && documento.tipo !== "DOCUMENTO_COMERCIAL") {
            erros.push("PdfAdapter recebeu documento fora do padrao DOCUMENTO_COMERCIAL.");
        }

        if (!dados || typeof dados !== "object") {
            erros.push("Documento Comercial precisa conter dados normalizados.");
        }

        if (!dados?.cliente?.nome) {
            erros.push("Cliente e obrigatorio para gerar PDF Comercial.");
        }

        if (!dados?.projeto?.id && !dados?.projeto?.numero && !dados?.projeto?.nome) {
            erros.push("Projeto e obrigatorio para gerar PDF Comercial.");
        }

        if (!dados?.servico?.nome) {
            erros.push("Servico e obrigatorio para gerar PDF Comercial.");
        }

        if (!Array.isArray(dados?.produtos) || !dados.produtos.length) {
            erros.push("Produtos sao obrigatorios para gerar PDF Comercial.");
        }

        if (!dados?.totais || !dados.totais.totalInformado || typeof dados.totais.totalGeral !== "number") {
            erros.push("Totais sao obrigatorios para gerar PDF Comercial.");
        }

        return {
            valido: erros.length === 0,
            erros: this.errosUnicos(erros)
        };
    },

    preparar(entrada = {}) {
        const exportacao = this.normalizarEntrada(entrada);
        const validacao = this.validar(exportacao);

        if (!validacao.valido) {
            return {
                sucesso: false,
                formato: this.tipo,
                exportacao: null,
                erros: validacao.erros,
                detalhes: {
                    validacao
                }
            };
        }

        return {
            sucesso: true,
            formato: this.tipo,
            exportacao: {
                ...exportacao,
                tipo: "PDF_COMERCIAL",
                status: "PREPARADO",
                nomeArquivo: exportacao.nomeArquivo,
                mimeType: "application/pdf",
                extensao: "pdf",
                geracaoEfetiva: true,
                download: false,
                bibliotecaExterna: "pdf-lib",
                prontoPara: "PDF_BYTES"
            },
            erros: [],
            detalhes: {
                validacao
            }
        };
    },

    criarArquivo(exportacao = {}) {
        const resultado = this.gerarArquivoPdf(exportacao);

        return {
            tipo: "PDF_BYTES",
            nomeArquivo: exportacao.nomeArquivo,
            mimeType: "application/pdf",
            extensao: "pdf",
            status: "GERANDO",
            geracaoEfetiva: true,
            download: false,
            bytes: resultado.then(resposta => resposta.bytes),
            resultado,
            gerar: () => resultado
        };
    },

    async gerarArquivoPdf(exportacao = {}) {
        try {
            const pdfLib = await this.carregarPdfLib();
            const documento = exportacao.documento;
            const dados = exportacao.dados || documento?.dados || {};
            const pdfDoc = await pdfLib.PDFDocument.create();
            const fonte = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica);
            const fonteNegrito = await pdfDoc.embedFont(pdfLib.StandardFonts.HelveticaBold);
            const estado = this.criarEstadoPdf(pdfLib, pdfDoc, fonte, fonteNegrito);
            estado.logoEmpresa = await this.carregarLogoEmpresa(pdfDoc, dados.empresa);

            this.novaPagina(estado);
            this.desenharCabecalho(estado, dados);
            this.desenharCliente(estado, dados.cliente);
            this.desenharProdutos(estado, dados.produtos, dados.totais);
            this.desenharResumoFinanceiro(estado, dados);
            this.desenharProjeto(estado, dados.projeto);
            this.desenharObservacoes(estado, dados.observacoes);
            this.desenharAssinaturas(estado, dados);
            this.desenharRodape(estado, dados);

            const bytes = await pdfDoc.save();

            return {
                sucesso: true,
                nomeArquivo: exportacao.nomeArquivo,
                mimeType: "application/pdf",
                extensao: "pdf",
                bytes,
                tamanho: bytes.length,
                erros: [],
                detalhes: {
                    paginas: pdfDoc.getPageCount(),
                    bibliotecaExterna: "pdf-lib",
                    preparadoPara: {
                        logoReal: true,
                        qrCode: true,
                        assinaturaDigital: true
                    }
                }
            };
        } catch (erro) {
            return {
                sucesso: false,
                nomeArquivo: exportacao.nomeArquivo,
                mimeType: "application/pdf",
                extensao: "pdf",
                bytes: null,
                tamanho: 0,
                erros: [erro.message || "Erro ao gerar PDF Comercial."],
                detalhes: {
                    bibliotecaExterna: "pdf-lib"
                }
            };
        }
    },

    async carregarPdfLib() {
        if (typeof PDFLib !== "undefined") {
            return PDFLib;
        }

        if (typeof globalThis !== "undefined" && globalThis.PDFLib) {
            return globalThis.PDFLib;
        }

        if (typeof require === "function") {
            return require("pdf-lib");
        }

        if (this.pdfLibPromise) {
            return this.pdfLibPromise;
        }

        this.pdfLibPromise = this.carregarPdfLibPorScript();
        return this.pdfLibPromise;
    },

    carregarPdfLibPorScript() {
        return new Promise((resolve, reject) => {
            if (typeof document === "undefined") {
                reject(new Error("pdf-lib indisponivel no ambiente atual."));
                return;
            }

            const existente = document.querySelector("script[data-pdf-lib='true']");

            if (existente) {
                existente.addEventListener("load", () => resolve(globalThis.PDFLib));
                existente.addEventListener("error", () => reject(new Error("Nao foi possivel carregar pdf-lib.")));
                return;
            }

            const script = document.createElement("script");
            script.src = this.obterCaminhoPdfLib();
            script.async = true;
            script.dataset.pdfLib = "true";
            script.onload = () => {
                if (globalThis.PDFLib) {
                    resolve(globalThis.PDFLib);
                    return;
                }

                reject(new Error("pdf-lib carregada sem expor PDFLib."));
            };
            script.onerror = () => reject(new Error("Nao foi possivel carregar pdf-lib."));
            document.head.appendChild(script);
        });
    },

    obterCaminhoPdfLib() {
        if (typeof document === "undefined") {
            return "js/vendor/pdf-lib.min.js";
        }

        const scripts = Array.from(document.querySelectorAll("script[src]"));
        const atual = scripts.find(script => script.src.includes("js/export/adapters/pdf-adapter.js"));

        if (atual) {
            return new URL("../../vendor/pdf-lib.min.js", atual.src).toString();
        }

        return "../js/vendor/pdf-lib.min.js";
    },

    async carregarLogoEmpresa(pdfDoc, empresa = {}) {
        const caminho = this.obterCaminhoLogoEmpresa(empresa);

        if (!caminho || typeof fetch !== "function") {
            return null;
        }

        if (typeof window === "undefined" && !this.ehUrlAbsoluta(caminho)) {
            return null;
        }

        try {
            const resposta = await fetch(caminho, { cache: "force-cache" });

            if (!resposta.ok) {
                return null;
            }

            const bytes = new Uint8Array(await resposta.arrayBuffer());
            const tipo = this.detectarTipoImagem(bytes, caminho);

            return tipo === "png"
                ? await pdfDoc.embedPng(bytes)
                : await pdfDoc.embedJpg(bytes);
        } catch (erro) {
            console.warn("Nao foi possivel carregar a logo da empresa no PDF.", erro);
            return null;
        }
    },

    obterCaminhoLogoEmpresa(empresa = {}) {
        const logo = empresa.logo || {};
        const informado = typeof logo === "string"
            ? logo
            : logo.url || logo.caminho || logo.src || empresa.logoUrl || empresa.logoCaminho;

        if (informado) {
            return informado;
        }

        if (typeof window !== "undefined" && window.location?.pathname?.includes("/paginas/")) {
            return "../imagens/logo.jpeg";
        }

        return "imagens/logo.jpeg";
    },

    ehUrlAbsoluta(caminho = "") {
        return /^(https?:|data:|file:|blob:)/i.test(String(caminho || ""));
    },

    detectarTipoImagem(bytes = [], caminho = "") {
        const extensao = String(caminho || "").split("?")[0].toLowerCase();

        if (extensao.endsWith(".png") || (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)) {
            return "png";
        }

        return "jpg";
    },

    normalizarEntrada(entrada = {}) {
        if (entrada?.documento) {
            const documento = entrada.documento;

            return {
                ...entrada,
                formato: "PDF",
                documento,
                dados: documento.dados || documento,
                nomeArquivo: entrada.nomeArquivo || this.montarNomeArquivo(documento)
            };
        }

        if (entrada?.tipo === "DOCUMENTO_COMERCIAL") {
            return {
                formato: "PDF",
                documento: entrada,
                dados: entrada.dados || entrada,
                nomeArquivo: this.montarNomeArquivo(entrada),
                html: ""
            };
        }

        return {
            ...entrada,
            formato: entrada.formato || "PDF",
            documento: entrada.documento || null,
            dados: entrada.dados || entrada.documento?.dados || {},
            nomeArquivo: entrada.nomeArquivo || this.montarNomeArquivo(entrada.documento)
        };
    },

    criarEstadoPdf(pdfLib, pdfDoc, fonte, fonteNegrito) {
        const largura = 595.28;
        const altura = 841.89;
        const margem = 42;

        return {
            pdfLib,
            pdfDoc,
            pagina: null,
            fonte,
            fonteNegrito,
            logoEmpresa: null,
            largura,
            altura,
            margem,
            y: altura - margem,
            corTexto: pdfLib.rgb(0.12, 0.16, 0.15),
            corSuave: pdfLib.rgb(0.38, 0.45, 0.43),
            corPrimaria: pdfLib.rgb(0.06, 0.46, 0.43),
            corLinha: pdfLib.rgb(0.82, 0.88, 0.85),
            corFundo: pdfLib.rgb(0.94, 0.98, 0.97)
        };
    },

    novaPagina(estado) {
        estado.pagina = estado.pdfDoc.addPage([841.89, 595.28]);
        const tamanho = estado.pagina.getSize();
        estado.largura = tamanho.width;
        estado.altura = tamanho.height;
        estado.y = estado.altura - estado.margem;
    },

    garantirEspaco(estado, alturaNecessaria = 80) {
        if (estado.y - alturaNecessaria < estado.margem) {
            this.novaPagina(estado);
        }
    },

    desenharCabecalho(estado, dados = {}) {
        const empresa = dados.empresa || {};
        const projeto = dados.projeto || {};
        const metadados = dados.metadados || {};
        const nomeEmpresa = empresa.nome || "RK Vidra\u00e7aria";
        const lema = empresa.lema || "Agilidade e exelencia";
        const documento = this.formatarDocumentoEmpresa(empresa.documento || empresa.cnpj || "60332101000191");
        const endereco = empresa.endereco || "Rua Guimar\u00e3es, 336 - Nilo Fraga, Porto Seguro";
        const numero = this.obterNumeroOrcamento(dados) || projeto.numero || projeto.id || "Proposta comercial";
        const logoX = estado.margem;
        const logoY = estado.y - 72;
        const logoTamanho = 64;
        const textoX = logoX + logoTamanho + 22;
        const direitaX = estado.largura - estado.margem - 154;

        estado.pagina.drawRectangle({
            x: logoX,
            y: logoY,
            width: logoTamanho,
            height: logoTamanho,
            color: estado.corFundo,
            borderColor: estado.corPrimaria,
            borderWidth: 0.8
        });

        if (estado.logoEmpresa) {
            const dimensoes = this.ajustarImagem(estado.logoEmpresa, logoTamanho - 10, logoTamanho - 10);
            estado.pagina.drawImage(estado.logoEmpresa, {
                x: logoX + (logoTamanho - dimensoes.width) / 2,
                y: logoY + (logoTamanho - dimensoes.height) / 2,
                width: dimensoes.width,
                height: dimensoes.height
            });
        } else {
            const logoTexto = empresa.logo?.texto || "RK";
            estado.pagina.drawText(this.limparTextoPdf(logoTexto).slice(0, 6), {
                x: logoX + 17,
                y: logoY + 27,
                size: 17,
                font: estado.fonteNegrito,
                color: estado.corPrimaria
            });
        }

        estado.pagina.drawText(this.limparTextoPdf(nomeEmpresa), {
            x: textoX,
            y: estado.y - 18,
            size: 24,
            font: estado.fonteNegrito,
            color: estado.corTexto
        });

        estado.pagina.drawText(this.limparTextoPdf(lema), {
            x: textoX,
            y: estado.y - 37,
            size: 10,
            font: estado.fonte,
            color: estado.corPrimaria
        });

        [
            `CNPJ: ${documento}`,
            endereco,
            empresa.telefone ? `Telefone / WhatsApp: ${empresa.telefone}` : "",
            empresa.email ? `E-mail: ${empresa.email}` : ""
        ].filter(Boolean).forEach((linha, indice) => {
            estado.pagina.drawText(this.limparTextoPdf(linha), {
                x: textoX,
                y: estado.y - 55 - (indice * 13),
                size: 8.5,
                font: estado.fonte,
                color: estado.corSuave
            });
        });

        estado.pagina.drawText("Proposta comercial", {
            x: direitaX,
            y: estado.y - 18,
            size: 9,
            font: estado.fonteNegrito,
            color: estado.corPrimaria
        });

        estado.pagina.drawText(this.limparTextoPdf(`Numero: ${numero}`), {
            x: direitaX,
            y: estado.y - 36,
            size: 8,
            font: estado.fonte,
            color: estado.corSuave
        });

        estado.pagina.drawText(this.limparTextoPdf(`Data: ${this.formatarData(metadados.geradoEm || new Date().toISOString())}`), {
            x: direitaX,
            y: estado.y - 51,
            size: 8,
            font: estado.fonte,
            color: estado.corSuave
        });

        estado.pagina.drawLine({
            start: { x: estado.margem, y: estado.y - 92 },
            end: { x: estado.largura - estado.margem, y: estado.y - 92 },
            thickness: 1,
            color: estado.corLinha
        });

        estado.y -= 112;
    },

    desenharEmpresa(estado, empresa = {}) {
        this.desenharSecao(estado, "Empresa");
        this.desenharCampos(estado, [
            ["Nome", empresa?.nome || "RK Vidracaria"],
            ["Documento", empresa?.documento],
            ["Telefone", empresa?.telefone],
            ["Email", empresa?.email],
            ["Endereco", empresa?.endereco]
        ]);
    },

    desenharCliente(estado, cliente = {}) {
        this.desenharSecao(estado, "Cliente");
        this.desenharCampos(estado, [
            ["Nome", cliente?.nome],
            ["Documento", cliente?.documento],
            ["Telefone", cliente?.telefone],
            ["Email", cliente?.email],
            ["Endereco", cliente?.endereco]
        ]);
    },

    desenharProjeto(estado, projeto = {}) {
        this.desenharSecao(estado, "Projeto");
        this.desenharCampos(estado, [
            ["Projeto", projeto?.nome || projeto?.numero || projeto?.id],
            ["Numero", projeto?.numero],
            ["Status", projeto?.status],
            ["Endereco da obra", projeto?.endereco],
            ["Responsavel", projeto?.responsavel]
        ]);
    },

    desenharServico(estado, servico = {}, servicos = []) {
        const servicosTexto = Array.isArray(servicos) && servicos.length
            ? servicos.map(item => item.nome).filter(Boolean).join(", ")
            : servico?.nome;

        this.desenharSecao(estado, "Servico");
        this.desenharCampos(estado, [
            ["Tipos de servico", servicosTexto],
            ["Categoria", servico?.categoria],
            ["Tipo de calculo", this.rotuloTipoCalculo(servico?.tipoCalculo)],
            ["Unidade de venda", servico?.unidadeVenda],
            ["Descricao", servico?.descricao]
        ]);
    },

    desenharProdutos(estado, produtos = [], totais = {}) {
        this.desenharSecao(estado, "Produtos");

        const colunas = [
            { titulo: "Item", x: estado.margem, largura: 30 },
            { titulo: "Tipo", x: estado.margem + 34, largura: 100 },
            { titulo: "Subtipo", x: estado.margem + 138, largura: 78 },
            { titulo: "Descricao", x: estado.margem + 220, largura: 130 },
            { titulo: "Medidas", x: estado.margem + 354, largura: 74 },
            { titulo: "Area", x: estado.margem + 432, largura: 58 },
            { titulo: "Qtd", x: estado.margem + 494, largura: 38 },
            { titulo: "Valor", x: estado.margem + 536, largura: 74 },
            { titulo: "Eng.", x: estado.margem + 614, largura: 70 },
            { titulo: "Subtotal", x: estado.margem + 688, largura: 70 }
        ];

        this.desenharLinhaTabela(estado, colunas.map(coluna => coluna.titulo), colunas, true);

        produtos.forEach(produto => {
            this.garantirEspaco(estado, 42);
            this.desenharLinhaTabela(estado, [
                produto.item,
                produto.tipoItemNome || produto.nome,
                produto.subtipoItem,
                produto.descricao || produto.nome,
                this.formatarMedidas(produto),
                `${this.formatarArea(produto.areaM2)} m2`,
                this.formatarNumero(produto.quantidade),
                this.formatarMoeda(produto.valorUnitario, totais?.moeda),
                Number(produto.valorAdicionalEngenharia || 0) > 0 ? this.formatarMoeda(produto.valorAdicionalEngenharia, totais?.moeda) : "",
                this.formatarMoeda(this.obterSubtotalProduto(produto), totais?.moeda)
            ], colunas, false);
        });

        estado.y -= 16;
    },

    desenharResumoFinanceiro(estado, dados = {}) {
        const totais = dados.totais || {};
        const resumo = dados.resumoFinanceiro || {};
        const moeda = totais.moeda || resumo.moeda || "BRL";

        this.desenharSecao(estado, "Resumo Financeiro");
        this.desenharCampos(estado, [
            ["Subtotal", this.formatarMoeda(totais.subtotal, moeda)],
            Number(totais.desconto || 0) > 0 ? ["Desconto", this.formatarMoeda(totais.desconto, moeda)] : null,
            Number(totais.acrescimo || 0) > 0 ? ["Acrescimo", this.formatarMoeda(totais.acrescimo, moeda)] : null,
            ["Total geral", this.formatarMoeda(totais.totalGeral, moeda)]
        ].filter(Boolean));
    },

    desenharObservacoes(estado, observacoes = {}) {
        if (!this.temValor(observacoes?.livre) && !this.temValor(observacoes?.comerciais) && !this.temValor(observacoes?.tecnicas)) {
            return;
        }

        this.desenharSecao(estado, "Observacoes");
        this.desenharCampos(estado, [
            ["Livre", observacoes?.livre],
            ["Comerciais", observacoes?.comerciais],
            ["Tecnicas", observacoes?.tecnicas]
        ]);
    },

    desenharCondicoes(estado, condicoes = {}, validade = {}) {
        const pagamento = this.comporComplemento(condicoes?.formaPagamento, condicoes?.formaPagamentoComplemento);
        const prazo = this.comporComplemento(condicoes?.prazoEntrega, condicoes?.prazoEntregaComplemento);
        const validadeTexto = validade?.descricao || condicoes?.validadeProposta;

        if (!this.temValor(pagamento) && !this.temValor(prazo) && !this.temValor(validadeTexto)) {
            return;
        }

        this.desenharSecao(estado, "Condicoes Comerciais");
        this.desenharCampos(estado, [
            ["Forma de pagamento", pagamento],
            ["Prazo de entrega", prazo],
            ["Validade da proposta", validadeTexto]
        ]);
    },

    desenharAssinaturas(estado, dados = {}) {
        this.desenharSecao(estado, "Assinaturas");
        this.garantirEspaco(estado, 92);

        const larguraLinha = 190;
        const yLinha = estado.y - 42;

        estado.pagina.drawLine({
            start: { x: estado.margem, y: yLinha },
            end: { x: estado.margem + larguraLinha, y: yLinha },
            thickness: 1,
            color: estado.corLinha
        });
        estado.pagina.drawLine({
            start: { x: estado.largura - estado.margem - larguraLinha, y: yLinha },
            end: { x: estado.largura - estado.margem, y: yLinha },
            thickness: 1,
            color: estado.corLinha
        });

        estado.pagina.drawText(this.limparTextoPdf(dados.empresa?.nome || "RK Vidracaria"), {
            x: estado.margem,
            y: yLinha - 12,
            size: 9,
            font: estado.fonte,
            color: estado.corSuave
        });
        estado.pagina.drawText(this.limparTextoPdf(dados.cliente?.nome || "Cliente"), {
            x: estado.largura - estado.margem - larguraLinha,
            y: yLinha - 12,
            size: 9,
            font: estado.fonte,
            color: estado.corSuave
        });

        estado.y = yLinha - 28;
    },

    desenharRodape(estado, dados = {}) {
        this.garantirEspaco(estado, 56);

        const texto = [
            "Obrigado pela preferencia. Esta proposta foi preparada para conferencia e aprovacao comercial.",
            `Gerado em ${this.formatarDataHora(dados.metadados?.geradoEm || new Date().toISOString())}`
        ].join(" ");

        this.desenharTextoQuebrado(estado, texto, estado.margem, estado.y, {
            largura: estado.largura - (estado.margem * 2),
            tamanho: 8,
            cor: estado.corSuave
        });

        estado.y -= 16;
    },

    desenharSecao(estado, titulo) {
        this.garantirEspaco(estado, 56);
        const xInicio = Number(estado.margem);
        const xFim = Number(estado.largura) - Number(estado.margem);
        const yLinha = Number(estado.y) - 7;

        estado.pagina.drawText(titulo, {
            x: estado.margem,
            y: estado.y,
            size: 13,
            font: estado.fonteNegrito,
            color: estado.corPrimaria
        });

        estado.pagina.drawLine({
            start: { x: xInicio, y: yLinha },
            end: { x: xFim, y: yLinha },
            thickness: 1,
            color: estado.corLinha
        });

        estado.y -= 24;
    },

    desenharCampos(estado, campos = []) {
        campos.forEach(campo => {
            const rotulo = campo[0];
            const valor = campo[1];

            if (valor === undefined || valor === null || valor === "") {
                return;
            }

            this.garantirEspaco(estado, 30);

            estado.pagina.drawText(`${rotulo}:`, {
                x: estado.margem,
                y: estado.y,
                size: 9,
                font: estado.fonteNegrito,
                color: estado.corTexto
            });

            estado.y = this.desenharTextoQuebrado(estado, valor, estado.margem + 122, estado.y, {
                largura: estado.largura - estado.margem - 122 - estado.margem,
                tamanho: 9,
                cor: estado.corTexto
            });

            estado.y -= 4;
        });

        estado.y -= 4;
    },

    desenharLinhaTabela(estado, valores = [], colunas = [], cabecalho = false) {
        const altura = cabecalho ? 22 : 30;
        const yBase = estado.y - altura + 7;

        const retangulo = {
            x: estado.margem,
            y: estado.y - altura + 2,
            width: estado.largura - (estado.margem * 2),
            height: altura,
            borderColor: estado.corLinha,
            borderWidth: 0.5
        };

        if (cabecalho) {
            retangulo.color = estado.corFundo;
        }

        estado.pagina.drawRectangle(retangulo);

        valores.forEach((valor, indice) => {
            const coluna = colunas[indice];

            if (!coluna) {
                return;
            }

            const texto = this.limitarTextoParaLargura(estado.fonte, this.limparTextoPdf(valor), cabecalho ? 8 : 8, coluna.largura || 80);

            estado.pagina.drawText(texto, {
                x: coluna.x,
                y: yBase,
                size: cabecalho ? 8 : 8,
                font: cabecalho ? estado.fonteNegrito : estado.fonte,
                color: estado.corTexto
            });
        });

        estado.y -= altura;
    },

    desenharTextoQuebrado(estado, texto, x, y, opcoes = {}) {
        const tamanho = opcoes.tamanho || 9;
        const largura = opcoes.largura || 300;
        const fonte = opcoes.fonte || estado.fonte;
        const cor = opcoes.cor || estado.corTexto;
        const linhas = this.quebrarLinhas(fonte, this.limparTextoPdf(texto), tamanho, largura);
        let yAtual = y;

        linhas.forEach(linha => {
            this.garantirEspaco(estado, 22);
            estado.pagina.drawText(linha || "", {
                x,
                y: yAtual,
                size: tamanho,
                font: fonte,
                color: cor
            });
            yAtual -= tamanho + 2;
            estado.y = yAtual;
        });

        return yAtual;
    },

    quebrarLinhas(fonte, texto, tamanho, largura) {
        const palavras = String(texto || "").split(/\s+/).filter(Boolean);
        const linhas = [];
        let linhaAtual = "";

        palavras.forEach(palavra => {
            const teste = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
            const larguraTeste = fonte.widthOfTextAtSize(teste, tamanho);

            if (larguraTeste <= largura || !linhaAtual) {
                linhaAtual = teste;
                return;
            }

            linhas.push(linhaAtual);
            linhaAtual = palavra;
        });

        if (linhaAtual) {
            linhas.push(linhaAtual);
        }

        return linhas.length ? linhas : [""];
    },

    montarNomeArquivo(documento = {}) {
        const numero = this.obterNumeroOrcamento(documento);

        return `RK-Vidracaria-${this.nomeArquivoSeguro(numero)}.pdf`;
    },

    obterNumeroOrcamento(documento = {}) {
        const dados = documento?.dados || documento || {};
        const metadados = dados.metadados || documento?.metadados || {};
        const projeto = dados.projeto || {};

        return String(
            metadados.numeroOrcamento
            || metadados.orcamentoNumero
            || dados.numero
            || dados.orcamentoNumero
            || projeto.numero
            || projeto.id
            || projeto.nome
            || "documento"
        ).trim();
    },

    nomeArquivoSeguro(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "") || "documento";
    },

    slug(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "documento";
    },

    formatarMoeda(valor, moeda = "BRL") {
        const numero = Number(valor);

        if (!Number.isFinite(numero)) {
            return "R$ 0,00";
        }

        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: moeda || "BRL"
        }).format(numero);
    },

    formatarNumero(valor, casas = 2) {
        const numero = Number(valor);

        if (!Number.isFinite(numero)) {
            return "0,00";
        }

        return numero.toLocaleString("pt-BR", {
            minimumFractionDigits: casas,
            maximumFractionDigits: casas
        });
    },

    formatarArea(valor) {
        const numero = Number(valor);

        if (!Number.isFinite(numero)) {
            return "0,00";
        }

        return numero.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        });
    },

    ajustarImagem(imagem, larguraMaxima, alturaMaxima) {
        if (!imagem?.width || !imagem?.height) {
            return {
                width: larguraMaxima,
                height: alturaMaxima
            };
        }

        const escala = Math.min(larguraMaxima / imagem.width, alturaMaxima / imagem.height);

        return {
            width: imagem.width * escala,
            height: imagem.height * escala
        };
    },

    formatarDocumentoEmpresa(valor) {
        const texto = String(valor || "").trim();
        const digitos = texto.replace(/\D/g, "");

        if (digitos.length === 14) {
            return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
        }

        return texto || "60.332.101/0001-91";
    },

    formatarMedidas(produto = {}) {
        const largura = this.primeiroNumero(produto, ["larguraCm", "largura"], 0);
        const altura = this.primeiroNumero(produto, ["alturaCm", "altura"], 0);
        return `${this.formatarNumero(largura)} x ${this.formatarNumero(altura)} cm`;
    },

    obterSubtotalProduto(produto = {}) {
        return this.primeiroNumero(produto, ["subtotalFinal", "valorTotal", "total", "totalGeral", "subtotal"], 0);
    },

    primeiroNumero(objeto = {}, chaves = [], padrao = 0) {
        const chave = chaves.find(nome => {
            const valor = objeto[nome];
            return valor !== undefined && valor !== null && valor !== "";
        });

        if (!chave) {
            return padrao;
        }

        const numero = Number(String(objeto[chave]).replace(",", "."));
        return Number.isFinite(numero) ? numero : padrao;
    },

    formatarData(valor) {
        const data = new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return "";
        }

        return data.toLocaleDateString("pt-BR");
    },

    formatarDataHora(valor) {
        const data = new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return "";
        }

        return data.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    },

    rotuloTipoCalculo(tipoCalculo) {
        const valor = String(tipoCalculo || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
        const rotulos = {
            area_m2: "\u00c1rea (m\u00b2)",
            m2: "\u00c1rea (m\u00b2)",
            linear_m: "Linear (m)",
            unidade: "Unidade",
            orcamento_itens: "Itens da proposta"
        };

        return rotulos[valor] || tipoCalculo || "";
    },

    comporComplemento(valor, complemento) {
        if (!this.temValor(valor)) {
            return "";
        }

        return this.temValor(complemento) ? `${valor} - ${complemento}` : valor;
    },

    temValor(valor) {
        return valor !== undefined && valor !== null && String(valor).trim() !== "";
    },

    limitarTextoParaLargura(fonte, texto, tamanho, largura) {
        const limpo = this.limparTextoPdf(texto);

        if (!limpo || fonte.widthOfTextAtSize(limpo, tamanho) <= largura) {
            return limpo;
        }

        let cortado = limpo;

        while (cortado.length > 3 && fonte.widthOfTextAtSize(`${cortado}...`, tamanho) > largura) {
            cortado = cortado.slice(0, -1);
        }

        return `${cortado}...`;
    },

    limparTextoPdf(valor) {
        return String(valor === undefined || valor === null ? "" : valor)
            .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF]/g, "")
            .trim();
    },

    errosUnicos(erros = []) {
        return [...new Set(erros.filter(Boolean))];
    }
};
