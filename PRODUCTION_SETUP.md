# Production Database Setup - Alibaba Cloud RDS

Setup database production menggunakan Alibaba Cloud RDS PostgreSQL.

## Database Information

- **Host:** `pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com`
- **User:** `db_admin`
- **Password:** `Indonesia123!`
- **Port:** `5432`
- **Region:** ap-southeast-5 (Singapore)

## Connection String

### Format untuk .env.local (Development Testing)
```env
DATABASE_URL=postgresql://db_admin:Indonesia123!@pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com:5432/postgres?sslmode=require
```

### Format untuk Vercel (Production)
Set di Vercel Dashboard → Settings → Environment Variables:
```env
DATABASE_URL=postgresql://db_admin:Indonesia123!@pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com:5432/postgres?sslmode=require
```

**Note:** Ganti `postgres` dengan nama database yang sebenarnya jika berbeda.

## Setup Steps

### 1. Verify Database Access

Pastikan database bisa diakses dari internet:

1. **Login ke Alibaba Cloud Console**
2. **Go to RDS → Instances**
3. **Select instance Anda**
4. **Check "Public Endpoint"** - harus enabled
5. **Check "Whitelist"** - pastikan IP Anda atau `0.0.0.0/0` (untuk testing) ada di whitelist

### 2. Create Database (Jika Belum Ada)

Jika database `trive_db` belum ada, buat melalui:

**Option A: Via Alibaba Cloud Console**
1. Go to RDS → Databases
2. Create Database
3. Name: `trive_db` (atau nama lain)
4. Character Set: `UTF8`
5. Collation: `en_US.UTF-8`

**Option B: Via psql**
```bash
psql -h pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com \
     -U db_admin \
     -d postgres \
     -c "CREATE DATABASE trive_db;"
```

### 3. Test Connection

```bash
# Test dengan script
node scripts/test-production-db.js

# Atau test langsung dengan psql
psql -h pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com \
     -U db_admin \
     -d postgres \
     -c "SELECT version();"
```

### 4. Initialize Database Schema

Setelah koneksi berhasil, initialize schema:

```bash
# Set DATABASE_URL untuk production
export DATABASE_URL=postgresql://db_admin:Indonesia123!@pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com:5432/trive_db?sslmode=require

# Initialize schema
npm run init-db
```

**Note:** Ganti `trive_db` dengan nama database yang sebenarnya.

### 5. Setup Vercel Environment Variables

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add these variables:**

```
DATABASE_URL=postgresql://db_admin:Indonesia123!@pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com:5432/trive_db?sslmode=require
JWT_SECRET=[generate dengan: npm run generate-jwt-secret]
NODE_ENV=production
```

5. **Redeploy** aplikasi setelah menambahkan environment variables

### 6. Setup Environment Variables di Server (Bukan Vercel)

Jika deploy ke server tradisional (VPS, dedicated server, dll), ada beberapa cara untuk set environment variables:

#### Option A: Menggunakan .env File (Recommended untuk Development/Testing)

1. **Buat file `.env` di root project:**
```bash
# Di server, buat file .env
nano .env
```

2. **Tambahkan environment variables:**
```env
DATABASE_URL=postgresql://db_admin:Indonesia123!@pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com:5432/trive_db?sslmode=require
JWT_SECRET=[generate dengan: npm run generate-jwt-secret]
NODE_ENV=production
PORT=3000
```

3. **Pastikan `.env` sudah di-ignore di `.gitignore`:**
```bash
echo ".env" >> .gitignore
```

4. **Set permission yang aman:**
```bash
chmod 600 .env  # Hanya owner yang bisa read/write
```

5. **Pastikan aplikasi load .env file:**
   - Jika pakai `dotenv`: `require('dotenv').config()` di awal aplikasi
   - Jika pakai framework (Next.js, dll), biasanya sudah auto-load `.env` file

#### Option B: Menggunakan System Environment Variables (Production)

Set environment variables di level system, agar tersedia untuk semua proses:

1. **Edit `/etc/environment` (untuk semua user):**
```bash
sudo nano /etc/environment
```

2. **Tambahkan:**
```env
DATABASE_URL=postgresql://db_admin:Indonesia123!@pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com:5432/trive_db?sslmode=require
JWT_SECRET=your-jwt-secret-here
NODE_ENV=production
PORT=3000
```

3. **Atau edit `~/.bashrc` atau `~/.zshrc` (untuk user tertentu):**
```bash
nano ~/.bashrc
```

4. **Tambahkan di akhir file:**
```bash
export DATABASE_URL="postgresql://db_admin:Indonesia123!@pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com:5432/trive_db?sslmode=require"
export JWT_SECRET="your-jwt-secret-here"
export NODE_ENV="production"
export PORT=3000
```

5. **Reload shell configuration:**
```bash
source ~/.bashrc  # atau source ~/.zshrc
```

6. **Verify environment variables:**
```bash
echo $DATABASE_URL
echo $JWT_SECRET
```

#### Option C: Menggunakan PM2 Ecosystem File (Recommended untuk Production dengan PM2)

