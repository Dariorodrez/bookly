// client/src/pages/Booking.jsx
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, isDemo } from "../api/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Icon } from "../components/Icons.jsx";
import Calendar from "../components/Calendar.jsx";
import DemoLogin from "../components/DemoLogin.jsx";
import { Loading } from "../components/Loading.jsx";
import {
  dateLabel,
  dayOfWeekISO,
  durationLabel,
  formatDateLong,
  formatDateNumeric,
  formatTime,
  nextOpenDate,
  priceLabel,
  todayISO,
} from "../lib/datetime.js";

function InlineAuth({ mode, setMode, busy, error, onSubmit }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  return (
    <div>
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={`tab ${mode === "login" ? "is-active" : ""}`}
          onClick={() => setMode("login")}
        >
          Ya tengo cuenta
        </button>
        <button
          type="button"
          className={`tab ${mode === "register" ? "is-active" : ""}`}
          onClick={() => setMode("register")}
        >
          Crear cuenta
        </button>
      </div>

      <form
        className="auth-inline"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
        noValidate
      >
        {error && (
          <div className="form-error">
            <Icon name="alert" size={15} /> {error}
          </div>
        )}

        {mode === "register" && (
          <div className="field">
            <label className="field__label" htmlFor="inline-name">
              Nombre
            </label>
            <input
              id="inline-name"
              className="input"
              autoComplete="name"
              placeholder="Tu nombre"
              value={form.name}
              onChange={update("name")}
              required
            />
          </div>
        )}

        <div className="field">
          <label className="field__label" htmlFor="inline-email">
            Email
          </label>
          <input
            id="inline-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={update("email")}
            required
          />
        </div>

        {mode === "register" && (
          <div className="field">
            <label className="field__label" htmlFor="inline-phone">
              Teléfono <span className="muted">(opcional)</span>
            </label>
            <input
              id="inline-phone"
              className="input"
              type="tel"
              autoComplete="tel"
              placeholder="+34 600 000 000"
              value={form.phone}
              onChange={update("phone")}
            />
          </div>
        )}

        <div className="field">
          <label className="field__label" htmlFor="inline-password">
            Contraseña
          </label>
          <div className="input-group">
            <input
              id="inline-password"
              className="input"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={mode === "login" ? "Tu contraseña" : "Mínimo 8 caracteres"}
              value={form.password}
              onChange={update("password")}
              minLength={mode === "register" ? 8 : undefined}
              required
            />
            <button
              type="button"
              className="input-group__icon"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              <Icon name={showPassword ? "eyeOff" : "eye"} size={17} />
            </button>
          </div>
        </div>

        <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
          {busy ? "Un momento…" : mode === "login" ? "Entrar y continuar" : "Crear cuenta y continuar"}
        </button>
      </form>
      <p className="summary-note" style={{ textAlign: "center" }}>
        Tus datos solo se usan para gestionar esta cita.
      </p>
      {isDemo && <DemoLogin note={false} />}
    </div>
  );
}

