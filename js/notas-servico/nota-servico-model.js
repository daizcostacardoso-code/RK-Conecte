const NotaServicoModel = {
    chaveRascunho: "rk_nota_servico_rascunho",
    chaveHistorico: "rk_notas_servico_emitidas",
    chaveSequencia: "rk_nota_servico_sequencia",

    dataHoje() { const partes = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Bahia", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const valor = tipo => partes.find(parte => parte.type === tipo)?.value; return `${valor("year")}-${valor("month")}-${valor("day")}`; },
    texto(valor, limite = 1200) { return String(valor ?? "").trim().slice(0, limite); },
    numero(valor, permiteZero = false) {
        let texto = String(valor ?? "").trim().replace(/\s/g, "").replace(/^R\$/i, "");
        if (!texto) return null;
        if (texto.includes(",")) texto = texto.replace(/\./g, "").replace(",", ".");
        const numero = Number(texto);
        return Number.isFinite(numero) && (permiteZero ? numero >= 0 : numero > 0) ? numero : null;
    },
    moeda(valor) { return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); },
    formatarNumero(valor) { return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 }); },
    proximoNumero() {
        let sequencia = 1;
        try { sequencia = Math.max(1, Number(localStorage.getItem(this.chaveSequencia) || 1)); } catch (_) {}
        return `NS-${this.dataHoje().replace(/-/g, "")}-${String(sequencia).padStart(3, "0")}`;
    },
    avancarSequencia() {
        try { localStorage.setItem(this.chaveSequencia, String(Number(localStorage.getItem(this.chaveSequencia) || 1) + 1)); } catch (_) {}
    },
    prepararNumeroNovaNota(numeroAtual = "") {
        const atual = this.texto(numeroAtual, 30);
        if (atual && this.proximoNumero() === atual) this.avancarSequencia();
        return this.proximoNumero();
    },
    estadoVazio() {
        return {
            id: `nota-${Date.now()}-${Math.random().toString(16).slice(2)}`, numeroNota: this.proximoNumero(), dataEmissao: this.dataHoje(), dataConclusao: this.dataHoje(), status: "Concluído",
            responsavel: "", localServico: "", clienteNome: "", clienteDocumento: "", clienteTelefone: "", clienteEndereco: "", clienteEmail: "", servicos: [], desconto: 0,
            formaPagamento: "Pix", condicaoPagamento: "", garantia: "", referencia: "", observacoes: "", emitidaEm: "", atualizadoEm: new Date().toISOString()
        };
    },
    criarServico(dados) {
        const descricao = this.texto(dados.descricao, 200); const quantidade = this.numero(dados.quantidade); const valorUnitario = this.numero(dados.valorUnitario, true); const erros = [];
        if (!descricao) erros.push("Informe a descrição do serviço.");
        if (quantidade === null) erros.push("Informe uma quantidade válida.");
        if (valorUnitario === null) erros.push("Informe um valor unitário válido.");
        if (erros.length) return { erros };
        return { erros: [], servico: { id: dados.id || `servico-${Date.now()}-${Math.random().toString(16).slice(2)}`, descricao, quantidade, unidade: this.texto(dados.unidade, 20) || "un.", valorUnitario } };
    },
    subtotal(estado) { return estado.servicos.reduce((total, item) => total + Number(item.quantidade) * Number(item.valorUnitario), 0); },
    total(estado) { return Math.max(0, this.subtotal(estado) - Number(estado.desconto || 0)); },
    validar(estado) {
        const erros = [];
        if (!this.texto(estado.numeroNota, 30)) erros.push("Informe o número da nota.");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(estado.dataEmissao || "")) erros.push("Informe a data de emissão.");
        if (!this.texto(estado.clienteNome, 120)) erros.push("Informe o nome do cliente.");
        if (!estado.servicos.length) erros.push("Adicione pelo menos um serviço.");
        const desconto = this.numero(estado.desconto, true);
        if (desconto === null) erros.push("Informe um desconto válido.");
        if (desconto !== null && desconto > this.subtotal(estado)) erros.push("O desconto não pode ser maior que o subtotal.");
        return erros;
    },
    normalizar(estado) { return { ...this.estadoVazio(), ...estado, servicos: Array.isArray(estado?.servicos) ? estado.servicos : [], desconto: Number(estado?.desconto || 0) }; },
    salvarRascunho(estado) { try { estado.atualizadoEm = new Date().toISOString(); localStorage.setItem(this.chaveRascunho, JSON.stringify(estado)); return true; } catch (_) { return false; } },
    carregarRascunho() { try { const salvo = JSON.parse(localStorage.getItem(this.chaveRascunho) || "null"); return salvo ? this.normalizar(salvo) : this.estadoVazio(); } catch (_) { return this.estadoVazio(); } },
    limparRascunho() { try { localStorage.removeItem(this.chaveRascunho); } catch (_) {} },
    historico() { try { const itens = JSON.parse(localStorage.getItem(this.chaveHistorico) || "[]"); return Array.isArray(itens) ? itens.map(item => this.normalizar(item)) : []; } catch (_) { return []; } },
    registrarEmissao(estado) {
        const historico = this.historico(); const indice = historico.findIndex(item => item.id === estado.id); const copia = JSON.parse(JSON.stringify({ ...estado, emitidaEm: new Date().toISOString(), atualizadoEm: new Date().toISOString() }));
        if (indice >= 0) historico[indice] = copia; else historico.unshift(copia);
        try { localStorage.setItem(this.chaveHistorico, JSON.stringify(historico.slice(0, 50))); return true; } catch (_) { return false; }
    },
    excluirHistorico(id) { try { localStorage.setItem(this.chaveHistorico, JSON.stringify(this.historico().filter(item => item.id !== id))); return true; } catch (_) { return false; } }
};