1. **Buat file `ecosystem.config.js` di root project:**
```bash
nano ecosystem.config.js
```

2. **Tambahkan konfigurasi:**
```javascript
module.exports = {
  apps: [{
    name: 'trive-sca',
    script: './server.js', // atau index.js, sesuai entry point Anda
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://db_admin:Indonesia123!@pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com:5432/trive_db?sslmode=require',
      JWT_SECRET: 'your-jwt-secret-here'
    }
  }]
}
```

3. **Start aplikasi dengan PM2:**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Untuk auto-start saat reboot
```

**Note:** Untuk security yang lebih baik, simpan sensitive data di file terpisah:

```javascript
// ecosystem.config.js
require('dotenv').config({ path: '.env.production' });

module.exports = {
  apps: [{
    name: 'trive-sca',
    script: './server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET
    }
  }]
}
```

#### Option D: Menggunakan Systemd Service File

1. **Buat service file:**
```bash
sudo nano /etc/systemd/system/trive-sca.service
```

2. **Tambahkan konfigurasi:**
```ini
[Unit]
Description=Trive SCA Application
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/app
Environment="NODE_ENV=production"
Environment="PORT=3000"
Environment="DATABASE_URL=postgresql://db_admin:Indonesia123!@pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com:5432/trive_db?sslmode=require"
Environment="JWT_SECRET=your-jwt-secret-here"
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. **Enable dan start service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable trive-sca
sudo systemctl start trive-sca
sudo systemctl status trive-sca
```

#### Option E: Menggunakan Environment File dengan Systemd (Paling Aman)

1. **Buat file environment (bukan .env, tapi untuk systemd):**
```bash
sudo nano /etc/trive-sca/environment
```

2. **Tambahkan variables (tanpa export):**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://db_admin:Indonesia123!@pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com:5432/trive_db?sslmode=require
JWT_SECRET=your-jwt-secret-here
```

3. **Set permission:**
```bash
sudo chmod 600 /etc/trive-sca/environment
sudo chown root:root /etc/trive-sca/environment
```

4. **Update systemd service untuk load file ini:**
```ini
[Service]
EnvironmentFile=/etc/trive-sca/environment
ExecStart=/usr/bin/node server.js
```

5. **Reload dan restart:**
```bash
sudo systemctl daemon-reload
sudo systemctl restart trive-sca
```

### 7. Whitelist Server IP di Alibaba Cloud RDS

1. **Dapatkan IP public server Anda:**
```bash
curl ifconfig.me
# atau
curl ipinfo.io/ip
```

2. **Login ke Alibaba Cloud Console**
3. **Go to RDS → Instances → Your Instance → Data Security → Whitelist**
4. **Add server IP** ke whitelist (format: `xxx.xxx.xxx.xxx/32`)
5. **Save** dan tunggu beberapa menit untuk apply

### 8. Deploy / Redeploy Aplikasi ke Server

#### Quick Deploy (Manual)

```bash
# 1. Masuk ke directory aplikasi
cd /var/www/trive/trive-sca

# 2. Pull latest code dari Git
git pull origin main

# 3. Install dependencies (jika ada package baru)
npm install

# 4. Build aplikasi Next.js
npm run build

# 5. Restart aplikasi (pilih salah satu sesuai setup Anda)
```

#### Jika Menggunakan PM2:

```bash
# Restart aplikasi dengan PM2
pm2 restart trive-sca

# Atau jika belum ada, start dengan PM2:
pm2 start npm --name "trive-sca" -- start
pm2 save
pm2 startup  # Untuk auto-start saat reboot
```

#### Jika Menggunakan Systemd:

```bash
# Restart service
sudo systemctl restart trive-sca

# Atau start jika belum running:
sudo systemctl start trive-sca

# Check status:
sudo systemctl status trive-sca
```

#### Jika Tanpa Process Manager (Manual):

```bash
# Stop aplikasi yang sedang running (Ctrl+C jika di terminal, atau kill process)

# Start aplikasi di background:
nohup npm start > app.log 2>&1 &

# Atau gunakan screen/tmux:
screen -S trive-sca
npm start
# Tekan Ctrl+A kemudian D untuk detach
```

#### Script Deploy Otomatis

Anda juga bisa buat script deploy untuk memudahkan:

**Buat file `deploy.sh`:**
```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Navigate to app directory
cd /var/www/trive/trive-sca

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build

# Restart application
echo "🔄 Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 restart trive-sca || pm2 start npm --name "trive-sca" -- start
    pm2 save
elif systemctl is-active --quiet trive-sca.service; then
    sudo systemctl restart trive-sca
else
    echo "⚠️  No process manager detected. Please restart manually."
fi

echo "✅ Deployment complete!"
```

**Set permission dan gunakan:**
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Checklist Sebelum Deploy:

- ✅ Pastikan file `.env` sudah ada dan berisi konfigurasi yang benar
- ✅ Pastikan database sudah di-initialize (`npm run init-db`)
- ✅ Pastikan port aplikasi tidak conflict dengan service lain
- ✅ Pastikan firewall sudah allow port aplikasi (biasanya 3000 untuk Next.js)
- ✅ Backup database jika ada data penting

