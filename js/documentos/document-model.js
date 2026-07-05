const DocumentModel = {
    tipo: "DOCUMENTO_COMERCIAL",
    versao: "4.1",

    criar(dados = {}) {
        return this.normalizar(dados);
    },

    normalizar(dados = {}) {
        const condicoesComerciais = this.normalizarCondicoes(dados.condicoesComerciais);
        const totais = this.normalizarTotais(dados.totais);
        const produtos = this.normalizarProdutos(dados.produtos);

        return {
            tipo: this.tipo,
            versao: this.versao,
            empresa: this.normalizarEmpresa(dados.empresa),
            cliente: this.normalizarCliente(dados.cliente),
            projeto: this.normalizarProjeto(dados.projeto),
            servico: this.normalizarServico(dados.servico),
            produtos,
            totais,
            resumoFinanceiro: this.normalizarResumoFinanceiro(dados.resumoFinanceiro, totais, produtos),
            observacoes: this.normalizarObservacoes(dados.observacoes),
            condicoesComerciais,
            validade: this.normalizarValidade(dados.validade, condicoesComerciais),
            metadados: this.normalizarMetadados(dados.metadados)
        };
    },

    normalizarEmpresa(empresa = {}) {
        return {
            nome: this.texto(empresa.nome || empresa.razaoSocial || "RK Vidracaria"),
            documento: this.texto(empresa.documento || empresa.cnpj),
            telefone: this.texto(empresa.telefone),
            email: this.texto(empresa.email),
            endereco: this.texto(empresa.endereco),
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
            unidadeVenda: this.texto(servico.unidadeVenda),
            descricao: this.texto(servico.descricao)
        };
    },

    normalizarProdutos(produtos = []) {
        return Array.isArray(produtos)
            ? produtos.map((produto, indice) => this.normalizarProduto(produto, indice))
            : [];
    },

    normalizarProduto(produto = {}, indice = 0) {
        const valorUnitario = produto.valorUnitario ?? produto.precoVenda ?? produto.valorVenda;
        const valorTotal = produto.valorTotal ?? produto.total ?? produto.totalGeral ?? valorUnitario;

        return {
            item: indice + 1,
            id: this.texto(produto.id),
            nome: this.texto(produto.nome || produto.descricao || "Produto"),
            descricao: this.texto(produto.descricao),
            categoria: this.texto(produto.categoria),
            subcategoria: this.texto(produto.subcategoria),
            unidade: this.texto(produto.unidade || produto.unidadeVenda),
            quantidade: this.numero(produto.quantidade, 1),
            valorUnitario: this.numero(valorUnitario, 0),
            valorTotal: this.numero(valorTotal, 0),
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

    normalizarResumoFinanceiro(resumoFinanceiro = {}, totais = {}, produtos = []) {
        return {
            quantidadeProdutos: this.numero(resumoFinanceiro.quantidadeProdutos, produtos.length),
            subtotal: this.numero(resumoFinanceiro.subtotal, totais.subtotal || 0),
            desconto: this.numero(resumoFinanceiro.desconto, totais.desconto || 0),
            acrescimo: this.numero(resumoFinanceiro.acrescimo, totais.acrescimo || 0),
            totalGeral: this.numero(resumoFinanceiro.totalGeral, totais.totalGeral),
            tipoCalculo: this.texto(resumoFinanceiro.tipoCalculo),
            status: this.texto(resumoFinanceiro.status),
            moeda: this.texto(resumoFinanceiro.moeda || totais.moeda || "BRL")
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

    normalizarValidade(validade = {}, condicoesComerciais = {}) {
        if (validade && typeof validade === "object") {
            return {
                descricao: this.texto(validade.descricao || validade.texto || condicoesComerciais.validadeProposta),
                data: this.texto(validade.data || validade.dataValidade)
            };
        }

        return {
            descricao: this.texto(validade || condicoesComerciais.validadeProposta),
            data: ""
        };
    },

    normalizarMetadados(metadados = {}) {
        const agora = this.agoraISO();

        return {
            origem: this.texto(metadados.origem || "ORCAMENTO_INTELIGENTE"),
            preparadoPara: this.lista(metadados.preparadoPara, ["PDF", "IMPRESSAO", "WHATSAPP", "EMAIL", "WEB"]),
            status: this.texto(metadados.status || "PREPARADO"),
            versaoOrigem: this.texto(metadados.versaoOrigem),
            criadoEm: this.texto(metadados.criadoEm),
            atualizadoEm: this.texto(metadados.atualizadoEm),
            geradoEm: this.texto(metadados.geradoEm || agora),
            dependencias: metadados.dependencias || {}
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

    lista(valor, padrao = []) {
        return Array.isArray(valor) && valor.length ? valor : padrao;
    },

    agoraISO() {
        return new Date().toISOString();
    }
};

function criarDocumentoComercial(dados = {}) {
    return DocumentModel.criar(dados);
}
