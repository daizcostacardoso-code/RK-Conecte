const ProjetoOperacionalModel = {
    schemaVersion: 1,
    statusInicial: "aguardando_medicao",

    normalizarOrcamento(orcamento = {}) {
        if (typeof OrcamentoAprovacaoModel === "undefined") {
            throw new Error("Modelo canônico de orçamento indisponível.");
        }
        return OrcamentoAprovacaoModel.normalizarRegistro(orcamento);
    },

    idProjeto(orcamento = {}) {
        const registro = this.normalizarOrcamento(orcamento);
        const vinculado = this.texto(registro.vinculos?.projetoId || registro.projetoId);
        if (vinculado) return vinculado;
        const identidade = this.chave(registro.id || registro.numero);
        return `prj_orc_${identidade || "sem_identificador"}`.slice(0, 120);
    },

    criarOuAtualizar(orcamento = {}, projetoExistente = null, usuario = null) {
        if (typeof ProjetoModel === "undefined") {
            throw new Error("Modelo de projetos indisponível.");
        }
        const registro = this.normalizarOrcamento(orcamento);
        if (registro.status !== "aprovado") {
            throw new Error("Somente orçamentos aprovados podem abrir a operação.");
        }

        const projetoId = this.idProjeto(registro);
        const existente = projetoExistente ? ProjetoModel.normalizar({ ...projetoExistente, id: projetoId }) : null;
        const usuarioNome = this.nomeUsuario(usuario);
        const agora = OrcamentoAprovacaoModel.agoraISO();
        const total = Number(OrcamentoAprovacaoModel.obterTotal(registro) || 0);
        const cliente = this.clienteDoOrcamento(registro);
        const obra = this.obraDoOrcamento(registro, cliente);
        const orcamentoProjeto = {
            id: registro.id,
            numero: registro.numero,
            status: registro.status,
            total,
            revisao: registro.revisao,
            pdfUrl: registro.pdfUrl || ""
        };
        const statusExistente = existente?.status || "";
        const statusPreservado = ["em_producao", "em_instalacao", "finalizado", "concluido", "cancelado"].includes(statusExistente);
        const statusProjeto = statusPreservado ? statusExistente : "aprovado";
        const abertoEm = existente?.operacional?.abertoEm || registro.operacao?.abertaEm || agora;
        const abertoPor = existente?.operacional?.abertoPor || registro.operacao?.abertaPor || usuario;
        const base = {
            ...(existente || {}),
            id: projetoId,
            numero: existente?.numero || `PRJ-${registro.numero || this.chave(registro.id)}`,
            codigo: existente?.codigo || `PRJ-${registro.numero || this.chave(registro.id)}`,
            titulo: existente?.titulo || this.titulo(registro, cliente),
            nome: existente?.nome || this.titulo(registro, cliente),
            descricao: existente?.descricao || this.descricao(registro),
            origem: existente?.origem || "orcamento_aprovado",
            status: statusProjeto,
            etapaAtual: statusPreservado ? existente.etapaAtual : "comercial",
            etapa: statusPreservado ? existente.etapa : "comercial",
            cliente,
            clienteId: cliente.id,
            clienteNome: cliente.nome,
            obra,
            enderecoObra: obra.endereco,
            cidade: obra.cidade,
            orcamento: orcamentoProjeto,
            comercial: {
                ...(existente?.comercial || {}),
                valorEstimado: total,
                valorFechado: total
            },
            operacional: {
                ...(existente?.operacional || {}),
                status: existente?.operacional?.status || this.statusInicial,
                abertoEm,
                abertoPor,
                medicaoId: existente?.operacional?.medicaoId || "",
                notaServicoId: existente?.operacional?.notaServicoId || ""
            },
            financeiro: {
                ...(existente?.financeiro || {}),
                status: existente?.financeiro?.status || "aguardando_recebimento",
                valorTotal: total,
                valorRecebido: Number(existente?.financeiro?.valorRecebido || 0)
            },
            datas: {
                ...(existente?.datas || {}),
                criacao: existente?.datas?.criacao || abertoEm,
                atualizacao: agora,
                aprovacao: existente?.datas?.aprovacao || registro.aprovacao?.aprovadoEm || abertoEm
            },
            tags: [...new Set([...(existente?.tags || []), "operacao", "orcamento_aprovado"])],
            criadoPor: existente?.criadoPor || usuarioNome,
            atualizadoPor: usuarioNome,
            schemaOperacional: this.schemaVersion
        };

        let projeto = existente
            ? ProjetoModel.atualizar(existente, base, usuarioNome)
            : ProjetoModel.criar({ ...base, usuario: usuarioNome });
        const jaAberto = this.temEventoAbertura(projeto, registro.id);
        if (!jaAberto) {
            projeto = ProjetoModel.adicionarEvento(
                projeto,
                "operacao_aberta",
                `Operação aberta a partir do orçamento ${registro.numero || registro.id}.`,
                usuarioNome,
                { orcamentoId: registro.id, orcamentoNumero: registro.numero, revisao: registro.revisao }
            );
        }

        return {
            projeto: ProjetoModel.normalizar(projeto),
            alterado: !existente || !jaAberto,
            criado: !existente
        };
    },

    vincularOrcamento(orcamento = {}, projeto = {}, usuario = null) {
        const registro = this.normalizarOrcamento(orcamento);
        const projetoId = this.texto(projeto.id);
        if (!projetoId) throw new Error("Projeto operacional sem identificador.");
        const historico = [...registro.historicoStatus];
        const jaVinculado = this.texto(registro.vinculos?.projetoId) === projetoId
            && historico.some(item => item.acao === "operacao_aberta" && this.texto(item.projetoId || item.dados?.projetoId) === projetoId);
        if (jaVinculado) return { orcamento: registro, alterado: false };

        const agora = OrcamentoAprovacaoModel.agoraISO();
        historico.push(OrcamentoAprovacaoModel.criarHistorico({
            statusAnterior: registro.status,
            statusAtual: registro.status,
            acao: "operacao_aberta",
            observacao: `Projeto operacional ${projeto.numero || projetoId} vinculado ao orçamento.`,
            realizadoEm: agora,
            realizadoPor: usuario,
            origem: "fluxo_operacional",
            projetoId
        }));
        historico[historico.length - 1].projetoId = projetoId;

        return {
            alterado: true,
            orcamento: OrcamentoAprovacaoModel.normalizarRegistro({
                ...registro,
                vinculos: { ...registro.vinculos, projetoId },
                projetoId,
                projeto: { ...(registro.projeto || {}), id: projetoId, numero: projeto.numero || "" },
                operacao: {
                    ...(registro.operacao || {}),
                    projetoId,
                    status: "aberta",
                    abertaEm: registro.operacao?.abertaEm || agora,
                    abertaPor: registro.operacao?.abertaPor || usuario
                },
                historicoStatus: historico,
                atualizadoEmISO: agora
            })
        };
    },

    cancelarProjeto(orcamento = {}, projeto = {}, usuario = null, observacao = "") {
        if (typeof ProjetoModel === "undefined") throw new Error("Modelo de projetos indisponível.");
        const registro = this.normalizarOrcamento(orcamento);
        const atual = ProjetoModel.normalizar(projeto);
        const jaCancelado = atual.status === "cancelado"
            && (atual.historico || []).some(evento => evento.tipo === "operacao_cancelada" && this.texto(evento.dados?.orcamentoId) === registro.id);
        if (jaCancelado) return { projeto: atual, alterado: false };

        const usuarioNome = this.nomeUsuario(usuario);
        const agora = OrcamentoAprovacaoModel.agoraISO();
        let cancelado = ProjetoModel.atualizar(atual, {
            status: "cancelado",
            ativo: false,
            financeiro: {
                ...atual.financeiro,
                status: "cancelado"
            },
            operacional: {
                ...atual.operacional,
                status: "cancelado",
                ordemServicoStatus: atual.operacional?.notaServicoId ? "cancelado" : atual.operacional?.ordemServicoStatus || "",
                observacoes: this.texto(observacao) || atual.operacional?.observacoes || ""
            },
            datas: { ...atual.datas, cancelamento: agora }
        }, usuarioNome);
        cancelado = ProjetoModel.adicionarEvento(
            cancelado,
            "operacao_cancelada",
            `Operação cancelada após o cancelamento do orçamento ${registro.numero || registro.id}.`,
            usuarioNome,
            { orcamentoId: registro.id, orcamentoNumero: registro.numero }
        );
        return { projeto: ProjetoModel.normalizar(cancelado), alterado: true };
    },

    temEventoAbertura(projeto = {}, orcamentoId = "") {
        return (Array.isArray(projeto.historico) ? projeto.historico : []).some(evento =>
            evento.tipo === "operacao_aberta"
            && this.texto(evento.dados?.orcamentoId) === this.texto(orcamentoId)
        );
    },

    clienteDoOrcamento(registro = {}) {
        const cliente = registro.cliente || {};
        return {
            id: this.texto(registro.vinculos?.clienteId || cliente.id || cliente.cliente_id),
            nome: this.texto(cliente.nome || registro.clienteNome),
            telefone: this.texto(cliente.telefone || cliente.telefonePrincipal),
            email: this.texto(cliente.email),
            documento: this.texto(cliente.documento || cliente.cpfCnpj),
            endereco: this.texto(cliente.endereco)
        };
    },

    obraDoOrcamento(registro = {}, cliente = {}) {
        const projeto = registro.projeto || registro.documento?.dados?.projeto || {};
        return {
            endereco: this.texto(projeto.endereco || projeto.enderecoObra || cliente.endereco),
            bairro: this.texto(projeto.bairro),
            cidade: this.texto(projeto.cidade) || "Porto Seguro",
            referencia: this.texto(projeto.referencia),
            observacoes: this.texto(projeto.observacoes || registro.observacoes)
        };
    },

    titulo(registro = {}, cliente = {}) {
        const nome = this.texto(cliente.nome) || "Cliente";
        const numero = this.texto(registro.numero || registro.id);
        return numero ? `${nome} - Orçamento ${numero}` : `${nome} - Operação`;
    },

    descricao(registro = {}) {
        const itens = OrcamentoAprovacaoModel.obterItens(registro).slice(0, 4);
        const nomes = itens.map(item => this.texto(item.nome || item.descricao || item.categoria)).filter(Boolean);
        return nomes.length ? nomes.join(", ") : `Execução do orçamento ${registro.numero || registro.id}.`;
    },

    nomeUsuario(usuario = null) {
        return this.texto(usuario?.nome || usuario?.email || usuario?.uid || usuario) || "Sistema";
    },

    chave(valor = "") {
        return this.texto(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .toLowerCase()
            .slice(0, 90);
    },

    texto(valor = "") {
        return String(valor ?? "").trim();
    }
};

if (typeof window !== "undefined") window.ProjetoOperacionalModel = ProjetoOperacionalModel;
if (typeof module !== "undefined" && module.exports) module.exports = { ProjetoOperacionalModel };
