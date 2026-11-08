// server/src/middleware/auth.js
const prisma = require("../config/prisma");
const { unauthorized, forbidden } = require("../utils/errors");

async function requireAuth(req, _res, next) {
  const userId = req.session && req.session.userId;
  if (!userId) return next(unauthorized());
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, phone: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) {
    req.session.destroy(() => {});
    return next(unauthorized("Cuenta inactiva o inexistente"));
  }
  req.user = user;
  next();
}

function requireRole(role) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (req.user.role !== role) return next(forbidden());
    next();
  };
}

module.exports = { requireAuth, requireRole };
