const { app } = require("./app");
const { env } = require("./config/env");
const { closePool } = require("./database/mysql");

const server = app.listen(env.port, () => {
    console.log(`RK-Conecte API listening on port ${env.port}`);
});

let shuttingDown = false;

async function shutdown() {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    await closePool();
    server.close(() => {
        process.exitCode = 0;
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
