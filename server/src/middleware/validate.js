// server/src/middleware/validate.js
const { badRequest } = require("../utils/errors");

function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(badRequest("Datos inválidos", result.error.flatten()));
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
