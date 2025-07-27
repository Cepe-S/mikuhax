#!/bin/bash

echo "🔥 Configuring firewall for Haxbotron..."

if command -v ufw >/dev/null 2>&1; then
    echo "📦 Using UFW firewall..."
    sudo ufw --force enable
    sudo ufw allow 22/tcp comment "SSH"
    sudo ufw allow 12001/tcp comment "Haxbotron Core Server"
    sudo ufw allow 13001/tcp comment "Haxbotron DB Server"
    echo "✅ UFW firewall configured successfully"
    echo ""
    echo "Current firewall status:"
    sudo ufw status numbered
elif command -v firewall-cmd >/dev/null 2>&1; then
    echo "📦 Using firewalld..."
    sudo firewall-cmd --permanent --add-port=22/tcp
    sudo firewall-cmd --permanent --add-port=12001/tcp
    sudo firewall-cmd --permanent --add-port=13001/tcp
    sudo firewall-cmd --reload
    echo "✅ Firewalld configured successfully"
    echo ""
    echo "Current firewall status:"
    sudo firewall-cmd --list-ports
else
    echo "⚠️  No UFW or firewalld found. Please configure manually:"
    echo "   Required ports: 22 (SSH), 12001 (Core), 13001 (DB)"
    echo ""
    echo "For iptables, use:"
    echo "  sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT"
    echo "  sudo iptables -A INPUT -p tcp --dport 12001 -j ACCEPT"
    echo "  sudo iptables -A INPUT -p tcp --dport 13001 -j ACCEPT"
fi

echo ""
echo "🎉 Firewall setup complete!"
echo "Make sure your cloud provider security groups also allow these ports."