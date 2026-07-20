const NotaServicoPDF = {
    async gerar(dados) {
        if (!globalThis.PDFLib) throw new Error("pdf-lib indisponível");
        const { PDFDocument, StandardFonts, rgb } = globalThis.PDFLib;
        const doc = await PDFDocument.create();
        const fonte = await doc.embedFont(StandardFonts.Helvetica);
        const negrito = await doc.embedFont(StandardFonts.HelveticaBold);
        const logo = await this.carregarLogo(doc);
        const c = { doc, fonte, negrito, rgb, logo, pagina: null, y: 0, dados };
        this.novaPagina(c); this.blocoCliente(c, dados); this.tabelaCabecalho(c);
        dados.servicos.forEach(item => this.linhaServico(c, item));
        this.totais(c, dados); this.detalhes(c, dados); this.assinaturas(c, dados); this.numerarPaginas(c);
        const bytes = await doc.save(); this.baixar(bytes, this.nomeArquivo(dados)); return bytes;
    },
    async carregarLogo(doc) { try { const resposta = await fetch("../imagens/logo.jpeg"); if (!resposta.ok) return null; return await doc.embedJpg(await resposta.arrayBuffer()); } catch (_) { return null; } },
    novaPagina(c) {
        c.pagina = c.doc.addPage([595.28, 841.89]);
        c.pagina.drawRectangle({ x: 32, y: 754, width: 531, height: 60, color: c.rgb(.93,.97,1), borderColor: c.rgb(.03,.24,.40), borderWidth: 1 });
        c.pagina.drawRectangle({ x: 32, y: 754, width: 7, height: 60, color: c.rgb(.03,.24,.40) });
        if (c.logo) c.pagina.drawImage(c.logo, { x: 49, y: 764, width: 40, height: 40 });
        c.pagina.drawText("RK VIDRAÇARIA", { x: 100, y: 790, size: 14, font: c.negrito, color: c.rgb(.03,.16,.28) });
        c.pagina.drawText("Agilidade e Excelência", { x: 100, y: 775, size: 8.5, font: c.fonte, color: c.rgb(.28,.36,.43) });
        c.pagina.drawText("(73) 9981-9768", { x: 100, y: 762, size: 8.5, font: c.fonte, color: c.rgb(.28,.36,.43) });
        c.pagina.drawText("NOTA DE SERVIÇO", { x: 414, y: 788, size: 11, font: c.negrito, color: c.rgb(.03,.24,.40) });
        c.pagina.drawText(this.limitar(c.dados.numeroNota || "-", 24), { x: 432, y: 770, size: 9, font: c.negrito }); c.y = 733;
    },
    titulo(c, texto) { c.pagina.drawText(texto, { x: 32, y: c.y, size: 9, font: c.negrito, color: c.rgb(.03,.24,.40) }); c.y -= 16; },
    blocoCliente(c, d) {
        this.titulo(c, "DADOS DO CLIENTE E DO SERVIÇO");
        const linhas = [[`Cliente: ${d.clienteNome || "-"}`,`CPF/CNPJ: ${d.clienteDocumento || "-"}`],[`Telefone: ${d.clienteTelefone || "-"}`,`E-mail: ${d.clienteEmail || "-"}`],[`Endereço: ${d.clienteEndereco || "-"}`,`Emissão: ${this.dataBr(d.dataEmissao)}`],[`Local do serviço: ${d.localServico || "-"}`,`Conclusão: ${this.dataBr(d.dataConclusao)}`],[`Responsável: ${d.responsavel || "-"}`,`Status: ${d.status || "-"}`]];
        linhas.forEach(par => { c.pagina.drawText(this.cortar(par[0],321,c.fonte,8.3),{x:38,y:c.y,size:8.3,font:c.fonte}); c.pagina.drawText(this.cortar(par[1],185,c.fonte,8.3),{x:370,y:c.y,size:8.3,font:c.fonte}); c.y-=14; }); c.y-=14;
    },
    tabelaCabecalho(c) { c.pagina.drawRectangle({x:32,y:c.y-5,width:531,height:23,color:c.rgb(.03,.24,.40)}); [["Descrição",39],["Quant.",330],["Unid.",374],["Valor unit.",414],["Total",500]].forEach(([texto,x])=>c.pagina.drawText(texto,{x,y:c.y+3,size:7.8,font:c.negrito,color:c.rgb(1,1,1)})); c.y-=18; },
    linhaServico(c,item) {
        const linhas=this.quebrar(item.descricao,280,c.fonte,8.2); const altura=Math.max(28,linhas.length*10+12); if(c.y-altura<135){this.novaPagina(c);this.tabelaCabecalho(c);} const base=c.y-altura;
        c.pagina.drawRectangle({x:32,y:base,width:531,height:altura,borderColor:c.rgb(.78,.84,.88),borderWidth:.6,color:c.rgb(1,1,1)}); [322,366,406,488].forEach(x=>c.pagina.drawLine({start:{x,y:base},end:{x,y:c.y},thickness:.6,color:c.rgb(.78,.84,.88)}));
        this.desenharLinhas(c,linhas,39,c.y-15,8.2); c.pagina.drawText(NotaServicoModel.formatarNumero(item.quantidade),{x:331,y:c.y-17,size:8,font:c.fonte}); c.pagina.drawText(this.limitar(item.unidade,7),{x:375,y:c.y-17,size:8,font:c.fonte}); c.pagina.drawText(this.moedaCurta(item.valorUnitario),{x:414,y:c.y-17,size:7.6,font:c.fonte}); c.pagina.drawText(this.moedaCurta(item.quantidade*item.valorUnitario),{x:495,y:c.y-17,size:7.6,font:c.negrito}); c.y=base;
    },
    totais(c,d) { if(c.y-78<125)this.novaPagina(c); c.y-=12; const subtotal=NotaServicoModel.subtotal(d),total=NotaServicoModel.total(d); c.pagina.drawRectangle({x:355,y:c.y-57,width:208,height:62,color:c.rgb(.95,.97,.98),borderColor:c.rgb(.72,.79,.84),borderWidth:.7}); this.rotuloValor(c,"Subtotal",NotaServicoModel.moeda(subtotal),c.y-11,false); this.rotuloValor(c,"Desconto",NotaServicoModel.moeda(d.desconto),c.y-29,false); c.pagina.drawLine({start:{x:367,y:c.y-36},end:{x:551,y:c.y-36},thickness:.6,color:c.rgb(.65,.72,.77)}); this.rotuloValor(c,"TOTAL",NotaServicoModel.moeda(total),c.y-51,true); c.y-=70; },
    rotuloValor(c,r,v,y,d) { c.pagina.drawText(r,{x:367,y,size:d?9:8,font:d?c.negrito:c.fonte}); const f=d?c.negrito:c.fonte,s=d?10:8,w=f.widthOfTextAtSize(v,s); c.pagina.drawText(v,{x:551-w,y,size:s,font:f,color:d?c.rgb(.03,.24,.40):c.rgb(.08,.16,.21)}); },
    detalhes(c,d) { const textos=[`Pagamento: ${d.formaPagamento||"-"}${d.condicaoPagamento?` - ${d.condicaoPagamento}`:""}`,`Garantia: ${d.garantia||"-"}`,`Referência: ${d.referencia||"-"}`,`Observações: ${d.observacoes||"-"}`]; let linhas=[]; textos.forEach(t=>linhas=linhas.concat(this.quebrar(t,515,c.fonte,8.3))); if(c.y-(linhas.length*11+34)<105)this.novaPagina(c); this.titulo(c,"PAGAMENTO E OBSERVAÇÕES"); this.desenharLinhas(c,linhas,38,c.y,8.3); c.y-=linhas.length*11+22; },
    assinaturas(c,d) { if(c.y<92)this.novaPagina(c); c.pagina.drawLine({start:{x:38,y:c.y},end:{x:250,y:c.y},thickness:.7}); c.pagina.drawLine({start:{x:345,y:c.y},end:{x:557,y:c.y},thickness:.7}); c.pagina.drawText("RK Vidraçaria / Responsável",{x:91,y:c.y-14,size:7.5,font:c.fonte}); c.pagina.drawText("Cliente",{x:439,y:c.y-14,size:7.5,font:c.fonte}); c.pagina.drawText(`Emissão: ${this.dataBr(d.dataEmissao)}`,{x:32,y:30,size:7.5,font:c.fonte}); },
    numerarPaginas(c) { const ps=c.doc.getPages(); ps.forEach((p,i)=>p.drawText(`Página ${i+1} de ${ps.length}`,{x:505,y:30,size:7.3,font:c.fonte})); },
    quebrar(texto,largura,fonte,tamanho) { const palavras=String(texto||"-").split(/\s+/),linhas=[]; let atual=""; palavras.forEach(p=>{const teste=atual?`${atual} ${p}`:p;if(fonte.widthOfTextAtSize(teste,tamanho)<=largura)atual=teste;else{if(atual)linhas.push(atual);atual=p;while(fonte.widthOfTextAtSize(atual,tamanho)>largura&&atual.length>1){let parte=atual;while(parte.length>1&&fonte.widthOfTextAtSize(parte,tamanho)>largura)parte=parte.slice(0,-1);linhas.push(parte);atual=atual.slice(parte.length);}}});if(atual)linhas.push(atual);return linhas.length?linhas:["-"]; },
    desenharLinhas(c,linhas,x,y,tamanho){linhas.forEach((l,i)=>c.pagina.drawText(l,{x,y:y-i*11,size:tamanho,font:c.fonte}));},
    cortar(texto,largura,fonte,tamanho){let t=String(texto);if(fonte.widthOfTextAtSize(t,tamanho)<=largura)return t;while(t.length>3&&fonte.widthOfTextAtSize(`${t}...`,tamanho)>largura)t=t.slice(0,-1);return `${t}...`;},
    limitar(t,l){return String(t||"-").slice(0,l);}, moedaCurta(v){return `R$ ${Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`;}, dataBr(data){if(!/^\d{4}-\d{2}-\d{2}$/.test(data||""))return "-";const[a,m,d]=data.split("-");return `${d}/${m}/${a}`;},
    nomeArquivo(d){const c=String(d.clienteNome||"cliente").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").slice(0,45)||"cliente";const n=String(d.numeroNota||"nota").replace(/[^a-z0-9-]+/gi,"-");return `RK-Nota-Servico-${n}-${c}.pdf`;},
    baixar(bytes,nome){const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"})),a=document.createElement("a");a.href=url;a.download=nome;document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1500);}
};
