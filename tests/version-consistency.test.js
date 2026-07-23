const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

test("artefatos publicados usam a versão central v1.0.1", () => {
  assert.equal(require(path.join(root, "package.json")).version, "1.0.1");
  assert.equal(require(path.join(root, "package-lock.json")).version, "1.0.1");
  assert.match(fs.readFileSync(path.join(root, "js/shared/rk-version.js"), "utf8"), /"v1\.0\.1"/);
  assert.match(fs.readFileSync(path.join(root, "sw.js"), "utf8"), /rk-conecte-v1\.0\.1/);
});

test("arquivos de produção não expõem versões antigas do RK-Conecte", () => {
  const files = ["index.html", "README.md", "docs/ESTADO_ATUAL.md", "paginas/loading.html", "js/shared/rk-navigation.js", "sw.js"];
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(text, /v0\.(?:4\.2|9\.0)/, file);
  }
});
