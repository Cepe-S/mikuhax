#!/bin/bash

echo "🔥 Configurando firewall..."

if command -v ufw >/dev/null 2>&1; then
    sudo ufw --force enable
    sudo ufw allow 22/tcp
    sudo ufw allow 12001/tcp
    sudo ufw allow 13001/tcp
    echo "✅ Firewall UFW configurado"
    sudo ufw status
elif command -v firewall-cmd >/dev/null 2>&1; then
    sudo firewall-cmd --permanent --add-port=22/tcp
    sudo firewall-cmd --permanent --add-port=12001/tcp
    sudo firewall-cmd --permanent --add-port=13001/tcp
    sudo firewall-cmd --reload
    echo "✅ Firewall firewalld configurado"
else
    echo "⚠️  No se encontró ufw ni firewalld. Configura manualmente:"
    echo "   Puertos a abrir: 22, 12001, 13001"
fi