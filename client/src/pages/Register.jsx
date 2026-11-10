// client/src/pages/Register.jsx
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import AuthAside from "../components/AuthAside.jsx";
import { Icon } from "../components/Icons.jsx";

export default function Register() {
  const { user, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const from = location.state?.from;

  if (user) return <Navigate to={from || "/mi-cuenta"} replace />;

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const created = await register(form);
      toast(`Cuenta creada. Bienvenido, ${created.name.split(" ")[0]}`);
      navigate(from || "/mi-cuenta", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo crear la cuenta");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="auth-page fade-up">
        <div className="auth-card">
          <span className="eyebrow">Nueva cuenta</span>
          <h1 className="auth-card__title">Reserva en tu nombre</h1>
          <p className="auth-card__sub">
            Solo necesitamos lo mínimo para identificar tu cita. Tardas menos de un minuto.
          </p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="form-error">
                <Icon name="alert" size={15} /> {error}
              </div>
            )}

            <div className="field">
              <label className="field__label" htmlFor="name">
                Nombre
              </label>
              <input
                id="name"
                className="input"
                autoComplete="name"
                placeholder="Nombre y apellidos"
                value={form.name}
                onChange={update("name")}
                required
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={update("email")}
                required
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="phone">
                Teléfono <span className="muted">(opcional)</span>
              </label>
              <input
                id="phone"
                className="input"
                type="tel"
                autoComplete="tel"
                placeholder="+34 600 000 000"
                value={form.phone}
                onChange={update("phone")}
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password">
                Contraseña
              </label>
              <div className="input-group">
                <input
                  id="password"
                  className="input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={update("password")}
                  minLength={8}
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
              <span className="field__hint">Mínimo 8 caracteres.</span>
            </div>

            <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy}>
              {busy ? "Creando cuenta…" : "Crear cuenta"}
              {!busy && <Icon name="arrowRight" size={16} />}
            </button>
          </form>

          <p className="auth-foot">
            ¿Ya tienes cuenta? <Link to="/entrar">Entrar</Link>
          </p>
        </div>
        <AuthAside />
      </div>
    </div>
  );
}
