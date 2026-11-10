// client/src/components/AuthAside.jsx
import { Icon } from "./Icons.jsx";

export default function AuthAside() {
  return (
    <aside className="auth-aside">
      <div>
        <span className="eyebrow" style={{ color: "#b9cdb8" }}>
          Bookly
        </span>
        <p className="auth-aside__quote">
          “La agenda que evita el “¿me puedes cambiar la cita?” de cada mañana.”
        </p>
        <p className="auth-aside__text">
          Un único lugar para que tus clientes reserven solos y tú veas el día completo sin
          sorpresas.
        </p>
      </div>
      <div className="auth-aside__facts">
        <span className="auth-aside__fact">
          <Icon name="clock" size={14} /> Huecos calculados con la duración real de cada servicio
        </span>
        <span className="auth-aside__fact">
          <Icon name="shield" size={14} /> Sesiones seguras y permisos por rol
        </span>
        <span className="auth-aside__fact">
          <Icon name="calendar" size={14} /> Historial, cancelaciones y cambios de hora
        </span>
      </div>
    </aside>
  );
}
