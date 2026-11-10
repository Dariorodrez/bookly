// client/src/pages/Login.jsx
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { isDemo } from "../api/index.js";
import DemoLogin from "../components/DemoLogin.jsx";
import AuthAside from "../components/AuthAside.jsx";
import { Icon } from "../components/Icons.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const from = location.state?.from;

  function destination(u) {
    if (u?.role === "ADMIN") return "/admin";
    return from && from !== "/entrar" ? from : "/mi-cuenta";
  }

  if (user) return <Navigate to={destination(user)} replace />;

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const logged = await login(form);
      toast(`Hola de nuevo, ${logged.name.split(" ")[0]}`);
      navigate(destination(logged), { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="auth-page fade-up">
        <div className="auth-card">
          <span className="eyebrow">Acceso</span>
          <h1 className="auth-card__title">Entra en tu cuenta</h1>
          <p className="auth-card__sub">
            Consulta tus citas, cámbialas o cancélalas cuando te venga mejor.
          </p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="form-error">
                <Icon name="alert" size={15} /> {error}
              </div>
            )}

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
              <label className="field__label" htmlFor="password">
                Contraseña
              </label>
              <div className="input-group">
                <input
                  id="password"
                  className="input"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={update("password")}
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

            <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy}>
              {busy ? "Entrando…" : "Entrar"}
              {!busy && <Icon name="arrowRight" size={16} />}
            </button>
          </form>

          {isDemo && (
            <DemoLogin
              onSuccess={(u) => {
                toast(`Sesión iniciada como ${u.name}`);
                navigate(destination(u), { replace: true });
              }}
            />
          )}

          <p className="auth-foot">
            ¿Aún no tienes cuenta? <Link to="/registro">Crear una cuenta</Link>
          </p>
        </div>
        <AuthAside />
      </div>
    </div>
  );
}
