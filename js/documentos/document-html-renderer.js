const DocumentHtmlRenderer = {
    renderizar(documento = {}) {
        const visualizacao = DocumentRenderer.prepararVisualizacao(documento);

        if (!visualizacao.sucesso) {
            return {
                sucesso: false,
                html: "",
                erros: visualizacao.erros
            };
        }

        const dados = visualizacao.documento.dados || {};
        const html = [
            `<article class="documento-comercial" data-documento-tipo="${this.escapar(visualizacao.documento.tipo)}">`,
            this.renderizarCabecalho(dados),
            this.renderizarCliente(dados),
            this.renderizarProjeto(dados),
            this.renderizarProdutos(dados),
            this.renderizarTotais(dados),
            this.renderizarObservacoes(dados),
            this.renderizarCondicoes(dados),
            this.renderizarRodape(dados),
            "</article>"
        ].join("");

        return {
            sucesso: true,
            html,
            erros: []
        };
    },

    renderizarCabecalho(dados = {}) {
        const empresa = dados.empresa || {};
        const servico = dados.servico || {};
        const logo = empresa.logo || {};

        return [
            `<header class="documento-comercial__cabecalho">`,
            `<div class="documento-comercial__logo" aria-label="${this.escapar(logo.texto || "Logo")}">${this.escapar(logo.texto || "Logo")}</div>`,
            `<div class="documento-comercial__empresa">`,
            `<h1>Proposta Comercial</h1>`,
            `<h2>${this.escapar(empresa.nome || "RK Vidracaria")}</h2>`,
            this.renderizarCampo("Documento", empresa.documento),
            this.renderizarCampo("Telefone", empresa.telefone),
            this.renderizarCampo("E-mail", empresa.email),
            this.renderizarCampo("Endereco", empresa.endereco),
            `</div>`,
            `<div class="documento-comercial__servico-resumo">`,
            this.renderizarCampo("Servico", servico.nome),
            this.renderizarCampo("Tipo de calculo", servico.tipoCalculo),
            `</div>`,
            `</header>`
        ].join("");
    },

    renderizarCliente(dados = {}) {
        const cliente = dados.cliente || {};

        return this.renderizarSecao("Dados do cliente", [
            this.renderizarCampo("Cliente", cliente.nome),
            this.renderizarCampo("Documento", cliente.documento),
            this.renderizarCampo("Telefone", cliente.telefone),
            this.renderizarCampo("E-mail", cliente.email),
            this.renderizarCampo("Endereco", cliente.endereco)
        ]);
    },

    renderizarProjeto(dados = {}) {
        const projeto = dados.projeto || {};
        const servico = dados.servico || {};

        return this.renderizarSecao("Dados do projeto", [
            this.renderizarCampo("Projeto", projeto.nome || projeto.numero || projeto.id),
            this.renderizarCampo("Numero", projeto.numero),
            this.renderizarCampo("Status", projeto.status),
            this.renderizarCampo("Endereco da obra", projeto.endereco),
            this.renderizarCampo("Responsavel", projeto.responsavel),
            this.renderizarCampo("Servico", servico.nome),
            this.renderizarCampo("Categoria", servico.categoria),
            this.renderizarCampo("Descricao", servico.descricao)
        ]);
    },

    renderizarProdutos(dados = {}) {
        const produtos = Array.isArray(dados.produtos) ? dados.produtos : [];
        const linhas = produtos.map(produto => [
            `<tr>`,
            `<td>${this.escapar(produto.item)}</td>`,
            `<td>${this.escapar(produto.nome)}</td>`,
            `<td>${this.escapar(produto.categoria || produto.subcategoria)}</td>`,
            `<td>${this.escapar(produto.quantidade)}</td>`,
            `<td>${this.escapar(produto.unidade)}</td>`,
            `<td>${this.formatarMoeda(produto.valorUnitario, dados.totais?.moeda)}</td>`,
            `<td>${this.formatarMoeda(produto.valorTotal, dados.totais?.moeda)}</td>`,
            `</tr>`
        ].join("")).join("");

        return [
            `<section class="documento-comercial__secao documento-comercial__produtos">`,
            `<h2>Produtos</h2>`,
            `<table>`,
            `<thead><tr><th>Item</th><th>Produto</th><th>Categoria</th><th>Qtd.</th><th>Un.</th><th>Valor unitario</th><th>Total</th></tr></thead>`,
            `<tbody>${linhas}</tbody>`,
            `</table>`,
            `</section>`
        ].join("");
    },

    renderizarTotais(dados = {}) {
        const totais = dados.totais || {};
        const resumo = dados.resumoFinanceiro || {};
        const moeda = totais.moeda || resumo.moeda || "BRL";

        return this.renderizarSecao("Resumo financeiro", [
            this.renderizarCampo("Quantidade de produtos", resumo.quantidadeProdutos),
            this.renderizarCampo("Subtotal", this.formatarMoeda(totais.subtotal, moeda), true),
            this.renderizarCampo("Desconto", this.formatarMoeda(totais.desconto, moeda), true),
            this.renderizarCampo("Acrescimo", this.formatarMoeda(totais.acrescimo, moeda), true),
            this.renderizarCampo("Total geral", this.formatarMoeda(totais.totalGeral, moeda), true),
            this.renderizarCampo("Tipo de calculo", resumo.tipoCalculo),
            this.renderizarCampo("Status", resumo.status)
        ]);
    },

    renderizarObservacoes(dados = {}) {
        const observacoes = dados.observacoes || {};

        return this.renderizarSecao("Observacoes", [
            this.renderizarCampo("Livre", observacoes.livre),
            this.renderizarCampo("Comerciais", observacoes.comerciais),
            this.renderizarCampo("Tecnicas", observacoes.tecnicas)
        ]);
    },

    renderizarCondicoes(dados = {}) {
        const condicoes = dados.condicoesComerciais || {};
        const validade = dados.validade || {};

        return this.renderizarSecao("Condicoes comerciais", [
            this.renderizarCampo("Forma de pagamento", condicoes.formaPagamento),
            this.renderizarCampo("Prazo de entrega", condicoes.prazoEntrega),
            this.renderizarCampo("Validade da proposta", validade.descricao || condicoes.validadeProposta),
            this.renderizarCampo("Data de validade", validade.data)
        ]);
    },

    renderizarRodape(dados = {}) {
        const metadados = dados.metadados || {};

        return [
            `<footer class="documento-comercial__rodape">`,
            `<p>Documento Comercial preparado pelo RK-Conecte.</p>`,
            `<p>Status: ${this.escapar(metadados.status || "PREPARADO")}</p>`,
            `<p>Origem: ${this.escapar(metadados.origem || "ORCAMENTO_INTELIGENTE")}</p>`,
            `</footer>`
        ].join("");
    },

    renderizarSecao(titulo, conteudo = []) {
        return [
            `<section class="documento-comercial__secao">`,
            `<h2>${this.escapar(titulo)}</h2>`,
            `<dl>${conteudo.join("")}</dl>`,
            `</section>`
        ].join("");
    },

    renderizarCampo(rotulo, valor, valorFormatado = false) {
        const texto = valorFormatado ? String(valor || "") : this.escapar(valor);

        return [
            `<div class="documento-comercial__campo">`,
            `<dt>${this.escapar(rotulo)}</dt>`,
            `<dd>${texto || "-"}</dd>`,
            `</div>`
        ].join("");
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

    escapar(valor) {
        return String(valor === undefined || valor === null ? "" : valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

const HtmlRenderer = DocumentHtmlRenderer;
