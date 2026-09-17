// src/pages/Home.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/client';

export default function Home() {
  const [canciones, setCanciones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Obtener lista de canciones desde Supabase (catálogo global)
  useEffect(() => {
    const fetchCanciones = async () => {
      try {
        setIsLoading(true);
        setError('');

        const { data, error: fetchError } = await supabase
          .from('canciones')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setCanciones(data || []);
      } catch (err) {
        console.error('Error al obtener canciones de Supabase:', err);
        setError('No se pudieron cargar las canciones. Verifica tu conexión o las credenciales de Supabase en .env.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCanciones();
  }, []);

  // Filtrar canciones en memoria por título o artista
  const cancionesFiltradas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return canciones;
    return canciones.filter(
      (c) =>
        c.titulo?.toLowerCase().includes(term) ||
        c.artista?.toLowerCase().includes(term)
    );
  }, [canciones, searchTerm]);

  // Formato de fecha amigable
  const formatFecha = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Reciente';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="page-container">
      {/* Encabezado y Barra de Búsqueda */}
      <header className="home-header">
        <div className="home-title-section">
          <h1>Catálogo Comunitario de Acordes</h1>
          <p className="subtitle">
            Explora y visualiza todos los acordes compartidos por la comunidad. Inicia sesión para descargar o subir canciones.
          </p>
        </div>

        <div className="home-controls">
          <div className="search-bar-container">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por canción o artista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          <Link to="/subir" className="btn btn-primary">
            Subir Acorde
          </Link>
        </div>
      </header>

      {/* Alerta de Error */}
      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Estado de Carga */}
      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando catálogo comunitario...</p>
        </div>
      ) : cancionesFiltradas.length === 0 ? (
        /* Estado Vacío */
        <div className="empty-state card">
          <h3>
            {searchTerm
              ? `No se encontraron coincidencias para "${searchTerm}"`
              : 'Aún no hay canciones registradas'}
          </h3>
          <p>
            {searchTerm
              ? 'Intenta con otro término de búsqueda o limpia el filtro.'
              : 'Sé el primero en compartir un acorde con la comunidad.'}
          </p>
          {!searchTerm && (
            <Link to="/subir" className="btn btn-primary mt-4">
              Subir la primera canción
            </Link>
          )}
        </div>
      ) : (
        /* Lista de Canciones */
        <div className="songs-list">
          {cancionesFiltradas.map((cancion) => {
            const isPdf = cancion.tipoArchivo === 'pdf' || cancion.tipo_archivo === 'pdf';
            const uploaderName = cancion.user_email
              ? cancion.user_email.split('@')[0]
              : 'Comunidad';

            return (
              <div key={cancion.id} className="song-list-item">
                <div className="song-item-type">
                  <span
                    className={`badge badge-${isPdf ? 'pdf' : 'word'}`}
                  >
                    {isPdf ? 'PDF' : 'WORD'}
                  </span>
                </div>

                <div className="song-item-info">
                  <h3 className="song-item-title">
                    <Link to={`/cancion/${cancion.id}`}>
                      {cancion.titulo}
                    </Link>
                  </h3>
                  <div className="song-item-meta">
                    <span className="song-item-artist">{cancion.artista}</span>
                    <span className="song-item-dot">•</span>
                    <span className="song-item-uploader">Subido por {uploaderName}</span>
                    <span className="song-item-dot">•</span>
                    <span className="song-item-date">{formatFecha(cancion.created_at || cancion.createdAt)}</span>
                  </div>
                </div>

                <div className="song-item-action">
                  <Link
                    to={`/cancion/${cancion.id}`}
                    className="btn btn-list-action"
                  >
                    Ver Acorde
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
