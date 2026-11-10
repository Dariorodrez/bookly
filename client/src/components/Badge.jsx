// client/src/components/Badge.jsx
export const STATUS_LABELS = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No presentado",
};

export function StatusBadge({ status }) {
  const key = String(status || "").toLowerCase();
  return (
    <span className={`badge badge--${key}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
