const DocumentModel = {
    tipo: "DOCUMENTO_COMERCIAL",
    versao: "4.1",
    empresaPadrao: {
        nome: "RK Vidra\u00e7aria",
        documento: "60.332.101/0001-91",
        cnpj: "60.332.101/0001-91",
        lema: "Agilidade e exelencia",
        telefone: "(73) 9981-9768",
        email: "",
        endereco: "Rua Guimar\u00e3es, 336 - Nilo Fraga, Porto Seguro",
        logo: {
            tipo: "imagem",
            texto: "RK",
            url: "../imagens/logo.jpeg",
            caminho: "../imagens/logo.jpeg"
        }
    },

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
            servicos: this.normalizarServicos(dados.servicos || dados.servicosSelecionados || []),
            produtos,
            totais,
            resumoFinanceiro: this.normalizarResumoFinanceiro(dados.resumoFinanceiro, totais, produtos),
            observacoes: this.normalizarObservacoes(dados.observacoes),
            condicoesComerciais,
            ajustesFinanceiros: dados.ajustesFinanceiros || {},
            validade: this.normalizarValidade(dados.validade, condicoesComerciais),
            metadados: this.normalizarMetadados(dados.metadados)
        };
    },

    normalizarEmpresa(empresa = {}) {
        const padrao = this.empresaPadrao;
        const logo = empresa.logo && typeof empresa.logo === "object"
            ? { ...padrao.logo, ...empresa.logo }
            : padrao.logo;

        return {
            nome: this.texto(empresa.nome || empresa.razaoSocial || padrao.nome),
            documento: this.texto(empresa.documento || empresa.cnpj || padrao.documento),
            cnpj: this.texto(empresa.cnpj || empresa.documento || padrao.cnpj),
            lema: this.texto(empresa.lema || padrao.lema),
            telefone: this.texto(empresa.telefone || padrao.telefone),
            email: this.texto(empresa.email || padrao.email),
            endereco: this.texto(empresa.endereco || padrao.endereco),
            logo: this.normalizarLogo(logo)
        };
    },

    normalizarLogo(logo = {}) {
        if (logo && typeof logo === "object") {
            return {
                tipo: this.texto(logo.tipo || "marca"),
                texto: this.texto(logo.texto || logo.descricao || "RK"),
                url: this.texto(logo.url || logo.src || logo.caminho),
                caminho: this.texto(logo.caminho || logo.url || logo.src)
            };
        }

        return {
            tipo: "marca",
            texto: "RK",
            url: "",
            caminho: ""
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

    normalizarServicos(servicos = []) {
        const lista = Array.isArray(servicos) ? servicos : [];
        return lista.map(servico => this.normalizarServico(servico));
    },

    normalizarProdutos(produtos = []) {
        return Array.isArray(produtos)
            ? produtos.map((produto, indice) => this.normalizarProduto(produto, indice))
            : [];
    },

    normalizarProduto(produto = {}, indice = 0) {
        const valorUnitario = this.primeiroNumero(produto, ["valorUnitario", "precoVenda", "valorVenda"], 0);
        const valorTotal = this.primeiroNumero(
            produto,
            ["subtotalFinal", "valorTotal", "total", "totalGeral", "subtotal"],
            valorUnitario
        );
        const larguraCm = this.primeiroNumero(produto, ["larguraCm", "largura"], 0);
        const alturaCm = this.primeiroNumero(produto, ["alturaCm", "altura"], 0);
        const areaCalculada = larguraCm > 0 && alturaCm > 0 ? (larguraCm * alturaCm) / 10000 : null;
        const areaM2 = areaCalculada ?? this.primeiroNumero(produto, ["areaM2", "area"], 0);

        return {
            item: indice + 1,
            id: this.texto(produto.id),
            produtoId: this.texto(produto.produtoId || produto.id),
            nome: this.texto(produto.nome || produto.descricao || "Item"),
            descricao: this.texto(produto.descricao),
            categoria: this.texto(produto.categoria),
            subcategoria: this.texto(produto.subcategoria),
            grupoServico: this.texto(produto.grupoServico || produto.categoria),
            grupoServicoNome: this.texto(produto.grupoServicoNome),
            tipoItem: this.texto(produto.tipoItem || produto.subcategoria),
            tipoItemNome: this.texto(produto.tipoItemNome || produto.nome),
            subtipoItem: this.texto(produto.subtipoItem),
            dependencias: this.lista(produto.dependencias, []),
            tipoDimensao: this.texto(produto.tipoDimensao),
            tamanhoPadraoSelecionado: this.texto(produto.tamanhoPadraoSelecionado),
            tamanhoPadraoNome: this.texto(produto.tamanhoPadraoNome),
            unidade: this.texto(produto.unidade || produto.unidadeVenda),
            quantidade: this.numero(produto.quantidade, 1),
            larguraCm,
            alturaCm,
            areaM2: this.arredondar(areaM2, 4),
            valorUnitario,
            percentualEngenharia: this.numero(produto.percentualEngenharia, 0),
            valorAdicionalEngenharia: this.primeiroNumero(produto, ["valorAdicionalEngenharia", "adicionalEngenharia"], 0),
            subtotalBase: this.numero(produto.subtotalBase, 0),
            subtotalFinal: this.primeiroNumero(produto, ["subtotalFinal", "valorTotal", "total", "totalGeral", "subtotal"], valorTotal),
            valorTotal,
            subtotal: valorTotal,
            observacoes: this.texto(produto.observacoes || produto.observacao)
        };
    },

    normalizarTotais(totais = {}) {
        const subtotal = this.numero(totais.subtotal, 0);
        const desconto = this.numero(totais.desconto, 0);
        const acrescimo = this.numero(totais.acrescimo, 0);
        const totalOrigem = totais.totalGeral ?? totais.valorTotal ?? totais.totalFinal ?? totais.total ?? Math.max(0, subtotal - desconto + acrescimo);

        return {
            subtotal,
            desconto,
            acrescimo,
            totalGeral: this.numero(totalOrigem, null),
            totalInformado: this.valorInformado(totalOrigem),
            areaTotalM2: this.numero(totais.areaTotalM2, 0),
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
            areaTotalM2: this.numero(resumoFinanceiro.areaTotalM2, totais.areaTotalM2 || 0),
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
            formaPagamentoComplemento: this.texto(condicoes.formaPagamentoComplemento),
            prazoEntrega: this.texto(condicoes.prazoEntrega),
            prazoEntregaComplemento: this.texto(condicoes.prazoEntregaComplemento),
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
        const numeroOrcamento = this.texto(metadados.numeroOrcamento || metadados.orcamentoNumero || metadados.numero);

        return {
            origem: this.texto(metadados.origem || "ORCAMENTO_INTELIGENTE"),
            numeroOrcamento,
            orcamentoNumero: numeroOrcamento,
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

    primeiroNumero(objeto = {}, chaves = [], padrao = 0) {
        const chave = chaves.find(nome => {
            const valor = objeto[nome];
            return valor !== undefined && valor !== null && valor !== "";
        });

        return chave ? this.numero(objeto[chave], padrao) : padrao;
    },

    arredondar(valor, casas = 2) {
        const fator = 10 ** casas;
        return Math.round((this.numero(valor, 0) + Number.EPSILON) * fator) / fator;
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
