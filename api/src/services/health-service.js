const { testConnection } = require("../database/mysql");

function getHealth() {
    return {
        ok: true,
        status: "OK",
        service: "rk-conecte-api",
        timestamp: new Date().toISOString()
    };
}

async function getDatabaseHealth() {
    try {
        const database = await testConnection();

        return {
            ok: true,
            status: "OK",
            database,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            ok: false,
            status: "ERRO",
            message: "MySQL indisponivel ou nao configurado.",
            error: error.code || error.message,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = {
    getHealth,
    getDatabaseHealth
};

