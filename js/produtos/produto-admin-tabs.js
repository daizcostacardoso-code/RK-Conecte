const ProdutoAdminTabs = {
    iniciar() {
        this.botoes = Array.from(document.querySelectorAll("[data-cadastro-aba]"));
        this.paineis = Array.from(document.querySelectorAll("[data-cadastro-painel]"));

        if (!this.botoes.length || !this.paineis.length) {
            return false;
        }

        this.botoes.forEach(botao => {
            botao.addEventListener("click", () => this.ativar(botao.dataset.cadastroAba, true));
        });

        this.ativar(this.abaInicial(), false);
        window.addEventListener("hashchange", () => this.ativar(this.abaInicial(), false));
        return true;
    },

    abaInicial() {
        const hash = String(window.location.hash || "").replace("#", "");
        const aliases = {
            produtos: "produtos",
            produto: "produtos",
            itens: "itens",
            tamanhos: "tamanhos",
            tamanho: "tamanhos",
            tamanhos_padrao: "tamanhos",
            "tamanhos-padrao": "tamanhos",
            dependencias: "dependencias",
            dependencia: "dependencias",
            itens_dependencias: "dependencias",
            "itens-e-dependencias": "dependencias",
            projetos: "produtos",
            projeto: "produtos"
        };

        return aliases[hash] || "produtos";
    },

    ativar(aba, atualizarHash) {
        const destino = this.botoes.some(botao => botao.dataset.cadastroAba === aba) ? aba : "produtos";

        this.botoes.forEach(botao => {
            const ativo = botao.dataset.cadastroAba === destino;
            botao.classList.toggle("cadastro-aba-ativa", ativo);
            botao.setAttribute("aria-selected", String(ativo));
            botao.tabIndex = ativo ? 0 : -1;
        });

        this.paineis.forEach(painel => {
            const ativo = painel.dataset.cadastroPainel === destino;
            painel.classList.toggle("cadastro-aba-painel-ativa", ativo);
            painel.hidden = !ativo;
        });

        if (atualizarHash) {
            const hash = destino === "produtos" ? "" : `#${destino}`;
            const destinoUrl = `${window.location.pathname}${window.location.search}${hash}`;
            history.replaceState(null, "", destinoUrl);
        }
    }
};

document.addEventListener("DOMContentLoaded", () => ProdutoAdminTabs.iniciar());
