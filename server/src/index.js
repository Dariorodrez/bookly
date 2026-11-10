// server/src/index.js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const sessionMiddleware = require("./config/session");
const prisma = require("./config/prisma");

const authRoutes = require("./routes/auth");
const serviceRoutes = require("./routes/services");
const availabilityRoutes = require("./routes/availability");
const businessHoursRoutes = require("./routes/businessHours");
const appointmentRoutes = require("./routes/appointments");
const adminRoutes = require("./routes/admin");

const errorHandler = require("./middleware/errorHandler");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(sessionMiddleware);

// Rate limit en auth: limita intentos fallidos, no las consultas de sesión.
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    skip: (req) => req.method === "GET",
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({ error: "Demasiados intentos. Espera unos minutos y vuelve a probar." }),
  }),
);

app.get("/api/health", (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/business-hours", businessHoursRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`BOOKLY API en http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

// Cierre ordenado
async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = app;
