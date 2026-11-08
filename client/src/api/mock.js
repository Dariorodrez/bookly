// client/src/api/mock.js
// Modo demo para GitHub Pages: simula la API en el navegador (localStorage).
const KEY = "bookly-demo-state";

const seedServices = [
  { id: "s1", name: "Corte de pelo", description: "Corte clásico o moderno, incluye lavado.", durationMin: 30, price: 25, isActive: true },
  { id: "s2", name: "Corte + barba", description: "Corte y arreglo de barba.", durationMin: 45, price: 35, isActive: true },
  { id: "s3", name: "Coloración", description: "Tinte completo con productos premium.", durationMin: 90, price: 70, isActive: true },
  { id: "s4", name: "Tratamiento capilar", description: "Hidratación profunda y masaje.", durationMin: 60, price: 45, isActive: true },
];

const seedHours = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  id: `h${d}`, dayOfWeek: d, openTime: "09:00", closeTime: "18:00", slotMin: 30, isActive: d !== 0,
}));

function initialState() {
  return {
    users: [{ id: "admin", email: "admin@bookly.com", password: btoa("admin1234"), name: "Administrador", phone: null, role: "ADMIN", isActive: true, createdAt: new Date().toISOString() }],
    services: seedServices, appointments: [], hours: seedHours, blocks: [], currentUser: null,
  };
}

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  const s = initialState(); save(s); return s;
}
function save(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
function uid() { return "id" + Math.random().toString(36).slice(2, 10); }
function toMinutes(t) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function addMin(date, min) { return new Date(date.getTime() + min * 60000); }
function parseDate(str) { return new Date(str + "T00:00:00.000Z"); }
function sanitizeUser(u) { if (!u) return null; const { password, ...rest } = u; return rest; }
function currentUser(state) { return state.currentUser ? state.users.find((u) => u.id === state.currentUser) || null : null; }

function slotsFor(state, serviceId, dateStr) {
  const service = state.services.find((s) => s.id === serviceId && s.isActive);
  if (!service) return [];
  const d = parseDate(dateStr);
  const dayOfWeek = d.getUTCDay();
  const bh = state.hours.find((h) => h.dayOfWeek === dayOfWeek);
  if (!bh || !bh.isActive) return [];
  const openMin = toMinutes(bh.openTime);
  const closeMin = toMinutes(bh.closeTime);
  const slotMin = bh.slotMin;
  const dayStart = new Date(d); dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const blocks = state.blocks.filter((b) => { const bd = new Date(b.date); bd.setUTCHours(0, 0, 0, 0); return bd.getTime() === dayStart.getTime(); });
  const appts = state.appointments.filter((a) => { const s = new Date(a.startsAt); return s >= dayStart && s < dayEnd && a.status !== "CANCELLED"; });
  const result = [];
  for (let m = openMin; m + service.durationMin <= closeMin; m += slotMin) {
    const slotStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), Math.floor(m / 60), m % 60));
    const slotEnd = addMin(slotStart, service.durationMin);
    const blocked = blocks.some((b) => {
      if (!b.startTime && !b.endTime) return true;
      const bS = toMinutes(b.startTime), bE = toMinutes(b.endTime);
      return m < bE && m + service.durationMin > bS;
    });
    if (blocked) continue;
    const overlaps = appts.some((a) => slotStart < new Date(a.endsAt) && slotEnd > new Date(a.startsAt));
    if (overlaps) continue;
    result.push({ startsAt: slotStart.toISOString(), endsAt: slotEnd.toISOString() });
  }
  return result;
}

