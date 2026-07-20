const DocumentArchiveController = {
    registros: [],
    selecionados: new Set(),
    pdfUrl: "",
    detalheRegistro: null,
    detalheAcao: "",
    exclusaoPendente: [],

    async iniciar() {
        document.getElementById("btnBuscarArquivos")?.addEventListener("click", () => this.buscar());
        document.getElementById("btnLimparArquivos")?.addEventListener("click", () => this.limparFiltros());
        document.getElementById("btnExcluirArquivosSelecionados")?.addEventListener("click", () => this.solicitarExclusaoSelecionados());
        document.getElementById("arquivosCorpo")?.addEventListener("click", evento => this.tratarAcao(evento));
        document.getElementById("arquivosCorpo")?.addEventListener("change", evento => this.alterarSelecao(evento));
        document.getElementById("arquivosSelecionarTodos")?.addEventListener("change", evento => this.selecionarTodos(evento.currentTarget.checked));
        document.getElementById("arquivosFecharPreview")?.addEventListener("click", () => this.fecharPreview());
        document.getElementById("arquivosDetalhes")?.addEventListener("click", evento => this.tratarAcaoDetalhe(evento));
        document.getElementById("arquivosDetalhes")?.addEventListener("submit", evento => this.confirmarAcaoDetalhe(evento));
        document.getElementById("arquivosDetalhesFechar")?.addEventListener("click", () => this.fecharDetalhes());
        window.addEventListener("beforeunload", () => this.revogarPdfUrl());

        const parametros = new URLSearchParams(window.location.search || "");
        const numero = String(parametros.get("numero") || "").trim();
        this.obterTransferenciaPreview();
        const campoNumero = document.getElementById("filtroArquivoNumero");
        if (campoNumero && numero) campoNumero.value = numero;

        await this.buscar();

        if (parametros.get("preview") === "pdf") {
            const registroId = String(parametros.get("registro") || "").trim();
            const registro = this.registros.find(item => (registroId && String(item.id || "") === registroId) || (numero && String(item.numero || "") === numero));
            if (registro) await this.gerarPdf(registro, false);
        }
    },

    obterTransferenciaPreview() {
        try {
            const salvo = sessionStorage.getItem("rk_documento_preview_atual");
            if (!salvo) return null;
            sessionStorage.removeItem("rk_documento_preview_atual");
            return JSON.parse(salvo);
        } catch (erro) {
            console.warn("Nao foi possivel recuperar o orcamento para o preview.", erro);
            return null;
        }
    },

    async buscar() {
        if (typeof DocumentPdfRepository === "undefined") return this.mensagem("Repositório de PDFs indisponível.");
        this.mensagem("Buscando orçamentos salvos...");
        const resultado = await DocumentPdfRepository.buscar({
            numero: document.getElementById("filtroArquivoNumero")?.value || "",
            cliente: document.getElementById("filtroArquivoCliente")?.value || "",
            data: ""
        });
        if (!resultado.sucesso) {
            this.registros = [];
            this.renderizar();
            return this.mensagem((resultado.erros || ["Não foi possível consultar o Firestore."]).join(" "));
        }
        this.registros = (resultado.registros || []).map(registro => this.normalizarRegistro(registro)).filter(registro => this.atendeFiltros(registro));
        this.selecionados.clear();
        this.renderizar();
        this.mensagem(this.registros.length ? `${this.registros.length} orçamento(s) encontrado(s).` : "Nenhum orçamento encontrado.");
    },

    normalizarRegistro(registro = {}) {
        return typeof OrcamentoAprovacaoModel !== "undefined"
            ? OrcamentoAprovacaoModel.normalizarRegistro(registro)
            : registro;
    },

    atendeFiltros(registro) {
        const data = registro.dataEmissao || "";
        const inicial = document.getElementById("filtroArquivoDataInicial")?.value || "";
        const final = document.getElementById("filtroArquivoDataFinal")?.value || "";
        const total = this.totalRegistro(registro);
        const minimoTexto = document.getElementById("filtroArquivoValorMinimo")?.value;
        const maximoTexto = document.getElementById("filtroArquivoValorMaximo")?.value;
        const documentoBusca = String(document.getElementById("filtroArquivoDocumento")?.value || "").replace(/\D/g, "");
        const documentoCliente = String(registro.cliente?.documento || registro.cliente?.cpfCnpj || "").replace(/\D/g, "");
        const status = String(document.getElementById("filtroArquivoStatus")?.value || "").trim().toLowerCase();
        if (inicial && data < inicial) return false;
        if (final && data > final) return false;
        if (minimoTexto && total < Number(minimoTexto)) return false;
        if (maximoTexto && total > Number(maximoTexto)) return false;
        if (documentoBusca && !documentoCliente.includes(documentoBusca)) return false;
        if (status && String(registro.status || "emitido").toLowerCase() !== status) return false;
        return true;
    },

    renderizar() {
        const corpo = document.getElementById("arquivosCorpo");
        if (!corpo) return;
        if (!this.registros.length) {
            corpo.innerHTML = '<tr class="arquivos-linha-vazia"><td colspan="7" class="arquivos-vazio">Nenhum orçamento encontrado.</td></tr>';
            this.atualizarControlesSelecao();
            return;
        }
        corpo.innerHTML = this.registros.map(registro => `
            <tr>
                <td><input type="checkbox" data-arquivo-selecao value="${this.escaparAtributo(registro.id)}" aria-label="Selecionar orçamento ${this.escaparAtributo(registro.numero || registro.id)}" ${this.selecionados.has(String(registro.id)) ? "checked" : ""}></td>
                <td>${this.escapar(registro.numero || registro.id || "-")}</td>
                <td>${this.escapar(registro.clienteNome || registro.cliente?.nome || "-")}</td>
                <td>${this.formatarData(registro.dataEmissao)}</td>
                <td><span class="arquivos-status is-${this.escaparAtributo(registro.status)}">${this.escapar(this.rotuloStatus(registro.status))}</span></td>
                <td>${this.formatarMoeda(this.totalRegistro(registro))}</td>
                <td><div class="arquivos-item-acoes">
                    <button type="button" data-arquivo-acao="detalhes" data-registro-id="${this.escaparAtributo(registro.id)}">Ver orçamento</button>
                    ${this.renderizarBotoesComerciais(registro)}
                    <button type="button" data-arquivo-acao="preview" data-registro-id="${this.escaparAtributo(registro.id)}">Ver PDF</button>
                    <button type="button" data-arquivo-acao="download" data-registro-id="${this.escaparAtributo(registro.id)}">Baixar</button>
                    <button type="button" class="btn-tabela-excluir" data-arquivo-acao="excluir" data-registro-id="${this.escaparAtributo(registro.id)}">Excluir</button>
                </div></td>
            </tr>`).join("");
        this.atualizarControlesSelecao();
    },

    renderizarBotoesComerciais(registro) {
        const acoes = typeof OrcamentoAprovacaoService !== "undefined"
            ? OrcamentoAprovacaoService.acoesDisponiveis(registro)
            : [];
        return acoes.map(acao => `<button type="button" class="arquivos-acao-${this.escaparAtributo(acao.chave)}" data-arquivo-acao="${this.escaparAtributo(acao.chave)}" data-registro-id="${this.escaparAtributo(registro.id)}">${this.escapar(acao.rotulo)}</button>`).join("");
    },

    async tratarAcao(evento) {
        const botao = evento.target.closest("[data-arquivo-acao]");
        if (!botao) return;
        const registro = this.registros.find(item => String(item.id) === botao.dataset.registroId);
        const acao = botao.dataset.arquivoAcao;
        if (!registro) return this.mensagem("Orçamento não encontrado.");
        if (acao === "excluir") return this.solicitarExclusao([registro]);
        if (["detalhes", "emitir", "enviar", "aprovar", "recusar", "cancelar"].includes(acao)) return this.abrirDetalhes(registro, acao === "detalhes" ? "" : acao);
        await this.gerarPdf(registro, acao === "download");
    },

    abrirDetalhes(registro, acao = "") {
        this.exclusaoPendente = [];
        this.detalheRegistro = this.normalizarRegistro(registro);
        this.detalheAcao = acao;
        this.renderizarDetalhes();
        const modal = document.getElementById("arquivosDetalhes");
        if (typeof modal?.showModal === "function") modal.showModal();
        else modal?.setAttribute("open", "");
    },

    renderizarDetalhes() {
        const conteudo = document.getElementById("arquivosDetalhesConteudo");
        if (!conteudo || !this.detalheRegistro) return;
        const registro = this.normalizarRegistro(this.detalheRegistro);
        const cliente = registro.cliente || {};
        const aprovacao = registro.aprovacao || {};
        const itens = this.itensRegistro(registro);
        const acoes = typeof OrcamentoAprovacaoService !== "undefined" ? OrcamentoAprovacaoService.acoesDisponiveis(registro) : [];
        conteudo.innerHTML = [
            `<div class="arquivos-detalhes-resumo">`,
            `<p><strong>${this.escapar(registro.numero || registro.id || "Orçamento")}</strong><span class="arquivos-status is-${this.escaparAtributo(registro.status)}">${this.escapar(this.rotuloStatus(registro.status))}</span></p>`,
            `<dl><div><dt>Cliente</dt><dd>${this.escapar(cliente.nome || registro.clienteNome || "Não informado")}</dd></div><div><dt>Emissão</dt><dd>${this.escapar(this.formatarData(registro.dataEmissao))}</dd></div><div><dt>Valor</dt><dd>${this.escapar(this.formatarMoeda(this.totalRegistro(registro)))}</dd></div><div><dt>Versão</dt><dd>${this.escapar(aprovacao.versaoOrcamento || 1)}</dd></div><div><dt>Atualizado</dt><dd>${this.escapar(this.formatarDataHora(registro.atualizadoEmISO))}</dd></div></dl>`,
            `</div>`,
            `<section class="arquivos-detalhes-secao"><h3>Documento comercial</h3><p>${this.escapar(registro.documento?.dados?.projeto?.nome || registro.projetoNome || "Proposta comercial")}</p>${itens.length ? `<ul>${itens.map(item => `<li>${this.escapar(item.nome || item.descricao || item.categoria || "Item")}</li>`).join("")}</ul>` : "<p>Itens não disponíveis neste registro.</p>"}</section>`,
            `<section class="arquivos-detalhes-secao"><h3>Decisão</h3><p>${this.escapar(this.resumoDecisao(aprovacao))}</p></section>`,
            `<section class="arquivos-detalhes-secao"><h3>Histórico</h3>${this.renderizarHistorico(registro.historicoStatus || [])}</section>`,
            `<section class="arquivos-detalhes-secao arquivos-detalhes-acoes"><h3>Ações disponíveis</h3>${this.renderizarPainelAcao(registro, acoes)}</section>`
        ].join("");
    },

    renderizarPainelAcao(registro, acoes) {
        if (!this.detalheAcao) {
            if (!acoes.length) return "<p>Nenhuma ação comercial disponível para o status atual.</p>";
            return `<div class="arquivos-item-acoes">${acoes.map(acao => `<button type="button" data-detalhe-acao="${this.escaparAtributo(acao.chave)}">${this.escapar(acao.rotulo)}</button>`).join("")}</div>`;
        }
        const acao = this.detalheAcao;
        const rotulo = { emitir: "Marcar como emitido", enviar: "Marcar como enviado", aprovar: "Aprovar orçamento", recusar: "Recusar orçamento", cancelar: "Cancelar orçamento" }[acao] || "Confirmar ação";
        const motivo = acao === "recusar" ? `<label>Motivo da recusa<textarea name="motivoRecusa" required maxlength="1000"></textarea></label>` : "";
        const confirmacao = acao === "cancelar" ? `<label class="arquivos-confirmacao"><input type="checkbox" name="confirmado" required> Confirmo o cancelamento deste orçamento.</label>` : "";
        return `<form id="arquivosDetalhesFormulario" class="arquivos-detalhes-form" data-acao="${this.escaparAtributo(acao)}"><p>Revise os dados acima antes de confirmar.</p>${motivo}<label>Observação${acao === "recusar" ? " adicional" : ""}<textarea name="observacao" maxlength="1000"></textarea></label>${confirmacao}<div class="arquivos-item-acoes"><button type="button" data-detalhe-voltar>Voltar</button><button type="submit" class="arquivos-acao-${this.escaparAtributo(acao)}">${this.escapar(rotulo)}</button></div></form>`;
    },

    renderizarHistorico(historico) {
        if (!historico.length) return "<p>Sem histórico comercial.</p>";
        return `<ol class="arquivos-historico">${historico.map(item => `<li><strong>${this.escapar(this.rotuloAcao(item.acao))}</strong><span>${this.escapar(this.rotuloStatus(item.statusAnterior || "emitido"))} → ${this.escapar(this.rotuloStatus(item.statusAtual))}</span><small>${this.escapar(this.formatarDataHora(item.realizadoEm))}${item.realizadoPor?.nome ? ` · ${this.escapar(item.realizadoPor.nome)}` : ""}</small>${item.observacao ? `<p>${this.escapar(item.observacao)}</p>` : ""}</li>`).join("")}</ol>`;
    },

    tratarAcaoDetalhe(evento) {
        const voltar = evento.target.closest("[data-detalhe-voltar]");
        if (voltar) {
            this.detalheAcao = "";
            return this.renderizarDetalhes();
        }
        const botao = evento.target.closest("[data-detalhe-acao]");
        if (botao) {
            this.detalheAcao = botao.dataset.detalheAcao;
            this.renderizarDetalhes();
        }
    },

    async confirmarAcaoDetalhe(evento) {
        const formulario = evento.target.closest("#arquivosDetalhesFormulario");
        if (!formulario) return;
        evento.preventDefault();
        if (!this.detalheRegistro || typeof OrcamentoAprovacaoService === "undefined") return this.mensagem("Serviço de aprovação indisponível.");
        const botao = formulario.querySelector("button[type='submit']");
        const dadosFormulario = new FormData(formulario);
        const acao = formulario.dataset.acao;
        const dados = {
            motivoRecusa: String(dadosFormulario.get("motivoRecusa") || "").trim(),
            observacao: String(dadosFormulario.get("observacao") || "").trim(),
            confirmado: dadosFormulario.get("confirmado") === "on"
        };
        botao.disabled = true;
        try {
            const resultado = await OrcamentoAprovacaoService[acao](this.detalheRegistro.id, dados);
            if (!resultado.sucesso) {
                this.mensagem((resultado.erros || ["Não foi possível atualizar o orçamento."]).join(" "));
                return;
            }
            this.detalheRegistro = this.normalizarRegistro(resultado.registro);
            this.registros = this.registros.map(item => String(item.id) === String(resultado.registro.id) ? this.detalheRegistro : item);
            this.detalheAcao = "";
            this.renderizar();
            this.renderizarDetalhes();
            this.mensagem(resultado.mensagem || "Orçamento atualizado.");
        } finally {
            botao.disabled = false;
        }
    },

    solicitarExclusaoSelecionados() {
        const registros = this.registros.filter(registro => this.selecionados.has(String(registro.id)));
        if (!registros.length) return this.mensagem("Selecione pelo menos um orçamento.");
        this.solicitarExclusao(registros);
    },

    solicitarExclusao(registros) {
        this.detalheRegistro = null;
        this.exclusaoPendente = registros;
        const conteudo = document.getElementById("arquivosDetalhesConteudo");
        if (!conteudo) return;
        conteudo.innerHTML = `<section class="arquivos-detalhes-secao"><h3>Excluir orçamento${registros.length > 1 ? "s" : ""}</h3><p>Esta ação remove ${registros.length} registro(s) do Firestore e não pode ser desfeita.</p><form id="arquivosExcluirFormulario" class="arquivos-detalhes-form"><label class="arquivos-confirmacao"><input type="checkbox" name="confirmado" required> Confirmo a exclusão definitiva.</label><div class="arquivos-item-acoes"><button type="submit" class="btn-tabela-excluir">Excluir definitivamente</button></div></form></section>`;
        const formulario = document.getElementById("arquivosExcluirFormulario");
        formulario?.addEventListener("submit", evento => this.confirmarExclusao(evento));
        const modal = document.getElementById("arquivosDetalhes");
        if (typeof modal?.showModal === "function") modal.showModal();
        else modal?.setAttribute("open", "");
    },

    async confirmarExclusao(evento) {
        evento.preventDefault();
        const formulario = evento.currentTarget;
        if (!new FormData(formulario).get("confirmado")) return;
        const botao = formulario.querySelector("button[type='submit']");
        botao.disabled = true;
        const excluidos = [];
        const erros = [];
        for (const registro of this.exclusaoPendente) {
            try {
                await DocumentPdfRepository.excluir(registro);
                excluidos.push(String(registro.id));
            } catch (_) {
                erros.push(registro.numero || registro.id);
            }
        }
        const ids = new Set(excluidos);
        this.registros = this.registros.filter(registro => !ids.has(String(registro.id)));
        excluidos.forEach(id => this.selecionados.delete(id));
        this.exclusaoPendente = [];
        this.renderizar();
        this.fecharPreview();
        this.fecharDetalhes();
        this.mensagem(erros.length ? `${excluidos.length} excluído(s). Não foi possível excluir: ${erros.join(", ")}.` : `${excluidos.length} orçamento(s) excluído(s).`);
    },

    alterarSelecao(evento) {
        const campo = evento.target.closest("[data-arquivo-selecao]");
        if (!campo) return;
        if (campo.checked) this.selecionados.add(String(campo.value));
        else this.selecionados.delete(String(campo.value));
        this.atualizarControlesSelecao();
    },

    selecionarTodos(marcar) {
        if (marcar) this.registros.forEach(registro => this.selecionados.add(String(registro.id)));
        else this.selecionados.clear();
        document.querySelectorAll("[data-arquivo-selecao]").forEach(campo => { campo.checked = marcar; });
        this.atualizarControlesSelecao();
    },

    atualizarControlesSelecao() {
        const quantidade = this.selecionados.size;
        const botao = document.getElementById("btnExcluirArquivosSelecionados");
        if (botao) {
            botao.disabled = quantidade === 0;
            botao.textContent = quantidade ? `Excluir selecionados (${quantidade})` : "Excluir selecionados";
        }
        const todos = document.getElementById("arquivosSelecionarTodos");
        if (todos) {
            todos.checked = this.registros.length > 0 && quantidade === this.registros.length;
            todos.indeterminate = quantidade > 0 && quantidade < this.registros.length;
        }
    },

    async gerarPdf(registro, baixar = false) {
        const documento = DocumentPdfRepository.obterDocumento(registro);
        if (!documento) return this.mensagem("Este orçamento não possui dados suficientes para gerar o PDF.");
        this.mensagem("Gerando PDF...");
        const exportacao = ExportService.exportar(documento, { formato: "PDF", adapters: { PDF: PdfAdapter } });
        if (!exportacao.sucesso || typeof exportacao.arquivo?.gerar !== "function") return this.mensagem((exportacao.erros || ["Não foi possível preparar o PDF."]).join(" "));
        const pdf = await exportacao.arquivo.gerar();
        if (!pdf?.sucesso || !pdf.bytes) return this.mensagem((pdf?.erros || ["Não foi possível gerar o PDF."]).join(" "));
        const nome = pdf.nomeArquivo || registro.nomeArquivo || "orcamento.pdf";
        if (baixar) {
            this.baixar(pdf.bytes, nome, pdf.mimeType);
            return this.mensagem("PDF gerado e download iniciado.");
        }
        this.mostrarPreview(pdf.bytes, nome, pdf.mimeType);
        this.mensagem("Preview do PDF gerado.");
    },

    mostrarPreview(bytes, nome, mimeType = "application/pdf") {
        this.revogarPdfUrl();
        this.pdfUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType || "application/pdf" }));
        const preview = document.getElementById("arquivosPreview");
        document.getElementById("arquivosPdfObjeto").data = `${this.pdfUrl}#view=FitH`;
        document.getElementById("arquivosAbrirPdf").href = this.pdfUrl;
        const baixar = document.getElementById("arquivosBaixarPdf");
        baixar.href = this.pdfUrl;
        baixar.download = nome;
        preview.hidden = false;
        preview.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    baixar(bytes, nome, mimeType = "application/pdf") {
        const url = URL.createObjectURL(new Blob([bytes], { type: mimeType || "application/pdf" }));
        const link = document.createElement("a");
        link.href = url; link.download = nome; document.body.appendChild(link); link.click(); link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },

    fecharPreview() {
        const preview = document.getElementById("arquivosPreview");
        if (preview) preview.hidden = true;
        document.getElementById("arquivosPdfObjeto")?.removeAttribute("data");
        this.revogarPdfUrl();
    },

    fecharDetalhes() {
        const modal = document.getElementById("arquivosDetalhes");
        if (modal?.open && typeof modal.close === "function") modal.close();
        else modal?.removeAttribute("open");
        this.detalheAcao = "";
        this.detalheRegistro = null;
        this.exclusaoPendente = [];
    },

    limparFiltros() {
        ["filtroArquivoCliente", "filtroArquivoDocumento", "filtroArquivoNumero", "filtroArquivoStatus", "filtroArquivoDataInicial", "filtroArquivoDataFinal", "filtroArquivoValorMinimo", "filtroArquivoValorMaximo"].forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.value = "";
        });
        this.buscar();
    },

    itensRegistro(registro) {
        if (typeof OrcamentoAprovacaoModel !== "undefined") return OrcamentoAprovacaoModel.obterItens(registro);
        return Array.isArray(registro.itens) ? registro.itens : [];
    },

    totalRegistro(registro) {
        if (typeof OrcamentoAprovacaoModel !== "undefined") return OrcamentoAprovacaoModel.obterTotal(registro);
        return Number(registro.documento?.dados?.totais?.totalGeral || registro.totais?.totalGeral || registro.totais?.totalFinal || registro.totais?.total || 0);
    },

    resumoDecisao(aprovacao) {
        if (aprovacao.status === "aprovado") return `Aprovado em ${this.formatarDataHora(aprovacao.aprovadoEm)} por ${aprovacao.aprovadoPor?.nome || "usuário interno"}. Valor aprovado: ${this.formatarMoeda(Number(aprovacao.valorAprovadoCentavos || 0) / 100)}.`;
        if (aprovacao.status === "recusado") return `Recusado em ${this.formatarDataHora(aprovacao.recusadoEm)}. Motivo: ${aprovacao.motivoRecusa || "não informado"}.`;
        if (aprovacao.status === "cancelado") return `Cancelado em ${this.formatarDataHora(aprovacao.canceladoEm)} por ${aprovacao.canceladoPor?.nome || "usuário interno"}.`;
        return "Aguardando decisão comercial.";
    },

    rotuloStatus(status) {
        const rotulos = { rascunho: "Rascunho", emitido: "Emitido", enviado: "Enviado", aprovado: "Aprovado", recusado: "Recusado", expirado: "Expirado", cancelado: "Cancelado" };
        return rotulos[String(status || "emitido").toLowerCase()] || String(status || "emitido");
    },

    rotuloAcao(acao) {
        const rotulos = { orcamento_normalizado: "Registro compatibilizado", orcamento_emitido: "Orçamento emitido", orcamento_enviado: "Orçamento enviado", orcamento_aprovado: "Orçamento aprovado", orcamento_recusado: "Orçamento recusado", orcamento_cancelado: "Orçamento cancelado", nova_versao_emitida: "Nova versão emitida" };
        return rotulos[acao] || String(acao || "Atualização").replace(/_/g, " ");
    },

    formatarMoeda(valor) { return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); },
    formatarData(data) { if (!data) return "-"; const valor = new Date(`${String(data).slice(0, 10)}T12:00:00`); return Number.isNaN(valor.getTime()) ? String(data) : valor.toLocaleDateString("pt-BR"); },
    formatarDataHora(data) { if (!data) return "-"; const valor = new Date(data); return Number.isNaN(valor.getTime()) ? String(data) : valor.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); },
    mensagem(texto) { const el = document.getElementById("arquivosMensagem"); if (el) { el.textContent = texto; el.classList.add("is-visible"); } },
    revogarPdfUrl() { if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl); this.pdfUrl = ""; },
    escapar(valor) { const el = document.createElement("div"); el.textContent = String(valor ?? ""); return el.innerHTML; },
    escaparAtributo(valor) { return this.escapar(valor).replace(/"/g, "&quot;"); }
};

document.addEventListener("DOMContentLoaded", () => {
    void DocumentArchiveController.iniciar().catch(erro => {
        console.error("Nao foi possivel abrir os arquivos de orcamento.", erro);
        DocumentArchiveController.mensagem("Não foi possível abrir os arquivos de orçamento.");
    });
});
