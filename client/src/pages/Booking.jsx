// client/src/pages/Booking.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../api/client.js";

export default function Booking() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const { data: svcData } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => api.get(`/services/${serviceId}`),
  });

  const { data: availData, isLoading } = useQuery({
    queryKey: ["availability", serviceId, date],
    queryFn: () => api.get(`/availability?serviceId=${serviceId}&date=${date}`),
  });

  const mutation = useMutation({
    mutationFn: (slot) =>
      api.post("/appointments", { serviceId, startsAt: slot.startsAt }),
    onSuccess: () => navigate("/mis-citas"),
    onError: (err) => setError(err.message),
  });

  const service = svcData?.service;
  const slots = availData?.slots || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{service?.name || "Reservar"}</h1>
      {service && (
        <p className="text-gray-600 mb-6">
          {service.durationMin} min {service.price != null ? `· ${service.price} €` : ""}
        </p>
      )}

      <div className="card mb-6">
        <label className="label">Fecha</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSelected(null);
          }}
          min={new Date().toISOString().slice(0, 10)}
        />
      </div>

      <h2 className="text-lg font-semibold mb-3">Horarios disponibles</h2>
      {isLoading && <p>Cargando horarios...</p>}
      {!isLoading && slots.length === 0 && (
        <p className="text-gray-500">No hay huecos disponibles este día.</p>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-6">
        {slots.map((slot) => {
          const time = new Date(slot.startsAt).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Madrid",
          });
          const active = selected?.startsAt === slot.startsAt;
          return (
            <button
              key={slot.startsAt}
              onClick={() => setSelected(slot)}
              className={`py-2 rounded-lg border text-sm font-medium transition ${
                active ? "bg-ink text-paper border-ink" : "bg-white hover:border-ink"
              }`}
            >
              {time}
            </button>
          );
        })}
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <button
        className="btn btn-primary w-full sm:w-auto"
        disabled={!selected || mutation.isPending}
        onClick={() => selected && mutation.mutate(selected)}
      >
        {mutation.isPending ? "Reservando..." : "Confirmar reserva"}
      </button>
    </div>
  );
}
