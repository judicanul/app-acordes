// src/pages/Auth.jsx
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirigir a la página de donde venía o a la raíz
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        navigate(from, { replace: true });
      } else {
        const data = await signUp(email, password);
        // Si Supabase tiene confirmación de correo activa:
        if (data?.user && !data?.session) {
          setMessage('¡Cuenta creada con éxito! Por favor revisa tu correo electrónico para confirmar tu registro.');
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      console.error('Error de autenticación:', err);
      setError(
        err.message === 'Invalid login credentials'
          ? 'Correo electrónico o contraseña incorrectos.'
          : err.message || 'Ocurrió un error al procesar la solicitud.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card form-card auth-card">
        <div className="form-header text-center">
          <Link to="/" className="back-link">
            ← Volver a la biblioteca
          </Link>
          <h2>{isLogin ? 'Iniciar Sesión' : 'Crear Nueva Cuenta'}</h2>
          <p className="subtitle">
            {isLogin
              ? 'Accede para administrar y subir tus canciones y acordes.'
              : 'Regístrate para comenzar a compartir tus propios acordes.'}
          </p>
        </div>

        {/* Pestañas de Selección */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setError('');
              setMessage('');
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setError('');
              setMessage('');
            }}
          >
            Registrarse
          </button>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="alert alert-success" role="alert">
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="tu-correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="form-input"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="form-input"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block mt-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="btn-loading-content">
                <span className="spinner-small"></span>
                <span>Procesando...</span>
              </div>
            ) : isLogin ? (
              'Ingresar a mi cuenta'
            ) : (
              'Crear cuenta gratuita'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
