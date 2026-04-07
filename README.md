This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Quick Deploy Steps:

1. **Push to GitHub**: 
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js and configure everything
   - Click "Deploy"

3. **That's it!** Your app will be live in seconds.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Setup HTTPS/SSL

Untuk mengaktifkan HTTPS dengan sertifikat SSL pada server:

- **Quick Start:** Lihat [HTTPS_QUICK_START.md](./HTTPS_QUICK_START.md) untuk panduan cepat
- **Full Guide:** Lihat [HTTPS_SETUP.md](./HTTPS_SETUP.md) untuk dokumentasi lengkap

### Opsi Setup:

1. **Let's Encrypt (Recommended)** - Sertifikat gratis dengan domain name
2. **Self-Signed Certificate** - Untuk testing tanpa domain (browser akan warning)
3. **Cloudflare** - Paling mudah jika punya domain, gratis SSL + CDN

### Quick Commands:

```bash
# With domain (Let's Encrypt)
sudo ./scripts/setup-nginx-letsencrypt.sh

# Without domain (Self-Signed)
sudo ./scripts/setup-ssl-selfsigned.sh
```

## Documentation

- [Backend Setup](./BACKEND_SETUP.md) - Setup database dan API
- [Production Setup](./PRODUCTION_SETUP.md) - Konfigurasi production
- [HTTPS Setup](./HTTPS_SETUP.md) - Setup HTTPS dengan SSL certificate
- [HTTPS Quick Start](./HTTPS_QUICK_START.md) - Quick reference untuk HTTPS

## Salesforce Token Cron (12 jam)

Project ini sudah support refresh token Salesforce otomatis tiap 12 jam.

1. Jalankan migrasi tabel token:

```bash
npm run migrate-salesforce-oauth-token
```

2. Set environment variables:

- `CRON_SECRET`
- `SALESFORCE_CLIENT_ID`
- `SALESFORCE_CLIENT_SECRET`
- `SALESFORCE_USERNAME`
- `SALESFORCE_PASSWORD`
- `SALESFORCE_AUTH_DOMAIN` (opsional, default `https://login.salesforce.com`)

3. Jalankan manual (test):

```bash
npm run refresh-salesforce-token
```

4. Setup cron di VPS (Alibaba Linux/Ubuntu):

```bash
crontab -e
```

Tambahkan baris berikut (sesuaikan path project dan path npm):

```bash
0 */12 * * * cd /path/to/trive-sca && /usr/bin/npm run refresh-salesforce-token >> /var/log/trive-salesforce-token.log 2>&1
```

Atau auto-setup dari script:

```bash
cd /path/to/trive-sca
npm run setup-salesforce-cron
```

Opsional override:

```bash
CRON_PROJECT_PATH=/path/to/trive-sca \
CRON_SCHEDULE="0 */12 * * *" \
CRON_NPM_PATH=/usr/bin/npm \
CRON_LOG_PATH=/var/log/trive-salesforce-token.log \
npm run setup-salesforce-cron
```

5. (Opsional) Trigger via endpoint internal:

- `GET /api/internal/salesforce-token/refresh` (bisa dipanggil oleh cron berbasis curl/wget)
- `POST /api/internal/salesforce-token/refresh` (opsional untuk trigger manual)

Route ini butuh header `Authorization: Bearer <CRON_SECRET>`.

> Catatan:
> - Karena deploy di VPS (bukan Vercel), `vercel.json` tidak dipakai oleh server VPS.
> - Gunakan Linux `crontab` seperti contoh di atas sebagai scheduler utama.
