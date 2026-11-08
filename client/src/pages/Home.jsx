// client/src/pages/Home.jsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: () => api.get("/services"),
  });

  if (isLoading) return <p>Cargando servicios...</p>;
  if (error) return <p className="text-red-600">{error.message}</p>;

  const services = data?.services || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Servicios disponibles</h1>
      <p className="text-gray-600 mb-6">Reserva tu cita en unos segundos.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div key={s.id} className="card">
            <h2 className="text-xl font-semibold mb-1">{s.name}</h2>
            <p className="text-gray-600 text-sm mb-3">{s.description}</p>
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-gray-500">{s.durationMin} min</span>
              {s.price != null && <span className="font-semibold">{s.price} €</span>}
            </div>
            <Link to={`/booking/${s.id}`} className="btn btn-primary w-full">
              Reservar
            </Link>
          </div>
        ))}
        {services.length === 0 && <p className="text-gray-500">No hay servicios disponibles.</p>}
      </div>
    </div>
  );
}
