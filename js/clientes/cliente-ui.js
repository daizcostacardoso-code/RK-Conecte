const ClienteUI = {
    elementos: {},
    callbacks: {},

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
            detalheConteudo: document.getElementById("clienteDetalheConteudo")
        };
    },

    vincularEventos() {
        const { busca, btnNovo, form, tabelaCorpo } = this.elementos;

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
                <td><span class="cliente-status ${this.escapar(cliente.status || "ativo")}">${this.escapar(this.rotuloStatus(cliente.status))}</span></td>
                <td>${this.escapar(this.formatarData(cliente.ultimaAtualizacao))}</td>
                <td>
                    <button type="button" class="btn-pequeno" data-cliente-id="${this.escaparAtributo(cliente.id)}">Ver</button>
                </td>
            </tr>
        `).join("");
    },

    renderizarDetalhe(cliente) {
        const { detalheResumo, detalheConteudo } = this.elementos;
        if (!detalheConteudo) return;

        if (!cliente) {
            if (detalheResumo) {
                detalheResumo.textContent = "Selecione um cliente para visualizar.";
            }

            detalheConteudo.innerHTML = this.criarBlocosDetalhe({
                "Dados principais": ["Nenhum cliente selecionado."],
                "Endereços": ["Aguardando cadastro."],
                "Contatos": ["Aguardando cadastro."],
                "Projetos vinculados": ["Aguardando integração."],
                "Orçamentos": ["Aguardando integração."],
                "Timeline": ["Aguardando eventos."],
                "Observações": ["Nenhuma observação cadastrada."]
            });
            return;
        }

        if (detalheResumo) {
            detalheResumo.textContent = `${cliente.nome || "Cliente"} atualizado em ${this.formatarData(cliente.ultimaAtualizacao)}.`;
        }

        detalheConteudo.innerHTML = this.criarBlocosDetalhe({
            "Dados principais": [
                `Nome: ${cliente.nome || "Não informado"}`,
                `Tipo: ${this.rotuloTipoPessoa(cliente.tipoPessoa) || "Não informado"}`,
                `CPF/CNPJ: ${cliente.cpfCnpj || "Não informado"}`,
                `Telefone: ${this.formatarTelefone(cliente.telefonePrincipal)}`,
                `E-mail: ${cliente.email || "Não informado"}`,
                `Status: ${this.rotuloStatus(cliente.status)}`
            ],
            "Endereços": this.renderizarListaTexto(cliente.enderecos, endereco => [
                endereco.logradouro,
                endereco.numero,
                endereco.bairro,
                endereco.cidade,
                endereco.estado
            ].filter(Boolean).join(", ")),
            "Contatos": this.renderizarListaTexto(cliente.contatos, contato => [
                contato.nome,
                contato.funcao,
                this.formatarTelefone(contato.telefone),
                contato.email
            ].filter(Boolean).join(" - ")),
            "Projetos vinculados": this.renderizarListaTexto(cliente.projetos, projeto => this.rotuloVinculo(projeto)),
            "Orçamentos": this.renderizarListaTexto(cliente.orcamentos, orcamento => this.rotuloVinculo(orcamento)),
            "Timeline": this.renderizarListaTexto(cliente.timeline, evento => `${this.formatarData(evento.data)} - ${evento.descricao || evento.tipo || "Evento"}`),
            "Observações": [cliente.observacoes || "Nenhuma observação cadastrada."]
        });
    },

    criarBlocosDetalhe(secoes) {
        return Object.keys(secoes).map(titulo => `
            <div class="cliente-detalhe-bloco">
                <h3>${this.escapar(titulo)}</h3>
                ${this.criarListaDetalhe(secoes[titulo])}
            </div>
        `).join("");
    },

    criarListaDetalhe(itens = []) {
        const linhas = itens.filter(Boolean);

        if (linhas.length <= 1) {
            return `<p>${this.escapar(linhas[0] || "Não informado.")}</p>`;
        }

        return `<ul>${linhas.map(item => `<li>${this.escapar(item)}</li>`).join("")}</ul>`;
    },

    renderizarListaTexto(lista, formatador) {
        if (!Array.isArray(lista) || !lista.length) {
            return ["Nenhum registro cadastrado."];
        }

        return lista.map(item => formatador(item) || "Registro sem descrição.");
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
