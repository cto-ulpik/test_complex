# Vista Previa del Proyecto - Banco de Preguntas

## 🎨 Interfaz de Usuario

### Pantalla Principal

```
┌─────────────────────────────────────────────────────────────┐
│                    BANCO DE PREGUNTAS                        │
│              Examen Complexivo 2025-2026                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────────────────────────────────┐
│   SIDEBAR    │  │          CONTENIDO PRINCIPAL              │
│              │  │                                            │
│ 🔍 [Buscar]  │  │  Bienvenido al Banco de Preguntas         │
│              │  │                                            │
│ MATERIAS:    │  │  Selecciona una materia del menú         │
│              │  │  lateral para comenzar.                    │
│ ┌──────────┐│  │                                            │
│ │Sistemas  ││  │  ┌──────────────┐                          │
│ │Operativos││  │  │     9        │                          │
│ └──────────┘│  │  │   Materias   │                          │
│              │  │  └──────────────┘                          │
│ ┌──────────┐│  │                                            │
│ │Arquitect.││  │                                            │
│ │Computador││  │                                            │
│ └──────────┘│  │                                            │
│              │  │                                            │
│ ┌──────────┐│  │                                            │
│ │Base de   ││  │                                            │
│ │Datos     ││  │                                            │
│ └──────────┘│  │                                            │
│              │  │                                            │
│ ... (9)     │  │                                            │
└──────────────┘  └──────────────────────────────────────────┘
```

### Vista de Preguntas de una Materia

```
┌──────────────┐  ┌──────────────────────────────────────────┐
│   SIDEBAR    │  │     PREGUNTAS (55)                       │
│              │  │                                            │
│ ← Volver     │  │  ┌──────────────────────────────────────┐ │
│              │  │  │ Pregunta 1                   4 opc.  │ │
│              │  │  │ Al iniciar una operación de E/S...   │ │
│              │  │  └──────────────────────────────────────┘ │
│              │  │                                            │
│              │  │  ┌──────────────────────────────────────┐ │
│              │  │  │ Pregunta 2                   4 opc.  │ │
│              │  │  │ Complete. Con el mecanismo de...      │ │
│              │  │  └──────────────────────────────────────┘ │
│              │  │                                            │
│              │  │  ┌──────────────────────────────────────┐ │
│              │  │  │ Pregunta 3                   4 opc.  │ │
│              │  │  │ ¿Con qué algoritmo se resuelve...   │ │
│              │  │  └──────────────────────────────────────┘ │
│              │  │                                            │
│              │  │  ... (55 preguntas)                       │
└──────────────┘  └──────────────────────────────────────────┘
```

### Vista Detallada de una Pregunta

```
┌─────────────────────────────────────────────────────────────┐
│                    BANCO DE PREGUNTAS                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ ← Volver a la lista                                          │
│                                                               │
│ Pregunta 1                                                    │
│ ──────────────────────────────────────────────────────────── │
│                                                               │
│ Al iniciar una operación de E/S controlada a través de una   │
│ interrupción; representa un desperdicio de capacidad de      │
│ proceso cuando se usa para movimientos masivos de datos,      │
│ como en la E/S de disco. Para resolver este problema se      │
│ utiliza:                                                      │
│                                                               │
│ Opciones de respuesta:                                        │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ A)  DMA (acceso directo a memoria)                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ B)  Procesamiento por lotes                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ C)  RAM (Memoria de acceso aleatorio)                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ D)  Procesadores simétricos                             │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## 🎨 Características de Diseño

### Colores y Estilos
- **Header**: Gradiente púrpura (#667eea → #764ba2)
- **Materias**: Botones con gradiente púrpura, efecto hover
- **Preguntas**: Cards con borde izquierdo púrpura
- **Respuestas**: Cards con borde izquierdo morado oscuro
- **Búsqueda**: Barra de búsqueda con icono

### Componentes React

1. **App.js** - Componente principal que maneja el estado
2. **MateriaList** - Lista de materias clickeables
3. **PreguntaList** - Lista de preguntas de una materia
4. **PreguntaDetail** - Vista detallada con respuestas
5. **SearchBar** - Búsqueda en tiempo real

## 📊 Estructura de Datos

### Base de Datos SQLite

```
materias
├── id (PK)
└── nombre

preguntas
├── id (PK)
├── materia_id (FK → materias.id)
├── numero
└── texto

respuestas
├── id (PK)
├── pregunta_id (FK → preguntas.id)
├── opcion (A, B, C, D)
└── texto
```

## 🚀 Funcionalidades

✅ **Navegación por Materias**: Click en una materia para ver sus preguntas
✅ **Lista de Preguntas**: Vista de todas las preguntas de una materia
✅ **Detalle de Pregunta**: Vista completa con todas las respuestas
✅ **Búsqueda**: Buscar preguntas por texto en todas las materias
✅ **Responsive**: Diseño adaptable a móviles y tablets
✅ **Sin Modificaciones**: Las preguntas y respuestas se mantienen exactas

## 📡 API Endpoints

- `GET /api/materias` - Lista todas las materias
- `GET /api/materias/:id/preguntas-completas` - Preguntas con respuestas
- `GET /api/preguntas/:id` - Detalle de una pregunta
- `GET /api/buscar?q=query` - Búsqueda de preguntas

## 🎯 Flujo de Usuario

1. Usuario ve lista de 9 materias
2. Click en una materia → Ve lista de preguntas
3. Click en una pregunta → Ve detalle con respuestas
4. Puede buscar preguntas desde cualquier vista
5. Botones "Volver" para navegar hacia atrás


