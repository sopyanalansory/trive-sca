import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { apiLogger, logRouteError } from '@/lib/logger';

const log = apiLogger('investment-account:upload-documents');

export const maxDuration = 30;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB per file
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

function getExtension(mime: string): string {
  if (mime === 'image/png') return 'png';
  return 'jpg';
}

/** POST - Upload foto KTP & selfie, simpan ke disk, return URL path */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || null;
    if (!token) return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 });

    const formData = await request.formData();
    const fotoKtpFile = formData.get('fotoKtp') as File | null;
    const fotoSelfieFile = formData.get('fotoSelfie') as File | null;

    if (!fotoKtpFile?.size && !fotoSelfieFile?.size) {
      return NextResponse.json(
        { error: 'Pilih minimal satu file (foto KTP dan/atau selfie)' },
        { status: 400 }
      );
    }

    const userId = decoded.userId;
    const baseDir = path.join(process.cwd(), 'public', 'uploads', 'investment-docs', String(userId));
    await mkdir(baseDir, { recursive: true });

    const result: { fotoKtp?: string; fotoSelfie?: string } = {};

    if (fotoKtpFile?.size) {
      if (!ALLOWED_TYPES.includes(fotoKtpFile.type)) {
        return NextResponse.json(
          { error: 'Foto KTP: format harus JPG atau PNG' },
          { status: 400 }
        );
      }
      if (fotoKtpFile.size > MAX_SIZE) {
        return NextResponse.json(
          { error: 'Foto KTP: ukuran maksimal 5MB' },
          { status: 400 }
        );
      }
      const ext = getExtension(fotoKtpFile.type);
      const ktpName = `ktp-${Date.now()}.${ext}`;
      const ktpPath = path.join(baseDir, ktpName);
      const buf = Buffer.from(await fotoKtpFile.arrayBuffer());
      await writeFile(ktpPath, buf);
      result.fotoKtp = `/uploads/investment-docs/${userId}/${ktpName}`;
    }

    if (fotoSelfieFile?.size) {
      if (!ALLOWED_TYPES.includes(fotoSelfieFile.type)) {
        return NextResponse.json(
          { error: 'Foto selfie: format harus JPG atau PNG' },
          { status: 400 }
        );
      }
      if (fotoSelfieFile.size > MAX_SIZE) {
        return NextResponse.json(
          { error: 'Foto selfie: ukuran maksimal 5MB' },
          { status: 400 }
        );
      }
      const ext = getExtension(fotoSelfieFile.type);
      const selfieName = `selfie-${Date.now()}.${ext}`;
      const selfiePath = path.join(baseDir, selfieName);
      const buf = Buffer.from(await fotoSelfieFile.arrayBuffer());
      await writeFile(selfiePath, buf);
      result.fotoSelfie = `/uploads/investment-docs/${userId}/${selfieName}`;
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    logRouteError(log, request, error, 'Upload investment documents failed');
    return NextResponse.json(
      { error: 'Gagal mengupload dokumen. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
