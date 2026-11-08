// server/src/services/hoursService.js
const prisma = require("../config/prisma");
const { badRequest } = require("../utils/errors");

async function list() {
  return prisma.businessHour.findMany({ orderBy: { dayOfWeek: "asc" } });
}

async function upsert(data) {
  // validar que open < close
  if (data.openTime >= data.closeTime) throw badRequest("La hora de apertura debe ser anterior al cierre");
  return prisma.businessHour.upsert({
    where: { dayOfWeek: data.dayOfWeek },
    create: data,
    update: data,
  });
}

async function remove(dayOfWeek) {
  await prisma.businessHour.delete({ where: { dayOfWeek } }).catch(() => {});
  return { ok: true };
}

module.exports = { list, upsert, remove };
