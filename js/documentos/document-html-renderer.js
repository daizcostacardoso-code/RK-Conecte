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
            this.renderizarClienteProjeto(dados),
            this.renderizarProdutos(dados),
            this.renderizarTotais(dados),
            this.renderizarCondicoes(dados),
            this.renderizarObservacoes(dados),
            this.renderizarAssinaturas(dados),
            this.renderizarRodape(dados),
            "</article>"
        ].filter(Boolean).join("");

        return {
            sucesso: true,
            html,
            erros: []
        };
    },

    renderizarCabecalho(dados = {}) {
        const empresa = dados.empresa || {};
        const projeto = dados.projeto || {};
        const metadados = dados.metadados || {};
        const numero = projeto.numero || projeto.id || "Proposta comercial";
        const data = this.formatarData(metadados.geradoEm || metadados.atualizadoEm || new Date().toISOString());

        return [
            `<header class="documento-comercial__cabecalho">`,
            `<div class="documento-comercial__marca">`,
            `<div class="documento-comercial__logo" aria-label="RK">RK</div>`,
            `<div>`,
            `<h1>Proposta Comercial</h1>`,
            `<h2>${this.escapar(empresa.nome || "RK Vidra\u00e7aria")}</h2>`,
            `</div>`,
            `</div>`,
            `<dl class="documento-comercial__meta">`,
            this.renderizarCampo("Numero", numero),
            this.renderizarCampo("Data", data),
            this.renderizarCampo("Telefone", empresa.telefone),
            this.renderizarCampo("E-mail", empresa.email),
            `</dl>`,
            `</header>`
        ].join("");
    },

    renderizarClienteProjeto(dados = {}) {
        const cliente = dados.cliente || {};
        const projeto = dados.projeto || {};
        const servico = dados.servico || {};
        const servicos = Array.isArray(dados.servicos) && dados.servicos.length
            ? dados.servicos.map(item => item.nome).filter(Boolean).join(", ")
            : servico.nome;

        return [
            `<section class="documento-comercial__duas-colunas">`,
            this.renderizarSecao("Cliente", [
                this.renderizarCampo("Nome", cliente.nome),
                this.renderizarCampo("Telefone", cliente.telefone),
                this.renderizarCampo("E-mail", cliente.email),
                this.renderizarCampo("Endereco", cliente.endereco)
            ]),
            this.renderizarSecao("Projeto / servi\u00e7o", [
                this.renderizarCampo("Projeto", projeto.nome || projeto.numero || projeto.id),
                this.renderizarCampo("Tipos de servi\u00e7o", servicos),
                this.renderizarCampo("Tipo de calculo", this.rotuloTipoCalculo(servico.tipoCalculo || dados.resumoFinanceiro?.tipoCalculo)),
                this.renderizarCampo("Endereco da obra", projeto.endereco)
            ]),
            `</section>`
        ].join("");
    },

    renderizarProdutos(dados = {}) {
        const produtos = Array.isArray(dados.produtos) ? dados.produtos : [];

        if (!produtos.length) {
            return "";
        }

        const linhas = produtos.map(produto => [
            `<tr>`,
            `<td>${this.escapar(produto.item)}</td>`,
            `<td>${this.escapar(produto.tipoItemNome || produto.nome)}</td>`,
            `<td>${this.escapar(produto.subtipoItem)}</td>`,
            `<td>${this.escapar(produto.descricao || produto.nome)}</td>`,
            `<td>${this.escapar(this.formatarMedidas(produto))}</td>`,
            `<td>${this.escapar(this.formatarArea(produto.areaM2))}</td>`,
            `<td>${this.escapar(this.formatarNumero(produto.quantidade))}</td>`,
            `<td>${this.formatarMoeda(produto.valorUnitario, dados.totais?.moeda)}</td>`,
            `<td>${Number(produto.valorAdicionalEngenharia || 0) > 0 ? this.formatarMoeda(produto.valorAdicionalEngenharia, dados.totais?.moeda) : ""}</td>`,
            `<td>${this.formatarMoeda(produto.subtotal ?? produto.valorTotal, dados.totais?.moeda)}</td>`,
            `</tr>`
        ].join("")).join("");

        return [
            `<section class="documento-comercial__secao documento-comercial__produtos">`,
            `<h2>Itens da proposta</h2>`,
            `<div class="documento-comercial__tabela-wrap">`,
            `<table>`,
            `<thead><tr><th>Item</th><th>Tipo</th><th>Subtipo</th><th>Descri&ccedil;&atilde;o</th><th>Medidas em cm</th><th>&Aacute;rea (m&sup2;)</th><th>Qtd.</th><th>Valor unit.</th><th>Engenharia</th><th>Subtotal</th></tr></thead>`,
            `<tbody>${linhas}</tbody>`,
            `</table>`,
            `</div>`,
            `</section>`
        ].join("");
    },

    renderizarTotais(dados = {}) {
        const totais = dados.totais || {};
        const resumo = dados.resumoFinanceiro || {};
        const moeda = totais.moeda || resumo.moeda || "BRL";

        const campos = [
            this.renderizarCampo("Subtotal", this.formatarMoeda(totais.subtotal, moeda), true),
            Number(totais.desconto || 0) > 0 ? this.renderizarCampo("Desconto", this.formatarMoeda(totais.desconto, moeda), true) : "",
            Number(totais.acrescimo || 0) > 0 ? this.renderizarCampo("Acr\u00e9scimo", this.formatarMoeda(totais.acrescimo, moeda), true) : "",
            this.renderizarCampo("Total geral", this.formatarMoeda(totais.totalGeral, moeda), true, "documento-comercial__total")
        ];

        return this.renderizarSecao("Resumo financeiro", campos, "documento-comercial__resumo-financeiro");
    },

    renderizarCondicoes(dados = {}) {
        const condicoes = dados.condicoesComerciais || {};
        const validade = dados.validade || {};
        const pagamento = this.comporComplemento(condicoes.formaPagamento, condicoes.formaPagamentoComplemento);
        const prazo = this.comporComplemento(condicoes.prazoEntrega, condicoes.prazoEntregaComplemento);

        return this.renderizarSecao("Condi\u00e7\u00f5es comerciais", [
            this.renderizarCampo("Forma de pagamento", pagamento),
            this.renderizarCampo("Prazo de entrega", prazo),
            this.renderizarCampo("Validade da proposta", validade.descricao || condicoes.validadeProposta)
        ]);
    },

    renderizarObservacoes(dados = {}) {
        const observacoes = dados.observacoes || {};
        const blocos = [
            ["Observa\u00e7\u00e3o livre", observacoes.livre],
            ["Observa\u00e7\u00f5es comerciais", observacoes.comerciais],
            ["Observa\u00e7\u00f5es t\u00e9cnicas", observacoes.tecnicas]
        ].filter(([, valor]) => this.valorPreenchido(valor));

        if (!blocos.length) {
            return "";
        }

        return [
            `<section class="documento-comercial__secao documento-comercial__observacoes">`,
            `<h2>Observa&ccedil;&otilde;es</h2>`,
            blocos.map(([rotulo, valor]) => [
                `<article>`,
                `<h3>${this.escapar(rotulo)}</h3>`,
                `<p>${this.escapar(valor)}</p>`,
                `</article>`
            ].join("")).join(""),
            `</section>`
        ].join("");
    },

    renderizarAssinaturas(dados = {}) {
        const empresa = dados.empresa || {};
        const cliente = dados.cliente || {};

        return [
            `<section class="documento-comercial__assinaturas">`,
            `<div><span></span><strong>${this.escapar(empresa.nome || "RK Vidra\u00e7aria")}</strong></div>`,
            `<div><span></span><strong>${this.escapar(cliente.nome || "Cliente")}</strong></div>`,
            `</section>`
        ].join("");
    },

    renderizarRodape(dados = {}) {
        const metadados = dados.metadados || {};
        const geradoEm = this.formatarDataHora(metadados.geradoEm || new Date().toISOString());

        return [
            `<footer class="documento-comercial__rodape">`,
            `<p>Obrigado pela prefer&ecirc;ncia. Esta proposta foi preparada para confer&ecirc;ncia e aprova&ccedil;&atilde;o comercial.</p>`,
            `<p>Gerado em ${this.escapar(geradoEm)}</p>`,
            `</footer>`
        ].join("");
    },

    renderizarSecao(titulo, conteudo = [], classe = "") {
        const campos = conteudo.filter(Boolean).join("");

        if (!campos) {
            return "";
        }

        return [
            `<section class="documento-comercial__secao ${this.escapar(classe)}">`,
            `<h2>${this.escapar(titulo)}</h2>`,
            `<dl>${campos}</dl>`,
            `</section>`
        ].join("");
    },

    renderizarCampo(rotulo, valor, valorFormatado = false, classe = "") {
        if (!valorFormatado && !this.valorPreenchido(valor)) {
            return "";
        }

        const texto = valorFormatado ? String(valor ?? "") : this.escapar(valor);

        if (!texto) {
            return "";
        }

        return [
            `<div class="documento-comercial__campo ${this.escapar(classe)}">`,
            `<dt>${this.escapar(rotulo)}</dt>`,
            `<dd>${texto}</dd>`,
            `</div>`
        ].join("");
    },

    comporComplemento(valor, complemento) {
        if (!this.valorPreenchido(valor)) {
            return "";
        }

        return this.valorPreenchido(complemento)
            ? `${valor} - ${complemento}`
            : valor;
    },

    formatarMedidas(produto = {}) {
        const largura = this.formatarNumero(produto.larguraCm || 0);
        const altura = this.formatarNumero(produto.alturaCm || 0);
        return `${largura} x ${altura} cm`;
    },

    formatarArea(valor) {
        const numero = Number(valor || 0);

        if (!Number.isFinite(numero)) {
            return "0,00";
        }

        return numero.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        });
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
            .toLowerCase();
        const chave = valor.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        const rotulos = {
            area_m2: "\u00c1rea (m\u00b2)",
            m2: "\u00c1rea (m\u00b2)",
            linear_m: "Linear (m)",
            unidade: "Unidade",
            orcamento_itens: "Itens da proposta"
        };

        return rotulos[chave] || tipoCalculo || "";
    },

    valorPreenchido(valor) {
        return valor !== undefined && valor !== null && String(valor).trim() !== "";
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
