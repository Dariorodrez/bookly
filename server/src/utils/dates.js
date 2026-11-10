// server/src/utils/dates.js
// Utilidades de fecha/hora. El negocio trabaja en BUSINESS_TIMEZONE
// (Europe/Madrid por defecto) y guardamos siempre instantes en UTC.

const env = require("../config/env");

const TIMEZONE = env.BUSINESS_TIMEZONE || "Europe/Madrid";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function parseTime(str) {
  const [h, m] = String(str).split(":").map(Number);
  return { h, m };
}

function toMinutes(str) {
  const { h, m } = parseTime(str);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function zonedParts(date) {
  const parts = partsFormatter.formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function timezoneOffsetMs(date) {
  const p = zonedParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - date.getTime();
}

// Convierte una fecha/hora "de pared" en la zona del negocio a un instante UTC.
function zonedToUtc(year, month, day, hour = 0, minute = 0) {
  const wallClock = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let offset = timezoneOffsetMs(new Date(wallClock));
  let instant = wallClock - offset;
  // Segunda pasada para resolver cambios de horario de verano.
  offset = timezoneOffsetMs(new Date(instant));
  instant = wallClock - offset;
  return new Date(instant);
}

function parseCalendarDate(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Fecha inválida: ${dateStr}`);
  return { year: y, month: m, day: d };
}

function combineDateAndTime(dateStr, timeStr) {
  const { year, month, day } = parseCalendarDate(dateStr);
  const { h, m } = parseTime(timeStr);
  return zonedToUtc(year, month, day, h, m);
}

function startOfZonedDay(dateStr) {
  const { year, month, day } = parseCalendarDate(dateStr);
  return zonedToUtc(year, month, day, 0, 0);
}

function addCalendarDays(dateStr, days) {
  const { year, month, day } = parseCalendarDate(dateStr);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayOfWeekOfCalendarDate(dateStr) {
  const { year, month, day } = parseCalendarDate(dateStr);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function calendarDateInZone(date) {
  const p = zonedParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function startOfZonedMonthUtc(date) {
  const p = zonedParts(date);
  return zonedToUtc(p.year, p.month, 1, 0, 0);
}

// Etiqueta legible en la zona del negocio, p. ej. "sáb, 15 nov · 10:30".
function formatInZone(date, options = {}) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: TIMEZONE,
    ...options,
  }).format(date);
}

module.exports = {
  TIMEZONE,
  parseTime,
  toMinutes,
  minutesToTime,
  addMinutes,
  zonedParts,
  zonedToUtc,
  combineDateAndTime,
  startOfZonedDay,
  addCalendarDays,
  dayOfWeekOfCalendarDate,
  calendarDateInZone,
  startOfZonedMonthUtc,
  formatInZone,
};
