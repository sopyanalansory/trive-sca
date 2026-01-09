# HTTPS Setup Guide

Panduan lengkap untuk mengaktifkan HTTPS dengan sertifikat SSL untuk aplikasi Trive SCA.

## Prerequisites

1. **Server dengan akses root/sudo** - Untuk install Nginx dan Certbot
2. **Domain name** (opsional, tapi recommended) - Untuk Let's Encrypt SSL certificate gratis
3. **Next.js app berjalan di port 3000** - Default Next.js production port
4. **Port 80 dan 443 terbuka** - HTTP (80) dan HTTPS (443)

## Pilihan Setup HTTPS

### Opsi 1: Menggunakan Domain dengan Let's Encrypt (Recommended - GRATIS)

**Cocok untuk:** Production dengan domain name  
**Keuntungan:** Sertifikat gratis, auto-renewal, trusted by browsers

### Opsi 2: Menggunakan IP Address dengan Self-Signed Certificate

**Cocok untuk:** Development/testing tanpa domain  
**Keuntungan:** Cepat setup, bisa langsung digunakan  
**Kekurangan:** Browser akan warning (tidak trusted)

### Opsi 3: Menggunakan Cloudflare (Recommended jika ada domain)

**Cocok untuk:** Production dengan domain  
**Keuntungan:** SSL gratis, DDoS protection, CDN, mudah setup

---

## Opsi 1: Let's Encrypt dengan Domain Name

### Step 1: Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y

# Start dan enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Step 2: Install Certbot (Let's Encrypt Client)

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx -y

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx -y
```

### Step 3: Setup Nginx Configuration

Buat file konfigurasi Nginx untuk aplikasi Anda:

```bash
sudo nano /etc/nginx/sites-available/trive-sca
```

**Untuk Ubuntu/Debian:** File akan di `/etc/nginx/sites-available/`  
**Untuk CentOS/RHEL:** File akan di `/etc/nginx/conf.d/`

Tambahkan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP ke HTTPS (akan diaktifkan setelah SSL setup)
    # return 301 https://$server_name$request_uri;
    
    # Sementara, proxy ke Next.js untuk verifikasi domain
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Ganti `your-domain.com` dengan domain Anda!**

Enable konfigurasi:

```bash
# Ubuntu/Debian
sudo ln -s /etc/nginx/sites-available/trive-sca /etc/nginx/sites-enabled/

# CentOS/RHEL (sudah langsung aktif)
```

Test konfigurasi Nginx:

```bash
sudo nginx -t
```

Jika berhasil, reload Nginx:

```bash
sudo systemctl reload nginx
```

### Step 4: Setup DNS

Pastikan domain Anda mengarah ke IP server:

```bash
# Cek IP server Anda
curl ifconfig.me

# Setup DNS A record:
# Type: A
# Name: @ atau your-domain.com
# Value: 8.215.80.95 (IP server Anda)
# TTL: 3600 (atau default)

# Optional: Setup www subdomain
# Type: A
# Name: www
# Value: 8.215.80.95
```

Verifikasi DNS sudah aktif:

```bash
# Tunggu beberapa menit untuk DNS propagate
dig your-domain.com +short
# atau
nslookup your-domain.com
```

### Step 5: Generate SSL Certificate dengan Certbot

```bash
# Generate certificate (ganti domain dengan domain Anda)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter email address (untuk notifikasi renewal)
# - Agree to terms of service
# - Choose to redirect HTTP to HTTPS (Yes)
```

Certbot akan:
1. Generate SSL certificate dari Let's Encrypt
2. Automatically update Nginx configuration
3. Setup auto-renewal

### Step 6: Verify Konfigurasi Nginx (Setelah Certbot)

Setelah Certbot selesai, cek konfigurasi Nginx:

```bash
sudo cat /etc/nginx/sites-available/trive-sca
```

Konfigurasi akan terlihat seperti ini:

```nginx
server {
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.your-domain.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = your-domain.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 404; # managed by Certbot
}
```

### Step 7: Test SSL Certificate

```bash
# Test konfigurasi Nginx
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Test SSL certificate
sudo certbot certificates

# Test renewal (dry-run)
sudo certbot renew --dry-run
```

### Step 8: Setup Auto-Renewal

Let's Encrypt certificate expire setiap 90 hari. Certbot sudah otomatis setup auto-renewal, tapi kita bisa verifikasi:

```bash
# Check cron job atau timer
sudo systemctl list-timers | grep certbot

