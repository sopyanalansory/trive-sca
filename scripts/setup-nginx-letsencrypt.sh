#!/bin/bash

# Script untuk setup Nginx dengan Let's Encrypt SSL
# Usage: sudo ./scripts/setup-nginx-letsencrypt.sh

set -e

echo "🔐 Setting up Nginx with Let's Encrypt SSL for Trive SCA..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Configuration
NGINX_SITE="trive"
DOMAIN=""
EMAIL=""

# Get domain name
read -p "Enter your domain name (e.g., example.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Domain name is required${NC}"
    exit 1
fi

# Get email for Let's Encrypt notifications
read -p "Enter your email for Let's Encrypt notifications: " EMAIL
if [ -z "$EMAIL" ]; then
    echo -e "${RED}❌ Email is required${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Configuration:${NC}"
echo "  Domain: $DOMAIN"
echo "  Email: $EMAIL"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y nginx
    elif command -v yum &> /dev/null; then
        yum install -y nginx
    else
        echo -e "${RED}❌ Package manager not found. Please install Nginx manually.${NC}"
        exit 1
    fi
fi

# Check if Certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing Certbot..."
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        yum install -y certbot python3-certbot-nginx
    else
        echo -e "${RED}❌ Package manager not found. Please install Certbot manually.${NC}"
        exit 1
    fi
fi

# Start and enable Nginx
echo "🚀 Starting Nginx..."
systemctl start nginx
systemctl enable nginx

# Create temporary Nginx config for domain verification
echo "📝 Creating temporary Nginx configuration..."
NGINX_CONFIG="/etc/nginx/sites-available/$NGINX_SITE"

cat > "$NGINX_CONFIG" <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
if [ -d "/etc/nginx/sites-enabled" ]; then
    # Ubuntu/Debian
    if [ ! -f "/etc/nginx/sites-enabled/$NGINX_SITE" ]; then
        ln -s "$NGINX_CONFIG" "/etc/nginx/sites-enabled/$NGINX_SITE"
    fi
else
    # CentOS/RHEL - config should be in conf.d
    cp "$NGINX_CONFIG" "/etc/nginx/conf.d/$NGINX_SITE.conf"
fi

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
if ! nginx -t; then
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi

# Reload Nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx

# Verify DNS
echo ""
echo -e "${YELLOW}⚠️  Please verify DNS is pointing to this server:${NC}"
echo "  Domain: $DOMAIN should point to: $(curl -s ifconfig.me)"
echo ""
read -p "DNS configured and propagated? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Setup DNS first, then run Certbot manually:${NC}"
    echo "  sudo certbot --nginx -d $DOMAIN"
    exit 0
fi

# Generate SSL certificate with Certbot
echo "🔐 Generating SSL certificate with Let's Encrypt..."
certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive

# Setup auto-renewal
echo "🔄 Setting up auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Test certificate renewal
echo "🧪 Testing certificate renewal..."
certbot renew --dry-run

echo ""
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo "Your site should now be accessible at:"
echo "  https://$DOMAIN"
echo ""
echo "Certificate will auto-renew every 90 days."
echo ""
echo "Test your site:"
echo "  curl -I https://$DOMAIN"
echo "  curl https://$DOMAIN/api/market-updates"
echo "  openssl s_client -connect $DOMAIN:443 -servername $DOMAIN"

