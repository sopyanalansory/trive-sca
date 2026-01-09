#!/bin/bash

# Script untuk setup SSL Self-Signed Certificate
# Usage: sudo ./scripts/setup-ssl-selfsigned.sh

set -e

echo "🔐 Setting up Self-Signed SSL Certificate for Trive SCA..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Configuration
SSL_DIR="/etc/nginx/ssl"
CERT_NAME="trive-sca"
SERVER_IP="8.215.80.95"  # Update dengan IP server Anda
DOMAIN_NAME="trive.local"  # Bisa diganti dengan domain jika ada

# Create SSL directory
echo "📁 Creating SSL directory..."
mkdir -p "$SSL_DIR"

# Check if certificate already exists
if [ -f "$SSL_DIR/$CERT_NAME.crt" ] && [ -f "$SSL_DIR/$CERT_NAME.key" ]; then
    echo -e "${YELLOW}⚠️  Certificate already exists at $SSL_DIR/$CERT_NAME.{crt,key}${NC}"
    read -p "Do you want to regenerate? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping certificate generation..."
        exit 0
    fi
    # Backup old certificate
    echo "📦 Backing up old certificate..."
    mv "$SSL_DIR/$CERT_NAME.crt" "$SSL_DIR/$CERT_NAME.crt.backup.$(date +%Y%m%d_%H%M%S)"
    mv "$SSL_DIR/$CERT_NAME.key" "$SSL_DIR/$CERT_NAME.key.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Generate private key and certificate
echo "🔑 Generating SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/$CERT_NAME.key" \
    -out "$SSL_DIR/$CERT_NAME.crt" \
    -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Trive/OU=IT/CN=$SERVER_IP"

# Set proper permissions
echo "🔒 Setting permissions..."
chmod 600 "$SSL_DIR/$CERT_NAME.key"
chmod 644 "$SSL_DIR/$CERT_NAME.crt"
chown root:root "$SSL_DIR/$CERT_NAME.key" "$SSL_DIR/$CERT_NAME.crt"

echo -e "${GREEN}✅ SSL certificate generated successfully!${NC}"
echo ""
echo "Certificate details:"
echo "  Certificate: $SSL_DIR/$CERT_NAME.crt"
echo "  Private Key: $SSL_DIR/$CERT_NAME.key"
echo "  Valid for: 365 days"
echo ""
echo "Next steps:"
echo "1. Copy nginx config: cp nginx-configs/trive-sca-selfsigned.conf /etc/nginx/sites-available/trive-sca"
echo "2. Update SERVER_IP in nginx config if different"
echo "3. Enable config: ln -s /etc/nginx/sites-available/trive-sca /etc/nginx/sites-enabled/"
echo "4. Test config: nginx -t"
echo "5. Reload nginx: systemctl reload nginx"
echo ""
echo -e "${YELLOW}⚠️  Note: Browser will show security warning for self-signed certificate${NC}"
echo "This is normal. Click 'Advanced' → 'Proceed to site' to continue."

