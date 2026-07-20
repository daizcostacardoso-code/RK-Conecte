const OrcamentoItemConfig = {
    servicos: Object.freeze([
        { id: "porta", nome: "Porta", plural: "Portas", itemSingular: "porta" },
        { id: "janela", nome: "Janela", plural: "Janelas", itemSingular: "janela" },
        { id: "box", nome: "Box", plural: "Boxes", itemSingular: "box" },
        { id: "espelho", nome: "Espelho", plural: "Espelhos", itemSingular: "espelho" },
        { id: "vidro_fixo", nome: "Vidro fixo", plural: "Vidros fixos", itemSingular: "vidro fixo" },
        { id: "fachada", nome: "Fachada", plural: "Fachadas", itemSingular: "fachada" },
        { id: "guarda_corpo", nome: "Guarda-corpo", plural: "Guarda-corpos", itemSingular: "guarda-corpo" },
        { id: "outros", nome: "Outros", plural: "Outros", itemSingular: "item" }
    ]),

    grupos: Object.freeze({
        porta: {
            valorUnitarioPadrao: 420,
            tamanhosPadrao: [
                { id: "80x210", nome: "210 x 80 cm", larguraCm: 80, alturaCm: 210 },
                { id: "90x210", nome: "210 x 90 cm", larguraCm: 90, alturaCm: 210 },
                { id: "100x210", nome: "210 x 100 cm", larguraCm: 100, alturaCm: 210 }
            ],
            tipos: [
                {
                    id: "porta_abrir",
                    nome: "Porta de abrir",
                    subtipos: ["Padrao", "Com puxador", "Com dobradica", "Com fechadura", "Outros"],
                    dependencias: ["vidro", "dobradica", "puxador", "fechadura", "acabamento"]
                },
                {
                    id: "porta_correr",
                    nome: "Porta de correr",
                    subtipos: ["2 folhas", "3 folhas", "4 folhas", "Com grapa", "Com trilho", "Com roldana aparente", "Outros"],
                    dependencias: ["vidro", "trilho", "roldana", "puxador", "acabamento"]
                },
                {
                    id: "porta_pivotante",
                    nome: "Porta pivotante",
                    subtipos: ["Padrao", "Com puxador", "Com fechadura", "Outros"],
                    dependencias: ["vidro", "pivo", "puxador", "fechadura", "acabamento"]
                },
                {
                    id: "porta_giro",
                    nome: "Porta de giro",
                    subtipos: ["Padrao", "Com mola", "Com puxador", "Outros"],
                    dependencias: ["vidro", "mola", "puxador", "acabamento"]
                }
            ]
        },
        janela: {
            valorUnitarioPadrao: 390,
            tamanhosPadrao: [
                { id: "100x100", nome: "100 x 100 cm", larguraCm: 100, alturaCm: 100 },
                { id: "120x100", nome: "100 x 120 cm", larguraCm: 120, alturaCm: 100 },
                { id: "150x110", nome: "110 x 150 cm", larguraCm: 150, alturaCm: 110 },
                { id: "200x120", nome: "120 x 200 cm", larguraCm: 200, alturaCm: 120 }
            ],
            tipos: [
                {
                    id: "janela_correr",
                    nome: "Janela de correr",
                    subtipos: ["2 folhas", "3 folhas", "4 folhas", "Com trilho", "Outros"],
                    dependencias: ["vidro", "trilho", "roldana", "fecho", "acabamento"]
                },
                {
                    id: "janela_2_folhas",
                    nome: "Janela 2 folhas",
                    subtipos: ["Padrao", "Com grade", "Com persiana", "Outros"],
                    dependencias: ["vidro", "trilho", "roldana", "fecho", "acabamento"]
                },
                {
                    id: "janela_4_folhas",
                    nome: "Janela 4 folhas",
                    subtipos: ["Padrao", "Com trilho reforcado", "Com fecho central", "Outros"],
                    dependencias: ["vidro", "trilho", "roldana", "fecho", "acabamento"]
                },
                {
                    id: "maxim_ar",
                    nome: "Maxim-ar",
                    subtipos: ["Padrao", "Com comando", "Outros"],
                    dependencias: ["vidro", "braco maxim-ar", "fecho", "acabamento"]
                },
                {
                    id: "basculante",
                    nome: "Basculante",
                    subtipos: ["Padrao", "Com comando", "Outros"],
                    dependencias: ["vidro", "bascula", "fecho", "acabamento"]
                },
                {
                    id: "projetante",
                    nome: "Projetante",
                    subtipos: ["Padrao", "Com braco", "Outros"],
                    dependencias: ["vidro", "braco projetante", "fecho", "acabamento"]
                }
            ]
        },
        box: {
            valorUnitarioPadrao: 360,
            tamanhosPadrao: [
                { id: "120x190", nome: "190 x 120 cm", larguraCm: 120, alturaCm: 190 },
                { id: "140x190", nome: "190 x 140 cm", larguraCm: 140, alturaCm: 190 },
                { id: "160x190", nome: "190 x 160 cm", larguraCm: 160, alturaCm: 190 }
            ],
            tipos: [
                {
                    id: "box_frontal",
                    nome: "Box frontal",
                    subtipos: ["Padrao", "Com perfil", "Sem perfil", "Outros"],
                    dependencias: ["vidro", "kit box", "puxador", "perfil", "vedacao"]
                },
                {
                    id: "box_canto",
                    nome: "Box de canto",
                    subtipos: ["Padrao", "Duas faces", "Outros"],
                    dependencias: ["vidro", "kit box", "puxador", "perfil", "vedacao"]
                },
                {
                    id: "box_correr",
                    nome: "Box de correr",
                    subtipos: ["2 folhas", "3 folhas", "Outros"],
                    dependencias: ["vidro", "kit box", "trilho", "roldana", "puxador", "vedacao"]
                },
                {
                    id: "box_abrir",
                    nome: "Box de abrir",
                    subtipos: ["Padrao", "Com dobradica", "Outros"],
                    dependencias: ["vidro", "dobradica", "puxador", "perfil", "vedacao"]
                }
            ]
        },
        espelho: {
            valorUnitarioPadrao: 280,
            tamanhosPadrao: [],
            tipos: [
                {
                    id: "espelho_simples",
                    nome: "Espelho simples",
                    subtipos: ["Padrao", "Com acabamento", "Outros"],
                    dependencias: ["vidro/espelho", "acabamento", "fixacao"]
                },
                {
                    id: "espelho_bisotado",
                    nome: "Espelho bisotado",
                    subtipos: ["Bisote 1 cm", "Bisote 2 cm", "Outros"],
                    dependencias: ["vidro/espelho", "bisote", "fixacao"]
                },
                {
                    id: "espelho_lapidado",
                    nome: "Espelho com lapidacao",
                    subtipos: ["Lapidacao reta", "Lapidacao boleada", "Outros"],
                    dependencias: ["vidro/espelho", "lapidacao", "fixacao"]
                },
                {
                    id: "espelho_led",
                    nome: "Espelho com LED",
                    subtipos: ["LED frontal", "LED indireto", "Outros"],
                    dependencias: ["vidro/espelho", "led", "fonte", "acabamento", "fixacao"]
                }
            ]
        },
        vidro_fixo: {
            valorUnitarioPadrao: 420,
            tamanhosPadrao: [],
            tipos: [
                {
                    id: "vidro_fixo_temperado",
                    nome: "Vidro fixo temperado",
                    subtipos: ["8 mm", "10 mm", "12 mm", "Outros"],
                    dependencias: ["vidro", "perfil", "fixacao", "acabamento"]
                },
                {
                    id: "vidro_fixo_laminado",
                    nome: "Vidro fixo laminado",
                    subtipos: ["Padrao", "Incolor", "Verde", "Outros"],
                    dependencias: ["vidro", "perfil", "fixacao", "acabamento"]
                }
            ]
        },
        fachada: {
            valorUnitarioPadrao: 520,
            tamanhosPadrao: [],
            tipos: [
                {
                    id: "fachada_vidro",
                    nome: "Fachada de vidro",
                    subtipos: ["Pele de vidro", "Com perfil", "Sem perfil", "Outros"],
                    dependencias: ["vidro", "perfil estrutural", "fixacao", "vedacao", "acabamento"]
                },
                {
                    id: "fachada_comercial",
                    nome: "Fachada comercial",
                    subtipos: ["Porta + fixo", "Somente fixo", "Outros"],
                    dependencias: ["vidro", "perfil", "fechadura", "puxador", "vedacao"]
                }
            ]
        },
        guarda_corpo: {
            valorUnitarioPadrao: 580,
            tamanhosPadrao: [],
            tipos: [
                {
                    id: "guarda_corpo_vidro",
                    nome: "Guarda-corpo vidro",
                    subtipos: ["Padrao", "Com corrimao", "Outros"],
                    dependencias: ["vidro", "fixacao", "acabamento"]
                },
                {
                    id: "guarda_corpo_torre",
                    nome: "Guarda-corpo com torre",
                    subtipos: ["Torre inox", "Torre aluminio", "Outros"],
                    dependencias: ["vidro", "torre", "fixacao", "acabamento"]
                },
                {
                    id: "guarda_corpo_perfil",
                    nome: "Guarda-corpo com perfil",
                    subtipos: ["Perfil inferior", "Perfil lateral", "Outros"],
                    dependencias: ["vidro", "perfil", "fixacao", "acabamento"]
                }
            ]
        },
        outros: {
            valorUnitarioPadrao: 300,
            tamanhosPadrao: [],
            tipos: [
                {
                    id: "outro_servico",
                    nome: "Outro servico sob medida",
                    subtipos: ["Sob medida", "Manutencao", "Instalacao", "Outros"],
                    dependencias: ["vidro", "acessorios", "mao de obra", "acabamento"]
                }
            ]
        }
    }),

    obterServicosBase() {
        return this.servicos.map(servico => ({ ...servico }));
    },

    obterServico(id) {
        const chave = this.normalizarChave(id);
        return this.obterServicosBase().find(servico => servico.id === chave) || null;
    },

    obterGrupo(grupoServico) {
        return this.grupos[this.normalizarChave(grupoServico)] || this.grupos.outros;
    },

    obterTiposItem(grupoServico) {
        const grupo = this.obterGrupo(grupoServico);
        return (grupo.tipos || []).map(tipo => ({ ...tipo, subtipos: [...(tipo.subtipos || [])], dependencias: [...(tipo.dependencias || [])] }));
    },

    obterTipoItem(grupoServico, tipoItem) {
        const tipos = this.obterTiposItem(grupoServico);
        return tipos.find(tipo => tipo.id === this.normalizarChave(tipoItem)) || tipos[0] || null;
    },

    obterSubtiposItem(grupoServico, tipoItem) {
        const tipo = this.obterTipoItem(grupoServico, tipoItem);
        return tipo?.subtipos?.length ? [...tipo.subtipos] : ["Padrao", "Outros"];
    },

    obterDependencias(grupoServico, tipoItem) {
        const tipo = this.obterTipoItem(grupoServico, tipoItem);
        return tipo?.dependencias?.length ? [...tipo.dependencias] : ["vidro", "acabamento"];
    },

    obterTamanhosPadrao(grupoServico) {
        const grupo = this.obterGrupo(grupoServico);
        return (grupo.tamanhosPadrao || []).map(tamanho => ({ ...tamanho }));
    },

    obterTamanhoPadrao(grupoServico, tamanhoId) {
        const tamanhos = this.obterTamanhosPadrao(grupoServico);
        return tamanhos.find(tamanho => tamanho.id === String(tamanhoId || "")) || tamanhos[0] || null;
    },

    permiteTamanhoPadrao(grupoServico) {
        return this.obterTamanhosPadrao(grupoServico).length > 0;
    },

    obterValorUnitarioPadrao(grupoServico) {
        return this.obterGrupo(grupoServico).valorUnitarioPadrao || 0;
    },

    normalizarTipoDimensao(tipoDimensao, grupoServico = "") {
        const valor = this.normalizarChave(tipoDimensao);

        if (valor === "padrao" || valor === "tamanho_padrao") {
            return this.permiteTamanhoPadrao(grupoServico) ? "padrao" : "engenharia";
        }

        return "engenharia";
    },

    montarProdutoReferencial(grupoServico, tipoItem = "") {
        const servico = this.obterServico(grupoServico) || this.obterServico("outros");
        const tipo = this.obterTipoItem(servico.id, tipoItem);

        return {
            id: `cfg_${servico.id}_${tipo?.id || "item"}`,
            nome: tipo?.nome || servico.nome,
            categoria: servico.id,
            subcategoria: tipo?.id || "",
            unidadeVenda: "m2",
            tipoCalculo: "area_m2",
            precoVenda: this.obterValorUnitarioPadrao(servico.id),
            ativo: true
        };
    },

    montarDescricaoItem(item = {}) {
        return [
            item.tipoItemNome || item.tipoItem,
            item.subtipoItem
        ].filter(Boolean).join(" - ");
    },

    normalizarChave(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    }
};
