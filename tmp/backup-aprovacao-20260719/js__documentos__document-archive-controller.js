const DocumentArchiveController = {
    registros: [],
    selecionados: new Set(),
    pdfUrl: "",

    async iniciar() {
        document.getElementById("btnBuscarArquivos")?.addEventListener("click", () => this.buscar());
        document.getElementById("btnLimparArquivos")?.addEventListener("click", () => this.limparFiltros());
        document.getElementById("btnExcluirArquivosSelecionados")?.addEventListener("click", evento => this.excluirSelecionados(evento.currentTarget));
        document.getElementById("arquivosCorpo")?.addEventListener("click", evento => this.tratarAcao(evento));
        document.getElementById("arquivosCorpo")?.addEventListener("change", evento => this.alterarSelecao(evento));
        document.getElementById("arquivosSelecionarTodos")?.addEventListener("change", evento => this.selecionarTodos(evento.currentTarget.checked));
        document.getElementById("arquivosFecharPreview")?.addEventListener("click", () => this.fecharPreview());
        window.addEventListener("beforeunload", () => this.revogarPdfUrl());
        const parametros = new URLSearchParams(window.location.search || "");
        const numero = String(parametros.get("numero") || "").trim();
        this.obterTransferenciaPreview();
        const campoNumero = document.getElementById("filtroArquivoNumero");
        if (campoNumero && numero) campoNumero.value = numero;

        await this.buscar();

        if (parametros.get("preview") === "pdf") {
            const registroId = String(parametros.get("registro") || "").trim();
            const registro = this.registros.find(item => (
                (registroId && String(item.id || "") === registroId)
                || (numero && String(item.numero || "") === numero)
            ));

            if (registro) {
                await this.gerarPdf(registro, false);
            }
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
            return this.mensagem((resultado.erros || ["Nao foi possivel consultar o Firestore."]).join(" "));
        }
        this.registros = (resultado.registros || []).filter(registro => this.atendeFiltros(registro));
        this.selecionados.clear();
        this.renderizar();
        this.mensagem(this.registros.length ? `${this.registros.length} orçamento(s) encontrado(s).` : "Nenhum orçamento encontrado.");
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
        if (status && String(registro.status || "finalizado").toLowerCase() !== status) return false;
        return true;
    },

    renderizar() {
        const corpo = document.getElementById("arquivosCorpo");
        if (!corpo) return;
        if (!this.registros.length) {
            corpo.innerHTML = '<tr><td colspan="7" class="arquivos-vazio">Nenhum orçamento encontrado.</td></tr>';
            this.atualizarControlesSelecao();
            return;
        }
        corpo.innerHTML = this.registros.map(registro => `
            <tr>
                <td><input type="checkbox" data-arquivo-selecao value="${this.escaparAtributo(registro.id)}" aria-label="Selecionar orçamento ${this.escaparAtributo(registro.numero || registro.id)}" ${this.selecionados.has(String(registro.id)) ? "checked" : ""}></td>
                <td>${this.escapar(registro.numero || registro.id || "-")}</td>
                <td>${this.escapar(registro.clienteNome || registro.cliente?.nome || "-")}</td>
                <td>${this.formatarData(registro.dataEmissao)}</td>
                <td>${this.escapar(this.rotuloStatus(registro.status))}</td>
                <td>${this.formatarMoeda(this.totalRegistro(registro))}</td>
                <td><div class="arquivos-item-acoes">
                    <button type="button" data-arquivo-acao="preview" data-registro-id="${this.escaparAtributo(registro.id)}">Ver PDF</button>
                    <button type="button" data-arquivo-acao="download" data-registro-id="${this.escaparAtributo(registro.id)}">Baixar</button>
                    <button type="button" class="btn-tabela-excluir" data-arquivo-acao="excluir" data-registro-id="${this.escaparAtributo(registro.id)}">Excluir</button>
                </div></td>
            </tr>`).join("");
        this.atualizarControlesSelecao();
    },

    async tratarAcao(evento) {
        const botao = evento.target.closest("[data-arquivo-acao]");
        if (!botao) return;
        const registro = this.registros.find(item => String(item.id) === botao.dataset.registroId);
        if (registro && botao.dataset.arquivoAcao === "excluir") return this.excluir(registro, botao);
        if (!registro) return this.mensagem("Orçamento não encontrado.");
        await this.gerarPdf(registro, botao.dataset.arquivoAcao === "download");
    },

    async excluir(registro, botao) {
        const numero = registro.numero || registro.id || "selecionado";
        if (!window.confirm(`Excluir definitivamente o orcamento ${numero}?`)) return;
        botao.disabled = true;
        this.mensagem("Excluindo orcamento...");
        try {
            await DocumentPdfRepository.excluir(registro);
            this.registros = this.registros.filter(item => String(item.id) !== String(registro.id));
            this.selecionados.delete(String(registro.id));
            this.renderizar();
            this.fecharPreview();
            this.mensagem("Orçamento excluído.");
        } catch (erro) {
            botao.disabled = false;
            this.mensagem(erro.message || "Nao foi possivel excluir o orcamento.");
        }
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

    async excluirSelecionados(botao) {
        const registros = this.registros.filter(registro => this.selecionados.has(String(registro.id)));
        if (!registros.length) return this.mensagem("Selecione pelo menos um orçamento.");
        if (!window.confirm(`Excluir definitivamente ${registros.length} orçamento(s)?`)) return;
        botao.disabled = true;
        this.mensagem(`Excluindo ${registros.length} orçamento(s)...`);
        const excluidos = [];
        const erros = [];
        for (const registro of registros) {
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
        this.renderizar();
        if (excluidos.length) this.fecharPreview();
        if (erros.length) this.mensagem(`${excluidos.length} excluído(s). Não foi possível excluir: ${erros.join(", ")}.`);
        else this.mensagem(`${excluidos.length} orçamento(s) excluído(s).`);
    },

    async gerarPdf(registro, baixar = false) {
        const documento = DocumentPdfRepository.obterDocumento(registro);
        if (!documento) return this.mensagem("Este orçamento não possui dados suficientes para gerar o PDF.");
        this.mensagem("Gerando PDF...");
        const exportacao = ExportService.exportar(documento, { formato: "PDF", adapters: { PDF: PdfAdapter } });
        if (!exportacao.sucesso || typeof exportacao.arquivo?.gerar !== "function") {
            return this.mensagem((exportacao.erros || ["Não foi possível preparar o PDF."]).join(" "));
        }
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
        const objeto = document.getElementById("arquivosPdfObjeto");
        const abrir = document.getElementById("arquivosAbrirPdf");
        const baixar = document.getElementById("arquivosBaixarPdf");
        objeto.data = `${this.pdfUrl}#view=FitH`;
        abrir.href = this.pdfUrl;
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
        document.getElementById("arquivosPreview").hidden = true;
        document.getElementById("arquivosPdfObjeto").removeAttribute("data");
        this.revogarPdfUrl();
    },

    limparFiltros() {
        ["filtroArquivoCliente", "filtroArquivoDocumento", "filtroArquivoNumero", "filtroArquivoStatus", "filtroArquivoDataInicial", "filtroArquivoDataFinal", "filtroArquivoValorMinimo", "filtroArquivoValorMaximo"]
            .forEach(id => { const campo = document.getElementById(id); if (campo) campo.value = ""; });
        this.buscar();
    },

    totalRegistro(registro) { return Number(registro.documento?.dados?.totais?.totalGeral || registro.totais?.totalGeral || registro.totais?.totalFinal || registro.totais?.total || 0); },
    rotuloStatus(status) { const valor = String(status || "finalizado").toLowerCase(); return valor.charAt(0).toUpperCase() + valor.slice(1); },
    formatarMoeda(valor) { return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); },
    formatarData(data) { if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "")) return data || "-"; const [a,m,d] = data.split("-"); return `${d}/${m}/${a}`; },
    mensagem(texto) { const el = document.getElementById("arquivosMensagem"); if (el) { el.textContent = texto; el.classList.add("is-visible"); } },
    revogarPdfUrl() { if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl); this.pdfUrl = ""; },
    escapar(valor) { const el = document.createElement("div"); el.textContent = String(valor ?? ""); return el.innerHTML; },
    escaparAtributo(valor) { return this.escapar(valor).replace(/"/g, "&quot;"); }
};

document.addEventListener("DOMContentLoaded", () => {
    void DocumentArchiveController.iniciar().catch(erro => {
        console.error("Nao foi possivel abrir o preview do orcamento finalizado.", erro);
        DocumentArchiveController.mensagem("Nao foi possivel abrir o preview automaticamente.");
    });
});