function Summary({
  service,
  date,
  time,
  step,
  user,
  onNext,
  onConfirm,
  busy,
}) {
  const canConfirm = Boolean(service && time && user);

  return (
    <>
      <aside className="booking-summary">
        <h2 className="summary-title">Tu reserva</h2>

        {service ? (
          <div className="summary-service">
            <span className="summary-service__icon">
              <Icon name="scissors" size={18} />
            </span>
            <div>
              <div className="summary-service__name">{service.name}</div>
              <div className="summary-service__meta">
                {durationLabel(service.durationMin)}
                {service.price != null ? ` · ${priceLabel(service.price)}` : ""}
              </div>
            </div>
          </div>
        ) : (
          <p className="summary-note mt-4">Elige un servicio para empezar.</p>
        )}

        <dl className="summary-rows">
          <div className="summary-row">
            <dt>Fecha</dt>
            <dd>{date ? dateLabel(date) : "Por elegir"}</dd>
          </div>
          <div className="summary-row">
            <dt>Hora</dt>
            <dd>{time ? formatTime(time) : "Por elegir"}</dd>
          </div>
          <div className="summary-row">
            <dt>Duración</dt>
            <dd>{service ? durationLabel(service.durationMin) : "—"}</dd>
          </div>
        </dl>

        <div className="summary-total">
          <span>Total</span>
          <strong>{service?.price != null ? priceLabel(service.price) : "—"}</strong>
        </div>

        {step < 3 ? (
          <button className="btn btn--primary btn--block btn--lg" onClick={onNext}>
            {step === 1 ? "Elegir fecha y hora" : "Revisar reserva"}
            <Icon name="arrowRight" size={16} />
          </button>
        ) : (
          <button
            className="btn btn--primary btn--block btn--lg"
            onClick={onConfirm}
            disabled={!canConfirm || busy}
          >
            {busy ? "Confirmando…" : user ? "Confirmar reserva" : "Entrar para confirmar"}
            {!busy && <Icon name="check" size={16} />}
          </button>
        )}

        <p className="summary-note">
          Sin pagos online. Podrás cancelar o cambiar la hora desde “Mis citas”.
        </p>
      </aside>

      <div className="booking-bar">
        <div className="booking-bar__info">
          <div className="booking-bar__title">
            {service ? service.name : "Elige un servicio"}
          </div>
          <div className="booking-bar__sub">
            {time ? `${dateLabel(date)} · ${formatTime(time)}` : "Sin hora elegida"}
            {service?.price != null ? ` · ${priceLabel(service.price)}` : ""}
          </div>
        </div>
        {step < 3 ? (
          <button className="btn btn--primary" onClick={onNext}>
            Continuar <Icon name="arrowRight" size={15} />
          </button>
        ) : (
          <button className="btn btn--primary" onClick={onConfirm} disabled={!canConfirm || busy}>
            {busy ? "…" : "Confirmar"}
          </button>
        )}
      </div>
    </>
  );
}

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, login, register } = useAuth();
  const { toast } = useToast();

  const initialService = params.get("service");
  const initialDate = params.get("date");
  const initialTime = params.get("time");

  const [serviceId, setServiceId] = useState(initialService || null);
  const [date, setDate] = useState(initialDate || null);
  const [time, setTime] = useState(initialTime || null);
  const [step, setStep] = useState(initialTime ? 3 : 1);
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: () => api.services.list(),
  });
  const hoursQuery = useQuery({
    queryKey: ["hours"],
    queryFn: () => api.hours.list(),
  });

  const services = servicesQuery.data?.services || [];
  const hours = hoursQuery.data?.hours || [];
  const service = useMemo(
    () => services.find((s) => s.id === serviceId) || null,
    [services, serviceId],
  );

  // Si no hay servicio válido, selecciona el primero.
  useEffect(() => {
    if (!services.length) return;
    if (!serviceId || !services.some((s) => s.id === serviceId)) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  // Fecha inicial / validación de fechas cerradas o pasadas.
  useEffect(() => {
    if (!hours.length) return;
    const openDate = nextOpenDate(hours, todayISO());
    if (!date) {
      setDate(openDate);
      return;
    }
    const dow = dayOfWeekISO(date);
    const day = hours.find((h) => h.dayOfWeek === dow);
    if (date < todayISO() || !day?.isActive) {
      setDate(openDate);
      setTime(null);
    }
    // Solo al cargar los horarios.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  const availabilityQuery = useQuery({
    queryKey: ["availability", serviceId, date],
    queryFn: () => api.availability.get(serviceId, date),
    enabled: Boolean(serviceId && date),
  });

  const slots = availabilityQuery.data?.slots || [];
  const closedDays = hours.filter((h) => !h.isActive).map((h) => h.dayOfWeek);

  const createMutation = useMutation({
    mutationFn: () => api.appointments.create({ serviceId, startsAt: time }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      toast("Cita confirmada. Te esperamos.");
      navigate("/mi-cuenta", {
        replace: true,
        state: { highlight: data.appointment?.id, justBooked: true },
      });
    },
    onError: (err) => {
      setError(err.message || "No se pudo confirmar la cita");
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });

  function chooseService(id) {
    if (id === serviceId) return;
    setServiceId(id);
    setTime(null);
    setError("");
  }

  function chooseDate(next) {
    setDate(next);
    setTime(null);
    setError("");
  }

  function chooseSlot(slot) {
    setTime(slot.startsAt);
    setError("");
  }

  function goNext() {
    setError("");
    if (step === 1) {
      if (!serviceId) return setError("Elige un servicio para continuar.");
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!time) return setError("Elige una hora disponible.");
      setStep(3);
      return;
    }
    if (!user) {
      setAuthError("Entra o crea una cuenta para confirmar tu cita.");
      window.setTimeout(() => document.getElementById("inline-email")?.focus(), 0);
      return;
    }
    createMutation.mutate();
  }

  async function handleAuth(form) {
    setAuthBusy(true);
    setAuthError("");
    try {
      if (authMode === "login") {
        await login({ email: form.email, password: form.password });
        toast("Sesión iniciada. Ya puedes confirmar.");
      } else {
        await register(form);
        toast("Cuenta creada. Ya puedes confirmar.");
      }
    } catch (err) {
      setAuthError(err.message || "No se pudo completar el acceso");
    } finally {
      setAuthBusy(false);
    }
  }

  const isLoading = servicesQuery.isLoading || hoursQuery.isLoading;

  if (isLoading) {
    return (
      <div className="container page">
        <Loading label="Cargando disponibilidad…" />
      </div>
    );
  }

  if (servicesQuery.isError) {
    return (
      <div className="container page">
        <div className="form-error">
          <Icon name="alert" size={15} /> No se pudieron cargar los servicios.
        </div>
      </div>
    );
  }

  return (
    <div className="container booking-page">
      <div className="wizard-head">
        <div>
          <span className="eyebrow">Reserva</span>
          <h1 className="wizard-title">Elige día y hora</h1>
        </div>
        <p className="muted" style={{ fontSize: 13, maxWidth: 320 }}>
          Los huecos que ves están libres en este momento. La disponibilidad se comprueba otra vez
          al confirmar.
        </p>
      </div>

      <div className="stepper">
        <button
          className={`stepper__item ${step === 1 ? "is-active" : "is-done"}`}
          onClick={() => setStep(1)}
          type="button"
        >
          <span className="stepper__num">{step > 1 ? <Icon name="check" size={12} /> : "1"}</span>
          Servicio
        </button>
        <span className="stepper__line" />
        <button
          className={`stepper__item ${step === 2 ? "is-active" : step > 2 ? "is-done" : ""}`}
          onClick={() => (serviceId ? setStep(2) : null)}
          type="button"
        >
          <span className="stepper__num">{step > 2 ? <Icon name="check" size={12} /> : "2"}</span>
          Fecha y hora
        </button>
        <span className="stepper__line" />
        <button
          className={`stepper__item ${step === 3 ? "is-active" : ""}`}
          onClick={() => (time ? setStep(3) : null)}
          type="button"
        >
          <span className="stepper__num">3</span>
          Confirmar
        </button>
      </div>

      <div className="booking-grid">
        <div className="booking-main">
          {error && (
            <div className="form-error">
              <Icon name="alert" size={15} /> {error}
            </div>
          )}

          {step === 1 && (
            <section className="panel fade-up">
              <div className="panel__head">
                <div>
                  <h2 className="panel__title">¿Qué servicio necesitas?</h2>
                  <p className="panel__sub">La duración determina los huecos disponibles.</p>
                </div>
              </div>
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`service-pick ${serviceId === s.id ? "is-selected" : ""}`}
                  onClick={() => chooseService(s.id)}
                >
                  <span className="service-pick__radio" aria-hidden="true" />
                  <span className="service-pick__body">
                    <span className="service-pick__name">{s.name}</span>
                    <span className="service-pick__meta" style={{ display: "block" }}>
                      {durationLabel(s.durationMin)}
                      {s.description ? ` · ${s.description}` : ""}
                    </span>
                  </span>
                  <span className="service-pick__price">
                    {s.price != null ? priceLabel(s.price) : "—"}
                  </span>
                </button>
              ))}
            </section>
          )}

          {step === 2 && (
            <section className="panel fade-up">
              <div className="panel__head">
                <div>
                  <h2 className="panel__title">Elige fecha y hora</h2>
                  <p className="panel__sub">
                    {service ? `${service.name} · ${durationLabel(service.durationMin)}` : ""}
                  </p>
                </div>
                <button className="btn btn--ghost btn--sm" onClick={() => setStep(1)}>
                  <Icon name="arrowLeft" size={14} /> Cambiar servicio
                </button>
              </div>

              <div className="pick-grid">
                <Calendar
                  value={date}
                  onChange={chooseDate}
                  closedDays={closedDays}
                  minDate={todayISO()}
                />

                <div>
                  <div className="slots-head">
                    <div>
                      <div className="slots-title">
                        {date ? formatDateLong(`${date}T12:00:00.000Z`) : "Elige un día"}
                      </div>
                      <div className="slots-sub">
                        {date ? formatDateNumeric(`${date}T12:00:00.000Z`) : ""}
                      </div>
                    </div>
                  </div>

                  {availabilityQuery.isLoading ? (
                    <div className="loading-block" style={{ padding: "28px 0" }}>
                      <span className="spinner" />
                      Buscando huecos…
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="slots-empty">
                      <Icon name="info" size={17} />
                      <span>
                        No quedan huecos para este día. Prueba con otra fecha o elige otro servicio.
                      </span>
                    </div>
                  ) : (
                    <div className="slots" role="group" aria-label="Horas disponibles">
                      {slots.map((slot) => (
                        <button
                          key={slot.startsAt}
                          type="button"
                          className={`slot ${time === slot.startsAt ? "is-selected" : ""}`}
                          onClick={() => chooseSlot(slot)}
                          aria-pressed={time === slot.startsAt}
                        >
                          {formatTime(slot.startsAt)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="panel fade-up">
              <div className="panel__head">
                <div>
                  <h2 className="panel__title">Confirma tu cita</h2>
                  <p className="panel__sub">Revisa los datos antes de reservar.</p>
                </div>
                <button className="btn btn--ghost btn--sm" onClick={() => setStep(2)}>
                  <Icon name="arrowLeft" size={14} /> Cambiar hora
                </button>
              </div>

              {!user ? (
                <InlineAuth
                  mode={authMode}
                  setMode={setAuthMode}
                  busy={authBusy}
                  error={authError}
                  onSubmit={handleAuth}
                />
              ) : (
                <div>
                  <div
                    className="summary-service"
                    style={{ marginTop: 0, paddingBottom: 18, borderBottom: "1px solid var(--line)" }}
                  >
                    <span className="summary-service__icon">
                      <Icon name="user" size={18} />
                    </span>
                    <div>
                      <div className="summary-service__name">{user.name}</div>
                      <div className="summary-service__meta">{user.email}</div>
                    </div>
                  </div>

                  <dl className="summary-rows" style={{ borderBottom: 0 }}>
                    <div className="summary-row">
                      <dt>Servicio</dt>
                      <dd>{service?.name}</dd>
                    </div>
                    <div className="summary-row">
                      <dt>Fecha</dt>
                      <dd>{date ? formatDateLong(`${date}T12:00:00.000Z`) : "—"}</dd>
                    </div>
                    <div className="summary-row">
                      <dt>Hora</dt>
                      <dd>{time ? `${formatTime(time)} h` : "—"}</dd>
                    </div>
                    <div className="summary-row">
                      <dt>Duración</dt>
                      <dd>{service ? durationLabel(service.durationMin) : "—"}</dd>
                    </div>
                    {service?.price != null && (
                      <div className="summary-row">
                        <dt>Total</dt>
                        <dd>{priceLabel(service.price)}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="summary-note" style={{ marginTop: 4 }}>
                    Al confirmar aceptas que el negocio pueda contactarte por teléfono o email si
                    necesita ajustar la cita.
                  </div>

                  <button
                    className="btn btn--primary btn--block btn--lg mt-6"
                    onClick={goNext}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Confirmando…" : "Confirmar mi cita"}
                    {!createMutation.isPending && <Icon name="check" size={16} />}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        <Summary
          service={service}
          date={date}
          time={time}
          step={step}
          user={user}
          onNext={goNext}
          onConfirm={goNext}
          busy={createMutation.isPending}
        />
      </div>
    </div>
  );
}
