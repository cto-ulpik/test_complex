#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Programa para convertir el banco de preguntas TXT a JSON
Extrae materias, preguntas y respuestas del archivo TXT
NO MODIFICA preguntas ni respuestas, solo las extrae
"""

import json
import re
import sys
from pathlib import Path


def identify_materias_and_preguntas(text):
    """Identifica materias y sus preguntas/respuestas del TXT"""
    lines = text.split('\n')
    
    materias = []
    current_materia = None
    current_pregunta = None
    current_respuestas = []
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Limpiar caracteres especiales al inicio (como •)
        line_clean = re.sub(r'^[•\s]+', '', line)
        
        if not line_clean:
            i += 1
            continue
        
        # Detectar materia: "Banco de Preguntas: [Nombre]" o "Banco de preguntas: [Nombre]" (case insensitive)
        materia_match = re.match(r'Banco de [Pp]reguntas\s*:?\s*(.+)', line_clean, re.IGNORECASE)
        if materia_match:
            # Guardar materia anterior si existe
            if current_materia:
                if current_pregunta:
                    if current_respuestas:
                        current_pregunta['respuestas'] = current_respuestas
                    current_materia['preguntas'].append(current_pregunta)
                if current_materia['preguntas']:
                    materias.append(current_materia)
            
            # Limpiar el nombre de la materia
            materia_nombre = materia_match.group(1).strip()
            # Remover "GENERADO" si está al inicio
            materia_nombre = re.sub(r'^GENERADO\s+', '', materia_nombre, flags=re.IGNORECASE).strip()
            # Convertir a formato título (primera letra mayúscula de cada palabra)
            materia_nombre = materia_nombre.title()
            # Correcciones específicas
            if 'Generado Inteligencia Artificial' in materia_nombre or 'Inteligencia Artificial' in materia_nombre:
                materia_nombre = 'Inteligencia Artificial'
            
            # Nueva materia
            current_materia = {
                'materia': materia_nombre,
                'preguntas': []
            }
            current_pregunta = None
            current_respuestas = []
            i += 1
            continue
        
        # Detectar pregunta: "Pregunta X:" o "Pregunta X" (puede estar solo en una línea)
        pregunta_match = re.match(r'^Pregunta\s+(\d+)(?:\s*:?\s*(.+))?$', line_clean, re.IGNORECASE)
        if not pregunta_match:
            # Detectar formato "1. texto" o "1 texto" (número seguido de punto o espacio)
            pregunta_match = re.match(r'^(\d+)[\.\)]\s*(.+)', line_clean)
        if pregunta_match:
            # Guardar pregunta anterior
            if current_pregunta and current_materia:
                if current_respuestas:
                    current_pregunta['respuestas'] = current_respuestas
                current_materia['preguntas'].append(current_pregunta)
            
            # Nueva pregunta
            pregunta_num = pregunta_match.group(1)
            pregunta_texto = pregunta_match.group(2).strip() if pregunta_match.lastindex >= 2 and pregunta_match.group(2) else ""
            
            # Si no hay texto después de "Pregunta X", la siguiente línea es el texto
            if not pregunta_texto and i + 1 < len(lines):
                next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""
                next_line_clean = re.sub(r'^[•\s]+', '', next_line)
                # Si la siguiente línea no es una respuesta (no empieza con A-E:), es parte de la pregunta
                if next_line_clean and not re.match(r'^[A-E][:]', next_line_clean) and not re.match(r'^\s*[\uf0b7•]', next_line.strip()):
                    pregunta_texto = next_line_clean
                    i += 1  # Saltar la siguiente línea ya que la procesamos
            
            current_pregunta = {
                'numero': pregunta_num,
                'texto': pregunta_texto,
                'respuestas': []
            }
            current_respuestas = []
            i += 1
            continue
        
        # Detectar respuesta: "A:", "B:", "C:", "D:" (puede tener • antes)
        # También detectar "a)", "b)", "c)", "d)" (minúsculas con paréntesis)
        respuesta_match = re.match(r'[•\s]*([A-Ea-e])[:\)]\s*(.+)', line_clean)
        if respuesta_match:
            if current_pregunta:
                respuesta_letra = respuesta_match.group(1).upper()  # Convertir a mayúscula
                respuesta_texto = respuesta_match.group(2).strip()
                current_respuestas.append({
                    'opcion': respuesta_letra,
                    'texto': respuesta_texto
                })
            i += 1
            continue
        
        # Detectar respuesta sin letra explícita: solo bullet (• o \uf0b7) seguido de texto
        if current_pregunta and ('•' in line or '\uf0b7' in line):
            # Primero intentar con letra explícita
            bullet_match = re.match(r'\s*[\uf0b7•]\s+([A-Ea-e])[:\)]\s*(.+)', line)
            if bullet_match:
                respuesta_letra = bullet_match.group(1).upper()
                respuesta_texto = bullet_match.group(2).strip()
                current_respuestas.append({
                    'opcion': respuesta_letra,
                    'texto': respuesta_texto
                })
                i += 1
                continue
            
            # Bullet sin letra explícita - asignar letra automáticamente
            bullet_match = re.match(r'\s*[\uf0b7•]\s+(.+)', line)
            if bullet_match:
                respuesta_texto = bullet_match.group(1).strip()
                
                # Determinar la letra de la opción
                if current_respuestas:
                    ultima_opcion = current_respuestas[-1]['opcion']
                    siguiente_letra = chr(ord(ultima_opcion) + 1)
                else:
                    siguiente_letra = 'A'
                
                if siguiente_letra <= 'E':
                    current_respuestas.append({
                        'opcion': siguiente_letra,
                        'texto': respuesta_texto
                    })
                i += 1
                continue
        
        # Texto continuo: parte de pregunta o respuesta
        if current_pregunta:
            if current_respuestas:
                # Agregar a la última respuesta (solo si no empieza con •)
                if '•' not in line or not re.match(r'\s*[•]', line):
                    if current_respuestas[-1]['texto'] and not current_respuestas[-1]['texto'].endswith(' '):
                        current_respuestas[-1]['texto'] += ' '
                    current_respuestas[-1]['texto'] += line_clean
            else:
                # Verificar si la línea contiene bullet al inicio (sería una respuesta, no parte de la pregunta)
                if ('•' not in line and '\uf0b7' not in line) or not re.match(r'\s*[\uf0b7•]', line):
                    # Agregar a la pregunta
                    if current_pregunta['texto'] and not current_pregunta['texto'].endswith(' '):
                        current_pregunta['texto'] += ' '
                    current_pregunta['texto'] += line_clean
        
        i += 1
    
    # Guardar última pregunta y materia
    if current_pregunta and current_materia:
        if current_respuestas:
            current_pregunta['respuestas'] = current_respuestas
        current_materia['preguntas'].append(current_pregunta)
    
    if current_materia and current_materia['preguntas']:
        materias.append(current_materia)
    
    return materias


def process_txt_to_json(txt_path, output_path):
    """Procesa el TXT y genera el JSON"""
    print(f"Leyendo archivo TXT: {txt_path}")
    
    with open(txt_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    print("Procesando texto y extrayendo estructura...")
    
    # Identificar estructura
    materias = identify_materias_and_preguntas(text)
    
    # Guardar JSON
    output_data = {
        'banco_preguntas': materias,
        'total_materias': len(materias),
        'total_preguntas': sum(len(m['preguntas']) for m in materias)
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ JSON generado exitosamente: {output_path}")
    print(f"📊 Total de materias: {len(materias)}")
    print(f"📊 Total de preguntas: {sum(len(m['preguntas']) for m in materias)}")
    
    # Mostrar resumen por materia
    print("\n📚 Resumen por materia:")
    for materia in materias:
        print(f"  • {materia['materia']}: {len(materia['preguntas'])} preguntas")
    
    return output_data


if __name__ == "__main__":
    txt_path = Path("BAnco de Preguntas Examen Complexivo Periodo 2025-2026 (1).txt")
    output_path = Path("banco_preguntas.json")
    
    if not txt_path.exists():
        print(f"❌ Error: No se encontró el archivo TXT: {txt_path}")
        sys.exit(1)
    
    try:
        process_txt_to_json(txt_path, output_path)
    except Exception as e:
        print(f"❌ Error al procesar el TXT: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

