const OrdemServicoOperacionalModel = {
    schemaVersion: 1,
    status: ["rascunho", "em_producao", "em_instalacao", "concluido", "cancelado"],

    idOrdem(projetoId = "") {
        const chave = this.chave(projetoId);
        if (!chave) throw new Error("Projeto obrigatório para gerar a ordem de serviço.");
        return `os_${chave}`.slice(0, 120);
    },

    estadoDoContexto(projeto = {}, medicao = {}, existente = null) {
        if (existente) return this.normalizar(existente);
        const projetoId = this.texto(projeto.id, 120);
        const numeroProjeto = this.texto(projeto.numero || projeto.codigo || projetoId, 80);
        const cliente = projeto.cliente || {};
        const obra = projeto.obra || {};
        return this.normalizar({
            id: this.idOrdem(projetoId),
            numeroNota: `OS-${numeroProjeto}`.slice(0, 30),
            projetoId,
            medicaoId: medicao.id || projeto.operacional?.medicaoId || "",
            orcamentoId: projeto.orcamento?.id || medicao.orcamentoId || "",
            origem: "projeto_operacional",
            status: "rascunho",
            dataEmissao: this.dataHoje(),
            dataConclusao: "",
            clienteNome: cliente.nome || projeto.clienteNome || medicao.clienteNome || "",
            clienteDocumento: cliente.documento || medicao.clienteDocumento || "",
            clienteTelefone: cliente.telefone || medicao.clienteTelefone || "",
            clienteEndereco: cliente.endereco || "",
            clienteEmail: cliente.email || "",
            localServico: obra.endereco || projeto.enderecoObra || medicao.obraEndereco || "",
            referencia: projeto.orcamento?.numero || numeroProjeto,
            observacoes: medicao.observacoesGerais || obra.observacoes || "",
            servicos: this.servicosDaMedicao(medicao)
        });
    },

    normalizar(entrada = {}) {
        const projetoId = this.texto(entrada.projetoId || entrada.projeto_id || entrada.projeto?.id, 120);
        const id = this.texto(entrada.id || entrada.nota_id, 120) || (projetoId ? this.idOrdem(projetoId) : "");
        const base = typeof NotaServicoModel !== "undefined" ? NotaServicoModel.normalizar(entrada) : { ...entrada };
        return {
            ...base,
            id,
            nota_id: id,
            projetoId,
            projeto_id: projetoId,
            medicaoId: this.texto(entrada.medicaoId || entrada.medicao_id, 120),
            medicao_id: this.texto(entrada.medicaoId || entrada.medicao_id, 120),
            orcamentoId: this.texto(entrada.orcamentoId || entrada.orcamento_id, 120),
            origem: entrada.origem || (projetoId ? "projeto_operacional" : "avulsa"),
            status: this.normalizarStatus(entrada.status),
            historicoOperacional: Array.isArray(entrada.historicoOperacional) ? entrada.historicoOperacional : [],
            schemaVersion: Math.max(this.schemaVersion, Number.parseInt(entrada.schemaVersion, 10) || 0),
            ativo: entrada.ativo !== false,
            criadoEmISO: this.texto(entrada.criadoEmISO || entrada.criado_em, 40),
            atualizadoEmISO: this.texto(entrada.atualizadoEmISO || entrada.atualizado_em || entrada.atualizadoEm, 40)
        };
    },

    criarOuAtualizar(nota = {}, projeto = {}, medicao = {}, existente = null, usuario = null, opcoes = {}) {
        const anterior = existente ? this.normalizar(existente) : null;
        const estado = this.estadoDoContexto(projeto, medicao, anterior);
        const status = this.normalizarStatus(opcoes.status || nota.status || anterior?.status || "rascunho");
        const agora = this.agoraISO();
        const base = this.normalizar({
            ...estado,
            ...nota,
            id: this.idOrdem(projeto.id || nota.projetoId),
            projetoId: projeto.id || nota.projetoId,
            medicaoId: medicao.id || nota.medicaoId,
            orcamentoId: projeto.orcamento?.id || nota.orcamentoId || medicao.orcamentoId || "",
            projeto: { id: projeto.id, numero: projeto.numero || projeto.codigo || "" },
            medicao: { id: medicao.id, revisao: medicao.revisao || 1, status: medicao.status },
            orcamento: { id: projeto.orcamento?.id || "", numero: projeto.orcamento?.numero || "" },
            origem: "projeto_operacional",
            status,
            emitidaEm: status !== "rascunho" ? (anterior?.emitidaEm || nota.emitidaEm || agora) : (nota.emitidaEm || ""),
            dataConclusao: status === "concluido" ? (nota.dataConclusao || this.dataHoje()) : (nota.dataConclusao || ""),
            criadoEmISO: anterior?.criadoEmISO || agora,
            atualizadoEmISO: agora,
            atualizadoEm: agora
        });
        const erros = this.validar(base, medicao);
        const transicao = this.validarTransicao(anterior?.status || "", status);
        if (!transicao.valida) erros.push(`Não é permitido alterar a ordem de serviço de ${this.rotuloStatus(anterior.status)} para ${this.rotuloStatus(status)}.`);
        if (erros.length) return { sucesso: false, erros, ordem: base, alterado: false };
        if (anterior && this.assinatura(anterior) === this.assinatura(base)) {
            return { sucesso: true, erros: [], ordem: anterior, alterado: false, idempotente: true };
        }
        const historico = [...(anterior?.historicoOperacional || [])];
        const tipo = this.eventoPorStatus(status);
        const jaRegistrado = historico.some(item => item.tipo === tipo && item.status === status);
        if (!jaRegistrado) historico.push(this.evento(tipo, status, usuario));
        return {
            sucesso: true,
            erros: [],
            alterado: true,
            idempotente: false,
            ordem: this.normalizar({ ...base, historicoOperacional: historico })
        };
    },

    atualizarProjeto(projeto = {}, ordem = {}, usuario = null) {
        if (typeof ProjetoModel === "undefined") throw new Error("Modelo de projetos indisponível.");
        const atual = ProjetoModel.normalizar(projeto);
        const mapa = {
            rascunho: { statusProjeto: atual.status, etapa: "medicao", operacional: "ordem_em_preparacao", evento: "ordem_servico_preparada" },
            em_producao: { statusProjeto: "em_producao", etapa: "producao", operacional: "em_producao", evento: "producao_iniciada" },
            em_instalacao: { statusProjeto: "em_instalacao", etapa: "instalacao", operacional: "em_instalacao", evento: "instalacao_iniciada" },
            concluido: { statusProjeto: "finalizado", etapa: "finalizado", operacional: "concluido", evento: "operacao_concluida" },
            cancelado: { statusProjeto: "cancelado", etapa: "finalizado", operacional: "cancelado", evento: "ordem_servico_cancelada" }
        };
        const destino = mapa[ordem.status] || mapa.rascunho;
        let atualizado = ProjetoModel.atualizar(atual, {
            status: destino.statusProjeto,
            etapaAtual: destino.etapa,
            etapa: destino.etapa,
            ativo: ordem.status !== "cancelado",
            operacional: {
                ...atual.operacional,
                status: destino.operacional,
                medicaoId: ordem.medicaoId || atual.operacional?.medicaoId || "",
                medicaoStatus: "concluida",
                notaServicoId: ordem.id,
                ordemServicoStatus: ordem.status
            },
            datas: ordem.status === "concluido" ? { ...atual.datas, conclusao: this.agoraISO() } : atual.datas
        }, this.nomeUsuario(usuario));
        const jaRegistrado = (atual.historico || []).some(item => item.tipo === destino.evento && this.texto(item.dados?.ordemServicoId, 120) === ordem.id);
        if (!jaRegistrado) {
            atualizado = ProjetoModel.adicionarEvento(
                atualizado,
                destino.evento,
                `Ordem de serviço ${ordem.numeroNota || ordem.id}: ${this.rotuloStatus(ordem.status)}.`,
                this.nomeUsuario(usuario),
                { ordemServicoId: ordem.id, medicaoId: ordem.medicaoId, status: ordem.status }
            );
        }
        return ProjetoModel.normalizar(atualizado);
    },

    validar(ordem = {}, medicao = {}) {
        const erros = [];
        if (!ordem.projetoId) erros.push("Projeto obrigatório para a ordem de serviço.");
        if (!ordem.medicaoId) erros.push("Medição concluída obrigatória para a ordem de serviço.");
        if (medicao.status !== "concluida") erros.push("Conclua a medição antes de emitir a ordem de serviço.");
        if (!this.texto(ordem.clienteNome, 120)) erros.push("Informe o cliente da ordem de serviço.");
        if (!Array.isArray(ordem.servicos) || !ordem.servicos.length) erros.push("Adicione pelo menos um serviço.");
        return erros;
    },

    servicosDaMedicao(medicao = {}) {
        return (Array.isArray(medicao.medidas) ? medicao.medidas : []).map(item => ({
            id: `srv_${this.chave(item.id || `${item.tipo}-${item.altura}-${item.largura}`)}`,
            descricao: [item.tipo, item.descricao, `${item.altura} x ${item.largura} cm`].filter(Boolean).join(" - "),
            quantidade: Math.max(1, Number(item.quantidade) || 1),
            unidade: "un.",
            valorUnitario: 0
        }));
    },

    assinatura(ordem = {}) {
        const normalizada = this.normalizar(ordem);
        return JSON.stringify({
            numeroNota: normalizada.numeroNota,
            status: normalizada.status,
            responsavel: normalizada.responsavel,
            localServico: normalizada.localServico,
            clienteNome: normalizada.clienteNome,
            clienteDocumento: normalizada.clienteDocumento,
            clienteTelefone: normalizada.clienteTelefone,
            clienteEndereco: normalizada.clienteEndereco,
            clienteEmail: normalizada.clienteEmail,
            servicos: normalizada.servicos,
            desconto: normalizada.desconto,
            formaPagamento: normalizada.formaPagamento,
            condicaoPagamento: normalizada.condicaoPagamento,
            garantia: normalizada.garantia,
            referencia: normalizada.referencia,
            observacoes: normalizada.observacoes
        });
    },

    normalizarStatus(status = "") {
        const chave = this.chave(status);
        const aliases = { concluido: "concluido", concluida: "concluido", em_andamento: "em_producao", pendente: "rascunho", producao: "em_producao", instalacao: "em_instalacao" };
        const normalizado = aliases[chave] || chave || "rascunho";
        return this.status.includes(normalizado) ? normalizado : "rascunho";
    },
    validarTransicao(statusAtual = "", statusDestino = "") {
        if (!statusAtual || statusAtual === statusDestino) return { valida: true };
        const transicoes = {
            rascunho: ["em_producao", "cancelado"],
            em_producao: ["em_instalacao", "cancelado"],
            em_instalacao: ["concluido", "cancelado"],
            concluido: [],
            cancelado: []
        };
        return { valida: (transicoes[this.normalizarStatus(statusAtual)] || []).includes(this.normalizarStatus(statusDestino)) };
    },
    rotuloStatus(status = "") { return { rascunho: "Rascunho", em_producao: "Em produção", em_instalacao: "Em instalação", concluido: "Concluído", cancelado: "Cancelado" }[this.normalizarStatus(status)] || "Rascunho"; },
    eventoPorStatus(status = "") { return { rascunho: "ordem_servico_salva", em_producao: "producao_iniciada", em_instalacao: "instalacao_iniciada", concluido: "ordem_servico_concluida", cancelado: "ordem_servico_cancelada" }[status] || "ordem_servico_salva"; },
    evento(tipo, status, usuario) { return { tipo, status, descricao: this.rotuloStatus(status), data: this.agoraISO(), usuario: this.nomeUsuario(usuario) }; },
    nomeUsuario(usuario = null) { return this.texto(usuario?.nome || usuario?.email || usuario?.uid || usuario || "Sistema", 120); },
    dataHoje() { return new Date().toISOString().slice(0, 10); },
    agoraISO() { return new Date().toISOString(); },
    texto(valor, limite = 1000) { return String(valor ?? "").trim().slice(0, limite); },
    chave(valor = "") { return this.texto(valor, 160).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, ""); }
};

if (typeof window !== "undefined") window.OrdemServicoOperacionalModel = OrdemServicoOperacionalModel;
if (typeof module !== "undefined" && module.exports) module.exports = { OrdemServicoOperacionalModel };
