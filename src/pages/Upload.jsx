// src/pages/Upload.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../context/AuthContext';

export default function Upload() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados del formulario
  const [titulo, setTitulo] = useState('');
  const [artista, setArtista] = useState('');
  const [archivo, setArchivo] = useState(null);

  // Estados de control y UI
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Validar y detectar tipo de archivo permitido
  const getTipoArchivo = (file) => {
    if (!file) return null;
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (extension === 'doc' || extension === 'docx') return 'word';
    return null;
  };

  // Manejador del cambio de archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setErrorMessage('');
    if (!file) {
      setArchivo(null);
      return;
    }

    const tipo = getTipoArchivo(file);
    if (!tipo) {
      setErrorMessage('Formato no soportado. Por favor, selecciona un archivo PDF (.pdf) o Word (.doc, .docx).');
      e.target.value = '';
      setArchivo(null);
      return;
    }

    setArchivo(file);
  };

  // Envío del formulario siguiendo la Regla Crítica 1 (Prevención de huérfanos)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      setErrorMessage('Debes iniciar sesión para poder subir un acorde.');
      return;
    }

    if (!titulo.trim() || !artista.trim() || !archivo) {
      setErrorMessage('Por favor completa todos los campos y adjunta un archivo válido.');
      return;
    }

    const tipoArchivo = getTipoArchivo(archivo);
    if (!tipoArchivo) {
      setErrorMessage('El formato del archivo no es válido (sólo PDF o Word).');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Extraer la extensión original del archivo
      const extension = archivo.name.split('.').pop().toLowerCase();

      // Sanitizar nombres para la ruta de almacenamiento (evitar caracteres conflictivos en URLs)
      const sanitizedArtista = artista.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
      const sanitizedTitulo = titulo.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
      const timestamp = Date.now();

      // Ruta en el bucket 'archivos': {artista}/{cancion}_{timestamp}.{extension}
      const storagePath = `${sanitizedArtista}/${sanitizedTitulo}_${timestamp}.${extension}`;

      // --- REGLA CRÍTICA 1: Subir PRIMERO a Supabase Storage ---
      setUploadStep('Subiendo archivo a Supabase Storage...');
      const { data: uploadData, error: storageError } = await supabase.storage
        .from('archivos')
        .upload(storagePath, archivo, {
          cacheControl: '3600',
          upsert: true,
        });

      if (storageError) {
        throw new Error(`Error en almacenamiento: ${storageError.message}`);
      }

      // --- Obtener la URL pública exitosamente ---
      setUploadStep('Obteniendo URL pública del archivo...');
      const { data: publicUrlData } = supabase.storage
        .from('archivos')
        .getPublicUrl(uploadData.path);

      const downloadUrl = publicUrlData?.publicUrl;
      if (!downloadUrl) {
        throw new Error('No se pudo generar la URL pública del archivo.');
      }

      // --- Crear registro en la tabla 'canciones' vinculando al usuario actual ---
      setUploadStep('Registrando información en la base de datos...');
      const { data: songRecord, error: dbError } = await supabase
        .from('canciones')
        .insert([
          {
            titulo: titulo.trim(),
            artista: artista.trim(),
            tipoArchivo,
            archivoUrl: downloadUrl,
            user_id: user.id,
            user_email: user.email,
          },
        ])
        .select()
        .single();

      if (dbError) {
        throw new Error(`Error en base de datos: ${dbError.message}`);
      }

      // Redireccionar a la vista de detalle de la canción recién subida
      navigate(`/cancion/${songRecord.id}`);
    } catch (error) {
      console.error('Error durante la carga:', error);
      setErrorMessage(
        `Error al subir la canción: ${error.message || 'Ocurrió un error inesperado. Por favor intenta de nuevo.'}`
      );
    } finally {
      setIsUploading(false);
      setUploadStep('');
    }
  };

  // Si no está autenticado, invitarlo a iniciar sesión
  if (!user) {
    return (
      <div className="page-container">
        <div className="card empty-state">
          <h2>Inicia sesión para subir acordes</h2>
          <p>
            Para compartir y administrar tus partituras y canciones, necesitas tener una cuenta.
          </p>
          <div className="empty-actions mt-4">
            <Link to="/login" state={{ from: { pathname: '/subir' } }} className="btn btn-primary">
              Iniciar Sesión o Registrarme
            </Link>
            <Link to="/" className="btn btn-secondary ml-2">
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card form-card">
        <div className="form-header">
          <Link to="/" className="back-link">
            ← Volver a canciones
          </Link>
          <h2>Subir Nuevo Acorde</h2>
          <p className="subtitle">
            Publicando como: <strong>{user.email}</strong>
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-error" role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="titulo">
              Título de la canción <span className="required">*</span>
            </label>
            <input
              id="titulo"
              type="text"
              placeholder="Ej: De Música Ligera"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={isUploading}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="artista">
              Artista o Banda <span className="required">*</span>
            </label>
            <input
              id="artista"
              type="text"
              placeholder="Ej: Soda Stereo"
              value={artista}
              onChange={(e) => setArtista(e.target.value)}
              disabled={isUploading}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="archivo">
              Archivo de acordes (PDF o Word) <span className="required">*</span>
            </label>
            <div className="file-input-wrapper">
              <input
                id="archivo"
                type="file"
                accept=".pdf, .doc, .docx, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                disabled={isUploading}
                required
                className="file-input"
              />
              {archivo && (
                <div className="file-preview-badge">
                  <span className={`badge badge-${getTipoArchivo(archivo)}`}>
                    {getTipoArchivo(archivo)?.toUpperCase()}
                  </span>
                  <span className="file-name">{archivo.name}</span>
                  <span className="file-size">
                    ({(archivo.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
            <small className="help-text">
              Formatos soportados: PDF (.pdf) y Microsoft Word (.doc, .docx).
            </small>
          </div>

          {isUploading && (
            <div className="upload-progress-container">
              <div className="spinner"></div>
              <p className="progress-text">{uploadStep}</p>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
              disabled={isUploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUploading}
            >
              {isUploading ? 'Subiendo archivo...' : 'Guardar y Subir Acorde'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
