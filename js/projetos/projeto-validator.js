const ProjetoValidator = {
    validar(projeto = {}) {
        const erros = [];

        if (!projeto || typeof projeto !== "object") {
            return {
                valido: false,
                erros: ["Projeto invalido."]
            };
        }

        if (!String(projeto.descricao || projeto.titulo || projeto.nome || "").trim()) {
            erros.push("Descricao do projeto e obrigatoria.");
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
