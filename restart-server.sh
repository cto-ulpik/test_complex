#!/bin/bash

echo "🛑 Deteniendo servidor en puerto 5001..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || echo "No hay procesos en el puerto 5001"

echo "⏳ Esperando 2 segundos..."
sleep 2

echo "✅ Verificando que el puerto está libre..."
if lsof -ti:5001 > /dev/null 2>&1; then
    echo "❌ El puerto 5001 todavía está en uso. Intenta detenerlo manualmente."
    exit 1
fi

echo "🚀 Iniciando servidor..."
npm start

