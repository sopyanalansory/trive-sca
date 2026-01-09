# HTTPS Quick Start Guide

Quick reference untuk setup HTTPS dengan cepat.

## ⚡ Quick Setup (Pilih Salah Satu)

### Option 1: Dengan Domain (Let's Encrypt - Recommended)

```bash
# 1. Install dependencies
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

# 2. Run automated setup script
sudo ./scripts/setup-nginx-letsencrypt.sh

# Follow prompts untuk domain dan email
```

**Atau manual:**

```bash
# 1. Setup Nginx config (ganti your-domain.com)
sudo cp nginx-configs/trive-sca-letsencrypt.conf /etc/nginx/sites-available/trive-sca
sudo nano /etc/nginx/sites-available/trive-sca  # Edit domain name

# 2. Enable config
sudo ln -s /etc/nginx/sites-available/trive-sca /etc/nginx/sites-enabled/

# 3. Test & reload
sudo nginx -t
sudo systemctl reload nginx

# 4. Generate SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Option 2: Tanpa Domain (Self-Signed - Untuk Testing)

**Durasi Expired:** 365 hari (1 tahun) sejak dibuat  
**Note:** Perlu regenerate manual sebelum expired. Tidak ada auto-renewal.

```bash
# 1. Install Nginx
sudo apt update
sudo apt install nginx -y

# 2. Generate self-signed certificate (valid 365 hari / 1 tahun)
sudo ./scripts/setup-ssl-selfsigned.sh

# 3. Setup Nginx config
sudo cp nginx-configs/trive-sca-selfsigned.conf /etc/nginx/sites-available/trive
sudo nano /etc/nginx/sites-available/trive  # Edit IP jika perlu

# 4. Enable config (skip jika sudah ada)
sudo ln -s /etc/nginx/sites-available/trive /etc/nginx/sites-enabled/ 2>/dev/null || echo "Symlink already exists"

# 5. Test & reload
sudo nginx -t
sudo systemctl reload nginx

# 6. Firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

**Check certificate expiry date:**
```bash
openssl x509 -in /etc/nginx/ssl/trive-sca.crt -noout -dates
```

**Regenerate certificate sebelum expired (contoh untuk 2 tahun):**
```bash
# Edit script dan ubah -days 365 menjadi -days 730 (2 tahun)
# Atau generate manual:
sudo openssl req -x509 -nodes -days 730 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/trive-sca.key \
  -out /etc/nginx/ssl/trive-sca.crt \
  -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Trive/OU=IT/CN=8.215.80.95"

sudo systemctl reload nginx
```

### Option 3: Cloudflare (Paling Mudah)

1. **Setup domain di Cloudflare:**
   - Sign up di [cloudflare.com](https://www.cloudflare.com)
   - Add site → Choose Free plan
   - Update nameservers di domain registrar

2. **Setup DNS:**
   - DNS → Records → Add A record
   - Name: `@` atau `your-domain.com`
   - IPv4: `8.215.80.95`
   - Proxy: **Proxied** (orange cloud) ✅

3. **Setup SSL:**
   - SSL/TLS → Overview → Encryption mode: **Full (strict)**
   - Edge Certificates → Always Use HTTPS: **ON**

4. **Setup Nginx (HTTP saja):**
   ```bash
   sudo cp nginx-configs/trive-sca-letsencrypt.conf /etc/nginx/sites-available/trive-sca
   # Edit: Hapus bagian SSL, cukup listen 80
   sudo ln -s /etc/nginx/sites-available/trive-sca /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

---

## ✅ Verifikasi

```bash
# Test HTTPS
curl -I https://your-domain.com
# atau
curl -I https://8.215.80.95

# Test API
curl https://your-domain.com/api/market-updates
```

---

## 🔧 Troubleshooting

### 502 Bad Gateway
```bash
# Cek Next.js berjalan
sudo lsof -i :3000

# Cek Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Next.js app
pm2 restart trive-sca
# atau
sudo systemctl restart trive-sca
```

### Certificate Expired (Let's Encrypt)
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Port Not Open
```bash
# Check firewall
sudo ufw status

# Open ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

## 📝 Checklist

- [ ] Nginx installed
- [ ] Next.js app running di port 3000
- [ ] Nginx config file created
- [ ] Nginx config enabled
- [ ] SSL certificate generated
- [ ] Port 80 & 443 open di firewall
- [ ] DNS pointing ke server (jika pakai domain)
- [ ] HTTPS accessible di browser
- [ ] API endpoint working dengan HTTPS
- [ ] Auto-renewal setup (untuk Let's Encrypt)

---

## 🔗 Links

- Full documentation: [HTTPS_SETUP.md](./HTTPS_SETUP.md)
- Nginx configs: [nginx-configs/](./nginx-configs/)
- Setup scripts: [scripts/](./scripts/)

---

**Langkah Setelah Setup:**

1. Test semua API endpoints dengan HTTPS
2. Update client code untuk menggunakan HTTPS
3. Monitor certificate expiry
4. Setup monitoring/alerting