export async function mockRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const body = options.body ? JSON.parse(options.body) : null;
  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  const state = load();
  const user = currentUser(state);

  if (pathname === "/auth/me") {
    if (!user) throw { status: 401, message: "No autenticado" };
    return { user: sanitizeUser(user) };
  }
  if (pathname === "/auth/register" && method === "POST") {
    if (state.users.some((u) => u.email === body.email)) throw { status: 409, message: "Ya existe una cuenta con ese email" };
    const newUser = { id: uid(), email: body.email, password: btoa(body.password), name: body.name, phone: body.phone || null, role: "USER", isActive: true, createdAt: new Date().toISOString() };
    state.users.push(newUser); state.currentUser = newUser.id; save(state);
    return { user: sanitizeUser(newUser) };
  }
  if (pathname === "/auth/login" && method === "POST") {
    const u = state.users.find((x) => x.email === body.email);
    if (!u || atob(u.password) !== body.password || !u.isActive) throw { status: 401, message: "Credenciales inválidas" };
    state.currentUser = u.id; save(state);
    return { user: sanitizeUser(u) };
  }
  if (pathname === "/auth/logout" && method === "POST") {
    state.currentUser = null; save(state);
    return { ok: true };
  }
  if (pathname === "/services" && method === "GET") {
    const all = params.get("all") === "true";
    return { services: all ? state.services : state.services.filter((s) => s.isActive) };
  }
  if (pathname.startsWith("/services/") && method === "GET") {
    const id = pathname.split("/")[2];
    const s = state.services.find((x) => x.id === id);
    if (!s) throw { status: 404, message: "Servicio no encontrado" };
    return { service: s };
  }
  if (pathname === "/services" && method === "POST") {
    const s = { id: uid(), ...body, isActive: body.isActive ?? true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    state.services.push(s); save(state);
    return { service: s };
  }
  if (pathname.startsWith("/services/") && method === "PATCH") {
    const id = pathname.split("/")[2];
    const idx = state.services.findIndex((x) => x.id === id);
    if (idx === -1) throw { status: 404, message: "Servicio no encontrado" };
    state.services[idx] = { ...state.services[idx], ...body }; save(state);
    return { service: state.services[idx] };
  }
  if (pathname.startsWith("/services/") && method === "DELETE") {
    const id = pathname.split("/")[2];
    const hasAppt = state.appointments.some((a) => a.serviceId === id);
    if (hasAppt) {
      const idx = state.services.findIndex((x) => x.id === id);
      state.services[idx].isActive = false;
    } else {
      state.services = state.services.filter((x) => x.id !== id);
    }
    save(state);
    return hasAppt ? state.services.find((x) => x.id === id) : { deleted: true };
  }
  if (pathname.startsWith("/availability")) {
    const serviceId = params.get("serviceId");
    const date = params.get("date");
    return { slots: slotsFor(state, serviceId, date) };
  }
  if (pathname === "/appointments/mine" && method === "GET") {
    if (!user) throw { status: 401, message: "No autenticado" };
    const list = state.appointments.filter((a) => a.userId === user.id).map((a) => ({ ...a, service: state.services.find((s) => s.id === a.serviceId) })).sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
    return { appointments: list };
  }
  if (pathname === "/appointments" && method === "POST") {
    if (!user) throw { status: 401, message: "No autenticado" };
    const service = state.services.find((s) => s.id === body.serviceId && s.isActive);
    if (!service) throw { status: 404, message: "Servicio no disponible" };
    const start = new Date(body.startsAt);
    const end = addMin(start, service.durationMin);
    const dateStr = start.toISOString().slice(0, 10);
    const free = slotsFor(state, body.serviceId, dateStr).some((s) => new Date(s.startsAt).getTime() === start.getTime());
    if (!free) throw { status: 409, message: "El horario ya no está disponible" };
    const appt = { id: uid(), userId: user.id, serviceId: body.serviceId, startsAt: start.toISOString(), endsAt: end.toISOString(), status: "PENDING", notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    state.appointments.push(appt); save(state);
    return { appointment: { ...appt, service, user: sanitizeUser(user) } };
  }
  if (pathname.match(/^\/appointments\/[^/]+\/cancel$/) && method === "PATCH") {
    if (!user) throw { status: 401, message: "No autenticado" };
    const id = pathname.split("/")[2];
    const appt = state.appointments.find((a) => a.id === id);
    if (!appt) throw { status: 404, message: "Cita no encontrada" };
    if (user.role !== "ADMIN" && appt.userId !== user.id) throw { status: 403, message: "Sin permisos" };
    if (appt.status === "CANCELLED") throw { status: 400, message: "La cita ya está cancelada" };
    appt.status = "CANCELLED"; appt.updatedAt = new Date().toISOString(); save(state);
    return { appointment: { ...appt, service: state.services.find((s) => s.id === appt.serviceId) } };
  }
  if (pathname === "/admin/users" && method === "GET") {
    if (user?.role !== "ADMIN") throw { status: 403, message: "Sin permisos" };
    return { users: state.users.map(sanitizeUser) };
  }
  if (pathname.match(/^\/admin\/users\/[^/]+$/) && method === "PATCH") {
    if (user?.role !== "ADMIN") throw { status: 403, message: "Sin permisos" };
    const id = pathname.split("/")[3];
    const idx = state.users.findIndex((u) => u.id === id);
    if (idx === -1) throw { status: 404, message: "Usuario no encontrado" };
    state.users[idx] = { ...state.users[idx], ...body }; save(state);
    return { user: sanitizeUser(state.users[idx]) };
  }
  if (pathname === "/admin/appointments" && method === "GET") {
    if (user?.role !== "ADMIN") throw { status: 403, message: "Sin permisos" };
    const list = state.appointments.map((a) => ({ ...a, user: sanitizeUser(state.users.find((u) => u.id === a.userId)), service: state.services.find((s) => s.id === a.serviceId) })).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    return { appointments: list };
  }
  if (pathname.match(/^\/admin\/appointments\/[^/]+\/status$/) && method === "PATCH") {
    if (user?.role !== "ADMIN") throw { status: 403, message: "Sin permisos" };
    const id = pathname.split("/")[3];
    const appt = state.appointments.find((a) => a.id === id);
    if (!appt) throw { status: 404, message: "Cita no encontrada" };
    appt.status = body.status; appt.updatedAt = new Date().toISOString(); save(state);
    return { appointment: { ...appt, user: sanitizeUser(state.users.find((u) => u.id === appt.userId)), service: state.services.find((s) => s.id === appt.serviceId) } };
  }
  if (pathname === "/admin/hours" && method === "GET") {
    if (user?.role !== "ADMIN") throw { status: 403, message: "Sin permisos" };
    return { hours: state.hours };
  }
  if (pathname === "/admin/hours" && method === "PUT") {
    if (user?.role !== "ADMIN") throw { status: 403, message: "Sin permisos" };
    const idx = state.hours.findIndex((h) => h.dayOfWeek === body.dayOfWeek);
    const entry = { id: idx >= 0 ? state.hours[idx].id : uid(), ...body };
    if (idx >= 0) state.hours[idx] = entry; else state.hours.push(entry);
    save(state);
    return { hour: entry };
  }
  if (pathname === "/admin/blocks" && method === "GET") {
    if (user?.role !== "ADMIN") throw { status: 403, message: "Sin permisos" };
    return { blocks: state.blocks };
  }
  if (pathname === "/admin/blocks" && method === "POST") {
    if (user?.role !== "ADMIN") throw { status: 403, message: "Sin permisos" };
    const block = { id: uid(), date: body.date, startTime: body.startTime || null, endTime: body.endTime || null, reason: body.reason || null, createdBy: user.id, createdAt: new Date().toISOString() };
    state.blocks.push(block); save(state);
    return { block };
  }
  if (pathname.match(/^\/admin\/blocks\/[^/]+$/) && method === "DELETE") {
    if (user?.role !== "ADMIN") throw { status: 403, message: "Sin permisos" };
    const id = pathname.split("/")[3];
    state.blocks = state.blocks.filter((b) => b.id !== id); save(state);
    return { ok: true };
  }
  if (pathname === "/admin/stats" && method === "GET") {
    if (user?.role !== "ADMIN") throw { status: 403, message: "Sin permisos" };
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const byStatus = {};
    state.appointments.forEach((a) => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
    return { stats: { totalUsers: state.users.filter((u) => u.role === "USER").length, totalServices: state.services.filter((s) => s.isActive).length, totalAppointments: state.appointments.length, monthAppointments: state.appointments.filter((a) => new Date(a.createdAt) >= startOfMonth).length, byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })) } };
  }

  throw { status: 404, message: "Ruta no encontrada" };
}
