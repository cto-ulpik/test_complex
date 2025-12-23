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

