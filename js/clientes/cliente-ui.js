const ClienteUI = {
    elementos: {},
    callbacks: {},
    clienteSelecionado: null,
    abaAtiva: "dados",

    iniciar(callbacks = {}) {
        this.callbacks = callbacks;
        this.mapearElementos();
        this.vincularEventos();
        this.renderizarDetalhe(null);
    },

    mapearElementos() {
        this.elementos = {
            busca: document.getElementById("buscaCliente"),
            btnNovo: document.getElementById("btnNovoCliente"),
            aviso: document.getElementById("clientesAviso"),
            resumo: document.getElementById("clientesResumo"),
            tabelaCorpo: document.getElementById("clientesTabelaCorpo"),
            form: document.getElementById("formClienteRapido"),
            detalheResumo: document.getElementById("clienteDetalheResumo"),
            detalheConteudo: document.getElementById("clienteDetalheConteudo"),
            resumoConteudo: document.getElementById("clienteResumoConteudo"),
            indicadoresConteudo: document.getElementById("clienteIndicadoresConteudo"),
            abas: document.querySelectorAll("[data-cliente-aba]")
        };
    },

    vincularEventos() {
        const { busca, btnNovo, form, tabelaCorpo, abas } = this.elementos;

        if (busca) {
            busca.addEventListener("input", () => {
                if (typeof this.callbacks.aoBuscar === "function") {
                    this.callbacks.aoBuscar(busca.value);
                }
            });
        }

        if (btnNovo) {
            btnNovo.addEventListener("click", () => {
                this.focarCadastro();
                if (typeof this.callbacks.aoNovoCliente === "function") {
                    this.callbacks.aoNovoCliente();
                }
            });
        }

        if (form) {
            form.addEventListener("submit", evento => {
                evento.preventDefault();
                if (typeof this.callbacks.aoCriarCliente === "function") {
                    this.callbacks.aoCriarCliente(this.obterDadosFormulario());
                }
            });
        }

        if (tabelaCorpo) {
            tabelaCorpo.addEventListener("click", evento => {
                const botao = evento.target.closest("[data-cliente-id]");
                if (!botao || typeof this.callbacks.aoSelecionarCliente !== "function") {
                    return;
                }

                this.callbacks.aoSelecionarCliente(botao.dataset.clienteId);
            });
        }

        abas.forEach(botao => {
            botao.addEventListener("click", () => {
                this.alterarAba(botao.dataset.clienteAba);
            });
        });
    },

    obterDadosFormulario() {
        const form = this.elementos.form;
        const dados = new FormData(form);

        return {
            tipoPessoa: dados.get("tipoPessoa"),
            nome: dados.get("nome"),
            nomeFantasia: dados.get("nomeFantasia"),
            cpfCnpj: dados.get("cpfCnpj"),
            telefonePrincipal: dados.get("telefonePrincipal"),
            telefoneSecundario: dados.get("telefoneSecundario"),
            email: dados.get("email"),
            observacoes: dados.get("observacoes"),
            usuario: "Interface Clientes"
        };
    },

    renderizarLista(clientes = []) {
        const tabelaCorpo = this.elementos.tabelaCorpo;
        if (!tabelaCorpo) return;

        this.atualizarResumo(clientes.length);

        if (!clientes.length) {
            tabelaCorpo.innerHTML = `
                <tr>
                    <td colspan="7" class="clientes-estado-vazio">Nenhum cliente cadastrado ainda.</td>
                </tr>
            `;
            return;
        }

        tabelaCorpo.innerHTML = clientes.map(cliente => `
            <tr>
                <td>
                    <strong>${this.escapar(cliente.nome || "Sem nome")}</strong>
                    ${cliente.nomeFantasia ? `<small>${this.escapar(cliente.nomeFantasia)}</small>` : ""}
                </td>
                <td>${this.escapar(this.rotuloTipoPessoa(cliente.tipoPessoa))}</td>
                <td>${this.escapar(this.formatarTelefone(cliente.telefonePrincipal))}</td>
                <td>${this.escapar(this.obterCidade(cliente))}</td>
                <td><span class="cliente-status ${this.classeStatus(cliente.status)}">${this.escapar(this.rotuloStatus(cliente.status))}</span></td>
                <td>${this.escapar(this.formatarData(cliente.ultimaAtualizacao))}</td>
                <td>
                    <button type="button" class="btn-pequeno" data-cliente-id="${this.escaparAtributo(cliente.id)}">Ver</button>
                </td>
            </tr>
        `).join("");
    },

    renderizarDetalhe(cliente) {
        this.clienteSelecionado = cliente || null;
        this.atualizarAbas();

        const { detalheResumo } = this.elementos;

        if (!cliente) {
            if (detalheResumo) {
                detalheResumo.textContent = "Selecione um cliente para visualizar.";
            }

            this.renderizarResumoCliente(null);
            this.renderizarIndicadores(null);
            this.renderizarConteudoAba(null);
            return;
        }

        if (detalheResumo) {
            detalheResumo.textContent = `${cliente.nome || "Cliente"} atualizado em ${this.formatarData(cliente.ultimaAtualizacao)}.`;
        }

        this.renderizarResumoCliente(cliente);
        this.renderizarIndicadores(cliente);
        this.renderizarConteudoAba(cliente);
    },

    alterarAba(aba) {
        this.abaAtiva = aba || "dados";
        this.atualizarAbas();
        this.renderizarConteudoAba(this.clienteSelecionado);
    },

    atualizarAbas() {
        this.elementos.abas.forEach(botao => {
            const ativo = botao.dataset.clienteAba === this.abaAtiva;
            botao.classList.toggle("cliente-aba-ativa", ativo);
            botao.setAttribute("aria-selected", ativo ? "true" : "false");
        });
    },

    renderizarResumoCliente(cliente) {
        const resumo = this.elementos.resumoConteudo;
        if (!resumo) return;

        const campos = cliente ? [
            ["Nome", cliente.nome || "Não informado"],
            ["Telefone", this.formatarTelefone(cliente.telefonePrincipal)],
            ["Cidade", this.obterCidade(cliente)],
            ["Status", this.rotuloStatus(cliente.status)],
            ["Cliente desde", this.formatarData(cliente.dataCadastro)],
            ["Última atualização", this.formatarData(cliente.ultimaAtualizacao)]
        ] : [
            ["Nome", "Nenhum cliente selecionado"],
            ["Telefone", "Não informado"],
            ["Cidade", "Não informado"],
            ["Status", "Não informado"],
            ["Cliente desde", "Não informado"],
            ["Última atualização", "Não informado"]
        ];

        resumo.innerHTML = campos.map(([rotulo, valor]) => `
            <div class="cliente-resumo-item">
                <span>${this.escapar(rotulo)}</span>
                <strong>${this.escapar(valor)}</strong>
            </div>
        `).join("");
    },

    renderizarIndicadores(cliente) {
        const indicadores = this.elementos.indicadoresConteudo;
        if (!indicadores) return;

        const projetos = this.listaSegura(cliente?.projetos);
        const orcamentos = this.listaSegura(cliente?.orcamentos);

        const campos = [
            ["Quantidade de Projetos", cliente ? String(projetos.length) : "0"],
            ["Quantidade de Orçamentos", cliente ? String(orcamentos.length) : "0"],
            ["Último orçamento", cliente ? this.obterUltimoOrcamento(orcamentos) : "Nenhum orçamento encontrado."],
            ["Último contato", cliente ? this.obterUltimoContato(cliente) : "Não informado"],
            ["Status comercial", cliente ? this.rotuloStatus(cliente.status) : "Não informado"]
        ];

        indicadores.innerHTML = `
            <h3>Indicadores</h3>
            ${campos.map(([rotulo, valor]) => `
                <div class="cliente-indicador-item">
                    <span>${this.escapar(rotulo)}</span>
                    <strong>${this.escapar(valor)}</strong>
                </div>
            `).join("")}
        `;
    },

    renderizarConteudoAba(cliente) {
        const conteudo = this.elementos.detalheConteudo;
        if (!conteudo) return;

        if (!cliente) {
            conteudo.innerHTML = this.renderizarAbaVazia();
            return;
        }

        const renderizadores = {
            dados: () => this.renderizarAbaDados(cliente),
            projetos: () => this.renderizarAbaProjetos(cliente),
            orcamentos: () => this.renderizarAbaOrcamentos(cliente),
            historico: () => this.renderizarAbaHistorico(cliente),
            timeline: () => this.renderizarAbaTimeline(),
            observacoes: () => this.renderizarAbaObservacoes(cliente)
        };

        conteudo.innerHTML = (renderizadores[this.abaAtiva] || renderizadores.dados)();
    },

    renderizarAbaVazia() {
        const mensagens = {
            dados: "Selecione um cliente para visualizar os dados principais.",
            projetos: "Nenhum projeto cadastrado.",
            orcamentos: "Nenhum orçamento encontrado.",
            historico: "Nenhum evento histórico registrado.",
            timeline: "Timeline preparada para eventos comerciais futuros.",
            observacoes: "Nenhuma observação cadastrada."
        };

        return this.criarSecaoAba(this.rotuloAba(this.abaAtiva), `<p class="cliente-placeholder">${this.escapar(mensagens[this.abaAtiva] || mensagens.dados)}</p>`);
    },

    renderizarAbaDados(cliente) {
        const campos = [
            ["Nome", cliente.nome || "Não informado"],
            ["Nome fantasia", cliente.nomeFantasia || "Não informado"],
            ["Tipo pessoa", this.rotuloTipoPessoa(cliente.tipoPessoa) || "Não informado"],
            ["CPF/CNPJ", cliente.cpfCnpj || "Não informado"],
            ["Telefone principal", this.formatarTelefone(cliente.telefonePrincipal)],
            ["Telefone secundário", this.formatarTelefone(cliente.telefoneSecundario)],
            ["E-mail", cliente.email || "Não informado"],
            ["Cidade", this.obterCidade(cliente)]
        ];

        return `
            ${this.criarSecaoAba("Dados principais", this.criarListaDefinicao(campos))}
            ${this.criarSecaoAba("Endereços", this.criarListaPreparada(
                cliente.enderecos,
                "Nenhum endereço cadastrado.",
                endereco => [endereco.logradouro, endereco.numero, endereco.bairro, endereco.cidade, endereco.estado].filter(Boolean).join(", ")
            ))}
            ${this.criarSecaoAba("Contatos", this.criarListaPreparada(
                cliente.contatos,
                "Nenhum contato cadastrado.",
                contato => [contato.nome, contato.funcao, this.formatarTelefone(contato.telefone), contato.email].filter(Boolean).join(" - ")
            ))}
        `;
    },

    renderizarAbaProjetos(cliente) {
        return this.criarSecaoAba("Projetos", this.criarListaPreparada(
            cliente.projetos,
            "Nenhum projeto cadastrado.",
            projeto => this.rotuloVinculo(projeto)
        ));
    },

    renderizarAbaOrcamentos(cliente) {
        return this.criarSecaoAba("Orçamentos", this.criarListaPreparada(
            cliente.orcamentos,
            "Nenhum orçamento encontrado.",
            orcamento => this.rotuloVinculo(orcamento)
        ));
    },

    renderizarAbaHistorico(cliente) {
        return this.criarSecaoAba("Histórico", this.criarListaPreparada(
            cliente.historico,
            "Nenhum evento histórico registrado.",
            evento => `${this.formatarData(evento.data)} - ${evento.descricao || evento.tipo || "Evento"}`
        ));
    },

    renderizarAbaTimeline() {
        return this.criarSecaoAba(
            "Timeline",
            `<p class="cliente-placeholder">Timeline preparada para eventos comerciais futuros.</p>`
        );
    },

    renderizarAbaObservacoes(cliente) {
        return this.criarSecaoAba(
            "Observações",
            `<p>${this.escapar(cliente.observacoes || "Nenhuma observação cadastrada.")}</p>`
        );
    },

    criarSecaoAba(titulo, conteudo) {
        return `
            <section class="cliente-aba-painel">
                <h3>${this.escapar(titulo)}</h3>
                ${conteudo}
            </section>
        `;
    },

    criarListaDefinicao(campos = []) {
        return `
            <dl class="cliente-dados-lista">
                ${campos.map(([rotulo, valor]) => `
                    <div>
                        <dt>${this.escapar(rotulo)}</dt>
                        <dd>${this.escapar(valor)}</dd>
                    </div>
                `).join("")}
            </dl>
        `;
    },

    criarListaPreparada(lista, mensagemVazia, formatador) {
        const itens = this.listaSegura(lista)
            .map(item => formatador(item))
            .filter(Boolean);

        if (!itens.length) {
            return `<p class="cliente-placeholder">${this.escapar(mensagemVazia)}</p>`;
        }

        return `
            <ul class="cliente-lista-preparada">
                ${itens.map(item => `<li>${this.escapar(item)}</li>`).join("")}
            </ul>
        `;
    },

    listaSegura(lista) {
        return Array.isArray(lista) ? lista : [];
    },

    mostrarAviso(mensagem = "", tipo = "info") {
        const aviso = this.elementos.aviso;
        if (!aviso) return;

        aviso.textContent = mensagem;
        aviso.className = mensagem ? `clientes-aviso visivel ${tipo}` : "clientes-aviso";
    },

    limparFormulario() {
        if (this.elementos.form) {
            this.elementos.form.reset();
        }
    },

    focarCadastro() {
        const campoNome = document.getElementById("clienteNome");
        if (campoNome) {
            campoNome.focus();
            campoNome.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    },

    definirCarregando(carregando) {
        const botao = this.elementos.form?.querySelector("button[type='submit']");
        if (!botao) return;

        botao.disabled = carregando;
        botao.textContent = carregando ? "Salvando..." : "Salvar cliente";
    },

    atualizarResumo(total) {
        if (!this.elementos.resumo) return;

        this.elementos.resumo.textContent = total === 1
            ? "1 cliente cadastrado"
            : `${total} clientes cadastrados`;
    },

    obterCidade(cliente = {}) {
        const endereco = Array.isArray(cliente.enderecos) ? cliente.enderecos[0] : null;
        return endereco?.cidade || "Não informado";
    },

    obterUltimoOrcamento(orcamentos = []) {
        const ultimo = orcamentos[orcamentos.length - 1];
        return ultimo ? this.rotuloVinculo(ultimo) : "Nenhum orçamento encontrado.";
    },

    obterUltimoContato(cliente = {}) {
        const contatos = this.listaSegura(cliente.contatos);
        const ultimo = contatos[contatos.length - 1];

        if (!ultimo) {
            return "Não informado";
        }

        return [ultimo.nome, this.formatarTelefone(ultimo.telefone), ultimo.email].filter(Boolean).join(" - ");
    },

    rotuloAba(aba) {
        const rotulos = {
            dados: "Dados",
            projetos: "Projetos",
            orcamentos: "Orçamentos",
            historico: "Histórico",
            timeline: "Timeline",
            observacoes: "Observações"
        };

        return rotulos[aba] || rotulos.dados;
    },

    rotuloTipoPessoa(tipoPessoa) {
        if (typeof ClienteModel !== "undefined" && typeof ClienteModel.rotuloTipoPessoa === "function") {
            return ClienteModel.rotuloTipoPessoa(tipoPessoa);
        }

        return tipoPessoa === "juridica" ? "Jurídica" : "Física";
    },

    rotuloStatus(status) {
        return status === "inativo" ? "Inativo" : "Ativo";
    },

    rotuloVinculo(vinculo = {}) {
        if (typeof vinculo === "string") return vinculo;
        return [vinculo.numero, vinculo.status, vinculo.id].filter(Boolean).join(" - ");
    },

    classeStatus(status) {
        return status === "inativo" ? "inativo" : "ativo";
    },

    formatarTelefone(telefone) {
        const digitos = String(telefone || "").replace(/\D/g, "");
        if (!digitos) return "Não informado";

        if (digitos.length === 11) {
            return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
        }

        if (digitos.length === 10) {
            return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
        }

        return telefone;
    },

    formatarData(valor) {
        if (!valor) return "Não informado";

        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) {
            return "Não informado";
        }

        return data.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
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
        return this.escapar(valor).replace(/`/g, "&#096;");
    }
};
