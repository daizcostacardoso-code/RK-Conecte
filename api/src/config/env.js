const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
    path: path.resolve(__dirname, "../../.env")
});

function toNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

const env = {
    port: toNumber(process.env.PORT, 3001),
    db: {
        host: process.env.DB_HOST || "localhost",
        port: toNumber(process.env.DB_PORT, 3306),
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        name: process.env.DB_NAME || "rk_conecte"
    }
};

module.exports = { env };

