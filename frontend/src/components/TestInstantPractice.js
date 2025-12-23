import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TestInstantPractice.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

function TestInstantPractice({ config, onFinish }) {
  const [preguntas, setPreguntas] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeStarted, setTimeStarted] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [stats, setStats] = useState({ correctas: 0, incorrectas: 0, total: 0 });

  useEffect(() => {
    fetchPreguntas();
    setTimeStarted(Date.now());
    
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

  const handleSelectAnswer = (respuestaId) => {
    if (showFeedback) return; // No permitir cambiar respuesta después de mostrar feedback
    
    const currentPregunta = preguntas[currentIndex];
    const respuestaCorrecta = currentPregunta.respuestas.find(r => r.es_correcta === 1 || r.es_correcta === true);
    const correct = respuestaId === respuestaCorrecta?.id;
    
    setSelectedAnswer(respuestaId);
    setIsCorrect(correct);
    setShowFeedback(true);
    
    // Actualizar estadísticas
    setStats(prev => ({
      correctas: correct ? prev.correctas + 1 : prev.correctas,
      incorrectas: !correct ? prev.incorrectas + 1 : prev.incorrectas,
      total: prev.total + 1
    }));
  };

  const handleNext = () => {
    if (currentIndex < preguntas.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setIsCorrect(false);
    } else {
      // Última pregunta completada
      handleFinish();
    }
  };

  const handleFinish = () => {
    const tiempoTotal = Math.floor((Date.now() - timeStarted) / 1000);
    onFinish({
      stats,
      tiempoTotal,
      config,
      totalPreguntas: preguntas.length
    });
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
  const progreso = ((currentIndex + 1) / preguntas.length) * 100;
  const porcentajeCorrecto = stats.total > 0 ? Math.round((stats.correctas / stats.total) * 100) : 0;

  return (
    <div className="test-instant-practice">
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
          </span>
        </div>
        <div className="instant-stats">
          <div className="stat-item">
            <span className="stat-label">Correctas:</span>
            <span className="stat-value correct-stat">{stats.correctas}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Incorrectas:</span>
            <span className="stat-value incorrect-stat">{stats.incorrectas}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Acierto:</span>
            <span className="stat-value percentage-stat">{porcentajeCorrecto}%</span>
          </div>
        </div>
      </div>

      <div className="test-question-container">
        <div className="test-question">
          <h3>Pregunta {currentIndex + 1}</h3>
          <p className="question-text">{currentPregunta.texto}</p>
        </div>

        <div className="test-options">
          <h4>Selecciona tu respuesta:</h4>
          {currentPregunta.respuestas.map((respuesta) => {
            const isSelected = selectedAnswer === respuesta.id;
            const showCorrect = showFeedback && (respuesta.es_correcta === 1 || respuesta.es_correcta === true);
            const showIncorrect = showFeedback && isSelected && !isCorrect;
            
            return (
              <label 
                key={respuesta.id} 
                className={`option-label ${isSelected ? 'selected' : ''} ${showCorrect ? 'correct-answer' : ''} ${showIncorrect ? 'incorrect-answer' : ''} ${showFeedback ? 'disabled' : ''}`}
              >
                <input
                  type="radio"
                  name={`pregunta-${currentPregunta.id}`}
                  value={respuesta.id}
                  checked={isSelected}
                  onChange={() => handleSelectAnswer(respuesta.id)}
                  disabled={showFeedback}
                />
                <span className="option-text">{respuesta.texto}</span>
                {showCorrect && <span className="feedback-icon correct-icon">✓ Correcta</span>}
                {showIncorrect && <span className="feedback-icon incorrect-icon">✗ Incorrecta</span>}
              </label>
            );
          })}
        </div>

        {showFeedback && (
          <div className={`feedback-message ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}>
            <div className="feedback-content">
              <span className="feedback-emoji">{isCorrect ? '🎉' : '😔'}</span>
              <div className="feedback-text">
                <h4>{isCorrect ? '¡Correcto!' : 'Incorrecto'}</h4>
                <p>
                  {isCorrect 
                    ? 'Excelente, has respondido correctamente. ¡Sigue así!' 
                    : 'No te preocupes, sigue practicando y mejorarás.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="test-navigation">
        <button 
          className="btn-next" 
          onClick={handleNext}
          disabled={!showFeedback}
        >
          {currentIndex < preguntas.length - 1 ? 'Siguiente Pregunta →' : 'Finalizar Práctica ✅'}
        </button>
      </div>
    </div>
  );
}

export default TestInstantPractice;

