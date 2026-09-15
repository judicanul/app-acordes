// src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🎵</span>
          <span className="brand-text">Acordes<strong>App</strong></span>
        </Link>

        <div className="navbar-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Canciones
          </Link>
          <Link
            to="/subir"
            className={`btn-nav-upload ${location.pathname === '/subir' ? 'active' : ''}`}
          >
            + Subir Acorde
          </Link>
        </div>
      </div>
    </nav>
  );
}
