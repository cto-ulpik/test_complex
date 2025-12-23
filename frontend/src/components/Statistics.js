import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Statistics.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

function Statistics({ onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [materiasStats, setMateriasStats] = useState([]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      // Obtener estadísticas generales
      const [generalRes, materiasRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/estadisticas`),
        axios.get(`${API_BASE_URL}/materias`)
      ]);

      setStats(generalRes.data);
      
      // Obtener estadísticas por materia
      const materiasPromises = materiasRes.data.map(async (materia) => {
        try {
          const [preguntasRes, marcadasRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/materias/${materia.id}/preguntas-completas`),
            axios.get(`${API_BASE_URL}/materias/${materia.id}/preguntas-con-respuesta`)
          ]);
          
          const totalPreguntas = preguntasRes.data.length;
          const marcadas = marcadasRes.data.total || 0;
          const inciertas = totalPreguntas - marcadas;
          
          return {
            ...materia,
            totalPreguntas,
            marcadas,
            inciertas,
            porcentajeMarcadas: totalPreguntas > 0 ? Math.round((marcadas / totalPreguntas) * 100) : 0
          };
        } catch (error) {
          console.error(`Error al obtener stats de ${materia.nombre}:`, error);
          return {
            ...materia,
            totalPreguntas: 0,
            marcadas: 0,
            inciertas: 0,
            porcentajeMarcadas: 0
          };
        }
      });

      const materiasData = await Promise.all(materiasPromises);
      setMateriasStats(materiasData);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="statistics">
        <div className="statistics-loading">Cargando estadísticas...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="statistics">
        <div className="statistics-error">
          <p>Error al cargar las estadísticas</p>
          <button onClick={onBack}>Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics">
      <div className="statistics-header">
        <h2>📊 Estadísticas del Banco de Preguntas</h2>
        <button className="btn-back-stats" onClick={onBack}>
          ← Volver
        </button>
      </div>

      <div className="stats-overview">
        <div className="stat-card total-materias">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{stats.totalMaterias}</div>
          <div className="stat-label">Materias</div>
        </div>

        <div className="stat-card total-preguntas">
          <div className="stat-icon">❓</div>
          <div className="stat-value">{stats.totalPreguntas}</div>
          <div className="stat-label">Total Preguntas</div>
        </div>

        <div className="stat-card preguntas-marcadas">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.preguntasMarcadas}</div>
          <div className="stat-label">Con Respuesta Correcta</div>
          <div className="stat-percentage">
            {stats.totalPreguntas > 0 
              ? Math.round((stats.preguntasMarcadas / stats.totalPreguntas) * 100) 
              : 0}%
          </div>
        </div>

        <div className="stat-card preguntas-inciertas">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{stats.preguntasInciertas}</div>
          <div className="stat-label">Sin Respuesta Correcta</div>
          <div className="stat-percentage">
            {stats.totalPreguntas > 0 
              ? Math.round((stats.preguntasInciertas / stats.totalPreguntas) * 100) 
              : 0}%
          </div>
        </div>
      </div>

      <div className="stats-by-materia">
        <h3>📋 Estadísticas por Materia</h3>
        <div className="materias-table">
          <div className="table-header">
            <div className="col-materia">Materia</div>
            <div className="col-total">Total</div>
            <div className="col-marcadas">Marcadas</div>
            <div className="col-inciertas">Inciertas</div>
            <div className="col-progreso">Progreso</div>
          </div>
          {materiasStats.map((materia) => (
            <div key={materia.id} className="table-row">
              <div className="col-materia">
                <strong>{materia.nombre}</strong>
              </div>
              <div className="col-total">
                <span className="badge badge-total">{materia.totalPreguntas}</span>
              </div>
              <div className="col-marcadas">
                <span className="badge badge-marcadas">{materia.marcadas}</span>
              </div>
              <div className="col-inciertas">
                <span className="badge badge-inciertas">{materia.inciertas}</span>
              </div>
              <div className="col-progreso">
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${materia.porcentajeMarcadas}%`,
                      backgroundColor: materia.porcentajeMarcadas === 100 
                        ? '#28a745' 
                        : materia.porcentajeMarcadas >= 50 
                        ? '#17a2b8' 
                        : '#ffc107'
                    }}
                  ></div>
                  <span className="progress-text">{materia.porcentajeMarcadas}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-summary">
        <h3>📈 Resumen</h3>
        <div className="summary-content">
          <p>
            <strong>Total de materias:</strong> {stats.totalMaterias}
          </p>
          <p>
            <strong>Total de preguntas:</strong> {stats.totalPreguntas}
          </p>
          <p>
            <strong>Preguntas con respuesta correcta:</strong> {stats.preguntasMarcadas} 
            ({stats.totalPreguntas > 0 ? Math.round((stats.preguntasMarcadas / stats.totalPreguntas) * 100) : 0}%)
          </p>
          <p>
            <strong>Preguntas sin respuesta correcta:</strong> {stats.preguntasInciertas} 
            ({stats.totalPreguntas > 0 ? Math.round((stats.preguntasInciertas / stats.totalPreguntas) * 100) : 0}%)
          </p>
        </div>
      </div>
    </div>
  );
}

export default Statistics;

