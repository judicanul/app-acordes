// src/components/Navbar.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-text">Acordes<strong>App</strong></span>
        </Link>

        <div className="navbar-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Canciones
          </Link>

          {user ? (
            <div className="user-menu">
              <span
                className={`user-email-badge ${isAdmin ? 'badge-admin' : ''}`}
                title={`Sesión iniciada como: ${user.email} ${isAdmin ? '(Usuario Padre / Admin)' : ''}`}
              >
                {isAdmin ? 'Admin: ' : ''}
                {user.email?.split('@')[0]}
                {isAdmin && <span className="admin-tag">Padre</span>}
              </span>
              <button
                onClick={handleLogout}
                className="btn-logout"
                title="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className={`btn-login ${location.pathname === '/login' ? 'active' : ''}`}
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
