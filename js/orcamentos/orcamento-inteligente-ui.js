const OrcamentoInteligenteUI = {
    elementos: {},
    etapas: [
        { chave: "cliente", rotulo: "Cliente" },
        { chave: "projeto", rotulo: "Projeto" },
        { chave: "servico", rotulo: "Servi\u00e7o" },
        { chave: "produtos", rotulo: "Itens" },
        { chave: "calculo", rotulo: "C\u00e1lculo" },
        { chave: "resumo", rotulo: "Resumo" }
    ],

    iniciar() {
        this.mapearElementos();
    },

    mapearElementos() {
        this.elementos = {
            modulo: document.querySelector(".orcamento-inteligente-modulo"),
            layout: document.querySelector(".orcamento-inteligente-layout"),
            principal: document.querySelector(".orcamento-inteligente-principal"),
            resumoPainel: document.querySelector(".orcamento-inteligente-resumo-painel"),
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
                <div class="orcamento-inteligente-cliente-grid">
                    <form class="orcamento-inteligente-form" data-orcamento-form="cliente">
                        <label for="orcamentoClienteSelect">Cliente existente</label>
                        <select id="orcamentoClienteSelect" name="clienteId" required>
                            <option value="">Selecione um cliente</option>
                            ${options}
                        </select>
                        <button type="submit" class="botao orcamento-inteligente-btn-form">Selecionar</button>
                    </form>
                    <form class="orcamento-inteligente-form orcamento-inteligente-form-novo-cliente" data-orcamento-form="cliente-novo">
                        <h3>Novo cliente</h3>
                        <div class="orcamento-inteligente-campo">
                            <label for="orcamentoNovoClienteNome">Nome</label>
                            <input id="orcamentoNovoClienteNome" type="text" name="nome" autocomplete="name" required>
                        </div>
                        <div class="orcamento-inteligente-campo">
                            <label for="orcamentoNovoClienteTelefone">Telefone/WhatsApp</label>
                            <input id="orcamentoNovoClienteTelefone" type="tel" name="telefone" autocomplete="tel" required>
                        </div>
                        <div class="orcamento-inteligente-campo">
                            <label for="orcamentoNovoClienteEmail">E-mail</label>
                            <input id="orcamentoNovoClienteEmail" type="email" name="email" autocomplete="email">
                        </div>
                        <div class="orcamento-inteligente-campo">
                            <label for="orcamentoNovoClienteCidade">Cidade</label>
                            <input id="orcamentoNovoClienteCidade" type="text" name="cidade" autocomplete="address-level2">
                        </div>
                        <div class="orcamento-inteligente-campo orcamento-inteligente-campo-cheio">
                            <label for="orcamentoNovoClienteEndereco">Endereco</label>
                            <input id="orcamentoNovoClienteEndereco" type="text" name="endereco" autocomplete="street-address">
                        </div>
                        <div class="orcamento-inteligente-campo orcamento-inteligente-campo-cheio">
                            <label for="orcamentoNovoClienteObservacoes">Observacoes</label>
                            <textarea id="orcamentoNovoClienteObservacoes" name="observacoes" rows="3"></textarea>
                        </div>
                        <button type="submit" class="botao orcamento-inteligente-btn-form">Cadastrar cliente</button>
                    </form>
                </div>
                ${clienteSelecionado ? this.renderizarEntidadeSelecionada("Cliente atual", clienteSelecionado) : ""}
                ${this.renderizarNavegacao({ exibirVoltar: false, exibirAvancar: false })}
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
                    ${this.renderizarNavegacao({ podeVoltar: true, exibirAvancar: false })}
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
                ${this.renderizarNavegacao({ podeVoltar: true, exibirAvancar: false })}
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
                    ${this.renderizarNavegacao({ podeVoltar: true, exibirAvancar: false })}
                </div>
            `;
            return;
        }

        const servicosBase = this.obterServicosBase(servicos);
        const servicosSelecionados = this.obterServicosSelecionados(contexto);
        const selecionados = new Set(servicosSelecionados.map(servico => servico.id));

        container.innerHTML = `
            <div class="orcamento-inteligente-fluxo">
                ${this.renderizarEstadoFluxo(servicosSelecionados.length ? "Tipos de servico selecionados" : "Nenhum tipo selecionado", servicosSelecionados.length > 0)}
                <form class="orcamento-inteligente-servicos-grid" data-orcamento-form="servico">
                    ${servicosBase.map(servico => `
                        <label class="orcamento-inteligente-servico-opcao ${selecionados.has(servico.id) ? "selecionado" : ""}">
                            <input type="checkbox" name="servicoIds" value="${this.escapar(servico.id)}" ${selecionados.has(servico.id) ? "checked" : ""}>
                            <span>${this.escapar(servico.nome)}</span>
                        </label>
                    `).join("")}
                    <button type="submit" class="botao orcamento-inteligente-btn-form">Atualizar tipos</button>
                </form>
                ${servicosSelecionados.length ? this.renderizarListaServicosSelecionados(servicosSelecionados) : ""}
                ${this.renderizarNavegacao({ podeVoltar: true, exibirAvancar: false })}
            </div>
        `;
    },

    renderizarProdutos(contexto = {}, produtosDisponiveis = []) {
        const container = this.elementos.produtos;
        if (!container) return;

        const servicosSelecionados = this.obterServicosSelecionados(contexto);

        if (!servicosSelecionados.length) {
            container.innerHTML = `
                <div class="orcamento-inteligente-fluxo">
                    ${this.renderizarEstadoFluxo("Tipos de servico nao selecionados", false)}
                    ${this.renderizarNavegacao({ podeVoltar: true, exibirAvancar: false })}
                </div>
            `;
            return;
        }

        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];

        container.innerHTML = `
            <div class="orcamento-inteligente-fluxo">
                ${this.renderizarEstadoFluxo(produtos.length ? "Itens adicionados" : "Sem itens", produtos.length > 0)}
                <div class="orcamento-inteligente-grupos-itens">
                    ${servicosSelecionados.map(servico => this.renderizarGrupoItem(servico)).join("")}
                </div>
                ${this.renderizarListaProdutos(produtos)}
                ${this.renderizarNavegacao({ podeVoltar: true, podeAvancar: produtos.length > 0, exibirAvancar: produtos.length > 0, rotuloAvancar: "Ir para calculo" })}
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
                    ${this.renderizarEstadoFluxo("Sem itens", false)}
                    ${this.renderizarNavegacao({ podeVoltar: true, exibirAvancar: false })}
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="orcamento-inteligente-fluxo">
                ${this.renderizarEstadoFluxo(contexto.resultado?.sucesso ? "Calculo em tempo real atualizado" : "Calculo pendente", !!contexto.resultado?.sucesso)}
                ${this.renderizarTabelaItens(produtos)}
                ${contexto.resultado ? this.renderizarResultado(contexto.resultado) : ""}
                ${this.renderizarTotais(contexto)}
                <form class="orcamento-inteligente-form-complementos" data-orcamento-form="complementos">
                    ${this.renderizarAjustesFinanceiros(contexto)}
                </form>
                ${this.renderizarNavegacao({ podeVoltar: true, podeAvancar: !!contexto.resultado?.sucesso, exibirAvancar: !!contexto.resultado?.sucesso, rotuloAvancar: "Ir para resumo" })}
            </div>
        `;
    },

    renderizarResumo(contexto = {}) {
        const container = this.elementos.resumo;
        if (!container) return;

        const resumo = contexto.resumo || {};
        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];
        const resultado = contexto.resultado || null;
        const servicosSelecionados = this.obterServicosSelecionados(contexto);
        const servicosTexto = resumo.tiposServico?.length
            ? resumo.tiposServico.join(", ")
            : servicosSelecionados.map(servico => servico.nome).filter(Boolean).join(", ");
        const campos = [
            ["Cliente", resumo.cliente?.nome || this.nomeEntidade(contexto.cliente) || "Cliente nao selecionado."],
            ["Projeto", resumo.projeto?.nome || this.nomeEntidade(contexto.projeto) || "Projeto nao selecionado."],
            ["Servicos", servicosTexto || resumo.servico?.nome || this.nomeEntidade(contexto.servico) || "Servico nao selecionado."],
            ["Itens", String(resumo.quantidadeProdutos ?? produtos.length)],
            ["\u00c1rea total", `${this.formatarArea(resumo.areaTotalM2 || resumo.totais?.areaTotalM2 || 0)} m\u00b2`],
            ["Subtotal", this.formatarMoeda(resumo.totais?.subtotal || 0)],
            ["Total geral", this.formatarMoeda(resumo.valorTotal ?? resultado?.valorCalculado ?? 0)],
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
                </form>
                ${this.renderizarValidacao(contexto)}
                ${contexto.orcamentoPreparado ? this.renderizarPreparacaoPdf(contexto) : ""}
                <div class="orcamento-inteligente-navegacao">
                    <button type="button" class="btn-pequeno btn-cinza" data-orcamento-action="voltar">Voltar</button>
                    <button type="button" class="btn-pequeno" data-orcamento-action="finalizar-orcamento">Finalizar orcamento</button>
                </div>
            </div>
        `;
    },

    renderizarTotais(contexto = {}) {
        const totais = contexto.resumo?.totais || {};
        const ajustes = contexto.ajustesFinanceiros || contexto.resumo?.ajustesFinanceiros || {};

        return `
            <section class="orcamento-inteligente-subpainel orcamento-inteligente-totais" data-orcamento-totais>
                <h3>Totais</h3>
                <dl>
                    <div>
                        <dt>Subtotal</dt>
                        <dd data-total-campo="subtotal">${this.escapar(this.formatarMoeda(totais.subtotal || 0))}</dd>
                    </div>
                    <div>
                        <dt>Desconto</dt>
                        <dd data-total-campo="desconto">${this.escapar(this.formatarMoeda(totais.desconto || 0))}${this.rotuloAjuste(ajustes.descontoTipo, ajustes.descontoValor)}</dd>
                    </div>
                    <div>
                        <dt>Acrescimo</dt>
                        <dd data-total-campo="acrescimo">${this.escapar(this.formatarMoeda(totais.acrescimo || 0))}${this.rotuloAjuste(ajustes.acrescimoTipo, ajustes.acrescimoValor)}</dd>
                    </div>
                    <div>
                        <dt>\u00c1rea total</dt>
                        <dd data-total-campo="area">${this.escapar(this.formatarArea(totais.areaTotalM2 || 0))} m\u00b2</dd>
                    </div>
                    <div class="orcamento-inteligente-total-geral">
                        <dt>Total geral</dt>
                        <dd data-total-campo="totalGeral">${this.escapar(this.formatarMoeda(totais.totalGeral || 0))}</dd>
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

    renderizarAjustesFinanceiros(contexto = {}) {
        const ajustes = contexto.ajustesFinanceiros || {};

        return `
            <section class="orcamento-inteligente-subpainel">
                <h3>Desconto e acrescimo</h3>
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoDescontoTipo">Desconto</label>
                    <select id="orcamentoDescontoTipo" name="descontoTipo">
                        ${this.renderizarOptionsSelect([
                            ["sem", "Sem desconto"],
                            ["valor", "Valor R$"],
                            ["percentual", "Porcentagem %"]
                        ], ajustes.descontoTipo || "sem")}
                    </select>
                </div>
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoDescontoValor">Valor do desconto</label>
                    <input id="orcamentoDescontoValor" type="number" name="descontoValor" min="0" step="0.01" value="${this.valorCalculo(ajustes.descontoValor, 0)}">
                </div>
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoAcrescimoTipo">Acr\u00e9scimo</label>
                    <select id="orcamentoAcrescimoTipo" name="acrescimoTipo">
                        ${this.renderizarOptionsSelect([
                            ["sem", "Sem acr\u00e9scimo"],
                            ["valor", "Valor R$"],
                            ["percentual", "Porcentagem %"]
                        ], ajustes.acrescimoTipo || "sem")}
                    </select>
                </div>
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoAcrescimoValor">Valor do acr\u00e9scimo</label>
                    <input id="orcamentoAcrescimoValor" type="number" name="acrescimoValor" min="0" step="0.01" value="${this.valorCalculo(ajustes.acrescimoValor, 0)}">
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
                    <select id="orcamentoFormaPagamento" name="formaPagamento">
                        ${this.renderizarOptionsSelect(["\u00c0 vista", "Pix", "Cart\u00e3o", "Entrada + parcelas", "Boleto", "A combinar"], condicoes.formaPagamento)}
                    </select>
                </div>
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoFormaPagamentoComplemento">Complemento pagamento</label>
                    <input id="orcamentoFormaPagamentoComplemento" type="text" name="formaPagamentoComplemento" value="${this.escapar(condicoes.formaPagamentoComplemento || "")}">
                </div>
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoPrazoEntrega">Prazo de entrega</label>
                    <select id="orcamentoPrazoEntrega" name="prazoEntrega">
                        ${this.renderizarOptionsSelect(["3 dias \u00fateis", "5 dias \u00fateis", "7 dias \u00fateis", "10 dias \u00fateis", "15 dias \u00fateis", "A combinar"], condicoes.prazoEntrega)}
                    </select>
                </div>
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoPrazoEntregaComplemento">Complemento prazo</label>
                    <input id="orcamentoPrazoEntregaComplemento" type="text" name="prazoEntregaComplemento" value="${this.escapar(condicoes.prazoEntregaComplemento || "")}">
                </div>
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoValidadeProposta">Validade da proposta</label>
                    <select id="orcamentoValidadeProposta" name="validadeProposta">
                        ${this.renderizarOptionsSelect(["3 dias", "5 dias", "7 dias", "10 dias", "15 dias", "30 dias"], condicoes.validadeProposta || "7 dias")}
                    </select>
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
                <span>${this.escapar(preparado.preparadoPara || "PDF_COMERCIAL")} | ${this.escapar(preparado.versao || "5.2.1")}</span>
                <div class="orcamento-inteligente-documento-acoes">
                    <button type="button" class="botao" data-orcamento-action="gerar-documento">Gerar Documento Comercial</button>
                    <a class="botao botao-claro" href="compartilhar-documento.html">Compartilhar</a>
                </div>
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

    obterServicosBase(servicos = []) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterServicosBase === "function") {
            return OrcamentoItemConfig.obterServicosBase();
        }

        return Array.isArray(servicos) ? servicos : [];
    },

    obterServicosSelecionados(contexto = {}) {
        if (Array.isArray(contexto.servicosSelecionados) && contexto.servicosSelecionados.length) {
            return contexto.servicosSelecionados;
        }

        return contexto.servico ? [contexto.servico] : [];
    },

    obterTiposItem(grupoServico) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterTiposItem === "function") {
            return OrcamentoItemConfig.obterTiposItem(grupoServico);
        }

        return [{ id: "item", nome: "Item", subtipos: ["Padrao"], dependencias: [] }];
    },

    obterSubtiposItem(grupoServico, tipoItem) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterSubtiposItem === "function") {
            return OrcamentoItemConfig.obterSubtiposItem(grupoServico, tipoItem);
        }

        return ["Padrao", "Outros"];
    },

    obterDependenciasItem(grupoServico, tipoItem) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterDependencias === "function") {
            return OrcamentoItemConfig.obterDependencias(grupoServico, tipoItem);
        }

        return [];
    },

    obterTamanhosPadrao(grupoServico) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterTamanhosPadrao === "function") {
            return OrcamentoItemConfig.obterTamanhosPadrao(grupoServico);
        }

        return [];
    },

    obterValorUnitarioPadrao(grupoServico) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.obterValorUnitarioPadrao === "function") {
            return OrcamentoItemConfig.obterValorUnitarioPadrao(grupoServico);
        }

        return 0;
    },

    normalizarTipoDimensao(tipoDimensao, grupoServico) {
        if (typeof OrcamentoItemConfig !== "undefined" && typeof OrcamentoItemConfig.normalizarTipoDimensao === "function") {
            return OrcamentoItemConfig.normalizarTipoDimensao(tipoDimensao, grupoServico);
        }

        const valor = this.normalizarValorOpcao(tipoDimensao);
        return valor === "padrao" ? "padrao" : "engenharia";
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

    renderizarOptionsSelect(opcoes = [], selecionado = "") {
        return (opcoes || []).map(opcao => {
            const valor = Array.isArray(opcao) ? opcao[0] : opcao;
            const rotulo = Array.isArray(opcao) ? opcao[1] : opcao;
            const selected = this.normalizarValorOpcao(valor) === this.normalizarValorOpcao(selecionado) ? " selected" : "";
            return `<option value="${this.escapar(valor)}"${selected}>${this.escapar(rotulo)}</option>`;
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

    renderizarListaServicosSelecionados(servicos = []) {
        return `
            <div class="orcamento-inteligente-selecionado">
                <span>Tipos selecionados</span>
                <strong>${this.escapar(servicos.map(servico => servico.nome).filter(Boolean).join(", "))}</strong>
            </div>
        `;
    },

    renderizarGrupoItem(servico = {}) {
        const grupoServico = servico.id || "";
        const tipos = this.obterTiposItem(grupoServico);
        const tipoPadrao = tipos[0] || {};
        const subtipos = this.obterSubtiposItem(grupoServico, tipoPadrao.id);
        const tamanhos = this.obterTamanhosPadrao(grupoServico);
        const permitePadrao = tamanhos.length > 0;
        const tipoDimensaoPadrao = permitePadrao ? "padrao" : "engenharia";
        const tamanhoPadrao = tamanhos[0] || null;
        const largura = tamanhoPadrao?.larguraCm || "";
        const altura = tamanhoPadrao?.alturaCm || "";

        return `
            <section class="orcamento-inteligente-grupo-item">
                <div class="orcamento-inteligente-grupo-topo">
                    <h3>${this.escapar((servico.plural || servico.nome || "Itens").toUpperCase())}</h3>
                    <span>Adicionar ${this.escapar(servico.itemSingular || servico.nome || "item")}</span>
                </div>
                <form class="orcamento-inteligente-form orcamento-inteligente-form-item" data-orcamento-form="produto" data-orcamento-novo-item data-grupo-servico="${this.escapar(grupoServico)}">
                    <input type="hidden" name="grupoServico" value="${this.escapar(grupoServico)}">
                    <input type="hidden" name="unidade" value="m2">
                    <div class="orcamento-inteligente-campo">
                        <label>Tipo do item</label>
                        <select name="tipoItem">
                            ${this.renderizarOptionsSelect(tipos.map(tipo => [tipo.id, tipo.nome]), tipoPadrao.id)}
                        </select>
                    </div>
                    <div class="orcamento-inteligente-campo">
                        <label>Refinamento</label>
                        <select name="subtipoItem">
                            ${this.renderizarOptionsSelect(subtipos, subtipos[0])}
                        </select>
                    </div>
                    ${this.renderizarCamposDimensao({
                        grupoServico,
                        tipoDimensao: tipoDimensaoPadrao,
                        tamanhos,
                        tamanhoPadraoSelecionado: tamanhoPadrao?.id || "",
                        larguraCm: largura,
                        alturaCm: altura,
                        percentualEngenharia: 0
                    })}
                    <div class="orcamento-inteligente-campo">
                        <label>Quantidade</label>
                        <input type="number" name="quantidade" min="0.01" step="0.01" inputmode="decimal" value="1" required>
                    </div>
                    <div class="orcamento-inteligente-campo">
                        <label>Valor unitario</label>
                        <input type="number" name="valorUnitario" min="0" step="0.01" inputmode="decimal" value="${this.valorCalculo(this.obterValorUnitarioPadrao(grupoServico), 0)}" required>
                    </div>
                    <div class="orcamento-inteligente-campo orcamento-inteligente-campo-cheio">
                        <label>Descricao</label>
                        <input type="text" name="descricao" data-autogerada="true" value="${this.escapar([tipoPadrao.nome, subtipos[0]].filter(Boolean).join(" - "))}" required>
                    </div>
                    ${this.renderizarDependencias(grupoServico, tipoPadrao.id)}
                    <div class="orcamento-inteligente-campo orcamento-inteligente-campo-cheio">
                        <label>Observacao do item</label>
                        <textarea name="observacoes" rows="2"></textarea>
                    </div>
                    <button type="submit" class="botao orcamento-inteligente-btn-form">Adicionar ${this.escapar(servico.itemSingular || "item")}</button>
                </form>
            </section>
        `;
    },

    renderizarCamposDimensao(item = {}) {
        const grupoServico = item.grupoServico || "";
        const tamanhos = item.tamanhos || this.obterTamanhosPadrao(grupoServico);
        const permitePadrao = tamanhos.length > 0;
        const tipoDimensao = this.normalizarTipoDimensao(item.tipoDimensao || (permitePadrao ? "padrao" : "engenharia"), grupoServico);

        return `
            ${permitePadrao ? `
                <div class="orcamento-inteligente-campo">
                    <label>Tipo de dimensao</label>
                    <select name="tipoDimensao">
                        ${this.renderizarOptionsSelect([
                            ["padrao", "Tamanho padrao"],
                            ["engenharia", "Engenharia / personalizado"]
                        ], tipoDimensao)}
                    </select>
                </div>
                <div class="orcamento-inteligente-campo ${tipoDimensao === "padrao" ? "" : "orcamento-inteligente-campo-oculto"}" data-tamanho-padrao-campo>
                    <label>Tamanho padrao</label>
                    <select name="tamanhoPadraoSelecionado">
                        ${this.renderizarOptionsSelect(tamanhos.map(tamanho => [tamanho.id, tamanho.nome]), item.tamanhoPadraoSelecionado)}
                    </select>
                </div>
            ` : `<input type="hidden" name="tipoDimensao" value="engenharia">`}
            <div class="orcamento-inteligente-campo">
                <label>Largura (cm)</label>
                <input type="number" name="larguraCm" min="0" step="0.01" inputmode="decimal" value="${this.valorCalculo(item.larguraCm, 0)}" ${tipoDimensao === "padrao" ? "readonly" : ""} required>
            </div>
            <div class="orcamento-inteligente-campo">
                <label>Altura (cm)</label>
                <input type="number" name="alturaCm" min="0" step="0.01" inputmode="decimal" value="${this.valorCalculo(item.alturaCm, 0)}" ${tipoDimensao === "padrao" ? "readonly" : ""} required>
            </div>
            <div class="orcamento-inteligente-campo ${tipoDimensao === "engenharia" ? "" : "orcamento-inteligente-campo-oculto"}" data-engenharia-campo>
                <label>Adicional engenharia (%)</label>
                <input type="number" name="percentualEngenharia" min="0" step="0.01" inputmode="decimal" value="${this.valorCalculo(item.percentualEngenharia, 0)}">
            </div>
        `;
    },

    renderizarDependencias(grupoServico, tipoItem) {
        const dependencias = this.obterDependenciasItem(grupoServico, tipoItem);

        return `
            <div class="orcamento-inteligente-dependencias orcamento-inteligente-campo-cheio">
                <span>Dependencias</span>
                <strong data-item-dependencias>${this.escapar(dependencias.length ? dependencias.join(", ") : "Dependencias a definir")}</strong>
            </div>
        `;
    },

    renderizarListaProdutos(produtos = []) {
        if (!Array.isArray(produtos) || !produtos.length) {
            return `<div class="orcamento-inteligente-lista-vazia">Sem itens.</div>`;
        }

        return `
            <form class="orcamento-inteligente-itens" data-orcamento-itens data-orcamento-form="calculo">
                ${produtos.map((produto, indice) => `
                    <article class="orcamento-inteligente-item-card"
                        data-orcamento-item
                        data-item-id="${this.escapar(produto.itemId || produto.orcamentoItemId || "")}"
                        data-produto-id="${this.escapar(produto.produtoId || produto.id || "")}"
                        data-nome="${this.escapar(this.nomeEntidade(produto) || "")}"
                        data-categoria="${this.escapar(produto.categoria || produto.grupoServico || "")}"
                        data-subcategoria="${this.escapar(produto.subcategoria || produto.tipoItem || "")}"
                        data-grupo-servico="${this.escapar(produto.grupoServico || produto.categoria || "")}"
                        data-grupo-servico-nome="${this.escapar(produto.grupoServicoNome || "")}"
                        data-tipo-item="${this.escapar(produto.tipoItem || produto.subcategoria || "")}"
                        data-tipo-item-nome="${this.escapar(produto.tipoItemNome || "")}"
                        data-tipo-dimensao="${this.escapar(produto.tipoDimensao || "engenharia")}"
                        data-tipo-calculo="${this.escapar(produto.tipoCalculo || "area_m2")}">
                        <div class="orcamento-inteligente-item-topo">
                            <div>
                                <span>Item ${indice + 1} | ${this.escapar(produto.grupoServicoNome || produto.categoria || "Servico")}</span>
                                <strong>${this.escapar(produto.tipoItemNome || this.nomeEntidade(produto) || "Item")}</strong>
                            </div>
                            <button type="button" class="btn-pequeno btn-cinza" data-orcamento-action="remover-produto" data-indice="${indice}">
                                Remover
                            </button>
                        </div>
                        <div class="orcamento-inteligente-item-grid">
                            <input type="hidden" name="grupoServico" value="${this.escapar(produto.grupoServico || produto.categoria || "")}">
                            <label>
                                <span>Tipo</span>
                                <select name="tipoItem">
                                    ${this.renderizarOptionsSelect(this.obterTiposItem(produto.grupoServico || produto.categoria).map(tipo => [tipo.id, tipo.nome]), produto.tipoItem || produto.subcategoria)}
                                </select>
                            </label>
                            <label>
                                <span>Refinamento</span>
                                <select name="subtipoItem">
                                    ${this.renderizarOptionsSelect(this.obterSubtiposItem(produto.grupoServico || produto.categoria, produto.tipoItem || produto.subcategoria), produto.subtipoItem)}
                                </select>
                            </label>
                            ${this.renderizarCamposDimensao(produto)}
                            <label>
                                <span>Quantidade</span>
                                <input type="number" name="quantidade" min="0.01" step="0.01" inputmode="decimal" value="${this.valorCalculo(produto.quantidade, 1)}">
                            </label>
                            <input type="hidden" name="unidade" value="${this.escapar(produto.unidade || "m2")}">
                            <label>
                                <span>Valor unitario</span>
                                <input type="number" name="valorUnitario" min="0" step="0.01" inputmode="decimal" value="${this.valorCalculo(produto.valorUnitario, 0)}">
                            </label>
                            <label class="orcamento-inteligente-item-observacao">
                                <span>Descricao</span>
                                <input type="text" name="descricao" value="${this.escapar(produto.descricao || this.nomeEntidade(produto) || "")}">
                            </label>
                            <label class="orcamento-inteligente-item-observacao">
                                <span>Observacao</span>
                                <input type="text" name="observacoes" value="${this.escapar(produto.observacoes || "")}">
                            </label>
                        </div>
                        ${this.renderizarDependencias(produto.grupoServico || produto.categoria, produto.tipoItem || produto.subcategoria)}
                        <div class="orcamento-inteligente-item-totais">
                            <span>\u00c1rea: <strong data-item-area="${this.escapar(produto.itemId || produto.orcamentoItemId || "")}">${this.escapar(this.formatarArea(produto.areaM2 || 0))} m\u00b2</strong></span>
                            ${Number(produto.valorAdicionalEngenharia || 0) > 0 ? `<span>Engenharia: <strong>${this.escapar(this.formatarMoeda(produto.valorAdicionalEngenharia))}</strong></span>` : ""}
                            <span>Subtotal: <strong data-item-subtotal="${this.escapar(produto.itemId || produto.orcamentoItemId || "")}">${this.escapar(this.formatarMoeda(produto.subtotalFinal || produto.subtotal || produto.valorTotal || 0))}</strong></span>
                        </div>
                    </article>
                `).join("")}
            </form>
        `;
    },

    renderizarTabelaItens(produtos = []) {
        if (!Array.isArray(produtos) || !produtos.length) {
            return `<div class="orcamento-inteligente-lista-vazia">Sem itens para conferir.</div>`;
        }

        return `
            <div class="orcamento-inteligente-tabela-wrap">
                <table class="orcamento-inteligente-tabela-itens">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Tipo</th>
                            <th>Refinamento</th>
                            <th>Descricao</th>
                            <th>Medidas</th>
                            <th>\u00c1rea (m\u00b2)</th>
                            <th>Qtd.</th>
                            <th>Valor unitario</th>
                            <th>Engenharia</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${produtos.map((produto, indice) => `
                            <tr>
                                <td>${indice + 1}</td>
                                <td>${this.escapar(produto.tipoItemNome || produto.nome || "Item")}</td>
                                <td>${this.escapar(produto.subtipoItem || "")}</td>
                                <td>${this.escapar(produto.descricao || this.nomeEntidade(produto) || "Item")}</td>
                                <td>${this.escapar(this.formatarMedidas(produto))}</td>
                                <td>${this.escapar(this.formatarArea(produto.areaM2 || 0))}</td>
                                <td>${this.escapar(this.valorNumero(produto.quantidade || 0))}</td>
                                <td>${this.escapar(this.formatarMoeda(produto.valorUnitario || 0))}</td>
                                <td>${Number(produto.valorAdicionalEngenharia || 0) > 0 ? this.escapar(this.formatarMoeda(produto.valorAdicionalEngenharia)) : ""}</td>
                                <td>${this.escapar(this.formatarMoeda(produto.subtotalFinal || produto.subtotal || produto.valorTotal || 0))}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
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

    renderizarNavegacao({
        podeVoltar = true,
        podeAvancar = true,
        exibirVoltar = true,
        exibirAvancar = true,
        rotuloAvancar = "Avancar"
    } = {}) {
        const botoes = [
            exibirVoltar ? `
                <button type="button" class="btn-pequeno btn-cinza" data-orcamento-action="voltar" ${podeVoltar ? "" : "disabled"}>
                    Voltar
                </button>
            ` : "",
            exibirAvancar ? `
                <button type="button" class="btn-pequeno" data-orcamento-action="avancar" ${podeAvancar ? "" : "disabled"}>
                    ${this.escapar(rotuloAvancar)}
                </button>
            ` : ""
        ].filter(Boolean);

        if (!botoes.length) {
            return "";
        }

        return `
            <div class="orcamento-inteligente-navegacao">
                ${botoes.join("")}
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

        const etapaResumo = etapaAtual === "resumo";
        this.elementos.resumoPainel?.classList.toggle("orcamento-inteligente-resumo-mobile-visivel", etapaResumo);
    },

    atualizarIndicadoresItens(contexto = {}) {
        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];

        produtos.forEach(produto => {
            const itemId = produto.itemId || produto.orcamentoItemId || "";
            const seletorItem = this.escaparSeletor(itemId);
            const area = document.querySelector(`[data-item-area="${seletorItem}"]`);
            const subtotal = document.querySelector(`[data-item-subtotal="${seletorItem}"]`);

            if (area) {
                area.textContent = `${this.formatarArea(produto.areaM2 || 0)} m\u00b2`;
            }

            if (subtotal) {
                subtotal.textContent = this.formatarMoeda(produto.subtotalFinal || produto.subtotal || produto.valorTotal || 0);
            }
        });

        this.atualizarTotais(contexto);
    },

    atualizarTotais(contexto = {}) {
        const totais = contexto.resumo?.totais || {};
        const campos = {
            subtotal: this.formatarMoeda(totais.subtotal || 0),
            desconto: this.formatarMoeda(totais.desconto || 0),
            acrescimo: this.formatarMoeda(totais.acrescimo || 0),
            area: `${this.formatarArea(totais.areaTotalM2 || 0)} m\u00b2`,
            totalGeral: this.formatarMoeda(totais.totalGeral || 0)
        };

        Object.entries(campos).forEach(([chave, valor]) => {
            document.querySelectorAll(`[data-total-campo="${chave}"]`).forEach(elemento => {
                elemento.textContent = valor;
            });
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
        const servicosSelecionados = this.obterServicosSelecionados(contexto);
        const mapa = {
            cliente: !!contexto.cliente,
            projeto: !!contexto.projeto,
            servico: servicosSelecionados.length > 0,
            produtos: produtos.length > 0,
            calculo: !!contexto.resultado?.sucesso,
            resumo: !!contexto.resultado?.sucesso
        };

        return !!mapa[chave];
    },

    estadoOperacional(contexto = {}) {
        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];
        const servicosSelecionados = this.obterServicosSelecionados(contexto);

        if (!contexto.cliente) return "Cliente nao selecionado";
        if (!contexto.projeto) return "Projeto nao selecionado";
        if (!servicosSelecionados.length) return "Servico nao selecionado";
        if (!produtos.length) return "Sem itens";
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

        const area = resultado.detalhes?.areaTotalM2
            ? ` | ${this.formatarArea(resultado.detalhes.areaTotalM2)} m\u00b2`
            : "";
        return `${this.formatarMoeda(resultado.valorCalculado || 0)}${area}`;
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
            AREA_M2: "\u00c1rea (m\u00b2)",
            LINEAR_M: "Linear (m)",
            UNIDADE: "Unidade",
            PERSONALIZADO: "Personalizado",
            ORCAMENTO_ITENS: "Itens da proposta",
            area_m2: "\u00c1rea (m\u00b2)",
            linear_m: "Linear (m)",
            unidade: "Unidade",
            personalizado: "Personalizado",
            orcamento_itens: "Itens da proposta"
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

    rotuloAjuste(tipo, valor) {
        const tipoNormalizado = String(tipo || "sem");
        const numero = Number(valor || 0);

        if (tipoNormalizado === "percentual" && numero > 0) {
            return ` <small>${this.escapar(this.valorNumero(numero))}%</small>`;
        }

        if (tipoNormalizado === "valor" && numero > 0) {
            return ` <small>valor fixo</small>`;
        }

        return "";
    },

    formatarMedidas(item = {}) {
        const largura = this.valorNumero(item.larguraCm || 0);
        const altura = this.valorNumero(item.alturaCm || 0);
        return `${largura} x ${altura} cm`;
    },

    formatarArea(valor) {
        const numero = Number(valor || 0);

        return Number.isFinite(numero)
            ? numero.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4
            })
            : "0,00";
    },

    valorNumero(valor, casas = 2) {
        const numero = Number(valor || 0);

        return Number.isFinite(numero)
            ? numero.toLocaleString("pt-BR", {
                minimumFractionDigits: casas,
                maximumFractionDigits: casas
            })
            : "0,00";
    },

    normalizarValorOpcao(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
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
    },

    escaparSeletor(valor) {
        if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
            return CSS.escape(String(valor || ""));
        }

        return String(valor || "").replace(/"/g, "\\\"");
    }
};
