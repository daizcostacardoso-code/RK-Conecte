const Storage = {
    salvar(chave, dados) {
        try {
            localStorage.setItem(chave, JSON.stringify(dados));
            return true;
        } catch (erro) {
            console.error("Erro ao salvar no armazenamento local:", erro);
            alert("Não foi possível salvar os dados neste navegador. Verifique se o modo anônimo ou bloqueio de armazenamento está ativo.");
            return false;
        }
    },

    carregar(chave, valorPadrao = null) {
        try {
            const dados = localStorage.getItem(chave);

            if (dados === null || dados === undefined || dados === "") {
                return valorPadrao;
            }

            return JSON.parse(dados);
        } catch (erro) {
            console.error("Erro ao carregar dados do armazenamento local:", erro);
            return valorPadrao;
        }
    },

    remover(chave) {
        try {
            localStorage.removeItem(chave);
        } catch (erro) {
            console.error("Erro ao remover dados do armazenamento local:", erro);
        }
    },

    limparTudo() {
        try {
            localStorage.clear();
        } catch (erro) {
            console.error("Erro ao limpar armazenamento local:", erro);
        }
    },

    disponivel() {
        try {
            const chaveTeste = "rk_teste_storage";
            localStorage.setItem(chaveTeste, "ok");
            localStorage.removeItem(chaveTeste);
            return true;
        } catch (erro) {
            return false;
        }
    }
};
