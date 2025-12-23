import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import MateriaList from './components/MateriaList';
import PreguntaList from './components/PreguntaList';
import PreguntaDetail from './components/PreguntaDetail';
import SearchBar from './components/SearchBar';
import TestConfig from './components/TestConfig';
import TestPractice from './components/TestPractice';
import TestInstantPractice from './components/TestInstantPractice';
import TestResults from './components/TestResults';
import Statistics from './components/Statistics';

// Usar ruta relativa en producción, localhost en desarrollo
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

function App() {
  const [materias, setMaterias] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [selectedPregunta, setSelectedPregunta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [testMode, setTestMode] = useState(null); // 'config', 'practice', 'results'
  const [testConfig, setTestConfig] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [showStatistics, setShowStatistics] = useState(false);

  useEffect(() => {
    fetchMaterias();
  }, []);

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

  const handleMateriaSelect = async (materiaId) => {
    setSelectedMateria(materiaId);
    setSelectedPregunta(null);
    setShowSearch(false);
    try {
      const response = await axios.get(`${API_BASE_URL}/materias/${materiaId}/preguntas-completas`);
      setPreguntas(response.data);
    } catch (error) {
      console.error('Error al cargar preguntas:', error);
    }
  };

  const handlePreguntaSelect = (pregunta) => {
    setSelectedPregunta(pregunta);
  };

  const handleSearch = async (query, soloSinRespuesta = false) => {
    // Si no hay query ni filtro activo, limpiar resultados
    if (!query.trim() && !soloSinRespuesta) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/buscar`, {
        params: { 
          q: query || '', // Permitir query vacío si el filtro está activo
          sinRespuesta: soloSinRespuesta ? '1' : '0'
        }
      });
      setSearchResults(response.data);
      setShowSearch(true);
    } catch (error) {
      console.error('Error en la búsqueda:', error);
    }
  };

  const handleBack = () => {
    setSelectedPregunta(null);
  };

  const handleBackToMaterias = () => {
    setSelectedMateria(null);
    setPreguntas([]);
    setSelectedPregunta(null);
    setShowSearch(false);
    setSearchResults([]);
    setTestMode(null);
    setTestConfig(null);
    setTestResults(null);
  };

  const handleStartTest = (config) => {
    setTestConfig(config);
    setTestMode('practice');
    setSelectedMateria(null);
    setSelectedPregunta(null);
    setShowSearch(false);
  };

  const handleTestFinish = (results) => {
    setTestResults(results);
    setTestMode('results');
  };

  const handleTestRestart = () => {
    setTestMode('config');
    setTestConfig(null);
    setTestResults(null);
  };

  const handleTestBack = () => {
    setTestMode(null);
    setTestConfig(null);
    setTestResults(null);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Banco de Preguntas</h1>
        <p>Examen Complexivo 2025-2026</p>
        <div className="header-actions">
          {!testMode && !showStatistics && (
            <>
              <button 
                className="btn-practice" 
                onClick={() => setTestMode('config')}
              >
                📝 Modo Práctica
              </button>
              <button 
                className="btn-statistics" 
                onClick={() => setShowStatistics(true)}
              >
                📊 Estadísticas
              </button>
            </>
          )}
          {(testMode || showStatistics) && (
            <button 
              className="btn-back-header" 
              onClick={() => {
                handleTestBack();
                setShowStatistics(false);
              }}
            >
              ← Volver al Banco
            </button>
          )}
        </div>
      </header>

      {testMode === 'config' && (
        <div className="app-container test-container">
          <TestConfig onStartTest={handleStartTest} />
        </div>
      )}

      {testMode === 'practice' && testConfig && (
        <div className="app-container test-container">
          {testConfig.modo === 'instantanea' ? (
            <TestInstantPractice 
              config={testConfig} 
              onFinish={handleTestFinish}
            />
          ) : (
            <TestPractice 
              config={testConfig} 
              onFinish={handleTestFinish}
            />
          )}
        </div>
      )}

      {testMode === 'results' && (
        <div className="app-container test-container">
          <TestResults 
            results={testResults}
            onRestart={handleTestRestart}
            onBack={handleTestBack}
          />
        </div>
      )}

      {showStatistics && (
        <div className="app-container test-container">
          <Statistics onBack={() => setShowStatistics(false)} />
        </div>
      )}

      {!testMode && !showStatistics && (
        <div className="app-container">
          <div className="sidebar">
            <SearchBar onSearch={handleSearch} />
          
          {!showSearch && (
            <>
              {selectedMateria ? (
                <button className="back-button" onClick={handleBackToMaterias}>
                  ← Volver a Materias
                </button>
              ) : (
                <MateriaList
                  materias={materias}
                  onSelect={handleMateriaSelect}
                />
              )}
            </>
          )}

          {showSearch && (
            <div className="search-results">
              <h3>Resultados de búsqueda ({searchResults.length})</h3>
              <button className="back-button" onClick={() => setShowSearch(false)}>
                ← Volver
              </button>
              {searchResults.map((pregunta) => (
                <div
                  key={pregunta.id}
                  className="search-result-item"
                  onClick={() => {
                    setSelectedPregunta(pregunta);
                    setShowSearch(false);
                    // Cargar la materia para mostrar el contexto
                    handleMateriaSelect(pregunta.materia_id);
                  }}
                >
                  <div className="search-materia">{pregunta.materia_nombre}</div>
                  <div className="search-pregunta">
                    Pregunta {pregunta.numero}: {pregunta.texto.substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="main-content">
          {selectedPregunta ? (
            <PreguntaDetail
              pregunta={selectedPregunta}
              onBack={handleBack}
              onDelete={async (preguntaId) => {
                // Recargar preguntas después de eliminar
                try {
                  const response = await axios.get(`${API_BASE_URL}/materias/${selectedMateria}/preguntas-completas`);
                  setPreguntas(response.data);
                } catch (error) {
                  console.error('Error al recargar preguntas:', error);
                }
              }}
              onUpdate={async () => {
                // Recargar la pregunta actualizada
                try {
                  const response = await axios.get(`${API_BASE_URL}/preguntas/${selectedPregunta.id}`);
                  setSelectedPregunta({ ...selectedPregunta, ...response.data });
                } catch (error) {
                  console.error('Error al recargar pregunta:', error);
                }
              }}
            />
          ) : selectedMateria ? (
            <PreguntaList
              preguntas={preguntas}
              onSelect={handlePreguntaSelect}
              materiaId={selectedMateria}
              onPreguntaAdded={async () => {
                // Recargar preguntas después de agregar una nueva
                try {
                  const response = await axios.get(`${API_BASE_URL}/materias/${selectedMateria}/preguntas-completas`);
                  setPreguntas(response.data);
                } catch (error) {
                  console.error('Error al recargar preguntas:', error);
                }
              }}
              onPreguntaDeleted={async (preguntaId) => {
                // Recargar preguntas desde el servidor después de eliminar
                setSelectedPregunta(null);
                try {
                  const response = await axios.get(`${API_BASE_URL}/materias/${selectedMateria}/preguntas-completas`);
                  setPreguntas(response.data);
                } catch (error) {
                  console.error('Error al recargar preguntas:', error);
                  // Fallback: eliminar del estado local
                  setPreguntas(preguntas.filter(p => p.id !== preguntaId));
                }
              }}
            />
          ) : (
            <div className="welcome">
              <h2>Bienvenido al Banco de Preguntas</h2>
              <p>Selecciona una materia del menú lateral para comenzar.</p>
              <div className="stats">
                <div className="stat-item">
                  <div className="stat-number">{materias.length}</div>
                  <div className="stat-label">Materias</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

export default App;

