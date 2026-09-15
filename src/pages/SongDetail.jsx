// src/pages/SongDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cancion, setCancion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar información de la canción desde Supabase
  useEffect(() => {
    const fetchSong = async () => {
      if (!id) {
        setError('ID de canción no especificado.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');

        const { data, error: fetchError } = await supabase
          .from('canciones')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError || !data) {
          setError('La canción solicitada no existe o fue eliminada.');
        } else {
          setCancion(data);
        }
      } catch (err) {
        console.error('Error al obtener la canción de Supabase:', err);
        setError('Error al consultar la base de datos. Por favor verifica tu conexión.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSong();
  }, [id]);

  // Estado de Carga
  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando partitura / acordes...</p>
        </div>
      </div>
    );
  }

  // Estado de Error o No Encontrado
  if (error || !cancion) {
    return (
      <div className="page-container">
        <div className="card empty-state">
          <div className="empty-icon">❌</div>
          <h2>Canción no encontrada</h2>
          <p>{error || 'No se pudo cargar la información de esta canción.'}</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary mt-4"
          >
            ← Volver a la Biblioteca
          </button>
        </div>
      </div>
    );
  }

  const tipoArchivo = cancion.tipoArchivo || cancion.tipo_archivo;
  const archivoUrl = cancion.archivoUrl || cancion.archivo_url;
  const isPdf = tipoArchivo === 'pdf';

  // --- REGLA CRÍTICA 2: Generar la URL adecuada para el visor Iframe ---
  const iframeSrc = isPdf
    ? archivoUrl
    : `https://docs.google.com/gview?url=${encodeURIComponent(archivoUrl)}&embedded=true`;

  return (
    <div className="page-container detail-page">
      {/* Barra superior de navegación y acciones */}
      <div className="detail-header-card card">
        <div className="detail-header-left">
          <Link to="/" className="back-link">
            ← Volver a canciones
          </Link>
          <div className="detail-title-group">
            <h1 className="detail-song-title">{cancion.titulo}</h1>
            <p className="detail-song-artist">
              <span>Artista:</span> <strong>{cancion.artista}</strong>
            </p>
          </div>
          <div className="detail-meta">
            <span className={`badge badge-${isPdf ? 'pdf' : 'word'}`}>
              {isPdf ? '📄 Documento PDF' : '📝 Documento Microsoft Word'}
            </span>
          </div>
        </div>

        <div className="detail-header-right">
          {/* Botón de descarga directa */}
          <a
            href={archivoUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="btn btn-download"
            title="Descargar archivo original a tu dispositivo"
          >
            📥 Descarga Directa
          </a>
        </div>
      </div>

      {/* Visor Embebido (Iframe) */}
      <div className="viewer-container card">
        <div className="viewer-toolbar">
          <span className="viewer-toolbar-title">
            Visualizador de {isPdf ? 'PDF' : 'Word (Google Docs Viewer)'}
          </span>
          <a
            href={archivoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="viewer-external-link"
          >
            Abrir archivo en pestaña nueva ↗
          </a>
        </div>

        <div className="iframe-wrapper">
          <iframe
            src={iframeSrc}
            title={`Visor de ${cancion.titulo}`}
            className="document-iframe"
            allowFullScreen
          />
        </div>

        {!isPdf && (
          <div className="viewer-notice">
            <small>
              ℹ️ Los documentos de Word se procesan a través del visor web de Google Docs. Si tu conexión o navegador bloquea cookies de terceros, puedes usar el botón de <strong>Descarga Directa</strong> arriba.
            </small>
          </div>
        )}
      </div>
    </div>
  );
}
