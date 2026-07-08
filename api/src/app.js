const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health-routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api", healthRoutes);

app.use((req, res) => {
    res.status(404).json({
        ok: false,
        message: "Rota nao encontrada."
    });
});

module.exports = { app };

