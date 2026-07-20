function dispararEventoProjetoCriado(projeto) {
    return EventBus.emit(EventTypes.PROJETO_CRIADO, {
        projeto,
        projetoId: projeto?.id || ""
    });
}

function dispararEventoProjetoAtualizado(projeto) {
    return EventBus.emit(EventTypes.PROJETO_ATUALIZADO, {
        projeto,
        projetoId: projeto?.id || ""
    });
}

function dispararEventoProjetoAprovado(projeto) {
    return EventBus.emit(EventTypes.PROJETO_APROVADO, {
        projeto,
        projetoId: projeto?.id || ""
    });
}

function dispararEventoStatusAlterado(projeto, statusAnterior, statusNovo) {
    return EventBus.emit(EventTypes.PROJETO_STATUS_ALTERADO, {
        projeto,
        projetoId: projeto?.id || "",
        statusAnterior,
        statusNovo
    });
}

const EventDispatcher = {
    dispararEventoProjetoCriado,
    dispararEventoProjetoAtualizado,
    dispararEventoProjetoAprovado,
    dispararEventoStatusAlterado
};

