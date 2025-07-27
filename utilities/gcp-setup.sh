#!/bin/bash

echo "☁️  Setting up Haxbotron for Google Cloud Platform..."

# Check if gcloud is installed
if ! command -v gcloud >/dev/null 2>&1; then
    echo "❌ Google Cloud SDK not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Configure firewall rules
echo "🔥 Setting up GCP firewall rules..."

# Core server firewall rule
gcloud compute firewall-rules create haxbotron-core \
    --allow tcp:12001 \
    --source-ranges 0.0.0.0/0 \
    --description "Haxbotron Core Server" \
    --quiet 2>/dev/null || echo "✅ Core firewall rule already exists"

# DB server firewall rule
gcloud compute firewall-rules create haxbotron-db \
    --allow tcp:13001 \
    --source-ranges 0.0.0.0/0 \
    --description "Haxbotron Database Server" \
    --quiet 2>/dev/null || echo "✅ DB firewall rule already exists"

# SSH access
gcloud compute firewall-rules create allow-ssh \
    --allow tcp:22 \
    --source-ranges 0.0.0.0/0 \
    --description "SSH Access" \
    --quiet 2>/dev/null || echo "✅ SSH firewall rule already exists"

echo ""
echo "🎉 GCP setup complete!"
echo ""
echo "Firewall rules created:"
echo "  - haxbotron-core: TCP 12001"
echo "  - haxbotron-db: TCP 13001"
echo "  - allow-ssh: TCP 22"
echo ""
echo "Your external IP:"
curl -s ifconfig.me 2>/dev/null && echo "" || echo "Unable to get external IP"
echo ""
echo "After starting your servers, access them at:"
echo "  Web interface: http://YOUR_EXTERNAL_IP:12001"
echo "  Database API:  http://YOUR_EXTERNAL_IP:13001"