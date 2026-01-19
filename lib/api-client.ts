// Helper to build API URLs that can switch between local and production hosts.
// If you hit CORS issues with a remote API, enable the built-in proxy:
// - NEXT_PUBLIC_USE_API_PROXY=true (frontend)
// - API_PROXY_TARGET=https://api.domain.com (server env)
const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
const useProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === 'true';

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (useProxy) {
    // Route through Next.js API proxy to avoid browser CORS
    return `/api/proxy${normalizedPath}`;
  }
  return `${baseUrl}${normalizedPath}`;
}
