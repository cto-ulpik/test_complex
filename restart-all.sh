#!/bin/bash

echo "🛑 Deteniendo todos los procesos..."
echo ""

# Detener procesos en puerto 5001 (backend)
if lsof -ti:5001 > /dev/null 2>&1; then
    echo "   Deteniendo servidor backend (puerto 5001)..."
    lsof -ti:5001 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Detener procesos en puerto 3000 (frontend)
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   Deteniendo frontend (puerto 3000)..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo "✅ Todos los procesos detenidos"
echo ""
echo "⏳ Esperando 2 segundos..."
sleep 2

echo ""
echo "🚀 Iniciando servidor backend..."
echo "   (Mantén esta terminal abierta)"
echo ""
npm start

