import React from 'react';
import './MateriaList.css';

function MateriaList({ materias, onSelect }) {
  return (
    <div className="materia-list">
      <h2>Materias</h2>
      <div className="materia-items">
        {materias.map((materia) => (
          <div
            key={materia.id}
            className="materia-item"
            onClick={() => onSelect(materia.id)}
          >
            <div className="materia-name">{materia.nombre}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MateriaList;

