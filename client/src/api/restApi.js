// client/src/api/restApi.js
// Adaptador de la API real (Express + SQLite). Las rutas viven bajo /api.

const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || "No se pudo completar la operación");
    error.status = res.status;
    error.details = data.details;
    throw error;
  }
  return data;
}

function query(params) {
  const entries = Object.entries(params || {}).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const restApi = {
  isDemo: false,

  auth: {
    me: () => request("/auth/me"),
    login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    logout: () => request("/auth/logout", { method: "POST" }),
  },

  services: {
    list: () => request("/services"),
    listAll: () => request("/services/all"),
    get: (id) => request(`/services/${id}`),
    create: (body) => request("/services", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) => request(`/services/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    remove: (id) => request(`/services/${id}`, { method: "DELETE" }),
  },

  availability: {
    get: (serviceId, date) =>
      request(`/availability${query({ serviceId, date })}`),
  },

  hours: {
    list: () => request("/business-hours"),
  },

  appointments: {
    mine: () => request("/appointments/mine"),
    create: (body) => request("/appointments", { method: "POST", body: JSON.stringify(body) }),
    cancel: (id) => request(`/appointments/${id}/cancel`, { method: "PATCH", body: "{}" }),
    reschedule: (id, startsAt) =>
      request(`/appointments/${id}/reschedule`, {
        method: "PATCH",
        body: JSON.stringify({ startsAt }),
      }),
  },

  admin: {
    users: () => request("/admin/users"),
    updateUser: (id, body) =>
      request(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    appointments: (params) => request(`/admin/appointments${query(params)}`),
    updateStatus: (id, status) =>
      request(`/admin/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    hours: () => request("/admin/hours"),
    saveHour: (body) => request("/admin/hours", { method: "PUT", body: JSON.stringify(body) }),
    deleteHour: (day) => request(`/admin/hours/${day}`, { method: "DELETE" }),
    blocks: () => request("/admin/blocks"),
    createBlock: (body) => request("/admin/blocks", { method: "POST", body: JSON.stringify(body) }),
    deleteBlock: (id) => request(`/admin/blocks/${id}`, { method: "DELETE" }),
    stats: () => request("/admin/stats"),
  },
};
