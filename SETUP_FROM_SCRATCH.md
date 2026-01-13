# 🚀 Setup Nginx + HTTPS dari Awal di Server

Panduan lengkap untuk setup Nginx reverse proxy + Let's Encrypt SSL dari awal di server.

## 📋 Prerequisites

Sebelum mulai, pastikan:
- ✅ Server sudah terinstall Node.js dan npm
- ✅ Next.js app sudah di-deploy ke server
- ✅ Domain `api.trive.co.id` sudah pointing ke IP server (8.215.80.95)
- ✅ Port 80 dan 443 terbuka di firewall
- ✅ Akses root/sudo ke server

---

## 🎯 Step-by-Step Setup

### Step 1: Pastikan Next.js App Berjalan

```bash
# Masuk ke directory aplikasi
cd /path/to/trive-sca

# Install dependencies (jika belum)
npm install

# Build aplikasi
npm run build

# Start aplikasi dengan PM2 (recommended untuk production)
pm2 start npm --name "trive-sca" -- start
pm2 save
pm2 startup  # Untuk auto-start saat reboot

# Atau jika belum install PM2:
# npm start  # (akan berjalan di foreground, gunakan screen/tmux)

# Verifikasi app berjalan
curl http://localhost:3000
# atau
pm2 status
```

**Troubleshooting:**
```bash
# Cek apakah port 3000 sudah digunakan
sudo lsof -i :3000

# Cek log jika ada error
pm2 logs trive-sca
```

---

### Step 2: Install Nginx dan Certbot

```bash
# Update package list
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Install Certbot untuk Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y

# Start dan enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Cek status Nginx
sudo systemctl status nginx
```

---

### Step 3: Setup Nginx Configuration

**Opsi A: Menggunakan Script Otomatis (Recommended)**

```bash
# Masuk ke directory project
cd /path/to/trive-sca

# Pastikan script executable
chmod +x scripts/setup-nginx-letsencrypt.sh

# Jalankan script
sudo ./scripts/setup-nginx-letsencrypt.sh

# Script akan meminta:
# - Domain: masukkan api.trive.co.id
# - Email: masukkan email Anda untuk notifikasi Let's Encrypt
```

**Opsi B: Manual Setup**

```bash
# 1. Copy config file
sudo cp /path/to/trive-sca/nginx-configs/trive-sca-letsencrypt.conf /etc/nginx/sites-available/trive

# 2. Enable site (buat symlink)
sudo ln -s /etc/nginx/sites-available/trive /etc/nginx/sites-enabled/

# 3. Hapus default config (jika ada)
sudo rm -f /etc/nginx/sites-enabled/default

# 4. Test konfigurasi Nginx
sudo nginx -t

# 5. Reload Nginx
sudo systemctl reload nginx
```

**Verifikasi:**
```bash
# Cek apakah config sudah aktif
ls -la /etc/nginx/sites-enabled/

# Test HTTP (harus redirect ke HTTPS atau proxy ke Next.js)
curl -I http://api.trive.co.id
```

---

### Step 4: Setup Firewall (jika menggunakan UFW)

```bash
# Cek status firewall
sudo ufw status

# Allow HTTP dan HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Reload firewall
sudo ufw reload
```

---

### Step 5: Generate SSL Certificate dengan Let's Encrypt

**PENTING:** Pastikan DNS sudah pointing ke server sebelum menjalankan ini!

```bash
# Generate SSL certificate
sudo certbot --nginx -d api.trive.co.id --email your-email@example.com --agree-tos

# Atau non-interactive (untuk automation):
sudo certbot --nginx -d api.trive.co.id --email your-email@example.com --agree-tos --non-interactive
```

**Certbot akan:**
- ✅ Generate SSL certificate
- ✅ Otomatis update Nginx config
- ✅ Setup redirect HTTP → HTTPS

**Verifikasi:**
```bash
# Cek certificate
sudo certbot certificates

# Test SSL
openssl s_client -connect api.trive.co.id:443 -servername api.trive.co.id
```

---

