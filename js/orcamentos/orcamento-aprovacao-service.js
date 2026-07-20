const OrcamentoAprovacaoService = {
    async aprovar(identificador, dados = {}) {
        const resultado = await this.executarAcao(identificador, "aprovar", dados);
        if (!resultado.sucesso) return resultado;

        try {
            const abertura = await this.operacaoService().garantirAbertura(resultado.registro.id, {
                orcamento: resultado.registro,
                usuario: this.obterUsuarioAutenticado()
            });
            if (!abertura.sucesso) {
                return {
                    ...resultado,
                    operacaoPendente: true,
                    errosOperacao: abertura.erros || [],
                    mensagem: "Orçamento aprovado. A abertura operacional ficou pendente e pode ser tentada novamente nos detalhes."
                };
            }
            return {
                ...resultado,
                registro: abertura.orcamento,
                projeto: abertura.projeto,
                operacaoPendente: false,
                operacaoIdempotente: abertura.idempotente,
                mensagem: abertura.mensagem
            };
        } catch (erro) {
            return {
                ...resultado,
                operacaoPendente: true,
                errosOperacao: [erro.message || "Não foi possível abrir a operação."],
                mensagem: "Orçamento aprovado. A abertura operacional ficou pendente e pode ser tentada novamente nos detalhes."
            };
        }
    },
    async recusar(identificador, dados = {}) { return this.executarAcao(identificador, "recusar", dados); },
    async cancelar(identificador, dados = {}) {
        const resultado = await this.executarAcao(identificador, "cancelar", dados);
        if (!resultado.sucesso) return resultado;
        const projetoId = resultado.registro.operacao?.projetoId || resultado.registro.vinculos?.projetoId;
        if (!projetoId) return resultado;
        try {
            const cancelamento = await this.operacaoService().cancelarDeOrcamento(resultado.registro.id, {
                usuario: this.obterUsuarioAutenticado(),
                observacao: dados.observacao
            });
            if (!cancelamento.sucesso) {
                return {
                    ...resultado,
                    operacaoPendente: true,
                    errosOperacao: cancelamento.erros || [],
                    mensagem: "Orçamento cancelado. O encerramento do projeto operacional ficou pendente."
                };
            }
            return { ...resultado, projeto: cancelamento.projeto, operacaoPendente: false, mensagem: cancelamento.mensagem };
        } catch (erro) {
            return {
                ...resultado,
                operacaoPendente: true,
                errosOperacao: [erro.message || "Não foi possível cancelar a operação."],
                mensagem: "Orçamento cancelado. O encerramento do projeto operacional ficou pendente."
            };
        }
    },
    async enviar(identificador, dados = {}) { return this.executarAcao(identificador, "enviar", dados); },
    async emitir(identificador, dados = {}) { return this.executarAcao(identificador, "emitir", dados); },

    async executarAcao(identificador, acao, dados = {}) {
        const usuario = this.obterUsuarioAutenticado();
        if (!usuario) return this.respostaErro(["Faça login para alterar a aprovação do orçamento."]);

        const consulta = await this.repositorio().buscarPorIdOuNumero(identificador);
        if (!consulta.sucesso) return this.respostaErro(consulta.erros);

        return this.repositorio().executarTransacao(consulta.registro.id, atual => {
            const chave = this.validator().chave(acao);
            if (chave === "aprovar" && atual.status === "aprovado") {
                return {
                    sucesso: true,
                    registro: atual,
                    erros: [],
                    idempotente: true,
                    escrever: false,
                    mensagem: "Este orçamento já está aprovado. Nenhum histórico adicional foi criado."
                };
            }

            const validacao = this.validator().validarAcao(atual, chave, dados);
            if (!validacao.valido) return this.respostaErro(validacao.erros, atual);

            const registro = this.aplicarAcao(atual, validacao, dados, usuario);
            return {
                sucesso: true,
                registro,
                erros: [],
                idempotente: false,
                mensagem: this.mensagemDaAcao(chave, registro)
            };
        });
    },

    async registrarEmissao(registro = {}, opcoes = {}) {
        const resultado = await this.repositorio().registrarEmissao(registro, {
            usuario: opcoes.usuario || this.obterUsuarioAutenticado(),
            origem: opcoes.origem || "ORCAMENTO_INTELIGENTE"
        });
        if (!resultado.sucesso) return this.respostaErro(resultado.erros);
        return {
            ...resultado,
            mensagem: resultado.novaVersao ? "Nova versão do orçamento emitida." : "Orçamento emitido e salvo."
        };
    },

    async abrirOperacao(identificador, dados = {}) {
        const usuario = this.obterUsuarioAutenticado();
        if (!usuario) return this.respostaErro(["Faça login para abrir a operação."]);
        try {
            const resultado = await this.operacaoService().garantirAbertura(identificador, { ...dados, usuario });
            if (!resultado.sucesso) return this.respostaErro(resultado.erros, resultado.orcamento);
            return {
                sucesso: true,
                registro: resultado.orcamento,
                projeto: resultado.projeto,
                erros: [],
                idempotente: resultado.idempotente,
                mensagem: resultado.mensagem
            };
        } catch (erro) {
            return this.respostaErro([erro.message || "Não foi possível abrir a operação."]);
        }
    },

    acoesDisponiveis(registro = {}) {
        return this.validator().acoesDisponiveis(registro);
    },

    aplicarAcao(atual = {}, validacao = {}, dados = {}, usuario = null) {
        const modelo = this.modelo();
        const agora = modelo.agoraISO();
        const acao = validacao.acao;
        const registro = modelo.normalizarRegistro(atual);
        const aprovacao = { ...registro.aprovacao };

        if (acao === "aprovar") {
            aprovacao.status = "aprovado";
            aprovacao.aprovadoEm = agora;
            aprovacao.aprovadoPor = usuario;
            aprovacao.observacao = modelo.texto(dados.observacao);
            aprovacao.valorAprovadoCentavos = modelo.valorEmCentavos(modelo.obterTotal(registro));
        }
        if (acao === "recusar") {
            aprovacao.status = "recusado";
            aprovacao.recusadoEm = agora;
            aprovacao.recusadoPor = usuario;
            aprovacao.motivoRecusa = modelo.texto(dados.motivoRecusa);
            aprovacao.observacao = modelo.texto(dados.observacao);
        }
        if (acao === "cancelar") {
            aprovacao.status = "cancelado";
            aprovacao.canceladoEm = agora;
            aprovacao.canceladoPor = usuario;
            aprovacao.observacao = modelo.texto(dados.observacao);
        }
        if (["emitir", "enviar"].includes(acao)) {
            aprovacao.status = "pendente";
            if (modelo.texto(dados.observacao)) aprovacao.observacao = modelo.texto(dados.observacao);
        }

        const observacao = acao === "recusar" ? aprovacao.motivoRecusa : modelo.texto(dados.observacao);
        const operacao = acao === "cancelar" && registro.operacao?.projetoId
            ? {
                ...registro.operacao,
                status: "cancelada",
                canceladaEm: agora,
                canceladaPor: usuario
            }
            : registro.operacao;
        return {
            ...registro,
            status: validacao.destino,
            aprovacao,
            operacao,
            historicoStatus: [
                ...registro.historicoStatus,
                modelo.criarHistorico({
                    statusAnterior: registro.status,
                    statusAtual: validacao.destino,
                    acao: this.acaoHistorico(acao),
                    observacao,
                    realizadoEm: agora,
                    realizadoPor: usuario,
                    origem: "interface_interna"
                })
            ],
            atualizadoEmISO: agora
        };
    },

    obterUsuarioAutenticado() {
        const sessao = typeof RKAuth !== "undefined" && typeof RKAuth.obterSessao === "function" ? RKAuth.obterSessao() : null;
        if (!sessao) return null;
        const modelo = this.modelo();
        const usuario = modelo.normalizarUsuario({
            uid: sessao.uid || sessao.usuario || sessao.email,
            nome: sessao.nomeUsuario || sessao.nome || sessao.usuario,
            email: sessao.email || ""
        });
        return usuario?.uid ? usuario : null;
    },

    acaoHistorico(acao = "") {
        return {
            emitir: "orcamento_emitido",
            enviar: "orcamento_enviado",
            aprovar: "orcamento_aprovado",
            recusar: "orcamento_recusado",
            cancelar: "orcamento_cancelado"
        }[acao] || `orcamento_${acao}`;
    },

    mensagemDaAcao(acao, registro) {
        const mensagens = {
            emitir: "Orçamento marcado como emitido.",
            enviar: "Orçamento marcado como enviado.",
            aprovar: `Orçamento aprovado em ${this.formatarCentavos(registro.aprovacao.valorAprovadoCentavos)}.`,
            recusar: "Orçamento recusado e registrado no histórico.",
            cancelar: "Orçamento cancelado. Novas aprovações foram bloqueadas."
        };
        return mensagens[acao] || "Orçamento atualizado.";
    },

    formatarCentavos(centavos = 0) {
        return (Number(centavos || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    },

    respostaErro(erros = [], registro = null) {
        return { sucesso: false, registro, erros: Array.isArray(erros) ? erros : [String(erros)], mensagem: "Não foi possível atualizar o orçamento." };
    },

    modelo() {
        if (typeof OrcamentoAprovacaoModel === "undefined") throw new Error("Modelo de aprovação de orçamento indisponível.");
        return OrcamentoAprovacaoModel;
    },

    validator() {
        if (typeof OrcamentoAprovacaoValidator === "undefined") throw new Error("Validador de aprovação de orçamento indisponível.");
        return OrcamentoAprovacaoValidator;
    },

    repositorio() {
        if (typeof OrcamentoAprovacaoRepository === "undefined") throw new Error("Repositório de aprovação de orçamento indisponível.");
        return OrcamentoAprovacaoRepository;
    },

    operacaoService() {
        if (typeof ProjetoOperacionalService === "undefined") throw new Error("Serviço de abertura operacional indisponível.");
        return ProjetoOperacionalService;
    }
};

if (typeof window !== "undefined") window.OrcamentoAprovacaoService = OrcamentoAprovacaoService;
if (typeof module !== "undefined" && module.exports) module.exports = { OrcamentoAprovacaoService };
