// client/src/components/DemoAccess.jsx
// Credenciales y tarjetas de acceso compartidas por la demo pública.
import { useState } from "react";
import { useToast } from "../context/ToastContext.jsx";
import { Icon } from "./Icons.jsx";

export const DEMO_ACCOUNTS = [
  {
    key: "client",
    title: "Cliente",
    action: "Entrar como cliente",
    email: "cliente@bookly.com",
    password: "cliente1234",
    icon: "user",
    description:
      "Reserva una cita, consulta tu historial y cámbiala o cancélala sin llamar.",
    highlights: ["Reserva en tres pasos", "Reprograma y cancela"],
  },
  {
    key: "admin",
    title: "Administración",
    action: "Entrar como administrador",
    email: "admin@bookly.com",
    password: "admin1234",
    icon: "shield",
    description:
      "Abre el panel privado: agenda del día, servicios, horarios, bloqueos y clientes.",
    highlights: ["Agenda y estados", "Servicios, horarios y bloqueos"],
  },
];

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* Probamos el fallback clásico */
  }

  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.top = "-1000px";
    document.body.appendChild(el);
    try {
      el.select();
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(el);
    }
  } catch {
    return false;
  }
}

function Credential({ label, value }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(value);
    if (!ok) {
      toast("No se pudo copiar. Selecciona el texto manualmente.", "error");
      return;
    }
    setCopied(true);
    toast("Copiado al portapapeles");
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="demo-cred">
      <div className="demo-cred__body">
        <span className="demo-cred__label">{label}</span>
        <code className="demo-cred__value">{value}</code>
      </div>
      <button
        type="button"
        className={`demo-cred__copy ${copied ? "is-copied" : ""}`}
        onClick={handleCopy}
        aria-label={`Copiar ${label.toLowerCase()}`}
      >
        <Icon name={copied ? "check" : "copy"} size={13} />
        <span>{copied ? "Copiado" : "Copiar"}</span>
      </button>
    </div>
  );
}

export function DemoAccountCard({ account, onEnter, busy = false, detailed = false }) {
  return (
    <article className={`demo-account ${detailed ? "demo-account--detailed" : ""}`}>
      <div className="demo-account__head">
        <span className="demo-account__icon">
          <Icon name={account.icon} size={detailed ? 19 : 16} />
        </span>
        <div className="demo-account__heading">
          <h3 className="demo-account__title">{account.title}</h3>
          {detailed && <p className="demo-account__desc">{account.description}</p>}
        </div>
      </div>

      {detailed && (
        <ul className="demo-account__list">
          {account.highlights.map((item) => (
            <li key={item}>
              <Icon name="check" size={13} /> {item}
            </li>
          ))}
        </ul>
      )}

      <div className="demo-account__creds">
        <Credential label="Email" value={account.email} />
        <Credential label="Contraseña" value={account.password} />
      </div>

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={() => onEnter(account)}
        disabled={busy}
      >
        {busy ? "Entrando…" : account.action}
        {!busy && <Icon name="arrowRight" size={15} />}
      </button>
    </article>
  );
}
