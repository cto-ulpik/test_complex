import React from 'react';
import './TestResults.css';

// Componente para resultados de práctica instantánea
function InstantResults({ results, onRestart, onBack }) {
  const { stats, tiempoTotal, config, totalPreguntas } = results;
  const porcentaje = totalPreguntas > 0 ? Math.round((stats.correctas / totalPreguntas) * 100) : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGrade = () => {
    if (porcentaje >= 90) return { 
      text: 'Excelente', 
      color: '#28a745',
      message: '¡Increíble! 🎉 Has demostrado un dominio excepcional del tema. Sigue así, estás en el camino correcto para alcanzar tus metas académicas.',
      emoji: '🌟'
    };
    if (porcentaje >= 70) return { 
      text: 'Bueno', 
      color: '#17a2b8',
      message: '¡Bien hecho! 👍 Tienes una base sólida. Con un poco más de práctica podrás alcanzar la excelencia. ¡Sigue estudiando y mejorando!',
      emoji: '💪'
    };
    if (porcentaje >= 50) return { 
      text: 'Regular', 
      color: '#ffc107',
      message: 'Estás en el camino correcto. 📚 Cada error es una oportunidad de aprendizaje. Revisa los temas y vuelve a intentarlo. ¡Tú puedes mejorar!',
      emoji: '📖'
    };
    return { 
      text: 'Necesitas mejorar', 
      color: '#dc3545',
      message: 'No te desanimes. 💪 Cada gran experto fue alguna vez un principiante. Revisa los temas, estudia con dedicación y vuelve a intentarlo. ¡El esfuerzo siempre vale la pena!',
      emoji: '🚀'
    };
  };

  const grade = getGrade();

  return (
    <div className="test-results">
      <div className="results-header">
        <h2>📊 Resultados de la Práctica Instantánea</h2>
        <div className="results-summary">
          <div className="summary-card">
            <div className="summary-value" style={{ color: '#28a745' }}>
              {stats.correctas}/{totalPreguntas}
            </div>
            <div className="summary-label">Correctas</div>
          </div>
          <div className="summary-card">
            <div className="summary-value" style={{ color: '#dc3545' }}>
              {stats.incorrectas}/{totalPreguntas}
            </div>
            <div className="summary-label">Incorrectas</div>
          </div>
          <div className="summary-card">
            <div className="summary-value" style={{ color: grade.color }}>
              {porcentaje}%
            </div>
            <div className="summary-label">Porcentaje</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{formatTime(tiempoTotal)}</div>
            <div className="summary-label">Tiempo</div>
          </div>
        </div>
        <div className="grade-badge" style={{ backgroundColor: grade.color }}>
          <span className="grade-emoji">{grade.emoji}</span>
          {grade.text}
        </div>
        
        <div className="motivational-message" style={{ borderColor: grade.color }}>
          <div className="message-icon">{grade.emoji}</div>
          <p className="message-text">{grade.message}</p>
        </div>
      </div>

      <div className="results-actions">
        <button className="btn-restart" onClick={onRestart}>
          🔄 Hacer otro test
        </button>
        <button className="btn-back" onClick={onBack}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

function TestResults({ results, onRestart, onBack }) {
  if (!results) {
    return (
      <div className="test-results">
        <p>No hay resultados para mostrar.</p>
        <button onClick={onBack}>Volver</button>
      </div>
    );
  }

  // Verificar si es práctica instantánea (tiene stats en lugar de preguntas/respuestas)
  if (results.stats) {
    return <InstantResults results={results} onRestart={onRestart} onBack={onBack} />;
  }

  const { preguntas, respuestas, tiempoTotal, config } = results;
  
  // Calcular puntaje
  let correctas = 0;
  const detalles = preguntas.map(pregunta => {
    const respuestaSeleccionada = respuestas[pregunta.id];
    const respuestaCorrecta = pregunta.respuestas.find(r => r.es_correcta === 1 || r.es_correcta === true);
    const esCorrecta = respuestaSeleccionada === respuestaCorrecta?.id;
    
    if (esCorrecta) correctas++;
    
    return {
      pregunta,
      respuestaSeleccionada,
      respuestaCorrecta,
      esCorrecta
    };
  });

  const puntaje = correctas;
  const total = preguntas.length;
  const porcentaje = total > 0 ? Math.round((puntaje / total) * 100) : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGrade = () => {
    if (porcentaje >= 90) return { 
      text: 'Excelente', 
      color: '#28a745',
      message: '¡Increíble! 🎉 Has demostrado un dominio excepcional del tema. Sigue así, estás en el camino correcto para alcanzar tus metas académicas.',
      emoji: '🌟'
    };
    if (porcentaje >= 70) return { 
      text: 'Bueno', 
      color: '#17a2b8',
      message: '¡Bien hecho! 👍 Tienes una base sólida. Con un poco más de práctica podrás alcanzar la excelencia. ¡Sigue estudiando y mejorando!',
      emoji: '💪'
    };
    if (porcentaje >= 50) return { 
      text: 'Regular', 
      color: '#ffc107',
      message: 'Estás en el camino correcto. 📚 Cada error es una oportunidad de aprendizaje. Revisa los temas y vuelve a intentarlo. ¡Tú puedes mejorar!',
      emoji: '📖'
    };
    return { 
      text: 'Necesitas mejorar', 
      color: '#dc3545',
      message: 'No te desanimes. 💪 Cada gran experto fue alguna vez un principiante. Revisa los temas, estudia con dedicación y vuelve a intentarlo. ¡El esfuerzo siempre vale la pena!',
      emoji: '🚀'
    };
  };

  const grade = getGrade();

  return (
    <div className="test-results">
      <div className="results-header">
        <h2>📊 Resultados del Test</h2>
        <div className="results-summary">
          <div className="summary-card">
            <div className="summary-value" style={{ color: grade.color }}>
              {puntaje}/{total}
            </div>
            <div className="summary-label">Puntos</div>
          </div>
          <div className="summary-card">
            <div className="summary-value" style={{ color: grade.color }}>
              {porcentaje}%
            </div>
            <div className="summary-label">Porcentaje</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{formatTime(tiempoTotal)}</div>
            <div className="summary-label">Tiempo</div>
          </div>
        </div>
        <div className="grade-badge" style={{ backgroundColor: grade.color }}>
          <span className="grade-emoji">{grade.emoji}</span>
          {grade.text}
        </div>
        
        <div className="motivational-message" style={{ borderColor: grade.color }}>
          <div className="message-icon">{grade.emoji}</div>
          <p className="message-text">{grade.message}</p>
        </div>
      </div>

      <div className="results-details">
        <h3>Detalle de Respuestas</h3>
        <div className="answers-list">
          {detalles.map((detalle, index) => {
            const respuestaSeleccionadaObj = detalle.pregunta.respuestas.find(
              r => r.id === detalle.respuestaSeleccionada
            );
            
            return (
              <div 
                key={detalle.pregunta.id} 
                className={`answer-item ${detalle.esCorrecta ? 'correct' : 'incorrect'}`}
              >
                <div className="answer-header">
                  <span className="answer-number">Pregunta {index + 1}</span>
                  <span className={`answer-status ${detalle.esCorrecta ? 'correct' : 'incorrect'}`}>
                    {detalle.esCorrecta ? '✓ Correcta' : '✗ Incorrecta'}
                  </span>
                </div>
                <div className="answer-question">
                  <strong>{detalle.pregunta.texto}</strong>
                </div>
                <div className="answer-options">
                  <div className={`answer-option ${!detalle.esCorrecta && respuestaSeleccionadaObj?.id === respuestaSeleccionadaObj?.id ? 'selected-wrong' : ''}`}>
                    <strong>Tu respuesta:</strong> {
                      respuestaSeleccionadaObj 
                        ? `${respuestaSeleccionadaObj.opcion}) ${respuestaSeleccionadaObj.texto}`
                        : 'No respondida'
                    }
                  </div>
                  {!detalle.esCorrecta && (
                    <div className="answer-option correct-answer">
                      <strong>Respuesta correcta:</strong> {
                        detalle.respuestaCorrecta 
                          ? `${detalle.respuestaCorrecta.opcion}) ${detalle.respuestaCorrecta.texto}`
                          : 'No disponible'
                      }
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="results-actions">
        <button className="btn-restart" onClick={onRestart}>
          🔄 Hacer otro test
        </button>
        <button className="btn-back" onClick={onBack}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default TestResults;

