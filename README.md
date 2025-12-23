# Banco de Preguntas - Sistema de Gestión con IA

Sistema completo para gestionar un banco de preguntas de examen complexivo, con funcionalidades de edición, marcado automático con IA, y una interfaz web moderna.

## 🚀 Características

- **Frontend React**: Interfaz moderna y responsive
- **Backend Node.js/Express**: API RESTful
- **Base de datos SQLite**: Almacenamiento local
- **Integración con IA (OpenAI)**: Marcado automático de respuestas correctas
- **Edición de preguntas y respuestas**: Interfaz intuitiva para modificar contenido
- **Visualización de respuestas correctas**: Indicadores visuales (verde/rojo)
- **Búsqueda de preguntas**: Búsqueda rápida en todo el banco

## 📋 Requisitos

- Node.js (v14 o superior)
- npm o yarn
- Python 3 (para scripts de importación)
- API Key de OpenAI (opcional, para marcado automático con IA)

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/cto-ulpik/test_complex.git
cd test_complex
```

2. **Instalar dependencias del backend**
```bash
npm install
```

3. **Instalar dependencias del frontend**
```bash
cd frontend
npm install
cd ..
```

4. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env y agregar tu OPENAI_API_KEY (opcional)
```

## 📊 Importar Datos

### Opción 1: Desde archivo TXT
```bash
python3 txt_to_json.py
npm run import
```

### Opción 2: Desde archivo PDF
```bash
python3 pdf_to_json.py
npm run import
```

## 🎯 Uso

### Iniciar el servidor backend
```bash
npm start
# O en modo desarrollo:
npm run dev
```

El servidor se ejecutará en `http://localhost:5001`

### Iniciar el frontend
```bash
cd frontend
npm start
```

El frontend se ejecutará en `http://localhost:3000`

## 🤖 Marcado Automático con IA

Para marcar respuestas correctas automáticamente usando IA:

1. Configurar `OPENAI_API_KEY` en el archivo `.env`
2. Ejecutar el script:
```bash
npm run marcar-ia
```

El script:
- Analiza todas las preguntas con GPT-4
- Solo marca respuestas cuando está 100% seguro
- Deja sin marcar preguntas ambiguas o inciertas
- Procesa secuencialmente para evitar errores

## 📁 Estructura del Proyecto

```
BancoPreguntas/
├── frontend/              # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   └── App.js         # Componente principal
│   └── package.json
├── scripts/
│   ├── importData.js      # Script de importación a BD
│   └── marcarRespuestasIA.js  # Script de marcado con IA
├── database/              # Base de datos SQLite
├── server.js              # Servidor Express
├── txt_to_json.py         # Conversor TXT a JSON
├── pdf_to_json.py         # Conversor PDF a JSON
└── package.json           # Dependencias del backend
```

## 🎨 Funcionalidades de la Interfaz

### Lista de Preguntas
- **Verde**: Preguntas con respuesta correcta marcada
- **Rojo**: Preguntas pendientes de revisar
- **Respuesta oculta**: Click para revelar la respuesta correcta

### Edición
- **Editar pregunta**: Modificar el texto de la pregunta
- **Editar respuesta**: Modificar texto y estado de correcta/incorrecta
- **Marcar como correcta**: Botón para cambiar el estado

## 🔒 Seguridad

- El archivo `.env` está en `.gitignore` (no se sube al repositorio)
- Las API keys no se exponen en el código
- La base de datos se mantiene local

## 📝 Scripts Disponibles

- `npm start`: Inicia el servidor backend
- `npm run dev`: Inicia el servidor en modo desarrollo (nodemon)
- `npm run import`: Importa datos desde JSON a la base de datos
- `npm run marcar-ia`: Ejecuta el marcado automático con IA
- `npm run client`: Instala dependencias del frontend
- `npm run client-install`: Instala dependencias del frontend

## 🗄️ Base de Datos

### Tablas
- **materias**: Almacena las materias
- **preguntas**: Almacena las preguntas
- **respuestas**: Almacena las opciones de respuesta con campo `es_correcta`

## 📚 Materias Incluidas

- Arquitectura de Computadoras
- Base de Datos
- Gestión de Redes
- Ingeniería del Software y Gestión de Proyectos
- Inteligencia Artificial
- Metodología de la Programación
- Programación Avanzada
- Sistemas de Información
- Sistemas Operativos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 👤 Autor

Proyecto desarrollado para el Banco de Preguntas del Examen Complexivo 2025-2026

## 🙏 Agradecimientos

- OpenAI por la API de GPT-4
- Comunidad de React y Node.js
