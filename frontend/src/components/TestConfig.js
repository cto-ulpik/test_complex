import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TestConfig.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

function TestConfig({ onStartTest }) {
  const [materias, setMaterias] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState('todas');
  const [cantidadPreguntas, setCantidadPreguntas] = useState(10);
  const [modoPractica, setModoPractica] = useState('normal'); // 'normal' o 'instantanea'
  const [loading, setLoading] = useState(true);
  const [totalDisponibles, setTotalDisponibles] = useState(0);

  useEffect(() => {
    fetchMaterias();
  }, []);

  useEffect(() => {
    if (selectedMateria && selectedMateria !== 'todas') {
      fetchTotalDisponibles(selectedMateria);
    } else {
      fetchTotalDisponiblesTodas();
    }
  }, [selectedMateria]);

  // Cargar total inicial cuando se cargan las materias
  useEffect(() => {
    if (materias.length > 0 && !loading) {
      fetchTotalDisponiblesTodas();
    }
  }, [materias, loading]);

  const fetchMaterias = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/materias`);
      setMaterias(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar materias:', error);
      setLoading(false);
    }
  };

  const fetchTotalDisponibles = async (materiaId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/materias/${materiaId}/preguntas-con-respuesta`);
      setTotalDisponibles(response.data.total || 0);
    } catch (error) {
      console.error('Error al obtener total:', error);
      setTotalDisponibles(0);
    }
  };

  const fetchTotalDisponiblesTodas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/preguntas-con-respuesta/total`);
      setTotalDisponibles(response.data.total || 0);
    } catch (error) {
      console.error('Error al obtener total:', error);
      setTotalDisponibles(0);
    }
  };

  const handleStart = () => {
    const maxDisponible = cantidadPreguntas === 'todas' ? totalDisponibles : cantidadPreguntas;
    if (maxDisponible === 0) {
      alert('No hay preguntas disponibles con respuesta correcta para esta configuración');
      return;
    }
    onStartTest({
      materiaId: selectedMateria === 'todas' ? null : selectedMateria,
      cantidad: cantidadPreguntas === 'todas' ? totalDisponibles : cantidadPreguntas,
      materiaNombre: selectedMateria === 'todas' ? 'Todas las materias' : materias.find(m => m.id === parseInt(selectedMateria))?.nombre,
      modo: modoPractica
    });
  };

  const getMaxDisponible = () => {
    if (cantidadPreguntas === 'todas') return totalDisponibles;
    return Math.min(cantidadPreguntas, totalDisponibles);
  };

  if (loading) {
    return <div className="test-config-loading">Cargando...</div>;
  }

  return (
    <div className="test-config">
      <h2>📝 Configurar Práctica</h2>
      
      <div className="config-section">
        <label>
          <strong>Materia:</strong>
          <select 
            value={selectedMateria} 
            onChange={(e) => setSelectedMateria(e.target.value)}
          >
            <option value="todas">Todas las materias (Test General)</option>
            {materias.map(materia => (
              <option key={materia.id} value={materia.id}>
                {materia.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="config-section">
        <label>
          <strong>Modo de práctica:</strong>
          <select 
            value={modoPractica} 
            onChange={(e) => setModoPractica(e.target.value)}
          >
            <option value="normal">Práctica Normal (ver resultados al final)</option>
            <option value="instantanea">Práctica Instantánea (feedback inmediato)</option>
          </select>
        </label>
        <p className="info-text">
          {modoPractica === 'normal' 
            ? 'Verás tus resultados y respuestas correctas al finalizar el test.'
            : 'Sabrás inmediatamente si tu respuesta es correcta o incorrecta.'}
        </p>
      </div>

      <div className="config-section">
        <label>
          <strong>Cantidad de preguntas:</strong>
          <select 
            value={cantidadPreguntas} 
            onChange={(e) => setCantidadPreguntas(e.target.value === 'todas' ? 'todas' : parseInt(e.target.value))}
          >
            <option value={10}>10 preguntas</option>
            <option value={20}>20 preguntas</option>
            <option value="todas">Todas las disponibles ({totalDisponibles > 0 ? totalDisponibles : 'cargando...'})</option>
          </select>
        </label>
        <p className="info-text">
          Preguntas disponibles con respuesta correcta: <strong>{totalDisponibles > 0 ? totalDisponibles : 'Cargando...'}</strong>
        </p>
        {totalDisponibles > 0 && (
          <p className="info-text" style={{ color: '#28a745', fontWeight: 'bold' }}>
            ✓ {totalDisponibles} preguntas listas para practicar
          </p>
        )}
      </div>

      <div className="config-actions">
        <button 
          className="btn-start-test" 
          onClick={handleStart}
          disabled={totalDisponibles === 0}
        >
          🚀 Iniciar Práctica
        </button>
        {totalDisponibles === 0 && (
          <p className="error-text">
            No hay preguntas disponibles con respuesta correcta para esta configuración
          </p>
        )}
      </div>

      <div className="test-info">
        <h3>ℹ️ Información</h3>
        <ul>
          <li>Se usarán solo preguntas que tengan respuesta correcta marcada</li>
          <li>Las preguntas se seleccionan aleatoriamente</li>
          <li>Cada respuesta correcta vale 1 punto</li>
          <li>Puedes ver tu puntaje al finalizar</li>
        </ul>
      </div>
    </div>
  );
}

export default TestConfig;

