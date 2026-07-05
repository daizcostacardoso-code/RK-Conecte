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

            this.novaPagina(estado);
            this.desenharCabecalho(estado, dados);
            this.desenharEmpresa(estado, dados.empresa);
            this.desenharCliente(estado, dados.cliente);
            this.desenharProjeto(estado, dados.projeto);
            this.desenharServico(estado, dados.servico);
            this.desenharProdutos(estado, dados.produtos, dados.totais);
            this.desenharResumoFinanceiro(estado, dados);
            this.desenharObservacoes(estado, dados.observacoes);
            this.desenharCondicoes(estado, dados.condicoesComerciais, dados.validade);
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
        estado.pagina = estado.pdfDoc.addPage();
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
        const logoTexto = empresa.logo?.texto || "RK";

        estado.pagina.drawRectangle({
            x: estado.margem,
            y: estado.y - 58,
            width: 58,
            height: 58,
            color: estado.corFundo,
            borderColor: estado.corPrimaria,
            borderWidth: 1
        });

        estado.pagina.drawText(this.limparTextoPdf(logoTexto).slice(0, 6), {
            x: estado.margem + 13,
            y: estado.y - 36,
            size: 16,
            font: estado.fonteNegrito,
            color: estado.corPrimaria
        });

        estado.pagina.drawText("Proposta Comercial", {
            x: estado.margem + 76,
            y: estado.y - 18,
            size: 22,
            font: estado.fonteNegrito,
            color: estado.corTexto
        });

        estado.pagina.drawText(this.limparTextoPdf(empresa.nome || "RK Vidracaria"), {
            x: estado.margem + 76,
            y: estado.y - 40,
            size: 11,
            font: estado.fonte,
            color: estado.corSuave
        });

        estado.pagina.drawText("QR Code futuro", {
            x: estado.largura - estado.margem - 82,
            y: estado.y - 18,
            size: 8,
            font: estado.fonte,
            color: estado.corSuave
        });

        estado.pagina.drawRectangle({
            x: estado.largura - estado.margem - 54,
            y: estado.y - 58,
            width: 54,
            height: 54,
            borderColor: estado.corLinha,
            borderWidth: 1
        });

        estado.y -= 82;
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

    desenharServico(estado, servico = {}) {
        this.desenharSecao(estado, "Servicos");
        this.desenharCampos(estado, [
            ["Servico", servico?.nome],
            ["Categoria", servico?.categoria],
            ["Tipo de calculo", servico?.tipoCalculo],
            ["Unidade de venda", servico?.unidadeVenda],
            ["Descricao", servico?.descricao]
        ]);
    },

    desenharProdutos(estado, produtos = [], totais = {}) {
        this.desenharSecao(estado, "Produtos");

        const colunas = [
            { titulo: "Item", x: estado.margem, largura: 32 },
            { titulo: "Produto", x: estado.margem + 40, largura: 206 },
            { titulo: "Qtd", x: estado.margem + 254, largura: 44 },
            { titulo: "Un", x: estado.margem + 306, largura: 44 },
            { titulo: "Total", x: estado.margem + 358, largura: 130 }
        ];

        this.desenharLinhaTabela(estado, colunas.map(coluna => coluna.titulo), colunas, true);

        produtos.forEach(produto => {
            this.garantirEspaco(estado, 42);
            this.desenharLinhaTabela(estado, [
                produto.item,
                produto.nome,
                produto.quantidade,
                produto.unidade,
                this.formatarMoeda(produto.valorTotal, totais?.moeda)
            ], colunas, false);
        });

        estado.y -= 8;
    },

    desenharResumoFinanceiro(estado, dados = {}) {
        const totais = dados.totais || {};
        const resumo = dados.resumoFinanceiro || {};
        const moeda = totais.moeda || resumo.moeda || "BRL";

        this.desenharSecao(estado, "Resumo Financeiro");
        this.desenharCampos(estado, [
            ["Quantidade de produtos", resumo.quantidadeProdutos],
            ["Subtotal", this.formatarMoeda(totais.subtotal, moeda)],
            ["Desconto", this.formatarMoeda(totais.desconto, moeda)],
            ["Acrescimo", this.formatarMoeda(totais.acrescimo, moeda)],
            ["Total geral", this.formatarMoeda(totais.totalGeral, moeda)],
            ["Tipo de calculo", resumo.tipoCalculo],
            ["Status", resumo.status]
        ]);
    },

    desenharObservacoes(estado, observacoes = {}) {
        this.desenharSecao(estado, "Observacoes");
        this.desenharCampos(estado, [
            ["Livre", observacoes?.livre],
            ["Comerciais", observacoes?.comerciais],
            ["Tecnicas", observacoes?.tecnicas]
        ]);
    },

    desenharCondicoes(estado, condicoes = {}, validade = {}) {
        this.desenharSecao(estado, "Condicoes Comerciais");
        this.desenharCampos(estado, [
            ["Forma de pagamento", condicoes?.formaPagamento],
            ["Prazo de entrega", condicoes?.prazoEntrega],
            ["Validade da proposta", validade?.descricao || condicoes?.validadeProposta],
            ["Data de validade", validade?.data]
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
            y: yLinha - 16,
            size: 9,
            font: estado.fonte,
            color: estado.corSuave
        });
        estado.pagina.drawText(this.limparTextoPdf(dados.cliente?.nome || "Cliente"), {
            x: estado.largura - estado.margem - larguraLinha,
            y: yLinha - 16,
            size: 9,
            font: estado.fonte,
            color: estado.corSuave
        });

        estado.pagina.drawText("Assinatura digital futura", {
            x: estado.margem,
            y: yLinha - 34,
            size: 8,
            font: estado.fonte,
            color: estado.corSuave
        });

        estado.y = yLinha - 52;
    },

    desenharRodape(estado, dados = {}) {
        this.garantirEspaco(estado, 56);

        const metadados = dados.metadados || {};
        const texto = [
            "Documento Comercial preparado pelo RK-Conecte.",
            `Origem: ${metadados.origem || "ORCAMENTO_INTELIGENTE"}`,
            `Status: ${metadados.status || "PREPARADO"}`
        ].join(" | ");

        this.desenharTextoQuebrado(estado, texto, estado.margem, estado.y, {
            largura: estado.largura - (estado.margem * 2),
            tamanho: 8,
            cor: estado.corSuave
        });

        estado.y -= 16;
    },

    desenharSecao(estado, titulo) {
        this.garantirEspaco(estado, 56);

        estado.pagina.drawText(titulo, {
            x: estado.margem,
            y: estado.y,
            size: 13,
            font: estado.fonteNegrito,
            color: estado.corPrimaria
        });

        estado.pagina.drawLine({
            start: { x: estado.margem, y: estado.y - 7 },
            end: { x: estado.largura - estado.margem, y: estado.y - 7 },
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

            this.garantirEspaco(estado, 34);

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

            estado.y -= 8;
        });

        estado.y -= 8;
    },

    desenharLinhaTabela(estado, valores = [], colunas = [], cabecalho = false) {
        const altura = cabecalho ? 22 : 30;
        const yBase = estado.y - altura + 7;

        estado.pagina.drawRectangle({
            x: estado.margem,
            y: estado.y - altura + 2,
            width: estado.largura - (estado.margem * 2),
            height: altura,
            color: cabecalho ? estado.corFundo : undefined,
            borderColor: estado.corLinha,
            borderWidth: 0.5
        });

        valores.forEach((valor, indice) => {
            const coluna = colunas[indice];

            if (!coluna) {
                return;
            }

            estado.pagina.drawText(this.limparTextoPdf(valor), {
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
            this.garantirEspaco(estado, 24);
            estado.pagina.drawText(linha || "-", {
                x,
                y: yAtual,
                size: tamanho,
                font: fonte,
                color: cor
            });
            yAtual -= tamanho + 3;
            estado.y = yAtual;
        });

        return yAtual + tamanho + 3;
    },

    quebrarLinhas(fonte, texto, tamanho, largura) {
        const palavras = String(texto || "-").split(/\s+/);
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

        return linhas.length ? linhas : ["-"];
    },

    montarNomeArquivo(documento = {}) {
        const dados = documento?.dados || {};
        const projeto = dados.projeto?.numero || dados.projeto?.id || dados.projeto?.nome || "documento";
        const cliente = dados.cliente?.nome || "cliente";

        return `proposta-comercial-${this.slug(projeto)}-${this.slug(cliente)}.pdf`;
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

    limparTextoPdf(valor) {
        return String(valor === undefined || valor === null ? "" : valor)
            .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF]/g, "")
            .trim() || "-";
    },

    errosUnicos(erros = []) {
        return [...new Set(erros.filter(Boolean))];
    }
};
