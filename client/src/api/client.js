// client/src/api/client.js
import { mockRequest } from "./mock.js";

const DEMO = import.meta.env.VITE_DEMO === "true";
const BASE = "/api";

async function request(path, options = {}) {
  if (DEMO) {
    try {
      return await mockRequest(path, options);
    } catch (e) {
      const err = new Error(e?.message || "Error");
      err.status = e?.status || 500;
      err.details = e?.details;
      throw err;
    }
  }
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Error de red");
    err.status = res.status;
    err.details = data.details;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export const isDemo = DEMO;
