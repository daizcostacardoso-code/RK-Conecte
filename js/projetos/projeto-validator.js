const ProjetoValidator = {
    validar(projeto = {}) {
        const erros = [];

        if (!projeto || typeof projeto !== "object") {
            return {
                valido: false,
                erros: ["Projeto invalido."]
            };
        }

        if (!String(projeto.titulo || projeto.nome || "").trim()) {
            erros.push("Nome do projeto e obrigatorio.");
        }

        if (!String(projeto.cliente?.nome || projeto.clienteNome || "").trim()) {
            erros.push("Cliente do projeto e obrigatorio.");
        }

        if (!this.statusValido(projeto.status)) {
            erros.push("Status do projeto invalido.");
        }

        return {
            valido: erros.length === 0,
            erros
        };
    },

    statusValido(status) {
        if (typeof ProjetoStatus !== "undefined" && typeof ProjetoStatus.valido === "function") {
            return ProjetoStatus.valido(status);
        }

        return !!status;
    }
};
