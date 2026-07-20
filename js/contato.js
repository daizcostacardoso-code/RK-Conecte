const Contato = {
    chaveSolicitacoes: Config.storage.solicitacoesSite,

    iniciar() {
        const form = Util.$("formSolicitacao");

        if (!form) return;

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            this.salvarSolicitacao();
        });
    },

    salvarSolicitacao() {
        const pedido = {
            nome: Util.$("solicitacaoNome")?.value || "",
            email: Util.$("solicitacaoEmail")?.value || "",
            telefone: Util.$("solicitacaoTelefone")?.value || "",
            mensagem: Util.$("solicitacaoMensagem")?.value || "",
            data: Util.agora(),
            status: "Solicitado"
        };

        const solicitacoes = Storage.carregar(this.chaveSolicitacoes, []);
        solicitacoes.push(pedido);
        Storage.salvar(this.chaveSolicitacoes, solicitacoes);

        const form = Util.$("formSolicitacao");
        if (form) form.reset();

        const mensagem = Util.$("mensagemSolicitacao");
        if (mensagem) {
            mensagem.textContent = "Mensagem enviada com sucesso! Sua solicitação foi registrada.";
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    Contato.iniciar();
});