# Atau cek cron
sudo crontab -l -u root | grep certbot
```

Jika tidak ada, tambahkan cron job:

```bash
sudo crontab -e
```

Tambahkan baris ini:

```
0 0,12 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
```

### Step 9: Update Next.js Configuration (Optional)

Jika perlu, update `next.config.ts` untuk handle HTTPS:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Trust proxy untuk proper X-Forwarded-Proto header
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Forwarded-Proto',
            value: 'https'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Step 10: Firewall Configuration

Pastikan port 80 dan 443 terbuka:

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables-save
```

---

## Opsi 2: Self-Signed Certificate (Tanpa Domain)

**Catatan:** Browser akan menampilkan warning karena sertifikat tidak trusted. Cocok untuk development/testing.

**Durasi Expired:** Certificate akan expired setelah **365 hari (1 tahun)** sejak dibuat. Tidak ada auto-renewal, perlu regenerate manual sebelum expired.

### Step 1: Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 2: Generate Self-Signed Certificate

```bash
# Buat direktori untuk sertifikat
sudo mkdir -p /etc/nginx/ssl

# Generate private key dan certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/trive-sca.key \
  -out /etc/nginx/ssl/trive-sca.crt

# Follow prompts:
# Country Name: ID
# State/Province: Jakarta (atau sesuai)
# Locality: Jakarta
# Organization Name: Trive (atau sesuai)
# Organizational Unit: IT
# Common Name: 8.215.80.95 (IP address Anda)
# Email: your-email@example.com

# Set permissions
sudo chmod 600 /etc/nginx/ssl/trive-sca.key
sudo chmod 644 /etc/nginx/ssl/trive-sca.crt
```

**Note:** Parameter `-days 365` menentukan durasi expired. Anda bisa ubah menjadi `-days 730` (2 tahun) atau `-days 1095` (3 tahun) jika ingin lebih lama, tapi tidak direkomendasikan untuk production.

**Check certificate expiry date:**
```bash
# Cek kapan certificate akan expired
openssl x509 -in /etc/nginx/ssl/trive-sca.crt -noout -dates

# Output akan menampilkan:
# notBefore=Dec 23 12:00:00 2024 GMT
# notAfter=Dec 23 12:00:00 2025 GMT  <- Ini tanggal expired (1 tahun dari dibuat)
```

**Regenerate certificate sebelum expired:**
```bash
# Generate ulang dengan durasi yang sama (365 hari)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/trive-sca.key \
  -out /etc/nginx/ssl/trive-sca.crt \
  -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Trive/OU=IT/CN=8.215.80.95"

# Set permissions lagi
sudo chmod 600 /etc/nginx/ssl/trive-sca.key
sudo chmod 644 /etc/nginx/ssl/trive-sca.crt

# Reload Nginx untuk menggunakan certificate baru
sudo systemctl reload nginx
```

### Step 3: Setup Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/trive-sca
```

Tambahkan konfigurasi:

```nginx
# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name 8.215.80.95;

    # Redirect semua HTTP ke HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name 8.215.80.95;

    # SSL Certificate
    ssl_certificate /etc/nginx/ssl/trive-sca.crt;
    ssl_certificate_key /etc/nginx/ssl/trive-sca.key;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable dan test:

```bash
# Ubuntu/Debian
sudo ln -s /etc/nginx/sites-available/trive-sca /etc/nginx/sites-enabled/

# Test konfigurasi
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 4: Firewall Configuration

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

## Opsi 3: Cloudflare (Paling Mudah dengan Domain)

### Step 1: Setup Domain di Cloudflare

1. **Sign up di [Cloudflare](https://www.cloudflare.com)** (gratis)
2. **Add Site** - Masukkan domain Anda
3. **Choose plan** - Pilih Free plan
4. **Update Nameservers** - Ubah nameserver domain di registrar ke Cloudflare nameservers
5. **Wait for activation** - Tunggu DNS propagation (biasanya 5-30 menit)

### Step 2: Setup DNS Records

Di Cloudflare Dashboard:

1. **DNS → Records**
2. **Add Record:**
   - Type: `A`
   - Name: `@` atau `your-domain.com`
   - IPv4 address: `8.215.80.95`
   - Proxy status: **Proxied** (orange cloud) ✅
   - TTL: Auto
3. **Save**

### Step 3: Setup SSL/TLS

Di Cloudflare Dashboard:

1. **SSL/TLS → Overview**
2. **Encryption mode:** Pilih "Full (strict)" atau "Full"
3. **Edge Certificates:** Pastikan "Always Use HTTPS" enabled
4. **Automatic HTTPS Rewrites:** Enable

### Step 4: Setup Nginx (Sama seperti Opsi 1)

Setup Nginx seperti Opsi 1, tapi gunakan konfigurasi ini:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip; # Cloudflare IP
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Note:** Dengan Cloudflare, Anda tidak perlu setup SSL certificate di server karena Cloudflare sudah handle SSL. Cloudflare akan connect ke server via HTTP (port 80) dan serve HTTPS ke user.

---

## Verifikasi HTTPS Setup

### Test HTTPS Connection

```bash
# Test dengan curl
curl -I https://your-domain.com
# atau
curl -I https://8.215.80.95

