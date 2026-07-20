const Funcionario = {
    chaveSolicitacoes: Config.storage.solicitacoesSite,
    chaveConfig: Config.storage.configuracoesSistema || "vidracaria_configuracoes_sistema",
    chaveAnotacoes: "vidracaria_anotacoes_funcionario",
    chaveLembretes: Config.storage.lembretes || "vidracaria_lembretes",
    solicitacoes: [],
    caixa: [],
    lembretes: [],
    calcExpressao: "",
    _timerLembretes: null,
    _ultimoAvisoLembretes: 0,

    estadoOrcamentoVazio() {
        return {
            cliente: { nome: "", telefone: "", endereco: "", email: "" },
            itens: [],
            desconto: { tipo: "valor", valor: 0 },
            observacoes: "",
            rascunhoItem: null,
            atualizadoEm: Util.agora()
        };
    },

    limparOrcamentoAtual() {
        Storage.remover(Config.storage.orcamentoAtual);
        Storage.salvar(Config.storage.orcamentoAtual, this.estadoOrcamentoVazio());
    },

    async iniciar() {
        const sessao = window.RKAuth
            ? await RKAuth.aguardarAutenticacao()
            : this.verificarSessao();
        if (!sessao) return;
        this.carregarPerfilUsuario();
        this.prepararAbas();
        this.carregarConfiguracoesNaTela();
        this.carregarFerramentas();
        await this.carregarSolicitacoes();
        await this.carregarCaixa();
        this.atualizarIndicadores();
        this.listarSolicitacoes();
        this.mostrarOrcamentoAtual();
        this.atualizarCaixa();
        this.registrarEventos();
        this.atualizarAlertaSolicitacoes();
        this.iniciarTempoRealSolicitacoes();
        this.carregarTemperaturaAtual();
        this.iniciarAvisosDeLembretes();
    },

    async carregarSolicitacoes() {
        let locais = Storage.carregar(this.chaveSolicitacoes, []);
        if (!Array.isArray(locais)) locais = [];

        try {
            if (typeof db !== "undefined" && db) {
                const snap = await db.collection("solicitacoes_site")
                    .orderBy("criadoEmISO", "desc")
                    .limit(50)
                    .get();

                const nuvem = [];
                snap.forEach(doc => {
                    nuvem.push({ idFirestore: doc.id, ...doc.data() });
                });

                // Mescla nuvem + local. Isso evita perder pedidos salvos em teste local
                // quando o Firestore está vazio ou indisponível para gravação.
                const mapa = new Map();
                [...locais, ...nuvem].forEach((pedido, indice) => {
                    const chave = pedido.idFirestore || pedido.criadoEmISO || pedido.idLocal || `local_${indice}`;
                    mapa.set(chave, pedido);
                });
                this.solicitacoes = Array.from(mapa.values()).sort((a, b) => {
                    return String(b.criadoEmISO || '').localeCompare(String(a.criadoEmISO || ''));
                });
                Storage.salvar(this.chaveSolicitacoes, this.solicitacoes);
                return;
            }
        } catch (erro) {
            console.error("Erro ao carregar solicitações da nuvem:", erro);
        }

        this.solicitacoes = locais;
    },


    async carregarCaixa() {
        CaixaService.configurar();
        this.caixa = await CaixaService.listar();
    },

    normalizarListaCaixa(lista) {
        if (window.CaixaService) {
            return CaixaService.normalizarLista(lista);
        }

        return (Array.isArray(lista) ? lista : [])
            .map((mov, indice) => this.normalizarMovimentoCaixa(mov, indice))
            .filter(Boolean);
    },

    normalizarMovimentoCaixa(mov = {}, indice = 0) {
        if (window.CaixaService) {
            return CaixaService.normalizarMovimento(mov, indice);
        }

        const data = this.normalizarDataCaixa(mov.data || mov.data_movimento);
        const referencia = this.obterReferenciasDataCaixa(data);
        const categoria = mov.categoria || (mov.tipo === "entrada" ? "entrada" : "despesa");
        const tipo = mov.tipo || (categoria === "entrada" ? "entrada" : "saida");

        return {
            caixaId: String(mov.caixaId ?? mov.caixa_id ?? ""),
            descricao: mov.descricao || "",
            categoria,
            tipo,
            valor: Util.numero(mov.valor),
            data,
            formaPagamento: mov.formaPagamento || "Não informado",
            origem: mov.origem || "Manual",
            observacao: mov.observacao || "",
            responsavel: mov.responsavel || "",
            status: this.normalizarStatusCaixa(mov.status),
            mesReferencia: mov.mesReferencia || referencia.mesReferencia,
            anoReferencia: Number(mov.anoReferencia || referencia.anoReferencia) || referencia.anoReferencia,
            diaReferencia: Number(mov.diaReferencia || referencia.diaReferencia) || referencia.diaReferencia,
            criadoEm: mov.criadoEm ?? mov.criado_em ?? "",
            atualizadoEm: mov.atualizadoEm ?? mov.atualizado_em ?? ""
        };
    },

    normalizarDataCaixa(data, fallbackISO = "") {
        if (window.CaixaModel) {
            return CaixaModel.normalizarData(data, fallbackISO);
        }

        const texto = String(data || "").slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

        const fallback = String(fallbackISO || "").slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(fallback)) return fallback;

        return new Date().toISOString().slice(0, 10);
    },

    obterReferenciasDataCaixa(data) {
        if (window.CaixaModel) {
            return CaixaModel.obterReferencia(data);
        }

        const normalizada = this.normalizarDataCaixa(data);
        const [ano, mes, dia] = normalizada.split("-");
        return {
            mesReferencia: `${ano}-${mes}`,
            anoReferencia: Number(ano),
            diaReferencia: Number(dia)
        };
    },

    normalizarStatusCaixa(status) {
        if (window.CaixaModel) {
            return CaixaModel.normalizarStatus(status);
        }

        const valor = String(status || "confirmado").toLowerCase();
        if (valor.includes("pend")) return "pendente";
        if (valor.includes("cancel")) return "cancelado";
        return "confirmado";
    },

    ordenarMovimentosCaixa(lista) {
        if (window.CaixaService) {
            return CaixaService.ordenar(lista);
        }

        return (Array.isArray(lista) ? lista : []).sort((a, b) => {
            const dataA = `${a.data || ""} ${a.criadoEm || ""}`;
            const dataB = `${b.data || ""} ${b.criadoEm || ""}`;
            return String(dataB).localeCompare(String(dataA));
        });
    },

    atualizarIndicadores() {
        const proximoNumero = Storage.carregar(Config.storage.numeroOrcamento, 1);
        const feitos = Math.max(0, Util.numero(proximoNumero) - 1);
        const solicitacoes = this.obterSolicitacoes();
        const orcamentoAtual = Storage.carregar(Config.storage.orcamentoAtual, null);
        const temOrcamentoAtual = orcamentoAtual && Array.isArray(orcamentoAtual.itens) && orcamentoAtual.itens.length > 0;
        const totalAtual = this.calcularTotalOrcamentoAtual(orcamentoAtual);

        this.texto("qtdOrcamentosFeitos", feitos);
        this.texto("qtdSolicitacoesSite", solicitacoes.length);
        this.atualizarAlertaSolicitacoes();
        this.texto("qtdEmAndamento", temOrcamentoAtual ? 1 : 0);
        this.texto("valorOrcamentoAtual", Util.moeda(totalAtual));

        const resumoCaixa = this.calcularResumoCaixa();
        this.texto("caixaLucroEstimado", Util.moeda(resumoCaixa.saldo));
    },

    listarSolicitacoes() {
        const area = Util.$("listaSolicitacoes");
        if (!area) return;

        const solicitacoes = this.obterSolicitacoes();
        area.innerHTML = "";

        this.atualizarAlertaSolicitacoes();

        if (solicitacoes.length === 0) {
            area.innerHTML = `
                <div class="estado-vazio">
                    <strong>Nenhuma solicitação recebida ainda.</strong>
                    <p>Quando o cliente montar um orçamento no site, o pedido aparecerá aqui.</p>
                </div>
            `;
            return;
        }

        solicitacoes.forEach((pedido, indice) => {
            const cliente = pedido.cliente || pedido;
            const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
            const total = pedido.subtotal ?? itens.reduce((soma, item) => soma + Util.numero(item.total), 0);

            const card = document.createElement("div");
            card.className = "solicitacao-card";

            card.innerHTML = `
                <div>
                    <strong>${cliente.nome || pedido.nome || "Cliente sem nome"}</strong>
                    <span>${pedido.data || ""}</span>
                </div>
                <p><b>Status:</b> ${pedido.status || "Solicitado"}</p>
                <p><b>Telefone:</b> ${cliente.telefone || pedido.telefone || "Não informado"}</p>
                <p><b>E-mail:</b> ${cliente.email || pedido.email || "Não informado"}</p>
                <p><b>Endereço:</b> ${cliente.endereco || pedido.endereco || "Não informado"}</p>
                <p><b>Itens:</b> ${itens.length || 1}</p>
                <p><b>Total estimado:</b> <strong>${Util.moeda(total || 0)}</strong></p>
                <div class="resumo-itens-solicitacao">
                    ${this.htmlItensSolicitacao(pedido)}
                </div>
                <p><b>Observações:</b> ${pedido.observacoes || pedido.descricao || pedido.mensagem || "Sem observações"}</p>
                <div class="acoes-card-solicitacao">
                    <button type="button" class="btn-pequeno" onclick="Funcionario.criarOrcamentoDaSolicitacao(${indice})">
                        Abrir orçamento
                    </button>
                    <button type="button" class="btn-pequeno btn-cinza" onclick="Funcionario.marcarComoAtendida(${indice})">
                        Marcar atendida
                    </button>
                </div>
            `;

            area.appendChild(card);
        });
    },

    htmlItensSolicitacao(pedido) {
        const itens = Array.isArray(pedido.itens) ? pedido.itens : [];

        if (!itens.length) {
            return `<small>${this.formatarMedidas(pedido)}</small>`;
        }

        return `
            <ul>
                ${itens.map((item, i) => `
                    <li>
                        ${i + 1}. ${item.tipoVidro || "Item"} - ${item.altura || "?"}x${item.largura || "?"}cm - Qtd ${item.quantidade || 1} - ${Util.moeda(item.total || 0)}
                    </li>
                `).join("")}
            </ul>
        `;
    },

    mostrarOrcamentoAtual() {
        const area = Util.$("orcamentoAtualResumo");
        if (!area) return;

        const dados = Storage.carregar(Config.storage.orcamentoAtual, null);

        if (!dados || !Array.isArray(dados.itens) || dados.itens.length === 0) {
            area.innerHTML = `
                <div class="estado-vazio compacto">
                    <strong>Nenhum orçamento em andamento.</strong>
                    <p>Clique em Novo Orçamento para começar.</p>
                </div>
            `;
            return;
        }

        const total = this.calcularTotalOrcamentoAtual(dados);
        const cliente = dados.cliente || {};

        area.innerHTML = `
            <p><b>Cliente:</b> ${cliente.nome || "Não informado"}</p>
            <p><b>Telefone:</b> ${cliente.telefone || "Não informado"}</p>
            <p><b>Itens:</b> ${dados.itens.length}</p>
            <p><b>Total:</b> <strong>${Util.moeda(total)}</strong></p>
            <p><b>Atualizado em:</b> ${dados.atualizadoEm || "Não informado"}</p>
        `;
    },

    async criarOrcamentoDaSolicitacao(indice) {
        const solicitacoes = this.obterSolicitacoes();
        const pedido = solicitacoes[indice];
        if (!pedido) return;

        const cliente = pedido.cliente || pedido;
        const itens = Array.isArray(pedido.itens) ? pedido.itens : [];

        const orcamento = {
            cliente: {
                nome: cliente.nome || pedido.nome || "",
                telefone: cliente.telefone || pedido.telefone || "",
                endereco: cliente.endereco || pedido.endereco || "",
                email: cliente.email || pedido.email || ""
            },
            itens,
            desconto: pedido.desconto || { tipo: "valor", valor: 0 },
            observacoes: this.montarObservacaoParaOrcamento(pedido),
            rascunhoItem: itens.length ? null : {
                tipoVidro: pedido.servico || "",
                largura: pedido.largura || "",
                altura: pedido.altura || "",
                quantidade: pedido.quantidade || 1
            },
            origemSolicitacaoId: pedido.idFirestore || null,
            atualizadoEm: Util.agora(),
            atualizadoEmISO: new Date().toISOString()
        };

        this.limparOrcamentoAtual();
        Storage.salvar(Config.storage.orcamentoAtual, orcamento);

        try {
            if (typeof db !== "undefined" && db) {
                await db.collection("orcamentos").doc("atual").set(orcamento, { merge: true });
                if (pedido.idFirestore) {
                    await db.collection("solicitacoes_site").doc(pedido.idFirestore).set({ status: "Em orçamento" }, { merge: true });
                }
            }
        } catch (erro) {
            console.error("Erro ao preparar orçamento na nuvem:", erro);
        }

        solicitacoes[indice].status = "Em orçamento";
        Storage.salvar(this.chaveSolicitacoes, solicitacoes);

        window.location.href = "novo-orcamento.html";
    },

    async marcarComoAtendida(indice) {
        const solicitacoes = this.obterSolicitacoes();
        const pedido = solicitacoes[indice];
        if (!pedido) return;

        pedido.status = "Atendida";
        Storage.salvar(this.chaveSolicitacoes, solicitacoes);

        try {
            if (typeof db !== "undefined" && db && pedido.idFirestore) {
                await db.collection("solicitacoes_site").doc(pedido.idFirestore).set({ status: "Atendida" }, { merge: true });
            }
        } catch (erro) {
            console.error("Erro ao atualizar solicitação na nuvem:", erro);
        }

        await this.carregarSolicitacoes();
        this.atualizarIndicadores();
        this.listarSolicitacoes();
    },

    formatarMedidas(pedido) {
        const largura = pedido.largura ? `${pedido.largura}cm` : "?";
        const altura = pedido.altura ? `${pedido.altura}cm` : "?";
        const quantidade = pedido.quantidade || 1;
        if (!pedido.largura && !pedido.altura) return `Qtd. ${quantidade}`;
        return `${altura} x ${largura} | Qtd. ${quantidade}`;
    },

    montarObservacaoParaOrcamento(pedido) {
        const linhas = [];
        const cliente = pedido.cliente || pedido;

        if (pedido.origem) linhas.push(`Origem: ${pedido.origem}`);
        if (pedido.servico) linhas.push(`Serviço solicitado: ${pedido.servico}`);
        if (cliente.email) linhas.push(`E-mail: ${cliente.email}`);
        if (pedido.observacoes) linhas.push(`Observações: ${pedido.observacoes}`);
        if (pedido.descricao && !pedido.observacoes) linhas.push(`Descrição: ${pedido.descricao}`);
        if (pedido.mensagem && !pedido.descricao && !pedido.observacoes) linhas.push(pedido.mensagem);

        return linhas.join("\n");
    },

    registrarEventos() {
        const btnLimpar = Util.$("btnLimparSolicitacoes");

        if (btnLimpar) {
            btnLimpar.addEventListener("click", async () => {
                if (!confirm("Deseja apagar todas as solicitações recebidas pelo site?")) return;

                Storage.salvar(this.chaveSolicitacoes, []);
                this.solicitacoes = [];

                try {
                    if (typeof db !== "undefined" && db) {
                        const snap = await db.collection("solicitacoes_site").get();
                        const batch = db.batch();
                        snap.forEach(doc => batch.delete(doc.ref));
                        await batch.commit();
                    }
                } catch (erro) {
                    console.error("Erro ao limpar solicitações na nuvem:", erro);
                }

                this.atualizarIndicadores();
                this.listarSolicitacoes();
            });
        }

        const formCaixa = Util.$("formCaixa");
        if (formCaixa) {
            formCaixa.addEventListener("submit", async (event) => {
                event.preventDefault();
                await this.registrarMovimentoCaixa();
            });
        }

        const btnLimparCaixa = Util.$("btnLimparCaixa");
        if (btnLimparCaixa) {
            btnLimparCaixa.addEventListener("click", async () => {
                await this.cancelarTodosLancamentosCaixa();
            });
        }

        this.registrarEventosConfiguracoes();
        this.registrarEventosFerramentas();
        this.registrarEventosFiltrosCaixa();
        this.registrarEventosExportacaoCaixa();

        this.preencherPadroesFormularioCaixa();

        const btnNovoPainel = Util.$("btnNovoOrcamentoPainel");

        if (btnNovoPainel) {
            btnNovoPainel.addEventListener("click", (event) => {
                event.preventDefault();
                if (!confirm("Deseja iniciar um novo orçamento? Os dados do orçamento atual serão apagados.")) return;
                this.limparOrcamentoAtual();
                window.location.href = "novo-orcamento.html";
            });
        }
    },


    async registrarMovimentoCaixa() {
        const descricao = (Util.$("caixaDescricao")?.value || "").trim();
        const categoria = Util.$("caixaCategoria")?.value || "despesa";
        const valor = Util.numero(Util.$("caixaValor")?.value || 0);
        const data = Util.$("caixaData")?.value || new Date().toISOString().slice(0, 10);
        const formaPagamento = Util.$("caixaFormaPagamento")?.value || "Não informado";
        const origem = Util.$("caixaOrigem")?.value || "Manual";
        const observacao = (Util.$("caixaObservacao")?.value || "").trim();
        const responsavel = (Util.$("caixaResponsavel")?.value || "").trim();
        const status = this.normalizarStatusCaixa(Util.$("caixaStatus")?.value || "confirmado");

        if (!descricao) return this.mensagemCaixa("Informe uma descrição.", true);
        if (!valor || valor <= 0) return this.mensagemCaixa("Informe um valor maior que zero.", true);

        const tipo = categoria === "entrada" ? "entrada" : "saida";

        // Base pronta para integrações futuras: entradas de orçamentos aprovados,
        // serviços/produtos, despesas de compras, pagamentos de funcionários e
        // relatórios mensais usando mesReferencia.
        const movimento = {
            descricao,
            categoria,
            tipo,
            valor,
            data,
            formaPagamento,
            origem,
            observacao,
            responsavel,
            status
        };

        const resultado = await CaixaService.salvar(movimento);
        if (!resultado.sucesso) {
            return this.mensagemCaixa(resultado.erros.join(" "), true);
        }
        this.caixa = resultado.lista || await CaixaService.listar();

        const form = Util.$("formCaixa");
        if (form) form.reset();
        this.preencherPadroesFormularioCaixa();

        this.atualizarCaixa();
        this.atualizarIndicadores();
        this.mensagemCaixa("Valor registrado no caixa.", false);
    },

    preencherPadroesFormularioCaixa() {
        const hoje = new Date().toISOString().slice(0, 10);
        const dataCaixa = Util.$("caixaData");
        if (dataCaixa && !dataCaixa.value) dataCaixa.value = hoje;

        const formaPagamento = Util.$("caixaFormaPagamento");
        if (formaPagamento && !formaPagamento.value) formaPagamento.value = "Dinheiro";

        const origem = Util.$("caixaOrigem");
        if (origem && !origem.value) origem.value = "Manual";

        const status = Util.$("caixaStatus");
        if (status && !status.value) status.value = "confirmado";
    },

    registrarEventosFiltrosCaixa() {
        const ids = [
            "filtroCaixaDataInicial",
            "filtroCaixaDataFinal",
            "filtroCaixaCategoria",
            "filtroCaixaTipo",
            "filtroCaixaStatus",
            "filtroCaixaFormaPagamento",
            "filtroCaixaOrigem"
        ];

        ids.forEach(id => {
            const campo = Util.$(id);
            if (!campo || campo.dataset.registrado) return;
            campo.dataset.registrado = "1";
            campo.addEventListener("input", () => this.atualizarCaixa());
            campo.addEventListener("change", () => this.atualizarCaixa());
        });

        const limpar = Util.$("btnLimparFiltrosCaixa");
        if (limpar && !limpar.dataset.registrado) {
            limpar.dataset.registrado = "1";
            limpar.addEventListener("click", () => {
                ids.forEach(id => {
                    const campo = Util.$(id);
                    if (campo) campo.value = "";
                });
                this.atualizarCaixa();
            });
        }
    },

    registrarEventosExportacaoCaixa() {
        const csv = Util.$("btnExportarCaixaCsv");
        if (csv && !csv.dataset.registrado) {
            csv.dataset.registrado = "1";
            csv.addEventListener("click", () => this.exportarCaixaCSV());
        }

        const json = Util.$("btnExportarCaixaJson");
        if (json && !json.dataset.registrado) {
            json.dataset.registrado = "1";
            json.addEventListener("click", () => this.exportarCaixaJSON());
        }
    },

    calcularResumoCaixa() {
        const resumoFinanceiro = this.gerarResumoFinanceiro(this.caixa);
        return {
            entradas: resumoFinanceiro.entradasConfirmadas,
            saidas: resumoFinanceiro.saidasConfirmadas,
            funcionarios: resumoFinanceiro.funcionariosConfirmados,
            despesas: resumoFinanceiro.despesasConfirmadas,
            materiais: resumoFinanceiro.materiaisConfirmados,
            saldo: resumoFinanceiro.saldoConfirmado,
            financeiro: resumoFinanceiro
        };
    },

    gerarResumoFinanceiro(lista) {
        const resumo = {
            entradasConfirmadas: 0,
            saidasConfirmadas: 0,
            saldoConfirmado: 0,
            entradasPendentes: 0,
            saidasPendentes: 0,
            totalCancelado: 0,
            totalPorFormaPagamento: {},
            totalPorCategoria: {},
            totalPorMes: {},
            totalPorOrigem: {},
            funcionariosConfirmados: 0,
            despesasConfirmadas: 0,
            materiaisConfirmados: 0,
            totalMesAtual: 0
        };

        const mesAtual = new Date().toISOString().slice(0, 7);

        this.normalizarListaCaixa(lista).forEach(mov => {
            const valor = Util.numero(mov.valor);
            const entrada = mov.tipo === "entrada" || mov.categoria === "entrada";
            const status = this.normalizarStatusCaixa(mov.status);

            if (status === "cancelado") {
                resumo.totalCancelado += valor;
                return;
            }

            if (status === "pendente") {
                if (entrada) resumo.entradasPendentes += valor;
                else resumo.saidasPendentes += valor;
                return;
            }

            if (entrada) resumo.entradasConfirmadas += valor;
            else {
                resumo.saidasConfirmadas += valor;
                if (mov.categoria === "funcionario") resumo.funcionariosConfirmados += valor;
                if (mov.categoria === "despesa" || mov.categoria === "outro") resumo.despesasConfirmadas += valor;
                if (mov.categoria === "material") resumo.materiaisConfirmados += valor;
            }

            const valorMensal = entrada ? valor : -valor;
            this.somarTotalRelatorio(resumo.totalPorFormaPagamento, mov.formaPagamento || "Não informado", valor);
            this.somarTotalRelatorio(resumo.totalPorCategoria, mov.categoria || "outro", valor);
            this.somarTotalRelatorio(resumo.totalPorOrigem, mov.origem || "Manual", valor);
            this.somarTotalRelatorio(resumo.totalPorMes, mov.mesReferencia || this.obterReferenciasDataCaixa(mov.data).mesReferencia, valorMensal);

            if ((mov.mesReferencia || "").slice(0, 7) === mesAtual) {
                resumo.totalMesAtual += valorMensal;
            }
        });

        resumo.saldoConfirmado = resumo.entradasConfirmadas - resumo.saidasConfirmadas;
        return resumo;
    },

    somarTotalRelatorio(destino, chave, valor) {
        const nome = chave || "Não informado";
        destino[nome] = Util.arredondar((destino[nome] || 0) + Util.numero(valor), 2);
    },

    atualizarCaixa() {
        this.caixa = this.ordenarMovimentosCaixa(this.normalizarListaCaixa(this.caixa));
        const resumo = this.calcularResumoCaixa();
        const filtrados = this.obterLancamentosCaixaFiltrados();
        const total = this.caixa.length;
        this.texto("caixaTotalEntradas", Util.moeda(resumo.entradas));
        this.texto("caixaTotalSaidas", Util.moeda(resumo.saidas));
        this.texto("caixaSaldo", Util.moeda(resumo.saldo));
        this.texto("caixaFuncionarios", Util.moeda(resumo.funcionarios));
        this.texto("caixaQuantidadeLancamentos", `${filtrados.length} de ${total} registro${total === 1 ? "" : "s"}`);

        const saldoCard = Util.$("caixaSaldo")?.closest(".caixa-resumo-card");
        if (saldoCard) {
            saldoCard.classList.toggle("negativo", resumo.saldo < 0);
        }

        this.atualizarResumoRelatoriosCaixa(this.gerarResumoFinanceiro(filtrados));
        this.listarCaixa(filtrados);
    },

    listarCaixa(listaFiltrada = this.obterLancamentosCaixaFiltrados()) {
        const area = Util.$("listaCaixa");
        if (!area) return;

        const lista = Array.isArray(listaFiltrada) ? listaFiltrada : [];
        if (!lista.length) {
            const texto = this.filtrosCaixaAtivos()
                ? "Nenhum lançamento encontrado com os filtros atuais."
                : "Use o formulário acima para começar a controlar o caixa.";
            area.innerHTML = `<div class="estado-vazio compacto"><strong>Nenhum valor registrado.</strong><p>${texto}</p></div>`;
            return;
        }

        area.innerHTML = lista.slice(0, 50).map((mov) => {
            const entrada = mov.tipo === "entrada" || mov.categoria === "entrada";
            const status = this.normalizarStatusCaixa(mov.status);
            const cancelado = status === "cancelado";
            const chave = encodeURIComponent(this.chaveMovimentoCaixa(mov, this.caixa.indexOf(mov)));
            const responsavel = mov.responsavel ? `<span>Responsável: ${this.htmlSeguro(mov.responsavel)}</span>` : "";
            const observacao = mov.observacao ? `<p>${this.htmlSeguro(mov.observacao)}</p>` : "";
            return `
                <div class="caixa-movimento ${entrada ? "entrada" : "saida"} ${cancelado ? "cancelado" : ""}">
                    <div class="caixa-movimento-info">
                        <div class="caixa-movimento-topo">
                            <strong>${this.htmlSeguro(mov.descricao || "Sem descrição")}</strong>
                            <span class="caixa-status status-${status}">${this.nomeStatusCaixa(status)}</span>
                        </div>
                        <span>${this.nomeCategoriaCaixa(mov.categoria)} • ${this.formatarDataCaixa(mov.data)} • ${this.htmlSeguro(mov.formaPagamento)} • ${this.htmlSeguro(mov.origem)}</span>
                        ${responsavel}
                        ${observacao}
                    </div>
                    <div class="caixa-movimento-valor">
                        <strong>${entrada ? "+" : "-"} ${Util.moeda(mov.valor)}</strong>
                        <div class="caixa-movimento-acoes">
                            <button type="button" class="btn-caixa-acao cancelar" onclick="Funcionario.cancelarMovimentoCaixa('${chave}')" ${cancelado ? "disabled" : ""}>Cancelar</button>
                            <button type="button" class="btn-caixa-acao excluir" onclick="Funcionario.excluirMovimentoCaixaDefinitivo('${chave}')">Cancelar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    },

    obterFiltrosCaixa() {
        return {
            dataInicial: Util.$("filtroCaixaDataInicial")?.value || "",
            dataFinal: Util.$("filtroCaixaDataFinal")?.value || "",
            categoria: Util.$("filtroCaixaCategoria")?.value || "",
            tipo: Util.$("filtroCaixaTipo")?.value || "",
            status: Util.$("filtroCaixaStatus")?.value || "",
            formaPagamento: Util.$("filtroCaixaFormaPagamento")?.value || "",
            origem: Util.$("filtroCaixaOrigem")?.value || ""
        };
    },

    filtrosCaixaAtivos(filtros = this.obterFiltrosCaixa()) {
        return Object.values(filtros).some(Boolean);
    },

    obterLancamentosCaixaFiltrados() {
        return this.filtrarMovimentosCaixa(this.caixa, this.obterFiltrosCaixa());
    },

    filtrarMovimentosCaixa(lista, filtros) {
        return (Array.isArray(lista) ? lista : []).filter(mov => {
            if (filtros.dataInicial && String(mov.data || "") < filtros.dataInicial) return false;
            if (filtros.dataFinal && String(mov.data || "") > filtros.dataFinal) return false;
            if (filtros.categoria && mov.categoria !== filtros.categoria) return false;
            if (filtros.tipo && mov.tipo !== filtros.tipo) return false;
            if (filtros.status && this.normalizarStatusCaixa(mov.status) !== filtros.status) return false;
            if (filtros.formaPagamento && (mov.formaPagamento || "Não informado") !== filtros.formaPagamento) return false;
            if (filtros.origem && (mov.origem || "Manual") !== filtros.origem) return false;
            return true;
        });
    },

    async cancelarMovimentoCaixa(chaveCodificada) {
        const chave = this.decodificarChaveCaixa(chaveCodificada);
        const indice = this.indiceMovimentoCaixaPorChave(chave);
        const mov = this.caixa[indice];
        if (!mov || mov.status === "cancelado") return;
        if (!confirm("Cancelar este lançamento? Ele continuará no histórico, mas não entrará no saldo confirmado.")) return;

        const resultado = await CaixaService.cancelar(chave);
        this.caixa = resultado.lista || await CaixaService.listar();

        this.atualizarCaixa();
        this.atualizarIndicadores();
        this.mensagemCaixa("Lançamento cancelado.", false);
    },

    async cancelarTodosLancamentosCaixa() {
        const ativos = this.caixa.filter(mov => this.normalizarStatusCaixa(mov.status) !== "cancelado");
        if (!ativos.length) return this.mensagemCaixa("Não há lançamentos ativos para cancelar.", true);
        if (!confirm("Cancelar todos os lançamentos do caixa? Eles continuarão no histórico como cancelados.")) return;

        for (const mov of ativos) {
            await CaixaService.cancelar(this.chaveMovimentoCaixa(mov, this.caixa.indexOf(mov)));
        }
        this.caixa = await CaixaService.listar();

        this.atualizarCaixa();
        this.atualizarIndicadores();
        this.mensagemCaixa("Lançamentos cancelados.", false);
    },

    async excluirMovimentoCaixaDefinitivo(chaveCodificada) {
        const chave = this.decodificarChaveCaixa(chaveCodificada);
        const indice = this.indiceMovimentoCaixaPorChave(chave);
        const mov = this.caixa[indice];
        if (!mov) return;

        if (!confirm("Cancelar este lançamento? Ele continuará no histórico.")) return;

        const resultado = await CaixaService.excluir(chave);
        this.caixa = resultado.lista || await CaixaService.listar();

        this.atualizarCaixa();
        this.atualizarIndicadores();
        this.mensagemCaixa("Lançamento cancelado.", false);
    },

    async removerMovimentoCaixa(indice) {
        const mov = this.caixa[indice];
        if (!mov) return;
        await this.excluirMovimentoCaixaDefinitivo(encodeURIComponent(this.chaveMovimentoCaixa(mov, indice)));
    },

    async sincronizarMovimentoCaixaNaNuvem(mov, dados) {
        await CaixaService.atualizar(this.chaveMovimentoCaixa(mov), dados);
    },

    atualizarResumoRelatoriosCaixa(resumo) {
        this.preencherRelatorioTotal("relatorioTotalCategoria", resumo.totalPorCategoria, chave => this.nomeCategoriaCaixa(chave));
        this.preencherRelatorioTotal("relatorioTotalFormaPagamento", resumo.totalPorFormaPagamento);
        this.preencherRelatorioTotal("relatorioTotalOrigem", resumo.totalPorOrigem);
        this.texto("relatorioTotalMesAtual", Util.moeda(resumo.totalMesAtual));
        this.texto("relatorioSaldoConfirmado", Util.moeda(resumo.saldoConfirmado));
    },

    preencherRelatorioTotal(id, totais, formatador = null) {
        const area = Util.$(id);
        if (!area) return;

        const linhas = Object.entries(totais || {})
            .filter(([, valor]) => Math.abs(Util.numero(valor)) > 0)
            .sort((a, b) => Math.abs(Util.numero(b[1])) - Math.abs(Util.numero(a[1])));

        if (!linhas.length) {
            area.innerHTML = `<p class="caixa-relatorio-vazio">Sem valores confirmados.</p>`;
            return;
        }

        area.innerHTML = linhas.slice(0, 8).map(([chave, valor]) => `
            <div>
                <span>${this.htmlSeguro(formatador ? formatador(chave) : chave)}</span>
                <strong>${Util.moeda(valor)}</strong>
            </div>
        `).join("");
    },

    exportarCaixaCSV() {
        const lista = this.obterLancamentosCaixaFiltrados();
        if (!lista.length) return this.mensagemCaixa("Não há lançamentos para exportar.", true);

        const colunas = [
            "data",
            "descricao",
            "tipo",
            "categoria",
            "valor",
            "formaPagamento",
            "origem",
            "status",
            "responsavel",
            "observacao"
        ];

        const linhas = lista.map(mov => colunas.map(coluna => this.valorCsvCaixa(mov[coluna])).join(","));
        const conteudo = [colunas.join(","), ...linhas].join("\n");
        this.baixarArquivoCaixa(`caixa_empresa_${new Date().toISOString().slice(0, 10)}.csv`, `\ufeff${conteudo}`, "text/csv;charset=utf-8");
        this.mensagemCaixa("CSV exportado com os lançamentos filtrados.", false);
    },

    async exportarCaixaJSON() {
        const lista = this.obterLancamentosCaixaFiltrados();
        if (!lista.length) return this.mensagemCaixa("Não há lançamentos para exportar.", true);

        if (window.CaixaService) {
            CaixaExport.baixar(lista);
        } else {
            const conteudo = JSON.stringify(this.normalizarListaCaixa(lista), null, 2);
            this.baixarArquivoCaixa(`caixa_empresa_${new Date().toISOString().slice(0, 10)}.json`, conteudo, "application/json;charset=utf-8");
        }

        this.mensagemCaixa("JSON exportado com os lançamentos filtrados.", false);
    },

    valorCsvCaixa(valor) {
        const texto = String(valor ?? "").replace(/\r?\n/g, " ");
        return `"${texto.replace(/"/g, '""')}"`;
    },

    baixarArquivoCaixa(nomeArquivo, conteudo, tipo) {
        const blob = new Blob([conteudo], { type: tipo });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },

    chaveMovimentoCaixa(mov, indice = 0) {
        if (window.CaixaService) {
            return CaixaService.chave(mov, indice);
        }

        return String(mov?.caixaId || mov?.caixa_id || `caixa_${indice}`);
    },

    indiceMovimentoCaixaPorChave(chave) {
        return this.caixa.findIndex((mov, indice) => this.chaveMovimentoCaixa(mov, indice) === chave);
    },

    decodificarChaveCaixa(chave) {
        try {
            return decodeURIComponent(chave);
        } catch (erro) {
            return chave;
        }
    },

    htmlSeguro(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[caractere]));
    },

    nomeCategoriaCaixa(categoria) {
        const nomes = {
            entrada: "Entrada",
            funcionario: "Funcionário",
            despesa: "Despesa da empresa",
            material: "Material",
            outro: "Outro gasto"
        };
        return nomes[categoria] || "Movimento";
    },

    nomeStatusCaixa(status) {
        const nomes = {
            confirmado: "Confirmado",
            pendente: "Pendente",
            cancelado: "Cancelado"
        };
        return nomes[this.normalizarStatusCaixa(status)] || "Confirmado";
    },

    formatarDataCaixa(data) {
        if (!data) return "Sem data";
        const partes = String(data).split("-");
        if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
        return data;
    },

    mensagemCaixa(texto, erro = false) {
        const msg = Util.$("caixaMensagem");
        if (!msg) return;
        msg.textContent = texto;
        msg.classList.toggle("erro", erro);
        window.clearTimeout(this._timerMensagemCaixa);
        this._timerMensagemCaixa = window.setTimeout(() => { msg.textContent = ""; }, 3500);
    },


    verificarSessao() {
        const sessao = window.RKAuth ? RKAuth.obterSessao() : null;
        if (!sessao || !sessao.logado) {
            if (window.RKAuth) {
                RKAuth.redirecionarLogin();
            } else {
                window.location.replace("login.html");
            }
            return null;
        }

        return sessao;
    },

    sair() {
        if (window.RKAuth) {
            RKAuth.sair();
            return;
        }

        localStorage.removeItem("usuarioLogado");
        sessionStorage.removeItem("usuarioLogado");
        window.location.href = "login.html";
    },

    obterConfiguracoesSistema() {
        const padrao = {
            nomeUsuario: "Funcionário RK",
            fotoUsuario: "",
            nomeEmpresa: Config.empresa?.nome || "RK Vidraçaria",
            telefoneEmpresa: Config.empresa?.telefone || "(73) 9981-9768",
            enderecoEmpresa: Config.empresa?.endereco || "Rua Guimarães, 336 - Nilo Fraga, Porto Seguro",
            aluminioMetro: "",
            acessorioPadrao: "",
            margemSeguranca: "",
            lembreteIntervaloMinutos: "5",
            lembreteQuantidadeAviso: "3"
        };
        const salvas = { ...(Storage.carregar(this.chaveConfig, {}) || {}) };
        delete salvas.usuario;
        delete salvas.senha;
        return { ...padrao, ...salvas };
    },

    salvarConfiguracoesSistema(config) {
        const atual = this.obterConfiguracoesSistema();
        const nova = { ...atual, ...config, atualizadoEmISO: new Date().toISOString() };
        Storage.salvar(this.chaveConfig, nova);
        return nova;
    },

    carregarPerfilUsuario() {
        const config = this.obterConfiguracoesSistema();
        const sessao = window.RKAuth?.obterSessao() || {};
        const perfil = {
            ...config,
            nomeUsuario: config.nomeUsuario || sessao.nomeUsuario || "Funcionário RK",
            fotoUsuario: config.fotoUsuario || sessao.fotoUsuario || ""
        };
        this.texto("nomeUsuarioTopo", perfil.nomeUsuario);
        this.texto("loginUsuarioTopo", sessao.email || "Firebase Authentication");
        this.aplicarFotoUsuario("fotoUsuarioTopo", perfil);
        this.aplicarFotoUsuario("fotoUsuarioPreview", perfil);
        this.texto("nomeUsuarioPreview", perfil.nomeUsuario);
    },

    aplicarFotoUsuario(id, config) {
        const el = Util.$(id);
        if (!el) return;
        if (config.fotoUsuario) {
            el.innerHTML = `<img src="${config.fotoUsuario}" alt="Foto do usuário">`;
            el.classList.add("com-imagem");
            return;
        }
        const nome = (config.nomeUsuario || "RK").trim();
        const partes = nome.split(/\s+/).filter(Boolean);
        el.textContent = (partes[0]?.[0] || "R") + (partes[1]?.[0] || "K");
        el.classList.remove("com-imagem");
    },

    prepararAbas() {
        const botoes = document.querySelectorAll(".abas-painel button[data-aba]");
        const secoes = document.querySelectorAll(".secao-aba[data-secao]");
        if (!botoes.length || !secoes.length) return;

        const ativar = (aba) => {
            botoes.forEach(btn => btn.classList.toggle("aba-ativa", btn.dataset.aba === aba));
            secoes.forEach(secao => secao.classList.toggle("secao-oculta", secao.dataset.secao !== aba));
            localStorage.setItem("vidracaria_aba_funcionario", aba);
        };

        botoes.forEach(btn => btn.addEventListener("click", () => ativar(btn.dataset.aba)));
        ativar(localStorage.getItem("vidracaria_aba_funcionario") || "dashboard");
    },

    carregarConfiguracoesNaTela() {
        const c = this.obterConfiguracoesSistema();
        const sessao = window.RKAuth?.obterSessao() || {};
        const campos = {
            cfgNomeUsuario: c.nomeUsuario,
            cfgEmailUsuario: sessao.email || "",
            cfgNomeEmpresa: c.nomeEmpresa,
            cfgTelefoneEmpresa: c.telefoneEmpresa,
            cfgEnderecoEmpresa: c.enderecoEmpresa,
            cfgAluminioMetro: c.aluminioMetro,
            cfgAcessorioPadrao: c.acessorioPadrao,
            cfgMargemSeguranca: c.margemSeguranca,
            cfgLembreteIntervalo: c.lembreteIntervaloMinutos,
            cfgLembreteQuantidade: c.lembreteQuantidadeAviso
        };
        Object.entries(campos).forEach(([id, valor]) => {
            const el = Util.$(id);
            if (el) el.value = valor || "";
        });
        this.carregarPerfilUsuario();
    },

    registrarEventosConfiguracoes() {
        const form = Util.$("formConfiguracoesSistema");
        if (form && !form.dataset.registrado) {
            form.dataset.registrado = "1";
            form.addEventListener("submit", async (event) => {
                event.preventDefault();
                await this.salvarConfiguracoesDaTela();
            });
        }

        const reset = Util.$("btnResetarConfig");
        if (reset && !reset.dataset.registrado) {
            reset.dataset.registrado = "1";
            reset.addEventListener("click", () => {
                if (!confirm("Restaurar perfil e configurações para o padrão?")) return;
                Storage.remover(this.chaveConfig);
                this.carregarConfiguracoesNaTela();
                this.mensagemConfig("Configurações restauradas.");
            });
        }

        const foto = Util.$("cfgFotoUsuario");
        if (foto && !foto.dataset.registrado) {
            foto.dataset.registrado = "1";
            foto.addEventListener("change", () => this.lerFotoUsuario(foto));
        }
    },

    lerFotoUsuario(input) {
        const arquivo = input.files && input.files[0];
        if (!arquivo) return;
        if (!arquivo.type.startsWith("image/")) return this.mensagemConfig("Selecione uma imagem válida.", true);
        if (arquivo.size > 900 * 1024) return this.mensagemConfig("Use uma foto menor que 900 KB.", true);

        const leitor = new FileReader();
        leitor.onload = () => {
            this._fotoUsuarioTemporaria = leitor.result;
            const config = { ...this.obterConfiguracoesSistema(), fotoUsuario: leitor.result };
            this.aplicarFotoUsuario("fotoUsuarioPreview", config);
        };
        leitor.readAsDataURL(arquivo);
    },

    async salvarConfiguracoesDaTela() {
        const nomeUsuario = (Util.$("cfgNomeUsuario")?.value || "Funcionário RK").trim();

        const atual = this.obterConfiguracoesSistema();
        const config = this.salvarConfiguracoesSistema({
            nomeUsuario,
            fotoUsuario: this._fotoUsuarioTemporaria || atual.fotoUsuario || "",
            nomeEmpresa: (Util.$("cfgNomeEmpresa")?.value || "").trim(),
            telefoneEmpresa: (Util.$("cfgTelefoneEmpresa")?.value || "").trim(),
            enderecoEmpresa: (Util.$("cfgEnderecoEmpresa")?.value || "").trim(),
            aluminioMetro: Util.$("cfgAluminioMetro")?.value || "",
            acessorioPadrao: Util.$("cfgAcessorioPadrao")?.value || "",
            margemSeguranca: Util.$("cfgMargemSeguranca")?.value || "",
            lembreteIntervaloMinutos: Util.$("cfgLembreteIntervalo")?.value || "5",
            lembreteQuantidadeAviso: Util.$("cfgLembreteQuantidade")?.value || "3"
        });

        this._fotoUsuarioTemporaria = null;
        this.carregarConfiguracoesNaTela();
        this.carregarPerfilUsuario();
        this.mensagemConfig("Configurações salvas. O acesso continua protegido pelo Firebase Authentication.");
        this.iniciarAvisosDeLembretes();

        try {
            if (typeof db !== "undefined" && db) {
                await db.collection("configuracoes").doc("sistema").set({
                    nomeUsuario: config.nomeUsuario,
                    nomeEmpresa: config.nomeEmpresa,
                    telefoneEmpresa: config.telefoneEmpresa,
                    enderecoEmpresa: config.enderecoEmpresa,
                    aluminioMetro: config.aluminioMetro,
                    acessorioPadrao: config.acessorioPadrao,
                    margemSeguranca: config.margemSeguranca,
                    lembreteIntervaloMinutos: config.lembreteIntervaloMinutos,
                    lembreteQuantidadeAviso: config.lembreteQuantidadeAviso,
                    atualizadoEmISO: config.atualizadoEmISO
                }, { merge: true });
            }
        } catch (erro) {
            console.warn("Configuração salva localmente, mas não foi enviada à nuvem:", erro);
        }
    },

    mensagemConfig(texto, erro = false) {
        const msg = Util.$("mensagemConfig");
        if (!msg) return;
        msg.textContent = texto;
        msg.classList.toggle("erro", erro);
        window.clearTimeout(this._timerMensagemConfig);
        this._timerMensagemConfig = window.setTimeout(() => msg.textContent = "", 4000);
    },

    carregarFerramentas() {
        const anotacoes = Util.$("anotacoesFuncionario");
        if (anotacoes) anotacoes.value = localStorage.getItem(this.chaveAnotacoes) || "";
        this.lembretes = Storage.carregar(this.chaveLembretes, []);
        if (!Array.isArray(this.lembretes)) this.lembretes = [];
        this.listarLembretes();
    },

    registrarEventosFerramentas() {
        const anotacoes = Util.$("anotacoesFuncionario");
        if (anotacoes && !anotacoes.dataset.registrado) {
            anotacoes.dataset.registrado = "1";
            anotacoes.addEventListener("input", () => localStorage.setItem(this.chaveAnotacoes, anotacoes.value));
        }

        const form = Util.$("formLembrete");
        if (form && !form.dataset.registrado) {
            form.dataset.registrado = "1";
            form.addEventListener("submit", (event) => {
                event.preventDefault();
                this.adicionarLembrete();
            });
        }
    },

    limparAnotacoes() {
        if (!confirm("Limpar todas as anotações?")) return;
        localStorage.removeItem(this.chaveAnotacoes);
        const anotacoes = Util.$("anotacoesFuncionario");
        if (anotacoes) anotacoes.value = "";
    },

    adicionarLembrete() {
        const texto = (Util.$("lembreteTexto")?.value || "").trim();
        const data = Util.$("lembreteData")?.value || "";
        if (!texto) return alert("Informe o texto do lembrete.");
        this.lembretes.unshift({ idLocal: `lem_${Date.now()}`, texto, data, concluido: false, criadoEmISO: new Date().toISOString() });
        Storage.salvar(this.chaveLembretes, this.lembretes);
        if (Util.$("lembreteTexto")) Util.$("lembreteTexto").value = "";
        if (Util.$("lembreteData")) Util.$("lembreteData").value = "";
        this.listarLembretes();
        this.iniciarAvisosDeLembretes();
        this.mostrarToastLembrete([{ texto: "Lembrete criado com sucesso", data }], true);
    },

    listarLembretes() {
        const area = Util.$("listaLembretes");
        if (!area) return;
        if (!this.lembretes.length) {
            area.innerHTML = `<div class="estado-vazio compacto"><strong>Nenhum lembrete.</strong><p>Adicione lembretes de retorno, compras ou medições.</p></div>`;
            return;
        }
        area.innerHTML = this.lembretes.map((lem, indice) => `
            <div class="lembrete-item ${lem.concluido ? "concluido" : ""}">
                <button type="button" onclick="Funcionario.alternarLembrete(${indice})">${lem.concluido ? "✓" : "○"}</button>
                <div><strong>${lem.texto}</strong><span>${this.formatarDataHoraLembrete(lem.data)}</span></div>
                <button type="button" class="remover" onclick="Funcionario.removerLembrete(${indice})">×</button>
            </div>
        `).join("");
    },

    alternarLembrete(indice) {
        if (!this.lembretes[indice]) return;
        this.lembretes[indice].concluido = !this.lembretes[indice].concluido;
        Storage.salvar(this.chaveLembretes, this.lembretes);
        this.listarLembretes();
    },

    removerLembrete(indice) {
        this.lembretes.splice(indice, 1);
        Storage.salvar(this.chaveLembretes, this.lembretes);
        this.listarLembretes();
    },

    formatarDataHoraLembrete(data) {
        if (!data) return "Sem data definida";
        const d = new Date(data);
        if (Number.isNaN(d.getTime())) return data;
        return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    },



    iniciarAvisosDeLembretes() {
        window.clearInterval(this._timerLembretes);
        this._timerLembretes = null;

        const config = this.obterConfiguracoesSistema();
        const minutos = Number(config.lembreteIntervaloMinutos || 0);
        if (!minutos || minutos <= 0) return;

        // Primeira checagem alguns segundos depois de abrir o painel.
        window.setTimeout(() => this.mostrarLembretesPendentes(false), 2500);
        this._timerLembretes = window.setInterval(() => {
            this.mostrarLembretesPendentes(false);
        }, minutos * 60 * 1000);
    },

    obterLembretesPendentes() {
        const agora = Date.now();
        return (Array.isArray(this.lembretes) ? this.lembretes : [])
            .filter(lem => !lem.concluido)
            .filter(lem => {
                if (!lem.data) return true;
                const data = new Date(lem.data).getTime();
                if (Number.isNaN(data)) return true;
                return data <= agora;
            })
            .sort((a, b) => String(a.data || '').localeCompare(String(b.data || '')));
    },

    mostrarLembretesPendentes(forcar = false) {
        const pendentes = this.obterLembretesPendentes();
        const config = this.obterConfiguracoesSistema();
        const limite = Math.max(1, Number(config.lembreteQuantidadeAviso || 3));

        if (!pendentes.length) {
            if (forcar) this.mostrarToastLembrete([{ texto: "Nenhum lembrete pendente no momento.", data: "" }], true);
            return;
        }

        const agora = Date.now();
        const minutos = Number(config.lembreteIntervaloMinutos || 0);
        const intervaloMs = Math.max(1, minutos) * 60 * 1000;
        if (!forcar && this._ultimoAvisoLembretes && agora - this._ultimoAvisoLembretes < Math.min(intervaloMs, 60000)) return;

        this._ultimoAvisoLembretes = agora;
        this.mostrarToastLembrete(pendentes.slice(0, limite), false);
    },

    mostrarToastLembrete(lembretes, informativo = false) {
        const toast = Util.$("lembreteToast");
        if (!toast) return;
        const lista = Array.isArray(lembretes) ? lembretes : [];
        toast.innerHTML = `
            <div class="lembrete-toast-card ${informativo ? 'info' : ''}">
                <div class="lembrete-toast-head">
                    <strong>${informativo ? 'Aviso' : 'Lembrete pendente'}</strong>
                    <button type="button" onclick="Funcionario.fecharToastLembrete()">×</button>
                </div>
                <div class="lembrete-toast-lista">
                    ${lista.map(lem => `
                        <div class="lembrete-toast-item">
                            <span>🔔</span>
                            <div>
                                <strong>${lem.texto || 'Lembrete'}</strong>
                                <small>${this.formatarDataHoraLembrete(lem.data)}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="lembrete-toast-acoes">
                    <button type="button" class="btn-pequeno" onclick="Funcionario.abrirAba('ferramentas')">Ver lembretes</button>
                    <button type="button" class="btn-pequeno btn-cinza" onclick="Funcionario.fecharToastLembrete()">Depois</button>
                </div>
            </div>
        `;
        toast.classList.add("ativo");

        window.clearTimeout(this._timerFecharToast);
        this._timerFecharToast = window.setTimeout(() => this.fecharToastLembrete(), informativo ? 3500 : 12000);
    },

    fecharToastLembrete() {
        const toast = Util.$("lembreteToast");
        if (toast) toast.classList.remove("ativo");
    },

    abrirAba(nomeAba) {
        const botao = document.querySelector(`.abas-painel button[data-aba="${nomeAba}"]`);
        if (botao) botao.click();
    },

    calcAdicionar(valor) {
        if (!this.calcExpressao || this.calcExpressao === "0") this.calcExpressao = "";
        this.calcExpressao += valor;
        this.atualizarCalculadora();
    },

    calcLimpar() {
        this.calcExpressao = "";
        this.atualizarCalculadora();
    },

    calcApagar() {
        this.calcExpressao = this.calcExpressao.slice(0, -1);
        this.atualizarCalculadora();
    },

    calcResultado() {
        try {
            const expressao = this.calcExpressao.replace(/,/g, ".");
            if (!/^[0-9+\-*/.()\s]+$/.test(expressao)) throw new Error("Expressão inválida");
            const resultado = Function(`"use strict"; return (${expressao})`)();
            this.calcExpressao = String(Number(resultado.toFixed(2))).replace(".", ",");
        } catch (erro) {
            this.calcExpressao = "Erro";
        }
        this.atualizarCalculadora();
    },

    atualizarCalculadora() {
        const display = Util.$("calcDisplay");
        if (display) display.value = this.calcExpressao || "0";
    },

    obterSolicitacoes() {
        return Array.isArray(this.solicitacoes) ? this.solicitacoes : [];
    },

    calcularTotalOrcamentoAtual(dados) {
        if (!dados || !Array.isArray(dados.itens)) return 0;
        const subtotal = dados.itens.reduce((soma, item) => soma + Util.numero(item.total), 0);
        const desconto = dados.desconto || { tipo: "valor", valor: 0 };
        let valorDesconto = Util.numero(desconto.valor);
        if (desconto.tipo === "percentual") valorDesconto = subtotal * (valorDesconto / 100);
        return Math.max(0, subtotal - valorDesconto);
    },

    contarSolicitacoesPendentes() {
        return this.obterSolicitacoes().filter(pedido => {
            const status = String(pedido.status || "Solicitado").toLowerCase();
            return !status.includes("atendida") && !status.includes("cancelada");
        }).length;
    },

    atualizarAlertaSolicitacoes() {
        const total = this.contarSolicitacoesPendentes();
        const badge = Util.$("alertaSolicitacoes");
        const botao = Util.$("abaSolicitacoesBotao");

        if (badge) {
            badge.textContent = total > 9 ? "9+" : total ? "!" : "";
            badge.classList.toggle("oculto", total === 0);
        }

        if (botao) {
            botao.classList.toggle("tem-solicitacao", total > 0);
            botao.setAttribute("aria-label", total > 0 ? `Solicitações, ${total} pendente(s)` : "Solicitações");
        }
    },

    iniciarTempoRealSolicitacoes() {
        if (typeof db === "undefined" || !db || this._unsubscribeSolicitacoes) return;

        try {
            this._unsubscribeSolicitacoes = db.collection("solicitacoes_site")
                .orderBy("criadoEmISO", "desc")
                .limit(50)
                .onSnapshot(snapshot => {
                    const nuvem = [];
                    snapshot.forEach(doc => nuvem.push({ idFirestore: doc.id, ...doc.data() }));

                    const locais = Storage.carregar(this.chaveSolicitacoes, []);
                    const mapa = new Map();
                    [...(Array.isArray(locais) ? locais : []), ...nuvem].forEach((pedido, indice) => {
                        const chave = pedido.idFirestore || pedido.criadoEmISO || pedido.idLocal || `pedido_${indice}`;
                        mapa.set(chave, pedido);
                    });

                    this.solicitacoes = Array.from(mapa.values()).sort((a, b) => {
                        return String(b.criadoEmISO || '').localeCompare(String(a.criadoEmISO || ''));
                    });

                    Storage.salvar(this.chaveSolicitacoes, this.solicitacoes);
                    this.atualizarIndicadores();
                    this.listarSolicitacoes();
                }, erro => {
                    console.warn("Tempo real das solicitações indisponível:", erro);
                });
        } catch (erro) {
            console.warn("Não foi possível ativar tempo real das solicitações:", erro);
        }
    },

    async carregarTemperaturaAtual() {
        const alvo = Util.$("temperaturaAtual");
        if (!alvo) return;

        const atualizarTexto = (texto) => { alvo.textContent = texto; };

        try {
            const resposta = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-16.44&longitude=-39.06&current=temperature_2m&timezone=America%2FBahia", { cache: "no-store" });
            if (!resposta.ok) throw new Error("Resposta inválida");
            const dados = await resposta.json();
            const temp = dados && dados.current ? dados.current.temperature_2m : null;
            if (typeof temp === "number") {
                atualizarTexto(`Porto Seguro • ${Math.round(temp)}°C`);
                return;
            }
            throw new Error("Temperatura ausente");
        } catch (erro) {
            atualizarTexto("Porto Seguro • temperatura indisponível");
        }
    },

    texto(id, valor) {
        const elemento = Util.$(id);
        if (elemento) elemento.textContent = valor;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    Funcionario.iniciar();
});
