const HealthService = require("../services/health-service");

async function health(req, res) {
    res.status(200).json(HealthService.getHealth());
}

async function dbHealth(req, res) {
    const resultado = await HealthService.getDatabaseHealth();
    res.status(resultado.ok ? 200 : 503).json(resultado);
}

module.exports = {
    health,
    dbHealth
};

