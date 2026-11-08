// server/src/services/blockedService.js
const prisma = require("../config/prisma");
const { notFound } = require("../utils/errors");
const { combineDateAndTime } = require("../utils/dates");

async function list({ from, to } = {}) {
  const where = {};
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from + "T00:00:00.000Z");
    if (to) where.date.lte = new Date(to + "T00:00:00.000Z");
  }
  return prisma.blockedSlot.findMany({ where, orderBy: { date: "asc" } });
}

async function create(data, adminId) {
  const date = new Date(data.date + "T00:00:00.000Z");
  return prisma.blockedSlot.create({
    data: {
      date,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      reason: data.reason || null,
      createdBy: adminId,
    },
  });
}

async function remove(id) {
  const b = await prisma.blockedSlot.findUnique({ where: { id } });
  if (!b) throw notFound("Bloqueo no encontrado");
  await prisma.blockedSlot.delete({ where: { id } });
  return { ok: true };
}

module.exports = { list, create, remove };
