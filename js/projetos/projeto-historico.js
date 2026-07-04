function criarEventoHistorico(tipo, descricao, usuario = "", dados = {}) {
    return {
        tipo: tipo || "evento",
        descricao: descricao || "",
        usuario,
        data: new Date().toISOString(),
        dados
    };
}

function adicionarEventoHistorico(projeto, tipo, descricao, usuario = "", dados = {}) {
    const base = projeto || {};
    const historico = Array.isArray(base.historico) ? [...base.historico] : [];
    const agora = new Date().toISOString();

    historico.push(criarEventoHistorico(tipo, descricao, usuario, dados));

    return {
        ...base,
        historico,
        datas: {
            ...(base.datas || {}),
            atualizacao: agora
        },
        atualizadoPor: usuario || base.atualizadoPor || ""
    };
}

const ProjetoHistorico = {
    criarEvento: criarEventoHistorico,
    adicionarEvento: adicionarEventoHistorico
};

