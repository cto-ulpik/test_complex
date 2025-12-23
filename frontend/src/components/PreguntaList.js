import React, { useState } from 'react';
import axios from 'axios';
import './PreguntaList.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

function PreguntaList({ preguntas, onSelect, materiaId, onPreguntaAdded, onPreguntaDeleted }) {
  const [respuestasReveladas, setRespuestasReveladas] = useState({});
  const [mostrarFormNuevaPregunta, setMostrarFormNuevaPregunta] = useState(false);
  const [nuevaPregunta, setNuevaPregunta] = useState({ texto: '' });
  const [creando, setCreando] = useState(false);

  const toggleRespuesta = (preguntaId, e) => {
    e.stopPropagation(); // Evitar que se active el onClick de la pregunta
    setRespuestasReveladas(prev => ({
      ...prev,
      [preguntaId]: !prev[preguntaId]
    }));
  };

  const getRespuestaCorrecta = (pregunta) => {
    if (!pregunta.respuestas) return null;
    const correcta = pregunta.respuestas.find(r => r.es_correcta === 1 || r.es_correcta === true);
    return correcta ? `${correcta.opcion}) ${correcta.texto}` : null;
  };

  const handleCrearPregunta = async () => {
    if (!nuevaPregunta.texto.trim()) {
      alert('Por favor ingresa el texto de la pregunta');
      return;
    }

    if (!materiaId) {
      alert('Error: No se pudo identificar la materia');
      return;
    }

    setCreando(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/preguntas`, {
        materia_id: materiaId,
        texto: nuevaPregunta.texto.trim()
      });

      if (response.data.success) {
        alert('Pregunta creada exitosamente');
        setNuevaPregunta({ texto: '' });
        setMostrarFormNuevaPregunta(false);
        if (onPreguntaAdded) {
          onPreguntaAdded();
        }
      }
    } catch (error) {
      console.error('Error al crear pregunta:', error);
      alert('Error al crear la pregunta: ' + (error.response?.data?.error || error.message));
    } finally {
      setCreando(false);
    }
  };

  if (preguntas.length === 0) {
    return (
      <div className="pregunta-list-empty">
        <p>No hay preguntas disponibles.</p>
      </div>
    );
  }

  return (
    <div className="pregunta-list">
      <div className="pregunta-list-header">
        <h2>Preguntas ({preguntas.length})</h2>
        <button 
          className="btn-agregar-pregunta" 
          onClick={() => setMostrarFormNuevaPregunta(true)}
          disabled={mostrarFormNuevaPregunta}
        >
          ➕ Agregar nueva pregunta
        </button>
      </div>

      {mostrarFormNuevaPregunta && (
        <div className="nueva-pregunta-form">
          <h3>Nueva Pregunta</h3>
          <textarea
            className="textarea-nueva-pregunta"
            value={nuevaPregunta.texto}
            onChange={(e) => setNuevaPregunta({ texto: e.target.value })}
            rows="4"
            placeholder="Ingresa el texto de la pregunta..."
          />
          <div className="botones-nueva-pregunta">
            <button 
              className="btn-guardar" 
              onClick={handleCrearPregunta}
              disabled={creando || !nuevaPregunta.texto.trim()}
            >
              {creando ? '⏳ Creando...' : '💾 Crear pregunta'}
            </button>
            <button 
              className="btn-cancelar" 
              onClick={() => {
                setMostrarFormNuevaPregunta(false);
                setNuevaPregunta({ texto: '' });
              }}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="pregunta-items">
        {preguntas.map((pregunta) => {
          const respuestaCorrecta = getRespuestaCorrecta(pregunta);
          const tieneRespuesta = respuestaCorrecta !== null;
          const estaRevelada = respuestasReveladas[pregunta.id];

          return (
            <div
              key={pregunta.id}
              className={`pregunta-item ${
                tieneRespuesta
                  ? 'pregunta-respondida'
                  : 'pregunta-pendiente'
              }`}
              onClick={() => onSelect(pregunta)}
            >
              <div className="pregunta-header">
                <span className="pregunta-numero">Pregunta {pregunta.numero}</span>
                <div className="pregunta-info">
                  {tieneRespuesta && (
                    <span className="pregunta-tiene-correcta">✓ Tiene respuesta correcta</span>
                  )}
                  {pregunta.respuestas && pregunta.respuestas.length > 0 && (
                    <span className="pregunta-respuestas-count">
                      {pregunta.respuestas.length} opciones
                    </span>
                  )}
                </div>
              </div>
              <div className="pregunta-texto">
                {pregunta.texto.length > 150
                  ? `${pregunta.texto.substring(0, 150)}...`
                  : pregunta.texto}
              </div>
              {tieneRespuesta && (
                <div 
                  className={`respuesta-oculta ${estaRevelada ? 'respuesta-revelada' : ''}`}
                  onClick={(e) => toggleRespuesta(pregunta.id, e)}
                >
                  <div className="respuesta-oculta-header">
                    <span className="respuesta-oculta-indicador">
                      {estaRevelada ? '👁️ Ocultar respuesta' : '👁️‍🗨️ Mostrar respuesta'}
                    </span>
                  </div>
                  {estaRevelada && (
                    <div className="respuesta-oculta-contenido">
                      <strong>Respuesta correcta:</strong> {respuestaCorrecta}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PreguntaList;

