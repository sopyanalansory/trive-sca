# Docker Commands untuk PostgreSQL

Dokumentasi lengkap command Docker untuk mengelola PostgreSQL container.

## Setup Awal

### 1. Buat dan Jalankan Container PostgreSQL
```bash
docker run --name trive-postgres \
  -e POSTGRES_PASSWORD=sukses121 \
  -e POSTGRES_DB=trive_db \
  -p 5432:5432 \
  -d postgres
```

**Penjelasan:**
- `--name trive-postgres` - Nama container
- `-e POSTGRES_PASSWORD=sukses121` - Password untuk user postgres
- `-e POSTGRES_DB=trive_db` - Nama database yang akan dibuat otomatis
- `-p 5432:5432` - Map port 5432 (host) ke 5432 (container)
- `-d` - Run container di background (detached mode)
- `postgres` - Image PostgreSQL official

### 2. Buat Container dengan Volume Persistence (Recommended)
```bash
docker run --name trive-postgres \
  -e POSTGRES_PASSWORD=sukses121 \
  -e POSTGRES_DB=trive_db \
  -p 5432:5432 \
  -v trive-postgres-data:/var/lib/postgresql/data \
  -d postgres
```

**Keuntungan:** Data akan tetap tersimpan meskipun container dihapus.

## Management Commands

### Start Container
```bash
docker start trive-postgres
```

### Stop Container
```bash
docker stop trive-postgres
```

### Restart Container
```bash
docker restart trive-postgres
```

### Pause Container
```bash
docker pause trive-postgres
```

### Unpause Container
```bash
docker unpause trive-postgres
```

## Monitoring & Logs

### Lihat Status Container
```bash
docker ps --filter "name=trive-postgres"
```

### Lihat Semua Container (Termasuk yang Stopped)
```bash
docker ps -a --filter "name=trive-postgres"
```

### Lihat Logs Container
```bash
docker logs trive-postgres
```

### Lihat Logs Real-time (Follow)
```bash
docker logs -f trive-postgres
```

### Lihat Logs Terakhir (Last N lines)
```bash
docker logs --tail 50 trive-postgres
```

### Lihat Resource Usage
```bash
docker stats trive-postgres
```

## Database Operations

### Akses PostgreSQL CLI
```bash
docker exec -it trive-postgres psql -U postgres -d trive_db
```

### Execute SQL Command
```bash
docker exec trive-postgres psql -U postgres -d trive_db -c "SELECT * FROM users;"
```

### List All Tables
```bash
docker exec trive-postgres psql -U postgres -d trive_db -c "\dt"
```

### List All Databases
```bash
docker exec trive-postgres psql -U postgres -c "\l"
```

### Backup Database
```bash
docker exec trive-postgres pg_dump -U postgres trive_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
docker exec -i trive-postgres psql -U postgres -d trive_db < backup_file.sql
```

### Drop dan Recreate Database
```bash
# Masuk ke psql
docker exec -it trive-postgres psql -U postgres

# Di dalam psql:
DROP DATABASE trive_db;
CREATE DATABASE trive_db;
\q
```

## Container Management

### Remove Container (Harus Stop Dulu)
```bash
docker stop trive-postgres
docker rm trive-postgres
```

### Remove Container dengan Force
```bash
docker rm -f trive-postgres
```

### Remove Container dan Volume
```bash
docker stop trive-postgres
docker rm trive-postgres
docker volume rm trive-postgres-data  # Jika menggunakan named volume
```

### Copy File dari Container ke Host
```bash
docker cp trive-postgres:/var/lib/postgresql/data/postgresql.conf ./postgresql.conf
```

### Copy File dari Host ke Container
```bash
docker cp ./backup.sql trive-postgres:/tmp/backup.sql
```

## Troubleshooting

### Masuk ke Container Shell
```bash
docker exec -it trive-postgres bash
```

### Masuk ke Container dengan sh (Jika bash tidak tersedia)
```bash
docker exec -it trive-postgres sh
```

### Check Container Environment Variables
```bash
docker exec trive-postgres env
```

### Check Container Network
```bash
docker inspect trive-postgres | grep -A 20 "Networks"
```

### Check Container Port Mapping
```bash
docker port trive-postgres
```

### Inspect Container Details
```bash
docker inspect trive-postgres
```

## Advanced Commands

### Update Container Configuration
```bash
# Stop container
docker stop trive-postgres

# Remove container (data tetap aman jika menggunakan volume)
docker rm trive-postgres

# Recreate dengan konfigurasi baru
docker run --name trive-postgres \
  -e POSTGRES_PASSWORD=sukses121 \
  -e POSTGRES_DB=trive_db \
  -p 5432:5432 \
  -v trive-postgres-data:/var/lib/postgresql/data \
  -d postgres
```

### Run Multiple PostgreSQL Instances
```bash
# Instance 1 (Port 5432)
docker run --name trive-postgres-1 \
  -e POSTGRES_PASSWORD=sukses121 \
  -e POSTGRES_DB=trive_db \
  -p 5432:5432 \
  -d postgres

# Instance 2 (Port 5433)
docker run --name trive-postgres-2 \
  -e POSTGRES_PASSWORD=sukses121 \
  -e POSTGRES_DB=trive_db \
  -p 5433:5432 \
  -d postgres
```

### Check PostgreSQL Version
```bash
docker exec trive-postgres psql -U postgres -c "SELECT version();"
```

### Check Database Size
```bash
docker exec trive-postgres psql -U postgres -d trive_db -c "SELECT pg_size_pretty(pg_database_size('trive_db'));"
```

### Check Table Sizes
```bash
docker exec trive-postgres psql -U postgres -d trive_db -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

## Docker Compose (Alternative)

Jika ingin menggunakan Docker Compose, buat file `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:latest
    container_name: trive-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: sukses121
      POSTGRES_DB: trive_db
    ports:
      - "5432:5432"
    volumes:
      - trive-postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  trive-postgres-data:
```

**Commands dengan Docker Compose:**
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Stop dan remove volumes
docker-compose down -v

# View logs
docker-compose logs -f postgres

# Restart
docker-compose restart postgres
```

## Quick Reference

| Action | Command |
|--------|---------|
| Start | `docker start trive-postgres` |
| Stop | `docker stop trive-postgres` |
| Restart | `docker restart trive-postgres` |
| Logs | `docker logs -f trive-postgres` |
| Status | `docker ps --filter "name=trive-postgres"` |
| Access DB | `docker exec -it trive-postgres psql -U postgres -d trive_db` |
| Backup | `docker exec trive-postgres pg_dump -U postgres trive_db > backup.sql` |
| Remove | `docker rm -f trive-postgres` |

## Tips

1. **Selalu gunakan named volume** untuk data persistence
2. **Backup secara berkala** sebelum melakukan perubahan besar
3. **Monitor logs** untuk mendeteksi masalah lebih awal
4. **Gunakan Docker Compose** untuk setup yang lebih kompleks
5. **Jangan commit password** ke repository, gunakan environment variables

