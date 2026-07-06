const Login = {
    chaveConfig: "vidracaria_configuracoes_sistema",

    obterConfiguracoes() {
        try {
            const salvas = JSON.parse(localStorage.getItem(this.chaveConfig) || "{}");
            return {
                usuario: salvas.usuario || "admin",
                senha: salvas.senha || "1234",
                nomeUsuario: salvas.nomeUsuario || "Funcionário RK",
                fotoUsuario: salvas.fotoUsuario || ""
            };
        } catch (erro) {
            return { usuario: "admin", senha: "1234", nomeUsuario: "Funcionário RK", fotoUsuario: "" };
        }
    },

    entrar(event) {
        event.preventDefault();

        const usuario = document.getElementById("usuario")?.value.trim() || "";
        const senha = document.getElementById("senha")?.value || "";
        const config = this.obterConfiguracoes();

        if (usuario === config.usuario && senha === config.senha) {
            const sessao = {
                usuario: config.usuario,
                nomeUsuario: config.nomeUsuario,
                fotoUsuario: config.fotoUsuario,
                entradaEm: new Date().toISOString()
            };

            if (window.RKAuth) {
                RKAuth.salvarSessao(sessao);
            } else {
                localStorage.setItem("vidracaria_sessao_funcionario", JSON.stringify({
                    logado: true,
                    ...sessao
                }));
                localStorage.setItem("usuarioLogado", JSON.stringify({
                    logado: true,
                    ...sessao
                }));
            }

            window.location.href = "dashboard-comercial.html";
            return;
        }

        const mensagem = document.getElementById("mensagem");
        if (mensagem) mensagem.textContent = "Usuário ou senha incorretos";
    }
};
