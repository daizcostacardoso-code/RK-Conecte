const MedicaoOperacionalModel = {
    schemaVersion: 1,
    statusRascunho: "rascunho",
    statusConcluida: "concluida",

    idMedicao(projetoId = "") {
        const chave = this.chave(projetoId);
        if (!chave) throw new Error("Projeto obrigatório para registrar a medição.");
        return `med_${chave}`.slice(0, 120);
    },

    normalizar(entrada = {}) {
        const projetoId = this.texto(entrada.projetoId || entrada.projeto_id || entrada.projeto?.id, 120);
        const id = this.texto(entrada.id || entrada.medicao_id, 120) || (projetoId ? this.idMedicao(projetoId) : "");
        const status = this.normalizarStatus(entrada.status);
        return {
            ...entrada,
            id,
            medicao_id: id,
            projetoId,
            projeto_id: projetoId,
            orcamentoId: this.texto(entrada.orcamentoId || entrada.orcamento_id || entrada.orcamento?.id, 120),
            clienteNome: this.texto(entrada.clienteNome || entrada.cliente?.nome, 120),
            clienteDocumento: this.texto(entrada.clienteDocumento || entrada.cliente?.documento, 24),
            clienteTelefone: this.texto(entrada.clienteTelefone || entrada.cliente?.telefone, 30),
            obraEndereco: this.texto(entrada.obraEndereco || entrada.obra?.endereco, 180),
            responsavel: this.texto(entrada.responsavel, 100),
            dataMedicao: this.data(entrada.dataMedicao),
            observacoesGerais: this.texto(entrada.observacoesGerais || entrada.observacoes, 1000),
            medidas: (Array.isArray(entrada.medidas) ? entrada.medidas : []).map(item => this.normalizarMedida(item)).filter(Boolean),
            status,
            revisao: Math.max(1, Number.parseInt(entrada.revisao, 10) || 1),
            historico: Array.isArray(entrada.historico) ? entrada.historico : [],
            schemaVersion: Math.max(this.schemaVersion, Number.parseInt(entrada.schemaVersion, 10) || 0),
            ativo: entrada.ativo !== false,
            criadoEmISO: this.texto(entrada.criadoEmISO || entrada.criado_em, 40),
            atualizadoEmISO: this.texto(entrada.atualizadoEmISO || entrada.atualizado_em, 40),
            concluidaEm: this.texto(entrada.concluidaEm, 40),
            concluidaPor: entrada.concluidaPor || null
        };
    },

    validar(entrada = {}, opcoes = {}) {
        const medicao = this.normalizar(entrada);
        const erros = [];
        if (!medicao.projetoId) erros.push("Abra a medição a partir de um projeto operacional.");
        if (!medicao.clienteNome) erros.push("Informe o nome do cliente.");
        if (!medicao.medidas.length) erros.push("Adicione pelo menos uma medida.");
        if (opcoes.concluir === true && medicao.medidas.some(item => !(item.altura > 0 && item.largura > 0 && item.quantidade > 0))) {
            erros.push("Revise as dimensões antes de concluir a medição.");
        }
        return { valido: erros.length === 0, erros, medicao };
    },

    criarOuAtualizar(estado = {}, projeto = {}, existente = null, usuario = null, opcoes = {}) {
        const anterior = existente ? this.normalizar(existente) : null;
        const agora = this.agoraISO();
        const projetoId = this.texto(projeto.id || estado.projetoId, 120);
        const status = opcoes.concluir === true ? this.statusConcluida : (anterior?.status || this.statusRascunho);
        const base = this.normalizar({
            ...(anterior || {}),
            ...estado,
            id: this.idMedicao(projetoId),
            projetoId,
            orcamentoId: projeto.orcamento?.id || estado.orcamentoId || anterior?.orcamentoId || "",
            projeto: { id: projetoId, numero: projeto.numero || projeto.codigo || "" },
            orcamento: { id: projeto.orcamento?.id || estado.orcamentoId || "", numero: projeto.orcamento?.numero || "" },
            cliente: {
                id: projeto.cliente?.id || projeto.clienteId || "",
                nome: estado.clienteNome || projeto.cliente?.nome || projeto.clienteNome || "",
                documento: estado.clienteDocumento || projeto.cliente?.documento || "",
                telefone: estado.clienteTelefone || projeto.cliente?.telefone || ""
            },
            obra: { endereco: estado.obraEndereco || projeto.obra?.endereco || projeto.enderecoObra || "" },
            status,
            criadoEmISO: anterior?.criadoEmISO || agora,
            atualizadoEmISO: agora,
            concluidaEm: status === this.statusConcluida ? (anterior?.concluidaEm || agora) : "",
            concluidaPor: status === this.statusConcluida ? (anterior?.concluidaPor || usuario) : null
        });
        const validacao = this.validar(base, opcoes);
        if (!validacao.valido) return { sucesso: false, erros: validacao.erros, medicao: validacao.medicao, alterado: false };

        const mesmoConteudo = anterior && this.assinatura(anterior) === this.assinatura(base);
        if (mesmoConteudo) return { sucesso: true, erros: [], medicao: anterior, alterado: false, idempotente: true };

        const revisao = anterior ? anterior.revisao + 1 : 1;
        const tipoEvento = status === this.statusConcluida && anterior?.status !== this.statusConcluida
            ? "medicao_concluida"
            : "medicao_salva";
        const historico = [...(anterior?.historico || [])];
        if (!historico.some(item => item.tipo === tipoEvento && tipoEvento === "medicao_concluida")) {
            historico.push(this.evento(tipoEvento, status === this.statusConcluida ? "Medição concluída." : "Medição salva no Firestore.", usuario, { revisao }));
        } else if (tipoEvento === "medicao_salva") {
            historico.push(this.evento(tipoEvento, "Medição atualizada no Firestore.", usuario, { revisao }));
        }
        return {
            sucesso: true,
            erros: [],
            alterado: true,
            idempotente: false,
            medicao: this.normalizar({ ...base, revisao, historico })
        };
    },

    atualizarProjeto(projeto = {}, medicao = {}, usuario = null) {
        if (typeof ProjetoModel === "undefined") throw new Error("Modelo de projetos indisponível.");
        const atual = ProjetoModel.normalizar(projeto);
        const concluida = medicao.status === this.statusConcluida;
        const operacionalStatus = concluida ? "medicao_concluida" : "medicao_em_andamento";
        const tipoEvento = concluida ? "medicao_concluida" : "medicao_iniciada";
        let atualizado = ProjetoModel.atualizar(atual, {
            etapaAtual: "medicao",
            etapa: "medicao",
            operacional: {
                ...atual.operacional,
                status: operacionalStatus,
                medicaoId: medicao.id,
                medicaoStatus: medicao.status,
                responsavel: medicao.responsavel || atual.operacional?.responsavel || ""
            }
        }, this.nomeUsuario(usuario));
        const jaRegistrado = (atual.historico || []).some(item => item.tipo === tipoEvento && this.texto(item.dados?.medicaoId, 120) === medicao.id);
        if (!jaRegistrado) {
            atualizado = ProjetoModel.adicionarEvento(
                atualizado,
                tipoEvento,
                concluida ? "Medição concluída e liberada para a ordem de serviço." : "Medição iniciada no projeto.",
                this.nomeUsuario(usuario),
                { medicaoId: medicao.id, revisao: medicao.revisao }
            );
        }
        return ProjetoModel.normalizar(atualizado);
    },

    normalizarMedida(item = {}) {
        const quantidade = Number(item.quantidade);
        const altura = Number(item.altura);
        const largura = Number(item.largura);
        if (!Number.isInteger(quantidade) || quantidade < 1 || !(altura > 0) || !(largura > 0)) return null;
        return {
            id: this.texto(item.id, 120) || `medida-${this.chave(`${item.tipo}-${altura}-${largura}`)}`,
            quantidade,
            tipo: this.texto(item.tipo, 40),
            descricao: this.texto(item.descricao, 160),
            altura,
            largura,
            observacao: this.texto(item.observacao, 240)
        };
    },

    assinatura(medicao = {}) {
        const normalizada = this.normalizar(medicao);
        return JSON.stringify({
            clienteNome: normalizada.clienteNome,
            clienteDocumento: normalizada.clienteDocumento,
            clienteTelefone: normalizada.clienteTelefone,
            obraEndereco: normalizada.obraEndereco,
            responsavel: normalizada.responsavel,
            dataMedicao: normalizada.dataMedicao,
            observacoesGerais: normalizada.observacoesGerais,
            medidas: normalizada.medidas,
            status: normalizada.status
        });
    },

    evento(tipo, descricao, usuario = null, dados = {}) {
        return { tipo, descricao, data: this.agoraISO(), usuario: this.nomeUsuario(usuario), dados };
    },
    normalizarStatus(status = "") { return this.chave(status) === "concluida" ? this.statusConcluida : this.statusRascunho; },
    nomeUsuario(usuario = null) { return this.texto(usuario?.nome || usuario?.email || usuario?.uid || usuario || "Sistema", 120); },
    data(valor = "") { return /^\d{4}-\d{2}-\d{2}$/.test(String(valor || "")) ? String(valor) : new Date().toISOString().slice(0, 10); },
    agoraISO() { return new Date().toISOString(); },
    texto(valor, limite = 1000) { return String(valor ?? "").trim().slice(0, limite); },
    chave(valor = "") { return this.texto(valor, 160).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, ""); }
};

if (typeof window !== "undefined") window.MedicaoOperacionalModel = MedicaoOperacionalModel;
if (typeof module !== "undefined" && module.exports) module.exports = { MedicaoOperacionalModel };
