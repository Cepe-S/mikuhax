#!/bin/bash

echo "🔧 Setting up PM2 for Haxbotron..."

# Install PM2 globally if not installed
if ! command -v pm2 >/dev/null 2>&1; then
    echo "📦 Installing PM2..."
    npm install -g pm2
else
    echo "✅ PM2 already installed"
fi

# Stop any existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start services using PM2 config
echo "🚀 Starting services with PM2..."
pm2 start pm2.config.js

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
echo "⚙️  Setting up PM2 startup script..."
pm2 startup

echo ""
echo "🎉 PM2 setup complete!"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 status          - Show process status"
echo "  pm2 logs            - Show logs"
echo "  pm2 restart all     - Restart all processes"
echo "  pm2 stop all        - Stop all processes"
echo "  pm2 delete all      - Delete all processes"
echo ""
echo "Your server is now running in production mode!"