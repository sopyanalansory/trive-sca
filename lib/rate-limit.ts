import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCorsHeaders } from "@/lib/cors";

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Client IP (typical reverse proxies: Vercel, nginx). */
export function getClientIp(request: NextRequest | Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  return "unknown";
}

let redisSingleton: Redis | null | "unset" = "unset";

function getRedis(): Redis | null {
  if (redisSingleton !== "unset") {
    return redisSingleton;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisSingleton = null;
    return null;
  }
  redisSingleton = new Redis({ url, token });
  return redisSingleton;
}

/** In-process fixed window (dev / when Upstash is not configured). Not shared across instances. */
const memCounts = new Map<string, number>();

function memIncrement(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; resetMs: number } {
  const slot = Math.floor(Date.now() / windowMs);
  const k = `${key}:${slot}`;
  const next = (memCounts.get(k) ?? 0) + 1;
  if (next > limit) {
    return { success: false, resetMs: (slot + 1) * windowMs };
  }
  memCounts.set(k, next);
  return { success: true, resetMs: (slot + 1) * windowMs };
}

const limiterCache: {
  apiIp?: Ratelimit | null;
  otpSendMsisdn?: Ratelimit | null;
  otpSendEmail?: Ratelimit | null;
  otpVerifyMsisdn?: Ratelimit | null;
  otpVerifyEmail?: Ratelimit | null;
} = {};

function getOtpWindowMinutes(): number {
  return parsePositiveInt(process.env.RATE_LIMIT_OTP_WINDOW_MINUTES, 2);
}

function getOtpWindowDuration(): string {
  return `${getOtpWindowMinutes()} m`;
}

type SlidingWindowDuration = Parameters<typeof Ratelimit.slidingWindow>[1];

function getOtpWindowMs(): number {
  return getOtpWindowMinutes() * 60_000;
}

function getApiIpRatelimit(): Ratelimit | null {
  if (limiterCache.apiIp !== undefined) return limiterCache.apiIp;
  const r = getRedis();
  if (!r) {
    limiterCache.apiIp = null;
    return null;
  }
  const max = parsePositiveInt(process.env.RATE_LIMIT_API_IP_PER_MINUTE, 120);
  limiterCache.apiIp = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(max, "1 m"),
    prefix: "trive:rl:api-ip",
  });
  return limiterCache.apiIp;
}

function getOtpSendMsisdnRatelimit(): Ratelimit | null {
  if (limiterCache.otpSendMsisdn !== undefined) return limiterCache.otpSendMsisdn;
  const r = getRedis();
  if (!r) {
    limiterCache.otpSendMsisdn = null;
    return null;
  }
  const max = parsePositiveInt(process.env.RATE_LIMIT_OTP_SEND_PER_MSISDN, 5);
  limiterCache.otpSendMsisdn = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(
      max,
      getOtpWindowDuration() as SlidingWindowDuration
    ),
    prefix: "trive:rl:otp-send-msisdn",
  });
  return limiterCache.otpSendMsisdn;
}

function getOtpSendEmailRatelimit(): Ratelimit | null {
  if (limiterCache.otpSendEmail !== undefined) return limiterCache.otpSendEmail;
  const r = getRedis();
  if (!r) {
    limiterCache.otpSendEmail = null;
    return null;
  }
  const max = parsePositiveInt(process.env.RATE_LIMIT_OTP_SEND_PER_EMAIL, 5);
  limiterCache.otpSendEmail = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(
      max,
      getOtpWindowDuration() as SlidingWindowDuration
    ),
    prefix: "trive:rl:otp-send-email",
  });
  return limiterCache.otpSendEmail;
}

function getOtpVerifyMsisdnRatelimit(): Ratelimit | null {
  if (limiterCache.otpVerifyMsisdn !== undefined) return limiterCache.otpVerifyMsisdn;
  const r = getRedis();
  if (!r) {
    limiterCache.otpVerifyMsisdn = null;
    return null;
  }
  const max = parsePositiveInt(process.env.RATE_LIMIT_OTP_VERIFY_PER_MSISDN, 20);
  limiterCache.otpVerifyMsisdn = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(
      max,
      getOtpWindowDuration() as SlidingWindowDuration
    ),
    prefix: "trive:rl:otp-verify-msisdn",
  });
  return limiterCache.otpVerifyMsisdn;
}

