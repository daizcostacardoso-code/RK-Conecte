const ProdutoModel = {
    categorias: {
        vidro: "Vidro",
        ferragem: "Ferragem",
        perfil: "Perfil",
        acessorio: "Acess\u00f3rio",
        insumo: "Insumo",
        servico_complementar: "Servi\u00e7o Complementar"
    },

    subcategoriasVidro: {
        comum: "Comum",
        temperado: "Temperado",
        laminado: "Laminado",
        espelho: "Espelho",
        reflecta: "Reflecta",
        canelado: "Canelado"
    },

    tiposCalculo: {
        area_m2: "\u00c1rea (m\u00b2)",
        linear_m: "Linear (m)",
        unidade: "Unidade",
        quantidade: "Quantidade",
        peso_kg: "Peso (kg)",
        personalizado: "Personalizado"
    },

    atributosPreparados: [
        "espessura",
        "cor",
        "acabamento",
        "marca",
        "modelo",
        "peso",
        "largura",
        "altura",
        "comprimento"
    ],

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
            subcategoria: this.normalizarSubcategoria(dados.subcategoria),
            descricao: this.texto(dados.descricao),
            unidadeVenda: this.texto(dados.unidadeVenda),
            tipoCalculo: this.normalizarTipoCalculo(dados.tipoCalculo),
            precoCusto: this.numero(dados.precoCusto),
            precoVenda: this.numero(dados.precoVenda),
            margem: this.numero(dados.margem),
            ativo: this.normalizarAtivo(dados.ativo),
            atributos: this.normalizarAtributos(dados),
            observacoes: this.texto(dados.observacoes),
            criadoEm: dados.criadoEm || dados.criadoEmISO || agora,
            atualizadoEm: dados.atualizadoEm || dados.atualizadoEmISO || agora
        };
    },

    atualizar(produto = {}, alteracoes = {}) {
        const anterior = this.normalizar(produto);

        return this.normalizar({
            ...anterior,
            ...alteracoes,
            atributos: alteracoes.atributos || anterior.atributos,
            criadoEm: anterior.criadoEm,
            atualizadoEm: this.agoraISO()
        });
    },

    desativar(produto = {}) {
        const anterior = this.normalizar(produto);

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
            vidro: "vidro",
            vidros: "vidro",
            ferragem: "ferragem",
            ferragens: "ferragem",
            perfil: "perfil",
            perfis: "perfil",
            acessorio: "acessorio",
            acessorios: "acessorio",
            insumo: "insumo",
            insumos: "insumo",
            servico_complementar: "servico_complementar",
            servicos_complementares: "servico_complementar",
            complementar: "servico_complementar"
        };

        return aliases[valor] || valor;
    },

    normalizarSubcategoria(subcategoria) {
        const valor = this.slug(subcategoria);
        const aliases = {
            comum: "comum",
            temperado: "temperado",
            laminado: "laminado",
            espelho: "espelho",
            reflecta: "reflecta",
            refletivo: "reflecta",
            canelado: "canelado"
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
            peso: "peso_kg",
            peso_kg: "peso_kg",
            kg: "peso_kg",
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

    normalizarAtributos(dados = {}) {
        const origem = dados.atributos && typeof dados.atributos === "object" ? dados.atributos : {};

        return this.atributosPreparados.reduce((atributos, chave) => {
            const valor = origem[chave] ?? dados[chave];
            atributos[chave] = this.texto(valor);
            return atributos;
        }, {});
    },

    categoriaValida(categoria) {
        return !!this.categorias[this.normalizarCategoria(categoria)];
    },

    subcategoriaVidroValida(subcategoria) {
        const normalizada = this.normalizarSubcategoria(subcategoria);
        return !normalizada || !!this.subcategoriasVidro[normalizada];
    },

    tipoCalculoValido(tipoCalculo) {
        return !!this.tiposCalculo[this.normalizarTipoCalculo(tipoCalculo)];
    },

    rotuloCategoria(categoria) {
        return this.categorias[this.normalizarCategoria(categoria)] || categoria || "";
    },

    rotuloSubcategoria(subcategoria) {
        return this.subcategoriasVidro[this.normalizarSubcategoria(subcategoria)] || subcategoria || "";
    },

    rotuloTipoCalculo(tipoCalculo) {
        return this.tiposCalculo[this.normalizarTipoCalculo(tipoCalculo)] || tipoCalculo || "";
    },

    numero(valor) {
        if (valor === undefined || valor === null || valor === "") {
            return 0;
        }

        if (typeof valor === "number") {
            return valor;
        }

        const numero = Number(String(valor).replace(",", "."));
        return Number.isFinite(numero) ? numero : valor;
    },

    slug(valor) {
        return this.removerAcentos(valor)
            .toLowerCase()
            .replace(/mÂ²/g, "m2")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    },

    removerAcentos(valor) {
        return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    },

    texto(valor) {
        return String(valor || "").trim();
    },

    criarId(prefixo = "prd") {
        return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    },

    agoraISO() {
        return new Date().toISOString();
    }
};

function criarProdutoBase(dados = {}) {
    return ProdutoModel.criar(dados);
}
