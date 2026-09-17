// src/pages/SongDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const [cancion, setCancion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para eliminación con confirmación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Extraer la ruta relativa del archivo en el bucket a partir de la URL pública
  const extractStoragePath = (url) => {
    if (!url) return null;
    const parts = url.split('/public/archivos/');
    if (parts.length > 1) {
      return decodeURIComponent(parts[1]);
    }
    return null;
  };

  // Lógica de Eliminación Segura (Reservada para Usuario Padre)
  const handleDelete = async () => {
    if (!cancion || !isAdmin) return;

    try {
      setIsDeleting(true);

      // 1. Borrar archivo físico de Supabase Storage para evitar huérfanos
      const storagePath = extractStoragePath(cancion.archivoUrl || cancion.archivo_url);
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('archivos')
          .remove([storagePath]);

        if (storageError) {
          console.warn('Aviso al remover de Storage:', storageError.message);
        }
      }

      // 2. Borrar registro en la base de datos
      const { error: dbError } = await supabase
        .from('canciones')
        .delete()
        .eq('id', cancion.id);

      if (dbError) {
        throw new Error(`Error en base de datos: ${dbError.message}`);
      }

      // 3. Redirigir a la biblioteca principal
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Error durante la eliminación:', err);
      alert(`No se pudo eliminar la canción: ${err.message || 'Error inesperado'}`);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

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
          <h2>Canción no encontrada</h2>
          <p>{error || 'No se pudo cargar la información de esta canción.'}</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary mt-4"
          >
            Volver a la Biblioteca
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
            ← Volver al catálogo comunitario
          </Link>
          <div className="detail-title-group">
            <h1 className="detail-song-title">{cancion.titulo}</h1>
            <p className="detail-song-artist">
              <span>Artista:</span> <strong>{cancion.artista}</strong>
            </p>
          </div>
          <div className="detail-meta">
            <span className={`badge badge-${isPdf ? 'pdf' : 'word'}`}>
              {isPdf ? 'Documento PDF' : 'Documento Microsoft Word'}
            </span>
            {cancion.user_email && (
              <span className="badge badge-uploader">
                Subido por {cancion.user_email.split('@')[0]}
              </span>
            )}
          </div>
        </div>

        <div className="detail-header-right">
          {/* Botón de Descarga condicionado a tener sesión iniciada */}
          {user ? (
            <a
              href={archivoUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="btn btn-download"
              title="Descargar archivo original a tu dispositivo"
            >
              Descarga Directa
            </a>
          ) : (
            <Link
              to="/login"
              state={{ from: location }}
              className="btn btn-download-locked"
              title="Inicia sesión para poder descargar este archivo"
            >
              Iniciar sesión para descargar
            </Link>
          )}

          {/* Botón de eliminación EXCLUSIVO para Usuario Padre (Admin) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-delete-action"
              title="Acción de Administrador: Eliminar este acorde de forma permanente"
            >
              Eliminar (Admin)
            </button>
          )}
        </div>
      </div>

      {/* Visor Embebido (Iframe) - Accesible para TODOS */}
      <div className="viewer-container card">
        <div className="viewer-toolbar">
          <span className="viewer-toolbar-title">
            Visualizador de {isPdf ? 'PDF' : 'Word (Google Docs Viewer)'}
          </span>
          {user ? (
            <a
              href={archivoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="viewer-external-link"
            >
              Abrir archivo en pestaña nueva
            </a>
          ) : (
            <Link
              to="/login"
              state={{ from: location }}
              className="viewer-external-link locked"
            >
              Iniciar sesión para enlace directo
            </Link>
          )}
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
              Los documentos de Word se procesan a través del visor web de Google Docs. Si tienes sesión iniciada, también puedes usar el botón de <strong>Descarga Directa</strong> arriba.
            </small>
          </div>
        )}
      </div>

      {/* Modal de Confirmación exclusivo para Administrador */}
      {isAdmin && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => !isDeleting && setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title={`¿Eliminar "${cancion.titulo}"? (Admin)`}
          message="Acción de Usuario Padre: Esta acción eliminará permanentemente el archivo en Storage y el registro del catálogo comunitario de todos los usuarios. ¿Estás seguro de continuar?"
          confirmText="Sí, eliminar del catálogo"
          cancelText="Cancelar"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
