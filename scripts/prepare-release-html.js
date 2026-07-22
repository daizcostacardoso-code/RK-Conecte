const { readFileSync, writeFileSync, readdirSync } = require("node:fs");
const { resolve } = require("node:path");

const root = resolve(__dirname, "..");
const protectedPages = ["acessos.html","arquivos.html","caixa.html","clientes.html","compartilhar-documento.html","dashboard-comercial.html","funcionario.html","loading.html","medicao-obra.html","nota-servico.html","novo-orcamento.html","orcamento-inteligente.html","orcamento.html","produtos.html","projetos.html","valores.html"];
for (const name of protectedPages) {
  const path = resolve(root, "paginas", name);
  let html = readFileSync(path, "utf8");
  html = html.replace('<html lang="pt-BR">', '<html lang="pt-BR" class="rk-app-iniciando">');
  const marker = /(<meta name="viewport"[^>]*>)/;
  if (!html.includes("rk-loading-critical.css")) html = html.replace(marker, '$1\n    <link rel="stylesheet" href="../css/rk-loading-critical.css?v=1.0.0">\n    <script src="../js/shared/rk-loading.js?v=1.0.0"></script>');
  html = html.replace(/\?v=[0-9][0-9A-Za-z.-]*/g, "?v=1.0.0");
  writeFileSync(path, html);
}

for (const name of readdirSync(resolve(root, "paginas")).filter(name => name.endsWith(".html"))) {
  const path = resolve(root, "paginas", name);
  let html = readFileSync(path, "utf8");
  html = html.replace(/\?v=[0-9][0-9A-Za-z.-]*/g, "?v=1.0.0");
  writeFileSync(path, html);
}
