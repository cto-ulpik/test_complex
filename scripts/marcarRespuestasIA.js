#!/usr/bin/env node
/**
 * Script para usar IA y marcar respuestas correctas e incorrectas
 * Solo marca cuando está 100% seguro
 */

// Cargar variables de entorno desde .env
require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'banco_preguntas.db');

// Función para analizar pregunta con IA (usando OpenAI API)
async function analizarPreguntaConIA(pregunta, respuestas) {
    const OpenAI = require('openai');
    
    // Verificar si hay API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'tu_api_key_aqui') {
        console.error('ERROR: OPENAI_API_KEY no está configurada');
        console.log('Por favor configura tu API key en el archivo .env');
        console.log('1. Copia .env.example a .env: cp .env.example .env');
        console.log('2. Edita .env y reemplaza tu_api_key_aqui con tu API key real');
        console.log('   Obtén tu API key en: https://platform.openai.com/api-keys');
        return null;
    }

    const openai = new OpenAI({
        apiKey: apiKey,
    });

    const prompt = `Eres un experto en educación. Analiza la siguiente pregunta de examen y determina cuál es la respuesta correcta.

PREGUNTA: ${pregunta.texto}

OPCIONES:
${respuestas.map(r => `${r.opcion}) ${r.texto}`).join('\n')}

INSTRUCCIONES:
1. Analiza la pregunta cuidadosamente
2. Determina cuál es la respuesta CORRECTA basándote en conocimiento académico sólido
3. SOLO responde si estás 100% seguro de la respuesta correcta
4. Si la pregunta es ambigua, tiene errores, o no puedes determinar con certeza la respuesta, responde "INCIERTO"
5. Si estás seguro, responde SOLO con la letra de la opción correcta (A, B, C, o D)

FORMATO DE RESPUESTA:
- Si estás seguro: responde solo la letra (ej: "A" o "B" o "C" o "D")
- Si no estás seguro: responde "INCIERTO"

RESPUESTA:`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "Eres un experto académico que analiza preguntas de examen. Solo respondes con la letra de la respuesta correcta si estás 100% seguro, o 'INCIERTO' si no puedes determinarlo con certeza."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.1, // Baja temperatura para respuestas más determinísticas
            max_tokens: 10
        });

        const respuesta = response.choices[0].message.content.trim().toUpperCase();
        
        // Validar que la respuesta sea una letra válida o INCIERTO
        if (respuesta === 'INCIERTO' || respuesta === 'INCERTO' || respuesta.includes('INCIERTO')) {
            return null; // No marcar nada si no está seguro
        }

        // Extraer solo la letra (A, B, C, D, E)
        const letra = respuesta.match(/^[A-E]/)?.[0];
        if (letra && respuestas.some(r => r.opcion === letra)) {
            return letra;
        }

        return null;
    } catch (error) {
        console.error(`Error al analizar pregunta ${pregunta.numero}:`, error.message);
        return null;
    }
}

