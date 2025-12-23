import React, { useState } from 'react';
import axios from 'axios';
import './PreguntaDetail.css';

// Usar ruta relativa en producción, localhost en desarrollo
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

function PreguntaDetail({ pregunta, onBack, onDelete, onUpdate }) {
  const [respuestas, setRespuestas] = useState(pregunta.respuestas || []);
  const [preguntaTexto, setPreguntaTexto] = useState(pregunta.texto || '');
  const [editandoPregunta, setEditandoPregunta] = useState(false);
  const [editandoRespuesta, setEditandoRespuesta] = useState(null);
  const [textoEditado, setTextoEditado] = useState('');
  const [esCorrectaEditada, setEsCorrectaEditada] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [agregandoRespuesta, setAgregandoRespuesta] = useState(false);
  const [nuevaRespuesta, setNuevaRespuesta] = useState({ opcion: '', texto: '' });

  const handleMarcarCorrecta = async (respuestaId) => {
    setUpdating(respuestaId);
    try {
      const response = await axios.put(`${API_BASE_URL}/respuestas/${respuestaId}/correcta`, {
        es_correcta: true
      });
      
      if (response.data.success) {
        // Actualizar el estado local
        setRespuestas(prevRespuestas => 
          prevRespuestas.map(r => ({
            ...r,
            es_correcta: r.id === respuestaId ? 1 : 0
          }))
        );
      }
    } catch (error) {
      console.error('Error al marcar respuesta como correcta:', error);
      alert('Error al actualizar la respuesta');
    } finally {
      setUpdating(null);
    }
  };

  const handleEditarPregunta = () => {
    setEditandoPregunta(true);
  };

  const handleGuardarPregunta = async () => {
    try {
      const response = await axios.put(`${API_BASE_URL}/preguntas/${pregunta.id}`, {
        texto: preguntaTexto
      });
      
      if (response.data.success) {
        // Actualizar el estado local de la pregunta
        pregunta.texto = preguntaTexto;
        setEditandoPregunta(false);
        alert('Pregunta actualizada correctamente');
      } else {
        alert('Error: ' + (response.data.error || 'No se pudo actualizar la pregunta'));
      }
    } catch (error) {
      console.error('Error al actualizar pregunta:', error);
      alert('Error al actualizar la pregunta: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCancelarEdicionPregunta = () => {
    setPreguntaTexto(pregunta.texto);
    setEditandoPregunta(false);
  };

  const handleEditarRespuesta = (respuesta) => {
    setEditandoRespuesta(respuesta.id);
    setTextoEditado(respuesta.texto);
    setEsCorrectaEditada(respuesta.es_correcta === 1 || respuesta.es_correcta === true);
  };

  const handleToggleCorrecta = async (respuestaId, esCorrectaActual) => {
    setUpdating(respuestaId);
    try {
      const response = await axios.put(`${API_BASE_URL}/respuestas/${respuestaId}/correcta`, {
        es_correcta: !esCorrectaActual
      });
      
      if (response.data.success) {
        // Actualizar el estado local
        setRespuestas(prevRespuestas => 
          prevRespuestas.map(r => ({
            ...r,
            es_correcta: r.id === respuestaId ? (!esCorrectaActual ? 1 : 0) : (r.id === respuestaId ? 0 : r.es_correcta)
          }))
        );
        // Si se marcó como correcta, desmarcar las demás
        if (!esCorrectaActual) {
          setRespuestas(prevRespuestas => 
            prevRespuestas.map(r => ({
              ...r,
              es_correcta: r.id === respuestaId ? 1 : 0
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error al cambiar estado de respuesta:', error);
      alert('Error al actualizar la respuesta');
    } finally {
      setUpdating(null);
    }
  };

  const handleGuardarRespuesta = async (respuestaId, nuevaEsCorrecta) => {
    setUpdating(respuestaId);
    try {
      console.log('Guardando respuesta:', { respuestaId, textoEditado, nuevaEsCorrecta });
      
      // Primero guardar el texto
      const responseTexto = await axios.put(`${API_BASE_URL}/respuestas/${respuestaId}`, {
        texto: textoEditado
      });
      
      console.log('Respuesta texto:', responseTexto.data);
      
      if (!responseTexto.data || !responseTexto.data.success) {
        const errorMsg = responseTexto.data?.error || 'No se pudo actualizar el texto de la respuesta';
        console.error('Error al guardar texto:', errorMsg);
        alert('Error: ' + errorMsg);
        setUpdating(null);
        return;
      }

      // Obtener el estado original antes de actualizar
      const respuestaOriginal = respuestas.find(r => r.id === respuestaId);
      const esCorrectaOriginal = respuestaOriginal?.es_correcta === 1 || respuestaOriginal?.es_correcta === true;
      
      console.log('Estado correcta:', { original: esCorrectaOriginal, nueva: nuevaEsCorrecta });
      
      // Actualizar el estado de correcta (siempre, para asegurar sincronización)
      const responseCorrecta = await axios.put(`${API_BASE_URL}/respuestas/${respuestaId}/correcta`, {
        es_correcta: nuevaEsCorrecta
      });
      
      console.log('Respuesta correcta:', responseCorrecta.data);
      
      if (!responseCorrecta.data || !responseCorrecta.data.success) {
        const errorMsg = responseCorrecta.data?.error || 'No se pudo actualizar el estado de la respuesta';
        console.error('Error al guardar estado correcta:', errorMsg);
        alert('Error: ' + errorMsg);
        setUpdating(null);
        return;
      }

      // Actualizar el estado local después de guardar exitosamente
      setRespuestas(prevRespuestas =>
        prevRespuestas.map(r => {
          if (r.id === respuestaId) {
            return { ...r, texto: textoEditado, es_correcta: nuevaEsCorrecta ? 1 : 0 };
          }
          // Si se marcó como correcta, desmarcar las demás
          if (nuevaEsCorrecta) {
            return { ...r, es_correcta: 0 };
          }
          return r;
        })
      );
      
      setEditandoRespuesta(null);
      setTextoEditado('');
      setEsCorrectaEditada(false);
      alert('✅ Respuesta actualizada correctamente');
    } catch (error) {
      console.error('Error completo al actualizar respuesta:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      alert('❌ Error al actualizar la respuesta: ' + errorMsg);
    } finally {
      setUpdating(null);
    }
  };

  const handleCancelarEdicionRespuesta = () => {
    setEditandoRespuesta(null);
    setTextoEditado('');
    setEsCorrectaEditada(false);
  };

  const handleEliminarPregunta = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta pregunta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/preguntas/${pregunta.id}`);
      if (response.data.success) {
        alert('Pregunta eliminada exitosamente');
        if (onDelete) {
          onDelete(pregunta.id);
        }
        onBack();
      }
    } catch (error) {
      console.error('Error al eliminar pregunta:', error);
      alert('Error al eliminar la pregunta: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAgregarRespuesta = async () => {
    if (!nuevaRespuesta.opcion.trim() || !nuevaRespuesta.texto.trim()) {
      alert('Por favor completa la opción y el texto de la respuesta');
      return;
    }

    setUpdating('agregando');
    try {
      const response = await axios.post(`${API_BASE_URL}/preguntas/${pregunta.id}/respuestas`, {
        opcion: nuevaRespuesta.opcion.trim(),
        texto: nuevaRespuesta.texto.trim()
      });

      if (response.data.success) {
        // Agregar la nueva respuesta al estado
        const nuevaRespuestaObj = {
          id: response.data.id,
          pregunta_id: pregunta.id,
          opcion: nuevaRespuesta.opcion.trim(),
          texto: nuevaRespuesta.texto.trim(),
          es_correcta: 0
        };
        setRespuestas([...respuestas, nuevaRespuestaObj]);
        setNuevaRespuesta({ opcion: '', texto: '' });
        setAgregandoRespuesta(false);
        alert('Respuesta agregada exitosamente');
      }
    } catch (error) {
      console.error('Error al agregar respuesta:', error);
      alert('Error al agregar la respuesta: ' + (error.response?.data?.error || error.message));
    } finally {
      setUpdating(null);
    }
  };

  const handleEliminarRespuesta = async (respuestaId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta respuesta?')) {
      return;
    }

    setUpdating(respuestaId);
    try {
      const response = await axios.delete(`${API_BASE_URL}/respuestas/${respuestaId}`);
      if (response.data.success) {
        setRespuestas(respuestas.filter(r => r.id !== respuestaId));
        alert('Respuesta eliminada exitosamente');
      }
    } catch (error) {
      console.error('Error al eliminar respuesta:', error);
      alert('Error al eliminar la respuesta: ' + (error.response?.data?.error || error.message));
    } finally {
      setUpdating(null);
    }
  };

  // Obtener la siguiente letra disponible para nueva respuesta
  const getSiguienteOpcion = () => {
    const opcionesUsadas = respuestas.map(r => r.opcion.toUpperCase());
    const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (const letra of letras) {
      if (!opcionesUsadas.includes(letra)) {
        return letra;
      }
    }
    return String.fromCharCode(65 + respuestas.length); // Si se agotan las letras, usar siguiente
  };

  return (
    <div className="pregunta-detail">
      <button className="back-button" onClick={onBack}>
        ← Volver a la lista
      </button>

      <div className="pregunta-detail-content">
        <div className="pregunta-detail-header">
          <h2>Pregunta {pregunta.numero}</h2>
          <div className="pregunta-actions">
            <button className="btn-editar" onClick={handleEditarPregunta}>
              ✏️ Editar pregunta
            </button>
            <button className="btn-eliminar" onClick={handleEliminarPregunta}>
              🗑️ Eliminar pregunta
            </button>
          </div>
        </div>

        {editandoPregunta ? (
          <div className="pregunta-edicion">
            <textarea
              className="textarea-edicion"
              value={preguntaTexto}
              onChange={(e) => setPreguntaTexto(e.target.value)}
              rows="4"
            />
            <div className="botones-edicion">
              <button className="btn-guardar" onClick={handleGuardarPregunta}>
                💾 Guardar
              </button>
              <button className="btn-cancelar" onClick={handleCancelarEdicionPregunta}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="pregunta-detail-texto">
            {preguntaTexto}
          </div>
        )}

        {respuestas && respuestas.some(r => r.es_correcta === 1 || r.es_correcta === true) && (
          <div className="indicador-respuesta-correcta">
            ✓ Esta pregunta tiene respuesta correcta marcada
          </div>
        )}

        <div className="pregunta-respuestas">
          <div className="respuestas-header">
            <h3>Opciones de respuesta:</h3>
            <button 
              className="btn-agregar-respuesta" 
              onClick={() => {
                setAgregandoRespuesta(true);
                setNuevaRespuesta({ opcion: getSiguienteOpcion(), texto: '' });
              }}
              disabled={agregandoRespuesta}
            >
              ➕ Agregar opción
            </button>
          </div>

          {agregandoRespuesta && (
            <div className="nueva-respuesta-form">
              <div className="nueva-respuesta-inputs">
                <input
                  type="text"
                  className="input-opcion"
                  value={nuevaRespuesta.opcion}
                  onChange={(e) => setNuevaRespuesta({ ...nuevaRespuesta, opcion: e.target.value.toUpperCase() })}
                  placeholder="Opción (A, B, C...)"
                  maxLength="1"
                  style={{ width: '60px', textAlign: 'center' }}
                />
                <textarea
                  className="textarea-respuesta"
                  value={nuevaRespuesta.texto}
                  onChange={(e) => setNuevaRespuesta({ ...nuevaRespuesta, texto: e.target.value })}
                  rows="2"
                  placeholder="Texto de la respuesta..."
                />
              </div>
              <div className="botones-nueva-respuesta">
                <button 
                  className="btn-guardar-small" 
                  onClick={handleAgregarRespuesta}
                  disabled={updating === 'agregando' || !nuevaRespuesta.opcion.trim() || !nuevaRespuesta.texto.trim()}
                >
                  {updating === 'agregando' ? '⏳ Agregando...' : '💾 Agregar'}
                </button>
                <button 
                  className="btn-cancelar-small" 
                  onClick={() => {
                    setAgregandoRespuesta(false);
                    setNuevaRespuesta({ opcion: '', texto: '' });
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}

          {respuestas && respuestas.length > 0 ? (
            <div className="respuestas-list">
              {respuestas.map((respuesta) => {
                const esCorrecta = respuesta.es_correcta === 1 || respuesta.es_correcta === true;
                return (
                  <div 
                    key={respuesta.id} 
                    className={`respuesta-item ${esCorrecta ? 'respuesta-correcta' : 'respuesta-incorrecta'}`}
                  >
                    <div className="respuesta-content">
                      <span className="respuesta-opcion">{respuesta.opcion})</span>
                      {editandoRespuesta === respuesta.id ? (
                        <div className="respuesta-edicion-completa">
                          <textarea
                            className="textarea-respuesta"
                            value={textoEditado}
                            onChange={(e) => setTextoEditado(e.target.value)}
                            rows="2"
                            placeholder="Texto de la respuesta..."
                          />
                          <div className="respuesta-edicion-opciones">
                            <label className="checkbox-correcta">
                              <input
                                type="checkbox"
                                checked={esCorrectaEditada}
                                onChange={(e) => {
                                  setEsCorrectaEditada(e.target.checked);
                                }}
                              />
                              <span>Marcar como respuesta correcta</span>
                            </label>
                          </div>
                          <div className="botones-edicion-respuesta">
                            <button 
                              className="btn-guardar-small" 
                              onClick={async () => {
                                if (updating === respuesta.id) return; // Evitar múltiples clicks
                                await handleGuardarRespuesta(respuesta.id, esCorrectaEditada);
                              }}
                              disabled={updating === respuesta.id || !textoEditado.trim()}
                            >
                              {updating === respuesta.id ? '⏳ Guardando...' : '💾 Guardar'}
                            </button>
                            <button 
                              className="btn-cancelar-small" 
                              onClick={handleCancelarEdicionRespuesta}
                            >
                              ❌ Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className={`respuesta-texto ${esCorrecta ? 'texto-correcta' : ''}`}>
                          {respuesta.texto}
                          {esCorrecta && <span className="indicador-correcta-en-texto"> ✓ CORRECTA</span>}
                        </span>
                      )}
                    </div>
                    <div className="respuesta-status">
                      {esCorrecta ? (
                        <span className="badge-correcta">✓ Correcta</span>
                      ) : (
                        <span className="badge-incorrecta">✗ Incorrecta</span>
                      )}
                      <button
                        className="btn-editar-respuesta"
                        onClick={() => handleEditarRespuesta(respuesta)}
                        disabled={editandoRespuesta === respuesta.id}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className={`btn-toggle-correcta ${esCorrecta ? 'btn-desmarcar' : 'btn-marcar'}`}
                        onClick={() => handleToggleCorrecta(respuesta.id, esCorrecta)}
                        disabled={updating === respuesta.id}
                      >
                        {updating === respuesta.id 
                          ? 'Actualizando...' 
                          : esCorrecta 
                            ? '✗ Desmarcar como correcta' 
                            : '✓ Marcar como correcta'}
                      </button>
                      <button
                        className="btn-eliminar-respuesta"
                        onClick={() => handleEliminarRespuesta(respuesta.id)}
                        disabled={updating === respuesta.id}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-respuestas">
              <p>Esta pregunta no tiene respuestas disponibles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PreguntaDetail;

