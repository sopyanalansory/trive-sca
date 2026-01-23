# Spesifikasi Server untuk Trive SCA

Dokumen ini menjelaskan spesifikasi server yang dibutuhkan untuk menjalankan aplikasi Trive SCA di berbagai lingkungan.

## 📋 Tech Stack

- **Framework**: Next.js 16.1.0
- **Runtime**: Node.js 18+ (recommended: Node.js 20 LTS)
- **Database**: PostgreSQL (Managed RDS - Alibaba Cloud)
- **Process Manager**: PM2 (recommended) atau systemd
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt
- **External Services**: Verihubs API (WhatsApp OTP)

---

## 🖥️ Spesifikasi Server

### 1. Development/Testing (Local)

**Minimum Requirements:**
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **OS**: Linux (Ubuntu 20.04+), macOS, atau Windows dengan WSL2
- **Network**: Internet connection untuk database dan external APIs

**Recommended:**
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 22.04 LTS atau macOS

**Software Requirements:**
- Node.js 18.x atau 20.x LTS
- npm atau yarn
- PostgreSQL (opsional, bisa pakai cloud database)
- Git

---

### 2. Staging/Production (Small Scale)

**Untuk:**
- 100-1,000 active users
- 10-100 concurrent requests
- Low to medium traffic

**Minimum Requirements:**
- **CPU**: 2-4 cores
- **RAM**: 4-8 GB
- **Storage**: 40 GB SSD
- **Bandwidth**: 100 Mbps
- **OS**: Ubuntu 22.04 LTS (recommended)

**Recommended:**
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 80 GB SSD
- **Bandwidth**: 1 Gbps
- **OS**: Ubuntu 22.04 LTS

**Software Stack:**
- Node.js 20.x LTS
- PM2 untuk process management
- Nginx sebagai reverse proxy
- PostgreSQL (Managed RDS - Alibaba Cloud)

**Estimated Cost (Alibaba Cloud ECS):**
- **ecs.t6-c2m4.large** (2 vCPU, 4GB RAM): ~$20-30/month
- **ecs.c6.large** (2 vCPU, 4GB RAM): ~$30-40/month
- **ecs.c6.xlarge** (4 vCPU, 8GB RAM): ~$60-80/month

---

### 3. Production (Medium Scale)

**Untuk:**
- 1,000-10,000 active users
- 100-500 concurrent requests
- Medium to high traffic

**Minimum Requirements:**
- **CPU**: 4-8 cores
- **RAM**: 8-16 GB
- **Storage**: 100 GB SSD
- **Bandwidth**: 1 Gbps
- **OS**: Ubuntu 22.04 LTS

**Recommended:**
- **CPU**: 8 cores
- **RAM**: 16 GB
- **Storage**: 200 GB SSD
- **Bandwidth**: 1 Gbps
- **OS**: Ubuntu 22.04 LTS

**Software Stack:**
- Node.js 20.x LTS
- PM2 dengan cluster mode (multiple instances)
- Nginx dengan load balancing
- PostgreSQL (Managed RDS - Alibaba Cloud)
- Redis (opsional, untuk caching)

**Estimated Cost (Alibaba Cloud ECS):**
- **ecs.c6.2xlarge** (8 vCPU, 16GB RAM): ~$120-150/month
- **ecs.c6.4xlarge** (16 vCPU, 32GB RAM): ~$240-300/month

---

### 4. Production (Large Scale)

**Untuk:**
- 10,000+ active users
- 500+ concurrent requests
- High traffic dengan auto-scaling

**Architecture:**
- Multiple application servers dengan load balancer
- Database read replicas
- CDN untuk static assets
- Redis cluster untuk caching
- Monitoring dan logging services

**Per Server Requirements:**
- **CPU**: 8-16 cores
- **RAM**: 16-32 GB
- **Storage**: 200-500 GB SSD
- **Bandwidth**: 1-10 Gbps

**Infrastructure:**
- Load Balancer (Alibaba Cloud SLB)
- Auto Scaling Group
- Multiple ECS instances
- RDS PostgreSQL (High Availability)
- Redis Cluster
- CDN (Alibaba Cloud CDN)

**Estimated Cost:**
- $500-2000+/month (tergantung traffic dan scale)

