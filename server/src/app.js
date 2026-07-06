// Express application factory. Kept separate from server.js so tests can
// import the app without starting a listening socket.

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { config } from "./config.js";
import routes from "./routes/index.js";
import { openapiSpec } from "./openapi.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json());

  // API docs (technical demonstration).
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // All API routes live under /api.
  app.use("/api", routes);

  // 404 + central error handler (must be last).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
