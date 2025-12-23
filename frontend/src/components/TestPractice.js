import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TestPractice.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

// Componente para mostrar indicadores de preguntas con paginación
function QuestionIndicators({ total, current, answered, onSelect, preguntas }) {
  const MAX_VISIBLE = 5;
  
  // Función helper para verificar si una pregunta está respondida
  const isAnswered = (index) => {
    if (!preguntas || index >= preguntas.length) return false;
    return answered[preguntas[index].id] !== undefined;
  };
  
  // Si hay 10 o menos preguntas, mostrar todas
  if (total <= 10) {
    return (
      <div className="question-indicators">
        {Array.from({ length: total }, (_, idx) => (
          <span
            key={idx}
            className={`indicator ${idx === current ? 'current' : ''} ${isAnswered(idx) ? 'answered' : ''}`}
            onClick={() => onSelect(idx)}
            title={`Pregunta ${idx + 1}`}
          >
            {idx + 1}
          </span>
        ))}
      </div>
    );
  }
  
  // Calcular qué indicadores mostrar
  const getVisibleIndicators = () => {
    const indicators = [];
    const half = Math.floor(MAX_VISIBLE / 2);
    
    let start = Math.max(0, current - half);
    let end = Math.min(total - 1, start + MAX_VISIBLE - 1);
    
    // Ajustar si estamos cerca del final
    if (end - start < MAX_VISIBLE - 1) {
      start = Math.max(0, end - MAX_VISIBLE + 1);
    }
    
    // Agregar primer indicador si no está visible
    if (start > 0) {
      indicators.push({ index: 0, type: 'number' });
      if (start > 1) {
        indicators.push({ index: -1, type: 'ellipsis' });
      }
    }
    
    // Agregar indicadores visibles
    for (let i = start; i <= end; i++) {
      indicators.push({ index: i, type: 'number' });
    }
    
    // Agregar último indicador si no está visible
    if (end < total - 1) {
      if (end < total - 2) {
        indicators.push({ index: -1, type: 'ellipsis' });
      }
      indicators.push({ index: total - 1, type: 'number' });
    }
    
    return indicators;
  };
  
  const indicators = getVisibleIndicators();
  
  return (
    <div className="question-indicators-paginated">
      <button
        className="indicator-nav indicator-nav-prev"
        onClick={() => onSelect(Math.max(0, current - 1))}
        disabled={current === 0}
        title="Pregunta anterior"
      >
        ‹
      </button>
      
      <div className="question-indicators">
        {indicators.map((item, idx) => {
          if (item.type === 'ellipsis') {
            return (
              <span key={`ellipsis-${idx}`} className="indicator-ellipsis">
                ...
              </span>
            );
          }
          
          const isCurrent = item.index === current;
          const answeredStatus = isAnswered(item.index);
          
          return (
            <span
              key={item.index}
              className={`indicator ${isCurrent ? 'current' : ''} ${answeredStatus ? 'answered' : ''}`}
              onClick={() => onSelect(item.index)}
              title={`Pregunta ${item.index + 1}`}
            >
              {item.index + 1}
            </span>
          );
        })}
      </div>
      
      <button
        className="indicator-nav indicator-nav-next"
        onClick={() => onSelect(Math.min(total - 1, current + 1))}
        disabled={current === total - 1}
        title="Siguiente pregunta"
      >
        ›
      </button>
    </div>
  );
}

function TestPractice({ config, onFinish }) {
  const [preguntas, setPreguntas] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeStarted, setTimeStarted] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    fetchPreguntas();
    setTimeStarted(Date.now());
    
    // Timer
    const interval = setInterval(() => {
      if (timeStarted) {
        setTimeElapsed(Math.floor((Date.now() - timeStarted) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeStarted) {
      const interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - timeStarted) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeStarted]);

  // Función para aleatorizar un array (Fisher-Yates shuffle)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchPreguntas = async () => {
    try {
      const url = config.materiaId 
        ? `${API_BASE_URL}/materias/${config.materiaId}/preguntas-aleatorias?cantidad=${config.cantidad}`
        : `${API_BASE_URL}/preguntas-aleatorias?cantidad=${config.cantidad}`;
      
      const response = await axios.get(url);
      // Aleatorizar las respuestas de cada pregunta
      const preguntasConRespuestasAleatorias = response.data.map(pregunta => ({
        ...pregunta,
        respuestas: shuffleArray(pregunta.respuestas || [])
      }));
      setPreguntas(preguntasConRespuestasAleatorias);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar preguntas:', error);
      alert('Error al cargar las preguntas');
      setLoading(false);
    }
  };

  const handleSelectAnswer = (preguntaId, respuestaId) => {
    setRespuestas({
      ...respuestas,
      [preguntaId]: respuestaId
    });
  };

  const handleNext = () => {
    if (currentIndex < preguntas.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinish = () => {
    if (window.confirm('¿Estás seguro de que quieres finalizar el test?')) {
      const tiempoTotal = Math.floor((Date.now() - timeStarted) / 1000);
      onFinish({
        preguntas,
        respuestas,
        tiempoTotal,
        config
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="test-loading">Cargando preguntas...</div>;
  }

  if (preguntas.length === 0) {
    return (
      <div className="test-error">
        <p>No se encontraron preguntas con respuesta correcta para esta configuración.</p>
        <button onClick={() => onFinish(null)}>Volver</button>
      </div>
    );
  }

  const currentPregunta = preguntas[currentIndex];
  const respuestaSeleccionada = respuestas[currentPregunta.id];
  const progreso = ((currentIndex + 1) / preguntas.length) * 100;
  const respuestasCompletadas = Object.keys(respuestas).length;

  return (
    <div className="test-practice">
      <div className="test-header">
        <div className="test-info-bar">
          <span className="test-title">{config.materiaNombre}</span>
          <span className="test-timer">⏱️ {formatTime(timeElapsed)}</span>
        </div>
        <div className="test-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progreso}%` }}></div>
          </div>
          <span className="progress-text">
            Pregunta {currentIndex + 1} de {preguntas.length} 
            ({respuestasCompletadas} respondidas)
          </span>
        </div>
      </div>

      <div className="test-question-container">
        <div className="test-question">
          <h3>Pregunta {currentIndex + 1}</h3>
          <p className="question-text">{currentPregunta.texto}</p>
        </div>

        <div className="test-options">
          <h4>Selecciona tu respuesta:</h4>
          {currentPregunta.respuestas.map((respuesta) => (
            <label 
              key={respuesta.id} 
              className={`option-label ${respuestaSeleccionada === respuesta.id ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name={`pregunta-${currentPregunta.id}`}
                value={respuesta.id}
                checked={respuestaSeleccionada === respuesta.id}
                onChange={() => handleSelectAnswer(currentPregunta.id, respuesta.id)}
              />
              <span className="option-text">{respuesta.texto}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="test-navigation">
        <button 
          className="btn-nav" 
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          ← Anterior
        </button>
        
        <QuestionIndicators
          total={preguntas.length}
          current={currentIndex}
          answered={respuestas}
          preguntas={preguntas}
          onSelect={setCurrentIndex}
        />

        {currentIndex < preguntas.length - 1 ? (
          <button 
            className="btn-nav" 
            onClick={handleNext}
          >
            Siguiente →
          </button>
        ) : (
          <button 
            className="btn-finish" 
            onClick={handleFinish}
          >
            ✅ Finalizar Test
          </button>
        )}
      </div>
    </div>
  );
}

export default TestPractice;

