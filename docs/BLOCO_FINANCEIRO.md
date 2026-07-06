# Bloco Financeiro

## Caixa

O caixa da empresa permanece compativel com o deploy atual:

- LocalStorage: `vidracaria_caixa_empresa`
- Firestore: `caixa_empresa`

A sprint de blindagem adiciona o modulo `js/caixa/` para normalizar dados legados, centralizar persistencia, exportar backup JSON e preparar migracao futura para SQL.

## Regra de seguranca dos dados

- Nao apagar lancamentos antigos automaticamente.
- Nao trocar a colecao `caixa_empresa` sem migracao.
- Nao descartar registros antigos por falta de campos novos.
- Exportar backup JSON antes de qualquer migracao estrutural.

## Backup

O backup JSON usa o formato `rk-caixa-backup-AAAA-MM-DD.json`:

```json
{
  "sistema": "RK-Conecte",
  "modulo": "caixa",
  "schemaVersion": 1,
  "exportadoEmISO": "",
  "total": 0,
  "dados": []
}
```
