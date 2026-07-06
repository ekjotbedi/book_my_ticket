// Central error handler. Converts ApiError (and unexpected errors) into a
// consistent JSON shape and avoids leaking internals in production.

import { ApiError } from "../utils/ApiError.js";
import { config } from "../config.js";

// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature.
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Unexpected error: log it server-side, return a generic message.
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    ...(config.env !== "production" ? { message: err.message } : {}),
  });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: "Route not found" });
}
