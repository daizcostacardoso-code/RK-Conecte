const RKE2EDemoState = {
    storageKey: "rk_conecte_e2e_demo_state",
    origem: "DEMO_E2E",

    iniciar(opcoes = {}) {
        const estado = this.obterOuCriar(opcoes);
        this.hidratarAppState(estado);
        this.renderizarAvisoDemo(estado);
        return estado;
    },

    obterOuCriar(opcoes = {}) {
        const salvo = this.carregar();
        const base = salvo || this.criarEstadoDemo();
        const estado = this.garantirDocumento({
            ...base,
            ...opcoes,
            demo: true,
            atualizadoEm: new Date().toISOString()
        });

        this.salvar(estado);
        return estado;
    },

    carregar() {
        try {
            const valor = sessionStorage.getItem(this.storageKey);
            return valor ? JSON.parse(valor) : null;
        } catch (erro) {
            return null;
        }
    },

    salvar(estado = {}) {
        try {
            sessionStorage.setItem(this.storageKey, JSON.stringify(estado));
            return true;
        } catch (erro) {
            return false;
        }
    },

    salvarFluxo(alteracoes = {}) {
        const atual = this.carregar() || this.criarEstadoDemo();
        const configuracoesAtuais = atual.configuracoes || {};
        const configuracoesNovas = alteracoes.configuracoes || {};
        const estado = this.garantirDocumento({
            ...atual,
            ...alteracoes,
            configuracoes: {
                ...configuracoesAtuais,
                ...configuracoesNovas,
                comercial: {
                    ...(configuracoesAtuais.comercial || {}),
                    ...(configuracoesNovas.comercial || {})
                },
                conversao: {
                    ...(configuracoesAtuais.conversao || {}),
                    ...(configuracoesNovas.conversao || {})
                },
                demoE2E: {
                    ...(configuracoesAtuais.demoE2E || {}),
                    ...(configuracoesNovas.demoE2E || {}),
                    ativo: true,
                    origem: this.origem
                }
            },
            demo: true,
            atualizadoEm: new Date().toISOString()
        });

        this.salvar(estado);
        this.hidratarAppState(estado);
        return estado;
    },

    criarEstadoDemo() {
        const agora = new Date().toISOString();
        const cliente = {
            id: "cli_demo_e2e",
            tipoPessoa: "fisica",
            nome: "Cliente Demo RK",
            telefonePrincipal: "7399819768",
            email: "cliente.demo@rk.local",
            enderecos: [{
                id: "end_demo_e2e",
                tipo: "obra",
                logradouro: "Rua Demo",
                numero: "123",
                bairro: "Centro",
                cidade: "Porto Seguro",
                estado: "BA"
            }],
            status: "ativo",
            dataCadastro: agora,
            ultimaAtualizacao: agora,
            projetos: [{ id: "prj_demo_e2e", numero: "PRJ-DEMO-001", status: "aprovado" }],
            orcamentos: [{ id: "orc_demo_e2e", numero: "ORC-DEMO-001", status: "finalizado" }],
            historico: [],
            timeline: []
        };
        const projeto = {
            id: "prj_demo_e2e",
            numero: "PRJ-DEMO-001",
            codigo: "PRJ-DEMO-001",
            titulo: "Box banheiro - Cliente Demo RK",
            status: "aprovado",
            etapaAtual: "comercial",
            prioridade: "MEDIA",
            cliente: {
                id: cliente.id,
                nome: cliente.nome,
                telefone: cliente.telefonePrincipal,
                email: cliente.email
            },
            obra: {
                endereco: "Rua Demo, 123",
                bairro: "Centro",
                cidade: "Porto Seguro",
                observacoes: "Projeto de demonstracao para teste visual E2E."
            },
            comercial: {
                responsavel: "Equipe Comercial",
                valorEstimado: 1260,
                valorFechado: 1260
            },
            operacional: {
                responsavel: "Equipe Producao",
                status: ""
            },
            financeiro: {
                valorTotal: 1260,
                valorRecebido: 0,
                saldo: 1260
            },
            datas: {
                criacao: agora,
                atualizacao: agora,
                conclusao: null
            },
            historico: [],
            arquivos: [],
            fotos: [],
            tags: ["demo", "e2e"]
        };
        const servico = {
            id: "srv_demo_e2e",
            nome: "Box de banheiro",
            categoria: "box",
            descricao: "Servico demo para teste visual do fluxo.",
            tipoCalculo: "area_m2",
            unidadeVenda: "m2",
            ativo: true
        };
        const produtos = [{
            id: "prd_demo_e2e",
            nome: "Vidro temperado 8mm",
            categoria: "vidro",
            subcategoria: "temperado",
            unidadeVenda: "m2",
            tipoCalculo: "area_m2",
            quantidade: 1,
            larguraCm: 150,
            alturaCm: 200,
            areaM2: 3,
            precoVenda: 420,
            valorUnitario: 420,
            subtotal: 1260,
            valorTotal: 1260,
            ativo: true
        }];
        const orcamentoAtual = this.criarOrcamentoDemo({ cliente, projeto, servico, produtos, agora });
        const documentoAtual = this.criarDocumentoDemo(orcamentoAtual);

        return {
            demo: true,
            origem: this.origem,
            criadoEm: agora,
            atualizadoEm: agora,
            usuarioAtual: {
                id: "usr_demo_e2e",
                nome: "Usuario Demo RK",
                origem: this.origem
            },
            clienteSelecionado: cliente,
            projetoSelecionado: projeto,
            projetoAtual: projeto,
            orcamentoAtual,
            documentoAtual,
            statusComercial: "RASCUNHO",
            ordemAtual: null,
            configuracoes: {
                demoE2E: {
                    ativo: true,
                    origem: this.origem,
                    aviso: "Dados locais de demonstracao para testar o fluxo online."
                },
                comercial: {
                    statusComercial: "RASCUNHO",
                    ultimaAcaoComercial: "Documento Comercial demo aguardando revisao.",
                    atualizadoEm: agora
                },
                conversao: {}
            }
        };
    },

    criarOrcamentoDemo({ cliente, projeto, servico, produtos, agora }) {
        return {
            id: "orc_demo_e2e",
            status: "FINALIZADO",
            cliente,
            projeto,
            servico,
            produtos,
            calculo: {
                tipoCalculo: "ORCAMENTO_ITENS",
                itens: produtos,
                descontoTipo: "sem",
                descontoValor: 0,
                acrescimoTipo: "sem",
                acrescimoValor: 0
            },
            resultado: {
                sucesso: true,
                tipo: "ORCAMENTO_ITENS",
                valorCalculado: 1260,
                unidade: "BRL",
                detalhes: {
                    itens: produtos,
                    areaTotalM2: 3,
                    subtotal: 1260,
                    desconto: 0,
                    acrescimo: 0,
                    totalGeral: 1260,
                    totais: {
                        subtotal: 1260,
                        desconto: 0,
                        acrescimo: 0,
                        totalGeral: 1260,
                        areaTotalM2: 3,
                        moeda: "BRL"
                    }
                }
            },
            resumo: {
                cliente: { id: cliente.id, nome: cliente.nome },
                projeto: { id: projeto.id, nome: projeto.titulo },
                servico: { id: servico.id, nome: servico.nome, tipoCalculo: servico.tipoCalculo },
                quantidadeProdutos: produtos.length,
                valorTotal: 1260,
                tipoCalculo: "area_m2",
                status: "FINALIZADO",
                totais: {
                    subtotal: 1260,
                    desconto: 0,
                    acrescimo: 0,
                    totalGeral: 1260,
                    areaTotalM2: 3,
                    moeda: "BRL"
                }
            },
            ajustesFinanceiros: {
                descontoTipo: "sem",
                descontoValor: 0,
                acrescimoTipo: "sem",
                acrescimoValor: 0,
                moeda: "BRL"
            },
            observacoes: {
                livre: "Orcamento demo para integracao visual E2E.",
                comerciais: "Valores e dados apenas demonstrativos.",
                tecnicas: "Medidas ilustrativas para validacao do fluxo."
            },
            condicoesComerciais: {
                formaPagamento: "A combinar",
                prazoEntrega: "7 dias uteis",
                validadeProposta: "7 dias"
            },
            orcamentoPreparado: {
                preparadoPara: "PDF_COMERCIAL",
                versao: "DEMO_E2E",
                status: "FINALIZADO",
                geradoEm: agora,
                cliente,
                projeto,
                servico,
                produtos,
                calculo: {
                    tipoCalculo: "ORCAMENTO_ITENS",
                    itens: produtos,
                    descontoTipo: "sem",
                    descontoValor: 0,
                    acrescimoTipo: "sem",
                    acrescimoValor: 0
                },
                resultado: {
                    sucesso: true,
                    tipo: "ORCAMENTO_ITENS",
                    valorCalculado: 1260,
                    unidade: "BRL",
                    detalhes: {
                        itens: produtos,
                        areaTotalM2: 3,
                        subtotal: 1260,
                        desconto: 0,
                        acrescimo: 0,
                        totalGeral: 1260,
                        totais: {
                            subtotal: 1260,
                            desconto: 0,
                            acrescimo: 0,
                            totalGeral: 1260,
                            areaTotalM2: 3,
                            moeda: "BRL"
                        }
                    }
                },
                totais: {
                    subtotal: 1260,
                    desconto: 0,
                    acrescimo: 0,
                    totalGeral: 1260,
                    areaTotalM2: 3,
                    moeda: "BRL"
                },
                ajustesFinanceiros: {
                    descontoTipo: "sem",
                    descontoValor: 0,
                    acrescimoTipo: "sem",
                    acrescimoValor: 0,
                    moeda: "BRL"
                },
                observacoes: {
                    livre: "Orcamento demo para integracao visual E2E.",
                    comerciais: "Valores e dados apenas demonstrativos.",
                    tecnicas: "Medidas ilustrativas para validacao do fluxo."
                },
                condicoesComerciais: {
                    formaPagamento: "A combinar",
                    prazoEntrega: "7 dias uteis",
                    validadeProposta: "7 dias"
                },
                resumo: {
                    cliente: { id: cliente.id, nome: cliente.nome },
                    projeto: { id: projeto.id, nome: projeto.titulo },
                    servico: { id: servico.id, nome: servico.nome, tipoCalculo: servico.tipoCalculo },
                    quantidadeProdutos: produtos.length,
                    valorTotal: 1260,
                    tipoCalculo: "area_m2",
                    status: "FINALIZADO",
                    totais: {
                        subtotal: 1260,
                        desconto: 0,
                        acrescimo: 0,
                        totalGeral: 1260,
                        areaTotalM2: 3,
                        moeda: "BRL"
                    }
                }
            },
            historico: [],
            criadoEm: agora,
            atualizadoEm: agora
        };
    },

    criarDocumentoDemo(orcamentoAtual = {}) {
        if (typeof DocumentService !== "undefined" && typeof DocumentService.gerarDocumento === "function") {
            try {
                return DocumentService.gerarDocumento(orcamentoAtual);
            } catch (erro) {
                return this.criarDocumentoFallback(orcamentoAtual);
            }
        }

        return this.criarDocumentoFallback(orcamentoAtual);
    },

    criarDocumentoFallback(orcamentoAtual = {}) {
        const agora = new Date().toISOString();
        const dados = orcamentoAtual.orcamentoPreparado || orcamentoAtual;

        return {
            tipo: "DOCUMENTO_COMERCIAL",
            versao: "DEMO_E2E",
            metadados: {
                origem: "ORCAMENTO_INTELIGENTE",
                status: "PREPARADO",
                geradoEm: agora,
                demo: true
            },
            dados: {
                empresa: { nome: "RK Vidracaria" },
                cliente: dados.cliente || orcamentoAtual.cliente || {},
                projeto: dados.projeto || orcamentoAtual.projeto || {},
                servico: dados.servico || orcamentoAtual.servico || {},
                produtos: dados.produtos || orcamentoAtual.produtos || [],
                totais: dados.totais || orcamentoAtual.resumo?.totais || {},
                resumoFinanceiro: {
                    totalGeral: dados.totais?.totalGeral || orcamentoAtual.resumo?.valorTotal || 0,
                    quantidadeProdutos: (dados.produtos || orcamentoAtual.produtos || []).length,
                    status: "PREPARADO"
                },
                observacoes: dados.observacoes || orcamentoAtual.observacoes || {},
                condicoesComerciais: dados.condicoesComerciais || orcamentoAtual.condicoesComerciais || {},
                validade: { descricao: "7 dias" },
                metadados: {
                    origem: "ORCAMENTO_INTELIGENTE",
                    status: "PREPARADO",
                    geradoEm: agora
                }
            },
            secoes: {},
            ordem: []
        };
    },

    garantirDocumento(estado = {}) {
        const documento = estado.documentoAtual || {};
        const possuiSecoes = documento.secoes &&
            documento.secoes.cabecalho &&
            documento.secoes.cliente &&
            documento.secoes.projeto &&
            documento.secoes.produtos &&
            documento.secoes.totais &&
            documento.secoes.rodape;

        if (possuiSecoes || !estado.orcamentoAtual) {
            return estado;
        }

        return {
            ...estado,
            documentoAtual: this.criarDocumentoDemo(estado.orcamentoAtual)
        };
    },

    hidratarAppState(estado = {}) {
        const appState = this.obterAppStateService();

        if (!appState || typeof appState.setState !== "function") {
            return false;
        }

        [
            "usuarioAtual",
            "clienteSelecionado",
            "projetoSelecionado",
            "projetoAtual",
            "orcamentoAtual",
            "documentoAtual",
            "statusComercial",
            "ordemAtual",
            "configuracoes"
        ].forEach(chave => {
            if (estado[chave] !== undefined) {
                appState.setState(chave, estado[chave]);
            }
        });

        return true;
    },

    renderizarAvisoDemo(estado = {}) {
        if (!estado.demo || document.querySelector("[data-rk-demo-banner='true']")) {
            return false;
        }

        const main = document.querySelector("main");
        if (!main) {
            return false;
        }

        const aviso = document.createElement("div");
        aviso.className = "rk-demo-banner";
        aviso.dataset.rkDemoBanner = "true";
        aviso.textContent = "Fluxo de demonstracao: dados locais para teste online, sem banco externo.";
        main.insertBefore(aviso, main.firstChild);
        return true;
    },

    obterAppStateService() {
        if (typeof AppStateService !== "undefined" && AppStateService) {
            return AppStateService;
        }

        if (typeof AppState !== "undefined" && AppState) {
            return AppState;
        }

        return null;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    RKE2EDemoState.iniciar();
});
