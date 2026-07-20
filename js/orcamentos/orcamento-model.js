const OrcamentoModel = {
    status: {
        rascunho: "Rascunho",
        enviado: "Enviado",
        aprovado: "Aprovado",
        em_producao: "Em produção",
        instalado: "Instalado",
        cancelado: "Cancelado"
    },

    categorias: {
        box: "Box",
        espelho: "Espelho",
        porta: "Porta",
        janela: "Janela",
        guarda_corpo: "Guarda-corpo",
        cobertura: "Cobertura",
        fachada: "Fachada",
        vidro_avulso: "Vidro avulso",
        servico_avulso: "Serviço avulso"
    },

    montar(dadosAnteriores = {}) {
        const clienteFormulario = Formulario.lerCliente();
        const cliente = {
            ...clienteFormulario,
            id: dadosAnteriores.cliente?.id || dadosAnteriores.clienteId || dadosAnteriores.vinculos?.clienteId || ""
        };
        const obra = Formulario.lerObra();
        const itens = Itens.todos().map(item => this.normalizarItem(item));
        const ajustes = Formulario.lerResumoFinanceiro();
        const totais = Calculos.calcularTotais(itens, ajustes);
        const custosInternos = Formulario.lerCustosInternos(totais.totalFinal);
        const pagamento = Formulario.lerPagamento();
        const datasAnteriores = dadosAnteriores.datas || {};
        const vendedor = Util.$("vendedor")?.value?.trim() || dadosAnteriores.vendedor || "";
        const usuario = vendedor || dadosAnteriores.usuarios?.atualizacao || "Sistema";
        const statusAtual = Util.$("statusOrcamento")?.value || dadosAnteriores.status || "rascunho";
        const numero = Util.$("numeroOrcamento")?.value?.trim() || dadosAnteriores.numero || "";
        const dataCriacao = Util.$("dataCriacao")?.value || datasAnteriores.criacao || this.dataHoje();
        const dataValidade = Util.$("dataValidade")?.value || datasAnteriores.validade || this.dataValidadePadrao();
        const vinculos = this.normalizarVinculos(dadosAnteriores, cliente);

        return {
            id: dadosAnteriores.id || OrcamentoCalculos.criarId("orc"),
            numero,
            vinculos,
            solicitacaoId: vinculos.solicitacaoId,
            origemSolicitacaoId: vinculos.solicitacaoId,
            clienteId: vinculos.clienteId,
            projetoId: vinculos.projetoId,
            cliente,
            obra,
            vendedor,
            status: statusAtual,
            datas: {
                criacao: dataCriacao,
                validade: dataValidade,
                atualizacao: new Date().toISOString()
            },
            usuarios: {
                criacao: dadosAnteriores.usuarios?.criacao || Util.$("usuarioCriacao")?.value || usuario,
                atualizacao: usuario
            },
            itens,
            totais,
            pagamento,
            custosInternos,
            historico: this.atualizarHistorico(dadosAnteriores, statusAtual, usuario),
            observacoes: Formulario.lerObservacoes(),
            desconto: {
                tipo: totais.descontoPercentual > 0 && totais.descontoValor === 0 ? "percentual" : "valor",
                valor: totais.descontoPercentual > 0 && totais.descontoValor === 0 ? totais.descontoPercentual : totais.descontoValor
            },
            atualizadoEm: Util.agora(),
            atualizadoEmISO: new Date().toISOString()
        };
    },

    normalizar(dados = {}) {
        const cliente = {
            id: dados.cliente?.id || dados.clienteId || dados.vinculos?.clienteId || "",
            nome: dados.cliente?.nome || dados.nome || "",
            telefone: dados.cliente?.telefone || dados.telefone || "",
            email: dados.cliente?.email || dados.email || "",
            endereco: dados.cliente?.endereco || dados.endereco || ""
        };
        const obra = {
            endereco: dados.obra?.endereco || dados.enderecoObra || cliente.endereco || "",
            observacoes: dados.obra?.observacoes || dados.observacoesObra || ""
        };
        const itens = (Array.isArray(dados.itens) ? dados.itens : []).map(item => this.normalizarItem(item));
        const totais = dados.totais || Calculos.calcularTotais(itens, dados.desconto || {});
        const datas = {
            criacao: this.dataParaCampo(dados.datas?.criacao || dados.criadoEmISO) || this.dataHoje(),
            validade: this.dataParaCampo(dados.datas?.validade) || this.dataValidadePadrao(),
            atualizacao: dados.datas?.atualizacao || dados.atualizadoEmISO || ""
        };
        const vinculos = this.normalizarVinculos(dados, cliente);

        return {
            id: dados.id || "atual",
            numero: dados.numero || "",
            vinculos,
            solicitacaoId: vinculos.solicitacaoId,
            origemSolicitacaoId: vinculos.solicitacaoId,
            clienteId: vinculos.clienteId,
            projetoId: vinculos.projetoId,
            cliente,
            obra,
            vendedor: dados.vendedor || "",
            status: dados.status || "rascunho",
            datas,
            usuarios: {
                criacao: dados.usuarios?.criacao || dados.usuarioCriacao || "",
                atualizacao: dados.usuarios?.atualizacao || dados.usuarioAtualizacao || ""
            },
            itens,
            totais,
            pagamento: {
                forma: dados.pagamento?.forma || "",
                entrada: Math.max(0, Util.numero(dados.pagamento?.entrada)),
                parcelas: Math.max(1, Util.numero(dados.pagamento?.parcelas) || 1),
                observacoes: dados.pagamento?.observacoes || ""
            },
            custosInternos: OrcamentoCalculos.calcularCustosInternos(dados.custosInternos || {}, totais.totalFinal ?? totais.total),
            historico: Array.isArray(dados.historico) ? dados.historico : [],
            observacoes: dados.observacoes || "",
            desconto: dados.desconto || {
                tipo: "valor",
                valor: 0
            }
        };
    },

    normalizarVinculos(dados = {}, cliente = {}) {
        const vinculos = dados.vinculos && typeof dados.vinculos === "object" ? dados.vinculos : {};
        return {
            solicitacaoId: String(vinculos.solicitacaoId || dados.solicitacaoId || dados.origemSolicitacaoId || "").trim(),
            clienteId: String(vinculos.clienteId || dados.clienteId || cliente.id || cliente.cliente_id || "").trim(),
            projetoId: String(vinculos.projetoId || dados.projetoId || dados.projeto?.id || "").trim()
        };
    },

    normalizarItem(item = {}) {
        if (OrcamentoCalculos.usarFormulaProfissional(item)) {
            return OrcamentoCalculos.calcularItem(item);
        }

        return {
            ...item,
            modelo: item.modelo || "legado",
            id: item.id || OrcamentoCalculos.criarId("item"),
            categoria: item.categoria || this.categoriaPorTipo(item.tipoVidro),
            descricao: item.descricao || item.tipoVidro || "",
            areaM2: item.areaM2 ?? item.area ?? 0,
            valorM2: item.valorM2 ?? item.valorMetro ?? 0,
            valorFerragens: item.valorFerragens ?? item.acessorios ?? 0,
            valorServico: item.valorServico ?? 0,
            valorAdicional: item.valorAdicional ?? 0,
            descricaoAdicional: item.descricaoAdicional || "",
            observacoes: item.observacoes || ""
        };
    },

    categoriaPorTipo(tipo = "") {
        const texto = String(tipo).toLowerCase();
        if (texto.includes("box")) return "box";
        if (texto.includes("espelho")) return "espelho";
        if (texto.includes("porta")) return "porta";
        if (texto.includes("janela")) return "janela";
        if (texto.includes("guarda")) return "guarda_corpo";
        if (texto.includes("fachada")) return "fachada";
        return "vidro_avulso";
    },

    atualizarHistorico(dadosAnteriores = {}, statusAtual, usuario) {
        const historico = Array.isArray(dadosAnteriores.historico) ? [...dadosAnteriores.historico] : [];
        const agora = new Date().toISOString();

        if (!historico.length) {
            historico.push({
                tipo: "criado",
                data: agora,
                usuario,
                descricao: "Orçamento criado"
            });
        }

        if (dadosAnteriores.status && dadosAnteriores.status !== statusAtual) {
            historico.push({
                tipo: "status_alterado",
                data: agora,
                usuario,
                descricao: `Status alterado para ${this.rotuloStatus(statusAtual)}`
            });
        }

        return historico;
    },

    rotuloStatus(status) {
        return this.status[status] || status || "";
    },

    rotuloCategoria(categoria) {
        return this.categorias[categoria] || categoria || "";
    },

    numeroProvisorio() {
        const numero = Storage.carregar(Config.storage.numeroOrcamento, 1) || 1;
        return String(numero).padStart(6, "0");
    },

    dataHoje() {
        return new Date().toISOString().slice(0, 10);
    },

    dataValidadePadrao() {
        const data = new Date();
        data.setDate(data.getDate() + 15);
        return data.toISOString().slice(0, 10);
    },

    dataParaCampo(valor) {
        if (!valor) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return "";
        return data.toISOString().slice(0, 10);
    }
};