// Función principal
async function marcarRespuestas() {
    const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error al abrir la base de datos:', err.message);
            process.exit(1);
        }
        console.log('Conectado a la base de datos SQLite.');
    });

    // Verificar si openai está instalado
    let openai;
    try {
        openai = require('openai');
    } catch (e) {
        console.log('Instalando openai...');
        const { execSync } = require('child_process');
        execSync('npm install openai', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
        openai = require('openai');
    }

    console.log('\n🔍 Iniciando análisis de preguntas con IA...\n');

    // Función para procesar una pregunta
    function procesarPregunta(pregunta, respuestas) {
        return new Promise((resolve) => {
            // Verificar si ya tiene respuesta correcta marcada
            const yaMarcada = respuestas.some(r => r.es_correcta);
            if (yaMarcada) {
                console.log(`  ✓ Pregunta ${pregunta.numero}: Ya tiene respuesta correcta`);
                resolve({ tipo: 'ya_marcada' });
                return;
            }

            // Analizar con IA
            console.log(`  🔍 Analizando pregunta ${pregunta.numero}...`);
            analizarPreguntaConIA(pregunta, respuestas).then(respuestaCorrecta => {
                if (respuestaCorrecta) {
                    // Encontrar el ID de la respuesta correcta
                    const respuesta = respuestas.find(r => r.opcion === respuestaCorrecta);
                    if (respuesta) {
                        // Usar transacción para asegurar que ambas actualizaciones se guarden
                        // IMPORTANTE: Primero marcar la correcta, luego las incorrectas para evitar sobreescritura
                        db.serialize(() => {
                            db.run('BEGIN TRANSACTION');
                            
                            // PRIMERO: Marcar la respuesta correcta (esto evita que se sobreescriba)
                            db.run(
                                'UPDATE respuestas SET es_correcta = 1 WHERE id = ?',
                                [respuesta.id],
                                function(err) {
                                    if (err) {
                                        console.error(`    ❌ Error al marcar respuesta correcta: ${err.message}`);
                                        db.run('ROLLBACK');
                                        resolve({ tipo: 'error' });
                                        return;
                                    }
                                    
                                    if (this.changes === 0) {
                                        db.run('ROLLBACK');
                                        console.error(`    ❌ Error: No se encontró la respuesta a marcar`);
                                        resolve({ tipo: 'error' });
                                        return;
                                    }
                                    
                                    // SEGUNDO: Marcar todas las demás respuestas como incorrectas (excluyendo la correcta)
                                    db.run(
                                        'UPDATE respuestas SET es_correcta = 0 WHERE pregunta_id = ? AND id != ?',
                                        [pregunta.id, respuesta.id],
                                        function(err) {
                                            if (err) {
                                                console.error(`    ❌ Error al marcar respuestas incorrectas: ${err.message}`);
                                                db.run('ROLLBACK');
                                                resolve({ tipo: 'error' });
                                                return;
                                            }
                                            
                                            const incorrectasActualizadas = this.changes;
                                            
                                            // Confirmar transacción
                                            db.run('COMMIT', (err) => {
                                                if (err) {
                                                    console.error(`    ❌ Error al confirmar transacción: ${err.message}`);
                                                    resolve({ tipo: 'error' });
                                                } else {
                                                    // Verificar que se guardó correctamente
                                                    db.get(
                                                        'SELECT COUNT(*) as count FROM respuestas WHERE pregunta_id = ? AND es_correcta = 1',
                                                        [pregunta.id],
                                                        (err, row) => {
                                                            if (err) {
                                                                console.error(`    ⚠️  Error al verificar: ${err.message}`);
                                                                resolve({ tipo: 'error' });
                                                            } else if (row.count === 1) {
                                                                console.log(`    ✅ Pregunta ${pregunta.numero}: Respuesta ${respuestaCorrecta} marcada como CORRECTA`);
                                                                console.log(`       → ${incorrectasActualizadas} respuestas marcadas como INCORRECTAS`);
                                                                resolve({ tipo: 'marcada' });
                                                            } else {
                                                                console.error(`    ❌ Error: No se pudo verificar la actualización (count: ${row.count})`);
                                                                resolve({ tipo: 'error' });
                                                            }
                                                        }
                                                    );
                                                }
                                            });
                                        }
                                    );
                                }
                            );
                        });
                    } else {
                        console.log(`    ⚠️  Pregunta ${pregunta.numero}: Respuesta ${respuestaCorrecta} no encontrada`);
                        resolve({ tipo: 'error' });
                    }
                } else {
                    console.log(`    ⚠️  Pregunta ${pregunta.numero}: No se pudo determinar respuesta (incierto - no se marca nada)`);
                    resolve({ tipo: 'incierto' });
                }
            }).catch(err => {
                console.error(`    ❌ Error al analizar pregunta ${pregunta.numero}:`, err.message);
                resolve({ tipo: 'error' });
            });
        });
    }

    // Obtener todas las materias
    db.all('SELECT * FROM materias ORDER BY nombre', async (err, materias) => {
        if (err) {
            console.error('Error al obtener materias:', err.message);
            db.close();
            return;
        }

        let totalPreguntas = 0;
        let preguntasMarcadas = 0;
        let preguntasInciertas = 0;
        let preguntasConError = 0;
        let preguntasYaMarcadas = 0;

        // Procesar materias secuencialmente
        for (const materia of materias) {
            console.log(`\n📚 Analizando: ${materia.nombre}`);
            
            // Obtener preguntas de esta materia
            const preguntas = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT p.*, 
                            (SELECT json_group_array(
                                json_object('id', r.id, 'opcion', r.opcion, 'texto', r.texto, 'es_correcta', r.es_correcta)
                            ) FROM respuestas r WHERE r.pregunta_id = p.id) as respuestas_json
                     FROM preguntas p 
                     WHERE p.materia_id = ? 
                     ORDER BY CAST(p.numero AS INTEGER)`,
                    [materia.id],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            // Procesar preguntas secuencialmente
            for (const pregunta of preguntas) {
                totalPreguntas++;
                const respuestas = pregunta.respuestas_json 
                    ? JSON.parse(pregunta.respuestas_json) 
                    : [];

                if (respuestas.length === 0) {
                    console.log(`  ⚠️  Pregunta ${pregunta.numero}: Sin respuestas`);
                    continue;
                }

                const resultado = await procesarPregunta(pregunta, respuestas);
                
                switch (resultado.tipo) {
                    case 'marcada':
                        preguntasMarcadas++;
                        break;
                    case 'incierto':
                        preguntasInciertas++;
                        break;
                    case 'error':
                        preguntasConError++;
                        break;
                    case 'ya_marcada':
                        preguntasYaMarcadas++;
                        break;
                }

                // Pequeña pausa para no sobrecargar la API
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Mostrar resumen
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN:');
        console.log(`   Total preguntas analizadas: ${totalPreguntas}`);
        console.log(`   ✅ Preguntas marcadas (nuevas): ${preguntasMarcadas}`);
        console.log(`   ✓ Preguntas ya marcadas: ${preguntasYaMarcadas}`);
        console.log(`   ⚠️  Preguntas inciertas: ${preguntasInciertas}`);
        console.log(`   ❌ Preguntas con error: ${preguntasConError}`);
        console.log('='.repeat(60));
        db.close();
    });
}

// Ejecutar
marcarRespuestas().catch(console.error);

