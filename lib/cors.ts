/**
 * Origins allowed to call this app’s API from the browser (CORS).
 * Keep in sync with any reverse-proxy CORS config if applicable.
 */
export const CORS_ALLOWED_ORIGINS = [
    "https://framercanvas.com",
    "https://www.framercanvas.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://trive.co.id",
    "https://www.trive.co.id",
    "https://triveinvest.co.id",
    "https://www.triveinvest.co.id",
] as const

/**
 * Response headers for CORS. Unknown origins fall back to `*` so existing
 * clients (e.g. tooling) keep working; known origins are echoed explicitly.
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
    const allowOrigin =
        origin && CORS_ALLOWED_ORIGINS.includes(origin as (typeof CORS_ALLOWED_ORIGINS)[number])
            ? origin
            : "*"

    return {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
    }
}
