// client/src/lib/datetime.js
// Todo el negocio trabaja en Europe/Madrid; las fechas se guardan como instantes UTC.
export const TIMEZONE = "Europe/Madrid";

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

export function zonedParts(date) {
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

function offsetMs(date) {
  const p = zonedParts(date);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime();
}

// Fecha/hora "de pared" en Madrid -> instante UTC.
export function zonedToUtc(year, month, day, hour = 0, minute = 0) {
  const wall = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let instant = wall - offsetMs(new Date(wall));
  instant = wall - offsetMs(new Date(instant));
  return new Date(instant);
}

export function combineDateTime(dateStr, timeStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  const [h, min] = String(timeStr).split(":").map(Number);
  return zonedToUtc(y, m, d, h, min);
}

export function todayISO(now = new Date()) {
  const p = zonedParts(now);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function toISODate(date) {
  return todayISO(date);
}

export function addDaysISO(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dayOfWeekISO(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function startOfMonthISO(dateStr) {
  return dateStr.slice(0, 8) + "01";
}

export function monthMatrix(year, month) {
  // month: 1-12. Devuelve semanas (lunes primero) con fechas ISO o null.
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mondayIndex = (first.getUTCDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < mondayIndex; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function monthLabel(year, month) {
  return new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatTime(iso) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TIMEZONE,
  }).format(new Date(iso));
}

export function formatTimeRange(startIso, endIso) {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
}

export function formatDateLong(iso) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIMEZONE,
  }).format(new Date(iso));
}

export function formatDateShort(iso) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TIMEZONE,
  }).format(new Date(iso));
}

export function formatDateNumeric(iso) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIMEZONE,
  }).format(new Date(iso));
}

export function formatDayNumber(iso) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", timeZone: TIMEZONE }).format(
    new Date(iso),
  );
}

export function formatWeekday(iso, style = "short") {
  return new Intl.DateTimeFormat("es-ES", { weekday: style, timeZone: TIMEZONE }).format(
    new Date(iso),
  );
}

export function formatMonthShort(iso) {
  return new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: TIMEZONE })
    .format(new Date(iso))
    .replace(".", "");
}

export function dateLabel(dateStr, today = todayISO()) {
  if (dateStr === today) return "Hoy";
  if (dateStr === addDaysISO(today, 1)) return "Mañana";
  return formatDateShort(combineDateTime(dateStr, "12:00"));
}

export function relativeDayLabel(iso, now = new Date()) {
  const dateStr = todayISO(new Date(iso));
  const today = todayISO(now);
  if (dateStr === today) return "Hoy";
  if (dateStr === addDaysISO(today, 1)) return "Mañana";
  if (dateStr === addDaysISO(today, -1)) return "Ayer";
  return formatDateShort(iso);
}

export function isPast(iso, now = new Date()) {
  return new Date(iso).getTime() < now.getTime();
}

export function durationLabel(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function priceLabel(price) {
  if (price == null || price === "") return null;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(Number(price));
}

// "HH:mm" -> minutos
export function timeToMinutes(time) {
  const [h, m] = String(time).split(":").map(Number);
  return h * 60 + m;
}

// Fecha de hoy + n días hábiles (para demos con contenido).
export function nextOpenDate(hours, fromISO = todayISO()) {
  const now = new Date();
  const p = zonedParts(now);
  const nowMinutes = p.hour * 60 + p.minute;
  const today = todayISO(now);
  for (let i = 0; i < 60; i++) {
    const date = addDaysISO(fromISO, i);
    const dow = dayOfWeekISO(date);
    const h = hours.find((x) => x.dayOfWeek === dow);
    if (!h || !h.isActive) continue;
    // Si es hoy y ya no da tiempo a reservar, pasa al siguiente día.
    if (date === today && nowMinutes >= timeToMinutes(h.closeTime) - 15) continue;
    return date;
  }
  return fromISO;
}
