# RK Vidraçaria v2.0.0

Projeto reorganizado da RK Vidraçaria para novas melhorias.

## Publicação

Abra o PowerShell nesta pasta e execute:

```powershell
firebase use rk-vidracaria
firebase deploy
```

## Estrutura

- `index.html` - site institucional.
- `paginas/` - telas do sistema e páginas internas.
- `css/` - estilos.
- `js/` - regras do orçamento, valores, PDF, Firestore e utilitários.
- `imagens/` - logo e imagens do projeto.
- `docs/` - documentação técnica.
- `firebase.json`, `.firebaserc`, `firestore.rules` - publicação e banco.

## Mudança importante no cálculo

O campo **Alumínio** agora é calculado automaticamente por medida linear interna, sem campo extra na tela.

Fórmula usada por item:

```text
metrosAluminio = (maior medida em cm / 100) * quantidade
totalAluminio = valorAluminioPorMetro * metrosAluminio
Ex.: alumínio R$100/m -> peça com 100cm = R$100; peça com 150cm = R$150
```

O vidro e os adicionais de cor continuam por m². Acessórios continuam como valor manual por item.


## v2.1.0
- Alumínio passou a usar metro reto pela maior medida da peça, sem perímetro e sem m².
- Página de solicitação do cliente agora permite adicionar/excluir vários itens.
- Solicitações do cliente são salvas em `solicitacoes_site` no Firestore e aparecem no dashboard do funcionário.
- Funcionário pode abrir a solicitação já com cliente, itens, valores e observações prontos para gerar PDF ou ajustar.


## v2.2.0 - Orçamento do cliente sem valores

- A tela pública de orçamento não mostra preços para o cliente.
- O cliente pode adicionar/remover vários produtos antes de enviar.
- Ao enviar, aparece um popup de confirmação na tela.
- Para testar sem publicar: abra `paginas/orcamento.html`, envie um pedido e depois abra `paginas/funcionario.html` no mesmo navegador. O pedido aparece via localStorage.
- Contato atualizado: (73) 9981-9768.
- Endereço atualizado: Rua Guimarães, 336 - Nilo Fraga, Porto Seguro.

## v2.8 - Mobile aprimorado
- Cabeçalho compacto e fixo no celular.
- Abas do painel com rolagem horizontal suave.
- Cards, caixa, solicitações, ferramentas e formulários otimizados para toque.
- Login e tela de carregamento ajustados para telas pequenas.
- Tabelas e ações melhoradas para leitura no celular.


## v3.0 - Mobile + aplicativo

- Adicionado `manifest.webmanifest` para instalação como aplicativo no celular.
- Adicionado `sw.js` com atualização de cache para evitar versões antigas presas no navegador.
- Adicionado botão flutuante **Instalar app**.
- Refinado layout mobile: cabeçalho fixo, menu inferior, abas com rolagem suave, botões maiores e cards mais legíveis.

Para instalar no celular depois de publicar no Firebase Hosting:
1. Acesse o site pelo Chrome/Edge no Android ou Safari no iPhone.
2. Toque em **Instalar app** ou use o menu do navegador.
3. Escolha **Adicionar à tela inicial**.


## v3.1.0
- Botão de instalação mais discreto no mobile.
- Correção do cabeçalho do painel no celular para evitar sobreposição do nome/login.
- Cache PWA atualizado.
