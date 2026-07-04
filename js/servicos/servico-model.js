const ServicoModel = {
    categorias: {
        box: "Box",
        espelho: "Espelho",
        guarda_corpo: "Guarda-corpo",
        cobertura: "Cobertura",
        fachada: "Fachada",
        janela: "Janela",
        porta: "Porta",
        fechamento: "Fechamento",
        manutencao: "Manutencao",
        projeto_personalizado: "Projeto Personalizado"
    },

    tiposCalculo: {
        area_m2: "Area (m2)",
        linear_m: "Linear (m)",
        unidade: "Unidade",
        quantidade: "Quantidade",
        personalizado: "Personalizado"
    },

    criar(dados = {}) {
        const agora = this.agoraISO();

        return this.normalizar({
            ...dados,
            id: dados.id || this.criarId(),
            ativo: dados.ativo === undefined ? true : dados.ativo,
            criadoEm: dados.criadoEm || agora,
            atualizadoEm: agora
        });
    },

    normalizar(dados = {}) {
        const agora = this.agoraISO();

        return {
            id: dados.id || this.criarId(),
            nome: this.texto(dados.nome),
            categoria: this.normalizarCategoria(dados.categoria),
            descricao: this.texto(dados.descricao),
            tipoCalculo: this.normalizarTipoCalculo(dados.tipoCalculo),
            unidadeVenda: this.texto(dados.unidadeVenda),
            camposObrigatorios: this.normalizarListaTexto(dados.camposObrigatorios),
            produtosSugeridos: this.normalizarListaTexto(dados.produtosSugeridos),
            ferragensSugeridas: this.normalizarListaTexto(dados.ferragensSugeridas),
            tempoEstimado: this.texto(dados.tempoEstimado),
            ativo: this.normalizarAtivo(dados.ativo),
            observacoes: this.texto(dados.observacoes),
            criadoEm: dados.criadoEm || dados.criadoEmISO || agora,
            atualizadoEm: dados.atualizadoEm || dados.atualizadoEmISO || agora
        };
    },

    atualizar(servico = {}, alteracoes = {}) {
        const anterior = this.normalizar(servico);

        return this.normalizar({
            ...anterior,
            ...alteracoes,
            camposObrigatorios: alteracoes.camposObrigatorios || anterior.camposObrigatorios,
            produtosSugeridos: alteracoes.produtosSugeridos || anterior.produtosSugeridos,
            ferragensSugeridas: alteracoes.ferragensSugeridas || anterior.ferragensSugeridas,
            criadoEm: anterior.criadoEm,
            atualizadoEm: this.agoraISO()
        });
    },

    desativar(servico = {}) {
        const anterior = this.normalizar(servico);

        return this.normalizar({
            ...anterior,
            ativo: false,
            criadoEm: anterior.criadoEm,
            atualizadoEm: this.agoraISO()
        });
    },

    normalizarCategoria(categoria) {
        const valor = this.slug(categoria);
        const aliases = {
            guarda_corpo: "guarda_corpo",
            guardacorpo: "guarda_corpo",
            guarda_corpos: "guarda_corpo",
            manutencao: "manutencao",
            projeto_personalizado: "projeto_personalizado",
            personalizado: "projeto_personalizado"
        };

        return aliases[valor] || valor;
    },

    normalizarTipoCalculo(tipoCalculo) {
        const valor = this.slug(tipoCalculo);
        const aliases = {
            area: "area_m2",
            area_m2: "area_m2",
            m2: "area_m2",
            metro_quadrado: "area_m2",
            linear: "linear_m",
            linear_m: "linear_m",
            metro_linear: "linear_m",
            m: "linear_m",
            unidade: "unidade",
            unitario: "unidade",
            quantidade: "quantidade",
            qtd: "quantidade",
            personalizado: "personalizado"
        };

        return aliases[valor] || valor;
    },

    normalizarAtivo(valor) {
        if (valor === undefined || valor === null || valor === "") {
            return true;
        }

        if (typeof valor === "boolean") {
            return valor;
        }

        if (valor === 1 || valor === "1") {
            return true;
        }

        if (valor === 0 || valor === "0") {
            return false;
        }

        const texto = this.slug(valor);

        if (["ativo", "sim", "true"].includes(texto)) {
            return true;
        }

        if (["inativo", "nao", "false"].includes(texto)) {
            return false;
        }

        return valor;
    },

    normalizarListaTexto(lista) {
        if (!Array.isArray(lista)) {
            return [];
        }

        return lista.map(item => this.texto(item)).filter(Boolean);
    },

    categoriaValida(categoria) {
        return !!this.categorias[this.normalizarCategoria(categoria)];
    },

    tipoCalculoValido(tipoCalculo) {
        return !!this.tiposCalculo[this.normalizarTipoCalculo(tipoCalculo)];
    },

    rotuloCategoria(categoria) {
        return this.categorias[this.normalizarCategoria(categoria)] || categoria || "";
    },

    rotuloTipoCalculo(tipoCalculo) {
        return this.tiposCalculo[this.normalizarTipoCalculo(tipoCalculo)] || tipoCalculo || "";
    },

    slug(valor) {
        return this.removerAcentos(valor)
            .toLowerCase()
            .replace(/m²/g, "m2")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    },

    removerAcentos(valor) {
        return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    },

    texto(valor) {
        return String(valor || "").trim();
    },

    criarId(prefixo = "srv") {
        return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    },

    agoraISO() {
        return new Date().toISOString();
    }
};

function criarServicoBase(dados = {}) {
    return ServicoModel.criar(dados);
}
