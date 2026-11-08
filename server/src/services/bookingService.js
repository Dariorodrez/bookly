// server/src/services/bookingService.js
const prisma = require("../config/prisma");
const { badRequest, notFound, conflict, forbidden } = require("../utils/errors");
const availabilityService = require("./availabilityService");
const { addMinutes } = require("../utils/dates");

async function create({ userId, serviceId, startsAt }) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) throw notFound("Servicio no disponible");

  const start = new Date(startsAt);
  const end = addMinutes(start, service.durationMin);

  // Verificar que el slot sigue libre (transacción serializable)
  const slots = await availabilityService.getSlots({
    serviceId,
    date: start.toISOString().slice(0, 10),
  });
  const stillFree = slots.some((s) => new Date(s.startsAt).getTime() === start.getTime());
  if (!stillFree) throw conflict("El horario ya no está disponible");

  try {
    const appointment = await prisma.appointment.create({
      data: { userId, serviceId, startsAt: start, endsAt: end, status: "PENDING" },
      include: { service: true, user: { select: { id: true, name: true, email: true } } },
    });
    return appointment;
  } catch (e) {
    if (e.code === "P2002") throw conflict("El horario ya no está disponible");
    throw e;
  }
}

async function listMine(userId) {
  return prisma.appointment.findMany({
    where: { userId },
    include: { service: { select: { id: true, name: true, durationMin: true, price: true } } },
    orderBy: { startsAt: "desc" },
  });
}

async function cancel({ appointmentId, userId, isAdmin }) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) throw notFound("Cita no encontrada");
  if (!isAdmin && appt.userId !== userId) throw forbidden();
  if (appt.status === "CANCELLED") throw badRequest("La cita ya está cancelada");
  if (appt.status === "COMPLETED" || appt.status === "NO_SHOW") {
    throw badRequest("No se puede cancelar una cita finalizada");
  }
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
    include: { service: true },
  });
}

async function listAll({ status, from, to }) {
  const where = {};
  if (status) where.status = status;
  if (from || to) {
    where.startsAt = {};
    if (from) where.startsAt.gte = new Date(from);
    if (to) where.startsAt.lte = new Date(to);
  }
  return prisma.appointment.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      service: { select: { id: true, name: true, durationMin: true, price: true } },
    },
    orderBy: { startsAt: "asc" },
  });
}

async function updateStatus({ id, status }) {
  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) throw notFound("Cita no encontrada");
  return prisma.appointment.update({
    where: { id },
    data: { status },
    include: { user: { select: { id: true, name: true, email: true } }, service: true },
  });
}

async function stats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [totalUsers, totalServices, totalAppointments, monthAppointments, byStatus] =
    await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.service.count({ where: { isActive: true } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.appointment.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
  return {
    totalUsers,
    totalServices,
    totalAppointments,
    monthAppointments,
    byStatus: byStatus.map((b) => ({ status: b.status, count: b._count._all })),
  };
}

module.exports = { create, listMine, cancel, listAll, updateStatus, stats };
