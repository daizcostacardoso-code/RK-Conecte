const WorkflowEvents = {
    eventos: [],

    registrarEvento(evento = {}) {
        const normalizado = {
            tipo: evento.tipo || "workflow",
            descricao: evento.descricao || "",
            usuario: evento.usuario || "",
            data: evento.data || new Date().toISOString(),
            projetoId: evento.projetoId || "",
            dados: evento.dados || {}
        };

        this.eventos.push(normalizado);
        return normalizado;
    },

    listarEventos(filtros = {}) {
        return this.eventos.filter(evento => {
            const projetoOk = !filtros.projetoId || evento.projetoId === filtros.projetoId;
            const tipoOk = !filtros.tipo || evento.tipo === filtros.tipo;
            return projetoOk && tipoOk;
        });
    },

    limparEventos() {
        this.eventos = [];
        return true;
    }
};

function registrarEvento(evento = {}) {
    return WorkflowEvents.registrarEvento(evento);
}

function listarEventos(filtros = {}) {
    return WorkflowEvents.listarEventos(filtros);
}

function limparEventos() {
    return WorkflowEvents.limparEventos();
}

