const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const zlib = require("node:zlib");

const raiz = resolve(__dirname, "..");

function lerPngRgba(caminho) {
    const arquivo = readFileSync(caminho);
    assert.equal(arquivo.subarray(1, 4).toString("ascii"), "PNG");
    const largura = arquivo.readUInt32BE(16);
    const altura = arquivo.readUInt32BE(20);
    const profundidade = arquivo[24];
    const tipoCor = arquivo[25];
    assert.equal(profundidade, 8);
    assert.equal(tipoCor, 6, "o contrato visual espera PNG RGBA");

    let offset = 8;
    const blocos = [];
    while (offset < arquivo.length) {
        const tamanho = arquivo.readUInt32BE(offset);
        const tipo = arquivo.subarray(offset + 4, offset + 8).toString("ascii");
        if (tipo === "IDAT") blocos.push(arquivo.subarray(offset + 8, offset + 8 + tamanho));
        offset += 12 + tamanho;
        if (tipo === "IEND") break;
    }

    const bruto = zlib.inflateSync(Buffer.concat(blocos));
    const bytesPorPixel = 4;
    const passo = largura * bytesPorPixel;
    const pixels = Buffer.alloc(largura * altura * bytesPorPixel);
    let origem = 0;
    let destino = 0;
    let anterior = Buffer.alloc(passo);

    const paeth = (a, b, c) => {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
    };

    for (let y = 0; y < altura; y++) {
        const filtro = bruto[origem++];
        const linha = Buffer.from(bruto.subarray(origem, origem + passo));
        origem += passo;
        for (let x = 0; x < passo; x++) {
            const esquerda = x >= bytesPorPixel ? linha[x - bytesPorPixel] : 0;
            const cima = anterior[x] || 0;
            const diagonal = x >= bytesPorPixel ? anterior[x - bytesPorPixel] : 0;
            if (filtro === 1) linha[x] = (linha[x] + esquerda) & 255;
            else if (filtro === 2) linha[x] = (linha[x] + cima) & 255;
            else if (filtro === 3) linha[x] = (linha[x] + Math.floor((esquerda + cima) / 2)) & 255;
            else if (filtro === 4) linha[x] = (linha[x] + paeth(esquerda, cima, diagonal)) & 255;
            else assert.equal(filtro, 0, `filtro PNG inesperado: ${filtro}`);
        }
        linha.copy(pixels, destino);
        destino += passo;
        anterior = linha;
    }
    return { largura, altura, pixels };
}

function pixel(imagem, x, y) {
    const i = (y * imagem.largura + x) * 4;
    return Array.from(imagem.pixels.subarray(i, i + 4));
}

test("icone de splash se mistura ao fundo e preserva area segura central", () => {
    const imagem = lerPngRgba(resolve(raiz, "imagens/icons/maskable-1024.png"));
    const fundo = [4, 21, 34, 255];
    assert.deepEqual(pixel(imagem, 0, 0), fundo);
    assert.deepEqual(pixel(imagem, 1023, 1023), fundo);
    assert.deepEqual(pixel(imagem, 512, 80), fundo);
    assert.notDeepEqual(pixel(imagem, 512, 512), fundo);

    let minimoX = imagem.largura;
    let minimoY = imagem.altura;
    let maximoX = -1;
    let maximoY = -1;
    for (let y = 0; y < imagem.altura; y++) {
        for (let x = 0; x < imagem.largura; x++) {
            const atual = pixel(imagem, x, y);
            if (atual.some((valor, indice) => valor !== fundo[indice])) {
                minimoX = Math.min(minimoX, x);
                minimoY = Math.min(minimoY, y);
                maximoX = Math.max(maximoX, x);
                maximoY = Math.max(maximoY, y);
            }
        }
    }
    const ocupacao = Math.max(maximoX - minimoX + 1, maximoY - minimoY + 1) / imagem.largura;
    assert.ok(ocupacao <= 0.53, `simbolo ocupa ${(ocupacao * 100).toFixed(1)}% do canvas; esperado no maximo 53%`);
});
