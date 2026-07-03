const Tabela = {
    atualizar() {
        const tbody = document.querySelector("#tabelaItens tbody");

        if (!tbody) return;

        tbody.innerHTML = "";

        Itens.todos().forEach((item, indice) => {
            const tr = document.createElement("tr");

            const totalAcessorios = item.totalAcessorios ?? item.acessorios ?? 0;
            const totalVidro = item.totalVidro ?? Math.max(0, Util.numero(item.total) - Util.numero(item.totalAluminio) - Util.numero(totalAcessorios));

            tr.innerHTML = `
                <td>${indice + 1}</td>
                <td>${item.tipoVidro || ""}</td>
                <td>${item.espessura || ""} mm</td>
                <td>${item.cor || ""}</td>
                <td>${item.quantidade || 1}</td>
                <td>${Util.decimal(item.area, 3)} m²</td>
                <td>${Util.moeda(totalVidro)}</td>
                <td>${Util.moeda(item.totalAluminio || 0)}</td>
                <td>${Util.moeda(totalAcessorios)}</td>
                <td>${Util.moeda(item.total)}</td>
                <td>
                    <button type="button" onclick="Tabela.excluir(${indice})">
                        Excluir
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });
    },

    excluir(indice) {
        Orcamento.removerItem(indice);
    }
};
