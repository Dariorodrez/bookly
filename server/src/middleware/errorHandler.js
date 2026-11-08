// server/src/middleware/errorHandler.js
const env = require("../config/env");

module.exports = (err, _req, res, _next) => {
  const status = err.status || 500;
  const message = status < 500 ? err.message : "Error interno del servidor";
  if (status >= 500) console.error(err);
  const body = { error: message };
  if (err.details && process.env.NODE_ENV !== "production") body.details = err.details;
  res.status(status).json(body);
};
