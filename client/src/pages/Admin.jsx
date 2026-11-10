// client/src/pages/Admin.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Icon } from "../components/Icons.jsx";
import Modal from "../components/Modal.jsx";
import { Loading, ErrorBlock } from "../components/Loading.jsx";
import { StatusBadge } from "../components/Badge.jsx";
import {
  addDaysISO,
  dateLabel,
  durationLabel,
  formatDateLong,
  formatDayNumber,
  formatTime,
  priceLabel,
  todayISO,
} from "../lib/datetime.js";

const TABS = [
  { id: "resumen", label: "Resumen", icon: "grid" },
  { id: "agenda", label: "Agenda", icon: "calendar" },
  { id: "servicios", label: "Servicios", icon: "scissors" },
  { id: "horario", label: "Horario", icon: "clock" },
  { id: "bloqueos", label: "Bloqueos", icon: "ban" },
  { id: "clientes", label: "Clientes", icon: "users" },
];

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const EMPTY_SERVICE = { name: "", description: "", durationMin: 30, price: "", isActive: true };

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function money(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function StatusActions({ appointment, onStatus, compact = false }) {
  const a = appointment;
  if (a.status === "PENDING") {
    return (
      <button className="btn btn--secondary btn--sm" onClick={() => onStatus(a, "CONFIRMED")}>
        <Icon name="check" size={13} /> {compact ? "" : "Confirmar"}
      </button>
    );
  }
  if (a.status === "CONFIRMED") {
    return (
      <>
        <button className="btn btn--secondary btn--sm" onClick={() => onStatus(a, "COMPLETED")}>
          <Icon name="check" size={13} /> {compact ? "" : "Completar"}
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => onStatus(a, "NO_SHOW")}>
          {compact ? <Icon name="ban" size={13} /> : "No vino"}
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => onStatus(a, "CANCELLED")}>
          {compact ? <Icon name="close" size={13} /> : "Cancelar"}
        </button>
      </>
    );
  }
  return null;
}

