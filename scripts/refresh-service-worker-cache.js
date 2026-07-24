const { readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");

const arquivo = resolve(__dirname, "..", "sw.js");
const fonte = readFileSync(arquivo, "utf8");
const carimbo = new Date().toISOString().replace(/[-:.TZ]/g, "");
const cache = `rk-conecte-v1.0.0-${carimbo}`;
const atualizado = fonte.replace(
  /const RK_CACHE = 'rk-conecte-v1\.0\.0[^']*';/,
  `const RK_CACHE = '${cache}';`
);

if (atualizado === fonte) {
  throw new Error("Não foi possível localizar a versão de cache do service worker.");
}

writeFileSync(arquivo, atualizado, "utf8");
console.log(`Cache do service worker renovado: ${cache}`);
