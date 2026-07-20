const MedicaoUI = {
    ids: ["clienteNome", "clienteDocumento", "clienteTelefone", "obraEndereco", "responsavel", "dataMedicao", "observacoesGerais"],
    elemento(id) { return document.getElementById(id); },
    lerGerais() { return Object.fromEntries(this.ids.map(id => [id, this.elemento(id).value])); },
    preencherGerais(estado) { this.ids.forEach(id => { this.elemento(id).value = estado[id] || ""; }); },
    lerMedida() { return { quantidade: this.elemento("medidaQuantidade").value, tipo: this.elemento("medidaTipo").value, descricao: this.elemento("medidaDescricao").value, altura: this.elemento("medidaAltura").value, largura: this.elemento("medidaLargura").value, observacao: this.elemento("medidaObservacao").value }; },
    preencherMedida(m) { this.elemento("medidaQuantidade").value = m.quantidade; this.elemento("medidaTipo").value = m.tipo; this.elemento("medidaDescricao").value = m.descricao; this.elemento("medidaAltura").value = MedicaoModel.formatarNumero(m.altura); this.elemento("medidaLargura").value = MedicaoModel.formatarNumero(m.largura); this.elemento("medidaObservacao").value = m.observacao; },
    limparMedida() { this.elemento("formMedida").reset(); this.elemento("medidaQuantidade").value = "1"; },
    modoEdicao(ativo) { this.elemento("modoEdicao").hidden = !ativo; this.elemento("btnSalvarMedida").textContent = ativo ? "Atualizar medida" : "Adicionar medida"; },
    mensagem(texto, tipo = "erro") { const aviso = this.elemento("medicaoAviso"); aviso.textContent = texto; aviso.className = `medicao-aviso is-visible medicao-aviso--${tipo}`; if (!this.mobile()) aviso.scrollIntoView({ behavior: "smooth", block: "nearest" }); window.clearTimeout(this.timer); this.timer = window.setTimeout(() => { aviso.className = "medicao-aviso"; aviso.textContent = ""; }, 5000); },
    mobile() { return window.matchMedia("(max-width: 560px)").matches; },
    manterFormularioMedidaVisivel() { if (!this.mobile()) return; window.requestAnimationFrame(() => this.elemento("novaMedidaTitulo").closest(".medicao-painel").scrollIntoView({ behavior: "smooth", block: "start" })); },
    renderizarMedidas(medidas) {
        const corpo = this.elemento("medidasCorpo"); corpo.replaceChildren();
        this.elemento("medidasResumo").textContent = medidas.length ? `${medidas.length} ${medidas.length === 1 ? "medida cadastrada" : "medidas cadastradas"}.` : "Nenhuma medida cadastrada.";
        if (!medidas.length) { const td = document.createElement("td"); td.colSpan = 6; td.className = "medicao-vazio"; td.textContent = "Adicione a primeira medida para revisar a ficha."; const tr = document.createElement("tr"); tr.appendChild(td); corpo.appendChild(tr); return; }
        medidas.forEach(m => {
            const tr = document.createElement("tr");
            [m.quantidade, m.tipo, m.descricao || "—", MedicaoModel.formatarDimensoes(m), m.observacao || "—"].forEach(valor => { const td = document.createElement("td"); td.textContent = valor; tr.appendChild(td); });
            const acoes = document.createElement("td"); acoes.className = "medicao-tabela-acoes";
            [["Editar", "editar"], ["Remover", "remover"]].forEach(([rotulo, acao]) => { const b = document.createElement("button"); b.type = "button"; b.textContent = rotulo; b.dataset.acao = acao; b.dataset.id = m.id; acoes.appendChild(b); });
            tr.appendChild(acoes); corpo.appendChild(tr);
        });
    }
};
