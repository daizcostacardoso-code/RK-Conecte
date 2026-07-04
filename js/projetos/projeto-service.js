const ProjetoService = {
    criarManual(dados = {}, usuario = "Sistema") {
        return ProjetoModel.criar({
            ...dados,
            origem: dados.origem || "manual",
            usuario
        });
    },

    criarDeSolicitacao(solicitacao = {}, usuario = "Sistema") {
        return ProjetoModel.criar({
            origem: "site",
            status: typeof STATUS_PROJETO !== "undefined" ? STATUS_PROJETO.RASCUNHO : "rascunho",
            titulo: solicitacao.titulo || solicitacao.servico || "",
            cliente: {
                nome: solicitacao.nome || solicitacao.cliente?.nome || "",
                telefone: solicitacao.telefone || solicitacao.cliente?.telefone || "",
                email: solicitacao.email || solicitacao.cliente?.email || "",
                endereco: solicitacao.endereco || solicitacao.cliente?.endereco || ""
            },
            obra: {
                endereco: solicitacao.enderecoObra || solicitacao.endereco || "",
                observacoes: solicitacao.observacoes || ""
            },
            comercial: {
                canal: "site",
                observacoes: solicitacao.observacoes || ""
            },
            tags: ["site"],
            usuario
        });
    },

    async salvar(projeto) {
        return ProjetoStorage.salvar(projeto);
    },

    async listar() {
        return ProjetoStorage.listar();
    },

    async carregar(id) {
        return ProjetoStorage.carregar(id);
    },

    async alterarStatus(projeto, status, usuario = "Sistema", extras = {}) {
        const atualizado = ProjetoModel.atualizar(projeto, {
            ...extras,
            status
        }, usuario);

        return ProjetoStorage.salvar(atualizado);
    },

    async registrarContato(projeto, contato = {}, usuario = "Sistema") {
        const atualizado = ProjetoModel.registrarContato(projeto, contato, usuario);
        return ProjetoStorage.salvar(atualizado);
    },

    async vincularOrcamento(projeto, orcamento, usuario = "Sistema") {
        const atualizado = ProjetoModel.vincularOrcamento(projeto, orcamento, usuario);
        return ProjetoStorage.salvar(atualizado);
    },

    filtrar(projetos = [], filtros = {}) {
        const busca = String(filtros.busca || "").trim().toLowerCase();

        return projetos.filter(projeto => {
            const statusOk = !filtros.status || projeto.status === filtros.status;
            const responsavelOk = !filtros.responsavel || projeto.comercial?.responsavel === filtros.responsavel;
            const buscaOk = !busca || [
                projeto.codigo,
                projeto.numero,
                projeto.titulo,
                projeto.cliente?.nome,
                projeto.cliente?.telefone,
                projeto.obra?.endereco
            ].some(valor => String(valor || "").toLowerCase().includes(busca));

            return statusOk && responsavelOk && buscaOk;
        });
    }
};
