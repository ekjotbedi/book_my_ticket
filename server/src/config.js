// Centralised configuration, loaded from environment variables with sensible
// defaults so the project runs out-of-the-box.

import dotenv from "dotenv";
dotenv.config();

const isTest = process.env.NODE_ENV === "test";

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,
  // Tests use a separate database file so they never clobber dev data.
  databaseFile: isTest
    ? "./data/test.db"
    : process.env.DATABASE_FILE || "./data/app.db",
  jwtSecret: process.env.JWT_SECRET || "dev-only-insecure-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  clientOrigin: (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim()),
};
