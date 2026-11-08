// server/src/services/serviceService.js
const prisma = require("../config/prisma");
const { notFound } = require("../utils/errors");

async function list({ includeInactive = false } = {}) {
  return prisma.service.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
  });
}

async function getById(id) {
  const s = await prisma.service.findUnique({ where: { id } });
  if (!s) throw notFound("Servicio no encontrado");
  return s;
}

async function create(data) {
  return prisma.service.create({ data });
}

async function update(id, data) {
  await getById(id);
  return prisma.service.update({ where: { id }, data });
}

async function remove(id) {
  await getById(id);
  // soft delete: marcar inactivo si tiene citas
  const count = await prisma.appointment.count({ where: { serviceId: id } });
  if (count > 0) {
    return prisma.service.update({ where: { id }, data: { isActive: false } });
  }
  await prisma.service.delete({ where: { id } });
  return { deleted: true };
}

module.exports = { list, getById, create, update, remove };
