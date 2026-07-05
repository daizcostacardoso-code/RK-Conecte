const PdfModel = {
    versao: "4.1",
    tipo: "PDF_COMERCIAL",

    criar(dados = {}) {
        return this.normalizar(dados);
    },

    normalizar(dados = {}) {
        const condicoes = this.normalizarCondicoes(dados.condicoesComerciais);

        return {
            tipo: this.tipo,
            versao: this.versao,
            preparadoEm: dados.preparadoEm || this.agoraISO(),
            empresa: this.normalizarEmpresa(dados.empresa),
            cliente: this.normalizarCliente(dados.cliente),
            projeto: this.normalizarProjeto(dados.projeto),
            servico: this.normalizarServico(dados.servico),
            produtos: this.normalizarProdutos(dados.produtos),
            totais: this.normalizarTotais(dados.totais),
            observacoes: this.normalizarObservacoes(dados.observacoes),
            condicoesComerciais: condicoes,
            validade: this.normalizarValidade(dados.validade, condicoes),
            rodape: this.normalizarRodape(dados.rodape),
            assinaturas: this.normalizarAssinaturas(dados.assinaturas),
            origem: dados.origem || {},
            resumo: dados.resumo || null
        };
    },

    normalizarEmpresa(empresa = {}) {
        return {
            nome: this.texto(empresa.nome || empresa.razaoSocial || "RK Vidracaria"),
            documento: this.texto(empresa.documento || empresa.cnpj || ""),
            telefone: this.texto(empresa.telefone || ""),
            email: this.texto(empresa.email || ""),
            endereco: this.texto(empresa.endereco || ""),
            logo: this.normalizarLogo(empresa.logo)
        };
    },

    normalizarLogo(logo = {}) {
        if (logo && typeof logo === "object") {
            return {
                tipo: this.texto(logo.tipo || "placeholder"),
                texto: this.texto(logo.texto || logo.descricao || "Logo")
            };
        }

        return {
            tipo: "placeholder",
            texto: "Logo"
        };
    },

    normalizarCliente(cliente = {}) {
        return {
            id: this.texto(cliente.id),
            nome: this.texto(cliente.nome || cliente.nomeFantasia),
            documento: this.texto(cliente.documento || cliente.cpfCnpj),
            telefone: this.texto(cliente.telefone || cliente.telefonePrincipal),
            email: this.texto(cliente.email),
            endereco: this.texto(this.obterEndereco(cliente))
        };
    },

    normalizarProjeto(projeto = {}) {
        return {
            id: this.texto(projeto.id),
            numero: this.texto(projeto.numero || projeto.codigo),
            nome: this.texto(projeto.nome || projeto.titulo || projeto.obra?.nome),
            status: this.texto(projeto.status),
            endereco: this.texto(projeto.endereco || projeto.obra?.endereco),
            responsavel: this.texto(projeto.responsavel || projeto.comercial?.responsavel),
            observacoes: this.texto(projeto.observacoes)
        };
    },

    normalizarServico(servico = {}) {
        return {
            id: this.texto(servico.id),
            nome: this.texto(servico.nome),
            categoria: this.texto(servico.categoria),
            tipoCalculo: this.texto(servico.tipoCalculo),
            descricao: this.texto(servico.descricao),
            unidadeVenda: this.texto(servico.unidadeVenda)
        };
    },

    normalizarProdutos(produtos = []) {
        return Array.isArray(produtos)
            ? produtos.map((produto, indice) => this.normalizarProduto(produto, indice))
            : [];
    },

    normalizarProduto(produto = {}, indice = 0) {
        const valorTotalOrigem = produto.total ?? produto.valorTotal ?? produto.totalGeral ?? produto.precoVenda;

        return {
            item: indice + 1,
            id: this.texto(produto.id),
            nome: this.texto(produto.nome || produto.descricao || "Produto"),
            categoria: this.texto(produto.categoria),
            subcategoria: this.texto(produto.subcategoria),
            descricao: this.texto(produto.descricao),
            unidade: this.texto(produto.unidade || produto.unidadeVenda),
            quantidade: this.numero(produto.quantidade, 1),
            valorUnitario: this.numero(produto.valorUnitario ?? produto.precoVenda, 0),
            valorTotal: this.numero(valorTotalOrigem, 0),
            observacoes: this.texto(produto.observacoes)
        };
    },

    normalizarTotais(totais = {}) {
        const totalOrigem = totais.totalGeral ?? totais.valorTotal ?? totais.totalFinal;

        return {
            subtotal: this.numero(totais.subtotal, 0),
            desconto: this.numero(totais.desconto, 0),
            acrescimo: this.numero(totais.acrescimo, 0),
            totalGeral: this.numero(totalOrigem, null),
            totalInformado: this.valorInformado(totalOrigem),
            moeda: this.texto(totais.moeda || "BRL")
        };
    },

    normalizarObservacoes(observacoes = {}) {
        return {
            livre: this.texto(observacoes.livre),
            comerciais: this.texto(observacoes.comerciais),
            tecnicas: this.texto(observacoes.tecnicas)
        };
    },

    normalizarCondicoes(condicoes = {}) {
        return {
            formaPagamento: this.texto(condicoes.formaPagamento),
            prazoEntrega: this.texto(condicoes.prazoEntrega),
            validadeProposta: this.texto(condicoes.validadeProposta)
        };
    },

    normalizarValidade(validade = {}, condicoes = {}) {
        if (validade && typeof validade === "object") {
            return {
                descricao: this.texto(validade.descricao || validade.texto || condicoes.validadeProposta),
                data: this.texto(validade.data || validade.dataValidade)
            };
        }

        return {
            descricao: this.texto(validade || condicoes.validadeProposta),
            data: ""
        };
    },

    normalizarRodape(rodape = {}) {
        return {
            texto: this.texto(rodape.texto || "Proposta comercial preparada pela RK Vidracaria."),
            observacoes: this.texto(rodape.observacoes),
            contatos: Array.isArray(rodape.contatos) ? rodape.contatos.map(contato => this.texto(contato)) : []
        };
    },

    normalizarAssinaturas(assinaturas = {}) {
        return {
            empresa: this.texto(assinaturas.empresa || "RK Vidracaria"),
            cliente: this.texto(assinaturas.cliente || "Cliente")
        };
    },

    obterEndereco(entidade = {}) {
        if (entidade.endereco) {
            return entidade.endereco;
        }

        if (Array.isArray(entidade.enderecos) && entidade.enderecos.length) {
            const endereco = entidade.enderecos[0] || {};
            return [
                endereco.logradouro,
                endereco.numero,
                endereco.bairro,
                endereco.cidade,
                endereco.uf
            ].filter(Boolean).join(", ");
        }

        return "";
    },

    texto(valor) {
        return String(valor || "").trim();
    },

    numero(valor, padrao = 0) {
        if (valor === undefined || valor === null || valor === "") {
            return padrao;
        }

        if (typeof valor === "number") {
            return Number.isFinite(valor) ? valor : padrao;
        }

        const numero = Number(String(valor).replace(",", "."));
        return Number.isFinite(numero) ? numero : padrao;
    },

    valorInformado(valor) {
        return valor !== undefined && valor !== null && valor !== "";
    },

    agoraISO() {
        return new Date().toISOString();
    }
};

function criarPdfModelo(dados = {}) {
    return PdfModel.criar(dados);
}
