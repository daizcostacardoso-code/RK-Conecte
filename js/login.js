const Login = {
    processando: false,

    async entrar(event) {
        event.preventDefault();
        if (this.processando) return;

        const email = document.getElementById("email")?.value.trim() || "";
        const senha = document.getElementById("senha")?.value || "";
        const autenticacao = window.RKAuth?.obterInstanciaFirebase();

        if (!autenticacao) {
            this.mostrarMensagem("Não foi possível conectar ao serviço de autenticação.");
            return;
        }

        this.alterarProcessamento(true);
        this.mostrarMensagem("");

        try {
            await autenticacao.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            const credencial = await autenticacao.signInWithEmailAndPassword(email, senha);
            if (window.RKAuth) RKAuth.processarEstado(credencial.user);
            else window.location.replace("dashboard-comercial.html");
        } catch (erro) {
            this.mostrarMensagem(this.mensagemErro(erro));
            this.alterarProcessamento(false);
        }
    },

    preparar() {
        const erro = new URLSearchParams(window.location.search).get("erro");
        if (erro === "sessao_expirada") {
            this.mostrarMensagem("Sua sessão terminou. Entre novamente.");
        }
        if (erro === "auth_indisponivel") {
            this.mostrarMensagem("A autenticação está temporariamente indisponível. Verifique a conexão.");
        }

        window.addEventListener("rk:auth-error", event => {
            this.mostrarMensagem(event.detail?.mensagem || "Falha ao iniciar a autenticação.");
        });
    },

    alterarProcessamento(ativo) {
        this.processando = ativo;
        const botao = document.getElementById("loginEntrar");
        if (!botao) return;
        botao.disabled = ativo;
        botao.setAttribute("aria-busy", String(ativo));
        botao.textContent = ativo ? "Entrando..." : "Acessar painel";
    },

    mostrarMensagem(texto) {
        const mensagem = document.getElementById("mensagem");
        if (mensagem) mensagem.textContent = texto || "";
    },

    mensagemErro(erro = {}) {
        const codigo = String(erro.code || "");
        const mensagens = {
            "auth/invalid-email": "Informe um e-mail válido.",
            "auth/user-disabled": "Este usuário está desativado.",
            "auth/invalid-credential": "E-mail ou senha incorretos.",
            "auth/user-not-found": "E-mail ou senha incorretos.",
            "auth/wrong-password": "E-mail ou senha incorretos.",
            "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
            "auth/network-request-failed": "Falha de conexão. Verifique a internet e tente novamente.",
            "auth/unauthorized-domain": "Este endereço ainda não foi autorizado no Firebase Authentication."
        };
        return mensagens[codigo] || "Não foi possível entrar. Tente novamente.";
    }
};

if (typeof window !== "undefined") {
    window.Login = Login;
    document.addEventListener("DOMContentLoaded", () => Login.preparar());
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { Login };
}
