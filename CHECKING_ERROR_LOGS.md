# Panduan Mengecek Error Backend Console di Server

## 1. Development Mode (Local)

Jika aplikasi berjalan dengan `npm run dev` atau `next dev`:

```bash
# Error akan langsung muncul di terminal tempat Anda menjalankan dev server
# Semua console.log, console.error akan tampil di terminal tersebut
```

**Cara melihat:**
- Buka terminal tempat Anda menjalankan `npm run dev`
- Semua error dari `console.error()` akan muncul di terminal tersebut
- Error dari API routes akan muncul dengan format:
  ```
  Verihubs API error: { message: '...', stack: '...', ... }
  Registration error: ...
  ```

## 2. Production dengan PM2

Jika aplikasi dijalankan dengan PM2:

### Melihat Logs Real-time
```bash
# Melihat semua logs
pm2 logs

# Melihat logs aplikasi tertentu
pm2 logs trive-sca

# Melihat hanya error logs
pm2 logs --err

# Melihat logs dengan format yang lebih rapi
pm2 logs --lines 100
```

### Melihat Logs dari File
```bash
# Lokasi default log files PM2
~/.pm2/logs/

# Melihat error log file
tail -f ~/.pm2/logs/trive-sca-error.log

# Melihat output log file
tail -f ~/.pm2/logs/trive-sca-out.log

# Melihat semua logs dengan grep untuk filter error
grep -i error ~/.pm2/logs/*.log
```

### Monitoring dengan PM2
```bash
# Monitor real-time
pm2 monit

# Status aplikasi
pm2 status

# Info detail aplikasi
pm2 describe trive-sca
```

## 3. Production dengan Systemd

Jika aplikasi dijalankan sebagai systemd service:

### Melihat Logs
```bash
# Melihat logs real-time
sudo journalctl -u trive-sca -f

# Melihat logs dengan filter error
sudo journalctl -u trive-sca -p err

# Melihat logs dari waktu tertentu
sudo journalctl -u trive-sca --since "1 hour ago"
sudo journalctl -u trive-sca --since "2025-01-23 10:00:00"

# Melihat logs dengan format JSON (untuk parsing)
sudo journalctl -u trive-sca -o json

# Melihat logs terakhir (100 baris)
sudo journalctl -u trive-sca -n 100
```

### Status Service
```bash
# Status service
sudo systemctl status trive-sca

# Restart service (jika perlu)
sudo systemctl restart trive-sca
```

## 4. Production dengan Docker

Jika aplikasi berjalan di Docker:

```bash
# Melihat logs container
docker logs trive-sca

# Melihat logs real-time
docker logs -f trive-sca

# Melihat logs dengan tail (100 baris terakhir)
docker logs --tail 100 trive-sca

# Melihat logs dengan timestamp
docker logs -t trive-sca

# Melihat logs dari waktu tertentu
docker logs --since "2025-01-23T10:00:00" trive-sca
```

## 5. Next.js Built-in Logs

Next.js menyimpan logs di beberapa tempat:

### Standalone Build
```bash
# Jika menggunakan standalone build, logs ada di:
.next/standalone/.next/server.log
```

### Vercel Deployment
- Masuk ke Vercel Dashboard
- Pilih project Anda
- Klik tab "Logs" atau "Functions"
- Error akan muncul di real-time logs

## 6. Server Logs (Nginx/Apache)

Jika menggunakan reverse proxy (Nginx):

```bash
# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs (untuk melihat request yang masuk)
sudo tail -f /var/log/nginx/access.log

# Filter error dari nginx logs
sudo grep -i error /var/log/nginx/error.log
```

## 7. Database Error Logs

Untuk melihat error dari database connection:

```bash
# PostgreSQL logs (jika di server lokal)
sudo tail -f /var/log/postgresql/postgresql-*.log

# Atau jika menggunakan RDS (Alibaba Cloud)
# Cek di Alibaba Cloud Console > RDS > Logs
```

## 8. Tips Debugging

### Filter Error Spesifik
```bash
# Filter error Verihubs
pm2 logs | grep -i "verihubs"

# Filter error registration
pm2 logs | grep -i "registration"

# Filter error database
pm2 logs | grep -i "database\|postgres\|connection"
```

### Save Logs ke File
```bash
# Save logs ke file
pm2 logs --lines 1000 > error-logs.txt

# Atau dengan journalctl
sudo journalctl -u trive-sca --since "1 day ago" > error-logs.txt
```

### Monitor Multiple Sources
```bash
# Monitor PM2 dan Nginx secara bersamaan
pm2 logs & tail -f /var/log/nginx/error.log
```

## 9. Quick Commands Cheat Sheet

```bash
# PM2
pm2 logs                    # Real-time logs
pm2 logs --err              # Error only
pm2 logs --lines 100        # Last 100 lines
pm2 monit                   # Monitor dashboard

# Systemd
sudo journalctl -u trive-sca -f              # Real-time
sudo journalctl -u trive-sca -p err           # Error only
sudo journalctl -u trive-sca --since "1h ago" # Last hour

# Docker
docker logs -f trive-sca    # Real-time
docker logs --tail 100      # Last 100 lines

# Nginx
sudo tail -f /var/log/nginx/error.log
```

## 10. Error yang Paling Sering Muncul

Berdasarkan kode di `app/api/auth/register/route.ts`, error yang mungkin muncul:

1. **Verihubs API Error**: 
   - Akan muncul dengan format: `Verihubs API error: { message, stack, name, phone, code }`
   - Cek dengan: `pm2 logs | grep "Verihubs API error"`

2. **Registration Error**:
   - Akan muncul dengan format: `Registration error: ...`
   - Cek dengan: `pm2 logs | grep "Registration error"`

3. **Database Connection Error**:
   - Biasanya muncul sebagai PostgreSQL connection error
   - Cek dengan: `pm2 logs | grep -i "database\|postgres\|connection"`

## 11. Setup Logging yang Lebih Baik (Opsional)

Untuk production, pertimbangkan menggunakan logging service seperti:
- **Winston** atau **Pino** untuk structured logging
- **Sentry** untuk error tracking
- **Logtail** atau **Papertrail** untuk log aggregation

Contoh dengan Winston:
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

// Gunakan di catch block
logger.error('Verihubs API error', { error: verihubsError });
```
