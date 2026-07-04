const CriarProjetoUseCase = {
    async executar(dados = {}, repository = ProjetoRepository) {
        try {
            const projeto = this.criarProjeto(dados);
            const erros = this.validar(projeto);

            if (erros.length) {
                return {
                    sucesso: false,
                    projeto: null,
                    erros
                };
            }

            const salvo = await repository.salvarProjeto(projeto);
            this.dispararEventoProjetoCriado(salvo);

            return {
                sucesso: true,
                projeto: salvo,
                erros: []
            };
        } catch (erro) {
            return {
                sucesso: false,
                projeto: null,
                erros: [erro.message || "Erro ao criar Projeto."]
            };
        }
    },

    criarProjeto(dados = {}) {
        if (typeof criarProjetoBase === "function") {
            return criarProjetoBase(dados);
        }

        if (typeof ProjetoModel !== "undefined" && typeof ProjetoModel.criar === "function") {
            return ProjetoModel.criar(dados);
        }

        const agora = new Date().toISOString();
        return {
            id: dados.id || `prj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            numero: dados.numero || "",
            status: dados.status || "rascunho",
            etapaAtual: dados.etapaAtual || "comercial",
            cliente: dados.cliente || {},
            orcamento: dados.orcamento || {},
            comercial: dados.comercial || {},
            operacional: dados.operacional || {},
            financeiro: dados.financeiro || {},
            historico: Array.isArray(dados.historico) ? dados.historico : [],
            arquivos: Array.isArray(dados.arquivos) ? dados.arquivos : [],
            fotos: Array.isArray(dados.fotos) ? dados.fotos : [],
            datas: {
                criacao: dados.datas?.criacao || agora,
                atualizacao: dados.datas?.atualizacao || agora,
                conclusao: dados.datas?.conclusao || null
            },
            criadoPor: dados.criadoPor || "",
            atualizadoPor: dados.atualizadoPor || ""
        };
    },

    validar(projeto) {
        const erros = [];

        if (!projeto || typeof projeto !== "object") {
            erros.push("Projeto invalido.");
            return erros;
        }

        if (!projeto.id) {
            erros.push("Projeto sem id.");
        }

        if (!projeto.status) {
            erros.push("Projeto sem status.");
        }

        if (!projeto.cliente || typeof projeto.cliente !== "object") {
            erros.push("Projeto sem cliente.");
        }

        if (!projeto.datas || !projeto.datas.criacao) {
            erros.push("Projeto sem data de criacao.");
        }

        return erros;
    },

    dispararEventoProjetoCriado(projeto) {
        try {
            if (typeof dispararEventoProjetoCriado === "function") {
                dispararEventoProjetoCriado(projeto);
                return true;
            }

            if (typeof EventBus !== "undefined" && typeof EventTypes !== "undefined") {
                EventBus.emit(EventTypes.PROJETO_CRIADO, {
                    projeto,
                    projetoId: projeto.id
                });
                return true;
            }
        } catch (erro) {
            console.warn("Nao foi possivel disparar evento projeto.criado.", erro);
        }

        return false;
    }
};

