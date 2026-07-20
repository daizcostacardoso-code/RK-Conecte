const CaixaValidator = {
    tiposPermitidos: ["entrada", "saida"],
    statusPermitidos: ["confirmado", "pendente", "cancelado"],

    validar(movimento = {}) {
        const erros = [];
        const normalizado = window.CaixaModel
            ? CaixaModel.criar(movimento)
            : movimento;

        if (!String(normalizado.descricao || "").trim()) {
            erros.push("Informe uma descricao para o lancamento.");
        }

        if (!this.tiposPermitidos.includes(normalizado.tipo)) {
            erros.push('Tipo deve ser "entrada" ou "saida".');
        }

        if (!this.statusPermitidos.includes(normalizado.status)) {
            erros.push('Status deve ser "confirmado", "pendente" ou "cancelado".');
        }

        if (!Number.isFinite(Number(normalizado.valor)) || Number(normalizado.valor) <= 0) {
            erros.push("Valor deve ser maior que zero.");
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(normalizado.data || ""))) {
            erros.push("Data deve estar no formato AAAA-MM-DD.");
        }

        return {
            valido: erros.length === 0,
            erros,
            dados: normalizado
        };
    }
};

window.CaixaValidator = CaixaValidator;
