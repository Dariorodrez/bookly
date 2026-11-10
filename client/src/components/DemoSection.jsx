// client/src/components/DemoSection.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Icon } from "./Icons.jsx";
import { DEMO_ACCOUNTS, DemoAccountCard } from "./DemoAccess.jsx";

export default function DemoSection() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  async function enter(account) {
    setBusy(account.key);
    setError("");
    try {
      const user = await login({ email: account.email, password: account.password });
      toast(`Sesión iniciada como ${user.name}`);
      navigate(user.role === "ADMIN" ? "/admin" : "/mi-cuenta");
    } catch (e) {
      setError(e.message || "No se pudo entrar. Inténtalo de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="section section--demo" id="demo">
      <div className="container">
        <div className="section__head">
          <div>
            <span className="eyebrow">Demo pública</span>
            <h2 className="section__title">Entra sin registrarte</h2>
            <p className="section__text">
              Elige una cuenta y recorre la aplicación completa. No hay que crear nada: las
              credenciales están aquí mismo.
            </p>
          </div>
          <span className="demo-badge">
            <Icon name="shield" size={14} /> Datos de prueba
          </span>
        </div>

        <div className="demo-access">
          {DEMO_ACCOUNTS.map((account) => (
            <DemoAccountCard
              key={account.key}
              account={account}
              onEnter={enter}
              busy={busy === account.key}
              detailed
            />
          ))}
        </div>

        {error && <p className="field__error mt-2">{error}</p>}

        <p className="demo-access__note">
          <Icon name="info" size={14} />
          <span>
            La demo se ejecuta en tu navegador: puedes reservar, cancelar y tocar el panel sin
            miedo. Los cambios se guardan solo en este dispositivo y se restablecen desde el pie de
            página.
          </span>
        </p>
      </div>
    </section>
  );
}
