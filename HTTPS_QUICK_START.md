# HTTPS Quick Start Guide

Quick reference untuk setup HTTPS dengan cepat.

> 💡 **Baru mulai setup?** Lihat panduan lengkap: [SETUP_FROM_SCRATCH.md](./SETUP_FROM_SCRATCH.md)

## ⚡ Quick Setup (Pilih Salah Satu)

### Option 1: Dengan Domain (Let's Encrypt - Recommended)

**Untuk domain `api.trive.co.id`:**

```bash
# 1. Pastikan Next.js app berjalan di port 3000
#    (di production: pm2 start npm --name "trive-sca" -- start)
#    atau: npm run build && npm start

# 2. Install dependencies
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

# 3. Run automated setup script
sudo ./scripts/setup-nginx-letsencrypt.sh
#    Masukkan domain: api.trive.co.id
#    Masukkan email untuk notifikasi Let's Encrypt

# 4. Script akan otomatis:
#    - Setup Nginx config
#    - Generate SSL certificate
#    - Setup auto-renewal
```

**Atau manual (step-by-step):**

```bash
# 1. Pastikan Next.js app berjalan
pm2 start npm --name "trive-sca" -- start
# atau: npm run build && npm start

# 2. Setup Nginx config (sudah dikonfigurasi untuk api.trive.co.id)
sudo cp nginx-configs/trive-sca-letsencrypt.conf /etc/nginx/sites-available/trive

# 3. Enable config
sudo ln -s /etc/nginx/sites-available/trive /etc/nginx/sites-enabled/

# 4. Hapus default config jika ada
sudo rm -f /etc/nginx/sites-enabled/default

# 5. Test & reload
sudo nginx -t
sudo systemctl reload nginx

# 6. Pastikan DNS sudah pointing ke server IP
#    api.trive.co.id → 8.215.80.95 (atau IP server Anda)

# 7. Generate SSL certificate
sudo certbot --nginx -d api.trive.co.id --email your-email@example.com --agree-tos

# 8. Setup auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 9. Test renewal
sudo certbot renew --dry-run
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
   sudo cp nginx-configs/trive-sca-letsencrypt.conf /etc/nginx/sites-available/trive
   # Edit: Hapus bagian SSL, cukup listen 80
   sudo ln -s /etc/nginx/sites-available/trive /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

---

## ✅ Verifikasi

```bash
# Test HTTPS
curl -I https://api.trive.co.id

# Test API endpoint
curl https://api.trive.co.id/api/market-updates

# Test web Next.js
curl https://api.trive.co.id

# Check SSL certificate
openssl s_client -connect api.trive.co.id:443 -servername api.trive.co.id

# Check certificate expiry
sudo certbot certificates
```

---

## 🔧 Troubleshooting

### 502 Bad Gateway
```bash
# Cek Next.js berjalan di port 3000
sudo lsof -i :3000
# atau
netstat -tulpn | grep :3000

# Jika tidak berjalan, start Next.js:
cd /path/to/trive-sca
npm run build
pm2 start npm --name "trive-sca" -- start
# atau: npm start

# Cek Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Restart Next.js app
pm2 restart trive-sca
# atau
sudo systemctl restart trive-sca

# Restart Nginx
sudo systemctl restart nginx
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

1. ✅ Pastikan Next.js app berjalan di port 3000
2. ✅ Test semua API endpoints dengan HTTPS: `curl https://api.trive.co.id/api/market-updates`
3. ✅ Test web Next.js: buka `https://api.trive.co.id` di browser
4. ✅ Update client code untuk menggunakan HTTPS
5. ✅ Monitor certificate expiry (auto-renewal sudah setup)
6. ✅ Setup monitoring/alerting jika perlu

---

## 🚀 Quick Setup untuk api.trive.co.id

**Langkah cepat (copy-paste):**

```bash
# 1. Pastikan Next.js running
cd /path/to/trive-sca
npm run build
pm2 start npm --name "trive-sca" -- start

# 2. Install & setup Nginx + SSL
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

# 3. Copy config
sudo cp nginx-configs/trive-sca-letsencrypt.conf /etc/nginx/sites-available/trive
sudo ln -s /etc/nginx/sites-available/trive /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 4. Test & reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# 5. Generate SSL (ganti email dengan email Anda)
sudo certbot --nginx -d api.trive.co.id --email your-email@example.com --agree-tos

# 6. Setup auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 7. Test
curl -I https://api.trive.co.id
curl https://api.trive.co.id/api/market-updates
```

**Selesai!** 🎉

