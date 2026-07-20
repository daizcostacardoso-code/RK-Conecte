const { readdirSync } = require("node:fs");
const { join, relative, resolve } = require("node:path");
const { spawnSync } = require("node:child_process");

const raizProjeto = resolve(__dirname, "..");
const raizJavaScript = join(raizProjeto, "js");
const diretoriosIgnorados = new Set(["vendor"]);

function listarArquivos(diretorio) {
  return readdirSync(diretorio, { withFileTypes: true }).flatMap(entrada => {
    const caminho = join(diretorio, entrada.name);

    if (entrada.isDirectory()) {
      return diretoriosIgnorados.has(entrada.name) ? [] : listarArquivos(caminho);
    }

    return entrada.isFile() && entrada.name.endsWith(".js") ? [caminho] : [];
  });
}

const arquivos = listarArquivos(raizJavaScript);
const falhas = [];

for (const arquivo of arquivos) {
  const resultado = spawnSync(process.execPath, ["--check", arquivo], {
    cwd: raizProjeto,
    encoding: "utf8"
  });

  if (resultado.status !== 0) {
    falhas.push({
      arquivo: relative(raizProjeto, arquivo),
      mensagem: String(resultado.stderr || resultado.stdout || "Erro de sintaxe.").trim()
    });
  }
}

if (falhas.length) {
  console.error(`Falha de sintaxe em ${falhas.length} arquivo(s):`);
  falhas.forEach(falha => console.error(`\n${falha.arquivo}\n${falha.mensagem}`));
  process.exit(1);
}

console.log(`Sintaxe validada em ${arquivos.length} arquivo(s) JavaScript.`);
