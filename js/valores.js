const Valores = {
    campos: [
        "mm4",
        "mm6",
        "mm8",
        "mm10",
        "valorIncolor",
        "percIncolor",
        "valorFume",
        "percFume",
        "valorVerde",
        "percVerde",
        "valorBronze",
        "percBronze",
        "aluminio"
    ],

    async iniciar() {
        await this.carregar();
        this.registrarEventos();
    },

    registrarEventos() {
        const form = document.querySelector("form");

        if (form) {
            form.addEventListener("submit", async (event) => {
                event.preventDefault();
                await this.salvar(true);
            });
        }

        const btnSalvar = document.getElementById("btnSalvarValores");
        if (btnSalvar) {
            btnSalvar.addEventListener("click", async () => {
                await this.salvar(true);
            });
        }

        const btnLimpar = document.getElementById("btnLimparValores");
        if (btnLimpar) {
            btnLimpar.addEventListener("click", async () => {
                if (!confirm("Deseja limpar todos os valores cadastrados?")) return;
                this.limparCampos();
                await this.salvar(true);
            });
        }

        this.campos.forEach(id => {
            const campo = document.getElementById(id);

            if (!campo) return;

            campo.addEventListener("input", () => {
                this.atualizarDestaqueCampo(campo);
            });

            campo.addEventListener("change", async () => {
                this.atualizarDestaqueCampo(campo);
                await this.salvar(false);
            });
        });
    },

    atualizarDestaqueCampo(campo) {
        const wrapper = campo.closest(".campo-valor");
        if (!wrapper) return;

        const valor = String(campo.value || "").trim();
        const numero = Number(valor.replace(".", "").replace(",", "."));

        if (valor !== "" && !Number.isNaN(numero) && numero !== 0) {
            wrapper.classList.add("preenchido");
        } else {
            wrapper.classList.remove("preenchido");
        }
    },

    atualizarDestaques() {
        this.campos.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) {
                this.atualizarDestaqueCampo(campo);
            }
        });
    },

    obterDados() {
        const dados = {};

        this.campos.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) this.atualizarDestaqueCampo(campo);
            dados[id] = campo ? campo.value : "0";
        });

        // Mantém a chave antiga para não perder valores já salvos no navegador/Firestore.
        dados.despesa = dados.aluminio || dados.despesa || "0";
        dados.atualizadoEm = new Date().toISOString();

        return dados;
    },

    preencherCampos(dados) {
        if (dados && !dados.aluminio && dados.despesa) {
            dados.aluminio = dados.despesa;
        }

        this.campos.forEach(id => {
            const campo = document.getElementById(id);

            if (campo) {
                campo.value = dados[id] || "";
                this.atualizarDestaqueCampo(campo);
            }
        });
    },

    limparCampos() {
        this.campos.forEach(id => {
            const campo = document.getElementById(id);

            if (campo) {
                campo.value = "";
                this.atualizarDestaqueCampo(campo);
            }
        });
    },

    mostrarMensagem(texto, sucesso = true) {
        const mensagem = document.getElementById("mensagemValores");

        if (mensagem) {
            mensagem.textContent = texto;
            mensagem.style.color = sucesso ? "#0b7a35" : "#bb2d3b";
        }
    },

    async salvar(mostrarMensagem = true) {
        const dados = this.obterDados();

        try {
            if (typeof db === "undefined" || !db) {
                throw new Error("Serviço de dados temporariamente indisponível.");
            }

            await db.collection("configuracoes")
                .doc("valores")
                .set(dados);

            localStorage.setItem(Config.storage.valores, JSON.stringify(dados));

            if (mostrarMensagem) {
                this.mostrarMensagem("Valores salvos com sucesso na nuvem.");
            }
        } catch (erro) {
            console.error("Erro ao salvar valores no Firestore:", erro);

            localStorage.setItem(Config.storage.valores, JSON.stringify(dados));

            if (mostrarMensagem) {
                this.mostrarMensagem("Não foi possível salvar na nuvem. Os valores foram salvos neste dispositivo.", false);
            }
        }
    },

    async carregar() {
        try {
            if (typeof db === "undefined" || !db) {
                throw new Error("Serviço de dados temporariamente indisponível.");
            }

            const documento = await db.collection("configuracoes")
                .doc("valores")
                .get();

            if (documento.exists) {
                const dados = documento.data();
                this.preencherCampos(dados);
                localStorage.setItem(Config.storage.valores, JSON.stringify(dados));
                return;
            }

            const local = localStorage.getItem(Config.storage.valores);

            if (local) {
                this.preencherCampos(JSON.parse(local));
            }

        } catch (erro) {
            console.error("Erro ao carregar valores do Firestore:", erro);

            const local = localStorage.getItem(Config.storage.valores);

            if (local) {
                this.preencherCampos(JSON.parse(local));
            }
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    void (window.RKLoading?.initial
        ? RKLoading.initial(() => Valores.iniciar(), "Carregando configuracoes...")
        : Valores.iniciar());
});