### Step 6: Setup Auto-Renewal

```bash
# Enable certbot timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Cek status timer
sudo systemctl status certbot.timer

# Test renewal (dry-run)
sudo certbot renew --dry-run
```

---

### Step 7: Verifikasi Setup

```bash
# 1. Test HTTPS
curl -I https://api.trive.co.id

# 2. Test API endpoint
curl https://api.trive.co.id/api/market-updates

# 3. Test web Next.js
curl https://api.trive.co.id

# 4. Cek Nginx status
sudo systemctl status nginx

# 5. Cek Next.js app status
pm2 status
# atau
curl http://localhost:3000
```

**Test di Browser:**
- Buka: `https://api.trive.co.id`
- Harus muncul web Next.js (bukan default Nginx page)
- Browser harus menunjukkan 🔒 (secure/HTTPS)

---

## 🔧 Troubleshooting

### Error: 502 Bad Gateway

**Kemungkinan penyebab:**
1. Next.js app tidak berjalan
2. Port 3000 tidak accessible
3. Nginx config salah

**Solusi:**
```bash
# Cek Next.js berjalan
pm2 status
# atau
sudo lsof -i :3000

# Jika tidak berjalan, start:
pm2 start npm --name "trive-sca" -- start

# Cek Nginx error log
sudo tail -f /var/log/nginx/error.log

# Cek Nginx config
sudo nginx -t
```

### Error: Certificate Generation Failed

**Kemungkinan penyebab:**
1. DNS belum pointing ke server
2. Port 80 tidak accessible dari internet
3. Domain sudah pernah di-generate (rate limit)

**Solusi:**
```bash
# Cek DNS
dig api.trive.co.id
# atau
nslookup api.trive.co.id

# Pastikan DNS pointing ke IP server yang benar

# Cek port 80 accessible
sudo netstat -tulpn | grep :80

# Jika sudah pernah generate, tunggu beberapa jam atau gunakan --force-renewal
sudo certbot --nginx -d api.trive.co.id --force-renewal
```

### Error: Nginx Config Test Failed

**Solusi:**
```bash
# Cek syntax error
sudo nginx -t

# Edit config jika perlu
sudo nano /etc/nginx/sites-available/trive

# Test lagi
sudo nginx -t
```

### Next.js App Tidak Bisa Diakses

**Solusi:**
```bash
# Cek apakah app berjalan
pm2 status

# Cek log
pm2 logs trive-sca

# Restart app
pm2 restart trive-sca

# Cek environment variables
pm2 env trive-sca
```

---

## 📝 Checklist Final

Setelah setup selesai, pastikan:

- [ ] Next.js app berjalan di port 3000
- [ ] Nginx berjalan dan enabled
- [ ] Config file ada di `/etc/nginx/sites-available/trive`
- [ ] Symlink ada di `/etc/nginx/sites-enabled/trive`
- [ ] SSL certificate sudah ter-generate
- [ ] Auto-renewal sudah setup
- [ ] HTTPS accessible: `https://api.trive.co.id`
- [ ] API endpoint working: `https://api.trive.co.id/api/market-updates`
- [ ] HTTP redirect ke HTTPS
- [ ] Firewall allow port 80 dan 443

---

## 🎉 Quick Command Reference

```bash
# Restart Nginx
sudo systemctl restart nginx

# Restart Next.js
pm2 restart trive-sca

# Cek Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Cek Next.js logs
pm2 logs trive-sca

# Test SSL renewal
sudo certbot renew --dry-run

# Manual renew (jika perlu)
sudo certbot renew

# Reload Nginx setelah renew
sudo systemctl reload nginx
```

---

## 🔗 Links Terkait

- Full HTTPS Setup: [HTTPS_SETUP.md](./HTTPS_SETUP.md)
- Quick Start: [HTTPS_QUICK_START.md](./HTTPS_QUICK_START.md)
- Production Setup: [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)

---

**Selamat! Setup selesai! 🎉**

Jika ada masalah, cek bagian Troubleshooting atau log files.

