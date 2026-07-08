const express = require("express");

const HealthController = require("../controllers/health-controller");

const router = express.Router();

router.get("/health", HealthController.health);
router.get("/db-health", HealthController.dbHealth);

module.exports = router;

