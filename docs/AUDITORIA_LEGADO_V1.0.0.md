# Auditoria de legado v1.0.0

- `orcamentos/atual`: nenhuma gravação de produção; leitura de compatibilidade preservada e coberta por testes.
- `local-storage-adapter.js` e `memory-adapter.js`: não referenciados pelas páginas publicadas. Permanecem porque use cases ainda possuem contratos históricos e a remoção exige análise adicional.
- pilha antiga de projetos (`repositories/projeto-repository.js`, `projeto-storage.js` e use cases): ainda carregada por páginas internas; não pode ser removida com segurança.
- API Node/MySQL: inexistentes na base obrigatória.
- Railway: nenhum arquivo, workflow ou referência versionada encontrado. Por inferência, a checagem vem de integração instalada/configurada no GitHub; deve ser retirada das regras de branch ou GitHub App, não recriada no código.
- Exclusões: nenhuma, por falta de evidência suficiente de ausência de consumidores indiretos. A compatibilidade de leitura foi preservada.
