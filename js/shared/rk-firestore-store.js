(function () {
    "use strict";

    if (window.RKFirestoreStore) return;

    const RECURSOS = {
        clientes: { colecao: "clientes", id: "cliente_id", excluir: "inativar" },
        produtos: { colecao: "produtos", id: "produto_id", excluir: "inativar" },
        itens: { colecao: "itens", id: "item_id", excluir: "inativar" },
        "item-dependencias": { colecao: "item_dependencias", id: "dependencia_id", excluir: "remover" },
        "tamanhos-padrao": { colecao: "tamanhos_padrao", id: "tamanho_id", excluir: "inativar" },
        unidades: { colecao: "unidades_medida", id: "unidade_id", somenteLeitura: true },
        "categorias-produtos": { colecao: "categorias_produto", id: "categoria_id", somenteLeitura: true },
        "categorias-itens": { colecao: "categorias_item", id: "categoria_item_id", somenteLeitura: true },
        caixa: { colecao: "caixa_empresa", id: "caixa_id", excluir: "cancelar" },
        orcamentos: { colecao: "orcamentos_emitidos", id: "orcamento_id", excluir: "cancelar" },
        notas: { colecao: "notas_servico", id: "nota_id", excluir: "cancelar" }
    };

    function banco() {
        if (typeof db === "undefined" || !db) throw new Error("Dados temporariamente indisponiveis.");
        return db;
    }

    function uuid() {
        const id = globalThis.crypto?.randomUUID?.()
            || `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
        return `rk_${String(id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
    }

    function idDocumento(valor) {
        return String(valor || uuid())
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || uuid();
    }

    function extrairSequenciaNumerica(valor) {
        const correspondencia = String(valor ?? "").match(/(\d+)(?!.*\d)/);
        const numero = correspondencia ? Number(correspondencia[1]) : 0;
        return Number.isSafeInteger(numero) && numero > 0 ? numero : 0;
    }

    async function maiorNumeroOrcamentoExistente() {
        const snapshot = await banco().collection(RECURSOS.orcamentos.colecao).get();
        return snapshot.docs.reduce((maior, doc) => {
            const dados = doc.data() || {};
            const candidatos = [
                doc.id,
                dados.numero,
                dados.numero_orcamento,
                dados.registro?.numero,
                dados.registro?.numero_orcamento
            ];
            return Math.max(maior, ...candidatos.map(extrairSequenciaNumerica));
        }, 0);
    }

    async function reservarNumeroOrcamento() {
        const firestore = banco();
        const sequenciaRef = firestore.collection("configuracoes").doc("sequencia_orcamentos");
        const sequenciaExistente = await sequenciaRef.get();
        const maiorExistente = sequenciaExistente.exists ? 0 : await maiorNumeroOrcamentoExistente();

        const proximoNumero = await firestore.runTransaction(async transaction => {
            const sequenciaSnapshot = await transaction.get(sequenciaRef);
            const sequenciaAtual = sequenciaSnapshot.exists
                ? extrairSequenciaNumerica(sequenciaSnapshot.data()?.ultimoNumero)
                : 0;
            const proximo = Math.max(sequenciaAtual, maiorExistente) + 1;

            transaction.set(sequenciaRef, {
                ultimoNumero: proximo,
                atualizadoEmISO: new Date().toISOString(),
                origem: "ORCAMENTOS"
            }, { merge: true });

            return proximo;
        });

        return String(proximoNumero).padStart(6, "0");
    }

    function analisar(caminho) {
        const url = new URL(caminho, "https://firestore.local");
        const partes = url.pathname.split("/").filter(Boolean);
        let recurso = partes[0] || "";
        let id = partes[1] || "";
        if (recurso === "categorias" && ["produtos", "itens"].includes(id)) {
            recurso = `categorias-${id}`;
            id = "";
        }
        const config = RECURSOS[recurso];
        if (!config) throw new Error(`Recurso desconhecido: ${recurso}.`);
        return { recurso, config, id: decodeURIComponent(id), url };
    }

    function resposta(corpo, status = 200) {
        return new Response(JSON.stringify(corpo), {
            status,
            headers: { "Content-Type": "application/json", "X-RK-Storage": "firestore" }
        });
    }

    function corpo(opcoes = {}) {
        if (!opcoes.body) return {};
        if (typeof opcoes.body === "string") {
            try { return JSON.parse(opcoes.body); } catch (_) { return {}; }
        }
        return JSON.parse(JSON.stringify(opcoes.body));
    }

    function normalizar(recurso, dados = {}, documentoId = "") {
        const registro = { ...dados, _rkDocumentoId: documentoId };
        if (recurso === "caixa") {
            return {
                ...registro,
                caixa_id: registro.caixa_id || registro.idFirestore || registro.idLocal || documentoId,
                data_movimento: String(registro.data_movimento || registro.data || "").slice(0, 10),
                forma_pagamento: registro.forma_pagamento || registro.formaPagamento || "Nao informado",
                cliente_id: registro.cliente_id ?? registro.clienteId ?? null,
                orcamento_id: registro.orcamento_id ?? registro.orcamentoId ?? null,
                usuario_id: registro.usuario_id ?? registro.usuarioId ?? null,
                mes_referencia: registro.mes_referencia || registro.mesReferencia || "",
                ano_referencia: registro.ano_referencia ?? registro.anoReferencia ?? null,
                dia_referencia: registro.dia_referencia ?? registro.diaReferencia ?? null,
                criado_em: registro.criado_em || registro.criadoEmISO || registro.criadoEm || "",
                atualizado_em: registro.atualizado_em || registro.atualizadoEmISO || ""
            };
        }
        return registro;
    }

    async function documentos(rota) {
        const snapshot = await banco().collection(rota.config.colecao).get();
        return snapshot.docs.filter(doc => doc.data()?._rkMetadata !== true);
    }

    function valoresIdentidade(rota, doc) {
        const dados = doc.data() || {};
        return [
            doc.id, dados[rota.config.id], dados.id, dados.numero, dados.numero_orcamento,
            dados.numeroNota, dados.registro?.numero
        ].filter(valor => valor !== undefined && valor !== null).map(String);
    }

    async function localizar(rota, id = rota.id) {
        const procurado = String(id || "");
        return (await documentos(rota)).filter(doc => valoresIdentidade(rota, doc).includes(procurado));
    }

    function filtrar(lista, rota) {
        const busca = String(rota.url.searchParams.get("busca") || rota.url.searchParams.get("cliente") || "").toLowerCase();
        const status = String(rota.url.searchParams.get("status") || "").toLowerCase();
        const numero = String(rota.url.searchParams.get("numero") || "");
        const dataInicial = String(rota.url.searchParams.get("data_inicial") || "");
        const dataFinal = String(rota.url.searchParams.get("data_final") || "");
        const itemId = String(rota.url.searchParams.get("item_id") || "");
        return lista.filter(item => {
            if (item._rkSync?.excluido === true) return false;
            if (busca && !JSON.stringify(item).toLowerCase().includes(busca)) return false;
            if (status === "ativo" && !(item.ativo === true || Number(item.ativo) === 1)) return false;
            if (status === "inativo" && !(item.ativo === false || Number(item.ativo) === 0)) return false;
            if (status && !["ativo", "inativo"].includes(status) && String(item.status || "").toLowerCase() !== status) return false;
            if (numero && String(item.numero_orcamento || item.numero || item.registro?.numero || "") !== numero) return false;
            const data = String(item.data_orcamento || item.dataEmissao || item.registro?.dataEmissao || "").slice(0, 10);
            if (dataInicial && data < dataInicial) return false;
            if (dataFinal && data > dataFinal) return false;
            if (itemId && String(item.item_id || "") !== itemId) return false;
            return true;
        });
    }

    async function listar(rota) {
        const docs = await documentos(rota);
        const lista = filtrar(docs.map(doc => normalizar(rota.recurso, doc.data(), doc.id)), rota);
        if (!rota.id) return resposta({ ok: true, fonte: "firestore", dados: lista });
        const encontrado = lista.find(item => [item[rota.config.id], item.id, item.numero, item.numero_orcamento, item._rkDocumentoId].map(String).includes(rota.id));
        return encontrado
            ? resposta({ ok: true, fonte: "firestore", dados: encontrado })
            : resposta({ ok: false, mensagem: "Registro nao encontrado." }, 404);
    }

    function prepararRegistro(rota, entrada, id) {
        const agora = new Date().toISOString();
        if (rota.recurso === "orcamentos") {
            const registro = entrada.registro || entrada;
            const numero = registro.numero || registro.numero_orcamento || id;
            const cliente = registro.cliente || entrada.cliente || registro.documento?.dados?.cliente || {};
            const projeto = registro.projeto || entrada.projeto || registro.documento?.dados?.projeto || {};
            const vinculosOrigem = entrada.vinculos || registro.vinculos || {};
            const vinculos = {
                solicitacaoId: String(vinculosOrigem.solicitacaoId || entrada.solicitacaoId || registro.solicitacaoId || registro.origemSolicitacaoId || ""),
                clienteId: String(vinculosOrigem.clienteId || entrada.clienteId || registro.clienteId || cliente.id || ""),
                projetoId: String(vinculosOrigem.projetoId || entrada.projetoId || registro.projetoId || projeto.id || "")
            };
            return {
                ...entrada,
                registro,
                id,
                orcamento_id: id,
                numero,
                numero_orcamento: numero,
                data_orcamento: registro.dataEmissao || registro.data_orcamento || agora.slice(0, 10),
                cliente_nome: registro.clienteNome || registro.cliente?.nome || "",
                vinculos,
                solicitacaoId: vinculos.solicitacaoId,
                clienteId: vinculos.clienteId,
                projetoId: vinculos.projetoId,
                status: registro.status || entrada.status || "emitido",
                schemaVersion: Math.max(4, Number.parseInt(entrada.schemaVersion, 10) || 0),
                fonteCanonica: "orcamentos_emitidos",
                atualizado_em: agora,
                criado_em: entrada.criado_em || agora
            };
        }
        return {
            ...entrada,
            [rota.config.id]: id,
            atualizado_em: agora,
            criado_em: entrada.criado_em || agora
        };
    }

    async function criar(rota, entrada) {
        if (rota.config.somenteLeitura) return resposta({ ok: false, mensagem: "Colecao somente leitura." }, 405);
        let id = uuid();
        if (rota.recurso === "orcamentos") {
            const registro = entrada.registro || entrada;
            id = idDocumento(registro.numero || registro.numero_orcamento || id);
            const existentes = await localizar(rota, registro.numero || registro.numero_orcamento || id);
            if (existentes.length) id = existentes[0].id;
        }
        if (rota.recurso === "notas") {
            id = idDocumento(entrada.nota_id || entrada.id || entrada.numeroNota || id);
        }
        const registro = prepararRegistro(rota, entrada, id);
        await banco().collection(rota.config.colecao).doc(id).set(registro, { merge: true });
        return resposta({
            ok: true,
            mensagem: "Registro salvo.",
            dados: registro,
            id,
            insertId: id,
            [rota.config.id]: id
        }, 201);
    }

    async function atualizar(rota, entrada) {
        const encontrados = await localizar(rota);
        if (!encontrados.length) return resposta({ ok: false, mensagem: "Registro nao encontrado." }, 404);
        const agora = new Date().toISOString();
        const lote = banco().batch();
        encontrados.forEach(doc => lote.set(doc.ref, { ...entrada, [rota.config.id]: entrada[rota.config.id] || rota.id, atualizado_em: agora }, { merge: true }));
        await lote.commit();
        return resposta({ ok: true, mensagem: "Registro atualizado.", [rota.config.id]: rota.id });
    }

    async function excluir(rota) {
        const encontrados = await localizar(rota);
        if (!encontrados.length) return resposta({ ok: false, mensagem: "Registro nao encontrado." }, 404);
        const lote = banco().batch();
        if (rota.config.excluir === "inativar") {
            encontrados.forEach(doc => lote.set(doc.ref, { ativo: 0, atualizado_em: new Date().toISOString() }, { merge: true }));
        } else if (rota.config.excluir === "cancelar") {
            const agora = new Date().toISOString();
            encontrados.forEach(doc => {
                const atual = doc.data() || {};
                const historicoStatus = Array.isArray(atual.historicoStatus) ? [...atual.historicoStatus] : [];
                if (rota.recurso === "orcamentos" && atual.status !== "cancelado") {
                    historicoStatus.push({
                        id: `hist_cancelamento_${idDocumento(doc.id)}`,
                        statusAnterior: atual.status || "emitido",
                        statusAtual: "cancelado",
                        acao: "orcamento_cancelado",
                        observacao: "Orcamento cancelado pelo fluxo canonico.",
                        realizadoEm: agora,
                        realizadoPor: null,
                        origem: "RKFirestoreStore"
                    });
                }
                const historicoOperacional = Array.isArray(atual.historicoOperacional) ? [...atual.historicoOperacional] : [];
                if (rota.recurso === "notas" && atual.status !== "cancelado") {
                    historicoOperacional.push({
                        tipo: "ordem_servico_cancelada",
                        status: "cancelado",
                        descricao: "Nota de serviço cancelada com histórico preservado.",
                        data: agora,
                        usuario: "RKFirestoreStore"
                    });
                }
                const aprovacao = rota.recurso === "orcamentos" ? {
                    aprovacao: {
                        ...(atual.aprovacao || {}),
                        status: "cancelado",
                        canceladoEm: agora
                    }
                } : {};
                lote.set(doc.ref, {
                    status: "cancelado",
                    historicoStatus,
                    historicoOperacional,
                    ativo: false,
                    ...aprovacao,
                    atualizado_em: agora,
                    atualizadoEmISO: agora
                }, { merge: true });
            });
        } else {
            encontrados.forEach(doc => lote.delete(doc.ref));
        }
        await lote.commit();
        return resposta({ ok: true, mensagem: "Registro atualizado." });
    }

    async function fetchFirestore(caminho, opcoes = {}) {
        try {
            const rota = analisar(caminho);
            const metodo = String(opcoes.method || "GET").toUpperCase();
            if (metodo === "GET") return listar(rota);
            if (metodo === "POST") return criar(rota, corpo(opcoes));
            if (metodo === "PUT") return atualizar(rota, corpo(opcoes));
            if (metodo === "DELETE") return excluir(rota);
            return resposta({ ok: false, mensagem: "Operacao nao suportada." }, 405);
        } catch (erro) {
            return resposta({ ok: false, mensagem: erro.message || "Erro ao acessar os dados." }, 503);
        }
    }

    window.RKFirestoreStore = {
        fetch: fetchFirestore,
        listar: caminho => fetchFirestore(caminho),
        reservarNumeroOrcamento,
        recursos: Object.keys(RECURSOS)
    };
})();
