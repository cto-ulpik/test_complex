const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;
const DB_PATH = path.join(__dirname, 'database', 'banco_preguntas.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Abrir base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error al abrir la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// API Routes

// Obtener todas las materias
app.get('/api/materias', (req, res) => {
    db.all('SELECT * FROM materias ORDER BY nombre', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Obtener preguntas de una materia
app.get('/api/materias/:materiaId/preguntas', (req, res) => {
    const materiaId = req.params.materiaId;
    
    db.all(
        `SELECT p.*, 
                (SELECT COUNT(*) FROM respuestas WHERE pregunta_id = p.id) as total_respuestas
         FROM preguntas p 
         WHERE p.materia_id = ? 
         ORDER BY CAST(p.numero AS INTEGER)`,
        [materiaId],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// Obtener una pregunta con sus respuestas
app.get('/api/preguntas/:preguntaId', (req, res) => {
    const preguntaId = req.params.preguntaId;
    
    // Obtener la pregunta
    db.get('SELECT * FROM preguntas WHERE id = ?', [preguntaId], (err, pregunta) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!pregunta) {
            res.status(404).json({ error: 'Pregunta no encontrada' });
            return;
        }
        
        // Obtener las respuestas
        db.all(
            'SELECT id, pregunta_id, opcion, texto, es_correcta FROM respuestas WHERE pregunta_id = ? ORDER BY opcion',
            [preguntaId],
            (err, respuestas) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({
                    ...pregunta,
                    respuestas: respuestas
                });
            }
        );
    });
});

// Obtener todas las preguntas de una materia con sus respuestas
app.get('/api/materias/:materiaId/preguntas-completas', (req, res) => {
    const materiaId = req.params.materiaId;
    
    db.all(
        `SELECT p.*
         FROM preguntas p 
         WHERE p.materia_id = ? 
         ORDER BY CAST(p.numero AS INTEGER)`,
        [materiaId],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Obtener respuestas para cada pregunta
            const preguntasPromises = rows.map(row => {
                return new Promise((resolve, reject) => {
                    db.all(
                        'SELECT id, opcion, texto, COALESCE(es_correcta, 0) as es_correcta FROM respuestas WHERE pregunta_id = ? ORDER BY opcion',
                        [row.id],
                        (err, respuestas) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({
                                    ...row,
                                    respuestas: respuestas.map(r => ({
                                        ...r,
                                        es_correcta: Number(r.es_correcta) || 0
                                    }))
                                });
                            }
                        }
                    );
                });
            });
            
            Promise.all(preguntasPromises)
                .then(preguntas => {
                    res.json(preguntas);
                })
                .catch(err => {
                    res.status(500).json({ error: err.message });
                });
        }
    );
});

// Endpoint para crear una nueva pregunta
app.post('/api/preguntas', (req, res) => {
    const { materia_id, numero, texto } = req.body;
    
    if (!materia_id || !texto) {
        res.status(400).json({ error: 'materia_id y texto son requeridos' });
        return;
    }
    
    // Obtener el siguiente número de pregunta para la materia
    db.get(
        'SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 0) + 1 as siguiente_numero FROM preguntas WHERE materia_id = ?',
        [materia_id],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const preguntaNumero = numero || row.siguiente_numero;
            
            db.run(
                'INSERT INTO preguntas (materia_id, numero, texto) VALUES (?, ?, ?)',
                [materia_id, preguntaNumero, texto],
                function(err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    res.json({
                        success: true,
                        id: this.lastID,
                        numero: preguntaNumero,
                        message: 'Pregunta creada exitosamente'
                    });
                }
            );
        }
    );
});

// Endpoint para eliminar una pregunta
app.delete('/api/preguntas/:id', (req, res) => {
    const preguntaId = req.params.id;
    
    // Primero eliminar todas las respuestas asociadas
    db.run('DELETE FROM respuestas WHERE pregunta_id = ?', [preguntaId], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Luego eliminar la pregunta
        db.run('DELETE FROM preguntas WHERE id = ?', [preguntaId], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                success: true,
                message: 'Pregunta eliminada exitosamente'
            });
        });
    });
});

// Endpoint para agregar una nueva respuesta a una pregunta
app.post('/api/preguntas/:id/respuestas', (req, res) => {
    const preguntaId = req.params.id;
    const { opcion, texto } = req.body;
    
    if (!opcion || !texto) {
        res.status(400).json({ error: 'opcion y texto son requeridos' });
        return;
    }
    
    db.run(
        'INSERT INTO respuestas (pregunta_id, opcion, texto, es_correcta) VALUES (?, ?, ?, 0)',
        [preguntaId, opcion, texto],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                success: true,
                id: this.lastID,
                message: 'Respuesta agregada exitosamente'
            });
        }
    );
});

