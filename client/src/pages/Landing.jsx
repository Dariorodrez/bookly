// client/src/pages/Landing.jsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, isDemo } from "../api/index.js";
import {
  durationLabel,
  formatDateLong,
  formatTime,
  nextOpenDate,
  priceLabel,
  todayISO,
} from "../lib/datetime.js";
import { Icon } from "../components/Icons.jsx";
import DemoSection from "../components/DemoSection.jsx";

function NextAvailable({ services, hours }) {
  const first = services?.[0];
  const nextDate = hours?.length ? nextOpenDate(hours, todayISO()) : todayISO();

  const { data, isLoading } = useQuery({
    queryKey: ["availability", first?.id, nextDate],
    queryFn: () => api.availability.get(first.id, nextDate),
    enabled: Boolean(first?.id && hours?.length),
  });

  if (!first) {
    return (
      <div className="next-card">
        <div className="next-card__label">
          <Icon name="calendar" size={13} /> Próximo hueco
        </div>
        <p className="next-card__empty">Todavía no hay servicios publicados.</p>
      </div>
    );
  }

  const slots = (data?.slots || []).slice(0, 3);
  const date = nextDate ? formatDateLong(`${nextDate}T12:00:00.000Z`) : "";

  return (
    <div className="next-card">
      <div className="next-card__label">
        <Icon name="sparkle" size={13} /> Próximo hueco disponible
      </div>
      <div className="next-card__date">{isLoading ? "Buscando…" : date}</div>
      <div className="next-card__sub">
        {first.name} · {durationLabel(first.durationMin)}
      </div>

      <div className="next-card__slots">
        {isLoading &&
          [1, 2, 3].map((i) => (
            <span key={i} className="skeleton" style={{ width: 66, height: 30, borderRadius: 999 }} />
          ))}
        {!isLoading && slots.length === 0 && (
          <span className="next-card__empty">No quedan huecos este día. Mira otra fecha.</span>
        )}
        {slots.map((slot) => (
          <Link
            key={slot.startsAt}
            className="slot-pill"
            to={`/reservar?service=${first.id}&date=${nextDate}&time=${encodeURIComponent(slot.startsAt)}`}
          >
            {formatTime(slot.startsAt)}
          </Link>
        ))}
      </div>

      <div className="next-card__footer">
        <span className="next-card__service">
          <Icon name="check" size={13} /> Confirmación inmediata
        </span>
        <Link
          className="next-card__service"
          to={`/reservar?service=${first.id}&date=${nextDate}`}
          style={{ color: "#f6f2e8" }}
        >
          Elegir hora <Icon name="arrowRight" size={13} />
        </Link>
      </div>
    </div>
  );
}

export default function Landing() {
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

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="fade-up">
            <span className="eyebrow">Agenda para pequeños negocios</span>
            <h1 className="hero__title">
              Tu tiempo,
              <br />
              <em>bien reservado.</em>
            </h1>
            <p className="hero__text">
              Reserva en menos de un minuto, consulta los huecos reales y gestiona tus citas sin
              llamadas ni mensajes. Para el cliente, comodidad. Para el negocio, control.
            </p>
            <div className="hero__actions">
              <Link to="/reservar" className="btn btn--primary btn--lg">
                Reservar cita <Icon name="arrowRight" size={17} />
              </Link>
              <a href="#servicios" className="btn btn--secondary btn--lg">
                Ver servicios
              </a>
            </div>
            <div className="hero__meta">
              <span className="hero__meta-item">
                <Icon name="clock" size={15} /> Disponibilidad en tiempo real
              </span>
              <span className="hero__meta-item">
                <Icon name="shield" size={15} /> Sin dobles reservas
              </span>
              <span className="hero__meta-item">
                <Icon name="calendar" size={15} /> Cancela cuando quieras
              </span>
            </div>
          </div>

          <div className="fade-up" style={{ animationDelay: "90ms" }}>
            <NextAvailable services={services} hours={hours} />
          </div>
        </div>
      </section>

      <section className="section" id="servicios">
        <div className="container">
          <div className="section__head">
            <div>
              <span className="eyebrow">Servicios</span>
              <h2 className="section__title">Elige lo que necesitas</h2>
              <p className="section__text">
                Cada servicio tiene su duración real, así la agenda calcula los huecos sin
                solapamientos.
              </p>
            </div>
            <Link to="/reservar" className="btn btn--secondary">
              Reservar <Icon name="arrowRight" size={15} />
            </Link>
          </div>

          <div className="services-grid">
            {servicesQuery.isLoading &&
              [1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 250, borderRadius: 16 }} />
              ))}

            {!servicesQuery.isLoading && services.length === 0 && (
              <p className="muted">No hay servicios publicados todavía.</p>
            )}

            {services.map((service, index) => (
              <article
                className="service-card fade-up"
                key={service.id}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="service-card__top">
                  <div>
                    <div className="service-card__num">0{index + 1}</div>
                    <h3 className="service-card__name">{service.name}</h3>
                  </div>
                  {service.price != null && (
                    <span className="service-card__price">{priceLabel(service.price)}</span>
                  )}
                </div>
                <p className="service-card__desc">{service.description}</p>
                <div className="service-card__meta">
                  <span>
                    <Icon name="clock" size={13} /> {durationLabel(service.durationMin)}
                  </span>
                  <span>
                    <Icon name="check" size={13} /> Confirmación al instante
                  </span>
                </div>
                <div className="service-card__cta">
                  <span className="muted" style={{ fontSize: 12 }}>
                    Elige día y hora
                  </span>
                  <Link className="service-card__link" to={`/reservar?service=${service.id}`}>
                    Reservar <Icon name="arrowRight" size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <div className="section__head">
            <div>
              <span className="eyebrow">Cómo funciona</span>
              <h2 className="section__title">Tres pasos, cero fricción</h2>
            </div>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step__num">1</span>
              <h3 className="step__title">Elige el servicio</h3>
              <p className="step__text">
                Duración y precio claros desde el principio. Sin sorpresas ni letra pequeña.
              </p>
            </div>
            <div className="step">
              <span className="step__num">2</span>
              <h3 className="step__title">Mira los huecos reales</h3>
              <p className="step__text">
                Solo aparecen horas libres. La agenda descuenta citas, descansos y días cerrados.
              </p>
            </div>
            <div className="step">
              <span className="step__num">3</span>
              <h3 className="step__title">Confirma y listo</h3>
              <p className="step__text">
                Tu cita queda registrada al instante. Puedes cancelarla o cambiarla desde tu
                cuenta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {isDemo && <DemoSection />}

      <section className="section">
        <div className="container">
          <div className="band">
            <div>
              <h2>La agenda se adapta al negocio, no al revés.</h2>
              <p>
                Horarios por día, descansos, bloqueos puntuales, servicios con distinta duración y
                control de estados. Todo desde un panel privado, con permisos separados para
                clientes y administración.
              </p>
            </div>
            <div className="band__facts">
              <div className="band__fact">
                <strong>0</strong>
                <span>dobles reservas: el sistema comprueba la disponibilidad dos veces</span>
              </div>
              <div className="band__fact">
                <strong>24/7</strong>
                <span>reservas sin llamadas ni esperas</span>
              </div>
              <div className="band__fact">
                <strong>1</strong>
                <span>panel para agenda, servicios, horarios y clientes</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
