# Haxbotron Utilities

This directory contains utility scripts for setting up and managing Haxbotron servers.

## Setup Scripts

### `setup-linux.sh`
Complete setup script for Ubuntu/Linux systems. Installs all dependencies, builds the project, and provides startup instructions.

```bash
chmod +x utilities/setup-linux.sh
./utilities/setup-linux.sh
```

### `firewall-setup.sh`
Configures firewall rules for Haxbotron ports (22, 12001, 13001). Works with UFW and firewalld.

```bash
chmod +x utilities/firewall-setup.sh
./utilities/firewall-setup.sh
```

### `gcp-setup.sh`
Sets up Google Cloud Platform firewall rules for Haxbotron deployment.

```bash
chmod +x utilities/gcp-setup.sh
./utilities/gcp-setup.sh
```

## Server Management Scripts

### `start-servers.sh`
Simple script to start both DB and Core servers in development mode.

```bash
chmod +x utilities/start-servers.sh
./utilities/start-servers.sh
```

### `pm2-setup.sh`
Sets up PM2 process manager for production deployment.

```bash
chmod +x utilities/pm2-setup.sh
./utilities/pm2-setup.sh
```

## Quick Start Guide

1. **Initial Setup:**
   ```bash
   ./utilities/setup-linux.sh
   ```

2. **Configure Firewall:**
   ```bash
   ./utilities/firewall-setup.sh
   ```

3. **Start Servers:**
   
   **Development:**
   ```bash
   ./utilities/start-servers.sh
   ```
   
   **Production:**
   ```bash
   ./utilities/pm2-setup.sh
   ```

## Port Configuration

- **Core Server:** 12001 (Web interface)
- **DB Server:** 13001 (Database API)
- **SSH:** 22 (Remote access)

## Cloud Deployment

For Google Cloud Platform deployment, use the GCP setup script after the initial setup:

```bash
./utilities/gcp-setup.sh
```

## Troubleshooting

If you encounter issues:

1. Check Node.js version: `node --version` (should be 20.x+)
2. Verify all dependencies are installed
3. Ensure ports are not blocked by firewall
4. Check logs in `./logs/` directory
5. Use force build if TypeScript errors occur: `npm run build:force`