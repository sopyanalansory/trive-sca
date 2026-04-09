import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days
const PASSWORD_RESET_JWT_EXPIRES_IN = '30m';

export type JwtPayload = {
  userId: number;
  email: string;
  accountId?: string | null;
  leadId?: string | null;
};

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(
  userId: number,
  email: string,
  accountId?: string | null,
  leadId?: string | null
): string {
  return jwt.sign(
    { userId, email, accountId: accountId ?? null, leadId: leadId ?? null },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token (session); rejects special-purpose JWTs like password_reset.
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded !== 'object' || decoded === null) return null;
    if ('purpose' in decoded) return null;
    return decoded as JwtPayload;
  } catch {
    return null;
  }
}

/** Short-lived token after WhatsApp OTP is verified (forgot-password step 2). */
export function generatePasswordResetToken(email: string): string {
  const normalized = email.toLowerCase().trim();
  return jwt.sign(
    { purpose: 'password_reset', email: normalized },
    JWT_SECRET,
    { expiresIn: PASSWORD_RESET_JWT_EXPIRES_IN }
  );
}

export function verifyPasswordResetToken(token: string): { email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
      purpose?: string;
      email?: string;
    };
    if (decoded.purpose !== 'password_reset' || typeof decoded.email !== 'string') {
      return null;
    }
    return { email: decoded.email.toLowerCase().trim() };
  } catch {
    return null;
  }
}

// Generate random verification code (4-6 digits)
export function generateVerificationCode(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

