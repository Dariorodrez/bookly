// client/src/components/Footer.jsx
import { Link } from "react-router-dom";
import { isDemo, resetDemo } from "../api/index.js";
import { useToast } from "../context/ToastContext.jsx";
import { Icon } from "./Icons.jsx";

export default function Footer() {
  const { toast } = useToast();

  function handleReset() {
    if (!window.confirm("¿Restablecer los datos de la demo? Se perderán las citas que hayas creado.")) {
      return;
    }
    resetDemo();
    window.location.hash = "#/";
    window.location.reload();
    toast("Demo restablecida", "info");
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="footer__title">
              bookly<span style={{ color: "var(--accent)" }}>.</span>
            </div>
            <p className="footer__text">
              Reservas y gestión de citas para pequeños negocios. Una demo funcional de producto:
              disponibilidad real, agenda, servicios y clientes.
            </p>
            {isDemo && (
              <button className="btn btn--secondary btn--sm mt-4" onClick={handleReset}>
                <Icon name="refresh" size={14} /> Restablecer demo
              </button>
            )}
          </div>
          <div>
            <div className="footer__heading">Producto</div>
            <ul className="footer__list">
              <li>
                <Link to="/reservar">Reservar una cita</Link>
              </li>
              <li>
                <Link to="/mi-cuenta">Mis citas</Link>
              </li>
              <li>
                <Link to="/entrar">Acceso de clientes</Link>
              </li>
              <li>
                <Link to="/admin">Panel de administración</Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="footer__heading">El proyecto</div>
            <ul className="footer__list">
              <li>React + Vite</li>
              <li>Node.js + Express</li>
              <li>Prisma + SQLite</li>
              <li>
                <a
                  href="https://github.com/Dariorodrez/bookly"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                >
                  Código en GitHub <Icon name="external" size={12} />
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} BOOKLY · Proyecto de portfolio</span>
          <span>
            {isDemo
              ? "Demo: los datos se guardan solo en este navegador."
              : "Zona horaria del negocio: Europe/Madrid"}
          </span>
        </div>
      </div>
    </footer>
  );
}
