const MedicaoModel = {
    chaveRascunho: "rk_medicao_obra_rascunho",
    chaveRascunhoBase: "rk_medicao_obra_rascunho",
    contexto: { projetoId: "", orcamentoId: "" },
    tipos: ["Janela", "Porta", "Báscula", "Box", "Sacada", "Guarda-corpo", "Espelho", "Vidro fixo", "Fachada", "Outro"],

    configurarContexto(contexto = {}) {
        this.contexto = {
            projetoId: this.texto(contexto.projetoId, 120),
            orcamentoId: this.texto(contexto.orcamentoId, 120)
        };
        const escopo = this.contexto.projetoId
            ? this.contexto.projetoId.replace(/[^a-zA-Z0-9_-]+/g, "_")
            : "avulsa";
        this.chaveRascunho = `${this.chaveRascunhoBase}:${escopo}`;
        return this.contexto;
    },

    estadoVazio() {
        return { projetoId: this.contexto.projetoId, orcamentoId: this.contexto.orcamentoId, clienteNome: "", clienteDocumento: "", clienteTelefone: "", obraEndereco: "", responsavel: "", dataMedicao: this.dataHoje(), observacoesGerais: "", medidas: [] };
    },
    dataHoje() { return new Date().toISOString().slice(0, 10); },
    texto(valor, limite = 1000) { return String(valor ?? "").trim().slice(0, limite); },
    numeroDecimal(valor) {
        const texto = String(valor ?? "").trim().replace(/\s/g, "").replace(",", ".");
        if (!/^\d+(?:\.\d+)?$/.test(texto)) return null;
        const numero = Number(texto);
        return Number.isFinite(numero) && numero > 0 ? numero : null;
    },
    formatarNumero(valor) { return Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 }); },
    formatarDimensoes(medida) { return `${this.formatarNumero(medida.altura)} × ${this.formatarNumero(medida.largura)} cm`; },
    criarMedida(dados) {
        const quantidade = Number(dados.quantidade);
        const tipo = this.texto(dados.tipo, 40);
        const altura = this.numeroDecimal(dados.altura);
        const largura = this.numeroDecimal(dados.largura);
        const erros = [];
        if (!Number.isInteger(quantidade) || quantidade < 1) erros.push("Informe uma quantidade inteira maior que zero.");
        if (!this.tipos.includes(tipo)) erros.push("Selecione um tipo de medida.");
        if (altura === null) erros.push("Informe uma altura válida em centímetros.");
        if (largura === null) erros.push("Informe uma largura válida em centímetros.");
        if (erros.length) return { erros };
        return { medida: { id: dados.id || `medida-${Date.now()}-${Math.random().toString(16).slice(2)}`, quantidade, tipo, descricao: this.texto(dados.descricao, 160), altura, largura, observacao: this.texto(dados.observacao, 240) }, erros: [] };
    },
    salvar(estado) { try { localStorage.setItem(this.chaveRascunho, JSON.stringify({ ...estado, projetoId: this.contexto.projetoId || estado.projetoId || "", orcamentoId: this.contexto.orcamentoId || estado.orcamentoId || "" })); return true; } catch (_) { return false; } },
    carregar() {
        try {
            const atual = localStorage.getItem(this.chaveRascunho);
            const legado = !this.contexto.projetoId ? localStorage.getItem(this.chaveRascunhoBase) : null;
            const salvo = JSON.parse(atual || legado || "null");
            if (!salvo || !Array.isArray(salvo.medidas)) return this.estadoVazio();
            const normalizado = { ...this.estadoVazio(), ...salvo, projetoId: this.contexto.projetoId || salvo.projetoId || "", orcamentoId: this.contexto.orcamentoId || salvo.orcamentoId || "", medidas: salvo.medidas };
            if (!atual && legado) this.salvar(normalizado);
            return normalizado;
        } catch (_) { return this.estadoVazio(); }
    },
    limpar() { try { localStorage.removeItem(this.chaveRascunho); } catch (_) {} }
};

if (typeof window !== "undefined") window.MedicaoModel = MedicaoModel;
if (typeof module !== "undefined" && module.exports) module.exports = { MedicaoModel };
