import React, { useState } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [soloSinRespuesta, setSoloSinRespuesta] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query, soloSinRespuesta);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    // Si hay texto o el filtro está activo, buscar
    if (value.trim() || soloSinRespuesta) {
      onSearch(value, soloSinRespuesta);
    } else {
      onSearch('', false);
    }
  };

  const handleFilterChange = (e) => {
    const checked = e.target.checked;
    setSoloSinRespuesta(checked);
    // Buscar inmediatamente cuando se activa/desactiva el filtro
    if (checked || query.trim()) {
      onSearch(query, checked);
    } else {
      onSearch('', false);
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Buscar preguntas..."
          value={query}
          onChange={handleChange}
          className="search-input"
        />
        <button type="submit" className="search-button">
          🔍
        </button>
      </div>
      <div className="search-filter">
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={soloSinRespuesta}
            onChange={handleFilterChange}
          />
          <span>Mostrar solo preguntas sin respuesta correcta</span>
        </label>
      </div>
    </form>
  );
}

export default SearchBar;

