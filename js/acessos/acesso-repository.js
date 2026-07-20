const AcessoRepository = {
    colecao: "usuarios_autorizados",

    async obterAdministradorAtual() {
        const sessao = window.RKAuth?.obterSessao?.();
        if (!sessao?.uid) return this.erro("Entre novamente para continuar.");
        try {
            const snapshot = await db.collection(this.colecao).doc(sessao.uid).get();
            if (!snapshot.exists) return this.erro("Seu acesso administrativo não foi encontrado.");
            const perfil = AcessoModel.normalizar(snapshot.data(), snapshot.id);
            if (!perfil.ativo || perfil.perfil !== "admin") return this.erro("Esta área é exclusiva para administradores.");
            return { sucesso: true, erros: [], perfil, sessao };
        } catch (erro) {
            return this.erro(erro.message || "Não foi possível validar o acesso administrativo.");
        }
    },

    async listar() {
        const administrador = await this.obterAdministradorAtual();
        if (!administrador.sucesso) return administrador;
        try {
            const snapshot = await db.collection(this.colecao).get();
            const perfis = snapshot.docs
                .map(doc => AcessoModel.normalizar(doc.data(), doc.id))
                .sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome, "pt-BR"));
            return { sucesso: true, erros: [], perfis, administrador: administrador.perfil };
        } catch (erro) {
            return this.erro(erro.message || "Não foi possível carregar os acessos.");
        }
    },

    async criar(dados = {}) {
        const administrador = await this.obterAdministradorAtual();
        if (!administrador.sucesso) return administrador;
        const erros = AcessoModel.validarCadastro(dados);
        if (erros.length) return this.erro(erros);
        if (typeof firebase === "undefined" || !window.RK_FIREBASE_CONFIG) return this.erro("Serviço de acesso temporariamente indisponível.");

        const nomeApp = `rk-novo-acesso-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        let appSecundario = null;
        let usuarioCriado = null;
        try {
            appSecundario = firebase.initializeApp(window.RK_FIREBASE_CONFIG, nomeApp);
            const autenticacaoSecundaria = appSecundario.auth();
            const credencial = await autenticacaoSecundaria.createUserWithEmailAndPassword(
                String(dados.email).trim().toLowerCase(),
                String(dados.senhaTemporaria)
            );
            usuarioCriado = credencial.user;
            await usuarioCriado.updateProfile({ displayName: String(dados.nome).trim() });
            const resultado = AcessoModel.criar(dados, usuarioCriado.uid, administrador.sessao);
            if (resultado.erros.length) throw new Error(resultado.erros.join(" "));
            await db.collection(this.colecao).doc(usuarioCriado.uid).set(AcessoModel.paraPersistencia(resultado.perfil), { merge: false });
            await autenticacaoSecundaria.signOut();
            return { sucesso: true, erros: [], perfil: resultado.perfil };
        } catch (erro) {
            if (usuarioCriado) {
                try { await usuarioCriado.delete(); } catch (_) {}
            }
            return this.erro(this.mensagemCadastro(erro));
        } finally {
            if (appSecundario) {
                try { await appSecundario.delete(); } catch (_) {}
            }
        }
    },

    async atualizar(uid = "", alteracoes = {}) {
        const administrador = await this.obterAdministradorAtual();
        if (!administrador.sucesso) return administrador;
        try {
            const referencia = db.collection(this.colecao).doc(String(uid));
            const snapshot = await referencia.get();
            if (!snapshot.exists) return this.erro("Acesso não encontrado.");
            const atual = AcessoModel.normalizar(snapshot.data(), snapshot.id);
            const resultado = AcessoModel.atualizar(atual, alteracoes, administrador.sessao);
            if (!resultado.sucesso) return resultado;
            if (resultado.alterado) await referencia.set(AcessoModel.paraPersistencia(resultado.perfil), { merge: false });
            return resultado;
        } catch (erro) {
            return this.erro(erro.message || "Não foi possível atualizar o acesso.");
        }
    },

    async enviarRecuperacao(email = "") {
        const administrador = await this.obterAdministradorAtual();
        if (!administrador.sucesso) return administrador;
        try {
            const autenticacao = window.RKAuth?.obterInstanciaFirebase?.();
            if (!autenticacao) return this.erro("Serviço de acesso temporariamente indisponível.");
            await autenticacao.sendPasswordResetEmail(String(email).trim().toLowerCase());
            return { sucesso: true, erros: [] };
        } catch (erro) {
            return this.erro(this.mensagemRecuperacao(erro));
        }
    },

    mensagemCadastro(erro = {}) {
        const mensagens = {
            "auth/email-already-in-use": "Já existe um acesso com este e-mail.",
            "auth/invalid-email": "Informe um e-mail válido.",
            "auth/weak-password": "Use uma senha temporária mais forte.",
            "auth/network-request-failed": "Falha de conexão. Tente novamente."
        };
        return mensagens[erro.code] || erro.message || "Não foi possível criar o acesso.";
    },
    mensagemRecuperacao(erro = {}) {
        const mensagens = {
            "auth/invalid-email": "E-mail inválido.",
            "auth/user-not-found": "Acesso não encontrado para este e-mail.",
            "auth/too-many-requests": "Muitas solicitações. Aguarde alguns minutos.",
            "auth/network-request-failed": "Falha de conexão. Tente novamente."
        };
        return mensagens[erro.code] || "Não foi possível enviar a recuperação de senha.";
    },
    erro(mensagem) { return { sucesso: false, erros: Array.isArray(mensagem) ? mensagem : [mensagem], perfis: [], perfil: null }; }
};

if (typeof window !== "undefined") window.AcessoRepository = AcessoRepository;
if (typeof module !== "undefined" && module.exports) module.exports = { AcessoRepository };
