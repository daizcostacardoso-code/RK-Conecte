const Util = {

    $(id) {
        return document.getElementById(id);
    },

    numero(valor) {
        if (valor === null || valor === undefined || valor === "") {
            return 0;
        }

        // Se já for número, não converte de novo.
        // Isso evita que 1250.50 vire 125050 ao somar o subtotal.
        if (typeof valor === "number") {
            return valor;
        }

        let texto = valor.toString().trim();

        // Remove símbolos como R$, espaços e outros caracteres.
        texto = texto.replace(/[^0-9,.-]/g, "");

        const temVirgula = texto.includes(",");
        const temPonto = texto.includes(".");

        // Formato brasileiro: 1.250,50
        if (temVirgula && temPonto) {
            texto = texto.replace(/\./g, "").replace(",", ".");
        }
        // Formato brasileiro simples: 1250,50
        else if (temVirgula) {
            texto = texto.replace(",", ".");
        }
        // Formato americano ou número decimal interno: 1250.50
        // Mantém o ponto como separador decimal.

        return Number(texto) || 0;
    },

    moeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    },

    decimal(valor, casas = 3) {
        return Number(valor || 0).toFixed(casas);
    },

    arredondar(valor, casas = 2) {
        return Number(Number(valor || 0).toFixed(casas));
    },

    hoje() {
        return new Date().toLocaleDateString("pt-BR");
    },

    agora() {
        return new Date().toLocaleString("pt-BR");
    }

};