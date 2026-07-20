const MedicaoModel = {
    chaveRascunho: "rk_medicao_obra_rascunho",
    tipos: ["Janela", "Porta", "Báscula", "Box", "Sacada", "Guarda-corpo", "Espelho", "Vidro fixo", "Fachada", "Outro"],

    estadoVazio() {
        return { clienteNome: "", clienteDocumento: "", clienteTelefone: "", obraEndereco: "", responsavel: "", dataMedicao: this.dataHoje(), observacoesGerais: "", medidas: [] };
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
    salvar(estado) { try { localStorage.setItem(this.chaveRascunho, JSON.stringify(estado)); return true; } catch (_) { return false; } },
    carregar() {
        try {
            const salvo = JSON.parse(localStorage.getItem(this.chaveRascunho) || "null");
            if (!salvo || !Array.isArray(salvo.medidas)) return this.estadoVazio();
            return { ...this.estadoVazio(), ...salvo, medidas: salvo.medidas };
        } catch (_) { return this.estadoVazio(); }
    },
    limpar() { try { localStorage.removeItem(this.chaveRascunho); } catch (_) {} }
};
