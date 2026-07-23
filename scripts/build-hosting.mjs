import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const ROOT_FILES = [
  "404.html",
  "index.html",
  "manifest.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "sw.js"
];
const PUBLIC_DIRECTORIES = ["assets", "css", "Icones", "imagens", "js", "paginas"];
const ALLOWED_EXTENSIONS = new Set([
  ".html", ".css", ".js", ".json", ".png", ".jpg", ".jpeg",
  ".webp", ".gif", ".svg", ".ico", ".mp4", ".woff", ".woff2",
  ".ttf", ".otf", ".pdf"
]);
const FORBIDDEN_SEGMENTS = new Set([
  ".git", ".firebase", ".backups", ".vscode", "node_modules", "tests",
  "test-results", "scripts", "docs", "patchs", "tmp", "coverage", "dist"
]);

let copiedFiles = 0;
let copiedBytes = 0;
let ignoredFiles = 0;

function normalize(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function assertSafePath(relativePath) {
  const segments = normalize(relativePath).split("/").filter(Boolean);
  const forbidden = segments.find(segment => FORBIDDEN_SEGMENTS.has(segment) || segment.startsWith("."));
  if (forbidden) throw new Error(`Caminho proibido no pacote publico: ${relativePath}`);
}

async function copyPublicFile(relativePath) {
  assertSafePath(relativePath);
  const source = path.join(ROOT, relativePath);
  const destination = path.join(DIST, relativePath);
  const info = await stat(source);
  if (!info.isFile()) throw new Error(`Arquivo publico invalido: ${relativePath}`);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
  copiedFiles += 1;
  copiedBytes += info.size;
}

async function copyPublicDirectory(relativeDirectory) {
  const sourceDirectory = path.join(ROOT, relativeDirectory);
  const entries = await readdir(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    assertSafePath(relativePath);

    if (entry.isSymbolicLink()) {
      throw new Error(`Link simbolico nao permitido no pacote publico: ${relativePath}`);
    }
    if (entry.isDirectory()) {
      await copyPublicDirectory(relativePath);
      continue;
    }
    if (!entry.isFile()) continue;

    const extension = path.extname(entry.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      ignoredFiles += 1;
      continue;
    }
    await copyPublicFile(relativePath);
  }
}

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

for (const file of ROOT_FILES) await copyPublicFile(file);
for (const directory of PUBLIC_DIRECTORIES) await copyPublicDirectory(directory);

console.log(`Pacote de Hosting gerado em dist/: ${copiedFiles} arquivos, ${(copiedBytes / 1024 / 1024).toFixed(2)} MiB.`);
if (ignoredFiles) console.log(`${ignoredFiles} arquivo(s) nao publico(s) foram ignorados pela lista segura.`);
