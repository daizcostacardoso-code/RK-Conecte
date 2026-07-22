document.addEventListener("DOMContentLoaded", async () => {
    const iniciar = async () => {
        await Orcamento.iniciar();
        Eventos.iniciar();
    };
    await (window.RKLoading?.initial
        ? RKLoading.initial(iniciar, "Carregando configuracoes do orcamento...")
        : iniciar());
});
