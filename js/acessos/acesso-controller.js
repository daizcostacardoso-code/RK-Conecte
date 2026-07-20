const AcessoController = {
    perfis: [],
    administrador: null,

    async iniciar() {
        await window.RKAuth?.aguardarAutenticacao?.();
        this.registrarEventos();
        this.gerarSenha();
        await this.carregar();
    },

    registrarEventos() {
        document.getElementById("acessoForm")?.addEventListener("submit", evento => this.criar(evento));
        document.getElementById("acessoGerarSenha")?.addEventListener("click", () => this.gerarSenha());
        document.getElementById("acessoCopiarSenha")?.addEventListener("click", () => this.copiarSenhaCriada());
        document.getElementById("acessoTabelaCorpo")?.addEventListener("click", evento => this.acaoTabela(evento));
        document.getElementById("acessoTabelaCorpo")?.addEventListener("change", evento => this.alterarPerfil(evento));
        document.getElementById("acessoBusca")?.addEventListener("input", () => this.renderizar());
        document.getElementById("acessoFiltro")?.addEventListener("change", () => this.renderizar());
    },

    async carregar() {
        const token = window.RKLoading?.start("Carregando os acessos da equipe...");
        this.mostrarAviso("Carregando acessos...");
        try {
            const resultado = await AcessoRepository.listar();
            if (!resultado.sucesso) {
                this.bloquear((resultado.erros || ["Não foi possível abrir esta área."]).join(" "));
                return;
            }
            this.perfis = resultado.perfis;
            this.administrador = resultado.administrador;
            this.mostrarAviso("");
            this.renderizar();
        } finally {
            if (token) window.RKLoading?.finish(token);
        }
    },

    async criar(evento) {
        evento.preventDefault();
        const dados = {
            nome: document.getElementById("acessoNome")?.value.trim() || "",
            email: document.getElementById("acessoEmail")?.value.trim() || "",
            perfil: document.getElementById("acessoPerfil")?.value || "funcionario",
            senhaTemporaria: document.getElementById("acessoSenha")?.value || ""
        };
        const erros = AcessoModel.validarCadastro(dados);
        if (erros.length) return this.mostrarAviso(erros.join(" "), true);
        const botao = document.querySelector("#acessoForm button[type='submit']");
        if (botao) { botao.disabled = true; botao.textContent = "Criando acesso..."; }
        try {
            const resultado = await AcessoRepository.criar(dados);
            if (!resultado.sucesso) return this.mostrarAviso((resultado.erros || []).join(" "), true);
            this.exibirSenhaCriada(dados.email, dados.senhaTemporaria);
            document.getElementById("acessoForm")?.reset();
            document.getElementById("acessoPerfil").value = "funcionario";
            this.gerarSenha();
            this.mostrarAviso("Acesso criado. Entregue a senha temporária de forma segura.");
            await this.carregar();
        } finally {
            if (botao) { botao.disabled = false; botao.textContent = "Criar acesso"; }
        }
    },

    async acaoTabela(evento) {
        const botao = evento.target.closest("button[data-acesso-acao]");
        if (!botao) return;
        const uid = botao.dataset.acessoUid;
        const perfil = this.perfis.find(item => item.uid === uid);
        if (!perfil) return;
        const acao = botao.dataset.acessoAcao;
        if (acao === "recuperar") return this.enviarRecuperacao(perfil);
        if (acao === "alternar") return this.alternarAtivo(perfil);
    },

    async alterarPerfil(evento) {
        const seletor = evento.target.closest("select[data-acesso-perfil]");
        if (!seletor) return;
        const perfil = this.perfis.find(item => item.uid === seletor.dataset.acessoPerfil);
        if (!perfil || perfil.perfil === seletor.value) return;
        if (!window.confirm(`Alterar ${perfil.nome} para ${AcessoModel.rotuloPerfil(seletor.value)}?`)) {
            seletor.value = perfil.perfil;
            return;
        }
        const resultado = await AcessoRepository.atualizar(perfil.uid, { perfil: seletor.value });
        if (!resultado.sucesso) {
            seletor.value = perfil.perfil;
            return this.mostrarAviso((resultado.erros || []).join(" "), true);
        }
        this.mostrarAviso("Perfil atualizado.");
        await this.carregar();
    },

    async alternarAtivo(perfil) {
        const acao = perfil.ativo ? "desativar" : "ativar";
        if (!window.confirm(`${acao[0].toUpperCase()}${acao.slice(1)} o acesso de ${perfil.nome}?`)) return;
        const resultado = await AcessoRepository.atualizar(perfil.uid, { ativo: !perfil.ativo });
        if (!resultado.sucesso) return this.mostrarAviso((resultado.erros || []).join(" "), true);
        this.mostrarAviso(`Acesso ${perfil.ativo ? "desativado" : "ativado"}.`);
        await this.carregar();
    },

    async enviarRecuperacao(perfil) {
        if (!window.confirm(`Enviar recuperação de senha para ${perfil.email}?`)) return;
        const resultado = await AcessoRepository.enviarRecuperacao(perfil.email);
        if (!resultado.sucesso) return this.mostrarAviso((resultado.erros || []).join(" "), true);
        this.mostrarAviso("E-mail de recuperação enviado.");
    },

    renderizar() {
        const busca = (document.getElementById("acessoBusca")?.value || "").trim().toLowerCase();
        const filtro = document.getElementById("acessoFiltro")?.value || "";
        const itens = this.perfis.filter(item => {
            const buscaOk = !busca || [item.nome, item.email].some(valor => String(valor || "").toLowerCase().includes(busca));
            const filtroOk = !filtro || (filtro === "ativo" ? item.ativo : !item.ativo);
            return buscaOk && filtroOk;
        });
        this.texto("acessoResumo", `${this.perfis.filter(item => item.ativo).length} ativo(s) · ${this.perfis.filter(item => !item.ativo).length} desativado(s)`);
        const corpo = document.getElementById("acessoTabelaCorpo");
        if (!corpo) return;
        if (!itens.length) {
            corpo.innerHTML = '<tr><td colspan="6" class="acesso-vazio">Nenhum acesso encontrado.</td></tr>';
            return;
        }
        const uidAtual = window.RKAuth?.obterSessao?.()?.uid || "";
        corpo.innerHTML = itens.map(item => {
            const proprio = item.uid === uidAtual;
            return `<tr>
                <td data-label="Usuário"><strong>${this.escapar(item.nome)}</strong><small>${this.escapar(item.email)}</small></td>
                <td data-label="Perfil"><select data-acesso-perfil="${this.escapar(item.uid)}" ${proprio ? "disabled" : ""}><option value="funcionario" ${item.perfil === "funcionario" ? "selected" : ""}>Funcionário</option><option value="admin" ${item.perfil === "admin" ? "selected" : ""}>Administrador</option></select></td>
                <td data-label="Situação"><span class="acesso-status ${item.ativo ? "ativo" : "inativo"}">${item.ativo ? "Ativo" : "Desativado"}</span></td>
                <td data-label="Último acesso">${this.escapar(this.dataHora(item.ultimoAcessoEm))}</td>
                <td data-label="Atualizado">${this.escapar(this.dataHora(item.atualizadoEmISO || item.criadoEmISO))}</td>
                <td data-label="Ações"><div class="acesso-acoes"><button type="button" data-acesso-acao="recuperar" data-acesso-uid="${this.escapar(item.uid)}">Recuperar senha</button><button type="button" class="${item.ativo ? "perigo" : ""}" data-acesso-acao="alternar" data-acesso-uid="${this.escapar(item.uid)}" ${proprio ? "disabled" : ""}>${item.ativo ? "Desativar" : "Ativar"}</button></div></td>
            </tr>`;
        }).join("");
    },

    gerarSenha() {
        const campo = document.getElementById("acessoSenha");
        if (campo) campo.value = AcessoModel.gerarSenhaTemporaria();
    },
    exibirSenhaCriada(email, senha) {
        const painel = document.getElementById("acessoCredencialCriada");
        if (!painel) return;
        painel.hidden = false;
        this.texto("acessoEmailCriado", email);
        this.texto("acessoSenhaCriada", senha);
    },
    async copiarSenhaCriada() {
        const senha = document.getElementById("acessoSenhaCriada")?.textContent || "";
        if (!senha) return;
        try { await navigator.clipboard.writeText(senha); this.mostrarAviso("Senha temporária copiada."); }
        catch (_) { this.mostrarAviso("Selecione e copie a senha temporária manualmente.", true); }
    },
    bloquear(mensagem) {
        document.getElementById("acessoConteudo")?.setAttribute("hidden", "");
        const bloqueio = document.getElementById("acessoBloqueio");
        if (bloqueio) { bloqueio.hidden = false; bloqueio.textContent = mensagem; }
        this.mostrarAviso(mensagem, true);
    },
    mostrarAviso(mensagem, erro = false) {
        const aviso = document.getElementById("acessoAviso");
        if (!aviso) return;
        aviso.textContent = mensagem || "";
        aviso.className = `acesso-aviso ${mensagem ? "visivel" : ""} ${erro ? "erro" : ""}`.trim();
    },
    dataHora(valor = "") { const data = new Date(valor); return Number.isNaN(data.getTime()) ? "Nunca" : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); },
    texto(id, valor) { const elemento = document.getElementById(id); if (elemento) elemento.textContent = valor; },
    escapar(valor) { return String(valor ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
};

document.addEventListener("DOMContentLoaded", () => void AcessoController.iniciar());
window.AcessoController = AcessoController;
