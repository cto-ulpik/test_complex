#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Programa para convertir el banco de preguntas PDF a JSON
Extrae materias, preguntas y respuestas del PDF
"""

import json
import re
import sys
from pathlib import Path

# Intentar importar diferentes librerías de PDF
pdf_library = None
try:
    import pdfplumber
    pdf_library = 'pdfplumber'
except ImportError:
    try:
        import PyPDF2
        pdf_library = 'PyPDF2'
    except ImportError:
        try:
            import fitz  # PyMuPDF
            pdf_library = 'PyMuPDF'
        except ImportError:
            print("Error: No se encontró ninguna librería de PDF instalada.")
            print("Por favor instala una de las siguientes:")
            print("  pip install pdfplumber")
            print("  pip install PyPDF2")
            print("  pip install PyMuPDF")
            sys.exit(1)


def extract_text_from_pdf(pdf_path):
    """Extrae todo el texto del PDF"""
    text = ""
    
    if pdf_library == 'pdfplumber':
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    elif pdf_library == 'PyPDF2':
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    elif pdf_library == 'PyMuPDF':
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_text = page.get_text()
            if page_text:
                text += page_text + "\n"
        doc.close()
    
    return text


def extract_respuestas_from_text(texto_pregunta):
    """Extrae respuestas que están incrustadas en el texto de la pregunta"""
    respuestas = []
    # Buscar patrones de bullet (• o \uf0b7) seguido de texto
    # El carácter puede ser • (U+2022) o \uf0b7 (bullet de fuente especial)
    patrones = re.finditer(r'[\uf0b7•]\s+([^\uf0b7•]+?)(?=[\uf0b7•]|$)', texto_pregunta)
    for match in patrones:
        respuesta_texto = match.group(1).strip()
        if respuesta_texto and len(respuesta_texto) > 2:  # Filtrar respuestas muy cortas
            letra = chr(ord('A') + len(respuestas))
            if letra <= 'E':
                respuestas.append({
                    'opcion': letra,
                    'texto': respuesta_texto
                })
    
    # Si se encontraron respuestas, limpiar el texto de la pregunta
    if respuestas:
        # Remover las respuestas del texto de la pregunta
        texto_limpio = re.sub(r'[\uf0b7•]\s+[^\uf0b7•]+', '', texto_pregunta).strip()
        return texto_limpio, respuestas
    
    return texto_pregunta, []


def identify_materias_and_preguntas(text):
    """Identifica materias y sus preguntas/respuestas"""
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
        
        # Detectar materia: "Banco de Preguntas: [Nombre]" o "Banco de Preguntas [Nombre]" (con o sin dos puntos)
        materia_match = re.match(r'Banco de Preguntas\s*:?\s*(.+)', line_clean, re.IGNORECASE)
        # También detectar "BANCO DE PREGUNTAS GENERADO [Nombre]"
        if not materia_match:
            materia_match = re.match(r'BANCO DE PREGUNTAS\s+(?:GENERADO\s+)?(.+)', line_clean, re.IGNORECASE)
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
            # Convertir a formato título (primera letra mayúscula, resto minúsculas)
            if materia_nombre.isupper() and len(materia_nombre) > 1:
                materia_nombre = materia_nombre.capitalize()
            
            # Nueva materia
            current_materia = {
                'materia': materia_nombre,
                'preguntas': []
            }
            current_pregunta = None
            current_respuestas = []
            i += 1
            continue
        
        # Detectar pregunta: "Pregunta X:" o "Pregunta X" (con o sin dos puntos)
        # También detectar preguntas que empiezan solo con número: "1.", "2.", etc.
        pregunta_match = re.match(r'Pregunta\s+(\d+)[:\s]*(.+)', line_clean, re.IGNORECASE)
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
            pregunta_texto = pregunta_match.group(2).strip()
            
            # Si no hay texto después de "Pregunta X", la siguiente línea es el texto
            if not pregunta_texto and i + 1 < len(lines):
                next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""
                next_line_clean = re.sub(r'^[•\s]+', '', next_line)
                # Si la siguiente línea no es una respuesta (no empieza con bullet o A-E:), es parte de la pregunta
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
                # Si hay texto pendiente en la pregunta, agregarlo
                if current_pregunta['texto'] and not current_pregunta['texto'].endswith(' '):
                    current_pregunta['texto'] += ' '
                
                respuesta_letra = respuesta_match.group(1).upper()  # Convertir a mayúscula
                respuesta_texto = respuesta_match.group(2).strip()
                current_respuestas.append({
                    'opcion': respuesta_letra,
                    'texto': respuesta_texto
                })
            i += 1
            continue
        
        # Detectar respuesta sin letra explícita: solo bullet (• o \uf0b7) seguido de texto
        # Buscar bullet en la línea original (puede tener espacios antes)
        if current_pregunta and ('•' in line or '\uf0b7' in line):
            # Verificar si la línea empieza con bullet (después de espacios opcionales)
            bullet_match = re.match(r'\s*[\uf0b7•]\s+(.+)', line)
            if bullet_match:
                respuesta_texto = bullet_match.group(1).strip()
                
                # Determinar la letra de la opción
                if current_respuestas:
                    # Inferir la siguiente letra basándose en la última respuesta
                    ultima_opcion = current_respuestas[-1]['opcion']
                    siguiente_letra = chr(ord(ultima_opcion) + 1)
                else:
                    # Primera respuesta, usar 'A'
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
    
    # Post-procesamiento: extraer respuestas incrustadas en el texto de las preguntas
    for materia in materias:
        for pregunta in materia['preguntas']:
            if not pregunta['respuestas'] or len(pregunta['respuestas']) == 0:
                # Intentar extraer respuestas del texto
                texto_limpio, respuestas_extraidas = extract_respuestas_from_text(pregunta['texto'])
                if respuestas_extraidas:
                    pregunta['texto'] = texto_limpio
                    pregunta['respuestas'] = respuestas_extraidas
    
    return materias


def process_pdf_to_json(pdf_path, output_path):
    """Procesa el PDF y genera el JSON"""
    print(f"Extrayendo texto del PDF: {pdf_path}")
    text = extract_text_from_pdf(pdf_path)
    
    print("Procesando texto y extrayendo estructura...")
    # Guardar texto completo primero para análisis
    with open('texto_extraido.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Texto extraído guardado en 'texto_extraido.txt' para referencia")
    
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
    
    print(f"\nJSON generado exitosamente: {output_path}")
    print(f"Total de materias: {len(materias)}")
    print(f"Total de preguntas: {sum(len(m['preguntas']) for m in materias)}")
    
    return output_data


def process_alternative_method(text):
    """Método alternativo para procesar el texto (usar el mismo método principal)"""
    return identify_materias_and_preguntas(text)


if __name__ == "__main__":
    pdf_path = Path("BAnco de Preguntas Examen Complexivo Periodo 2025-2026 (1).pdf")
    output_path = Path("banco_preguntas.json")
    
    if not pdf_path.exists():
        print(f"Error: No se encontró el archivo PDF: {pdf_path}")
        sys.exit(1)
    
    try:
        process_pdf_to_json(pdf_path, output_path)
    except Exception as e:
        print(f"Error al procesar el PDF: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

