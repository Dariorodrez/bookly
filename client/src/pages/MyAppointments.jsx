// client/src/pages/MyAppointments.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client.js";

export default function MyAppointments() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-appointments"],
    queryFn: () => api.get("/appointments/mine"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.patch(`/appointments/${id}/cancel`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-appointments"] }),
  });

  if (isLoading) return <p>Cargando citas...</p>;
  if (error) return <p className="text-red-600">{error.message}</p>;

  const appointments = data?.appointments || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mis citas</h1>
      {appointments.length === 0 && <p className="text-gray-500">No tienes citas.</p>}

      <div className="space-y-3">
        {appointments.map((a) => (
          <div key={a.id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold">{a.service?.name}</p>
              <p className="text-sm text-gray-600">
                {new Date(a.startsAt).toLocaleString("es-ES", {
                  dateStyle: "full",
                  timeStyle: "short",
                  timeZone: "Europe/Madrid",
                })}
              </p>
              <p className="text-xs mt-1">
                <span
                  className={`px-2 py-0.5 rounded-full ${
                    a.status === "CANCELLED"
                      ? "bg-gray-200 text-gray-600"
                      : a.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {a.status}
                </span>
              </p>
            </div>
            {a.status !== "CANCELLED" && a.status !== "COMPLETED" && a.status !== "NO_SHOW" && (
              <button
                className="btn btn-danger text-sm"
                onClick={() => cancelMutation.mutate(a.id)}
                disabled={cancelMutation.isPending}
              >
                Cancelar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
