// client/src/pages/Admin.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client.js";

const TABS = ["Estadísticas", "Servicios", "Citas", "Clientes", "Horarios", "Bloqueos"];

export default function Admin() {
  const [tab, setTab] = useState("Estadísticas");
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Panel de administración</h1>
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? "border-ink text-ink" : "border-transparent text-gray-500 hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Estadísticas" && <StatsTab />}
      {tab === "Servicios" && <ServicesTab />}
      {tab === "Citas" && <AppointmentsTab />}
      {tab === "Clientes" && <UsersTab />}
      {tab === "Horarios" && <HoursTab />}
      {tab === "Bloqueos" && <BlocksTab />}
    </div>
  );
}

function StatsTab() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => api.get("/admin/stats") });
  if (isLoading) return <p>Cargando...</p>;
  const s = data?.stats;
  if (!s) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="card"><p className="text-gray-500 text-sm">Clientes</p><p className="text-3xl font-bold">{s.totalUsers}</p></div>
      <div className="card"><p className="text-gray-500 text-sm">Servicios activos</p><p className="text-3xl font-bold">{s.totalServices}</p></div>
      <div className="card"><p className="text-gray-500 text-sm">Citas totales</p><p className="text-3xl font-bold">{s.totalAppointments}</p></div>
      <div className="card"><p className="text-gray-500 text-sm">Citas este mes</p><p className="text-3xl font-bold">{s.monthAppointments}</p></div>
      <div className="card col-span-2 md:col-span-4">
        <p className="font-semibold mb-2">Por estado</p>
        <div className="flex flex-wrap gap-3">
          {s.byStatus.map((b) => (
            <span key={b.status} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
              {b.status}: {b.count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServicesTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-services"], queryFn: () => api.get("/services?all=true") });
  const [form, setForm] = useState({ name: "", description: "", durationMin: 30, price: "" });
  const [editing, setEditing] = useState(null);

  const createMut = useMutation({
    mutationFn: (payload) => api.post("/services", payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-services"] }); setForm({ name: "", description: "", durationMin: 30, price: "" }); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/services/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-services"] }); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/services/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-services"] }),
  });

  const services = data?.services || [];

  function submit(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      durationMin: Number(form.durationMin),
      price: form.price === "" ? null : Number(form.price),
      isActive: true,
    };
    if (editing) updateMut.mutate({ id: editing, payload });
    else createMut.mutate(payload);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-semibold">{editing ? "Editar servicio" : "Nuevo servicio"}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Duración (min)</label>
            <input className="input" type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} required min={5} />
          </div>
          <div>
            <label className="label">Precio (€)</label>
            <input className="input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="label">Descripción</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit">{editing ? "Guardar" : "Crear"}</button>
          {editing && (
            <button type="button" className="btn" onClick={() => { setEditing(null); setForm({ name: "", description: "", durationMin: 30, price: "" }); }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{s.name} {!s.isActive && <span className="text-xs text-gray-400">(inactivo)</span>}</p>
                <p className="text-sm text-gray-600">
                  {s.durationMin} min {s.price != null ? `· ${s.price} €` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn text-sm"
                  onClick={() => {
                    setEditing(s.id);
                    setForm({ name: s.name, description: s.description || "", durationMin: s.durationMin, price: s.price ?? "" });
                  }}
                >
                  Editar
                </button>
                <button className="btn btn-danger text-sm" onClick={() => deleteMut.mutate(s.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: () => api.get("/admin/appointments"),
  });
  const mut = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/appointments/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-appointments"] }),
  });

  const appointments = data?.appointments || [];

  return (
    <div>
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <div className="space-y-2">
          {appointments.map((a) => (
            <div key={a.id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold">{a.service?.name}</p>
                <p className="text-sm text-gray-600">
                  {a.user?.name} · {a.user?.email}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(a.startsAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Madrid" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="input w-auto"
                  value={a.status}
                  onChange={(e) => mut.mutate({ id: a.id, status: e.target.value })}
                >
                  {["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {appointments.length === 0 && <p className="text-gray-500">No hay citas.</p>}
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => api.get("/admin/users") });
  const users = data?.users || [];
  return (
    <div>
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-gray-600">{u.email} {u.phone ? `· ${u.phone}` : ""}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${u.role === "ADMIN" ? "bg-ink text-paper" : "bg-gray-100"}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HoursTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-hours"], queryFn: () => api.get("/admin/hours") });
  const [form, setForm] = useState({ dayOfWeek: 1, openTime: "09:00", closeTime: "18:00", slotMin: 30, isActive: true });

  const mut = useMutation({
    mutationFn: (payload) => api.put("/admin/hours", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-hours"] }),
  });

  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const hours = data?.hours || [];

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate({ ...form, dayOfWeek: Number(form.dayOfWeek), slotMin: Number(form.slotMin) });
        }}
        className="card space-y-3"
      >
        <h2 className="font-semibold">Configurar horario</h2>
        <div className="grid sm:grid-cols-5 gap-3">
          <div>
            <label className="label">Día</label>
            <select className="input" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
              {days.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Apertura</label>
            <input className="input" type="time" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} />
          </div>
          <div>
            <label className="label">Cierre</label>
            <input className="input" type="time" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} />
          </div>
          <div>
            <label className="label">Slot (min)</label>
            <input className="input" type="number" value={form.slotMin} onChange={(e) => setForm({ ...form, slotMin: e.target.value })} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Activo
            </label>
          </div>
        </div>
        <button className="btn btn-primary" type="submit">Guardar</button>
      </form>

      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <div className="space-y-2">
          {hours.map((h) => (
            <div key={h.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{days[h.dayOfWeek]}</p>
                <p className="text-sm text-gray-600">
                  {h.isActive ? `${h.openTime} – ${h.closeTime} · slot ${h.slotMin} min` : "Cerrado"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BlocksTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-blocks"], queryFn: () => api.get("/admin/blocks") });
  const [form, setForm] = useState({ date: "", startTime: "", endTime: "", reason: "" });

  const mut = useMutation({
    mutationFn: (payload) => api.post("/admin/blocks", payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-blocks"] }); setForm({ date: "", startTime: "", endTime: "", reason: "" }); },
  });
  const del = useMutation({
    mutationFn: (id) => api.delete(`/admin/blocks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-blocks"] }),
  });

  const blocks = data?.blocks || [];

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate({
            date: form.date,
            startTime: form.startTime || null,
            endTime: form.endTime || null,
            reason: form.reason,
          });
        }}
        className="card space-y-3"
      >
        <h2 className="font-semibold">Bloquear fecha/hora</h2>
        <div className="grid sm:grid-cols-4 gap-3">
          <div>
            <label className="label">Fecha</label>
            <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div>
            <label className="label">Desde (opcional)</label>
            <input className="input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </div>
          <div>
            <label className="label">Hasta (opcional)</label>
            <input className="input" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <div>
            <label className="label">Motivo</label>
            <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
        </div>
        <button className="btn btn-primary" type="submit">Bloquear</button>
        <p className="text-xs text-gray-500">Sin horas se bloquea todo el día.</p>
      </form>

      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <div className="space-y-2">
          {blocks.map((b) => (
            <div key={b.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{new Date(b.date).toLocaleDateString("es-ES")}</p>
                <p className="text-sm text-gray-600">
                  {b.startTime ? `${b.startTime} – ${b.endTime}` : "Todo el día"} {b.reason ? `· ${b.reason}` : ""}
                </p>
              </div>
              <button className="btn btn-danger text-sm" onClick={() => del.mutate(b.id)}>
                Eliminar
              </button>
            </div>
          ))}
          {blocks.length === 0 && <p className="text-gray-500">No hay bloqueos.</p>}
        </div>
      )}
    </div>
  );
}
