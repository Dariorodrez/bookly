// client/src/components/ProtectedRoute.jsx
import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { isDemo } from "../api/index.js";
import { DEMO_ACCOUNTS } from "./DemoAccess.jsx";
import DemoLogin from "./DemoLogin.jsx";

export default function ProtectedRoute({ children, role }) {
  const { user, ready } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="loading-block">
        <span className="spinner" />
        Comprobando sesión…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  }

  if (role && user.role !== role) {
    return (
      <div className="container page">
        <div className="empty">
          <div className="empty__icon">403</div>
          <h1 className="empty__title">No tienes acceso a esta sección</h1>
          <p className="empty__text">
            Esta área es solo para el equipo del negocio. Si necesitas gestionar citas, entra con una
            cuenta de administración.
          </p>
          <Link className="btn btn--primary" to="/mi-cuenta">
            Volver a mi cuenta
          </Link>

          {isDemo && (
            <div className="protected-demo">
              <DemoLogin
                accounts={DEMO_ACCOUNTS.filter((a) => a.key === "admin")}
                note={false}
                onSuccess={(u) => toast(`Sesión iniciada como ${u.name}`)}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return children;
}
