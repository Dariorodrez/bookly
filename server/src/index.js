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

// Rate limit global suave + estricto en auth
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/api/health", (_req, res) => res.json({ ok: true, env: env.NODE_ENV }));

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/availability", availabilityRoutes);
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
