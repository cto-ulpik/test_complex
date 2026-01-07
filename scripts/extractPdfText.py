#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para extraer texto de un PDF usando PyPDF2
"""

import PyPDF2
import sys
import os

if len(sys.argv) < 3:
    print("Uso: python3 extractPdfText.py <pdf_path> <output_path>")
    sys.exit(1)

pdf_path = sys.argv[1]
output_path = sys.argv[2]

try:
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ''
        for page in pdf_reader.pages:
            text += page.extract_text() + '\n'
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        
        print(f'✅ Texto extraído: {len(text)} caracteres, {len(pdf_reader.pages)} páginas')
except Exception as e:
    print(f'❌ Error: {e}')
    sys.exit(1)

