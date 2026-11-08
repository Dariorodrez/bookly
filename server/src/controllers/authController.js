// server/src/controllers/authController.js
const { asyncHandler } = require("../utils/errors");
const authService = require("../services/authService");

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  req.session.userId = user.id;
  res.status(201).json({ user });
});

const login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  req.session.userId = user.id;
  res.json({ user });
});

const logout = asyncHandler(async (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("bookly.sid");
    res.json({ ok: true });
  });
});

const me = asyncHandler(async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "No autenticado" });
  }
  const prisma = require("../config/prisma");
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { id: true, email: true, name: true, phone: true, role: true },
  });
  if (!user) return res.status(401).json({ error: "No autenticado" });
  res.json({ user });
});

module.exports = { register, login, logout, me };
