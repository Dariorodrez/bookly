// server/src/services/availabilityService.js
const prisma = require("../config/prisma");
const {
  combineDateAndTime,
  addMinutes,
  addCalendarDays,
  startOfZonedDay,
  dayOfWeekOfCalendarDate,
  minutesToTime,
  toMinutes,
} = require("../utils/dates");
const { notFound, badRequest } = require("../utils/errors");

async function getSlots({ serviceId, date, excludeAppointmentId }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
    throw badRequest("Fecha inválida");
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) throw notFound("Servicio no disponible");

  const dayOfWeek = dayOfWeekOfCalendarDate(date);
  const bh = await prisma.businessHour.findUnique({ where: { dayOfWeek } });
  if (!bh || !bh.isActive) return [];

  const openMin = toMinutes(bh.openTime);
  const closeMin = toMinutes(bh.closeTime);
  const slotMin = bh.slotMin;

  const dayStart = startOfZonedDay(date);
  const dayEnd = startOfZonedDay(addCalendarDays(date, 1));

  const blocks = await prisma.blockedSlot.findMany({
    where: {
      date: { gte: new Date(`${date}T00:00:00.000Z`), lt: new Date(`${addCalendarDays(date, 1)}T00:00:00.000Z`) },
    },
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      startsAt: { gte: dayStart, lt: dayEnd },
      status: { not: "CANCELLED" },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { startsAt: true, endsAt: true },
  });

  const now = new Date();
  const slots = [];

  for (let m = openMin; m + service.durationMin <= closeMin; m += slotMin) {
    const slotStart = combineDateAndTime(date, minutesToTime(m));
    const slotEnd = addMinutes(slotStart, service.durationMin);

    // No ofrecer huecos que ya han pasado (con 5 min de margen).
    if (slotStart.getTime() < now.getTime() - 5 * 60 * 1000) continue;

    const blocked = blocks.some((b) => {
      if (!b.startTime && !b.endTime) return true;
      const bStart = b.startTime ? toMinutes(b.startTime) : 0;
      const bEnd = b.endTime ? toMinutes(b.endTime) : 24 * 60;
      return m < bEnd && m + service.durationMin > bStart;
    });
    if (blocked) continue;

    const overlaps = appointments.some(
      (a) => slotStart < a.endsAt && slotEnd > a.startsAt,
    );
    if (overlaps) continue;

    slots.push({ startsAt: slotStart.toISOString(), endsAt: slotEnd.toISOString() });
  }

  return slots;
}

module.exports = { getSlots };
