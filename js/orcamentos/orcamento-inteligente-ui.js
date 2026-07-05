const OrcamentoInteligenteUI = {
    elementos: {},
    etapas: [
        { chave: "cliente", rotulo: "Cliente" },
        { chave: "projeto", rotulo: "Projeto" },
        { chave: "servico", rotulo: "Servico" },
        { chave: "produtos", rotulo: "Produtos" },
        { chave: "calculo", rotulo: "Calculo" },
        { chave: "resumo", rotulo: "Resumo" }
    ],

    iniciar() {
        this.mapearElementos();
    },

    mapearElementos() {
        this.elementos = {
            modulo: document.querySelector(".orcamento-inteligente-modulo"),
            principal: document.querySelector(".orcamento-inteligente-principal"),
            btnNovo: document.getElementById("btnNovoOrcamentoInteligente"),
            status: document.getElementById("orcamentoInteligenteStatus"),
            etapas: document.getElementById("orcamentoInteligenteEtapas"),
            cliente: document.getElementById("orcamentoInteligenteCliente"),
            projeto: document.getElementById("orcamentoInteligenteProjeto"),
            servico: document.getElementById("orcamentoInteligenteServico"),
            produtos: document.getElementById("orcamentoInteligenteProdutos"),
            calculo: document.getElementById("orcamentoInteligenteCalculo"),
            resumo: document.getElementById("orcamentoInteligenteResumo")
        };
    },

    renderizarEtapaAtual(contexto = {}, dados = {}, etapaAtual = "cliente") {
        this.renderizarEtapas(contexto, etapaAtual);
        this.renderizarCliente(contexto, dados.clientes || []);
        this.renderizarProjeto(contexto, dados.projetos || []);
        this.renderizarServico(contexto, dados.servicos || []);
        this.renderizarProdutos(contexto, dados.produtos || []);
        this.renderizarCalculo(contexto, etapaAtual);
        this.renderizarResumo(contexto);
        this.exibirSecaoAtual(etapaAtual);
    },

    renderizarEtapas(contexto = {}, etapaAtual = "cliente") {
        const container = this.elementos.etapas;
        if (!container) return;

        container.innerHTML = this.etapas.map((etapa, indice) => {
            const estado = etapa.chave === etapaAtual
                ? "ativa"
                : this.etapaConcluida(etapa.chave, contexto) ? "concluida" : "pendente";

            return `
                <article class="orcamento-inteligente-etapa ${estado}">
                    <span>${indice + 1}</span>
                    <strong>${this.escapar(etapa.rotulo)}</strong>
                </article>
            `;
        }).join("");

        this.atualizarStatus(this.estadoOperacional(contexto));
    },

    renderizarCliente(contexto = {}, clientes = []) {
        const container = this.elementos.cliente;
        if (!container) return;

        const clienteSelecionado = contexto.cliente || null;
        const options = this.renderizarOptions(clientes, clienteSelecionado?.id);

        container.innerHTML = `
            <div class="orcamento-inteligente-fluxo">
                ${this.renderizarEstadoFluxo(clienteSelecionado ? "Cliente selecionado" : "Cliente nao selecionado", !!clienteSelecionado)}
                <form class="orcamento-inteligente-form" data-orcamento-form="cliente">
                    <label for="orcamentoClienteSelect">Cliente</label>
                    <select id="orcamentoClienteSelect" name="clienteId" required>
                        <option value="">Selecione um cliente</option>
                        ${options}
                    </select>
                    <button type="submit" class="botao orcamento-inteligente-btn-form">Selecionar cliente</button>
                </form>
                ${clienteSelecionado ? this.renderizarEntidadeSelecionada("Cliente atual", clienteSelecionado) : ""}
                ${this.renderizarNavegacao({ podeVoltar: false, podeAvancar: !!clienteSelecionado })}
            </div>
        `;
    },

    renderizarProjeto(contexto = {}, projetos = []) {
        const container = this.elementos.projeto;
        if (!container) return;

        if (!contexto.cliente) {
            container.innerHTML = `
                <div class="orcamento-inteligente-fluxo">
                    ${this.renderizarEstadoFluxo("Cliente nao selecionado", false)}
                    ${this.renderizarNavegacao({ podeVoltar: true, podeAvancar: false })}
                </div>
            `;
            return;
        }

        const projetoSelecionado = contexto.projeto || null;
        const options = this.renderizarOptions(projetos, projetoSelecionado?.id);

        container.innerHTML = `
            <div class="orcamento-inteligente-fluxo">
                ${this.renderizarEstadoFluxo(projetoSelecionado ? "Projeto selecionado" : "Projeto nao selecionado", !!projetoSelecionado)}
                <form class="orcamento-inteligente-form" data-orcamento-form="projeto">
                    <label for="orcamentoProjetoSelect">Projeto</label>
                    <select id="orcamentoProjetoSelect" name="projetoId" required>
                        <option value="">Selecione um projeto</option>
                        ${options}
                    </select>
                    <button type="submit" class="botao orcamento-inteligente-btn-form">Selecionar projeto</button>
                </form>
                ${projetoSelecionado ? this.renderizarEntidadeSelecionada("Projeto atual", projetoSelecionado) : ""}
                ${this.renderizarNavegacao({ podeVoltar: true, podeAvancar: !!projetoSelecionado })}
            </div>
        `;
    },

    renderizarServico(contexto = {}, servicos = []) {
        const container = this.elementos.servico;
        if (!container) return;

        if (!contexto.projeto) {
            container.innerHTML = `
                <div class="orcamento-inteligente-fluxo">
                    ${this.renderizarEstadoFluxo("Projeto nao selecionado", false)}
                    ${this.renderizarNavegacao({ podeVoltar: true, podeAvancar: false })}
                </div>
            `;
            return;
        }

        const servicoSelecionado = contexto.servico || null;
        const options = this.renderizarOptions(servicos, servicoSelecionado?.id);

        container.innerHTML = `
            <div class="orcamento-inteligente-fluxo">
                ${this.renderizarEstadoFluxo(servicoSelecionado ? "Servico selecionado" : "Servico nao selecionado", !!servicoSelecionado)}
                <form class="orcamento-inteligente-form" data-orcamento-form="servico">
                    <label for="orcamentoServicoSelect">Servico</label>
                    <select id="orcamentoServicoSelect" name="servicoId" required>
                        <option value="">Selecione um servico</option>
                        ${options}
                    </select>
                    <button type="submit" class="botao orcamento-inteligente-btn-form">Selecionar servico</button>
                </form>
                ${servicoSelecionado ? this.renderizarEntidadeSelecionada("Servico atual", servicoSelecionado) : ""}
                ${this.renderizarNavegacao({ podeVoltar: true, podeAvancar: !!servicoSelecionado })}
            </div>
        `;
    },

    renderizarProdutos(contexto = {}, produtosDisponiveis = []) {
        const container = this.elementos.produtos;
        if (!container) return;

        if (!contexto.servico) {
            container.innerHTML = `
                <div class="orcamento-inteligente-fluxo">
                    ${this.renderizarEstadoFluxo("Servico nao selecionado", false)}
                    ${this.renderizarNavegacao({ podeVoltar: true, podeAvancar: false })}
                </div>
            `;
            return;
        }

        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];

        container.innerHTML = `
            <div class="orcamento-inteligente-fluxo">
                ${this.renderizarEstadoFluxo(produtos.length ? "Produtos adicionados" : "Sem produtos", produtos.length > 0)}
                <form class="orcamento-inteligente-form" data-orcamento-form="produto">
                    <label for="orcamentoProdutoSelect">Produto</label>
                    <select id="orcamentoProdutoSelect" name="produtoId" required>
                        <option value="">Selecione um produto</option>
                        ${this.renderizarOptions(produtosDisponiveis)}
                    </select>
                    <button type="submit" class="botao orcamento-inteligente-btn-form">Adicionar produto</button>
                </form>
                ${this.renderizarListaProdutos(produtos)}
                ${this.renderizarNavegacao({ podeVoltar: true, podeAvancar: produtos.length > 0 })}
            </div>
        `;
    },

    renderizarCalculo(contexto = {}, etapaAtual = "calculo") {
        const container = this.elementos.calculo;
        if (!container) return;

        if (etapaAtual === "resumo") {
            container.innerHTML = this.renderizarConsolidacao(contexto);
            return;
        }

        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];
        if (!produtos.length) {
            container.innerHTML = `
                <div class="orcamento-inteligente-fluxo">
                    ${this.renderizarEstadoFluxo("Sem produtos", false)}
                    ${this.renderizarNavegacao({ podeVoltar: true, podeAvancar: false })}
                </div>
            `;
            return;
        }

        const calculo = contexto.calculo || {};
        const produtoReferencia = produtos[0] || {};
        const tipoCalculo = calculo.tipoCalculo
            || contexto.servico?.tipoCalculo
            || produtoReferencia.tipoCalculo
            || "unidade";

        container.innerHTML = `
            <div class="orcamento-inteligente-fluxo">
                ${this.renderizarEstadoFluxo(contexto.resultado?.sucesso ? "Resumo atualizado" : "Calculo pendente", !!contexto.resultado?.sucesso)}
                <form class="orcamento-inteligente-form orcamento-inteligente-form-calculo" data-orcamento-form="calculo">
                    <input type="hidden" name="tipoCalculo" value="${this.escapar(tipoCalculo)}">
                    <div class="orcamento-inteligente-campo">
                        <label>Tipo de calculo</label>
                        <input type="text" value="${this.escapar(this.rotuloTipoCalculo(tipoCalculo))}" readonly>
                    </div>
                    <div class="orcamento-inteligente-campo">
                        <label for="orcamentoCalculoQuantidade">Quantidade</label>
                        <input id="orcamentoCalculoQuantidade" type="number" name="quantidade" min="0" step="0.01" value="${this.valorCalculo(calculo.quantidade, 1)}" required>
                    </div>
                    ${this.renderizarCamposMedida(tipoCalculo, calculo)}
                    <div class="orcamento-inteligente-campo">
                        <label for="orcamentoCalculoValorUnitario">Valor unitario</label>
                        <input id="orcamentoCalculoValorUnitario" type="number" name="valorUnitario" min="0" step="0.01" value="${this.valorCalculo(calculo.valorUnitario, produtoReferencia.precoVenda || 0)}" required>
                    </div>
                    <div class="orcamento-inteligente-campo orcamento-inteligente-campo-cheio">
                        <label for="orcamentoCalculoObservacoes">Observacoes</label>
                        <textarea id="orcamentoCalculoObservacoes" name="observacoes" rows="3">${this.escapar(calculo.observacoes || "")}</textarea>
                    </div>
                    <button type="submit" class="botao orcamento-inteligente-btn-form">Calcular orcamento</button>
                </form>
                ${contexto.resultado ? this.renderizarResultado(contexto.resultado) : ""}
                ${this.renderizarNavegacao({ podeVoltar: true, podeAvancar: !!contexto.resultado?.sucesso, rotuloAvancar: "Atualizar resumo" })}
            </div>
        `;
    },

    renderizarResumo(contexto = {}) {
        const container = this.elementos.resumo;
        if (!container) return;

        const resumo = contexto.resumo || {};
        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];
        const resultado = contexto.resultado || null;
        const campos = [
            ["Cliente", resumo.cliente?.nome || this.nomeEntidade(contexto.cliente) || "Cliente nao selecionado."],
            ["Projeto", resumo.projeto?.nome || this.nomeEntidade(contexto.projeto) || "Projeto nao selecionado."],
            ["Servico", resumo.servico?.nome || this.nomeEntidade(contexto.servico) || "Servico nao selecionado."],
            ["Quantidade de produtos", String(resumo.quantidadeProdutos ?? produtos.length)],
            ["Valor total", this.formatarMoeda(resumo.valorTotal ?? resultado?.valorCalculado ?? 0)],
            ["Tipo de calculo", this.rotuloTipoCalculo(resumo.tipoCalculo || contexto.calculo?.tipoCalculo || contexto.servico?.tipoCalculo || "")],
            ["Status", this.rotuloStatus(resumo.status || contexto.status || "INICIADO")]
        ];

        container.innerHTML = `
            <div class="orcamento-inteligente-resumo-status ${resultado?.sucesso ? "ok" : "pendente"}">
                ${this.escapar(resultado?.sucesso ? "Resumo atualizado" : "Resumo pendente")}
            </div>
            <dl>
                ${campos.map(([rotulo, valor]) => `
                    <div>
                        <dt>${this.escapar(rotulo)}</dt>
                        <dd>${this.escapar(valor)}</dd>
                    </div>
                `).join("")}
            </dl>
            ${this.renderizarTotais(contexto)}
        `;
    },

    renderizarEstadoVazio(contexto = {}) {
        this.renderizarEtapaAtual(contexto, {}, "cliente");
    },

    renderizarConsolidacao(contexto = {}) {
        return `
            <div class="orcamento-inteligente-fluxo">
                ${this.renderizarEstadoFluxo(contexto.orcamentoPreparado ? "Orcamento finalizado" : "Consolidacao do orcamento", !!contexto.resultado?.sucesso)}
                ${this.renderizarTotais(contexto)}
                <form class="orcamento-inteligente-form-complementos" data-orcamento-form="complementos">
                    ${this.renderizarObservacoes(contexto)}
                    ${this.renderizarCondicoes(contexto)}
                    <button type="submit" class="botao orcamento-inteligente-btn-form">Atualizar complementos</button>
                </form>
                ${this.renderizarValidacao(contexto)}
                ${contexto.orcamentoPreparado ? this.renderizarPreparacaoPdf(contexto) : ""}
                <div class="orcamento-inteligente-navegacao">
                    <button type="button" class="btn-pequeno btn-cinza" data-orcamento-action="voltar">Voltar</button>
                    <button type="button" class="btn-pequeno btn-cinza" data-orcamento-action="validar-orcamento">Validar</button>
                    <button type="button" class="btn-pequeno" data-orcamento-action="finalizar-orcamento">Finalizar orcamento</button>
                </div>
            </div>
        `;
    },

    renderizarTotais(contexto = {}) {
        const totais = contexto.resumo?.totais || {};

        return `
            <section class="orcamento-inteligente-subpainel orcamento-inteligente-totais">
                <h3>Totais</h3>
                <dl>
                    <div>
                        <dt>Subtotal</dt>
                        <dd>${this.escapar(this.formatarMoeda(totais.subtotal || 0))}</dd>
                    </div>
                    <div>
                        <dt>Desconto</dt>
                        <dd>${this.escapar(this.formatarMoeda(totais.desconto || 0))} <small>placeholder</small></dd>
                    </div>
                    <div>
                        <dt>Acrescimo</dt>
                        <dd>${this.escapar(this.formatarMoeda(totais.acrescimo || 0))} <small>placeholder</small></dd>
                    </div>
                    <div class="orcamento-inteligente-total-geral">
                        <dt>Total geral</dt>
                        <dd>${this.escapar(this.formatarMoeda(totais.totalGeral || 0))}</dd>
                    </div>
                </dl>
            </section>
        `;
    },

    renderizarObservacoes(contexto = {}) {
        const observacoes = contexto.observacoes || {};

        return `
            <section class="orcamento-inteligente-subpainel">
                <h3>Observacoes</h3>
                <div class="orcamento-inteligente-campo orcamento-inteligente-campo-cheio">
                    <label for="orcamentoObservacaoLivre">Campo livre</label>
                    <textarea id="orcamentoObservacaoLivre" name="observacaoLivre" rows="3">${this.escapar(observacoes.livre || "")}</textarea>
                </div>
                <div class="orcamento-inteligente-campo orcamento-inteligente-campo-cheio">
                    <label for="orcamentoObservacoesComerciais">Observacoes comerciais</label>
                    <textarea id="orcamentoObservacoesComerciais" name="observacoesComerciais" rows="3">${this.escapar(observacoes.comerciais || "")}</textarea>
                </div>
                <div class="orcamento-inteligente-campo orcamento-inteligente-campo-cheio">
                    <label for="orcamentoObservacoesTecnicas">Observacoes tecnicas</label>
                    <textarea id="orcamentoObservacoesTecnicas" name="observacoesTecnicas" rows="3">${this.escapar(observacoes.tecnicas || "")}</textarea>
                </div>
            </section>
        `;
    },

    renderizarCondicoes(contexto = {}) {
        const condicoes = contexto.condicoesComerciais || {};

        return `
            <section class="orcamento-inteligente-subpainel">
                <h3>Condicoes comerciais</h3>
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoFormaPagamento">Forma de pagamento</label>
                    <input id="orcamentoFormaPagamento" type="text" name="formaPagamento" value="${this.escapar(condicoes.formaPagamento || "")}">
                </div>
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoPrazoEntrega">Prazo de entrega</label>
                    <input id="orcamentoPrazoEntrega" type="text" name="prazoEntrega" value="${this.escapar(condicoes.prazoEntrega || "")}">
                </div>
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoValidadeProposta">Validade da proposta</label>
                    <input id="orcamentoValidadeProposta" type="text" name="validadeProposta" value="${this.escapar(condicoes.validadeProposta || "")}">
                </div>
            </section>
        `;
    },

    renderizarValidacao(contexto = {}) {
        const validacao = contexto.validacaoFinal || null;

        if (!validacao) {
            return `
                <section class="orcamento-inteligente-validacao pendente">
                    <strong>Validacao final pendente.</strong>
                </section>
            `;
        }

        if (validacao.valido) {
            return `
                <section class="orcamento-inteligente-validacao ok">
                    <strong>Validacao final concluida.</strong>
                </section>
            `;
        }

        const erros = Array.isArray(validacao.erros) ? validacao.erros : [];
        return `
            <section class="orcamento-inteligente-validacao erro">
                <strong>Validacao final encontrou pendencias.</strong>
                <ul>
                    ${erros.map(erro => `<li>${this.escapar(erro)}</li>`).join("")}
                </ul>
            </section>
        `;
    },

    renderizarPreparacaoPdf(contexto = {}) {
        const preparado = contexto.orcamentoPreparado || {};

        return `
            <section class="orcamento-inteligente-validacao ok">
                <strong>Objeto padronizado preparado para PDF Comercial.</strong>
                <span>${this.escapar(preparado.preparadoPara || "PDF_COMERCIAL")} | ${this.escapar(preparado.versao || "3.9C")}</span>
            </section>
        `;
    },

    renderizarCamposMedida(tipoCalculo, calculo = {}) {
        const tipo = this.normalizarTipoCalculo(tipoCalculo);

        if (tipo === "area_m2" || tipo === "AREA_M2") {
            return `
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoCalculoLargura">Largura</label>
                    <input id="orcamentoCalculoLargura" type="number" name="largura" min="0" step="0.01" value="${this.valorCalculo(calculo.largura, 0)}" required>
                </div>
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoCalculoAltura">Altura</label>
                    <input id="orcamentoCalculoAltura" type="number" name="altura" min="0" step="0.01" value="${this.valorCalculo(calculo.altura, 0)}" required>
                </div>
            `;
        }

        if (tipo === "linear_m" || tipo === "LINEAR_M") {
            return `
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoCalculoComprimento">Comprimento</label>
                    <input id="orcamentoCalculoComprimento" type="number" name="comprimento" min="0" step="0.01" value="${this.valorCalculo(calculo.comprimento, 0)}" required>
                </div>
            `;
        }

        return "";
    },

    renderizarOptions(itens = [], selecionadoId = "") {
        if (!Array.isArray(itens) || !itens.length) {
            return "";
        }

        return itens.map(item => {
            const id = item.id || "";
            const selected = id && id === selecionadoId ? " selected" : "";
            return `<option value="${this.escapar(id)}"${selected}>${this.escapar(this.rotuloOption(item))}</option>`;
        }).join("");
    },

    renderizarEntidadeSelecionada(rotulo, entidade = {}) {
        return `
            <div class="orcamento-inteligente-selecionado">
                <span>${this.escapar(rotulo)}</span>
                <strong>${this.escapar(this.nomeEntidade(entidade) || "Selecionado")}</strong>
                ${this.descricaoEntidade(entidade) ? `<small>${this.escapar(this.descricaoEntidade(entidade))}</small>` : ""}
            </div>
        `;
    },

    renderizarListaProdutos(produtos = []) {
        if (!Array.isArray(produtos) || !produtos.length) {
            return `<div class="orcamento-inteligente-lista-vazia">Sem produtos.</div>`;
        }

        return `
            <ul class="orcamento-inteligente-lista-produtos">
                ${produtos.map((produto, indice) => `
                    <li>
                        <div>
                            <strong>${this.escapar(this.nomeEntidade(produto) || "Produto")}</strong>
                            <span>${this.escapar(this.descricaoProduto(produto))}</span>
                        </div>
                        <button type="button" class="btn-pequeno btn-cinza" data-orcamento-action="remover-produto" data-indice="${indice}">
                            Remover
                        </button>
                    </li>
                `).join("")}
            </ul>
        `;
    },

    renderizarResultado(resultado = {}) {
        const sucesso = resultado && resultado.sucesso !== false;
        const texto = sucesso
            ? this.resumoResultado(resultado)
            : this.errosResultado(resultado).join(" ");

        return `
            <div class="orcamento-inteligente-resultado ${sucesso ? "ok" : "erro"}">
                <span>${this.escapar(sucesso ? "Resultado" : "Calculo nao concluido")}</span>
                <strong>${this.escapar(texto)}</strong>
            </div>
        `;
    },

    renderizarEstadoFluxo(texto, concluido) {
        return `
            <div class="orcamento-inteligente-estado ${concluido ? "ok" : "pendente"}">
                <strong>${this.escapar(texto)}</strong>
            </div>
        `;
    },

    renderizarNavegacao({ podeVoltar = true, podeAvancar = true, rotuloAvancar = "Avancar" } = {}) {
        return `
            <div class="orcamento-inteligente-navegacao">
                <button type="button" class="btn-pequeno btn-cinza" data-orcamento-action="voltar" ${podeVoltar ? "" : "disabled"}>
                    Voltar
                </button>
                <button type="button" class="btn-pequeno" data-orcamento-action="avancar" ${podeAvancar ? "" : "disabled"}>
                    ${this.escapar(rotuloAvancar)}
                </button>
            </div>
        `;
    },

    exibirSecaoAtual(etapaAtual = "cliente") {
        const chaveVisivel = etapaAtual === "resumo" ? "calculo" : etapaAtual;
        ["cliente", "projeto", "servico", "produtos", "calculo"].forEach(chave => {
            const elemento = this.elementos[chave];
            const painel = elemento?.closest(".orcamento-inteligente-painel");
            if (!painel) return;
            painel.classList.toggle("orcamento-inteligente-secao-oculta", chave !== chaveVisivel);
        });
    },

    mostrarAviso(mensagem, tipo = "info") {
        const status = this.elementos.status;
        if (!status) return;

        status.textContent = mensagem || "";
        status.className = `orcamento-inteligente-status ${tipo}`;
    },

    atualizarStatus(mensagem) {
        const status = this.elementos.status;
        if (!status) return;

        status.textContent = mensagem || "";
        status.className = "orcamento-inteligente-status";
    },

    etapaConcluida(chave, contexto = {}) {
        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];
        const mapa = {
            cliente: !!contexto.cliente,
            projeto: !!contexto.projeto,
            servico: !!contexto.servico,
            produtos: produtos.length > 0,
            calculo: !!contexto.resultado?.sucesso,
            resumo: !!contexto.resultado?.sucesso
        };

        return !!mapa[chave];
    },

    estadoOperacional(contexto = {}) {
        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];

        if (!contexto.cliente) return "Cliente nao selecionado";
        if (!contexto.projeto) return "Projeto nao selecionado";
        if (!contexto.servico) return "Servico nao selecionado";
        if (!produtos.length) return "Sem produtos";
        if (!contexto.resultado?.sucesso) return "Calculo pendente";
        return "Resumo atualizado";
    },

    rotuloOption(item = {}) {
        const nome = this.nomeEntidade(item) || "Item";
        const complemento = item.numero || item.codigo || item.categoria || item.unidadeVenda || "";
        return complemento && complemento !== nome ? `${nome} - ${complemento}` : nome;
    },

    nomeEntidade(entidade = {}) {
        if (!entidade) return "";
        return entidade.nome
            || entidade.nomeFantasia
            || entidade.titulo
            || entidade.numero
            || entidade.codigo
            || entidade.id
            || "";
    },

    descricaoEntidade(entidade = {}) {
        if (!entidade) return "";
        return entidade.descricao
            || entidade.cliente?.nome
            || entidade.obra?.endereco
            || entidade.telefonePrincipal
            || entidade.email
            || "";
    },

    descricaoProduto(produto = {}) {
        const partes = [
            produto.categoria,
            produto.subcategoria,
            produto.unidadeVenda,
            produto.precoVenda ? this.formatarMoeda(produto.precoVenda) : ""
        ].filter(Boolean);

        return partes.join(" | ") || "Produto do orcamento";
    },

    resumoResultado(resultado = {}) {
        if (!resultado || resultado.sucesso === false) {
            return "Calculo pendente.";
        }

        const unidade = resultado.unidade ? ` (${resultado.unidade})` : "";
        return `${this.formatarMoeda(resultado.valorCalculado || 0)}${unidade}`;
    },

    errosResultado(resultado = {}) {
        const erros = resultado?.detalhes?.erros || [];
        return Array.isArray(erros) && erros.length ? erros : ["Erro ao calcular orcamento."];
    },

    valorCalculo(valor, fallback = 0) {
        const numero = valor === undefined || valor === null || valor === "" ? fallback : valor;
        return this.escapar(Number(numero || 0));
    },

    normalizarTipoCalculo(tipoCalculo) {
        if (typeof CalculoModel !== "undefined" && typeof CalculoModel.normalizarTipoCalculo === "function") {
            return CalculoModel.normalizarTipoCalculo(tipoCalculo);
        }

        return String(tipoCalculo || "").toLowerCase();
    },

    rotuloTipoCalculo(tipoCalculo) {
        const tipo = this.normalizarTipoCalculo(tipoCalculo);
        const rotulos = {
            AREA_M2: "Area (m2)",
            LINEAR_M: "Linear (m)",
            UNIDADE: "Unidade",
            PERSONALIZADO: "Personalizado",
            area_m2: "Area (m2)",
            linear_m: "Linear (m)",
            unidade: "Unidade",
            personalizado: "Personalizado"
        };

        return rotulos[tipo] || tipo || "Unidade";
    },

    rotuloStatus(status) {
        const rotulos = {
            INICIADO: "Iniciado",
            CLIENTE_SELECIONADO: "Cliente selecionado",
            PROJETO_SELECIONADO: "Projeto selecionado",
            SERVICO_SELECIONADO: "Servico selecionado",
            PRODUTOS_ADICIONADOS: "Produtos adicionados",
            CALCULADO: "Calculado",
            VALIDADO: "Validado",
            FINALIZADO: "Finalizado"
        };

        return rotulos[status] || status || "Iniciado";
    },

    formatarData(valor) {
        if (!valor) return "Nao informado";

        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) {
            return "Nao informado";
        }

        return data.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    },

    formatarMoeda(valor) {
        if (typeof Util !== "undefined" && typeof Util.moeda === "function") {
            return Util.moeda(valor);
        }

        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    },

    escapar(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};
