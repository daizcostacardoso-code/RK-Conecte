const DocumentBuilder = {
    montarDocumento(modelo = {}) {
        const documento = DocumentModel.criar(modelo);

        return {
            tipo: documento.tipo,
            versao: documento.versao,
            metadados: documento.metadados,
            dados: documento,
            secoes: {
                cabecalho: this.montarCabecalho(documento),
                cliente: this.montarCliente(documento),
                projeto: this.montarProjeto(documento),
                produtos: this.montarProdutos(documento),
                totais: this.montarTotais(documento),
                rodape: this.montarRodape(documento)
            },
            ordem: [
                "cabecalho",
                "cliente",
                "projeto",
                "produtos",
                "totais",
                "rodape"
            ]
        };
    },

    montarCabecalho(documento = {}) {
        return {
            titulo: "Documento Comercial",
            empresa: documento.empresa || {},
            servico: documento.servico || {},
            validade: documento.validade || {}
        };
    },

    montarCliente(documento = {}) {
        return {
            titulo: "Cliente",
            dados: documento.cliente || {},
            observacoes: documento.observacoes || {}
        };
    },

    montarProjeto(documento = {}) {
        return {
            titulo: "Projeto",
            dados: documento.projeto || {},
            servico: documento.servico || {},
            condicoesComerciais: documento.condicoesComerciais || {}
        };
    },

    montarProdutos(documento = {}) {
        return {
            titulo: "Produtos",
            colunas: [
                "item",
                "nome",
                "categoria",
                "quantidade",
                "unidade",
                "valorUnitario",
                "valorTotal"
            ],
            linhas: Array.isArray(documento.produtos) ? documento.produtos : []
        };
    },

    montarTotais(documento = {}) {
        return {
            titulo: "Resumo financeiro",
            totais: documento.totais || {},
            resumoFinanceiro: documento.resumoFinanceiro || {}
        };
    },

    montarRodape(documento = {}) {
        return {
            titulo: "Rodape",
            validade: documento.validade || {},
            observacoes: documento.observacoes || {},
            condicoesComerciais: documento.condicoesComerciais || {},
            metadados: documento.metadados || {}
        };
    }
};
