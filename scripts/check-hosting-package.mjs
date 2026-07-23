import { lstat, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const REQUIRED_FILES = [
  "404.html", "index.html", "manifest.webmanifest", "robots.txt",
  "sitemap.xml", "sw.js", "paginas/login.html", "paginas/dashboard-comercial.html",
  "js/shared/rk-auth.js", "js/conecte-signature.js", "css/style.css"
];
const FORBIDDEN_SEGMENTS = new Set([
  ".git", ".firebase", ".backups", ".vscode", "node_modules", "tests",
  "test-results", "scripts", "docs", "patchs", "tmp", "coverage"
]);
const FORBIDDEN_ROOT_FILES = new Set([
  "firebase.json", "firestore.rules", "package.json", "package-lock.json",
  "README.md", "CHANGELOG.md", ".firebaserc", ".gitignore", ".gitattributes"
]);
const FORBIDDEN_SUFFIXES = [".log", ".bak", ".backup", ".patch", ".map", ".md"];
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_PACKAGE_BYTES = 40 * 1024 * 1024;

function slash(value) {
  return value.split(path.sep).join("/");
}

async function exists(relativePath) {
  try {
    return (await stat(path.join(DIST, relativePath))).isFile();
  } catch {
    return false;
  }
}

async function collect(directory = DIST, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = prefix ? path.join(prefix, entry.name) : entry.name;
    const fullPath = path.join(directory, entry.name);
    const info = await lstat(fullPath);
    if (info.isSymbolicLink()) throw new Error(`Link simbolico encontrado em dist/: ${slash(relativePath)}`);
    if (entry.isDirectory()) files.push(...await collect(fullPath, relativePath));
    else if (entry.isFile()) files.push({ relativePath: slash(relativePath), size: info.size });
  }
  return files;
}

function localReference(value) {
  const reference = String(value || "").trim();
  if (!reference || reference.startsWith("#") || reference.startsWith("//")) return false;
  if (/^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(reference)) return false;
  if (reference.includes("${") || reference.includes("{{")) return false;
  return true;
}

function resolveReference(htmlFile, reference) {
  const clean = decodeURIComponent(reference.split("#")[0].split("?")[0]);
  if (!clean || clean === "/") return "index.html";
  const candidate = clean.startsWith("/")
    ? clean.slice(1)
    : path.posix.normalize(path.posix.join(path.posix.dirname(htmlFile), clean));
  return candidate.endsWith("/") ? `${candidate}index.html` : candidate;
}

const firebaseConfig = JSON.parse(await readFile(path.join(ROOT, "firebase.json"), "utf8"));
if (firebaseConfig.hosting?.public !== "dist") {
  throw new Error('firebase.json deve publicar exclusivamente a pasta "dist".');
}

const files = await collect();
if (!files.length) throw new Error("dist/ esta vazio. Execute npm run build:hosting.");

let totalBytes = 0;
for (const file of files) {
  totalBytes += file.size;
  const segments = file.relativePath.split("/");
  const forbiddenSegment = segments.find(segment => FORBIDDEN_SEGMENTS.has(segment) || segment.startsWith("."));
  if (forbiddenSegment) throw new Error(`Caminho proibido em dist/: ${file.relativePath}`);
  if (segments.length === 1 && FORBIDDEN_ROOT_FILES.has(file.relativePath)) {
    throw new Error(`Arquivo interno publicado indevidamente: ${file.relativePath}`);
  }
  if (FORBIDDEN_SUFFIXES.some(suffix => file.relativePath.toLowerCase().endsWith(suffix))) {
    throw new Error(`Extensao proibida em dist/: ${file.relativePath}`);
  }
  if (file.size > MAX_FILE_BYTES) throw new Error(`Arquivo publico excessivamente grande: ${file.relativePath}`);
}
if (totalBytes > MAX_PACKAGE_BYTES) throw new Error("Pacote de Hosting maior que o limite de seguranca de 40 MiB.");

for (const required of REQUIRED_FILES) {
  if (!await exists(required)) throw new Error(`Arquivo obrigatorio ausente de dist/: ${required}`);
}

const manifest = JSON.parse(await readFile(path.join(DIST, "manifest.webmanifest"), "utf8"));
const manifestReferences = [
  ...(manifest.icons || []).map(item => item.src),
  ...(manifest.shortcuts || []).flatMap(item => [item.url, ...(item.icons || []).map(icon => icon.src)])
].filter(localReference);
for (const reference of manifestReferences) {
  const resolved = resolveReference("manifest.webmanifest", reference);
  if (!await exists(resolved)) throw new Error(`Referencia ausente no manifesto: ${reference} -> ${resolved}`);
}

const serviceWorker = await readFile(path.join(DIST, "sw.js"), "utf8");
const shellMatch = serviceWorker.match(/const APP_SHELL\s*=\s*\[([\s\S]*?)\];/);
if (!shellMatch) throw new Error("Nao foi possivel validar APP_SHELL em sw.js.");
for (const match of shellMatch[1].matchAll(/["'](\/[^"']*)["']/g)) {
  const resolved = resolveReference("sw.js", match[1]);
  if (!await exists(resolved)) throw new Error(`APP_SHELL aponta para arquivo ausente: ${match[1]} -> ${resolved}`);
}

for (const file of files.filter(item => item.relativePath.endsWith(".html"))) {
  const html = await readFile(path.join(DIST, file.relativePath), "utf8");
  for (const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    const reference = match[1];
    if (!localReference(reference)) continue;
    const resolved = resolveReference(file.relativePath, reference);
    if (!await exists(resolved)) {
      throw new Error(`Referencia local ausente em ${file.relativePath}: ${reference} -> ${resolved}`);
    }
  }
}

console.log(`Pacote de Hosting validado: ${files.length} arquivos, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB, nenhum artefato interno.`);
