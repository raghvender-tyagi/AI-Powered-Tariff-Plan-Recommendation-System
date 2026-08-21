const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const env = require("./config/env");
const routes = require("./routes");

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins.includes("*") ? true : env.corsOrigins,
      credentials: true
    })
  );

  app.use(express.json({ limit: "1mb" }));

  if (env.nodeEnv !== "test") {
    app.use(morgan("dev"));
  }

  app.use("/api", routes);

  app.get("/", (_req, res) => {
    res.json({
      name: "AI-Powered Tariff Plan Recommendation System — API",
      apiBase: "/api",
      health: "/api/health"
    });
  });

  app.use((req, res) => {
    res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    const status = error.status || 500;

    if (status >= 500) {
      console.error("[api]", error);
    }

    res.status(status).json({
      error: error.message || "Internal server error",
      ...(env.nodeEnv === "development" && status >= 500 ? { stack: error.stack } : {})
    });
  });

  return app;
}

module.exports = { createApp };
