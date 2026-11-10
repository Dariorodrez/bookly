// client/src/components/DemoLogin.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Icon } from "./Icons.jsx";

export const DEMO_ACCOUNTS = [
  {
    key: "client",
    title: "Cliente demo",
    subtitle: "cliente@bookly.com",
    email: "cliente@bookly.com",
    password: "cliente1234",
    icon: "user",
  },
  {
    key: "admin",
    title: "Administración",
    subtitle: "admin@bookly.com",
    email: "admin@bookly.com",
    password: "admin1234",
    icon: "shield",
  },
];

export default function DemoLogin({ onSuccess, note = true }) {
  const { login } = useAuth();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  async function enter(account) {
    setBusy(account.key);
    setError("");
    try {
      const user = await login({ email: account.email, password: account.password });
      onSuccess?.(user);
    } catch (e) {
      setError(e.message || "No se pudo entrar");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="demo-login">
      <div className="demo-login__title">
        <Icon name="sparkle" size={13} /> Acceso rápido a la demo
      </div>
      <div className="demo-login__grid">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.key}
            type="button"
            className="demo-login__btn"
            onClick={() => enter(account)}
            disabled={Boolean(busy)}
          >
            <strong>
              {busy === account.key ? "Entrando…" : account.title}
            </strong>
            <span>{account.subtitle}</span>
          </button>
        ))}
      </div>
      {error && <p className="field__error mt-2">{error}</p>}
      {note && (
        <p className="demo-login__note">
          Sin registro. Los datos de la demo viven únicamente en este navegador y puedes
          restablecerlos cuando quieras desde el pie de página.
        </p>
      )}
    </div>
  );
}
