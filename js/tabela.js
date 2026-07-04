const Tabela = {
    atualizar() {
        const tbody = document.querySelector("#tabelaItens tbody");

        if (!tbody) return;

        tbody.innerHTML = "";

        Itens.todos().forEach((item, indice) => {
            const tr = document.createElement("tr");
            const categoria = typeof OrcamentoModel !== "undefined"
                ? OrcamentoModel.rotuloCategoria(item.categoria)
                : item.categoria;
            const descricao = item.descricao || item.tipoVidro || "";
            const medidas = `${item.largura || 0} × ${item.altura || 0} cm`;
            const area = item.areaM2 ?? item.area ?? 0;
            const valorM2 = item.valorM2 ?? item.valorMetro ?? item.valorVidro ?? 0;
            const valorFerragens = item.valorFerragens ?? item.totalFerragens ?? item.totalAcessorios ?? item.acessorios ?? 0;
            const valorServico = item.valorServico ?? item.totalServico ?? 0;

            tr.innerHTML = `
                <td>${indice + 1}</td>
                <td>${this.texto(categoria)}</td>
                <td>${this.texto(descricao)}</td>
                <td>${this.texto(item.tipoVidro || "")}</td>
                <td>${this.texto(item.espessura || "")} mm</td>
                <td>${this.texto(item.cor || "")}</td>
                <td>${medidas}</td>
                <td>${item.quantidade || 1}</td>
                <td>${Util.decimal(area, 3)} m²</td>
                <td>${Util.moeda(valorM2)}</td>
                <td>${Util.moeda(valorFerragens)}</td>
                <td>${Util.moeda(valorServico)}</td>
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
    },

    texto(valor) {
        return String(valor || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};
