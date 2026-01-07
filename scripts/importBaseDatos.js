#!/usr/bin/env node
/**
 * Script para importar preguntas de Base de Datos desde archivo PDF
 * Extrae el texto del PDF y lo procesa para agregar a la base de datos
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DB_PATH = path.join(__dirname, '..', 'database', 'banco_preguntas.db');
const PDF_PATH = path.join(__dirname, '..', '3.BASE-DATOS-Corregido.pdf');
const TEMP_TXT = '/tmp/base_datos_temp.txt';

// Extraer texto del PDF usando Python con PyPDF2
console.log('📄 Extrayendo texto del archivo PDF...');
try {
    const extractScript = path.join(__dirname, 'extractPdfText.py');
    execSync(`python3 "${extractScript}" "${PDF_PATH}" "${TEMP_TXT}"`, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '..')
    });
    console.log('✅ Texto extraído correctamente');
} catch (error) {
    console.error('❌ Error al extraer texto del PDF:', error.message);
    console.log('💡 Asegúrate de tener PyPDF2 instalado: pip install PyPDF2');
    process.exit(1);
}

// Leer el archivo de texto
const text = fs.readFileSync(TEMP_TXT, 'utf8');
const lines = text.split('\n');

// Procesar el texto
const materiaNombre = 'Base de Datos';
const preguntas = [];
let currentPregunta = null;
let currentRespuestas = [];
let preguntaNumero = 1;
let enRespuestas = false;

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

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();
    
    // Saltar líneas vacías y títulos
    if (!trimmed || 
        (trimmed.toUpperCase().includes('BASE DE DATOS') && trimmed.length < 30) ||
        trimmed.toUpperCase().includes('BANCO DE PREGUNTAS')) {
        // Si estábamos en respuestas y encontramos línea vacía, puede ser fin de pregunta
        if (enRespuestas && currentRespuestas.length > 0 && currentPregunta) {
            guardarPregunta();
        }
        continue;
    }
    
    // Filtrar líneas con caracteres no legibles (más del 30% de caracteres especiales)
    const caracteresEspeciales = (trimmed.match(/[^\w\s\.,;:!?¿¡()\[\]{}'"-]/g) || []).length;
    const porcentajeEspeciales = trimmed.length > 0 ? caracteresEspeciales / trimmed.length : 0;
    
    if (porcentajeEspeciales > 0.3 && trimmed.length > 0) {
        // Probablemente es texto corrupto, saltarlo
        continue;
    }
    
    // Detectar si es el inicio de una nueva pregunta (Pregunta X:)
    const preguntaMatch = trimmed.match(/^Pregunta\s+(\d+):\s*(.+)$/i);
    if (preguntaMatch) {
        // Guardar pregunta anterior si existe
        if (currentPregunta && currentRespuestas.length > 0) {
            guardarPregunta();
        }
        
        // Nueva pregunta
        const num = preguntaMatch[1];
        let texto = preguntaMatch[2];
        
        // Limpiar referencias a imágenes
        texto = texto.replace(/\[object\].*?\[\/object[^\]]*\]/gi, '');
        texto = texto.replace(/\[Imagen:.*?\]/gi, '');
        
        // Verificar que el texto no esté corrupto
        const textoEspeciales = (texto.match(/[^\w\s\.,;:!?¿¡()\[\]{}'"-]/g) || []).length;
        const textoPorcentajeEspeciales = texto.length > 0 ? textoEspeciales / texto.length : 0;
        
        if (textoPorcentajeEspeciales > 0.3) {
            // Texto corrupto, saltar esta pregunta
            currentPregunta = null;
            currentRespuestas = [];
            enRespuestas = false;
            continue;
        }
        
        currentPregunta = {
            texto: texto
        };
        currentRespuestas = [];
        enRespuestas = false;
        continue;
    }
    
    // Detectar si es una respuesta (empieza con • o símbolo similar)
    const esRespuesta = trimmed.startsWith('•') || 
                        trimmed.startsWith('\uf0b7') ||
                        trimmed.startsWith('◦') ||
                        trimmed.match(/^[•◦\uf0b7]/);
    
    if (esRespuesta && currentPregunta) {
        enRespuestas = true;
        // Limpiar la respuesta (remover •, espacios iniciales)
        let respuestaTexto = trimmed
            .replace(/^[•◦\uf0b7\s]+/, '')
            .trim();
        
        if (respuestaTexto && respuestaTexto.length > 0) {
            currentRespuestas.push(respuestaTexto);
        }
        continue;
    }
    
    // Si encontramos una línea que no es respuesta y estábamos en respuestas,
    // puede ser continuación de la última respuesta o fin de pregunta
    if (enRespuestas && currentRespuestas.length > 0 && currentPregunta) {
        // Si la línea parece ser continuación de la última respuesta (no empieza con mayúscula después de punto)
        if (trimmed.length > 0 && !trimmed.match(/^[A-Z]/)) {
            // Continuación de la última respuesta
            if (currentRespuestas.length > 0) {
                currentRespuestas[currentRespuestas.length - 1] += ' ' + trimmed;
            }
        } else {
            // Probablemente es fin de pregunta o nueva pregunta
            guardarPregunta();
            // Verificar si es inicio de nueva pregunta
            if (preguntaMatch) {
                continue; // Ya se procesó arriba
            }
        }
        continue;
    }
    
    // Continuación de la pregunta (múltiples líneas)
    if (currentPregunta && !enRespuestas) {
        // Limpiar referencias a imágenes
        let texto = trimmed.replace(/\[object\].*?\[\/object[^\]]*\]/gi, '');
        texto = texto.replace(/\[Imagen:.*?\]/gi, '');
        if (texto.trim().length > 0) {
            currentPregunta.texto += ' ' + texto.trim();
        }
    }
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

