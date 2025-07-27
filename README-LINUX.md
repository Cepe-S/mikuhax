# Haxbotron Linux Setup Guide

This guide provides instructions for setting up Haxbotron on Ubuntu/Linux systems.

## Quick Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dapucita/haxbotron.git
   cd haxbotron
   ```

2. **Run the automated setup:**
   ```bash
   chmod +x setup-linux.sh
   ./setup-linux.sh
   ```

3. **Start the servers:**
   ```bash
   # Terminal 1 - Database Server
   npm run quick:start:db
   
   # Terminal 2 - Core Server
   npm run quick:start:core
   ```

## Manual Setup

If the automated setup fails, follow these manual steps:

### Prerequisites

1. **Install Node.js 20.x:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install Chrome:**
   ```bash
   wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
   sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
   sudo apt-get update
   sudo apt-get install -y google-chrome-stable
   ```

3. **Install dependencies:**
   ```bash
   sudo apt-get install -y libnss3-dev libatk-bridge2.0-dev libdrm-dev libxcomposite-dev libxdamage-dev libxrandr-dev libgbm-dev libxss-dev libasound2-dev
   ```

### Build Process

1. **Install packages:**
   ```bash
   npm run quick:install
   ```

2. **Build project:**
   ```bash
   npm run quick:build
   ```

3. **If build fails, use force build:**
   ```bash
   npm run build:force
   ```

## Troubleshooting

### TypeScript Errors
If you encounter TypeScript compilation errors, the project has been configured with relaxed type checking for Linux compatibility. Use the force build command:

```bash
npm run build:force
```

### Port Configuration
- Core Server: Port 12001
- DB Server: Port 13001

Make sure these ports are available and not blocked by firewall.

### Chrome/Puppeteer Issues
If Puppeteer fails to launch Chrome, ensure all dependencies are installed:

```bash
sudo apt-get install -y libnss3-dev libatk-bridge2.0-dev libdrm-dev libxcomposite-dev libxdamage-dev libxrandr-dev libgbm-dev libxss-dev libasound2-dev
```

## Google Cloud Platform

For GCP deployment, ensure the following firewall rules are configured:

```bash
# Core server
gcloud compute firewall-rules create haxbotron-core --allow tcp:12001 --source-ranges 0.0.0.0/0

# DB server  
gcloud compute firewall-rules create haxbotron-db --allow tcp:13001 --source-ranges 0.0.0.0/0

# SSH access
gcloud compute firewall-rules create allow-ssh --allow tcp:22 --source-ranges 0.0.0.0/0
```

## Production Deployment

For production, consider using PM2:

```bash
# Install PM2
sudo npm install -g pm2

# Start services
pm2 start --name "haxbotron-db" --cwd ./db npm -- start
pm2 start --name "haxbotron-core" --cwd ./core npm -- start

# Save configuration
pm2 save
pm2 startup
```

## Support

If you encounter issues, check:
1. Node.js version (should be 20.x or higher)
2. All dependencies are installed
3. Ports 12001 and 13001 are available
4. Chrome is properly installed with all dependencies