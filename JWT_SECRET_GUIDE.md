# JWT Secret Security Guide

Panduan lengkap tentang JWT_SECRET dan best practices untuk keamanan.

## Apa itu JWT_SECRET?

JWT_SECRET adalah kunci rahasia yang digunakan untuk:
- **Sign** (menandatangani) JWT token saat user login/register
- **Verify** (memverifikasi) JWT token saat user mengakses protected routes
- **Mencegah** token dipalsukan atau dimodifikasi

## Mengapa JWT_SECRET Harus Secure?

1. **Token Forgery**: Jika JWT_SECRET diketahui, attacker bisa membuat token palsu
2. **Identity Theft**: Attacker bisa login sebagai user lain
3. **Data Breach**: Akses tidak sah ke data user

## Karakteristik JWT_SECRET yang Secure

✅ **Panjang**: Minimal 32 karakter, idealnya 64+ karakter  
✅ **Random**: Harus benar-benar random, tidak bisa ditebak  
✅ **Unik**: Setiap environment (dev, staging, production) harus berbeda  
✅ **Rahasia**: Jangan pernah commit ke repository  
✅ **Entropy Tinggi**: Menggunakan cryptographic random generator  

## Generate JWT_SECRET

### Method 1: Menggunakan Script (Recommended)

```bash
npm run generate-jwt-secret
```

Script ini akan:
- Generate JWT_SECRET yang secure (128 karakter, 512 bits entropy)
- Otomatis update `.env.local` jika file tersebut ada
- Menampilkan secret yang di-generate

### Method 2: Menggunakan Node.js

```bash
node -e "const crypto = require('crypto'); console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));"
```

### Method 3: Menggunakan OpenSSL

```bash
openssl rand -hex 64
```

### Method 4: Menggunakan Online Generator (Tidak Recommended untuk Production)

⚠️ **Warning**: Jangan gunakan online generator untuk production karena secret bisa terlihat oleh pihak ketiga.

## Best Practices

### 1. Environment-Specific Secrets

Gunakan JWT_SECRET yang berbeda untuk setiap environment:

```env
# Development
JWT_SECRET=dev-secret-here...

# Staging
JWT_SECRET=staging-secret-here...

# Production
JWT_SECRET=production-secret-here...
```

### 2. Rotate JWT_SECRET Secara Berkala

**Kapan harus rotate:**
- Setiap 90 hari (recommended)
- Setelah security incident
- Setelah team member yang tahu secret keluar
- Setelah deployment ke production baru

**Cara rotate:**
1. Generate JWT_SECRET baru
2. Update di environment variables
3. Restart aplikasi
4. **Catatan**: User yang sudah login akan perlu login ulang

### 3. Jangan Commit ke Repository

✅ **DO:**
- Simpan di `.env.local` (sudah di `.gitignore`)
- Gunakan secret management service (AWS Secrets Manager, HashiCorp Vault, dll)
- Gunakan environment variables di hosting platform

❌ **DON'T:**
- Commit ke Git
- Share via email/Slack
- Hardcode di source code
- Simpan di dokumentasi publik

### 4. Panjang dan Kompleksitas

| Panjang | Entropy | Security Level | Recommended For |
|---------|---------|----------------|-----------------|
| 32 chars | 256 bits | Good | Development |
| 64 chars | 512 bits | **Excellent** | **Production** |
| 128 chars | 1024 bits | Overkill | High-security apps |

**Recommended**: 64 karakter (512 bits) untuk production.

### 5. Validation

Pastikan JWT_SECRET memenuhi kriteria:

```javascript
// Minimum requirements
const isValid = secret.length >= 32 && /^[a-f0-9]+$/i.test(secret);
```

## Current Setup

JWT_SECRET Anda sudah di-generate dan disimpan di `.env.local`:

```env
JWT_SECRET=<128-character-random-hex-string>
```

**Status**: ✅ Secure (128 karakter, 512 bits entropy)

## Troubleshooting

### Error: JWT_SECRET is not set

**Solution**: Pastikan `.env.local` ada dan berisi JWT_SECRET:
```bash
# Check if JWT_SECRET exists
grep JWT_SECRET .env.local
```

### Error: JWT verification failed

**Possible causes:**
1. JWT_SECRET berbeda antara sign dan verify
2. JWT_SECRET berubah setelah token dibuat
3. Token expired atau invalid

**Solution**: 
- Pastikan JWT_SECRET sama di semua environment
- Check apakah JWT_SECRET tidak berubah secara tidak sengaja

### Token tidak valid setelah restart

**Cause**: JWT_SECRET berubah atau tidak di-load dengan benar

**Solution**:
- Pastikan `.env.local` di-load dengan benar
- Restart development server setelah update JWT_SECRET

## Security Checklist

- [ ] JWT_SECRET minimal 64 karakter
- [ ] JWT_SECRET menggunakan cryptographic random generator
- [ ] JWT_SECRET berbeda untuk setiap environment
- [ ] JWT_SECRET tidak di-commit ke repository
- [ ] JWT_SECRET disimpan di secure location (environment variables)
- [ ] JWT_SECRET di-rotate secara berkala
- [ ] Team member yang tidak perlu tidak tahu JWT_SECRET
- [ ] JWT_SECRET tidak di-share via insecure channels

## Additional Resources

- [JWT.io](https://jwt.io/) - JWT Debugger
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)

## Quick Commands

```bash
# Generate new JWT_SECRET
npm run generate-jwt-secret

# Check current JWT_SECRET (without showing value)
grep -q JWT_SECRET .env.local && echo "JWT_SECRET exists" || echo "JWT_SECRET not found"

# Verify JWT_SECRET length
node -e "require('dotenv').config({path:'.env.local'}); console.log('Length:', process.env.JWT_SECRET?.length || 0)"
```

