// client/src/components/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { isDemo } from "../api/index.js";
import { Icon } from "./Icons.jsx";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function Navbar() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate("/");
  }

  function goToDemo() {
    const scroll = () =>
      document
        .getElementById("demo")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    const samePage = location.pathname === "/";

    setMobileOpen(false);
    if (!samePage) navigate("/");

    // El menú móvil ocupa espacio en el flujo: esperamos a que se cierre
    // (y a que monte la landing) antes de calcular la posición final.
    window.setTimeout(scroll, samePage ? 40 : 140);
  }

  function skipToContent(event) {
    event.preventDefault();
    const main = document.getElementById("contenido");
    if (!main) return;
    main.focus({ preventScroll: true });
    main.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <a className="sr-only" href="#contenido" onClick={skipToContent}>
        Saltar al contenido
      </a>
      <header className="nav">
        <div className="container nav__inner">
          <div className="flex gap-3" style={{ alignItems: "center" }}>
            <Link to="/" className="brand" aria-label="BOOKLY, inicio">
              bookly<span className="brand__dot">.</span>
            </Link>
            {isDemo && (
              <button
                type="button"
                className="demo-chip demo-chip--btn"
                onClick={goToDemo}
                title="Ver cuentas de demo"
                aria-label="Ver cuentas de demo"
              >
                Demo
              </button>
            )}
          </div>

          <nav className="nav__links" aria-label="Principal">
            <Link className={`nav__link ${isActive("/") ? "is-active" : ""}`} to="/">
              Inicio
            </Link>
            <Link
              className={`nav__link ${location.pathname.startsWith("/reservar") ? "is-active" : ""}`}
              to="/reservar"
            >
              Reservar
            </Link>
            {user && (
              <Link
                className={`nav__link ${isActive("/mi-cuenta") ? "is-active" : ""}`}
                to="/mi-cuenta"
              >
                Mis citas
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link
                className={`nav__link ${location.pathname.startsWith("/admin") ? "is-active" : ""}`}
                to="/admin"
              >
                Panel
              </Link>
            )}
          </nav>

          <div className="nav__actions">
            <Link to="/reservar" className="btn btn--primary btn--sm">
              Pedir cita
              <Icon name="arrowRight" size={15} />
            </Link>

            {!ready ? (
              <span className="skeleton" style={{ width: 92, height: 34, borderRadius: 999 }} />
            ) : user ? (
              <div className="nav__user" ref={menuRef}>
                <button
                  className="nav__user-btn"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className="avatar">{initials(user.name)}</span>
                  <span className="nav__user-name">{user.name.split(" ")[0]}</span>
                  <Icon name="chevronDown" size={14} />
                </button>
                {menuOpen && (
                  <div className="user-menu" role="menu">
                    <div className="user-menu__head">
                      <div className="user-menu__name">{user.name}</div>
                      <div className="user-menu__email">{user.email}</div>
                    </div>
                    <Link className="user-menu__item" to="/mi-cuenta" role="menuitem">
                      <Icon name="calendar" size={16} /> Mis citas
                    </Link>
                    <Link className="user-menu__item" to="/reservar" role="menuitem">
                      <Icon name="plus" size={16} /> Nueva reserva
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link className="user-menu__item" to="/admin" role="menuitem">
                        <Icon name="grid" size={16} /> Panel de administración
                      </Link>
                    )}
                    <button className="user-menu__item" onClick={handleLogout} role="menuitem">
                      <Icon name="logout" size={16} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/entrar" className="btn btn--ghost btn--sm nav-login">
                Entrar
              </Link>
            )}

            <button
              className="btn btn--ghost btn--icon mobile-toggle"
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <Icon name={mobileOpen ? "close" : "menu"} size={20} />
            </button>
          </div>
        </div>

        <div className={`mobile-menu ${mobileOpen ? "is-open" : ""}`}>
          <Link to="/">Inicio</Link>
          <Link to="/reservar">Reservar cita</Link>
          {isDemo && (
            <button type="button" onClick={goToDemo}>
              <Icon name="sparkle" size={17} /> Cuentas de demo
            </button>
          )}
          {user ? (
            <>
              <Link to="/mi-cuenta">Mis citas</Link>
              {user.role === "ADMIN" && <Link to="/admin">Panel de administración</Link>}
              <button onClick={handleLogout}>
                <Icon name="logout" size={17} /> Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/entrar">Entrar</Link>
              <Link to="/registro">Crear cuenta</Link>
            </>
          )}
        </div>
      </header>
    </>
  );
}
