#!/bin/bash
set -e

export NODE_OPTIONS="--openssl-legacy-provider"

# Configurar para conexiones externas
if [ ! -f "core/.env" ]; then
    cp core/.env.sample core/.env
    sed -i 's/SERVER_WHITELIST_IP = "127.0.0.1"/SERVER_WHITELIST_IP = ""/' core/.env
fi

if [ ! -f "db/.env" ]; then
    cp db/.env.sample db/.env
    sed -i 's/SERVER_WHITELIST_IP = "::ffff:127.0.0.1,127.0.0.1"/SERVER_WHITELIST_IP = ""/' db/.env
fi

# Iniciar servidores
echo "🚀 Iniciando Haxbotron..."

# Iniciar DB server
(cd db && npm start) &
DB_PID=$!
echo "DB Server iniciado (PID: $DB_PID)"
sleep 5

# Iniciar Core server
(cd core && npm start) &
CORE_PID=$!
echo "Core Server iniciado (PID: $CORE_PID)"

# Mostrar información
EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || echo "No detectada")
echo ""
echo "✅ Servidores iniciados en segundo plano"
echo "🌐 Web: http://$EXTERNAL_IP:12001"
echo "🗄️ DB: http://$EXTERNAL_IP:13001"
echo ""
echo "Para detener: sudo pkill -f node"
echo "Para ver logs: tail -f core/.logs/info/*.log"