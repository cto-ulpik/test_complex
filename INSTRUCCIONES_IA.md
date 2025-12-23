# Instrucciones para Marcar Respuestas con IA

## Configuración

1. **Obtener API Key de OpenAI:**
   - Ve a https://platform.openai.com/api-keys
   - Crea una nueva API key
   - Copia la clave

2. **Configurar la API Key:**
   ```bash
   export OPENAI_API_KEY=tu_api_key_aqui
   ```

## Ejecutar el Script

```bash
npm run marcar-ia
```

El script:
- Analizará todas las preguntas usando GPT-4
- Solo marcará respuestas cuando esté 100% seguro
- Si una pregunta es ambigua o no puede determinarse, la dejará sin marcar
- Mostrará un resumen al final

## Resultados

- **Verde**: Preguntas con respuesta correcta marcada
- **Rojo**: Preguntas pendientes de revisar (sin respuesta correcta o inciertas)

## Notas

- El script procesa las preguntas secuencialmente para evitar sobrecargar la API
- Hay una pausa de 1 segundo entre cada pregunta
- El proceso puede tardar varias horas dependiendo del número de preguntas
- Se recomienda ejecutarlo en background o durante la noche

