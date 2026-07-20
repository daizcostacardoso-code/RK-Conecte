const CaixaExport = {
    nomeArquivo(data = new Date()) {
        return `rk-caixa-backup-${data.toISOString().slice(0, 10)}.json`;
    },

    montarBackup(lista = []) {
        const dados = CaixaModel.ordenar(lista);
        return {
            sistema: "RK-Conecte",
            modulo: "caixa",
            exportadoEmISO: new Date().toISOString(),
            total: dados.length,
            dados
        };
    },

    baixar(lista = []) {
        const backup = this.montarBackup(lista);
        const conteudo = JSON.stringify(backup, null, 2);
        const blob = new Blob([conteudo], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = this.nomeArquivo();
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        return backup;
    }
};

window.CaixaExport = CaixaExport;
