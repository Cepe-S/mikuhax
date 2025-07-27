#!/bin/bash

echo "🚀 Starting Haxbotron servers..."

# Check if Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found. Please run setup-linux.sh first."
    exit 1
fi

# Check if project is built
if [ ! -d "core/out" ] || [ ! -d "db/out" ]; then
    echo "⚠️  Project not built. Building now..."
    npm run quick:build || npm run build:force
fi

# Set Node.js options
export NODE_OPTIONS="--openssl-legacy-provider"

echo "Starting DB server..."
cd db && npm start &
DB_PID=$!

echo "Waiting for DB server to start..."
sleep 5

echo "Starting Core server..."
cd ../core && npm start &
CORE_PID=$!

echo ""
echo "🎉 Servers started!"
echo "DB Server PID: $DB_PID"
echo "Core Server PID: $CORE_PID"
echo ""
echo "Access your server at:"
echo "  Web interface: http://localhost:12001"
echo "  Database API:  http://localhost:13001"
echo ""
echo "To stop servers, press Ctrl+C or run:"
echo "  kill $DB_PID $CORE_PID"

# Wait for both processes
wait $DB_PID $CORE_PID