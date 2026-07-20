const ClienteValidator = {
    tiposPessoaValidos: ["fisica", "juridica"],

    validar(cliente = {}) {
        const erros = [];

        if (!cliente || typeof cliente !== "object") {
            return {
                valido: false,
                erros: ["Cliente invalido."]
            };
        }

        if (!String(cliente.nome || "").trim()) {
            erros.push("Nome do cliente e obrigatorio.");
        }

        if (!this.tipoPessoaValido(cliente.tipoPessoa)) {
            erros.push("Tipo de pessoa invalido.");
        }

        this.validarTelefone(cliente.telefonePrincipal, "Telefone principal", erros);
        this.validarTelefone(cliente.telefoneSecundario, "Telefone secundario", erros);

        if (cliente.cpfCnpj && !this.cpfCnpjValido(cliente.cpfCnpj, cliente.tipoPessoa)) {
            erros.push("CPF/CNPJ invalido.");
        }

        return {
            valido: erros.length === 0,
            erros
        };
    },

    tipoPessoaValido(tipoPessoa) {
        return this.tiposPessoaValidos.includes(this.normalizarTipoPessoa(tipoPessoa));
    },

    validarTelefone(telefone, campo, erros) {
        if (!telefone) return true;

        const digitos = this.somenteDigitos(telefone);
        const valido = digitos.length >= 10 && digitos.length <= 11;

        if (!valido) {
            erros.push(`${campo} invalido.`);
        }

        return valido;
    },

    cpfCnpjValido(valor, tipoPessoa) {
        const digitos = this.somenteDigitos(valor);
        const tipo = this.normalizarTipoPessoa(tipoPessoa);

        if (tipo === "juridica") {
            return digitos.length === 14;
        }

        return digitos.length === 11;
    },

    normalizarTipoPessoa(tipoPessoa) {
        const texto = String(tipoPessoa || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const limpo = texto.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

        if (["juridica", "pessoa_juridica", "pj"].includes(limpo)) {
            return "juridica";
        }

        if (["fisica", "pessoa_fisica", "pf"].includes(limpo)) {
            return "fisica";
        }

        return limpo;
    },

    somenteDigitos(valor) {
        return String(valor || "").replace(/\D/g, "");
    }
};
