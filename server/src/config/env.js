// server/src/config/env.js
require("dotenv").config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  SESSION_SECRET: process.env.SESSION_SECRET || "dev-secret-change-me",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  BUSINESS_TIMEZONE: process.env.BUSINESS_TIMEZONE || "Europe/Madrid",
};

if (env.NODE_ENV === "production" && env.SESSION_SECRET === "dev-secret-change-me") {
  throw new Error("SESSION_SECRET must be set in production");
}

module.exports = env;
