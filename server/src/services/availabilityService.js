// server/src/services/availabilityService.js
const prisma = require("../config/prisma");
const { combineDateAndTime, addMinutes, toMinutes } = require("../utils/dates");
const { notFound } = require("../utils/errors");

async function getSlots({ serviceId, date }) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) throw notFound("Servicio no disponible");

  const d = new Date(date + "T00:00:00.000Z");
  const dayOfWeek = d.getUTCDay();

  const bh = await prisma.businessHour.findUnique({ where: { dayOfWeek } });
  if (!bh || !bh.isActive) return [];

  const openMin = toMinutes(bh.openTime);
  const closeMin = toMinutes(bh.closeTime);
  const slotMin = bh.slotMin;

  // Bloqueos del día
  const blocks = await prisma.blockedSlot.findMany({
    where: { date: { gte: startOfDayUTC(d), lt: addMinutes(startOfDayUTC(d), 24 * 60) } },
  });

  // Citas del día (no canceladas)
  const dayStart = startOfDayUTC(d);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const appointments = await prisma.appointment.findMany({
    where: {
      startsAt: { gte: dayStart, lt: dayEnd },
      status: { not: "CANCELLED" },
    },
    select: { startsAt: true, endsAt: true },
  });

  const slots = [];
  // Generar slots de tamaño slotMin dentro de la ventana, asegurando que el servicio cabe
  for (let m = openMin; m + service.durationMin <= closeMin; m += slotMin) {
    const slotStart = combineDateAndTime(date, minutesToTime(m));
    const slotEnd = addMinutes(slotStart, service.durationMin);

    // ¿Está bloqueado?
    const blocked = blocks.some((b) => {
      const bStart = b.startTime ? toMinutes(b.startTime) : 0;
      const bEnd = b.endTime ? toMinutes(b.endTime) : 24 * 60;
      // bloqueo de todo el día si no hay horas
      if (!b.startTime && !b.endTime) return true;
      return m < bEnd && m + service.durationMin > bStart;
    });
    if (blocked) continue;

    // ¿Solapa con una cita existente?
    const overlaps = appointments.some(
      (a) => slotStart < a.endsAt && slotEnd > a.startsAt,
    );
    if (overlaps) continue;

    slots.push({ startsAt: slotStart.toISOString(), endsAt: slotEnd.toISOString() });
  }

  return slots;
}

function minutesToTime(m) {
  const h = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${h}:${mm}`;
}

function startOfDayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

module.exports = { getSlots };
