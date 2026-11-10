// client/src/pages/Account.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Icon } from "../components/Icons.jsx";
import Modal from "../components/Modal.jsx";
import Calendar from "../components/Calendar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { StatusBadge } from "../components/Badge.jsx";
import { Loading, ErrorBlock } from "../components/Loading.jsx";
import {
  dateLabel,
  durationLabel,
  formatDateLong,
  formatDayNumber,
  formatMonthShort,
  formatTime,
  priceLabel,
  todayISO,
} from "../lib/datetime.js";

const isUpcoming = (a) =>
  new Date(a.startsAt).getTime() >= Date.now() && (a.status === "PENDING" || a.status === "CONFIRMED");

function AppointmentCard({ appointment, onCancel, onReschedule }) {
  const a = appointment;
  const service = a.service;
  const upcoming = isUpcoming(a);

  return (
    <article className={`appt-card ${upcoming ? "" : "appt-card--muted"}`} id={`appt-${a.id}`}>
      <div className="appt-card__date">
        <div className="appt-card__day">{formatDayNumber(a.startsAt)}</div>
        <div className="appt-card__month">{formatMonthShort(a.startsAt)}</div>
      </div>
      <div>
        <div className="appt-card__name">{service?.name || "Servicio"}</div>
        <div className="appt-card__meta">
          <span>
            <Icon name="clock" size={12} /> {formatTime(a.startsAt)} ·{" "}
            {service ? durationLabel(service.durationMin) : ""}
          </span>
          <span>
            <Icon name="calendar" size={12} /> {dateLabel(todayISO(new Date(a.startsAt)))}
          </span>
          <StatusBadge status={a.status} />
        </div>
      </div>
      <div className="appt-card__actions">
        {upcoming ? (
          <>
            <button className="btn btn--ghost btn--sm" onClick={() => onReschedule(a)}>
              <Icon name="refresh" size={13} /> Cambiar
            </button>
            <button className="btn btn--danger btn--sm" onClick={() => onCancel(a)}>
              Cancelar
            </button>
          </>
        ) : (
          <Link className="btn btn--secondary btn--sm" to={`/reservar?service=${a.serviceId}`}>
            <Icon name="plus" size={13} /> Repetir
          </Link>
        )}
      </div>
    </article>
  );
}

