const ProjetoOperacionalService = {
    async abrirDeOrcamento(identificador = "", opcoes = {}) {
        const usuario = opcoes.usuario || this.obterUsuarioAutenticado();
        if (!usuario) return this.erro("Faça login para abrir a operação.");

        let orcamento = opcoes.orcamento || null;
        if (!orcamento) {
            const consulta = await this.repositorioOrcamentos().buscarPorIdOuNumero(identificador);
            if (!consulta.sucesso) return this.erro((consulta.erros || []).join(" ") || "Orçamento não encontrado.");
            orcamento = consulta.registro;
        }
        const registro = OrcamentoAprovacaoModel.normalizarRegistro(orcamento);
        if (registro.status !== "aprovado") return this.erro("A operação só pode ser aberta após a aprovação do orçamento.", registro);

        const resultado = await this.repositorio().abrirDeOrcamento(registro.id, { usuario });
        if (!resultado.sucesso) return resultado;
        return {
            ...resultado,
            mensagem: resultado.idempotente
                ? "A operação já estava aberta e foi reutilizada."
                : resultado.criado
                    ? "Orçamento aprovado e projeto operacional aberto."
                    : "Projeto existente vinculado ao orçamento aprovado."
        };
    },

    async garantirAbertura(identificador = "", opcoes = {}) {
        return this.abrirDeOrcamento(identificador, opcoes);
    },

    async cancelarDeOrcamento(identificador = "", opcoes = {}) {
        const usuario = opcoes.usuario || this.obterUsuarioAutenticado();
        if (!usuario) return this.erro("Faça login para cancelar a operação.");
        const resultado = await this.repositorio().cancelarDeOrcamento(identificador, { ...opcoes, usuario });
        if (!resultado.sucesso) return resultado;
        return {
            ...resultado,
            mensagem: resultado.idempotente
                ? "Orçamento cancelado sem operação ativa para encerrar."
                : "Orçamento e projeto operacional cancelados com histórico preservado."
        };
    },

    obterUsuarioAutenticado() {
        const sessao = typeof RKAuth !== "undefined" && typeof RKAuth.obterSessao === "function" ? RKAuth.obterSessao() : null;
        if (!sessao) return null;
        return OrcamentoAprovacaoModel.normalizarUsuario({
            uid: sessao.uid || sessao.usuario || sessao.email,
            nome: sessao.nomeUsuario || sessao.nome || sessao.usuario,
            email: sessao.email || ""
        });
    },

    repositorio() {
        if (typeof ProjetoOperacionalRepository === "undefined") throw new Error("Repositório operacional indisponível.");
        return ProjetoOperacionalRepository;
    },

    repositorioOrcamentos() {
        if (typeof OrcamentoAprovacaoRepository === "undefined") throw new Error("Repositório de orçamentos indisponível.");
        return OrcamentoAprovacaoRepository;
    },

    erro(mensagem, orcamento = null) {
        return { sucesso: false, erros: [mensagem], projeto: null, orcamento, mensagem: "Não foi possível abrir a operação." };
    }
};

if (typeof window !== "undefined") window.ProjetoOperacionalService = ProjetoOperacionalService;
if (typeof module !== "undefined" && module.exports) module.exports = { ProjetoOperacionalService };
