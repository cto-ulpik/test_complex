#!/usr/bin/env node
/**
 * Script para importar preguntas de Arquitectura de Computadoras desde archivo DOCX
 * Extrae el texto del DOCX y lo procesa para agregar a la base de datos
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DB_PATH = path.join(__dirname, '..', 'database', 'banco_preguntas.db');
const DOCX_PATH = path.join(__dirname, '..', '2.ARQUITECTURA DE COMPUTADORAS_pregADD.docx');
const TEMP_TXT = '/tmp/arquitectura_temp.txt';

// Extraer texto del DOCX
console.log('📄 Extrayendo texto del archivo DOCX...');
try {
    execSync(`textutil -convert txt -stdout "${DOCX_PATH}" > "${TEMP_TXT}"`, { encoding: 'utf8' });
    console.log('✅ Texto extraído correctamente');
} catch (error) {
    console.error('❌ Error al extraer texto del DOCX:', error.message);
    process.exit(1);
}

// Leer el archivo de texto
const text = fs.readFileSync(TEMP_TXT, 'utf8');
const lines = text.split('\n');

// Procesar el texto
const materiaNombre = 'Arquitectura de Computadoras';
const preguntas = [];
let currentPregunta = null;
let currentRespuestas = [];
let preguntaNumero = 1;
let enRespuestas = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Saltar líneas vacías y el título
    const trimmed = line.trim();
    if (!trimmed || trimmed === 'ARQUITECTURA DE COMPUTADORAS') {
        // Si estábamos en respuestas y encontramos línea vacía, puede ser fin de pregunta
        if (enRespuestas && currentRespuestas.length > 0 && currentPregunta) {
            guardarPregunta();
        }
        continue;
    }
    
    // Detectar si es una respuesta (empieza con • o tiene tabulación al inicio)
    const esRespuesta = trimmed.startsWith('•') || 
                        trimmed.startsWith('\uf0b7') || 
                        (line.startsWith('\t') && trimmed.length > 0);
    
    if (esRespuesta) {
        enRespuestas = true;
        const respuestaTexto = trimmed.replace(/^[•\uf0b7\s]+/, '').trim();
        if (respuestaTexto && respuestaTexto.length > 0) {
            currentRespuestas.push(respuestaTexto);
        }
        continue;
    }
    
    // Si encontramos una línea que no es respuesta y estábamos en respuestas,
    // guardar la pregunta anterior
    if (enRespuestas && currentRespuestas.length > 0 && currentPregunta) {
        guardarPregunta();
    }
    
    // Nueva pregunta o continuación de pregunta
    if (currentPregunta && !enRespuestas) {
        // Continuación de la pregunta (múltiples líneas)
        currentPregunta.texto += ' ' + trimmed;
    } else {
        // Nueva pregunta
        currentPregunta = {
            texto: trimmed
        };
        currentRespuestas = [];
        enRespuestas = false;
    }
}

function guardarPregunta() {
    if (currentPregunta && currentRespuestas.length > 0) {
        // Asignar letras A, B, C, D a las respuestas
        const respuestas = currentRespuestas
            .filter(r => r.trim().length > 0)
            .map((texto, idx) => ({
                opcion: String.fromCharCode(65 + idx), // A, B, C, D...
                texto: texto.trim(),
                es_correcta: 0
            }));
        
        if (respuestas.length > 0) {
            preguntas.push({
                numero: preguntaNumero.toString(),
                texto: currentPregunta.texto.trim(),
                respuestas: respuestas
            });
            preguntaNumero++;
        }
    }
    currentPregunta = null;
    currentRespuestas = [];
    enRespuestas = false;
}

// Guardar la última pregunta si existe
if (currentPregunta && currentRespuestas.length > 0) {
    guardarPregunta();
}


console.log(`\n📊 Preguntas encontradas: ${preguntas.length}`);

// Abrir base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error al abrir la base de datos:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado a la base de datos SQLite.');
});

// Insertar materia y preguntas
db.serialize(() => {
    // Verificar si la materia ya existe
    db.get('SELECT id FROM materias WHERE nombre = ?', [materiaNombre], (err, row) => {
        if (err) {
            console.error('❌ Error al verificar materia:', err.message);
            db.close();
            process.exit(1);
        }
        
        let materiaId;
        
        if (row) {
            // La materia ya existe
            materiaId = row.id;
            console.log(`\n⚠️  La materia "${materiaNombre}" ya existe (ID: ${materiaId})`);
            console.log('📝 Se agregarán las nuevas preguntas a esta materia...');
        } else {
            // Crear nueva materia
            db.run('INSERT INTO materias (nombre) VALUES (?)', [materiaNombre], function(err) {
                if (err) {
                    console.error('❌ Error al insertar materia:', err.message);
                    db.close();
                    process.exit(1);
                }
                materiaId = this.lastID;
                console.log(`\n✅ Materia "${materiaNombre}" creada (ID: ${materiaId})`);
                insertarPreguntas(materiaId);
            });
            return;
        }
        
        // Si la materia ya existe, insertar preguntas directamente
        insertarPreguntas(materiaId);
    });
    
    function insertarPreguntas(materiaId) {
        let preguntasInsertadas = 0;
        let respuestasInsertadas = 0;
        let preguntasDuplicadas = 0;
        
        const insertarSiguiente = (index) => {
            if (index >= preguntas.length) {
                // Terminado
                console.log('\n✅ Importación completada:');
                console.log(`   - ${preguntasInsertadas} preguntas nuevas`);
                console.log(`   - ${preguntasDuplicadas} preguntas duplicadas (omitidas)`);
                console.log(`   - ${respuestasInsertadas} respuestas`);
                db.close();
                return;
            }
            
            const pregunta = preguntas[index];
            
            // Insertar pregunta
            db.run(
                'INSERT OR IGNORE INTO preguntas (materia_id, numero, texto) VALUES (?, ?, ?)',
                [materiaId, pregunta.numero, pregunta.texto],
                function(err) {
                    if (err) {
                        console.error(`❌ Error al insertar pregunta ${pregunta.numero}:`, err.message);
                        insertarSiguiente(index + 1);
                        return;
                    }
                    
                    if (this.changes === 0) {
                        // Ya existe
                        preguntasDuplicadas++;
                        insertarSiguiente(index + 1);
                        return;
                    }
                    
                    const preguntaId = this.lastID;
                    preguntasInsertadas++;
                    
                    // Insertar respuestas
                    let respuestasInsertadasPregunta = 0;
                    const insertarRespuesta = (respIndex) => {
                        if (respIndex >= pregunta.respuestas.length) {
                            insertarSiguiente(index + 1);
                            return;
                        }
                        
                        const respuesta = pregunta.respuestas[respIndex];
                        db.run(
                            'INSERT OR IGNORE INTO respuestas (pregunta_id, opcion, texto, es_correcta) VALUES (?, ?, ?, ?)',
                            [preguntaId, respuesta.opcion, respuesta.texto, respuesta.es_correcta || 0],
                            function(err) {
                                if (err) {
                                    console.error(`❌ Error al insertar respuesta ${respuesta.opcion}:`, err.message);
                                } else if (this.changes > 0) {
                                    respuestasInsertadas++;
                                    respuestasInsertadasPregunta++;
                                }
                                insertarRespuesta(respIndex + 1);
                            }
                        );
                    };
                    
                    insertarRespuesta(0);
                }
            );
        };
        
        insertarSiguiente(0);
    }
});