function getOtpVerifyEmailRatelimit(): Ratelimit | null {
  if (limiterCache.otpVerifyEmail !== undefined) return limiterCache.otpVerifyEmail;
  const r = getRedis();
  if (!r) {
    limiterCache.otpVerifyEmail = null;
    return null;
  }
  const max = parsePositiveInt(process.env.RATE_LIMIT_OTP_VERIFY_PER_EMAIL, 20);
  limiterCache.otpVerifyEmail = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(
      max,
      getOtpWindowDuration() as SlidingWindowDuration
    ),
    prefix: "trive:rl:otp-verify-email",
  });
  return limiterCache.otpVerifyEmail;
}

function rateLimitJsonResponse(
  origin: string | null,
  retryAfterSec: number
): NextResponse {
  return NextResponse.json(
    { error: "Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit." },
    {
      status: 429,
      headers: {
        ...getCorsHeaders(origin),
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}

function retryAfterFromReset(resetMs: number): number {
  return Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
}

async function applyLimit(
  limiter: Ratelimit | null,
  memNamespace: string,
  memLimit: number,
  memWindowMs: number,
  id: string
): Promise<{ success: boolean; reset: number; pending?: Promise<unknown> }> {
  if (limiter) {
    const res = await limiter.limit(id);
    return { success: res.success, reset: res.reset, pending: res.pending };
  }
  const { success, resetMs } = memIncrement(
    `${memNamespace}:${id}`,
    memLimit,
    memWindowMs
  );
  return { success, reset: resetMs };
}

/**
 * Baseline: all API traffic per IP (middleware).
 * Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in production for shared limits.
 */
export async function enforceApiIpLimit(
  request: NextRequest
): Promise<{ response: NextResponse | null; pending?: Promise<unknown> }> {
  const ip = getClientIp(request);
  const limiter = getApiIpRatelimit();
  const max = parsePositiveInt(process.env.RATE_LIMIT_API_IP_PER_MINUTE, 120);
  const { success, reset, pending } = await applyLimit(
    limiter,
    "api-ip",
    max,
    60_000,
    ip
  );
  if (success) {
    return { response: null, pending };
  }
  const origin = request.headers.get("origin");
  return {
    response: rateLimitJsonResponse(origin, retryAfterFromReset(reset)),
    pending,
  };
}

export async function enforceOtpSendByMsisdn(
  request: NextRequest,
  msisdn: string
): Promise<NextResponse | null> {
  const limiter = getOtpSendMsisdnRatelimit();
  const max = parsePositiveInt(process.env.RATE_LIMIT_OTP_SEND_PER_MSISDN, 5);
  const id = msisdn.replaceAll(/\D/g, "") || msisdn;
  const { success, reset } = await applyLimit(
    limiter,
    "otp-send-msisdn",
    max,
    getOtpWindowMs(),
    id
  );
  if (success) return null;
  const origin = request.headers.get("origin");
  return rateLimitJsonResponse(origin, retryAfterFromReset(reset));
}

export async function enforceOtpSendByEmail(
  request: NextRequest,
  email: string
): Promise<NextResponse | null> {
  const limiter = getOtpSendEmailRatelimit();
  const max = parsePositiveInt(process.env.RATE_LIMIT_OTP_SEND_PER_EMAIL, 5);
  const id = email.toLowerCase().trim();
  const { success, reset } = await applyLimit(
    limiter,
    "otp-send-email",
    max,
    getOtpWindowMs(),
    id
  );
  if (success) return null;
  const origin = request.headers.get("origin");
  return rateLimitJsonResponse(origin, retryAfterFromReset(reset));
}

export async function enforceOtpVerifyByMsisdn(
  request: NextRequest,
  msisdn: string
): Promise<NextResponse | null> {
  const limiter = getOtpVerifyMsisdnRatelimit();
  const max = parsePositiveInt(process.env.RATE_LIMIT_OTP_VERIFY_PER_MSISDN, 20);
  const id = msisdn.replaceAll(/\D/g, "") || msisdn;
  const { success, reset } = await applyLimit(
    limiter,
    "otp-verify-msisdn",
    max,
    getOtpWindowMs(),
    id
  );
  if (success) return null;
  const origin = request.headers.get("origin");
  return rateLimitJsonResponse(origin, retryAfterFromReset(reset));
}

export async function enforceOtpVerifyByEmail(
  request: NextRequest,
  email: string
): Promise<NextResponse | null> {
  const limiter = getOtpVerifyEmailRatelimit();
  const max = parsePositiveInt(process.env.RATE_LIMIT_OTP_VERIFY_PER_EMAIL, 20);
  const id = email.toLowerCase().trim();
  const { success, reset } = await applyLimit(
    limiter,
    "otp-verify-email",
    max,
    getOtpWindowMs(),
    id
  );
  if (success) return null;
  const origin = request.headers.get("origin");
  return rateLimitJsonResponse(origin, retryAfterFromReset(reset));
}
