#!/bin/bash

echo "🛑 Stopping Haxbotron servers..."

# Read PIDs from files
if [ -f logs/core.pid ]; then
    CORE_PID=$(cat logs/core.pid)
    echo "Stopping Core Server (PID: $CORE_PID)..."
    kill $CORE_PID 2>/dev/null || echo "Core server already stopped"
    rm -f logs/core.pid
fi

if [ -f logs/db.pid ]; then
    DB_PID=$(cat logs/db.pid)
    echo "Stopping DB Server (PID: $DB_PID)..."
    kill $DB_PID 2>/dev/null || echo "DB server already stopped"
    rm -f logs/db.pid
fi

# Force kill any remaining processes
pkill -f "node.*haxbotron" || true

echo "✅ All servers stopped"