# Instrucciones de Instalación y Uso

## Paso 1: Instalar dependencias del backend

```bash
npm install
```

## Paso 2: Instalar dependencias del frontend

```bash
cd frontend
npm install
cd ..
```

## Paso 3: Importar datos a la base de datos

```bash
npm run import
```

Este comando:
- Creará la base de datos SQLite en `database/banco_preguntas.db`
- Creará las tablas: materias, preguntas, respuestas
- Importará todas las preguntas del archivo `banco_preguntas.json`

## Paso 4: Iniciar el servidor backend

En una terminal:

```bash
npm start
```

El servidor estará disponible en: `http://localhost:5000`

## Paso 5: Iniciar el frontend

En otra terminal:

```bash
cd frontend
npm start
```

O desde la raíz:

```bash
npm run client
```

El frontend estará disponible en: `http://localhost:3000`

## Estructura de la Base de Datos

### Tabla: materias
- id (INTEGER PRIMARY KEY)
- nombre (TEXT UNIQUE)

### Tabla: preguntas
- id (INTEGER PRIMARY KEY)
- materia_id (INTEGER, FOREIGN KEY)
- numero (TEXT)
- texto (TEXT)

### Tabla: respuestas
- id (INTEGER PRIMARY KEY)
- pregunta_id (INTEGER, FOREIGN KEY)
- opcion (TEXT) - A, B, C, D, etc.
- texto (TEXT)

## Características

✅ Las preguntas y respuestas se almacenan exactamente como están en el PDF (sin modificaciones)
✅ Búsqueda de preguntas por texto
✅ Navegación por materias
✅ Visualización detallada de preguntas con todas sus respuestas
✅ Interfaz moderna y responsive

## Notas

- La base de datos SQLite se crea automáticamente al ejecutar el script de importación
- No se modifican las preguntas ni respuestas originales
- Todas las 9 materias y 752 preguntas se importan correctamente