function AppointmentRow({ appointment, onStatus, showDate = false }) {
  const a = appointment;
  return (
    <div className={`agenda-item ${a.status === "CANCELLED" ? "is-cancelled" : ""}`}>
      <div>
        <div className="agenda-item__time">{formatTime(a.startsAt)}</div>
        <div className="agenda-item__dur">
          {showDate ? `${formatDayNumber(a.startsAt)} ${MONTHS[Number(a.startsAt.slice(5, 7)) - 1]}` : ""}
          {showDate ? " · " : ""}
          {a.service ? durationLabel(a.service.durationMin) : ""}
        </div>
      </div>
      <div>
        <div className="agenda-item__name">{a.user?.name || "Cliente"}</div>
        <div className="agenda-item__meta">
          {a.service?.name}
          {a.user?.phone ? ` · ${a.user.phone}` : ""}
        </div>
      </div>
      <div className="agenda-item__actions">
        <StatusBadge status={a.status} />
        <StatusActions appointment={a} onStatus={onStatus} />
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState("resumen");
  const [agendaDate, setAgendaDate] = useState(todayISO());
  const [serviceForm, setServiceForm] = useState(null);
  const [serviceEditing, setServiceEditing] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [blockForm, setBlockForm] = useState({ date: todayISO(), startTime: "", endTime: "", reason: "" });
  const [clientSearch, setClientSearch] = useState("");
  const [hoursDraft, setHoursDraft] = useState({});

  const statsQuery = useQuery({ queryKey: ["admin-stats"], queryFn: () => api.admin.stats() });
  const apptsQuery = useQuery({ queryKey: ["admin-appointments"], queryFn: () => api.admin.appointments() });
  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: () => api.admin.users() });
  const servicesQuery = useQuery({ queryKey: ["admin-services"], queryFn: () => api.services.listAll() });
  const hoursQuery = useQuery({ queryKey: ["admin-hours"], queryFn: () => api.admin.hours() });
  const blocksQuery = useQuery({ queryKey: ["admin-blocks"], queryFn: () => api.admin.blocks() });

  const appointments = apptsQuery.data?.appointments || [];
  const users = usersQuery.data?.users || [];
  const services = servicesQuery.data?.services || [];
  const blocks = blocksQuery.data?.blocks || [];
  const today = todayISO();

  useEffect(() => {
    if (!hoursQuery.data?.hours) return;
    const byDay = Object.fromEntries(hoursQuery.data.hours.map((h) => [h.dayOfWeek, h]));
    const draft = {};
    for (let d = 0; d <= 6; d++) {
      draft[d] = byDay[d] || {
        dayOfWeek: d,
        openTime: "09:00",
        closeTime: "18:00",
        slotMin: 30,
        isActive: false,
      };
    }
    setHoursDraft(draft);
  }, [hoursQuery.data]);

  const invalidate = (keys) => keys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.admin.updateStatus(id, status),
    onSuccess: () => {
      invalidate([["admin-appointments"], ["admin-stats"]]);
      toast("Estado de la cita actualizado.");
    },
    onError: (e) => toast(e.message || "No se pudo actualizar", "error"),
  });

  const serviceMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...serviceForm,
        durationMin: Number(serviceForm.durationMin),
        price: serviceForm.price === "" || serviceForm.price == null ? null : Number(serviceForm.price),
      };
      return serviceEditing
        ? api.services.update(serviceEditing.id, payload)
        : api.services.create(payload);
    },
    onSuccess: () => {
      invalidate([["admin-services"], ["services"]]);
      setServiceForm(null);
      setServiceEditing(null);
      toast(serviceEditing ? "Servicio actualizado." : "Servicio creado.");
    },
    onError: (e) => toast(e.message || "No se pudo guardar el servicio", "error"),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id) => api.services.remove(id),
    onSuccess: (data) => {
      invalidate([["admin-services"], ["services"]]);
      setServiceToDelete(null);
      toast(data?.softDeleted ? "Servicio desactivado (tenía citas asociadas)." : "Servicio eliminado.");
    },
    onError: (e) => toast(e.message || "No se pudo eliminar", "error"),
  });

  const hourMutation = useMutation({
    mutationFn: (payload) => api.admin.saveHour(payload),
    onSuccess: () => {
      invalidate([["admin-hours"], ["hours"], ["availability"]]);
      toast("Horario guardado.");
    },
    onError: (e) => toast(e.message || "No se pudo guardar el horario", "error"),
  });

  const blockMutation = useMutation({
    mutationFn: () => api.admin.createBlock(blockForm),
    onSuccess: () => {
      invalidate([["admin-blocks"], ["availability"]]);
      setBlockForm({ date: today, startTime: "", endTime: "", reason: "" });
      toast("Bloqueo añadido. Esos huecos ya no se ofrecen.");
    },
    onError: (e) => toast(e.message || "No se pudo crear el bloqueo", "error"),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id) => api.admin.deleteBlock(id),
    onSuccess: () => {
      invalidate([["admin-blocks"], ["availability"]]);
      toast("Bloqueo eliminado.");
    },
    onError: (e) => toast(e.message || "No se pudo eliminar", "error"),
  });

  const userMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.admin.updateUser(id, { isActive }),
    onSuccess: () => {
      invalidate([["admin-users"]]);
      toast("Cliente actualizado.");
    },
    onError: (e) => toast(e.message || "No se pudo actualizar", "error"),
  });

  const todayAppointments = useMemo(
    () => appointments.filter((a) => todayISO(new Date(a.startsAt)) === today),
    [appointments, today],
  );

  const agendaAppointments = useMemo(
    () => appointments.filter((a) => todayISO(new Date(a.startsAt)) === agendaDate),
    [appointments, agendaDate],
  );

  const monthRevenue = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            a.status !== "CANCELLED" &&
            todayISO(new Date(a.startsAt)).slice(0, 7) === today.slice(0, 7),
        )
        .reduce((sum, a) => sum + (a.service?.price || 0), 0),
    [appointments, today],
  );

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    return users
      .filter((u) => (q ? `${u.name} ${u.email} ${u.phone || ""}`.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [users, clientSearch]);

  const stats = statsQuery.data?.stats;
  const loading = statsQuery.isLoading || apptsQuery.isLoading || usersQuery.isLoading;

  const pageMeta = {
    resumen: ["Resumen del negocio", "Lo que está pasando hoy y este mes."],
    agenda: ["Agenda del día", "Revisa, confirma y cierra cada cita."],
    servicios: ["Servicios", "Duración, precio y estado de lo que ofreces."],
    horario: ["Horario de apertura", "Define los días y las horas en que se puede reservar."],
    bloqueos: ["Bloqueos y ausencias", "Cierra huecos concretos sin cambiar el horario."],
    clientes: ["Clientes", "Quién reserva, cuántas veces y si su cuenta está activa."],
  };

  const handleStatus = (appointment, status) =>
    statusMutation.mutate({ id: appointment.id, status });

  function openServiceForm(service = null) {
    setServiceEditing(service);
    setServiceForm(
      service
        ? {
            name: service.name,
            description: service.description || "",
            durationMin: service.durationMin,
            price: service.price ?? "",
            isActive: service.isActive,
          }
        : { ...EMPTY_SERVICE },
    );
  }

  function updateHour(day, patch) {
    setHoursDraft((draft) => ({ ...draft, [day]: { ...draft[day], ...patch } }));
  }

  if (loading) {
    return (
      <div className="admin">
        <div className="container page" style={{ gridColumn: "1 / -1" }}>
          <Loading label="Cargando el panel…" />
        </div>
      </div>
    );
  }

  const firstError = statsQuery.error || apptsQuery.error || usersQuery.error;
  if (firstError) {
    return (
      <div className="container page">
        <ErrorBlock
          message={firstError.message}
          onRetry={() => {
            statsQuery.refetch();
            apptsQuery.refetch();
            usersQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-sidebar__heading">Gestión</div>
          <nav className="admin-nav" aria-label="Panel de administración">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`admin-link ${tab === t.id ? "is-active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                <Icon name={t.icon} size={17} /> {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="admin-sidebar__foot">
          <div className="flex gap-2" style={{ alignItems: "center", padding: "0 4px 12px" }}>
            <span className="avatar">{initials(user?.name)}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Administración</div>
            </div>
          </div>
          <Link to="/" className="admin-link">
            <Icon name="arrowLeft" size={16} /> Volver al sitio
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`admin-tab ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <header className="admin-topbar">
          <div>
            <span className="eyebrow">Panel privado</span>
            <h1 className="admin-title">{pageMeta[tab][0]}</h1>
            <p className="admin-sub">{pageMeta[tab][1]}</p>
          </div>
          <div className="muted" style={{ fontSize: 12.5, textAlign: "right" }}>
            <div style={{ fontWeight: 600, color: "var(--ink)" }}>{formatDateLong(new Date().toISOString())}</div>
            <div>Zona horaria · Europe/Madrid</div>
          </div>
        </header>

        {/* ---------------- RESUMEN ---------------- */}
        {tab === "resumen" && (
          <div className="fade-up">
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-card__label">
                  <Icon name="calendar" size={13} /> Citas hoy
                </div>
                <div className="stat-card__value">{todayAppointments.filter((a) => a.status !== "CANCELLED").length}</div>
                <div className="stat-card__hint">{formatDateLong(new Date().toISOString())}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__label">
                  <Icon name="clock" size={13} /> Pendientes
                </div>
                <div className="stat-card__value">
                  {stats?.byStatus?.find((s) => s.status === "PENDING")?.count || 0}
                </div>
                <div className="stat-card__hint">Por confirmar</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__label">
                  <Icon name="users" size={13} /> Clientes
                </div>
                <div className="stat-card__value">{stats?.totalUsers ?? 0}</div>
                <div className="stat-card__hint">{stats?.totalServices ?? 0} servicios activos</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__label">
                  <Icon name="euro" size={13} /> Ingresos del mes
                </div>
                <div className="stat-card__value">{money(monthRevenue)}</div>
                <div className="stat-card__hint">Citas no canceladas</div>
              </div>
            </div>

            <div className="admin-grid">
              <section className="admin-card">
                <div className="admin-card__head">
                  <div>
                    <div className="admin-card__title">Agenda de hoy</div>
                    <div className="admin-card__sub">{dateLabel(today)} · {todayAppointments.length} citas</div>
                  </div>
                  <button className="btn btn--secondary btn--sm" onClick={() => setTab("agenda")}>
                    Ver agenda <Icon name="arrowRight" size={13} />
                  </button>
                </div>
                <div className="agenda-list">
                  {todayAppointments.length === 0 && (
                    <div className="agenda-empty">No hay citas para hoy. Buen momento para revisar la semana.</div>
                  )}
                  {todayAppointments.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} onStatus={handleStatus} />
                  ))}
                </div>
              </section>

              <div style={{ display: "grid", gap: 18 }}>
                <section className="admin-card">
                  <div className="admin-card__head">
                    <div className="admin-card__title">Estado de las citas</div>
                  </div>
                  <div className="admin-card__body" style={{ display: "grid", gap: 10 }}>
                    {(stats?.byStatus || []).length === 0 && <span className="muted">Sin datos todavía.</span>}
                    {(stats?.byStatus || []).map((s) => (
                      <div key={s.status} className="between">
                        <StatusBadge status={s.status} />
                        <strong className="tabular">{s.count}</strong>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="admin-card">
                  <div className="admin-card__head">
                    <div>
                      <div className="admin-card__title">Accesos rápidos</div>
                      <div className="admin-card__sub">Lo más habitual, a un clic</div>
                    </div>
                  </div>
                  <div className="admin-card__body" style={{ display: "grid", gap: 8 }}>
                    <button className="admin-link" onClick={() => setTab("servicios")}>
                      <Icon name="scissors" size={16} /> Gestionar servicios
                    </button>
                    <button className="admin-link" onClick={() => setTab("horario")}>
                      <Icon name="clock" size={16} /> Cambiar horario
                    </button>
                    <button className="admin-link" onClick={() => setTab("bloqueos")}>
                      <Icon name="ban" size={16} /> Bloquear un día
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- AGENDA ---------------- */}
        {tab === "agenda" && (
          <div className="fade-up">
            <div className="toolbar">
              <div className="agenda-datebar">
                <button className="btn btn--secondary btn--icon" onClick={() => setAgendaDate(addDaysISO(agendaDate, -1))} aria-label="Día anterior">
                  <Icon name="chevronLeft" size={16} />
                </button>
                <input
                  type="date"
                  className="date-input"
                  value={agendaDate}
                  onChange={(e) => setAgendaDate(e.target.value)}
                  aria-label="Fecha de la agenda"
                />
                <button className="btn btn--secondary btn--icon" onClick={() => setAgendaDate(addDaysISO(agendaDate, 1))} aria-label="Día siguiente">
                  <Icon name="chevronRight" size={16} />
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => setAgendaDate(today)}>
                  Hoy
                </button>
              </div>
              <span className="muted" style={{ fontSize: 12.5 }}>
                {formatDateLong(`${agendaDate}T12:00:00.000Z`)}
              </span>
            </div>

            <section className="admin-card">
              <div className="agenda-list">
                {agendaAppointments.length === 0 && (
                  <div className="agenda-empty">
                    No hay citas este día.
                    {services.length === 0 ? " Añade servicios para empezar." : ""}
                  </div>
                )}
                {agendaAppointments.map((a) => (
                  <AppointmentRow key={a.id} appointment={a} onStatus={handleStatus} />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ---------------- SERVICIOS ---------------- */}
        {tab === "servicios" && (
          <div className="fade-up">
            <div className="toolbar">
              <span className="muted" style={{ fontSize: 12.5, marginRight: "auto" }}>
                {services.length} servicios · {services.filter((s) => s.isActive).length} activos
              </span>
              <button className="btn btn--primary btn--sm" onClick={() => openServiceForm()}>
                <Icon name="plus" size={14} /> Nuevo servicio
              </button>
            </div>

            <section className="admin-card">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Duración</th>
                      <th>Precio</th>
                      <th>Estado</th>
                      <th style={{ textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="table__name">{s.name}</div>
                          <div className="table__sub">{s.description || "Sin descripción"}</div>
                        </td>
                        <td className="tabular">{durationLabel(s.durationMin)}</td>
                        <td className="tabular">{s.price != null ? priceLabel(s.price) : "—"}</td>
                        <td>
                          <span className={`badge ${s.isActive ? "badge--confirmed" : "badge--cancelled"}`}>
                            {s.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td>
                          <div className="table__actions">
                            <button className="btn btn--ghost btn--icon" onClick={() => openServiceForm(s)} aria-label={`Editar ${s.name}`}>
                              <Icon name="edit" size={15} />
                            </button>
                            <button className="btn btn--ghost btn--icon" onClick={() => setServiceToDelete(s)} aria-label={`Eliminar ${s.name}`}>
                              <Icon name="trash" size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {services.length === 0 && <div className="agenda-empty">Todavía no hay servicios.</div>}
            </section>
          </div>
        )}

        {/* ---------------- HORARIO ---------------- */}
        {tab === "horario" && (
          <div className="fade-up">
            <section className="admin-card">
              <div className="admin-card__head">
                <div>
                  <div className="admin-card__title">Horario semanal</div>
                  <div className="admin-card__sub">
                    Los huecos se generan entre la apertura y el cierre, con el intervalo indicado.
                  </div>
                </div>
              </div>
              <div className="admin-card__body">
                {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                  const row = hoursDraft[day];
                  if (!row) return null;
                  return (
                    <div key={day} className={`hours-row ${row.isActive ? "" : "is-closed"}`}>
                      <div className="hours-row__day">{DAY_NAMES[day]}</div>
                      <input
                        type="time"
                        className="input"
                        value={row.openTime}
                        disabled={!row.isActive}
                        onChange={(e) => updateHour(day, { openTime: e.target.value })}
                        aria-label={`Apertura ${DAY_NAMES[day]}`}
                      />
                      <input
                        type="time"
                        className="input"
                        value={row.closeTime}
                        disabled={!row.isActive}
                        onChange={(e) => updateHour(day, { closeTime: e.target.value })}
                        aria-label={`Cierre ${DAY_NAMES[day]}`}
                      />
                      <select
                        className="select"
                        value={row.slotMin}
                        disabled={!row.isActive}
                        onChange={(e) => updateHour(day, { slotMin: Number(e.target.value) })}
                        aria-label={`Intervalo ${DAY_NAMES[day]}`}
                      >
                        {[15, 30, 45, 60].map((m) => (
                          <option key={m} value={m}>{m} min</option>
                        ))}
                      </select>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={row.isActive}
                          onChange={(e) => updateHour(day, { isActive: e.target.checked })}
                        />
                        Abierto
                      </label>
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() =>
                          hourMutation.mutate({
                            dayOfWeek: day,
                            openTime: row.openTime,
                            closeTime: row.closeTime,
                            slotMin: row.slotMin,
                            isActive: row.isActive,
                          })
                        }
                        disabled={hourMutation.isPending}
                      >
                        Guardar
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ---------------- BLOQUEOS ---------------- */}
        {tab === "bloqueos" && (
          <div className="fade-up">
            <div className="admin-grid">
              <section className="admin-card">
                <div className="admin-card__head">
                  <div>
                    <div className="admin-card__title">Próximos bloqueos</div>
                    <div className="admin-card__sub">Vacaciones, formación, recados…</div>
                  </div>
                </div>
                <div className="agenda-list">
                  {blocks.filter((b) => b.date.slice(0, 10) >= today).length === 0 && (
                    <div className="agenda-empty">No hay bloqueos futuros.</div>
                  )}
                  {blocks
                    .filter((b) => b.date.slice(0, 10) >= today)
                    .map((b) => (
                      <div key={b.id} className="agenda-item" style={{ gridTemplateColumns: "1fr auto" }}>
                        <div>
                          <div className="agenda-item__name">
                            {formatDateLong(`${b.date.slice(0, 10)}T12:00:00.000Z`)}
                          </div>
                          <div className="agenda-item__meta">
                            {b.startTime && b.endTime
                              ? `${b.startTime} – ${b.endTime}`
                              : "Todo el día"}
                            {b.reason ? ` · ${b.reason}` : ""}
                          </div>
                        </div>
                        <button
                          className="btn btn--ghost btn--icon"
                          onClick={() => deleteBlockMutation.mutate(b.id)}
                          aria-label="Eliminar bloqueo"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    ))}
                </div>
              </section>

              <section className="admin-card">
                <div className="admin-card__head">
                  <div>
                    <div className="admin-card__title">Nuevo bloqueo</div>
                    <div className="admin-card__sub">Déjalo sin horas para cerrar el día completo.</div>
                  </div>
                </div>
                <div className="admin-card__body">
                  <div style={{ display: "grid", gap: 12 }}>
                    <div className="field">
                      <label className="field__label" htmlFor="block-date">Fecha</label>
                      <input
                        id="block-date"
                        type="date"
                        className="input"
                        value={blockForm.date}
                        min={today}
                        onChange={(e) => setBlockForm((f) => ({ ...f, date: e.target.value }))}
                      />
                    </div>
                    <div className="form-row">
                      <div className="field">
                        <label className="field__label" htmlFor="block-start">Desde</label>
                        <input
                          id="block-start"
                          type="time"
                          className="input"
                          value={blockForm.startTime}
                          onChange={(e) => setBlockForm((f) => ({ ...f, startTime: e.target.value }))}
                        />
                      </div>
                      <div className="field">
                        <label className="field__label" htmlFor="block-end">Hasta</label>
                        <input
                          id="block-end"
                          type="time"
                          className="input"
                          value={blockForm.endTime}
                          onChange={(e) => setBlockForm((f) => ({ ...f, endTime: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label className="field__label" htmlFor="block-reason">Motivo</label>
                      <input
                        id="block-reason"
                        className="input"
                        placeholder="Opcional"
                        value={blockForm.reason}
                        onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value }))}
                      />
                    </div>
                    <button
                      className="btn btn--primary"
                      onClick={() => blockMutation.mutate()}
                      disabled={blockMutation.isPending}
                    >
                      {blockMutation.isPending ? "Guardando…" : "Añadir bloqueo"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ---------------- CLIENTES ---------------- */}
        {tab === "clientes" && (
          <div className="fade-up">
            <div className="toolbar">
              <div className="search">
                <Icon name="search" size={15} />
                <input
                  className="input"
                  placeholder="Buscar por nombre, email o teléfono"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  aria-label="Buscar clientes"
                />
              </div>
              <span className="muted" style={{ fontSize: 12.5 }}>
                {filteredClients.length} de {users.length}
              </span>
            </div>

            <section className="admin-card">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Teléfono</th>
                      <th>Próxima cita</th>
                      <th>Citas</th>
                      <th>Estado</th>
                      <th style={{ textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((u) => {
                      const own = appointments.filter((a) => a.userId === u.id);
                      const next = own
                        .filter((a) => new Date(a.startsAt) > new Date() && a.status !== "CANCELLED")
                        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0];
                      return (
                        <tr key={u.id}>
                          <td>
                            <div className="flex gap-2" style={{ alignItems: "center" }}>
                              <span className="avatar" style={{ background: u.role === "ADMIN" ? "var(--accent)" : undefined }}>
                                {initials(u.name)}
                              </span>
                              <div>
                                <div className="table__name">{u.name}</div>
                                <div className="table__sub">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{u.phone || "—"}</td>
                          <td className="tabular">
                            {next ? `${formatDayNumber(next.startsAt)} ${MONTHS[Number(next.startsAt.slice(5, 7)) - 1]} · ${formatTime(next.startsAt)}` : "—"}
                          </td>
                          <td className="tabular">{own.length}</td>
                          <td>
                            <span className={`badge ${u.isActive ? "badge--confirmed" : "badge--cancelled"}`}>
                              {u.isActive ? "Activa" : "Inactiva"}
                            </span>
                          </td>
                          <td>
                            <div className="table__actions">
                              {u.id !== user?.id && (
                                <button
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => userMutation.mutate({ id: u.id, isActive: !u.isActive })}
                                >
                                  {u.isActive ? "Desactivar" : "Activar"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredClients.length === 0 && <div className="agenda-empty">No hay clientes que coincidan.</div>}
            </section>
          </div>
        )}
      </main>

      {/* Modal servicio */}
      <Modal
        open={Boolean(serviceForm)}
        onClose={() => {
          setServiceForm(null);
          setServiceEditing(null);
        }}
        title={serviceEditing ? "Editar servicio" : "Nuevo servicio"}
        subtitle={
          serviceEditing
            ? "Los cambios no afectan a las citas ya reservadas."
            : "Aparecerá en la web en cuanto lo guardes."
        }
        footer={
          <>
            <button
              className="btn btn--secondary"
              onClick={() => {
                setServiceForm(null);
                setServiceEditing(null);
              }}
            >
              Cancelar
            </button>
            <button
              className="btn btn--primary"
              onClick={() => serviceMutation.mutate()}
              disabled={serviceMutation.isPending}
            >
              {serviceMutation.isPending ? "Guardando…" : "Guardar"}
            </button>
          </>
        }
      >
        {serviceForm && (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="field">
              <label className="field__label" htmlFor="svc-name">Nombre</label>
              <input
                id="svc-name"
                className="input"
                value={serviceForm.name}
                onChange={(e) => setServiceForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="svc-desc">Descripción</label>
              <textarea
                id="svc-desc"
                className="textarea"
                value={serviceForm.description}
                onChange={(e) => setServiceForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label className="field__label" htmlFor="svc-duration">Duración (min)</label>
                <input
                  id="svc-duration"
                  type="number"
                  min={5}
                  step={5}
                  className="input"
                  value={serviceForm.durationMin}
                  onChange={(e) => setServiceForm((f) => ({ ...f, durationMin: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="svc-price">Precio (€)</label>
                <input
                  id="svc-price"
                  type="number"
                  min={0}
                  step="0.5"
                  className="input"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={serviceForm.isActive}
                onChange={(e) => setServiceForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Visible para reservar
            </label>
          </div>
        )}
      </Modal>

      {/* Modal eliminar servicio */}
      <Modal
        open={Boolean(serviceToDelete)}
        onClose={() => setServiceToDelete(null)}
        title="¿Eliminar este servicio?"
        subtitle={serviceToDelete?.name}
        footer={
          <>
            <button className="btn btn--secondary" onClick={() => setServiceToDelete(null)}>
              Cancelar
            </button>
            <button
              className="btn btn--danger"
              onClick={() => deleteServiceMutation.mutate(serviceToDelete.id)}
              disabled={deleteServiceMutation.isPending}
            >
              {deleteServiceMutation.isPending ? "Eliminando…" : "Eliminar"}
            </button>
          </>
        }
      >
        <div className="modal__icon modal__icon--danger">
          <Icon name="alert" size={20} />
        </div>
        <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>
          Si el servicio tiene citas asociadas, se desactivará en lugar de borrarse para no romper el
          historial.
        </p>
      </Modal>
    </div>
  );
}
