#!/bin/bash

echo "🔥 Configurando firewall..."

sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 12001/tcp
sudo ufw allow 13001/tcp

echo "✅ Firewall configurado"
sudo ufw status