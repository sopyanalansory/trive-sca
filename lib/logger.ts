import pino from "pino";
import type { NextRequest } from "next/server";

const level =
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

/**
 * API logger: JSON ke stdout (cocok untuk Vercel/hosting & `| pino-pretty` saat dev).
 * Jangan log secret mentah; gunakan redact paths + hindari menaruh OTP/password di objek log.
 */
export const logger = pino({
  level,
  base: {
    service: "trive-sca-api",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      "password",
      "newPassword",
      "currentPassword",
      "verificationCode",
      "otp",
      "*.otp",
      "authorization",
      "*.authorization",
      "req.headers.authorization",
      "token",
      "access_token",
      "refresh_token",
      "SALESFORCE_CLIENT_SECRET",
      "API-Key",
    ],
    remove: true,
  },
});

/** Field aman untuk request tracing (Edge-safe: jangan import ini dari middleware Edge jika pakai pino di Edge). */
export function requestLogFields(request: NextRequest) {
  return {
    path: request.nextUrl.pathname,
    method: request.method,
    requestId:
      request.headers.get("x-vercel-id") ??
      request.headers.get("x-request-id") ??
      undefined,
  };
}

/** Logger anak dengan modul/route tetap di log line. */
export function apiLogger(module: string) {
  return logger.child({ module });
}

/** Catch handler: satu format untuk error di route API. */
export function logRouteError(
  log: pino.Logger,
  request: NextRequest,
  error: unknown,
  msg: string
): void {
  const base = requestLogFields(request);
  if (error instanceof Error) {
    log.error({ err: error, ...base }, msg);
    return;
  }
  log.error({ ...base, detail: error }, msg);
}
