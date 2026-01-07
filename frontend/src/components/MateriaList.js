import React, { useState } from 'react';
import axios from 'axios';
import './MateriaList.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

function MateriaList({ materias, onSelect, onMateriaUpdated }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [updating, setUpdating] = useState(null);
  const [showEditMode, setShowEditMode] = useState(false);

  const handleEdit = (e, materia) => {
    e.stopPropagation();
    setEditingId(materia.id);
    setEditValue(materia.nombre);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditValue('');
  };

  const handleSave = async (e, materiaId) => {
    e.stopPropagation();
    
    if (!editValue.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    setUpdating(materiaId);
    try {
      const response = await axios.put(`${API_BASE_URL}/materias/${materiaId}`, {
        nombre: editValue.trim()
      });
      
      if (response.data.success) {
        setEditingId(null);
        setEditValue('');
        if (onMateriaUpdated) {
          onMateriaUpdated();
        }
      }
    } catch (error) {
      console.error('Error al actualizar materia:', error);
      alert('Error al actualizar el nombre de la materia');
    } finally {
      setUpdating(null);
    }
  };

  const handleKeyPress = (e, materiaId) => {
    if (e.key === 'Enter') {
      handleSave(e, materiaId);
    } else if (e.key === 'Escape') {
      handleCancel(e);
    }
  };

  return (
    <div className="materia-list">
      <div className="materia-list-header">
        <h2>Materias</h2>
        <button
          className={`btn-toggle-edit-mode ${showEditMode ? 'active' : ''}`}
          onClick={() => setShowEditMode(!showEditMode)}
          title={showEditMode ? 'Ocultar botones de edición' : 'Mostrar botones de edición'}
        >
          {showEditMode ? '🔒 Ocultar edición' : '✏️ Mostrar edición'}
        </button>
      </div>
      <div className="materia-items">
        {materias.map((materia) => (
          <div
            key={materia.id}
            className="materia-item"
            onClick={() => editingId !== materia.id && onSelect(materia.id)}
          >
            {editingId === materia.id ? (
              <div className="materia-edit-container" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  className="materia-edit-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, materia.id)}
                  autoFocus
                  disabled={updating === materia.id}
                />
                <div className="materia-edit-buttons">
                  <button
                    className="btn-save-materia"
                    onClick={(e) => handleSave(e, materia.id)}
                    disabled={updating === materia.id}
                  >
                    {updating === materia.id ? 'Guardando...' : '✓'}
                  </button>
                  <button
                    className="btn-cancel-materia"
                    onClick={handleCancel}
                    disabled={updating === materia.id}
                  >
                    ✗
                  </button>
                </div>
              </div>
            ) : (
              <div className="materia-name-container">
                <div className="materia-name">{materia.nombre}</div>
                {showEditMode && (
                  <button
                    className="btn-edit-materia"
                    onClick={(e) => handleEdit(e, materia)}
                    title="Editar nombre"
                  >
                    ✏️
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MateriaList;


