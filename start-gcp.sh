#!/bin/bash

echo "🚀 Starting Haxbotron on Google Cloud Platform..."

# Set Node.js options for OpenSSL compatibility
export NODE_OPTIONS="--openssl-legacy-provider"

# Kill any existing processes
echo "🔄 Stopping existing processes..."
pkill -f "node.*haxbotron" || true
sleep 2

# Start DB server in background
echo "🗄️  Starting DB server..."
cd db
nohup npm start > ../logs/db.log 2>&1 &
DB_PID=$!
echo "DB Server started with PID: $DB_PID"

# Wait for DB server to start
sleep 5

# Start Core server in background
echo "🌐 Starting Core server..."
cd ../core
nohup npm start > ../logs/core.log 2>&1 &
CORE_PID=$!
echo "Core Server started with PID: $CORE_PID"

# Create logs directory if it doesn't exist
mkdir -p ../logs

# Save PIDs for later management
echo $DB_PID > ../logs/db.pid
echo $CORE_PID > ../logs/core.pid

echo ""
echo "✅ Haxbotron started successfully!"
echo "📊 DB Server PID: $DB_PID"
echo "🌐 Core Server PID: $CORE_PID"
echo ""
echo "🌍 Access your server at:"
echo "   Web Interface: http://$(curl -s ifconfig.me):12001"
echo "   Database API:  http://$(curl -s ifconfig.me):13001"
echo ""
echo "📋 To monitor logs:"
echo "   tail -f logs/core.log"
echo "   tail -f logs/db.log"
echo ""
echo "🛑 To stop servers:"
echo "   ./stop-gcp.sh"