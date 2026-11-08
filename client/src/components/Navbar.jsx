// client/src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { isDemo } from "../api/client.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <>
      {isDemo && (
        <div className="bg-amber-100 text-amber-900 text-xs text-center py-1 px-2">
          Modo demo (GitHub Pages): los datos se guardan en tu navegador. Admin: admin@bookly.com / admin1234
        </div>
      )}
      <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-ink">
          BOOKLY
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-sandText">
            Servicios
          </Link>
          {user ? (
            <>
              <Link to="/mis-citas" className="hover:text-sandText">
                Mis citas
              </Link>
              {user.role === "ADMIN" && (
                <Link to="/admin" className="hover:text-sandText">
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} className="text-gray-600 hover:text-ink">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-sandText">
                Entrar
              </Link>
              <Link to="/register" className="btn btn-primary">
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
    </>
  );
}
