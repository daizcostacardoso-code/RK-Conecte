const ProdutoModel = {
    categorias: {
        vidro: "Vidro",
        aluminio_perfil: "Aluminio/perfil",
        ferragem: "Ferragem",
        acessorio: "Acess\u00f3rio",
        insumo: "Insumo",
        mao_de_obra: "Mao de obra",
        kit: "Kit",
        acabamento: "Acabamento",
        outro: "Outro"
    },

    unidadesCalculo: {
        m2: "m\u00b2",
        metro_linear: "Metro linear",
        unidade: "Unidade",
        kit: "Kit",
        hora: "Hora"
    },

    tiposCalculo: {
        area_m2: "\u00c1rea",
        linear_m: "Largura",
        linear_altura: "Altura",
        perimetro: "Perimetro",
        quantidade_fixa: "Quantidade fixa",
        unidade: "Por unidade",
        hora: "Tempo medio"
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
        const unidade = this.normalizarUnidade(dados.unidade || dados.unidadeVenda || dados.unidadeCalculo);
        const regraCalculo = this.normalizarTipoCalculo(dados.regraCalculo || dados.tipoCalculo || dados.regra || unidade);
        const custoUnitario = this.numero(
            dados.custoUnitario ??
            dados.custo ??
            dados.precoCusto ??
            0
        );

        return {
            id: dados.id || this.criarId(),
            nome: this.texto(dados.nome),
            categoria: this.normalizarCategoria(dados.categoria),
            descricao: this.texto(dados.descricao),
            unidade,
            unidadeVenda: unidade,
            unidadeCalculo: unidade,
            tipoCalculo: regraCalculo,
            regraCalculo,
            custoUnitario,
            custo: custoUnitario,
            precoCusto: custoUnitario,
            ativo: this.normalizarAtivo(dados.ativo),
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
            aluminio: "aluminio_perfil",
            aluminio_perfil: "aluminio_perfil",
            aluminio_e_perfil: "aluminio_perfil",
            aluminio_perfis: "aluminio_perfil",
            aluminio_perfil_: "aluminio_perfil",
            perfil: "aluminio_perfil",
            perfis: "aluminio_perfil",
            ferragem: "ferragem",
            ferragens: "ferragem",
            kit: "kit",
            kits: "kit",
            acabamento: "acabamento",
            acabamentos: "acabamento",
            mao_de_obra: "mao_de_obra",
            mao_obra: "mao_de_obra",
            servico: "mao_de_obra",
            servicos: "mao_de_obra",
            acessorio: "acessorio",
            acessorios: "acessorio",
            insumo: "insumo",
            insumos: "insumo",
            outro: "outro",
            outros: "outro",
            servico_complementar: "outro",
            servicos_complementares: "outro",
            complementar: "outro"
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
            linear_largura: "linear_m",
            metro_linear_largura: "linear_m",
            metro_linear: "linear_m",
            m: "linear_m",
            metro: "linear_m",
            metro_linear_altura: "linear_altura",
            linear_altura: "linear_altura",
            altura: "linear_altura",
            perimetro: "perimetro",
            perimetral: "perimetro",
            unidade: "unidade",
            unitario: "unidade",
            por_unidade: "unidade",
            un: "unidade",
            servico: "unidade",
            quantidade: "quantidade_fixa",
            quantidade_fixa: "quantidade_fixa",
            fixo: "quantidade_fixa",
            fixa: "quantidade_fixa",
            qtd: "quantidade_fixa",
            kit: "quantidade_fixa",
            hora: "hora",
            horas: "hora",
            por_hora: "hora",
            tempo_medio: "hora",
            personalizado: "unidade"
        };

        return aliases[valor] || valor;
    },

    normalizarUnidade(unidade) {
        const valor = this.slug(unidade);
        const aliases = {
            m2: "m2",
            area_m2: "m2",
            metro_quadrado: "m2",
            metros_quadrados: "m2",
            m: "metro_linear",
            metro: "metro_linear",
            metro_linear: "metro_linear",
            linear_m: "metro_linear",
            unidade: "unidade",
            unitario: "unidade",
            un: "unidade",
            peca: "unidade",
            servico: "unidade",
            kit: "kit",
            hora: "hora",
            horas: "hora"
        };

        return aliases[valor] || valor || "unidade";
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

    categoriaValida(categoria) {
        return !!this.categorias[this.normalizarCategoria(categoria)];
    },

    tipoCalculoValido(tipoCalculo) {
        return !!this.tiposCalculo[this.normalizarTipoCalculo(tipoCalculo)];
    },

    unidadeValida(unidade) {
        return !!this.unidadesCalculo[this.normalizarUnidade(unidade)];
    },

    rotuloCategoria(categoria) {
        return this.categorias[this.normalizarCategoria(categoria)] || categoria || "";
    },

    rotuloTipoCalculo(tipoCalculo) {
        return this.tiposCalculo[this.normalizarTipoCalculo(tipoCalculo)] || tipoCalculo || "";
    },

    rotuloUnidade(unidade) {
        return this.unidadesCalculo[this.normalizarUnidade(unidade)] || unidade || "";
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
            .replace(/m²/g, "m2")
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
