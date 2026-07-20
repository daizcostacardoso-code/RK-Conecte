const ServicoModel = {
    categorias: {
        instalacao: "Instalacao",
        manutencao: "Manutencao",
        limpeza: "Limpeza",
        medicao_tecnica: "Medicao tecnica",
        remocao: "Remocao",
        outros: "Outros"
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
            tiposItem: this.normalizarTiposItem(dados.tiposItem),
            dependenciasPadrao: this.normalizarDependencias(dados.dependenciasPadrao || dados.dependencias),
            tamanhosPadrao: this.normalizarTamanhosPadrao(dados.tamanhosPadrao),
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
            tiposItem: alteracoes.tiposItem || anterior.tiposItem,
            dependenciasPadrao: alteracoes.dependenciasPadrao || anterior.dependenciasPadrao,
            tamanhosPadrao: alteracoes.tamanhosPadrao || anterior.tamanhosPadrao,
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
            guarda_corpo: "outros",
            guardacorpo: "outros",
            guarda_corpos: "outros",
            vidro_fixo: "outros",
            vidrofixo: "outros",
            fixo: "outros",
            porta: "instalacao",
            portas: "instalacao",
            janela: "instalacao",
            janelas: "instalacao",
            box: "instalacao",
            espelho: "instalacao",
            fachada: "instalacao",
            fechamento: "instalacao",
            cobertura: "instalacao",
            instalacao: "instalacao",
            instalacoes: "instalacao",
            instalar: "instalacao",
            manutencao: "manutencao",
            manutencoes: "manutencao",
            reparo: "manutencao",
            limpeza: "limpeza",
            medicao: "medicao_tecnica",
            medicao_tecnica: "medicao_tecnica",
            medida_tecnica: "medicao_tecnica",
            remocao: "remocao",
            remover: "remocao",
            projeto_personalizado: "outros",
            personalizado: "outros",
            outros: "outros",
            outro: "outros"
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
        if (typeof lista === "string") {
            return lista
                .split(/[\n,;]+/)
                .map(item => this.texto(item))
                .filter(Boolean);
        }

        if (!Array.isArray(lista)) {
            return [];
        }

        return lista.map(item => this.texto(item)).filter(Boolean);
    },

    normalizarTiposItem(tipos = []) {
        if (!Array.isArray(tipos)) {
            return [];
        }

        return tipos
            .map(tipo => this.normalizarTipoItem(tipo))
            .filter(tipo => tipo.nome);
    },

    normalizarTipoItem(tipo = {}) {
        const nome = this.texto(tipo.nome || tipo.rotulo || tipo.id);
        const dependencias = this.normalizarDependencias(tipo.dependencias || tipo.dependenciasPadrao);

        return {
            id: tipo.id || this.slug(nome) || this.criarId("tipo"),
            nome,
            descricao: this.texto(tipo.descricao),
            subtipos: this.normalizarListaTexto(tipo.subtipos),
            dependencias,
            dependenciasPadrao: dependencias,
            tempoMedio: this.numero(tipo.tempoMedio ?? tipo.tempoEstimado),
            unidadeTempo: this.normalizarUnidadeTempo(tipo.unidadeTempo),
            ativo: this.normalizarAtivo(tipo.ativo),
            observacoesTecnicas: this.texto(tipo.observacoesTecnicas || tipo.observacoes)
        };
    },

    normalizarDependencias(dependencias = []) {
        if (!Array.isArray(dependencias)) {
            return [];
        }

        return dependencias
            .map(dependencia => this.normalizarDependencia(dependencia))
            .filter(Boolean);
    },

    normalizarDependencia(dependencia = {}) {
        if (typeof dependencia === "string") {
            return {
                produtoId: "",
                produtoNome: this.texto(dependencia),
                categoria: "",
                unidadeCalculo: "",
                regraCalculo: "",
                quantidadePadrao: 0,
                custoUnitario: 0,
                custoEstimado: 0,
                obrigatoria: true,
                observacao: ""
            };
        }

        if (!dependencia || typeof dependencia !== "object") {
            return null;
        }

        const produto = dependencia.produto && typeof dependencia.produto === "object" ? dependencia.produto : dependencia;
        const produtoId = this.texto(dependencia.produtoId || produto.id);
        const produtoNome = this.texto(dependencia.produtoNome || dependencia.nome || produto.nome);
        const quantidadePadrao = this.numero(dependencia.quantidadePadrao ?? dependencia.quantidade ?? 1);
        const custoUnitario = this.numero(
            dependencia.custoUnitario ??
            dependencia.custo ??
            produto.custoUnitario ??
            produto.custo ??
            produto.precoCusto
        );

        return {
            produtoId,
            produtoNome,
            categoria: this.texto(dependencia.categoria || produto.categoria),
            unidadeCalculo: this.texto(dependencia.unidadeCalculo || produto.unidadeCalculo || produto.unidade || produto.unidadeVenda),
            regraCalculo: this.texto(dependencia.regraCalculo || produto.regraCalculo || produto.tipoCalculo),
            quantidadePadrao,
            custoUnitario,
            custoEstimado: this.calcularCustoEstimado(custoUnitario, quantidadePadrao),
            obrigatoria: this.normalizarAtivo(dependencia.obrigatoria === undefined ? true : dependencia.obrigatoria),
            observacao: this.texto(dependencia.observacao || dependencia.observacoes)
        };
    },

    calcularCustoEstimado(custoUnitario, quantidadePadrao) {
        const custo = this.numero(custoUnitario);
        const quantidade = this.numero(quantidadePadrao);
        return Number((custo * quantidade).toFixed(2));
    },

    normalizarUnidadeTempo(unidadeTempo) {
        const valor = this.slug(unidadeTempo || "hora");
        const aliases = {
            minuto: "minuto",
            minutos: "minuto",
            min: "minuto",
            hora: "hora",
            horas: "hora",
            h: "hora",
            dia: "dia",
            dias: "dia"
        };

        return aliases[valor] || "hora";
    },

    normalizarTamanhosPadrao(tamanhos = []) {
        if (!Array.isArray(tamanhos)) {
            return [];
        }

        return tamanhos
            .map(tamanho => this.normalizarTamanhoPadrao(tamanho))
            .filter(tamanho => tamanho.nome || (tamanho.larguraCm > 0 && tamanho.alturaCm > 0));
    },

    normalizarTamanhoPadrao(tamanho = {}) {
        const larguraCm = this.numero(tamanho.larguraCm ?? tamanho.largura);
        const alturaCm = this.numero(tamanho.alturaCm ?? tamanho.altura);
        const nome = this.texto(tamanho.nome) || (larguraCm && alturaCm ? `${alturaCm} x ${larguraCm} cm` : "");

        return {
            id: tamanho.id || this.criarId("tam"),
            tipoItem: this.texto(tamanho.tipoItem || tamanho.modelo),
            modeloRelacionado: this.texto(tamanho.modeloRelacionado || tamanho.tipoItem || tamanho.modelo),
            nome,
            larguraCm,
            alturaCm,
            ativo: this.normalizarAtivo(tamanho.ativo),
            areaM2: this.calcularAreaM2(larguraCm, alturaCm)
        };
    },

    calcularAreaM2(larguraCm, alturaCm) {
        const largura = this.numero(larguraCm);
        const altura = this.numero(alturaCm);

        if (largura <= 0 || altura <= 0) {
            return 0;
        }

        return Number(((largura * altura) / 10000).toFixed(4));
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

    rotuloUnidadeTempo(unidadeTempo) {
        const mapa = {
            minuto: "minuto",
            hora: "hora",
            dia: "dia"
        };

        return mapa[this.normalizarUnidadeTempo(unidadeTempo)] || unidadeTempo || "";
    },

    rotuloDependencia(dependencia = {}) {
        if (typeof dependencia === "string") return dependencia;
        return dependencia.produtoNome || dependencia.nome || dependencia.produtoId || "";
    },

    numero(valor) {
        if (valor === undefined || valor === null || valor === "") {
            return 0;
        }

        if (typeof valor === "number") {
            return valor;
        }

        const numero = Number(String(valor).replace(",", "."));
        return Number.isFinite(numero) ? numero : 0;
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
