const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

async function executar() {
    const chamadas = [];
    const contexto = {
        AbortController,
        URLSearchParams,
        window: {
            setTimeout,
            clearTimeout
        },
        ClienteModel: {
            normalizar(cliente) { return cliente; }
        },
        RKFirestoreStore: {
            async fetch(path, options = {}) {
                chamadas.push({ path, method: options.method || "GET" });

                if (path === "/clientes" && options.method === "POST") {
                    return new Response(JSON.stringify({ cliente_id: "rk_cliente_persistido" }), { status: 201 });
                }

                if (path === "/clientes/rk_cliente_persistido") {
                    return new Response(JSON.stringify({
                        dados: {
                            cliente_id: "rk_cliente_persistido",
                            nome: "Cliente Teste",
                            ativo: 1
                        }
                    }));
                }

                return new Response(JSON.stringify({ mensagem: "Registro nao encontrado." }), { status: 404 });
            }
        }
    };

    vm.createContext(contexto);
    const codigo = fs.readFileSync(require.resolve("../js/clientes/cliente-repository.js"), "utf8");
    vm.runInContext(`${codigo}\nglobalThis.repositorio = ClienteRepository;`, contexto);

    const cliente = await contexto.repositorio.salvarCliente({
        id: "cli_id_gerado_pelo_modelo",
        nome: "Cliente Teste",
        status: "ativo"
    }, { novo: true });

    assert.equal(cliente.id, "rk_cliente_persistido");
    assert.deepEqual(chamadas, [
        { path: "/clientes", method: "POST" },
        { path: "/clientes/rk_cliente_persistido", method: "GET" }
    ]);

    console.log("Cadastro de cliente: OK");
}

executar().catch(erro => {
    console.error(erro);
    process.exitCode = 1;
});