---

## 💾 Storage Requirements

### Application Files
- **Next.js build**: ~200-500 MB
- **Node modules**: ~300-500 MB
- **Logs**: 1-5 GB (dengan rotation)
- **Total**: ~2-10 GB

### Database (PostgreSQL)
- **Per user**: ~1-5 KB (estimated)
- **10,000 users**: ~50-100 MB
- **100,000 users**: ~500 MB - 1 GB
- **Indexes**: +20-30% dari data size
- **Logs**: 1-5 GB (dengan rotation)

**Total Storage Needed:**
- Small scale: 40-80 GB
- Medium scale: 100-200 GB
- Large scale: 500 GB - 2 TB

---

## 🌐 Network Requirements

### Ports yang Harus Terbuka
- **80**: HTTP (untuk Let's Encrypt verification)
- **443**: HTTPS (production)
- **3000**: Next.js app (internal, tidak perlu public)

### Firewall Rules
```bash
# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow SSH (jika remote access)
sudo ufw allow 22/tcp

# Block port 3000 dari public (hanya localhost)
sudo ufw deny 3000/tcp
```

### Bandwidth
- **Minimum**: 10 Mbps
- **Recommended**: 100 Mbps
- **High traffic**: 1 Gbps

---

## 🔧 Software Installation

### 1. Node.js
```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be v20.x.x
npm --version
```

### 2. PM2
```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup script
pm2 startup
pm2 save
```

### 3. Nginx
```bash
# Install Nginx
sudo apt update
sudo apt install nginx -y

# Start and enable
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Certbot (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

---

## 📊 Resource Usage Estimates

### CPU Usage
- **Idle**: 5-10%
- **Normal traffic**: 20-40%
- **Peak traffic**: 60-80%
- **Maximum**: 90% (dengan headroom)

### Memory Usage
- **Next.js app**: 200-500 MB per instance
- **PM2 overhead**: ~50-100 MB
- **Nginx**: ~20-50 MB
- **System**: ~500 MB - 1 GB
- **Total**: ~1-2 GB (minimum), 2-4 GB (recommended)

### Disk I/O
- **Read**: Low (mostly static files)
- **Write**: Low to medium (logs, database queries)
- **SSD recommended** untuk performa yang lebih baik

---

## 🗄️ Database Requirements

### PostgreSQL (Managed RDS - Alibaba Cloud)

**Small Scale:**
- **Instance Type**: rds.pg.s1.small (1 vCPU, 2GB RAM)
- **Storage**: 20-50 GB
- **Connection Pool**: 10-20 connections
- **Cost**: ~$30-50/month

**Medium Scale:**
- **Instance Type**: rds.pg.m1.medium (2 vCPU, 4GB RAM)
- **Storage**: 100-200 GB
- **Connection Pool**: 50-100 connections
- **Cost**: ~$80-120/month

**Large Scale:**
- **Instance Type**: rds.pg.c1.large (4 vCPU, 8GB RAM) atau lebih tinggi
- **Storage**: 500 GB - 1 TB
- **Connection Pool**: 200+ connections
- **High Availability**: Multi-AZ deployment
- **Read Replicas**: 1-3 replicas
- **Cost**: ~$200-500+/month

### Connection Pooling
Aplikasi menggunakan connection pooling dari `pg` library. Default pool size:
- **Min connections**: 2
- **Max connections**: 10 (bisa disesuaikan)

Untuk production, pertimbangkan menggunakan PgBouncer untuk connection pooling yang lebih efisien.

---

## 🔐 Security Requirements

### SSL/TLS
- **Certificate**: Let's Encrypt (free) atau commercial SSL
- **Protocol**: TLS 1.2+ (TLS 1.3 recommended)
- **Auto-renewal**: Setup dengan Certbot

### Firewall
- **UFW** atau **iptables** untuk Linux
- **Cloud Security Groups** untuk cloud providers
- **Whitelist IP** untuk database access

### Environment Variables
- **Secure storage**: Jangan commit ke Git
- **File permissions**: `chmod 600` untuk .env files
- **Systemd environment files**: Store di `/etc/trive-sca/environment` dengan proper permissions

---

## 📈 Monitoring & Logging

### Recommended Tools
- **PM2 Monitoring**: Built-in dengan `pm2 monit`
- **Nginx Logs**: `/var/log/nginx/access.log` dan `/var/log/nginx/error.log`
- **Application Logs**: PM2 logs atau systemd journal
- **System Monitoring**: `htop`, `iostat`, `netstat`

### Log Rotation
```bash
# Setup logrotate untuk application logs
sudo nano /etc/logrotate.d/trive-sca
```

### Monitoring Services (Opsional)
- **Alibaba Cloud CloudMonitor**
- **Prometheus + Grafana**
- **New Relic** atau **Datadog**
- **Sentry** untuk error tracking

---

## 🚀 Deployment Options

### Option 1: Single Server (Small Scale)
- **ECS Instance**: 1 server
- **Database**: Managed RDS
- **Cost**: ~$50-100/month

### Option 2: Load Balanced (Medium Scale)
- **ECS Instances**: 2-3 servers
- **Load Balancer**: Alibaba Cloud SLB
- **Database**: Managed RDS (High Availability)
- **Cost**: ~$200-400/month

### Option 3: Auto-Scaling (Large Scale)
- **ECS Instances**: Auto-scaling group (2-10 instances)
- **Load Balancer**: Alibaba Cloud SLB
- **Database**: Managed RDS (Multi-AZ + Read Replicas)
- **CDN**: Alibaba Cloud CDN
- **Cost**: ~$500-2000+/month

---

## 📝 Quick Checklist

### Pre-Deployment
- [ ] Server dengan spesifikasi minimum terpenuhi
- [ ] Node.js 18+ terinstall
- [ ] PM2 terinstall dan configured
- [ ] Nginx terinstall dan configured
- [ ] SSL certificate setup (Let's Encrypt)
- [ ] Database connection string configured
- [ ] Environment variables setup
- [ ] Firewall rules configured
- [ ] Domain DNS pointing ke server IP

### Post-Deployment
- [ ] Application running dan accessible
- [ ] SSL certificate valid
- [ ] Database connection working
- [ ] API endpoints responding
- [ ] Logs accessible
- [ ] Monitoring setup
- [ ] Backup strategy configured

---

## 💰 Cost Estimation (Alibaba Cloud)

### Small Scale (100-1,000 users)
- **ECS**: $30-50/month
- **RDS**: $30-50/month
- **Bandwidth**: $10-20/month
- **Total**: ~$70-120/month

### Medium Scale (1,000-10,000 users)
- **ECS**: $100-150/month
- **RDS**: $80-120/month
- **SLB**: $20-30/month
- **Bandwidth**: $30-50/month
- **Total**: ~$230-350/month

### Large Scale (10,000+ users)
- **ECS (multiple)**: $300-600/month
- **RDS (HA)**: $200-400/month
- **SLB**: $50-100/month
- **CDN**: $50-200/month
- **Bandwidth**: $100-300/month
- **Total**: ~$700-1,600/month

*Note: Harga dapat bervariasi tergantung region, instance type, dan usage.*

---

## 🔄 Scaling Strategy

### Vertical Scaling (Scale Up)
- Upgrade server specs (CPU, RAM)
- Upgrade database instance
- **Pros**: Simple, no code changes
- **Cons**: Limited by hardware, single point of failure

### Horizontal Scaling (Scale Out)
- Add more application servers
- Use load balancer
- Database read replicas
- **Pros**: Better availability, can handle more traffic
- **Cons**: More complex, requires load balancing setup

### Auto-Scaling
- Setup auto-scaling group
- Scale based on CPU/memory/request metrics
- **Pros**: Automatic, cost-efficient
- **Cons**: Requires monitoring and configuration

---

## 📞 Support & Resources

### Documentation
- Next.js: https://nextjs.org/docs
- PM2: https://pm2.keymetrics.io/docs
- Nginx: https://nginx.org/en/docs/
- PostgreSQL: https://www.postgresql.org/docs/

### Alibaba Cloud Resources
- ECS Documentation: https://www.alibabacloud.com/help/en/ecs
- RDS Documentation: https://www.alibabacloud.com/help/en/rds
- SLB Documentation: https://www.alibabacloud.com/help/en/slb

---

**Last Updated**: January 2025
**Version**: 1.0
