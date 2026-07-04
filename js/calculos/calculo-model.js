const CalculoModel = {
    tipos: Object.freeze({
        AREA_M2: "AREA_M2",
        LINEAR_M: "LINEAR_M",
        UNIDADE: "UNIDADE",
        PERSONALIZADO: "PERSONALIZADO"
    }),

    unidades: Object.freeze({
        AREA_M2: "m2",
        LINEAR_M: "m",
        UNIDADE: "un",
        PERSONALIZADO: "personalizado"
    }),

    criar(dados = {}) {
        return this.normalizar(dados);
    },

    normalizar(dados = {}) {
        const tipoCalculo = this.normalizarTipoCalculo(dados.tipoCalculo || dados.tipo);

        return {
            tipoCalculo,
            quantidade: this.numero(dados.quantidade, 1),
            largura: this.numero(dados.largura, 0),
            altura: this.numero(dados.altura, 0),
            comprimento: this.numero(dados.comprimento, 0),
            valorUnitario: this.numero(dados.valorUnitario, 0),
            perdaPercentual: this.numero(dados.perdaPercentual, 0),
            desconto: this.numero(dados.desconto, 0),
            acrescimo: this.numero(dados.acrescimo, 0),
            resultado: this.numero(dados.resultado, 0),
            observacoes: this.texto(dados.observacoes)
        };
    },

    normalizarTipoCalculo(tipoCalculo) {
        const valor = this.slug(tipoCalculo);
        const aliases = {
            area: this.tipos.AREA_M2,
            area_m2: this.tipos.AREA_M2,
            m2: this.tipos.AREA_M2,
            metro_quadrado: this.tipos.AREA_M2,
            linear: this.tipos.LINEAR_M,
            linear_m: this.tipos.LINEAR_M,
            metro_linear: this.tipos.LINEAR_M,
            m: this.tipos.LINEAR_M,
            unidade: this.tipos.UNIDADE,
            unitario: this.tipos.UNIDADE,
            un: this.tipos.UNIDADE,
            quantidade: this.tipos.UNIDADE,
            personalizado: this.tipos.PERSONALIZADO,
            customizado: this.tipos.PERSONALIZADO
        };

        if (this.tipos[String(tipoCalculo || "").toUpperCase()]) {
            return String(tipoCalculo).toUpperCase();
        }

        return aliases[valor] || valor.toUpperCase();
    },

    tipoValido(tipoCalculo) {
        return Object.values(this.tipos).includes(this.normalizarTipoCalculo(tipoCalculo));
    },

    obterUnidade(tipoCalculo) {
        return this.unidades[this.normalizarTipoCalculo(tipoCalculo)] || "";
    },

    criarResultado({ sucesso = true, tipo, valorCalculado = 0, unidade, detalhes = {} } = {}) {
        const tipoNormalizado = this.normalizarTipoCalculo(tipo);

        return {
            sucesso,
            tipo: tipoNormalizado,
            valorCalculado: this.arredondar(valorCalculado, 2),
            unidade: unidade || this.obterUnidade(tipoNormalizado),
            detalhes: detalhes || {}
        };
    },

    criarErro(tipo, erros = [], detalhes = {}) {
        return this.criarResultado({
            sucesso: false,
            tipo,
            valorCalculado: 0,
            unidade: this.obterUnidade(tipo),
            detalhes: {
                ...detalhes,
                erros: Array.isArray(erros) ? erros : [String(erros || "Erro de calculo.")]
            }
        });
    },

    numero(valor, padrao = 0) {
        if (valor === undefined || valor === null || valor === "") {
            return padrao;
        }

        if (typeof valor === "number") {
            return Number.isFinite(valor) ? valor : padrao;
        }

        const numero = Number(String(valor).replace(",", "."));
        return Number.isFinite(numero) ? numero : padrao;
    },

    arredondar(valor, casas = 2) {
        const fator = 10 ** casas;
        return Math.round((this.numero(valor) + Number.EPSILON) * fator) / fator;
    },

    slug(valor) {
        return this.removerAcentos(valor)
            .toLowerCase()
            .replace(/mÂ²/g, "m2")
            .replace(/m²/g, "m2")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    },

    removerAcentos(valor) {
        return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    },

    texto(valor) {
        return String(valor || "").trim();
    }
};

function criarCalculoBase(dados = {}) {
    return CalculoModel.criar(dados);
}
