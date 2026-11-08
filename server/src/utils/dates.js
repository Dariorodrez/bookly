// server/src/utils/dates.js
// Utilidades de fecha/hora en UTC. La zona del negocio se aplica en el cliente.

function parseTime(str) {
  const [h, m] = str.split(":").map(Number);
  return { h, m };
}

function toMinutes(str) {
  const { h, m } = parseTime(str);
  return h * 60 + m;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function startOfDayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function combineDateAndTime(dateStr, timeStr) {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:mm" -> Date UTC
  const [y, mo, d] = dateStr.split("-").map(Number);
  const { h, m } = parseTime(timeStr);
  return new Date(Date.UTC(y, mo - 1, d, h, m, 0, 0));
}

function formatTime(date) {
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

module.exports = { parseTime, toMinutes, addMinutes, startOfDayUTC, combineDateAndTime, formatTime };
