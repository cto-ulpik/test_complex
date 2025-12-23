#!/usr/bin/env node
/**
 * Script para importar el JSON del banco de preguntas a la base de datos SQLite
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'banco_preguntas.db');
const JSON_PATH = path.join(__dirname, '..', 'banco_preguntas.json');

// Crear directorio de base de datos si no existe
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Leer el JSON
console.log('Leyendo archivo JSON...');
const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

// Crear o abrir la base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error al abrir la base de datos:', err.message);
        process.exit(1);
    }
    console.log('Conectado a la base de datos SQLite.');
});

// Crear tablas
db.serialize(() => {
    // Tabla de materias
    db.run(`CREATE TABLE IF NOT EXISTS materias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
    )`, (err) => {
        if (err) {
            console.error('Error al crear tabla materias:', err.message);
        } else {
            console.log('Tabla materias creada/verificada.');
        }
    });

    // Tabla de preguntas
    db.run(`CREATE TABLE IF NOT EXISTS preguntas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        materia_id INTEGER NOT NULL,
        numero TEXT NOT NULL,
        texto TEXT NOT NULL,
        FOREIGN KEY (materia_id) REFERENCES materias(id),
        UNIQUE(materia_id, numero)
    )`, (err) => {
        if (err) {
            console.error('Error al crear tabla preguntas:', err.message);
        } else {
            console.log('Tabla preguntas creada/verificada.');
        }
    });

    // Tabla de respuestas
    db.run(`CREATE TABLE IF NOT EXISTS respuestas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pregunta_id INTEGER NOT NULL,
        opcion TEXT NOT NULL,
        texto TEXT NOT NULL,
        es_correcta INTEGER DEFAULT 0,
        FOREIGN KEY (pregunta_id) REFERENCES preguntas(id),
        UNIQUE(pregunta_id, opcion)
    )`, (err) => {
        if (err) {
            console.error('Error al crear tabla respuestas:', err.message);
        } else {
            console.log('Tabla respuestas creada/verificada.');
            // Agregar columna es_correcta si no existe (para bases de datos existentes)
            db.run(`ALTER TABLE respuestas ADD COLUMN es_correcta INTEGER DEFAULT 0`, (err) => {
                // Ignorar error si la columna ya existe
            });
        }
    });

    // Limpiar datos existentes (usar serialización para asegurar orden)
    db.serialize(() => {
        db.run('DELETE FROM respuestas');
        db.run('DELETE FROM preguntas');
        db.run('DELETE FROM materias');
    });

    // Insertar datos usando promesas
    console.log('\nImportando datos...');
    
    let totalMaterias = 0;
    let totalPreguntas = 0;
    let totalRespuestas = 0;

    // Función para insertar una materia y sus preguntas
    function insertarMateria(materiaData) {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO materias (nombre) VALUES (?)', [materiaData.materia], function(err) {
                if (err) {
                    console.error(`Error al insertar materia ${materiaData.materia}:`, err.message);
                    reject(err);
                    return;
                }
                const materiaId = this.lastID;
                totalMaterias++;

                // Insertar todas las preguntas de esta materia
                const promesasPreguntas = materiaData.preguntas.map((preguntaData) => {
                    return new Promise((resolvePreg, rejectPreg) => {
                        db.run('INSERT OR IGNORE INTO preguntas (materia_id, numero, texto) VALUES (?, ?, ?)',
                            [materiaId, preguntaData.numero, preguntaData.texto],
                            function(err) {
                                if (err) {
                                    console.error(`Error al insertar pregunta:`, err.message);
                                    rejectPreg(err);
                                    return;
                                }
                                if (this.changes === 0) {
                                    // Ya existe, obtener el ID
                                    db.get('SELECT id FROM preguntas WHERE materia_id = ? AND numero = ?',
                                        [materiaId, preguntaData.numero],
                                        (err, row) => {
                                            if (err) {
                                                rejectPreg(err);
                                                return;
                                            }
                                            if (row) {
                                                this.lastID = row.id;
                                                totalPreguntas++;
                                            }
                                        });
                                }
                                const preguntaId = this.lastID;
                                totalPreguntas++;

                                // Insertar todas las respuestas de esta pregunta
                                if (preguntaData.respuestas && preguntaData.respuestas.length > 0) {
                                    const promesasRespuestas = preguntaData.respuestas.map((respuestaData) => {
                                        return new Promise((resolveResp, rejectResp) => {
                                            db.run('INSERT OR IGNORE INTO respuestas (pregunta_id, opcion, texto, es_correcta) VALUES (?, ?, ?, ?)',
                                                [preguntaId, respuestaData.opcion, respuestaData.texto, respuestaData.es_correcta || 0],
                                                function(err) {
                                                    if (err) {
                                                        console.error(`Error al insertar respuesta:`, err.message);
                                                        rejectResp(err);
                                                        return;
                                                    }
                                                    if (this.changes > 0) {
                                                        totalRespuestas++;
                                                    }
                                                    resolveResp();
                                                });
                                        });
                                    });
                                    Promise.all(promesasRespuestas).then(() => resolvePreg()).catch(rejectPreg);
                                } else {
                                    resolvePreg();
                                }
                            });
                    });
                });

                Promise.all(promesasPreguntas).then(() => resolve()).catch(reject);
            });
        });
    }

    // Insertar todas las materias secuencialmente
    async function importarTodo() {
        for (const materiaData of jsonData.banco_preguntas) {
            await insertarMateria(materiaData);
        }
        
        console.log('\n✅ Importación completada:');
        console.log(`   - ${totalMaterias} materias`);
        console.log(`   - ${totalPreguntas} preguntas`);
        console.log(`   - ${totalRespuestas} respuestas`);
        db.close((err) => {
            if (err) {
                console.error('Error al cerrar la base de datos:', err.message);
            } else {
                console.log('\nBase de datos cerrada.');
            }
        });
    }

    importarTodo().catch((err) => {
        console.error('Error durante la importación:', err);
        db.close();
    });
});