export default function Account() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("upcoming");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [resDate, setResDate] = useState(null);
  const [resTime, setResTime] = useState(null);
  const highlighted = useRef(location.state?.highlight);

  const appointmentsQuery = useQuery({
    queryKey: ["my-appointments"],
    queryFn: () => api.appointments.mine(),
  });
  const hoursQuery = useQuery({ queryKey: ["hours"], queryFn: () => api.hours.list() });

  const appointments = appointmentsQuery.data?.appointments || [];
  const upcoming = useMemo(
    () => appointments.filter(isUpcoming).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
    [appointments],
  );
  const past = useMemo(
    () =>
      appointments
        .filter((a) => !isUpcoming(a))
        .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt)),
    [appointments],
  );
  const next = upcoming[0];

  useEffect(() => {
    if (location.state?.justBooked) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (highlighted.current) {
      window.setTimeout(() => {
        document.getElementById(`appt-${highlighted.current}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 250);
      highlighted.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelMutation = useMutation({
    mutationFn: (id) => api.appointments.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      setCancelTarget(null);
      toast("Cita cancelada. El hueco vuelve a estar libre.", "info");
    },
    onError: (err) => toast(err.message || "No se pudo cancelar", "error"),
  });

  const rescheduleMutation = useMutation({
    mutationFn: () => api.appointments.reschedule(rescheduleTarget.id, resTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      setRescheduleTarget(null);
      setResTime(null);
      toast("Cita reprogramada.");
    },
    onError: (err) => toast(err.message || "No se pudo cambiar la cita", "error"),
  });

  const availabilityQuery = useQuery({
    queryKey: ["availability", rescheduleTarget?.serviceId, resDate],
    queryFn: () => api.availability.get(rescheduleTarget.serviceId, resDate),
    enabled: Boolean(rescheduleTarget && resDate),
  });

  function openReschedule(appointment) {
    setRescheduleTarget(appointment);
    setResDate(todayISO(new Date(appointment.startsAt)));
    setResTime(null);
  }

  if (appointmentsQuery.isLoading) {
    return (
      <div className="container page">
        <Loading label="Cargando tus citas…" />
      </div>
    );
  }

  if (appointmentsQuery.isError) {
    return (
      <div className="container page">
        <ErrorBlock
          message={appointmentsQuery.error?.message}
          onRetry={() => appointmentsQuery.refetch()}
        />
      </div>
    );
  }

  const list = tab === "upcoming" ? upcoming : past;
  const closedDays = (hoursQuery.data?.hours || [])
    .filter((h) => !h.isActive)
    .map((h) => h.dayOfWeek);

  return (
    <div className="container page fade-up">
      <header className="account-head">
        <div>
          <span className="eyebrow">Mi cuenta</span>
          <h1 className="account-title">Hola, {user?.name?.split(" ")[0]}.</h1>
          <p className="account-greeting">
            Aquí tienes tus próximas citas y todo lo que ya ha pasado.
          </p>
        </div>
        <Link to="/reservar" className="btn btn--primary">
          <Icon name="plus" size={15} /> Nueva reserva
        </Link>
      </header>

      {next ? (
        <section className="next-appointment">
          <div className="next-appointment__date">
            <div className="next-appointment__day">{formatDayNumber(next.startsAt)}</div>
            <div className="next-appointment__month">{formatMonthShort(next.startsAt)}</div>
          </div>
          <div>
            <div className="next-appointment__label">Tu próxima cita</div>
            <div className="next-appointment__service">{next.service?.name}</div>
            <div className="next-appointment__meta">
              <span>
                <Icon name="calendar" size={13} /> {formatDateLong(next.startsAt)}
              </span>
              <span>
                <Icon name="clock" size={13} /> {formatTime(next.startsAt)}
                {next.service ? ` · ${durationLabel(next.service.durationMin)}` : ""}
              </span>
              {next.service?.price != null && (
                <span>
                  <Icon name="euro" size={13} /> {priceLabel(next.service.price)}
                </span>
              )}
              <StatusBadge status={next.status} />
            </div>
          </div>
          <div className="next-appointment__actions">
            <button className="btn btn--secondary btn--sm" onClick={() => openReschedule(next)}>
              <Icon name="refresh" size={14} /> Cambiar hora
            </button>
            <button className="btn btn--danger btn--sm" onClick={() => setCancelTarget(next)}>
              Cancelar
            </button>
          </div>
        </section>
      ) : (
        <div className="empty" style={{ marginBottom: 30 }}>
          <div className="empty__icon">
            <Icon name="calendar" size={22} />
          </div>
          <h2 className="empty__title">No tienes citas próximas</h2>
          <p className="empty__text">
            Cuando quieras, reserva un hueco. Tardas menos de un minuto y puedes cambiarlo después.
          </p>
          <Link to="/reservar" className="btn btn--primary">
            Reservar cita <Icon name="arrowRight" size={15} />
          </Link>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === "upcoming" ? "is-active" : ""}`} onClick={() => setTab("upcoming")}>
          Próximas <span className="tab__count">{upcoming.length}</span>
        </button>
        <button className={`tab ${tab === "past" ? "is-active" : ""}`} onClick={() => setTab("past")}>
          Historial <span className="tab__count">{past.length}</span>
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={tab === "upcoming" ? "calendar" : "clock"}
          title={tab === "upcoming" ? "Nada pendiente" : "Todavía no hay historial"}
          text={
            tab === "upcoming"
              ? "Reserva tu próxima cita y aparecerá aquí."
              : "Cuando completes o canceles una cita, quedará guardada en esta lista."
          }
          action={
            tab === "upcoming" ? (
              <Link to="/reservar" className="btn btn--secondary">
                Reservar cita
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="appt-list">
          {list.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              onCancel={setCancelTarget}
              onReschedule={openReschedule}
            />
          ))}
        </div>
      )}

      {/* Cancelar */}
      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="¿Cancelar esta cita?"
        subtitle={
          cancelTarget
            ? `${cancelTarget.service?.name} · ${formatDateLong(cancelTarget.startsAt)} a las ${formatTime(cancelTarget.startsAt)}`
            : undefined
        }
        footer={
          <>
            <button className="btn btn--secondary" onClick={() => setCancelTarget(null)}>
              Volver
            </button>
            <button
              className="btn btn--danger"
              onClick={() => cancelMutation.mutate(cancelTarget.id)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelando…" : "Sí, cancelar"}
            </button>
          </>
        }
      >
        <div className="modal__icon modal__icon--danger">
          <Icon name="alert" size={20} />
        </div>
        <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>
          El hueco quedará libre inmediatamente para otra persona. Si solo quieres cambiar la hora,
          usa “Cambiar” en lugar de cancelar.
        </p>
      </Modal>

      {/* Reprogramar */}
      <Modal
        open={Boolean(rescheduleTarget)}
        onClose={() => {
          setRescheduleTarget(null);
          setResTime(null);
        }}
        title="Cambiar fecha y hora"
        subtitle={
          rescheduleTarget
            ? `${rescheduleTarget.service?.name} · ${durationLabel(rescheduleTarget.service?.durationMin || 0)}`
            : undefined
        }
        wide
        footer={
          <>
            <button
              className="btn btn--secondary"
              onClick={() => {
                setRescheduleTarget(null);
                setResTime(null);
              }}
            >
              Cancelar
            </button>
            <button
              className="btn btn--primary"
              disabled={!resTime || rescheduleMutation.isPending}
              onClick={() => rescheduleMutation.mutate()}
            >
              {rescheduleMutation.isPending ? "Guardando…" : "Guardar cambio"}
            </button>
          </>
        }
      >
        <div className="pick-grid">
          <Calendar value={resDate} onChange={(d) => { setResDate(d); setResTime(null); }} closedDays={closedDays} />
          <div>
            <div className="slots-head">
              <div className="slots-title">
                {resDate ? formatDateLong(`${resDate}T12:00:00.000Z`) : "Elige un día"}
              </div>
              <div className="slots-sub">Huecos libres para este servicio</div>
            </div>
            {availabilityQuery.isLoading ? (
              <div className="loading-block" style={{ padding: "24px 0" }}>
                <span className="spinner" />
              </div>
            ) : (availabilityQuery.data?.slots || []).length === 0 ? (
              <div className="slots-empty">
                <Icon name="info" size={17} />
                <span>No quedan huecos este día.</span>
              </div>
            ) : (
              <div className="slots">
                {(availabilityQuery.data?.slots || []).map((slot) => (
                  <button
                    key={slot.startsAt}
                    type="button"
                    className={`slot ${resTime === slot.startsAt ? "is-selected" : ""}`}
                    onClick={() => setResTime(slot.startsAt)}
                    aria-pressed={resTime === slot.startsAt}
                  >
                    {formatTime(slot.startsAt)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
