const MedicaoPDF = {
    async gerar(dados) {
        if (!globalThis.PDFLib) throw new Error("pdf-lib indisponível");
        const { PDFDocument, StandardFonts, rgb } = globalThis.PDFLib;
        const doc = await PDFDocument.create();
        const fonte = await doc.embedFont(StandardFonts.Helvetica);
        const negrito = await doc.embedFont(StandardFonts.HelveticaBold);
        const logo = await this.carregarLogo(doc);
        const contexto = { doc, fonte, negrito, rgb, logo, pagina: null, y: 0 };
        this.novaPagina(contexto, dados);
        this.dadosCliente(contexto, dados);
        this.cabecalhoTabela(contexto);
        dados.medidas.forEach(medida => this.linhaTabela(contexto, dados, medida));
        this.rodape(contexto, dados);
        const bytes = await doc.save();
        this.baixar(bytes, this.nomeArquivo(dados));
    },
    async carregarLogo(doc) {
        try { const resposta = await fetch("../imagens/logo.jpeg"); if (!resposta.ok) return null; return await doc.embedJpg(await resposta.arrayBuffer()); } catch (_) { return null; }
    },
    novaPagina(c, dados) {
        c.pagina = c.doc.addPage([595.28, 841.89]); c.y = 790;
        c.pagina.drawRectangle({ x: 36, y: 755, width: 523, height: 58, color: c.rgb(.81,.94,.99), borderColor: c.rgb(.04,.28,.71), borderWidth: 1 });
        if (c.logo) c.pagina.drawImage(c.logo, { x: 48, y: 765, width: 38, height: 38 });
        c.pagina.drawText("RK Vidraçaria", { x: 98, y: 789, size: 15, font: c.negrito, color: c.rgb(.07,.18,.16) });
        c.pagina.drawText("(73) 9981-9768", { x: 98, y: 771, size: 9, font: c.fonte, color: c.rgb(.25,.34,.32) });
        c.pagina.drawText("MEDIDAS", { x: 455, y: 780, size: 13, font: c.negrito, color: c.rgb(.04,.28,.71) });
        c.y = 735;
    },
    dadosCliente(c, d) {
        c.pagina.drawText("DADOS DA OBRA", { x: 36, y: c.y, size: 10, font: c.negrito, color: c.rgb(.04,.28,.71) }); c.y -= 17;
        const campos = [
            `Cliente: ${d.clienteNome || "-"}`, `CPF/CNPJ: ${d.clienteDocumento || "-"}`,
            `Telefone: ${d.clienteTelefone || "-"}`, `Data: ${this.dataBr(d.dataMedicao)}`,
            `Endereço da obra: ${d.obraEndereco || "-"}`, `Responsável: ${d.responsavel || "-"}`
        ];
        campos.forEach((texto, i) => { const coluna = i % 2; const x = coluna ? 310 : 36; const largura = coluna ? 249 : 264; const linha = this.cortar(texto, largura, c.fonte, 9); c.pagina.drawText(linha, { x, y: c.y, size: 9, font: c.fonte }); if (coluna) c.y -= 16; });
        c.y -= 7;
    },
    cabecalhoTabela(c) {
        c.pagina.drawRectangle({ x: 36, y: c.y - 4, width: 523, height: 22, color: c.rgb(.04,.28,.71) });
        [["Quant.",42],["Tipo / Descrição",88],["Altura",294],["Largura",358],["Observação",422]].forEach(([t,x]) => c.pagina.drawText(t, { x, y: c.y + 3, size: 8, font: c.negrito, color: c.rgb(1,1,1) })); c.y -= 18;
    },
    linhaTabela(c, dados, m) {
        const tipo = m.descricao ? `${m.tipo} - ${m.descricao}` : m.tipo;
        const obs = m.observacao || "-";
        const linhasTipo = this.quebrar(tipo, 193, c.negrito, 8.5); const linhasObs = this.quebrar(obs, 132, c.negrito, 8.5);
        const altura = Math.max(28, Math.max(linhasTipo.length, linhasObs.length) * 11 + 10);
        if (c.y - altura < 105) { this.novaPagina(c, dados); this.cabecalhoTabela(c); }
        const base = c.y - altura;
        c.pagina.drawRectangle({ x: 36, y: base, width: 523, height: altura, borderColor: c.rgb(.82,.87,.85), borderWidth: .7, color: c.rgb(1,1,1) });
        [80,286,350,414].forEach(x => c.pagina.drawLine({ start:{x,y:base}, end:{x,y:c.y}, thickness:.7, color:c.rgb(.82,.87,.85) }));
        c.pagina.drawText(String(m.quantidade), { x: 50, y: c.y - 17, size: 9, font: c.negrito });
        this.desenharLinhas(c, linhasTipo, 88, c.y - 14, 8.5, c.negrito);
        c.pagina.drawText(`${MedicaoModel.formatarNumero(m.altura)} cm`, { x: 294, y: c.y - 17, size: 8.5, font: c.negrito });
        c.pagina.drawText(`${MedicaoModel.formatarNumero(m.largura)} cm`, { x: 358, y: c.y - 17, size: 8.5, font: c.negrito });
        this.desenharLinhas(c, linhasObs, 422, c.y - 14, 8.5, c.negrito); c.y = base;
    },
    rodape(c, d) {
        const linhas = this.quebrar(`Observações gerais: ${d.observacoesGerais || "-"}`, 515, c.fonte, 9);
        const necessario = linhas.length * 11 + 72;
        if (c.y - necessario < 40) this.novaPagina(c, d);
        c.y -= 18; c.pagina.drawText("OBSERVAÇÕES E CONFERÊNCIA", { x:36, y:c.y, size:9, font:c.negrito, color:c.rgb(.04,.28,.71) }); c.y -= 15;
        this.desenharLinhas(c, linhas, 36, c.y, 9); c.y -= linhas.length * 11 + 30;
        c.pagina.drawLine({ start:{x:36,y:c.y}, end:{x:255,y:c.y}, thickness:.7, color:c.rgb(.3,.3,.3) });
        c.pagina.drawLine({ start:{x:340,y:c.y}, end:{x:559,y:c.y}, thickness:.7, color:c.rgb(.3,.3,.3) });
        c.pagina.drawText("Responsável pela medição", { x:80, y:c.y-13, size:8, font:c.fonte });
        c.pagina.drawText("Assinatura do cliente", { x:399, y:c.y-13, size:8, font:c.fonte });
        c.pagina.drawText(`Data: ${this.dataBr(d.dataMedicao)}`, { x:36, y:35, size:8, font:c.fonte, color:c.rgb(.35,.4,.39) });
    },
    desenharLinhas(c, linhas, x, y, tamanho, fonte = c.fonte) { linhas.forEach((linha,i) => c.pagina.drawText(linha, { x, y:y-i*11, size:tamanho, font:fonte })); },
    quebrar(texto, largura, fonte, tamanho) {
        const palavras = String(texto).split(/\s+/); const linhas = []; let atual = "";
        palavras.forEach(p => { const teste = atual ? `${atual} ${p}` : p; if (fonte.widthOfTextAtSize(teste,tamanho) <= largura) atual = teste; else { if (atual) linhas.push(atual); atual = p; } }); if (atual) linhas.push(atual); return linhas.length ? linhas : ["-"];
    },
    cortar(texto, largura, fonte, tamanho) { let t = String(texto); while (t.length && fonte.widthOfTextAtSize(t,tamanho) > largura) t = `${t.slice(0,-2)}…`; return t; },
    dataBr(data) { if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "")) return "-"; const [a,m,d] = data.split("-"); return `${d}/${m}/${a}`; },
    nomeArquivo(d) { const nome = String(d.clienteNome || "cliente").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").slice(0,60) || "cliente"; return `RK-Vidracaria-Medicao-${nome}-${d.dataMedicao || MedicaoModel.dataHoje()}.pdf`; },
    baixar(bytes, nome) { const url = URL.createObjectURL(new Blob([bytes], { type:"application/pdf" })); const a = document.createElement("a"); a.href=url; a.download=nome; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
};