// Endpoint para eliminar una respuesta
app.delete('/api/respuestas/:id', (req, res) => {
    const respuestaId = req.params.id;
    
    db.run('DELETE FROM respuestas WHERE id = ?', [respuestaId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        res.json({
            success: true,
            message: 'Respuesta eliminada exitosamente'
        });
    });
});

// Endpoint para actualizar una pregunta
app.put('/api/preguntas/:preguntaId', (req, res) => {
    const preguntaId = req.params.preguntaId;
    const { texto } = req.body;
    
    if (!texto || texto.trim() === '') {
        res.status(400).json({ error: 'El texto de la pregunta no puede estar vacío' });
        return;
    }
    
    db.run(
        'UPDATE preguntas SET texto = ? WHERE id = ?',
        [texto.trim(), preguntaId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Pregunta no encontrada' });
                return;
            }
            res.json({ success: true, message: 'Pregunta actualizada correctamente' });
        }
    );
});

// Endpoint para actualizar una respuesta
app.put('/api/respuestas/:respuestaId', (req, res) => {
    const respuestaId = req.params.respuestaId;
    const { texto } = req.body;
    
    if (!texto || texto.trim() === '') {
        res.status(400).json({ error: 'El texto de la respuesta no puede estar vacío' });
        return;
    }
    
    db.run(
        'UPDATE respuestas SET texto = ? WHERE id = ?',
        [texto.trim(), respuestaId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Respuesta no encontrada' });
                return;
            }
            res.json({ success: true, message: 'Respuesta actualizada correctamente' });
        }
    );
});

// Endpoint para marcar una respuesta como correcta
app.put('/api/respuestas/:respuestaId/correcta', (req, res) => {
    const respuestaId = req.params.respuestaId;
    const { es_correcta } = req.body;
    
    // Primero, desmarcar todas las respuestas de la misma pregunta
    db.get('SELECT pregunta_id FROM respuestas WHERE id = ?', [respuestaId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Respuesta no encontrada' });
            return;
        }
        
        // Desmarcar todas las respuestas de esta pregunta
        db.run('UPDATE respuestas SET es_correcta = 0 WHERE pregunta_id = ?', [row.pregunta_id], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Marcar la respuesta seleccionada como correcta
            db.run('UPDATE respuestas SET es_correcta = ? WHERE id = ?', [es_correcta ? 1 : 0, respuestaId], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ success: true, message: 'Respuesta actualizada' });
            });
        });
    });
});

// Endpoint para obtener total de preguntas con respuesta correcta
app.get('/api/preguntas-con-respuesta/total', (req, res) => {
    db.get(
        'SELECT COUNT(DISTINCT p.id) as total FROM preguntas p JOIN respuestas r ON r.pregunta_id = p.id WHERE (r.es_correcta = 1 OR r.es_correcta = \'1\' OR r.es_correcta = true)',
        [],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ total: row.total || 0 });
        }
    );
});

// Endpoint para obtener preguntas aleatorias con respuesta correcta (todas las materias)
app.get('/api/preguntas-aleatorias', (req, res) => {
    const cantidad = parseInt(req.query.cantidad) || 10;
    
    db.all(
        `SELECT DISTINCT p.id FROM preguntas p 
         JOIN respuestas r ON r.pregunta_id = p.id 
         WHERE (r.es_correcta = 1 OR r.es_correcta = '1' OR r.es_correcta = true)
         ORDER BY RANDOM()
         LIMIT ?`,
        [cantidad],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (rows.length === 0) {
                res.json([]);
                return;
            }
            
            const preguntaIds = rows.map(r => r.id);
            const placeholders = preguntaIds.map(() => '?').join(',');
            
            // Obtener preguntas completas con respuestas
            db.all(
                `SELECT p.*
                 FROM preguntas p 
                 WHERE p.id IN (${placeholders})`,
                preguntaIds,
                (err, preguntas) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    const preguntasPromises = preguntas.map(pregunta => {
                        return new Promise((resolve, reject) => {
                            db.all(
                                'SELECT id, opcion, texto, COALESCE(es_correcta, 0) as es_correcta FROM respuestas WHERE pregunta_id = ? ORDER BY opcion',
                                [pregunta.id],
                                (err, respuestas) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve({
                                            ...pregunta,
                                            respuestas: respuestas.map(r => {
                                                // Asegurar que es_correcta sea 0 o 1
                                                const esCorrecta = r.es_correcta === 1 || r.es_correcta === '1' || r.es_correcta === true ? 1 : 0;
                                                return {
                                                    ...r,
                                                    es_correcta: esCorrecta
                                                };
                                            })
                                        });
                                    }
                                }
                            );
                        });
                    });
                    
                    Promise.all(preguntasPromises)
                        .then(preguntasCompletas => {
                            res.json(preguntasCompletas);
                        })
                        .catch(err => {
                            res.status(500).json({ error: err.message });
                        });
                }
            );
        }
    );
});

