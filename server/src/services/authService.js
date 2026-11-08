// server/src/services/authService.js
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { conflict, unauthorized } = require("../utils/errors");

const SALT_ROUNDS = 12;

async function register({ email, password, name, phone }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict("Ya existe una cuenta con ese email");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, phone: phone || null, role: "USER" },
    select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
  });
  return user;
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw unauthorized("Credenciales inválidas");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw unauthorized("Credenciales inválidas");
  return { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role };
}

module.exports = { register, login };
