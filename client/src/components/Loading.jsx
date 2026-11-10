// client/src/components/Loading.jsx
export function Loading({ label = "Cargando…" }) {
  return (
    <div className="loading-block">
      <span className="spinner" />
      {label}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }) {
  return (
    <div className="empty">
      <div className="empty__icon" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
        !
      </div>
      <h3 className="empty__title">Algo no ha ido bien</h3>
      <p className="empty__text">{message || "No se pudo cargar la información."}</p>
      {onRetry && (
        <button className="btn btn--secondary" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
