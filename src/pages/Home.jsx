// src/pages/Home.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/client';

export default function Home() {
  const [canciones, setCanciones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Obtener lista de canciones desde Supabase
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
          <h1>Biblioteca de Acordes</h1>
          <p className="subtitle">
            Explora, visualiza y descarga acordes en formato PDF y Word con Supabase.
          </p>
        </div>

        <div className="home-controls">
          <div className="search-bar-container">
            <span className="search-icon">🔍</span>
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
            + Subir Acorde
          </Link>
        </div>
      </header>

      {/* Alerta de Error */}
      {error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Estado de Carga */}
      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando canciones desde Supabase...</p>
        </div>
      ) : cancionesFiltradas.length === 0 ? (
        /* Estado Vacío */
        <div className="empty-state card">
          <div className="empty-icon">🎼</div>
          <h3>
            {searchTerm
              ? `No se encontraron coincidencias para "${searchTerm}"`
              : 'Aún no hay canciones registradas'}
          </h3>
          <p>
            {searchTerm
              ? 'Intenta con otro término de búsqueda o limpia el filtro.'
              : 'Sube tu primer archivo de acordes en PDF o Word para comenzar.'}
          </p>
          {!searchTerm && (
            <Link to="/subir" className="btn btn-primary mt-4">
              Subir la primera canción
            </Link>
          )}
        </div>
      ) : (
        /* Cuadrícula de Canciones */
        <div className="songs-grid">
          {cancionesFiltradas.map((cancion) => {
            const isPdf = cancion.tipoArchivo === 'pdf' || cancion.tipo_archivo === 'pdf';
            return (
              <article key={cancion.id} className="song-card card">
                <div className="song-card-top">
                  <span
                    className={`badge badge-${isPdf ? 'pdf' : 'word'}`}
                  >
                    {isPdf ? '📄 PDF' : '📝 WORD'}
                  </span>
                  <span className="song-date">
                    {formatFecha(cancion.created_at || cancion.createdAt)}
                  </span>
                </div>

                <div className="song-card-body">
                  <h3 className="song-title" title={cancion.titulo}>
                    {cancion.titulo}
                  </h3>
                  <p className="song-artist" title={cancion.artista}>
                    👤 {cancion.artista}
                  </p>
                </div>

                <div className="song-card-footer">
                  <Link
                    to={`/cancion/${cancion.id}`}
                    className="btn btn-card-action"
                  >
                    Ver Acorde →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
