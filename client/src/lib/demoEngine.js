// client/src/lib/demoEngine.js
// Motor de la demo: toda la lógica de negocio real (disponibilidad, reservas,
// bloqueos, usuarios, estadísticas) ejecutándose en el navegador y persistiendo
// en localStorage. No hay backend, pero el comportamiento es el mismo.

import {
  TIMEZONE,
  addDaysISO,
  combineDateTime,
  dayOfWeekISO,
  nextOpenDate,
  timeToMinutes,
  todayISO,
  zonedParts,
} from "./datetime.js";

const KEY = "bookly.demo.v4";
const VERSION = 4;

// ---------- utilidades ----------
function hashPassword(value) {
  // Ofuscación para la demo (no es seguridad real, aquí no hay servidor).
  let h = 2166136261;
  const str = String(value);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `demo$${(h >>> 0).toString(36)}`;
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function minutesToTime(min) {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function addMinutes(date, min) {
  return new Date(date.getTime() + min * 60000);
}

function onlyDate(iso) {
  return todayISO(new Date(iso));
}

function err(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

// ---------- datos iniciales ----------
const SERVICES = [
  {
    id: "svc_corte",
    name: "Corte de pelo",
    description: "Corte a tijera o máquina, lavado y peinado final. Incluye asesoramiento de estilo.",
    durationMin: 30,
    price: 22,
    isActive: true,
  },
  {
    id: "svc_corte_barba",
    name: "Corte + barba",
    description: "Corte completo y perfilado de barba con toalla caliente y aceites.",
    durationMin: 45,
    price: 32,
    isActive: true,
  },
  {
    id: "svc_color",
    name: "Coloración",
    description: "Color completo con productos sin amoniaco, tratamiento y secado.",
    durationMin: 90,
    price: 65,
    isActive: true,
  },
  {
    id: "svc_tratamiento",
    name: "Tratamiento capilar",
    description: "Diagnóstico, hidratación profunda y masaje de cuero cabelludo.",
    durationMin: 60,
    price: 40,
    isActive: true,
  },
  {
    id: "svc_peinado",
    name: "Peinado para evento",
    description: "Peinado o recogido para bodas, cenas y ocasiones especiales.",
    durationMin: 45,
    price: 30,
    isActive: true,
  },
];

function seedHours() {
  return [0, 1, 2, 3, 4, 5, 6].map((d) => ({
    id: `hour_${d}`,
    dayOfWeek: d,
    openTime: "09:00",
    closeTime: "18:00",
    slotMin: 30,
    isActive: d !== 0,
  }));
}

function seedUsers(today) {
  return [
    {
      id: "usr_admin",
      email: "admin@bookly.com",
      passwordHash: hashPassword("admin1234"),
      name: "Elena Vidal",
      phone: "+34 611 222 333",
      role: "ADMIN",
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    },
    {
      id: "usr_cliente",
      email: "cliente@bookly.com",
      passwordHash: hashPassword("cliente1234"),
      name: "Cliente Demo",
      phone: "+34 600 111 222",
      role: "USER",
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
    },
    {
      id: "usr_lucia",
      email: "lucia@example.com",
      passwordHash: hashPassword("demo1234"),
      name: "Lucía Fernández",
      phone: "+34 622 333 444",
      role: "USER",
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    },
    {
      id: "usr_marco",
      email: "marco@example.com",
      passwordHash: hashPassword("demo1234"),
      name: "Marco Ruiz",
      phone: "+34 633 444 555",
      role: "USER",
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
    },
    {
      id: "usr_sofia",
      email: "sofia@example.com",
      passwordHash: hashPassword("demo1234"),
      name: "Sofía Vidal",
      phone: "+34 644 555 666",
      role: "USER",
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    },
    {
      id: "usr_javier",
      email: "javier@example.com",
      passwordHash: hashPassword("demo1234"),
      name: "Javier Ortega",
      phone: "+34 655 666 777",
      role: "USER",
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    },
  ];
}

function seedAppointments(users, today) {
  const list = [];
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  const services = Object.fromEntries(SERVICES.map((s) => [s.id, s]));

  function add(userId, serviceId, dateStr, time, status, createdAtOffsetDays = 5) {
    const service = services[serviceId];
    if (!service) return;
    const startsAt = combineDateTime(dateStr, time);
    list.push({
      id: uid("apt"),
      userId,
      serviceId,
      startsAt: startsAt.toISOString(),
      endsAt: addMinutes(startsAt, service.durationMin).toISOString(),
      status,
      notes: null,
      createdAt: new Date(Date.now() - createdAtOffsetDays * 86400000).toISOString(),
      updatedAt: nowIso(),
    });
  }

  const now = new Date();
  const isOpenToday = (() => {
    const h = seedHours().find((x) => x.dayOfWeek === dayOfWeekISO(today));
    return Boolean(h?.isActive);
  })();

  // Agenda de hoy (o del próximo día abierto) para que el panel tenga vida.
  if (isOpenToday) {
    const statusAt = (time) => (combineDateTime(today, time).getTime() < now.getTime() ? "COMPLETED" : "CONFIRMED");
    add("usr_lucia", "svc_corte", today, "09:30", statusAt("09:30"), 12);
    add("usr_cliente", "svc_corte_barba", today, "11:00", statusAt("11:00"), 6);
    add("usr_marco", "svc_color", today, "12:30", statusAt("12:30") === "COMPLETED" ? "COMPLETED" : "CONFIRMED", 4);
    add("usr_sofia", "svc_tratamiento", today, "16:00", statusAt("16:00") === "COMPLETED" ? "COMPLETED" : "PENDING", 2);
  }

  // Próximas citas del cliente demo.
  const upcoming = nextOpenDate(seedHours(), addDaysISO(today, 1));
  add("usr_cliente", "svc_peinado", upcoming, "10:00", "CONFIRMED", 2);
  add("usr_javier", "svc_corte_barba", upcoming, "12:00", "PENDING", 1);

  const upcoming2 = nextOpenDate(seedHours(), addDaysISO(today, 4));
  add("usr_cliente", "svc_tratamiento", upcoming2, "17:00", "PENDING", 1);

  // Historial del cliente demo.
  const past = addDaysISO(today, -9);
  add("usr_cliente", "svc_corte", past, "11:00", "COMPLETED", 15);
  add("usr_cliente", "svc_color", addDaysISO(today, -4), "16:30", "CANCELLED", 10);

  // Un bloqueo de ejemplo dentro de la próxima semana.
  const blockDate = nextOpenDate(seedHours(), addDaysISO(today, 2));
  const blocks = [
    {
      id: uid("blk"),
      date: blockDate,
      startTime: "14:00",
      endTime: "16:00",
      reason: "Formación interna",
      createdBy: "usr_admin",
      createdAt: nowIso(),
    },
  ];

  // Evita duplicados exactos por servicio/hora (por si el seed se repite).
  const seen = new Set();
  const unique = list.filter((a) => {
    const k = `${a.serviceId}|${a.startsAt}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { appointments: unique, blocks, byId };
}

function seedState() {
  const today = todayISO();
  const users = seedUsers(today);
  const { appointments, blocks } = seedAppointments(users, today);
  return {
    version: VERSION,
    seededAt: nowIso(),
    sessionUserId: null,
    users,
    services: SERVICES.map((s) => ({
      ...s,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
      updatedAt: nowIso(),
    })),
    hours: seedHours(),
    blocks,
    appointments,
  };
}

// ---------- persistencia ----------
function readState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === VERSION) return parsed;
    }
  } catch {
    /* datos corruptos: se regeneran */
  }
  const fresh = seedState();
  writeState(fresh);
  return fresh;
}

function writeState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

export function resetDemo() {
  const fresh = seedState();
  writeState(fresh);
  return fresh;
}

function sessionUser(state) {
  if (!state.sessionUserId) return null;
  const user = state.users.find((u) => u.id === state.sessionUserId);
  if (!user || !user.isActive) return null;
  return user;
}

function requireUser(state) {
  const user = sessionUser(state);
  if (!user) throw err(401, "Inicia sesión para continuar");
  return user;
}

function requireAdmin(state) {
  const user = requireUser(state);
  if (user.role !== "ADMIN") throw err(403, "No tienes permisos de administración");
  return user;
}

// ---------- disponibilidad ----------
export function slotsFor(state, { serviceId, date, excludeAppointmentId } = {}) {
  const service = state.services.find((s) => s.id === serviceId && s.isActive);
  if (!service || !date) return [];

  const dow = dayOfWeekISO(date);
  const bh = state.hours.find((h) => h.dayOfWeek === dow);
  if (!bh || !bh.isActive) return [];

  const openMin = timeToMinutes(bh.openTime);
  const closeMin = timeToMinutes(bh.closeTime);
  const slotMin = bh.slotMin || 30;
  if (closeMin <= openMin) return [];

  const blocks = state.blocks.filter((b) => onlyDate(b.date) === date);
  const dayAppointments = state.appointments.filter(
    (a) => onlyDate(a.startsAt) === date && a.status !== "CANCELLED" && a.id !== excludeAppointmentId,
  );

  const now = Date.now();
  const slots = [];

  for (let m = openMin; m + service.durationMin <= closeMin; m += slotMin) {
    const startsAt = combineDateTime(date, minutesToTime(m));
    if (startsAt.getTime() < now - 5 * 60000) continue;

    const blocked = blocks.some((b) => {
      if (!b.startTime && !b.endTime) return true;
      const bStart = b.startTime ? timeToMinutes(b.startTime) : 0;
      const bEnd = b.endTime ? timeToMinutes(b.endTime) : 24 * 60;
      return m < bEnd && m + service.durationMin > bStart;
    });
    if (blocked) continue;

    const endsAt = addMinutes(startsAt, service.durationMin);
    const overlaps = dayAppointments.some(
      (a) => startsAt < new Date(a.endsAt) && endsAt > new Date(a.startsAt),
    );
    if (overlaps) continue;

    slots.push({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });
  }

  return slots;
}

// ---------- auth ----------
function findUserByEmail(state, email) {
  return state.users.find((u) => u.email.toLowerCase() === String(email || "").toLowerCase());
}

export const demoApi = {
  isDemo: true,

  auth: {
    async me() {
      const state = readState();
      const user = sessionUser(state);
      if (!user) throw err(401, "No autenticado");
      return { user: sanitizeUser(user) };
    },
    async login({ email, password }) {
      const state = readState();
      const user = findUserByEmail(state, email);
      if (!user || !user.isActive || user.passwordHash !== hashPassword(password)) {
        throw err(401, "Email o contraseña incorrectos");
      }
      state.sessionUserId = user.id;
      writeState(state);
      return { user: sanitizeUser(user) };
    },
    async register({ name, email, password, phone }) {
      const state = readState();
      const normalized = String(email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw err(400, "Email inválido");
      if (String(password || "").length < 8) throw err(400, "La contraseña debe tener al menos 8 caracteres");
      if (String(name || "").trim().length < 2) throw err(400, "Escribe tu nombre");
      if (findUserByEmail(state, normalized)) throw err(409, "Ya existe una cuenta con ese email");
      const user = {
        id: uid("usr"),
        email: normalized,
        passwordHash: hashPassword(password),
        name: String(name).trim(),
        phone: phone ? String(phone).trim() : null,
        role: "USER",
        isActive: true,
        createdAt: nowIso(),
      };
      state.users.push(user);
      state.sessionUserId = user.id;
      writeState(state);
      return { user: sanitizeUser(user) };
    },
    async logout() {
      const state = readState();
      state.sessionUserId = null;
      writeState(state);
      return { ok: true };
    },
  },

  services: {
    async list() {
      const state = readState();
      return { services: state.services.filter((s) => s.isActive) };
    },
    async listAll() {
      const state = readState();
      return { services: [...state.services] };
    },
    async get(id) {
      const state = readState();
      const service = state.services.find((s) => s.id === id);
      if (!service) throw err(404, "Servicio no encontrado");
      return { service };
    },
    async create(data) {
      const state = readState();
      requireAdmin(state);
      if (!data.name || String(data.name).trim().length < 2) throw err(400, "Nombre del servicio obligatorio");
      if (!(Number(data.durationMin) >= 5)) throw err(400, "Duración inválida");
      const service = {
        id: uid("svc"),
        name: String(data.name).trim(),
        description: data.description ? String(data.description).trim() : null,
        durationMin: Number(data.durationMin),
        price: data.price === "" || data.price == null ? null : Number(data.price),
        isActive: data.isActive !== false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      state.services.push(service);
      writeState(state);
      return { service };
    },
    async update(id, data) {
      const state = readState();
      requireAdmin(state);
      const idx = state.services.findIndex((s) => s.id === id);
      if (idx === -1) throw err(404, "Servicio no encontrado");
      const current = state.services[idx];
      const next = { ...current, ...data, updatedAt: nowIso() };
      next.name = String(next.name || "").trim();
      next.durationMin = Number(next.durationMin);
      next.price = next.price === "" || next.price == null ? null : Number(next.price);
      if (!next.name || next.durationMin < 5) throw err(400, "Revisa el nombre y la duración");
      state.services[idx] = next;
      writeState(state);
      return { service: next };
    },
    async remove(id) {
      const state = readState();
      requireAdmin(state);
      const idx = state.services.findIndex((s) => s.id === id);
      if (idx === -1) throw err(404, "Servicio no encontrado");
      const hasAppointments = state.appointments.some((a) => a.serviceId === id && a.status !== "CANCELLED");
      if (hasAppointments) {
        state.services[idx] = { ...state.services[idx], isActive: false, updatedAt: nowIso() };
        writeState(state);
        return { service: state.services[idx], softDeleted: true };
      }
      state.services.splice(idx, 1);
      writeState(state);
      return { ok: true };
    },
  },

  availability: {
    async get(serviceId, date) {
      const state = readState();
      return { slots: slotsFor(state, { serviceId, date }) };
    },
  },

  hours: {
    async list() {
      const state = readState();
      return {
        hours: [...state.hours]
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
          .map(({ id, ...h }) => h),
      };
    },
  },

  appointments: {
    async mine() {
      const state = readState();
      const user = requireUser(state);
      const appointments = state.appointments
        .filter((a) => a.userId === user.id)
        .map((a) => ({ ...a, service: state.services.find((s) => s.id === a.serviceId) }))
        .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
      return { appointments };
    },
    async create({ serviceId, startsAt }) {
      const state = readState();
      const user = requireUser(state);
      const service = state.services.find((s) => s.id === serviceId && s.isActive);
      if (!service) throw err(404, "Servicio no disponible");

      const start = new Date(startsAt);
      if (Number.isNaN(start.getTime())) throw err(400, "Fecha inválida");
      if (start.getTime() < Date.now()) throw err(400, "No puedes reservar en el pasado");

      const date = onlyDate(startsAt);
      const slots = slotsFor(state, { serviceId, date });
      if (!slots.some((s) => new Date(s.startsAt).getTime() === start.getTime())) {
        throw err(409, "Ese hueco ya no está disponible. Elige otro horario.");
      }

      const appointment = {
        id: uid("apt"),
        userId: user.id,
        serviceId,
        startsAt: start.toISOString(),
        endsAt: addMinutes(start, service.durationMin).toISOString(),
        status: "PENDING",
        notes: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      state.appointments.push(appointment);
      writeState(state);
      return {
        appointment: { ...appointment, service, user: sanitizeUser(user) },
      };
    },
    async cancel(id) {
      const state = readState();
      const user = requireUser(state);
      const appt = state.appointments.find((a) => a.id === id);
      if (!appt) throw err(404, "Cita no encontrada");
      if (user.role !== "ADMIN" && appt.userId !== user.id) throw err(403, "No puedes cancelar esta cita");
      if (appt.status === "CANCELLED") throw err(400, "La cita ya está cancelada");
      if (appt.status === "COMPLETED" || appt.status === "NO_SHOW") {
        throw err(400, "Esta cita ya no se puede cancelar");
      }
      appt.status = "CANCELLED";
      appt.updatedAt = nowIso();
      writeState(state);
      return { appointment: { ...appt, service: state.services.find((s) => s.id === appt.serviceId) } };
    },
    async reschedule(id, startsAt) {
      const state = readState();
      const user = requireUser(state);
      const appt = state.appointments.find((a) => a.id === id);
      if (!appt) throw err(404, "Cita no encontrada");
      if (user.role !== "ADMIN" && appt.userId !== user.id) throw err(403, "No puedes cambiar esta cita");
      if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appt.status)) {
        throw err(400, "Esta cita ya no se puede reprogramar");
      }
      const service = state.services.find((s) => s.id === appt.serviceId);
      if (!service) throw err(404, "Servicio no disponible");
      const start = new Date(startsAt);
      const date = onlyDate(startsAt);
      const slots = slotsFor(state, {
        serviceId: appt.serviceId,
        date,
        excludeAppointmentId: appt.id,
      });
      if (!slots.some((s) => new Date(s.startsAt).getTime() === start.getTime())) {
        throw err(409, "Ese hueco ya no está disponible");
      }
      appt.startsAt = start.toISOString();
      appt.endsAt = addMinutes(start, service.durationMin).toISOString();
      appt.updatedAt = nowIso();
      writeState(state);
      return { appointment: { ...appt, service } };
    },
  },

  admin: {
    async users() {
      const state = readState();
      requireAdmin(state);
      const users = state.users
        .map((u) => {
          const appointments = state.appointments.filter((a) => a.userId === u.id);
          return {
            ...sanitizeUser(u),
            appointmentsCount: appointments.length,
            nextAppointment:
              appointments
                .filter((a) => a.status !== "CANCELLED" && new Date(a.startsAt) > new Date())
                .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0] || null,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name, "es"));
      return { users };
    },
    async updateUser(id, patch) {
      const state = readState();
      requireAdmin(state);
      const idx = state.users.findIndex((u) => u.id === id);
      if (idx === -1) throw err(404, "Usuario no encontrado");
      const { passwordHash, ...safe } = patch || {};
      state.users[idx] = { ...state.users[idx], ...safe, updatedAt: nowIso() };
      writeState(state);
      return { user: sanitizeUser(state.users[idx]) };
    },
    async appointments(params = {}) {
      const state = readState();
      requireAdmin(state);
      let list = [...state.appointments];
      if (params.status) list = list.filter((a) => a.status === params.status);
      if (params.from) list = list.filter((a) => a.startsAt >= params.from);
      if (params.to) list = list.filter((a) => a.startsAt <= params.to);
      const withRelations = list
        .map((a) => ({
          ...a,
          user: sanitizeUser(state.users.find((u) => u.id === a.userId)),
          service: state.services.find((s) => s.id === a.serviceId),
        }))
        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
      return { appointments: withRelations };
    },
    async updateStatus(id, status) {
      const state = readState();
      requireAdmin(state);
      const appt = state.appointments.find((a) => a.id === id);
      if (!appt) throw err(404, "Cita no encontrada");
      appt.status = status;
      appt.updatedAt = nowIso();
      writeState(state);
      return {
        appointment: {
          ...appt,
          user: sanitizeUser(state.users.find((u) => u.id === appt.userId)),
          service: state.services.find((s) => s.id === appt.serviceId),
        },
      };
    },
    async hours() {
      const state = readState();
      return { hours: [...state.hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek) };
    },
    async saveHour(data) {
      const state = readState();
      requireAdmin(state);
      if (timeToMinutes(data.openTime) >= timeToMinutes(data.closeTime)) {
        throw err(400, "La apertura debe ser anterior al cierre");
      }
      const idx = state.hours.findIndex((h) => h.dayOfWeek === Number(data.dayOfWeek));
      const entry = {
        id: idx >= 0 ? state.hours[idx].id : uid("hour"),
        dayOfWeek: Number(data.dayOfWeek),
        openTime: data.openTime,
        closeTime: data.closeTime,
        slotMin: Number(data.slotMin) || 30,
        isActive: Boolean(data.isActive),
      };
      if (idx >= 0) state.hours[idx] = entry;
      else state.hours.push(entry);
      writeState(state);
      return { hour: entry };
    },
    async deleteHour(day) {
      const state = readState();
      requireAdmin(state);
      state.hours = state.hours.filter((h) => h.dayOfWeek !== Number(day));
      writeState(state);
      return { ok: true };
    },
    async blocks() {
      const state = readState();
      requireAdmin(state);
      return {
        blocks: [...state.blocks].sort((a, b) => new Date(a.date) - new Date(b.date)),
      };
    },
    async createBlock(data) {
      const state = readState();
      const user = requireAdmin(state);
      if (!data.date) throw err(400, "Selecciona una fecha");
      if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        throw err(400, "La hora de inicio debe ser anterior al fin");
      }
      const block = {
        id: uid("blk"),
        date: data.date,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        reason: data.reason ? String(data.reason).trim() : null,
        createdBy: user.id,
        createdAt: nowIso(),
      };
      state.blocks.push(block);
      writeState(state);
      return { block };
    },
    async deleteBlock(id) {
      const state = readState();
      requireAdmin(state);
      state.blocks = state.blocks.filter((b) => b.id !== id);
      writeState(state);
      return { ok: true };
    },
    async stats() {
      const state = readState();
      requireAdmin(state);
      const p = zonedParts(new Date());
      const monthStart = `${p.year}-${String(p.month).padStart(2, "0")}-01`;
      const byStatusMap = {};
      state.appointments.forEach((a) => {
        byStatusMap[a.status] = (byStatusMap[a.status] || 0) + 1;
      });
      const today = todayISO();
      const todayAppointments = state.appointments.filter(
        (a) => onlyDate(a.startsAt) === today && a.status !== "CANCELLED",
      );
      const monthAppointments = state.appointments.filter(
        (a) => onlyDate(a.createdAt) >= monthStart,
      );
      return {
        stats: {
          totalUsers: state.users.filter((u) => u.role === "USER").length,
          totalServices: state.services.filter((s) => s.isActive).length,
          totalAppointments: state.appointments.length,
          monthAppointments: monthAppointments.length,
          todayAppointments: todayAppointments.length,
          byStatus: Object.entries(byStatusMap).map(([status, count]) => ({ status, count })),
        },
      };
    },
  },
};

export const demoKeys = { KEY, VERSION, TIMEZONE };
