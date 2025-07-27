#!/bin/bash
set -e

echo "🚀 Setting up Haxbotron for Linux/Ubuntu..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js version
NODE_VERSION=$(node --version)
echo "✅ Node.js installed: $NODE_VERSION"

# Install Chrome dependencies
echo "📦 Installing Chrome and dependencies..."
sudo apt-get install -y wget gnupg
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Install additional dependencies for Puppeteer
echo "📦 Installing Puppeteer dependencies..."
sudo apt-get install -y libnss3-dev libatk-bridge2.0-dev libdrm-dev libxcomposite-dev libxdamage-dev libxrandr-dev libgbm-dev libxss-dev libasound2-dev

# Install TypeScript globally
echo "📦 Installing TypeScript globally..."
sudo npm install -g typescript

# Clean any existing builds
echo "🧹 Cleaning existing builds..."
rm -rf core/out db/out core/node_modules db/node_modules node_modules

# Install packages
echo "📦 Installing project packages..."
npm run quick:install

# Build project with force flag if needed
echo "🔨 Building project..."
if npm run quick:build; then
    echo "✅ Build successful!"
else
    echo "⚠️  Standard build failed, trying force build..."
    npm run build:force
    echo "✅ Force build completed!"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the servers:"
echo "1. Terminal 1: npm run quick:start:db"
echo "2. Terminal 2: npm run quick:start:core"
echo ""
echo "Web interface will be available at: http://localhost:12001"
echo "Database API will be available at: http://localhost:13001"