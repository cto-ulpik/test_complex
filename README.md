# Banco de Preguntas - Sistema de Gestión

Sistema web para gestionar y visualizar el banco de preguntas del Examen Complexivo 2025-2026.

## Características

- ✅ Base de datos SQLite para almacenar materias, preguntas y respuestas
- ✅ Backend API REST con Express
- ✅ Frontend React con interfaz moderna
- ✅ Búsqueda de preguntas
- ✅ Visualización por materias
- ✅ Detalle completo de preguntas con respuestas

## Estructura del Proyecto

```
banco-preguntas/
├── database/           # Base de datos SQLite
├── frontend/          # Aplicación React
├── scripts/           # Scripts de importación
├── server.js         # Servidor Express
└── package.json      # Dependencias del backend
```

## Instalación

### 1. Instalar dependencias del backend

```bash
npm install
```

### 2. Instalar dependencias del frontend

```bash
cd frontend
npm install
cd ..
```

### 3. Importar datos a la base de datos

```bash
npm run import
```

Este comando leerá el archivo `banco_preguntas.json` y creará la base de datos SQLite con todas las materias, preguntas y respuestas.

## Uso

### Iniciar el servidor backend

```bash
npm start
```

El servidor se ejecutará en `http://localhost:5000`

### Iniciar el frontend (en otra terminal)

```bash
npm run client
```

O desde el directorio frontend:

```bash
cd frontend
npm start
```

El frontend se ejecutará en `http://localhost:3000`

## API Endpoints

- `GET /api/materias` - Obtener todas las materias
- `GET /api/materias/:id/preguntas` - Obtener preguntas de una materia
- `GET /api/materias/:id/preguntas-completas` - Obtener preguntas con respuestas
- `GET /api/preguntas/:id` - Obtener una pregunta con sus respuestas
- `GET /api/buscar?q=query` - Buscar preguntas

## Base de Datos

La base de datos SQLite contiene tres tablas:

- **materias**: Almacena las materias
- **preguntas**: Almacena las preguntas con referencia a la materia
- **respuestas**: Almacena las respuestas con referencia a la pregunta

## Tecnologías

- **Backend**: Node.js, Express, SQLite3
- **Frontend**: React, Axios
- **Base de Datos**: SQLite

