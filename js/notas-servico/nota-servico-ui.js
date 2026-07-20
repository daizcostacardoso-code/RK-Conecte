const NotaServicoUI = {
    idsGerais: ["numeroNota","dataEmissao","dataConclusao","status","responsavel","localServico","clienteNome","clienteDocumento","clienteTelefone","clienteEndereco","clienteEmail","desconto","formaPagamento","condicaoPagamento","garantia","referencia","observacoes"],
    el(id) { return document.getElementById(id); },
    lerGerais() { const dados = {}; this.idsGerais.forEach(id => dados[id] = this.el(id).value); dados.desconto = NotaServicoModel.numero(dados.desconto, true) ?? dados.desconto; return dados; },
    preencher(estado) { this.idsGerais.forEach(id => { const el = this.el(id); if (el) el.value = id === "desconto" ? Number(estado[id] || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (estado[id] ?? ""); }); this.renderizarServicos(estado); },
    lerServico() { return { descricao: this.el("servicoDescricao").value, quantidade: this.el("servicoQuantidade").value, unidade: this.el("servicoUnidade").value, valorUnitario: this.el("servicoValor").value }; },
    preencherServico(item) { this.el("servicoDescricao").value = item.descricao; this.el("servicoQuantidade").value = NotaServicoModel.formatarNumero(item.quantidade); this.el("servicoUnidade").value = item.unidade; this.el("servicoValor").value = Number(item.valorUnitario).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
    limparServico() { this.el("formServico").reset(); this.el("servicoQuantidade").value = "1"; this.el("servicoUnidade").value = "un."; },
    modoEdicao(ativo) { this.el("modoEdicaoServico").hidden = !ativo; this.el("btnSalvarServico").textContent = ativo ? "Atualizar serviço" : "Adicionar serviço"; this.el("btnCancelarServico").textContent = ativo ? "Cancelar edição" : "Limpar"; },
    escapar(valor) { const div = document.createElement("div"); div.textContent = String(valor ?? ""); return div.innerHTML; },
    renderizarServicos(estado) {
        const corpo = this.el("servicosCorpo");
        if (!estado.servicos.length) corpo.innerHTML = '<tr><td class="nota-vazio" colspan="6">Adicione o primeiro serviço para compor a nota.</td></tr>';
        else corpo.innerHTML = estado.servicos.map(item => `<tr><td>${this.escapar(item.descricao)}</td><td>${NotaServicoModel.formatarNumero(item.quantidade)}</td><td>${this.escapar(item.unidade)}</td><td>${NotaServicoModel.moeda(item.valorUnitario)}</td><td><strong>${NotaServicoModel.moeda(item.quantidade * item.valorUnitario)}</strong></td><td><div class="nota-acoes-linha"><button type="button" data-acao="editar" data-id="${this.escapar(item.id)}">Editar</button><button class="perigo" type="button" data-acao="excluir" data-id="${this.escapar(item.id)}">Excluir</button></div></td></tr>`).join("");
        const quantidade = estado.servicos.length; this.el("servicosResumo").textContent = quantidade ? `${quantidade} ${quantidade === 1 ? "serviço adicionado" : "serviços adicionados"}.` : "Nenhum serviço adicionado.";
        this.el("subtotalExibicao").textContent = NotaServicoModel.moeda(NotaServicoModel.subtotal(estado)); this.el("totalExibicao").textContent = NotaServicoModel.moeda(NotaServicoModel.total(estado));
    },
    renderizarHistorico(itens) {
        this.el("historicoContagem").textContent = `${itens.length} ${itens.length === 1 ? "nota" : "notas"}`; const lista = this.el("historicoLista");
        if (!itens.length) { lista.innerHTML = '<div class="nota-historico-vazio">Nenhuma nota foi salva no Firestore.</div>'; return; }
        lista.innerHTML = itens.map(item => `<article><div><span>${this.escapar(item.numeroNota)} · ${this.escapar(NotaServicoModel.rotuloStatus(item.status))}</span><strong>${this.escapar(item.clienteNome)}</strong><small>${this.dataBr(item.dataEmissao)} • ${item.servicos.length} ${item.servicos.length === 1 ? "serviço" : "serviços"}${item.projetoId ? " • projeto vinculado" : ""}</small></div><b>${NotaServicoModel.moeda(NotaServicoModel.total(item))}</b><div class="nota-historico-acoes"><button type="button" data-historico="abrir" data-id="${this.escapar(item.id)}">Abrir</button><button type="button" data-historico="pdf" data-id="${this.escapar(item.id)}">PDF</button>${item.status === "cancelado" ? "" : `<button class="perigo" type="button" data-historico="excluir" data-id="${this.escapar(item.id)}">Cancelar</button>`}</div></article>`).join("");
    },
    dataBr(data) { if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "")) return "-"; const [a,m,d] = data.split("-"); return `${d}/${m}/${a}`; },
    mensagem(texto, tipo = "erro") { const aviso = this.el("notaAviso"); aviso.textContent = texto; aviso.className = `nota-aviso nota-aviso--${tipo}`; window.clearTimeout(this.timer); this.timer = window.setTimeout(() => { aviso.textContent = ""; aviso.className = "nota-aviso"; }, 5500); },
    marcarRascunho(texto = "Rascunho salvo") { this.el("estadoDocumento").textContent = texto; }
};
