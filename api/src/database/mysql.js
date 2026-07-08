const mysql = require("mysql2/promise");

const { env } = require("../config/env");

let pool = null;

function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: env.db.host,
            port: env.db.port,
            user: env.db.user,
            password: env.db.password,
            database: env.db.name,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            namedPlaceholders: true
        });
    }

    return pool;
}

async function testConnection() {
    const [rows] = await getPool().query("SELECT 1 AS ok");

    return {
        ok: rows?.[0]?.ok === 1,
        host: env.db.host,
        port: env.db.port,
        database: env.db.name
    };
}

async function closePool() {
    if (!pool) {
        return;
    }

    await pool.end();
    pool = null;
}

module.exports = {
    getPool,
    testConnection,
    closePool
};