// Endpoint para obtener preguntas aleatorias con respuesta correcta por materia
app.get('/api/materias/:materiaId/preguntas-aleatorias', (req, res) => {
    const materiaId = req.params.materiaId;
    const cantidad = parseInt(req.query.cantidad) || 10;
    
    db.all(
        `SELECT DISTINCT p.id FROM preguntas p 
         JOIN respuestas r ON r.pregunta_id = p.id 
         WHERE p.materia_id = ? AND (r.es_correcta = 1 OR r.es_correcta = '1' OR r.es_correcta = true)
         ORDER BY RANDOM()
         LIMIT ?`,
        [materiaId, cantidad],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (rows.length === 0) {
                res.json([]);
                return;
            }
            
            const preguntaIds = rows.map(r => r.id);
            const placeholders = preguntaIds.map(() => '?').join(',');
            
            db.all(
                `SELECT p.*
                 FROM preguntas p 
                 WHERE p.id IN (${placeholders})`,
                preguntaIds,
                (err, preguntas) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    const preguntasPromises = preguntas.map(pregunta => {
                        return new Promise((resolve, reject) => {
                            db.all(
                                'SELECT id, opcion, texto, COALESCE(es_correcta, 0) as es_correcta FROM respuestas WHERE pregunta_id = ? ORDER BY opcion',
                                [pregunta.id],
                                (err, respuestas) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve({
                                            ...pregunta,
                                            respuestas: respuestas.map(r => {
                                                // Asegurar que es_correcta sea 0 o 1
                                                const esCorrecta = r.es_correcta === 1 || r.es_correcta === '1' || r.es_correcta === true ? 1 : 0;
                                                return {
                                                    ...r,
                                                    es_correcta: esCorrecta
                                                };
                                            })
                                        });
                                    }
                                }
                            );
                        });
                    });
                    
                    Promise.all(preguntasPromises)
                        .then(preguntasCompletas => {
                            res.json(preguntasCompletas);
                        })
                        .catch(err => {
                            res.status(500).json({ error: err.message });
                        });
                }
            );
        }
    );
});

// Endpoint para obtener total de preguntas con respuesta correcta por materia
app.get('/api/materias/:materiaId/preguntas-con-respuesta', (req, res) => {
    const materiaId = req.params.materiaId;
    
    db.get(
        `SELECT COUNT(DISTINCT p.id) as total 
         FROM preguntas p 
         JOIN respuestas r ON r.pregunta_id = p.id 
         WHERE p.materia_id = ? AND (r.es_correcta = 1 OR r.es_correcta = '1' OR r.es_correcta = true)`,
        [materiaId],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ total: row.total || 0 });
        }
    );
});

// Endpoint para obtener estadísticas generales
app.get('/api/estadisticas', (req, res) => {
    // Obtener total de materias
    db.get('SELECT COUNT(*) as total FROM materias', [], (err, materiasRow) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Obtener total de preguntas
        db.get('SELECT COUNT(*) as total FROM preguntas', [], (err, preguntasRow) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Obtener preguntas con respuesta correcta
            db.get(
                'SELECT COUNT(DISTINCT p.id) as total FROM preguntas p JOIN respuestas r ON r.pregunta_id = p.id WHERE (r.es_correcta = 1 OR r.es_correcta = \'1\' OR r.es_correcta = true)',
                [],
                (err, marcadasRow) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    const totalMaterias = materiasRow.total || 0;
                    const totalPreguntas = preguntasRow.total || 0;
                    const preguntasMarcadas = marcadasRow.total || 0;
                    const preguntasInciertas = totalPreguntas - preguntasMarcadas;

                    res.json({
                        totalMaterias,
                        totalPreguntas,
                        preguntasMarcadas,
                        preguntasInciertas
                    });
                }
            );
        });
    });
});

// Búsqueda de preguntas
app.get('/api/buscar', (req, res) => {
    const query = req.query.q || '';
    
    if (!query) {
        res.json([]);
        return;
    }
    
    db.all(
        `SELECT p.*, m.nombre as materia_nombre,
                (SELECT json_group_array(
                    json_object('id', r.id, 'opcion', r.opcion, 'texto', r.texto, 'es_correcta', r.es_correcta)
                ) FROM respuestas r WHERE r.pregunta_id = p.id) as respuestas_json
         FROM preguntas p
         JOIN materias m ON p.materia_id = m.id
         WHERE p.texto LIKE ? OR m.nombre LIKE ?
         ORDER BY m.nombre, CAST(p.numero AS INTEGER)
         LIMIT 50`,
        [`%${query}%`, `%${query}%`],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const resultados = rows.map(row => ({
                ...row,
                respuestas: row.respuestas_json ? JSON.parse(row.respuestas_json) : []
            }));
            
            res.json(resultados);
        }
    );
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Cerrar base de datos al terminar
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error al cerrar la base de datos:', err.message);
        } else {
            console.log('Base de datos cerrada.');
        }
        process.exit(0);
    });
});

