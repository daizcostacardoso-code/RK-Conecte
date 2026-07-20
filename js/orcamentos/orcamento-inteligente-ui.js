const OrcamentoInteligenteUI = {
    elementos: {},
    catalogoItens: {
        itens: [],
        tamanhos: [],
        dependencias: []
    },
    etapas: [
        { chave: "cliente", rotulo: "Cliente", icone: "&#128100;", dica: "Quem recebera a proposta." },
        { chave: "projeto", rotulo: "Projeto", icone: "&#8962;", dica: "Obra ou atendimento vinculado." },
        { chave: "produtos", rotulo: "Itens", icone: "&#9638;", dica: "Medidas, quantidade e valores." },
        { chave: "revisao", rotulo: "Revisão", icone: "&#10003;", dica: "Conferência dos itens adicionados." },
        { chave: "calculo", rotulo: "Cálculo", icone: "R$", dica: "Conferência financeira." },
        { chave: "resumo", rotulo: "Resumo", icone: "&#128279;", dica: "Finalizacao e documento." }
    ],

    iniciar() {
        this.mapearElementos();
        this.obterIndicadorCarregamento();
    },

    obterIndicadorCarregamento() {
        let indicador = document.getElementById("orcamentoInteligenteCarregamento");
        if (indicador) return indicador;

        indicador = document.createElement("div");
        indicador.id = "orcamentoInteligenteCarregamento";
        indicador.className = "orcamento-inteligente-carregamento";
        indicador.setAttribute("role", "status");
        indicador.setAttribute("aria-live", "polite");
        indicador.hidden = true;
        indicador.innerHTML = `
            <div class="orcamento-inteligente-carregamento-card">
                <span class="orcamento-inteligente-carregamento-spinner" aria-hidden="true"></span>
                <strong>Carregando dados...</strong>
                <small>Aguarde para preencher o orcamento.</small>
            </div>
        `;
        document.body.appendChild(indicador);
        return indicador;
    },

    definirCarregamento(ativo, mensagem = "Carregando dados...") {
        const indicador = this.obterIndicadorCarregamento();
        const layout = this.elementos.layout;
        const titulo = indicador.querySelector("strong");

        if (titulo) titulo.textContent = mensagem;
        indicador.hidden = !ativo;
        document.body.classList.toggle("orcamento-inteligente-carregando", ativo);
        if (layout) {
            layout.inert = ativo;
            layout.setAttribute("aria-busy", ativo ? "true" : "false");
        }
        this.elementos.botoesConfiguracoes.forEach(botao => {
            botao.disabled = ativo;
        });
        return true;
    },

    mapearElementos() {
        this.elementos = {
            modulo: document.querySelector(".orcamento-inteligente-modulo"),
            layout: document.querySelector(".orcamento-inteligente-layout"),
            principal: document.querySelector(".orcamento-inteligente-principal"),
            resumoPainel: document.querySelector(".orcamento-inteligente-resumo-painel"),
            btnNovo: document.getElementById("btnNovoOrcamentoInteligente"),
            botoesConfiguracoes: [...document.querySelectorAll("[data-orcamento-configuracoes-gatilho], .orcamento-inteligente-configuracoes-acao")],
            status: document.getElementById("orcamentoInteligenteStatus"),
            etapas: document.getElementById("orcamentoInteligenteEtapas"),
            contextoFixo: document.getElementById("orcamentoInteligenteContextoFixo"),
            cliente: document.getElementById("orcamentoInteligenteCliente"),
            projeto: document.getElementById("orcamentoInteligenteProjeto"),
            produtos: document.getElementById("orcamentoInteligenteProdutos"),
            revisao: document.getElementById("orcamentoInteligenteRevisao"),
            calculo: document.getElementById("orcamentoInteligenteCalculo"),
            resumo: document.getElementById("orcamentoInteligenteResumo"),
            avisoFlutuante: this.obterAvisoFlutuante()
        };
    },

    alternarMenuConfiguracoes(gatilho) {
        const idMenu = gatilho?.getAttribute("aria-controls");
        const menu = idMenu ? document.getElementById(idMenu) : null;
        if (!menu) return false;

        const abrir = menu.hidden;
        this.fecharMenusConfiguracoes();
        menu.hidden = !abrir;
        gatilho.setAttribute("aria-expanded", abrir ? "true" : "false");
        return abrir;
    },

    fecharMenusConfiguracoes() {
        document.querySelectorAll("[data-orcamento-configuracoes-menu]").forEach(menu => {
            menu.hidden = true;
        });
        document.querySelectorAll("[data-orcamento-configuracoes-gatilho]").forEach(gatilho => {
            gatilho.setAttribute("aria-expanded", "false");
        });
    },

    obterAvisoFlutuante() {
        let aviso = document.getElementById("orcamentoInteligenteAviso");
        if (aviso) return aviso;

        aviso = document.createElement("div");
        aviso.id = "orcamentoInteligenteAviso";
        aviso.className = "orcamento-inteligente-aviso-flutuante";
        aviso.setAttribute("role", "status");
        aviso.setAttribute("aria-live", "polite");
        document.body.appendChild(aviso);
        return aviso;
    },

    renderizarEtapaAtual(contexto = {}, dados = {}, etapaAtual = "cliente") {
        this.atualizarContextoFixo(contexto);
        this.renderizarEtapas(contexto, etapaAtual);
        this.renderizarCliente(contexto, dados.clientes || []);
        this.renderizarProjeto(contexto, dados.projetos || []);
        this.renderizarProdutos(contexto, dados || {});
        this.renderizarRevisao(contexto);
        this.renderizarCalculo(contexto, etapaAtual);
        this.renderizarResumo(contexto);
        this.exibirSecaoAtual(etapaAtual);
    },

    atualizarContextoFixo(contexto = {}) {
        const elemento = this.elementos.contextoFixo;
        if (!elemento) return;

        const cliente = contexto.cliente || null;
        const nomeCliente = this.nomeEntidade(cliente).trim();
        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];
        const totalItens = produtos.length;
        const nome = elemento.querySelector("[data-orcamento-contexto-cliente]");
        const quantidade = elemento.querySelector("[data-orcamento-contexto-itens]");
        const rotulo = elemento.querySelector("[data-orcamento-contexto-itens-rotulo]");
        const exibir = Boolean(cliente && nomeCliente);

        if (nome) {
            nome.textContent = nomeCliente;
            nome.title = nomeCliente;
        }
        if (quantidade) quantidade.textContent = String(totalItens);
        if (rotulo) rotulo.textContent = totalItens === 1 ? "item" : "itens";

        elemento.hidden = !exibir;
        document.body.classList.toggle("orcamento-inteligente-contexto-ativo", exibir);
    },

    renderizarEtapas(contexto = {}, etapaAtual = "cliente") {
        const container = this.elementos.etapas;
        if (!container) return;

        container.innerHTML = this.etapas.map((etapa, indice) => {
            const estado = etapa.chave === etapaAtual
                ? "ativa"
                : this.etapaConcluida(etapa.chave, contexto) ? "concluida" : "pendente";

            return `
                <button type="button" class="orcamento-inteligente-etapa ${estado}" data-orcamento-action="ir-etapa" data-orcamento-etapa="${this.escapar(etapa.chave)}" data-orcamento-etapa-indice="${indice}" aria-current="${estado === "ativa" ? "step" : "false"}" title="${this.escaparAtributo(etapa.dica || etapa.rotulo)}" aria-label="Ir para etapa ${this.escaparAtributo(etapa.rotulo)}">
                    <span class="orcamento-inteligente-etapa-bola" aria-hidden="true">${etapa.icone}</span>
                    <strong>${this.escapar(etapa.rotulo)}</strong>
                    <small>${this.escapar(this.rotuloEstadoEtapa(estado))}</small>
                </button>
            `;
        }).join("");

        this.atualizarStatus(this.estadoOperacional(contexto));
    },

    atualizarEstadoEtapas(contexto = {}, etapaAtual = "cliente") {
        const container = this.elementos.etapas;
        if (!container) return;

        const elementos = Array.from(container.querySelectorAll("[data-orcamento-etapa]"));
        if (!elementos.length) {
            this.renderizarEtapas(contexto, etapaAtual);
            return;
        }

        elementos.forEach(elemento => {
            const chave = elemento.dataset.orcamentoEtapa;
            const estado = chave === etapaAtual
                ? "ativa"
                : this.etapaConcluida(chave, contexto) ? "concluida" : "pendente";

            elemento.classList.toggle("ativa", estado === "ativa");
            elemento.classList.toggle("concluida", estado === "concluida");
            elemento.classList.toggle("pendente", estado === "pendente");
            elemento.setAttribute("aria-current", estado === "ativa" ? "step" : "false");

            const status = elemento.querySelector("small");
            if (status) {
                status.textContent = this.rotuloEstadoEtapa(estado);
            }
        });

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

        void projetos;
        const projetoSelecionado = contexto.projeto || null;
        const descricaoProjeto = projetoSelecionado?.manualOrcamento === true
            ? (projetoSelecionado.descricao || projetoSelecionado.nome || projetoSelecionado.titulo || projetoSelecionado.numero || "")
            : "";

        container.innerHTML = `
            <div class="orcamento-inteligente-fluxo">
                ${this.renderizarEstadoFluxo(descricaoProjeto ? "Descricao do projeto informada" : "Projeto opcional", true)}
                <form class="orcamento-inteligente-form" data-orcamento-form="projeto">
                    <label for="orcamentoProjetoDescricao">Descricao do projeto</label>
                    <textarea id="orcamentoProjetoDescricao" name="projetoDescricao" rows="4" placeholder="Opcional">${this.escapar(descricaoProjeto)}</textarea>
                    <button type="submit" class="botao orcamento-inteligente-btn-form">Salvar e continuar</button>
                </form>
                ${this.renderizarNavegacao({ podeVoltar: true, exibirAvancar: false })}
            </div>
        `;
    },

    renderizarProdutos(contexto = {}, dados = {}) {
        const container = this.elementos.produtos;
        if (!container) return;

        this.catalogoItens = {
            itens: Array.isArray(dados.itens) ? dados.itens : [],
            tamanhos: Array.isArray(dados.tamanhos) ? dados.tamanhos : [],
            dependencias: Array.isArray(dados.dependencias) ? dados.dependencias : []
        };
        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];
        const grupoItens = {
            id: "outros",
            nome: "Itens",
            plural: "Itens",
            itemSingular: "item"
        };

        container.innerHTML = `
            <div class="orcamento-inteligente-fluxo">
                ${this.renderizarEstadoFluxo(produtos.length ? "Itens adicionados" : "Sem itens", produtos.length > 0)}
                <div class="orcamento-inteligente-grupos-itens">
                    ${this.renderizarGrupoItem(grupoItens, this.catalogoItens)}
                </div>
                ${produtos.length ? this.renderizarResumoItensAdicionados(produtos) : ""}
            </div>
        `;
    },

    renderizarRevisao(contexto = {}) {
        const container = this.elementos.revisao;
        if (!container) return;

        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];

        if (!produtos.length) {
            container.innerHTML = `
                <div class="orcamento-inteligente-fluxo">
                    ${this.renderizarEstadoFluxo("Nenhum item para revisar", false)}
                    <div class="orcamento-inteligente-lista-vazia">Adicione pelo menos um item antes da revisao.</div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="orcamento-inteligente-fluxo">
                ${this.renderizarEstadoFluxo("Revise os itens adicionados", true)}
                ${this.renderizarListaProdutos(produtos)}
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
        const campos = [
            ["Cliente", resumo.cliente?.nome || this.nomeEntidade(contexto.cliente) || "Cliente nao selecionado."],
            ["Projeto", resumo.projeto?.nome || this.nomeEntidade(contexto.projeto) || ""],
            ["Itens", String(resumo.quantidadeProdutos ?? produtos.length)],
            ["\u00c1rea total", `${this.formatarArea(resumo.areaTotalM2 || resumo.totais?.areaTotalM2 || 0)} m\u00b2`],
            ["Subtotal", this.formatarMoeda(resumo.totais?.subtotal || 0)],
            ["Total geral", this.formatarMoeda(resumo.valorTotal ?? resultado?.valorCalculado ?? 0)],
            ["Status", this.rotuloStatus(resumo.status || contexto.status || "INICIADO")]
        ];

        container.innerHTML = `
            <dl>
                ${campos.map(([rotulo, valor]) => `
                    <div>
                        <dt>${this.escapar(rotulo)}</dt>
                        <dd>${this.escapar(valor)}</dd>
                    </div>
                `).join("")}
            </dl>
            ${this.renderizarTotais(contexto)}
            ${this.renderizarResumoMobileAcoes(contexto)}
        `;
    },

    renderizarResumoMobileAcoes(contexto = {}) {
        if (!contexto.resultado?.sucesso) {
            return `
                <section class="orcamento-inteligente-resumo-mobile-acoes">
                    <div class="orcamento-inteligente-validacao pendente">
                        <strong>Conclua o calculo para finalizar.</strong>
                    </div>
                </section>
            `;
        }

        return `
            <section class="orcamento-inteligente-resumo-mobile-acoes">
                ${this.renderizarValidacao(contexto)}
                <div class="orcamento-inteligente-navegacao">
                    <button type="button" class="btn-pequeno" data-orcamento-action="finalizar-orcamento">Finalizar orcamento</button>
                </div>
            </section>
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
                <div class="orcamento-inteligente-navegacao">
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
                    <label for="orcamentoDescontoValor">Valor do desconto <small>R$ ou %</small></label>
                    <input id="orcamentoDescontoValor" type="number" name="descontoValor" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${this.valorCalculo(ajustes.descontoValor, 0)}">
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
                    <label for="orcamentoAcrescimoValor">Valor do acrescimo <small>R$ ou %</small></label>
                    <input id="orcamentoAcrescimoValor" type="number" name="acrescimoValor" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${this.valorCalculo(ajustes.acrescimoValor, 0)}">
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
            </section>
        `;
    },

    renderizarCamposMedida(tipoCalculo, calculo = {}) {
        const tipo = this.normalizarTipoCalculo(tipoCalculo);

        if (tipo === "area_m2" || tipo === "AREA_M2") {
            return `
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoCalculoAltura">Altura <small>cm</small></label>
                    <input id="orcamentoCalculoAltura" type="number" name="altura" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${this.valorCalculo(calculo.altura, 0)}" required>
                </div>
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoCalculoLargura">Largura <small>cm</small></label>
                    <input id="orcamentoCalculoLargura" type="number" name="largura" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${this.valorCalculo(calculo.largura, 0)}" required>
                </div>
            `;
        }

        if (tipo === "linear_m" || tipo === "LINEAR_M") {
            return `
                <div class="orcamento-inteligente-campo">
                    <label for="orcamentoCalculoComprimento">Comprimento <small>m</small></label>
                    <input id="orcamentoCalculoComprimento" type="number" name="comprimento" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${this.valorCalculo(calculo.comprimento, 0)}" required>
                </div>
            `;
        }

        return "";
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

    renderizarOptionsItensProntos(itens = [], selecionado = "") {
        return (Array.isArray(itens) ? itens : []).map(item => {
            const id = item.id || item.itemId || item.item_id || "";
            const selected = String(id) === String(selecionado || "") ? " selected" : "";
            return `<option value="${this.escapar(id)}"${selected}>${this.escapar(this.rotuloItemPronto(item))}</option>`;
        }).join("");
    },

    rotuloItemPronto(item = {}) {
        const nome = item.descricao || item.nome || "Item";
        const categoria = item.categoriaDescricao || item.categoria_descricao || item.categoria || "";
        return categoria && categoria !== nome ? `${nome} - ${categoria}` : nome;
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

    renderizarResumoItensAdicionados(produtos = []) {
        const total = Array.isArray(produtos) ? produtos.length : 0;
        const rotulo = total === 1 ? "1 item adicionado" : `${total} itens adicionados`;

        return `
            <div class="orcamento-inteligente-selecionado">
                <span>Itens do orçamento</span>
                <strong>${this.escapar(rotulo)}</strong>
                <small>Continue rolando para revisar medidas, quantidades e valores.</small>
            </div>
        `;
    },

    renderizarGrupoItem(servico = {}, catalogo = {}) {
        const grupoServico = servico.id || "outros";
        const itensProntos = Array.isArray(catalogo.itens) ? catalogo.itens : [];

        return `
            <section class="orcamento-inteligente-grupo-item">
                <div class="orcamento-inteligente-grupo-topo">
                    <h3><span class="orcamento-inteligente-grupo-icone" aria-hidden="true">${this.escapar(this.iconeServico(servico))}</span>${this.escapar((servico.plural || servico.nome || "Itens").toUpperCase())}</h3>
                    <span>Adicionar item</span>
                </div>
                <form class="orcamento-inteligente-form orcamento-inteligente-form-item" data-orcamento-form="produto" data-orcamento-novo-item data-grupo-servico="${this.escapar(grupoServico)}" novalidate>
                    <input type="hidden" name="grupoServico" value="${this.escapar(grupoServico)}">
                    <input type="hidden" name="grupoServicoNome" value="Itens">
                    <input type="hidden" name="tipoItem" value="item_manual">
                    <input type="hidden" name="tipoItemNome" value="">
                    <input type="hidden" name="subtipoItem" value="">
                    <input type="hidden" name="unidade" value="m2">
                    <div class="orcamento-inteligente-campo">
                        <label>Item</label>
                        <select name="itemProntoId">
                            <option value="">Preencher manualmente</option>
                            ${this.renderizarOptionsItensProntos(itensProntos)}
                        </select>
                    </div>
                    ${this.renderizarDescricaoTamanhoItemPronto("", "", false)}
                    ${this.renderizarCamposDimensao({
                        grupoServico,
                        tipoDimensao: "engenharia",
                        tamanhos: [],
                        tamanhoPadraoSelecionado: "",
                        omitirTamanhoPadraoSelecionado: true,
                        larguraCm: "",
                        alturaCm: ""
                    })}
                    <div class="orcamento-inteligente-campo">
                        <label>Quantidade</label>
                        <input type="number" name="quantidade" min="0.01" step="0.01" inputmode="decimal" placeholder="1.00" value="1.00" required>
                    </div>
                    <div class="orcamento-inteligente-campo">
                        <label>Valor unitario <small>R$</small></label>
                        <input type="number" name="valorUnitario" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00" value="${this.valorCalculo(this.obterValorUnitarioPadrao(grupoServico), 0)}" required>
                    </div>
                    <div class="orcamento-inteligente-campo orcamento-inteligente-campo-valor-item">
                        <label>Ferragens/Acessórios <small>R$</small></label>
                        <input type="number" name="valorAdicional" min="0" step="0.01" inputmode="decimal" placeholder="0.00">
                    </div>
                    <div class="orcamento-inteligente-campo orcamento-inteligente-campo-valor-item">
                        <label>Valor do aluminio <small>R$/m</small></label>
                        <input type="number" name="valorAluminio" min="0" step="0.01" inputmode="decimal" placeholder="0.00">
                    </div>
                    <div class="orcamento-inteligente-campo orcamento-inteligente-campo-valor-item">
                        <label>Adicional do jato <small>R$</small></label>
                        <input type="number" name="valorJato" min="0" step="0.01" inputmode="decimal" placeholder="0.00">
                    </div>
                    <div class="orcamento-inteligente-campo orcamento-inteligente-campo-cheio">
                        <label>Descricao</label>
                        <input type="text" name="descricao" data-autogerada="false" placeholder="Informe a descricao" required>
                    </div>
                    ${this.renderizarDependencias(grupoServico, "", [])}
                    <div class="orcamento-inteligente-campo orcamento-inteligente-campo-cheio">
                        <label>Observacao do item</label>
                        <textarea name="observacoes" rows="2"></textarea>
                    </div>
                    <button type="button" class="botao orcamento-inteligente-btn-form" data-orcamento-action="adicionar-item"><span class="orcamento-inteligente-btn-icone" aria-hidden="true">+</span>Adicionar item</button>
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
            ` : `
                <input type="hidden" name="tipoDimensao" value="engenharia">
                ${item.omitirTamanhoPadraoSelecionado ? "" : `<input type="hidden" name="tamanhoPadraoSelecionado" value="${this.escapar(item.tamanhoPadraoSelecionado || "")}">`}
            `}
            <div class="orcamento-inteligente-campo">
                <label>Altura <small>cm</small></label>
                <input type="number" name="alturaCm" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${this.valorCalculo(item.alturaCm, 0)}" ${tipoDimensao === "padrao" ? "readonly" : ""} required>
            </div>
            <div class="orcamento-inteligente-campo">
                <label>Largura <small>cm</small></label>
                <input type="number" name="larguraCm" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${this.valorCalculo(item.larguraCm, 0)}" ${tipoDimensao === "padrao" ? "readonly" : ""} required>
            </div>
        `;
    },

    renderizarDescricaoTamanhoItemPronto(itemId = "", selecionado = "", visivel = false) {
        const tamanhos = itemId ? this.obterTamanhosItemPronto(itemId) : [];
        const selecionadoId = selecionado || (tamanhos.length === 1 ? tamanhos[0].id : "");

        return `
            <div class="orcamento-inteligente-campo ${visivel ? "" : "orcamento-inteligente-campo-oculto"}" data-tamanho-item-pronto-campo>
                <label>Descricao</label>
                <select name="tamanhoPadraoSelecionado" data-tamanho-item-pronto ${visivel && tamanhos.length ? "required" : "disabled"}>
                    <option value="">Selecione a descricao</option>
                    ${this.renderizarOptionsSelect(tamanhos.map(tamanho => [tamanho.id, this.rotuloTamanhoPadrao(tamanho)]), selecionadoId)}
                </select>
            </div>
        `;
    },

    obterTamanhosItemPronto(itemId = "") {
        const id = String(itemId || "");
        const tamanhos = Array.isArray(this.catalogoItens.tamanhos) ? this.catalogoItens.tamanhos : [];
        return tamanhos.filter(tamanho => String(tamanho.itemId || tamanho.item_id || "") === id);
    },

    rotuloTamanhoPadrao(tamanho = {}) {
        const nome = tamanho.nome || tamanho.descricao;
        if (nome) return nome;

        const altura = Number(tamanho.alturaCm || tamanho.altura || 0);
        const largura = Number(tamanho.larguraCm || tamanho.largura || 0);
        return altura || largura ? `${altura} x ${largura} cm` : "Tamanho padrao";
    },

    renderizarDependencias(grupoServico, tipoItem, dependenciasInformadas = null) {
        const dependencias = Array.isArray(dependenciasInformadas)
            ? dependenciasInformadas
            : this.obterDependenciasItem(grupoServico, tipoItem);

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

        const itensProntos = this.catalogoItens.itens || [];

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
                        data-subtipo-item="${this.escapar(produto.subtipoItem || "")}"
                        data-item-pronto-id="${this.escapar(produto.itemProntoId || produto.itemCadastroId || "")}"
                        data-tipo-dimensao="${this.escapar(produto.tipoDimensao || "engenharia")}"
                        data-tipo-calculo="${this.escapar(produto.tipoCalculo || "area_m2")}">
                        <div class="orcamento-inteligente-item-topo">
                            <div>
                                <span class="orcamento-inteligente-item-identificador">Item ${indice + 1} | ${this.escapar(produto.grupoServicoNome || produto.categoria || "Itens")}</span>
                                <strong>${this.escapar(produto.tipoItemNome || this.nomeEntidade(produto) || "Item")}</strong>
                            </div>
                            <button type="button" class="btn-pequeno btn-cinza" data-orcamento-action="remover-produto" data-indice="${indice}">
                                Remover
                            </button>
                        </div>
                        <div class="orcamento-inteligente-item-grid">
                            <input type="hidden" name="grupoServico" value="${this.escapar(produto.grupoServico || produto.categoria || "")}">
                            <input type="hidden" name="grupoServicoNome" value="${this.escapar(produto.grupoServicoNome || produto.categoria || "Itens")}">
                            <input type="hidden" name="tipoItem" value="${this.escapar(produto.tipoItem || produto.subcategoria || "item_manual")}">
                            <input type="hidden" name="tipoItemNome" value="${this.escapar(produto.tipoItemNome || this.nomeEntidade(produto) || "")}">
                            <input type="hidden" name="subtipoItem" value="${this.escapar(produto.subtipoItem || "")}">
                            <label>
                                <span>Item</span>
                                <select name="itemProntoId">
                                    <option value="">Preencher manualmente</option>
                                    ${this.renderizarOptionsItensProntos(itensProntos, produto.itemProntoId || produto.itemCadastroId || "")}
                                </select>
                            </label>
                            ${produto.itemProntoId || produto.itemCadastroId ? this.renderizarDescricaoTamanhoItemPronto(produto.itemProntoId || produto.itemCadastroId || "", produto.tamanhoPadraoSelecionado || "", true) : ""}
                            ${this.renderizarCamposDimensao({
                                ...produto,
                                omitirTamanhoPadraoSelecionado: Boolean(produto.itemProntoId || produto.itemCadastroId)
                            })}
                            <label>
                                <span>Quantidade</span>
                                <input type="number" name="quantidade" min="0.01" step="0.01" inputmode="decimal" placeholder="1.00" value="${this.valorCalculo(produto.quantidade, 1)}">
                            </label>
                            <input type="hidden" name="unidade" value="${this.escapar(produto.unidade || "m2")}">
                            <label>
                                <span>Valor unitario (R$)</span>
                                <input type="number" name="valorUnitario" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00" value="${this.valorCalculo(produto.valorUnitario, 0)}" required>
                            </label>
                            <label class="orcamento-inteligente-campo-valor-item">
                                <span>Ferragens/Acessórios (R$)</span>
                                <input type="number" name="valorAdicional" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${Number(produto.valorAdicional || 0) > 0 ? this.valorCalculo(produto.valorAdicional, 0) : ""}">
                            </label>
                            <label class="orcamento-inteligente-campo-valor-item">
                                <span>Valor do aluminio (R$/m)</span>
                                <input type="number" name="valorAluminio" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${Number(produto.valorAluminio || 0) > 0 ? this.valorCalculo(produto.valorAluminio, 0) : ""}">
                            </label>
                            <label class="orcamento-inteligente-campo-valor-item">
                                <span>Adicional do jato (R$)</span>
                                <input type="number" name="valorJato" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${Number(produto.valorJato || produto.adicionalJato || 0) > 0 ? this.valorCalculo(produto.valorJato || produto.adicionalJato, 0) : ""}">
                            </label>
                            <label class="orcamento-inteligente-item-observacao">
                                <span>Descricao</span>
                                <input type="text" name="descricao" value="${this.escapar(produto.descricao || this.nomeEntidade(produto) || "")}" required>
                            </label>
                            <label class="orcamento-inteligente-item-observacao">
                                <span>Observacao</span>
                                <input type="text" name="observacoes" value="${this.escapar(produto.observacoes || "")}">
                            </label>
                        </div>
                        ${this.renderizarDependencias(produto.grupoServico || produto.categoria, produto.tipoItem || produto.subcategoria, produto.dependencias || [])}
                        <div class="orcamento-inteligente-item-totais">
                            <span>\u00c1rea: <strong data-item-area="${this.escapar(produto.itemId || produto.orcamentoItemId || "")}">${this.escapar(this.formatarArea(produto.areaM2 || 0))} m\u00b2</strong></span>
                            ${Number(produto.valorAdicional || 0) > 0 ? `<span>Ferragens/Acessórios: <strong>${this.escapar(this.formatarMoeda(produto.valorAdicional))}</strong></span>` : ""}
                            ${Number(produto.totalAluminio || 0) > 0 ? `<span>Aluminio: <strong>${this.escapar(this.formatarMoeda(produto.totalAluminio))}</strong></span>` : ""}
                            ${Number(produto.valorJato || produto.adicionalJato || 0) > 0 ? `<span>Jato: <strong>${this.escapar(this.formatarMoeda(produto.valorJato || produto.adicionalJato))}</strong></span>` : ""}
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

        const possuiAdicional = produtos.some(produto => Number(produto.valorAdicional || 0) > 0);
        const possuiJato = produtos.some(produto => Number(produto.valorJato || produto.adicionalJato || 0) > 0);

        return `
            <div class="orcamento-inteligente-tabela-wrap">
                <table class="orcamento-inteligente-tabela-itens">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Tipo</th>
                            <th>Categoria</th>
                            <th>Descricao</th>
                            <th>Medidas</th>
                            <th>\u00c1rea (m\u00b2)</th>
                            <th>Qtd.</th>
                            <th>Valor unitario</th>
                            ${possuiAdicional ? "<th>Ferragens/Acessórios</th>" : ""}
                            ${possuiJato ? "<th>Jato</th>" : ""}
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
                                ${possuiAdicional ? `<td>${Number(produto.valorAdicional || 0) > 0 ? this.escapar(this.formatarMoeda(produto.valorAdicional)) : ""}</td>` : ""}
                                ${possuiJato ? `<td>${Number(produto.valorJato || produto.adicionalJato || 0) > 0 ? this.escapar(this.formatarMoeda(produto.valorJato || produto.adicionalJato)) : ""}</td>` : ""}
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
                <span>${this.escapar(sucesso ? "Resultado atualizado" : "Calculo nao concluido")}</span>
                <strong>${this.escapar(texto)}</strong>
            </div>
        `;
    },

    renderizarEstadoFluxo(texto, concluido) {
        return `
            <div class="orcamento-inteligente-estado ${concluido ? "ok" : "pendente"}">
                <span class="orcamento-inteligente-estado-icone" aria-hidden="true">${this.escapar(concluido ? "OK" : "...")}</span>
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
        void podeVoltar;
        void podeAvancar;
        void exibirVoltar;
        void exibirAvancar;
        void rotuloAvancar;
        return "";
    },

    exibirSecaoAtual(etapaAtual = "cliente") {
        if (this.ehViewportMobile()) {
            const etapaResumo = etapaAtual === "resumo";
            ["cliente", "projeto", "produtos", "revisao", "calculo"].forEach(chave => {
                const elemento = this.elementos[chave];
                const painel = elemento?.closest(".orcamento-inteligente-painel");
                if (!painel) return;

                const etapaAtiva = !etapaResumo && chave === etapaAtual;
                painel.classList.toggle("orcamento-inteligente-secao-oculta", !etapaAtiva);
                painel.classList.toggle("orcamento-inteligente-secao-ativa", etapaAtiva);
            });

            this.elementos.resumoPainel?.classList.toggle("orcamento-inteligente-resumo-mobile-visivel", etapaResumo);
            this.elementos.resumoPainel?.classList.toggle("orcamento-inteligente-secao-ativa", etapaResumo);
            return;
        }

        const chaveVisivel = etapaAtual === "resumo" ? "calculo" : etapaAtual;
        ["cliente", "projeto", "produtos", "revisao", "calculo"].forEach(chave => {
            const elemento = this.elementos[chave];
            const painel = elemento?.closest(".orcamento-inteligente-painel");
            if (!painel) return;
            painel.classList.toggle("orcamento-inteligente-secao-oculta", chave !== chaveVisivel);
        });

        const etapaResumo = etapaAtual === "resumo";
        this.elementos.resumoPainel?.classList.toggle("orcamento-inteligente-resumo-mobile-visivel", etapaResumo);
    },

    ehViewportMobile() {
        return typeof window !== "undefined"
            && typeof window.matchMedia === "function"
            && window.matchMedia("(max-width: 820px)").matches;
    },

    atualizarIndicadoresItens(contexto = {}) {
        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];

        this.atualizarContextoFixo(contexto);

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

    mostrarAviso(mensagem, tipo = "info", opcoes = {}) {
        const status = this.elementos.status;
        if (!status) return;

        status.textContent = mensagem || "";
        status.className = [
            "orcamento-inteligente-status",
            tipo,
            opcoes.destaque ? "bloqueio-etapa" : ""
        ].filter(Boolean).join(" ");

        this.mostrarAvisoFlutuante(mensagem, tipo, opcoes);
    },

    atualizarStatus(mensagem) {
        const status = this.elementos.status;
        if (!status) return;

        status.textContent = mensagem || "";
        status.className = "orcamento-inteligente-status";
    },

    mostrarAvisoFlutuante(mensagem, tipo = "info", opcoes = {}) {
        const aviso = this.elementos.avisoFlutuante || this.obterAvisoFlutuante();
        if (!aviso) return;

        window.clearTimeout(this.timerAvisoFlutuante);
        aviso.textContent = mensagem || "";
        aviso.className = [
            "orcamento-inteligente-aviso-flutuante",
            "visivel",
            tipo,
            opcoes.destaque ? "bloqueio-etapa" : ""
        ].filter(Boolean).join(" ");

        this.timerAvisoFlutuante = window.setTimeout(() => {
            aviso.classList.remove("visivel");
        }, opcoes.destaque ? 5200 : 3800);
    },

    etapaConcluida(chave, contexto = {}) {
        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];
        const mapa = {
            cliente: !!contexto.cliente,
            projeto: !!contexto.cliente,
            produtos: produtos.length > 0,
            revisao: produtos.length > 0,
            calculo: !!contexto.resultado?.sucesso,
            resumo: !!contexto.resultado?.sucesso
        };

        return !!mapa[chave];
    },

    estadoOperacional(contexto = {}) {
        const produtos = Array.isArray(contexto.produtos) ? contexto.produtos : [];

        if (!contexto.cliente) return "Cliente nao selecionado";
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
        const normalizado = Number(numero || 0);

        if (!Number.isFinite(normalizado)) {
            return this.escapar(Number(fallback || 0).toFixed(2));
        }

        return this.escapar(normalizado.toFixed(2));
    },

    rotuloEstadoEtapa(estado) {
        const rotulos = {
            ativa: "Em uso",
            concluida: "Pronto",
            pendente: "Pendente"
        };

        return rotulos[estado] || "Pendente";
    },

    iconeServico(servico = {}) {
        const id = this.normalizarValorOpcao(servico.id || servico.categoria || servico.nome);
        const mapa = {
            porta: "PT",
            janela: "JN",
            box: "BX",
            espelho: "ES",
            vidro_fixo: "VF",
            fachada: "FD",
            guarda_corpo: "GC",
            outros: "+"
        };

        return mapa[id] || "SV";
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
        return `${altura} x ${largura} cm`;
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

    escaparAtributo(valor) {
        return this.escapar(valor);
    },

    escaparSeletor(valor) {
        if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
            return CSS.escape(String(valor || ""));
        }

        return String(valor || "").replace(/"/g, "\\\"");
    }
};
