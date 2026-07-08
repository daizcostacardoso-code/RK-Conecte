# Visao futura - Orcamento Inteligente de Vidracaria

Este documento registra uma visao tecnica e de produto para melhorias futuras. Nada daqui foi implementado nesta etapa; serve apenas como referencia para proximas sprints.

## Visualizacao futura

- Criar um modo de conferencia final com leitura parecida com proposta: cliente, obra, itens, totais e alertas em uma unica tela.
- Adicionar indicadores visuais por item: medida conferida, valor informado, subtotal calculado, dependencias pendentes e margem minima.
- Exibir resumo fixo em desktop e resumo recolhivel em mobile, com total geral sempre visivel.
- Criar estados vazios mais orientados, mostrando o proximo passo esperado sem parecer texto de manual.
- Adicionar chips visuais para unidades: cm, m2, unidade, R$ e porcentagem.
- Melhorar a tabela de itens no mobile com cards compactos em vez de tabela horizontal quando houver muitos campos.
- Diferenciar visualmente informacoes do cliente, controle interno e informacoes que vao para o PDF do cliente.

## Logica futura de orcamento de vidracaria

- Criar regras por tipo de servico: box, porta, janela, espelho, vidro fixo, fachada e guarda-corpo.
- Separar vidro, ferragens, mao de obra, instalacao, transporte e acabamento como componentes de custo.
- Criar margem minima por categoria, com alerta quando desconto reduzir lucro abaixo do limite.
- Permitir kits comerciais: exemplo, box com vidro + kit + puxador + vedacao.
- Calcular perdas tecnicas e sobra de corte por tipo de vidro.
- Preparar tabela de precos por espessura, acabamento, cor, temperado, laminado e espelho.
- Criar validacoes por medida minima/maxima para evitar propostas tecnicamente inviaveis.
- Criar historico de revisoes do orcamento, mantendo versoes enviadas ao cliente.
- Separar condicoes comerciais internas das condicoes comerciais publicas, permitindo decidir o que aparece no PDF.

## Layout futuro

- Criar modo compacto para celular, com uma etapa por tela e acoes principais no fim do painel.
- Transformar a etapa de itens em um construtor guiado com blocos: tipo, medida, quantidade, valor e observacoes.
- Usar icones consistentes por dominio: cliente, projeto, servico, medida, dinheiro, documento e aprovacao.
- Criar preview lateral do PDF em desktop e preview em tela cheia no mobile.
- Melhorar o documento comercial com versoes: proposta para cliente, ficha interna e ordem de producao.
- Adicionar filtros de leitura no resumo: comercial, tecnico, financeiro e producao.
- Criar padrao visual unico para campos obrigatorios, campos opcionais e campos internos.

## Cuidados antes de implementar

- Nao alterar calculo sem mapear regras reais da RK Vidracaria.
- Nao misturar informacao interna com PDF enviado ao cliente.
- Validar nomes, unidades e valores com usuarios reais antes de fixar textos.
- Manter Repository Pattern e Document Pipeline como fronteiras principais.
- Priorizar melhorias pequenas e testaveis por modulo.

