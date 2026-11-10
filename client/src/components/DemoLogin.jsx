// client/src/components/DemoLogin.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Icon } from "./Icons.jsx";
import { DEMO_ACCOUNTS, DemoAccountCard } from "./DemoAccess.jsx";

export { DEMO_ACCOUNTS };

export default function DemoLogin({ onSuccess, note = true, accounts = DEMO_ACCOUNTS }) {
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
      <h2 className="demo-login__title">
        <Icon name="sparkle" size={13} /> Acceso rápido a la demo
      </h2>
      <p className="demo-login__hint">
        Entra con un clic o copia estas credenciales para usar el formulario.
      </p>
      <div className="demo-login__grid">
        {accounts.map((account) => (
          <DemoAccountCard
            key={account.key}
            account={account}
            onEnter={enter}
            busy={busy === account.key}
          />
        ))}
      </div>
      {error && <p className="field__error mt-2">{error}</p>}
      {note && (
        <p className="demo-login__note">
          Los datos viven solo en este navegador. Puedes restablecerlos desde el pie de página.
        </p>
      )}
    </div>
  );
}
