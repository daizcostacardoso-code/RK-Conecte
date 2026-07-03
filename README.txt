PROJETO VIDRAÇARIA - VERSÃO DE LANÇAMENTO

Estrutura:
- index.html: página inicial
- paginas/: telas internas do site e do funcionário
- css/: estilos do projeto
- js/: módulos JavaScript
- imagens/: logo e imagens do projeto

Fluxo de uso:
1. Abra index.html no navegador.
2. O cliente pode solicitar orçamento em paginas/orcamento.html ou enviar contato em paginas/contato.html.
3. Acesse paginas/login.html com:
   Usuário: admin
   Senha: 1234
4. No painel do funcionário, veja as solicitações recebidas.
5. Clique em Criar orçamento para aproveitar os dados do cliente no novo orçamento.
6. Cadastre os valores em paginas/valores.html antes de calcular.
7. Gere o PDF no novo orçamento.

Observações:
- Os dados são salvos no localStorage do navegador.
- Para o PDF funcionar, a biblioteca jsPDF é carregada pela internet.
- A logo usada no PDF fica em imagens/logo.jpeg.
