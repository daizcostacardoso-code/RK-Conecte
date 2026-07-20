const ClienteModel = {
    tiposPessoa: {
        fisica: "Fisica",
        juridica: "Juridica"
    },

    status: {
        ativo: "Ativo",
        inativo: "Inativo"
    },

    criar(dados = {}) {
        const agora = this.agoraISO();
        const cliente = this.normalizar({
            ...dados,
            id: dados.id || this.criarId(),
            status: dados.status || "ativo",
            dataCadastro: dados.dataCadastro || agora,
            ultimaAtualizacao: agora
        });

        if (!cliente.historico.length) {
            return this.adicionarEvento(cliente, "criado", "Cliente criado", dados.usuario || "Sistema");
        }

        return cliente;
    },

    normalizar(dados = {}) {
        const agora = this.agoraISO();

        return {
            id: dados.id || this.criarId(),
            tipoPessoa: this.normalizarTipoPessoa(dados.tipoPessoa),
            nome: this.texto(dados.nome),
            nomeFantasia: this.texto(dados.nomeFantasia),
            cpfCnpj: this.somenteDigitos(dados.cpfCnpj || dados.documento),
            inscricaoEstadual: this.texto(dados.inscricaoEstadual),
            telefonePrincipal: this.normalizarTelefone(dados.telefonePrincipal || dados.telefone),
            telefoneSecundario: this.normalizarTelefone(dados.telefoneSecundario),
            email: this.texto(dados.email).toLowerCase(),
            enderecos: this.normalizarLista(dados.enderecos, this.normalizarEndereco.bind(this)),
            contatos: this.normalizarLista(dados.contatos, this.normalizarContato.bind(this)),
            observacoes: this.texto(dados.observacoes),
            status: this.status[dados.status] ? dados.status : "ativo",
            dataCadastro: dados.dataCadastro || dados.criadoEmISO || agora,
            ultimaAtualizacao: dados.ultimaAtualizacao || dados.atualizadoEmISO || agora,
            projetos: this.normalizarLista(dados.projetos, this.normalizarVinculo.bind(this)),
            orcamentos: this.normalizarLista(dados.orcamentos, this.normalizarVinculo.bind(this)),
            historico: Array.isArray(dados.historico) ? dados.historico : [],
            timeline: Array.isArray(dados.timeline) ? dados.timeline : []
        };
    },

    atualizar(cliente = {}, alteracoes = {}, usuario = "Sistema") {
        const anterior = this.normalizar(cliente);
        const atualizado = this.normalizar({
            ...anterior,
            ...alteracoes,
            enderecos: alteracoes.enderecos || anterior.enderecos,
            contatos: alteracoes.contatos || anterior.contatos,
            projetos: alteracoes.projetos || anterior.projetos,
            orcamentos: alteracoes.orcamentos || anterior.orcamentos,
            historico: [...anterior.historico],
            timeline: [...anterior.timeline],
            dataCadastro: anterior.dataCadastro,
            ultimaAtualizacao: this.agoraISO()
        });

        return this.adicionarEvento(atualizado, "atualizado", "Cliente atualizado", usuario);
    },

    desativar(cliente = {}, usuario = "Sistema") {
        const anterior = this.normalizar(cliente);
        const atualizado = this.normalizar({
            ...anterior,
            status: "inativo",
            historico: [...anterior.historico],
            timeline: [...anterior.timeline],
            dataCadastro: anterior.dataCadastro,
            ultimaAtualizacao: this.agoraISO()
        });

        return this.adicionarEvento(atualizado, "desativado", "Cliente desativado", usuario);
    },

    adicionarEvento(cliente = {}, tipo, descricao, usuario = "Sistema", dados = {}) {
        const evento = this.criarEvento(tipo, descricao, usuario, dados);
        const historico = Array.isArray(cliente.historico) ? [...cliente.historico, evento] : [evento];
        const timeline = Array.isArray(cliente.timeline) ? [...cliente.timeline, evento] : [evento];

        return {
            ...cliente,
            historico,
            timeline,
            ultimaAtualizacao: evento.data
        };
    },

    criarEvento(tipo, descricao, usuario = "Sistema", dados = {}) {
        return {
            tipo: tipo || "evento",
            descricao: descricao || "",
            usuario: usuario || "Sistema",
            data: this.agoraISO(),
            dados: dados || {}
        };
    },

    normalizarEndereco(endereco = {}) {
        return {
            id: endereco.id || this.criarId("end"),
            tipo: this.texto(endereco.tipo || "principal"),
            cep: this.somenteDigitos(endereco.cep),
            logradouro: this.texto(endereco.logradouro || endereco.endereco),
            numero: this.texto(endereco.numero),
            complemento: this.texto(endereco.complemento),
            bairro: this.texto(endereco.bairro),
            cidade: this.texto(endereco.cidade || "Porto Seguro"),
            estado: this.texto(endereco.estado || "BA"),
            referencia: this.texto(endereco.referencia),
            observacoes: this.texto(endereco.observacoes)
        };
    },

    normalizarContato(contato = {}) {
        return {
            id: contato.id || this.criarId("ctt"),
            nome: this.texto(contato.nome),
            funcao: this.texto(contato.funcao),
            telefone: this.normalizarTelefone(contato.telefone),
            email: this.texto(contato.email).toLowerCase(),
            observacoes: this.texto(contato.observacoes)
        };
    },

    normalizarVinculo(vinculo = {}) {
        if (typeof vinculo === "string") {
            return {
                id: vinculo,
                numero: "",
                status: ""
            };
        }

        return {
            id: vinculo.id || "",
            numero: vinculo.numero || vinculo.codigo || "",
            status: vinculo.status || ""
        };
    },

    normalizarLista(lista, normalizador) {
        if (!Array.isArray(lista)) {
            return [];
        }

        return lista.map(item => normalizador(item));
    },

    normalizarTipoPessoa(tipoPessoa) {
        if (!tipoPessoa) {
            return "fisica";
        }

        const valor = this.removerAcentos(tipoPessoa).toLowerCase();
        const limpo = valor.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

        if (["juridica", "pessoa_juridica", "pj"].includes(limpo)) {
            return "juridica";
        }

        if (["fisica", "pessoa_fisica", "pf"].includes(limpo)) {
            return "fisica";
        }

        return limpo;
    },

    rotuloTipoPessoa(tipoPessoa) {
        return this.tiposPessoa[tipoPessoa] || tipoPessoa || "";
    },

    normalizarTelefone(telefone) {
        return this.somenteDigitos(telefone);
    },

    somenteDigitos(valor) {
        return String(valor || "").replace(/\D/g, "");
    },

    removerAcentos(valor) {
        return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    },

    texto(valor) {
        return String(valor || "").trim();
    },

    criarId(prefixo = "cli") {
        return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    },

    agoraISO() {
        return new Date().toISOString();
    }
};

function criarClienteBase(dados = {}) {
    return ClienteModel.criar(dados);
}