# Test SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Online SSL checker
# https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```

### Test dari Browser

1. Buka `https://your-domain.com` atau `https://8.215.80.95`
2. Cek apakah ada lock icon 🔒 di address bar
3. Test API endpoint: `https://your-domain.com/api/market-updates`

---

## Troubleshooting

### Error: Certificate verification failed

**Solution:**
- Pastikan domain mengarah ke IP server yang benar
- Pastikan port 80 dan 443 terbuka
- Cek DNS propagation: `dig your-domain.com`

### Error: 502 Bad Gateway

**Solution:**
- Pastikan Next.js app berjalan di port 3000:
  ```bash
  sudo lsof -i :3000
  ```
- Cek Nginx error logs:
  ```bash
  sudo tail -f /var/log/nginx/error.log
  ```
- Pastikan proxy_pass URL benar di Nginx config

### Error: SSL certificate expired

**Solution (Let's Encrypt):**
```bash
# Manual renewal
sudo certbot renew

# Reload Nginx setelah renewal
sudo systemctl reload nginx
```

### Error: Connection refused

**Solution:**
- Cek firewall rules
- Pastikan port 80 dan 443 terbuka
- Test connection: `telnet your-domain.com 443`

### Browser Warning: "Your connection is not private"

**Jika menggunakan Self-Signed Certificate:**
- Ini normal, klik "Advanced" → "Proceed to site"
- Atau install certificate di browser (untuk internal use)

**Jika menggunakan Let's Encrypt:**
- Pastikan sertifikat sudah terpasang dengan benar
- Cek domain name match dengan certificate
- Cek apakah sertifikat belum expired

---

## Update Client Code (Jika Ada)

Jika aplikasi client mengakses API dengan hardcoded `http://`, update ke `https://`:

**Sebelum:**
```javascript
const apiUrl = 'http://8.215.80.95/api/market-updates';
```

**Sesudah:**
```javascript
const apiUrl = 'https://your-domain.com/api/market-updates';
// atau tetap gunakan IP jika self-signed
const apiUrl = 'https://8.215.80.95/api/market-updates';
```

---

## Best Practices

1. **✅ Always Use HTTPS** - Redirect semua HTTP ke HTTPS
2. **✅ Enable HSTS** - Strict-Transport-Security header
3. **✅ Auto-Renewal** - Setup auto-renewal untuk Let's Encrypt
4. **✅ Security Headers** - X-Frame-Options, X-Content-Type-Options, dll
5. **✅ Keep Nginx Updated** - Update Nginx secara berkala
6. **✅ Monitor Certificate Expiry** - Setup monitoring untuk certificate expiry

---

## Quick Reference

### Nginx Config Location
- **Ubuntu/Debian:** `/etc/nginx/sites-available/` dan `/etc/nginx/sites-enabled/`
- **CentOS/RHEL:** `/etc/nginx/conf.d/`

### Nginx Commands
```bash
# Test config
sudo nginx -t

# Reload config (no downtime)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Certbot Commands (Let's Encrypt)
```bash
# Generate certificate
sudo certbot --nginx -d domain.com

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# List certificates
sudo certbot certificates

# Revoke certificate
sudo certbot revoke --cert-path /etc/letsencrypt/live/domain.com/cert.pem
```

---

## Next Steps

Setelah HTTPS setup:

1. ✅ **Test semua API endpoints** dengan HTTPS
2. ✅ **Update client code** untuk menggunakan HTTPS
3. ✅ **Monitor certificate expiry** (Let's Encrypt: 90 hari)
4. ✅ **Setup monitoring/alerting** untuk SSL issues
5. ✅ **Enable additional security headers** di Nginx
6. ✅ **Consider using CDN** (Cloudflare) untuk performance

---

**Need Help?** 
- Let's Encrypt Docs: https://letsencrypt.org/docs/
- Nginx Docs: https://nginx.org/en/docs/
- Cloudflare Docs: https://developers.cloudflare.com/

