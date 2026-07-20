const AcessoModel = {
    perfis: ["admin", "funcionario"],

    normalizar(entrada = {}, uid = "") {
        const perfil = this.perfis.includes(String(entrada.perfil || "").toLowerCase())
            ? String(entrada.perfil).toLowerCase()
            : "funcionario";
        return {
            uid: this.texto(uid || entrada.uid, 128),
            nome: this.texto(entrada.nome, 120),
            email: this.texto(entrada.email, 254).toLowerCase(),
            perfil,
            ativo: entrada.ativo !== false,
            criadoEmISO: this.texto(entrada.criadoEmISO, 40),
            criadoPor: this.texto(entrada.criadoPor, 120),
            atualizadoEmISO: this.texto(entrada.atualizadoEmISO, 40),
            atualizadoPor: this.texto(entrada.atualizadoPor, 120),
            ultimoAcessoEm: this.texto(entrada.ultimoAcessoEm, 40),
            historicoAcesso: Array.isArray(entrada.historicoAcesso) ? entrada.historicoAcesso.slice(-100) : []
        };
    },

    criar(dados = {}, uid = "", administrador = null) {
        const agora = this.agoraISO();
        const autor = this.nomeUsuario(administrador);
        const perfil = this.normalizar({
            ...dados,
            ativo: true,
            criadoEmISO: agora,
            criadoPor: autor,
            atualizadoEmISO: agora,
            atualizadoPor: autor,
            ultimoAcessoEm: "",
            historicoAcesso: [this.evento("acesso_criado", "Acesso criado.", administrador, { perfil: dados.perfil || "funcionario" })]
        }, uid);
        return { perfil, erros: this.validar(perfil) };
    },

    atualizar(atual = {}, alteracoes = {}, administrador = null) {
        const anterior = this.normalizar(atual, atual.uid);
        const destino = this.normalizar({
            ...anterior,
            ...alteracoes,
            atualizadoEmISO: this.agoraISO(),
            atualizadoPor: this.nomeUsuario(administrador)
        }, anterior.uid);
        const erros = this.validar(destino);
        if (alteracoes.ativo === false && this.ehProprioAcesso(destino, administrador)) {
            erros.push("O administrador não pode desativar o próprio acesso.");
        }
        if (alteracoes.perfil && alteracoes.perfil !== "admin" && this.ehProprioAcesso(destino, administrador)) {
            erros.push("O administrador não pode remover o próprio perfil administrativo.");
        }
        if (erros.length) return { sucesso: false, erros, perfil: anterior, alterado: false };
        const eventos = [];
        if (anterior.ativo !== destino.ativo) {
            eventos.push(this.evento(destino.ativo ? "acesso_ativado" : "acesso_desativado", destino.ativo ? "Acesso ativado." : "Acesso desativado.", administrador));
        }
        if (anterior.perfil !== destino.perfil) {
            eventos.push(this.evento("perfil_alterado", `Perfil alterado para ${this.rotuloPerfil(destino.perfil)}.`, administrador, { perfilAnterior: anterior.perfil, perfilAtual: destino.perfil }));
        }
        const perfil = this.normalizar({ ...destino, historicoAcesso: [...anterior.historicoAcesso, ...eventos].slice(-100) }, anterior.uid);
        const alterado = this.assinatura(anterior) !== this.assinatura(perfil);
        return { sucesso: true, erros: [], perfil: alterado ? perfil : anterior, alterado, idempotente: !alterado };
    },

    paraPersistencia(perfil = {}) {
        const item = this.normalizar(perfil, perfil.uid);
        return {
            nome: item.nome,
            email: item.email,
            perfil: item.perfil,
            ativo: item.ativo,
            criadoEmISO: item.criadoEmISO,
            criadoPor: item.criadoPor,
            atualizadoEmISO: item.atualizadoEmISO,
            atualizadoPor: item.atualizadoPor,
            ultimoAcessoEm: item.ultimoAcessoEm,
            historicoAcesso: item.historicoAcesso
        };
    },

    validar(perfil = {}) {
        const erros = [];
        if (!perfil.uid) erros.push("Identidade do acesso não encontrada.");
        if (perfil.nome.length < 2) erros.push("Informe o nome do usuário.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfil.email)) erros.push("Informe um e-mail válido.");
        if (!this.perfis.includes(perfil.perfil)) erros.push("Selecione um perfil válido.");
        return erros;
    },

    validarCadastro(dados = {}) {
        const erros = [];
        if (this.texto(dados.nome, 120).length < 2) erros.push("Informe o nome do usuário.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.texto(dados.email, 254))) erros.push("Informe um e-mail válido.");
        if (!this.perfis.includes(String(dados.perfil || ""))) erros.push("Selecione o perfil do usuário.");
        if (String(dados.senhaTemporaria || "").length < 10) erros.push("A senha temporária deve ter pelo menos 10 caracteres.");
        return erros;
    },

    gerarSenhaTemporaria() {
        const letras = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
        const numeros = "23456789";
        const simbolos = "!@#$%";
        const todos = letras + numeros + simbolos;
        const escolher = conjunto => conjunto[Math.floor(Math.random() * conjunto.length)];
        const senha = [escolher(letras.toUpperCase()), escolher(letras.toLowerCase()), escolher(numeros), escolher(simbolos)];
        while (senha.length < 14) senha.push(escolher(todos));
        return senha.sort(() => Math.random() - 0.5).join("");
    },

    assinatura(perfil = {}) {
        const item = this.normalizar(perfil, perfil.uid);
        return JSON.stringify({ nome: item.nome, email: item.email, perfil: item.perfil, ativo: item.ativo, historicoAcesso: item.historicoAcesso });
    },
    ehProprioAcesso(perfil = {}, usuario = null) { return Boolean(perfil.uid && perfil.uid === String(usuario?.uid || "")); },
    rotuloPerfil(perfil = "") { return perfil === "admin" ? "Administrador" : "Funcionário"; },
    evento(tipo, descricao, usuario = null, dados = {}) { return { tipo, descricao, data: this.agoraISO(), usuario: this.nomeUsuario(usuario), dados }; },
    nomeUsuario(usuario = null) { return this.texto(usuario?.nome || usuario?.nomeUsuario || usuario?.email || usuario?.uid || usuario || "Sistema", 120); },
    agoraISO() { return new Date().toISOString(); },
    texto(valor, limite = 1000) { return String(valor ?? "").trim().slice(0, limite); }
};

if (typeof window !== "undefined") window.AcessoModel = AcessoModel;
if (typeof module !== "undefined" && module.exports) module.exports = { AcessoModel };
