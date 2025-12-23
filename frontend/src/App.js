import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import MateriaList from './components/MateriaList';
import PreguntaList from './components/PreguntaList';
import PreguntaDetail from './components/PreguntaDetail';
import SearchBar from './components/SearchBar';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function App() {
  const [materias, setMaterias] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [selectedPregunta, setSelectedPregunta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

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

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/buscar`, {
        params: { q: query }
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
      </header>

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
            />
          ) : selectedMateria ? (
            <PreguntaList
              preguntas={preguntas}
              onSelect={handlePreguntaSelect}
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
    </div>
  );
}

export default App;

