// server/src/utils/errors.js
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const badRequest = (msg, details) => new HttpError(400, msg, details);
const unauthorized = (msg = "No autenticado") => new HttpError(401, msg);
const forbidden = (msg = "Sin permisos") => new HttpError(403, msg);
const notFound = (msg = "No encontrado") => new HttpError(404, msg);
const conflict = (msg = "Conflicto") => new HttpError(409, msg);

// Envuelve handlers async para que los errores lleguen al errorHandler
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict, asyncHandler };
