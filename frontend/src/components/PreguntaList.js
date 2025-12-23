import React, { useState } from 'react';
import './PreguntaList.css';

function PreguntaList({ preguntas, onSelect }) {
  const [respuestasReveladas, setRespuestasReveladas] = useState({});

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

  if (preguntas.length === 0) {
    return (
      <div className="pregunta-list-empty">
        <p>No hay preguntas disponibles.</p>
      </div>
    );
  }

  return (
    <div className="pregunta-list">
      <h2>Preguntas ({preguntas.length})</h2>
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

