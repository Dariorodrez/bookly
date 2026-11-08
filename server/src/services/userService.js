// server/src/services/userService.js
const prisma = require("../config/prisma");
const { notFound } = require("../utils/errors");

async function list() {
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

async function getById(id) {
  const u = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
  });
  if (!u) throw notFound("Usuario no encontrado");
  return u;
}

async function update(id, data) {
  await getById(id);
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, phone: true, role: true, isActive: true },
  });
}

module.exports = { list, getById, update };