#### Troubleshooting Deploy:

**Error: Port already in use**
```bash
# Cek proses yang menggunakan port
sudo lsof -i :3000
# Kill proses jika perlu
sudo kill -9 <PID>
```

**Error: Cannot find module**
```bash
# Hapus node_modules dan reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: Build failed**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Troubleshooting

### Error: Connection Timeout

**Possible causes:**
1. **Public endpoint tidak enabled**
   - Solution: Enable di Alibaba Cloud RDS console

2. **IP tidak di-whitelist**
   - Solution: Tambahkan IP ke whitelist atau gunakan `0.0.0.0/0` untuk testing

3. **Security group/firewall blocking**
   - Solution: Check security group rules, allow port 5432

4. **Database name salah**
   - Solution: Verify database name di Alibaba Cloud console

### Error: SSL Required

**Solution:** 
- Pastikan connection string include `?sslmode=require`
- Code sudah handle SSL otomatis untuk RDS

### Error: Authentication Failed

**Possible causes:**
1. **Username/password salah**
   - Solution: Verify credentials di Alibaba Cloud console

2. **User tidak punya permission**
   - Solution: Check user permissions di RDS console

### Error: Database Does Not Exist

**Solution:**
- Create database terlebih dahulu
- Atau gunakan database yang sudah ada (biasanya `postgres`)

## Security Best Practices

1. **✅ Use SSL:** Connection string sudah include `sslmode=require`
2. **✅ Strong Password:** Password sudah kuat
3. **⚠️ Whitelist IP:** Untuk production, jangan gunakan `0.0.0.0/0`
   - **Vercel:** Tambahkan hanya IP Vercel atau IP yang diperlukan
   - **Server Tradisional:** Tambahkan hanya IP public server Anda ke whitelist
4. **✅ Environment Variables:** Jangan commit credentials ke Git
   - Pastikan `.env` ada di `.gitignore`
   - Gunakan file permission yang aman (`chmod 600`)
5. **✅ Different Secrets:** Gunakan JWT_SECRET berbeda untuk production
6. **✅ File Permissions:** Untuk environment files di server, set permission ketat:
   - `.env`: `chmod 600` (hanya owner read/write)
   - Systemd environment file: `chmod 600` dengan ownership `root:root`
7. **✅ Secure Storage:** Untuk production, pertimbangkan menggunakan secret management:
   - AWS Secrets Manager
   - HashiCorp Vault
   - Atau minimal encrypt environment files

## IP Whitelist Configuration

### Untuk Vercel:
- Vercel uses dynamic IPs
- Consider using VPC peering atau allow all (for testing)
- For production, use database connection pooling service

### Untuk Server Tradisional:
1. **Dapatkan IP public server:**
   ```bash
   curl ifconfig.me
   ```

2. **Whitelist IP di Alibaba Cloud RDS:**
   - Format: `xxx.xxx.xxx.xxx/32` (single IP)
   - Atau range: `xxx.xxx.xxx.0/24` (jika perlu)

3. **Jika server IP berubah (dynamic IP):**
   - Update whitelist secara manual
   - Atau gunakan script otomatis untuk update whitelist
   - Pertimbangkan menggunakan VPC peering jika server di Alibaba Cloud juga

## Connection String Format

```
postgresql://[username]:[password]@[host]:[port]/[database]?sslmode=require
```

**Example:**
```
postgresql://db_admin:Indonesia123!@pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com:5432/trive_db?sslmode=require
```

## Quick Commands

```bash
# Test connection
node scripts/test-production-db.js

# Initialize schema (set DATABASE_URL first)
export DATABASE_URL=postgresql://db_admin:Indonesia123!@pgm-d9j9138505608igh6o.pgsql.ap-southeast-5.rds.aliyuncs.com:5432/trive_db?sslmode=require
npm run init-db

# Generate JWT_SECRET for production
npm run generate-jwt-secret
```

## Next Steps

### Jika Deploy ke Vercel:
1. ✅ Verify database access dari Alibaba Cloud console
2. ✅ Test connection dengan script
3. ✅ Create database jika belum ada
4. ✅ Initialize schema
5. ✅ Set environment variables di Vercel Dashboard
6. ✅ Deploy aplikasi
7. ✅ Test register/login di production

### Jika Deploy ke Server Tradisional:
1. ✅ Verify database access dari Alibaba Cloud console
2. ✅ Test connection dengan script
3. ✅ Create database jika belum ada
4. ✅ Initialize schema
5. ✅ Dapatkan IP public server Anda
6. ✅ Whitelist server IP di Alibaba Cloud RDS
7. ✅ Setup environment variables di server (pilih salah satu method di atas)
8. ✅ Deploy aplikasi ke server
9. ✅ Setup process manager (PM2/systemd) jika perlu
10. ✅ Test register/login di production

---

**Need Help?** Check Alibaba Cloud RDS documentation atau contact support.

