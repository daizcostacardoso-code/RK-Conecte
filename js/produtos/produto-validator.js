const ProdutoValidator = {
    validar(produto = {}) {
        const erros = [];
        if (!String(produto.descricao || produto.nome || '').trim()) erros.push('Descricao do produto e obrigatoria.');
        if (!Number(produto.categoria_id || produto.categoriaId)) erros.push('Categoria do produto e obrigatoria.');
        if (!Number(produto.unidade_id || produto.unidadeId)) erros.push('Unidade de medida e obrigatoria.');
        if (Number(produto.valor_custo ?? 0) < 0) erros.push('Valor de custo invalido.');
        if (Number(produto.valor_venda ?? 0) < 0) erros.push('Valor de venda invalido.');
        return { valido: erros.length === 0, erros };
    }
};
window.ProdutoValidator = ProdutoValidator;
