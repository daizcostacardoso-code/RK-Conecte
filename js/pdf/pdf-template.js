const PdfTemplate = {
    versao: "4.1",

    criar(modelo = {}) {
        const dados = typeof PdfModel !== "undefined" ? PdfModel.criar(modelo) : modelo;

        return {
            tipo: "PDF_COMERCIAL_TEMPLATE",
            versao: this.versao,
            formato: "dados_estruturados",
            cabecalho: this.montarCabecalho(dados),
            dadosCliente: this.montarDadosCliente(dados),
            resumoProjeto: this.montarResumoProjeto(dados),
            tabelaProdutos: this.montarTabelaProdutos(dados),
            resumoFinanceiro: this.montarResumoFinanceiro(dados),
            observacoes: this.montarObservacoes(dados),
            assinaturas: this.montarAssinaturas(dados),
            rodape: this.montarRodape(dados)
        };
    },

    montarCabecalho(modelo = {}) {
        return {
            titulo: "Proposta Comercial",
            logo: modelo.empresa?.logo || { tipo: "placeholder", texto: "Logo" },
            empresa: {
                nome: modelo.empresa?.nome || "",
                documento: modelo.empresa?.documento || "",
                telefone: modelo.empresa?.telefone || "",
                email: modelo.empresa?.email || "",
                endereco: modelo.empresa?.endereco || ""
            }
        };
    },

    montarDadosCliente(modelo = {}) {
        return {
            titulo: "Dados do cliente",
            campos: [
                { rotulo: "Cliente", valor: modelo.cliente?.nome || "" },
                { rotulo: "Documento", valor: modelo.cliente?.documento || "" },
                { rotulo: "Telefone", valor: modelo.cliente?.telefone || "" },
                { rotulo: "Email", valor: modelo.cliente?.email || "" },
                { rotulo: "Endereco", valor: modelo.cliente?.endereco || "" }
            ]
        };
    },

    montarResumoProjeto(modelo = {}) {
        const projetoNome = modelo.projeto?.nome || modelo.projeto?.numero || "";
        const campos = [
            projetoNome ? { rotulo: "Projeto", valor: projetoNome } : null,
            modelo.projeto?.status ? { rotulo: "Status", valor: modelo.projeto.status } : null,
            modelo.projeto?.endereco ? { rotulo: "Endereco da obra", valor: modelo.projeto.endereco } : null,
            { rotulo: "Servico", valor: modelo.servico?.nome || "" },
            { rotulo: "Tipo de calculo", valor: modelo.servico?.tipoCalculo || "" }
        ].filter(Boolean);

        return {
            titulo: projetoNome ? "Resumo do projeto" : "Resumo do servico",
            campos
        };
    },

    montarTabelaProdutos(modelo = {}) {
        return {
            titulo: "Produtos",
            colunas: [
                "Item",
                "Produto",
                "Categoria",
                "Quantidade",
                "Unidade",
                "Valor unitario",
                "Total"
            ],
            linhas: (modelo.produtos || []).map(produto => ({
                item: produto.item,
                produto: produto.nome,
                categoria: produto.categoria || produto.subcategoria,
                quantidade: produto.quantidade,
                unidade: produto.unidade,
                valorUnitario: produto.valorUnitario,
                total: produto.valorTotal
            }))
        };
    },

    montarResumoFinanceiro(modelo = {}) {
        return {
            titulo: "Resumo financeiro",
            campos: [
                { rotulo: "Subtotal", valor: modelo.totais?.subtotal ?? 0 },
                { rotulo: "Desconto", valor: modelo.totais?.desconto ?? 0 },
                { rotulo: "Acrescimo", valor: modelo.totais?.acrescimo ?? 0 },
                { rotulo: "Total geral", valor: modelo.totais?.totalGeral ?? 0 }
            ],
            moeda: modelo.totais?.moeda || "BRL",
            condicoesComerciais: modelo.condicoesComerciais || {},
            validade: modelo.validade || {}
        };
    },

    montarObservacoes(modelo = {}) {
        return {
            titulo: "Observacoes",
            livre: modelo.observacoes?.livre || "",
            comerciais: modelo.observacoes?.comerciais || "",
            tecnicas: modelo.observacoes?.tecnicas || ""
        };
    },

    montarAssinaturas(modelo = {}) {
        return {
            titulo: "Assinaturas",
            campos: [
                { rotulo: "Empresa", valor: modelo.assinaturas?.empresa || "" },
                { rotulo: "Cliente", valor: modelo.assinaturas?.cliente || "" }
            ]
        };
    },

    montarRodape(modelo = {}) {
        return {
            texto: modelo.rodape?.texto || "",
            observacoes: modelo.rodape?.observacoes || "",
            contatos: modelo.rodape?.contatos || []
        };
    }
};
