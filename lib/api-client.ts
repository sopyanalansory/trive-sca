// Helper to build API URLs that can switch between local and production hosts.
// If you hit CORS issues with a remote API, enable the built-in proxy:
// - NEXT_PUBLIC_USE_API_PROXY=true (frontend)
// - API_PROXY_TARGET=https://api.domain.com (server env)
// With NEXT_PUBLIC_BASE_PATH (e.g. /sca), same-origin paths must include that prefix.
import { getPublicBasePath } from "@/lib/public-base-path";

const appBase = getPublicBasePath();
const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const useProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === "true";

function withAppBase(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!appBase) return p;
  return `${appBase}${p}`;
}

export function buildApiUrl(path: string): string {
  if (!path) {
    return "";
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (useProxy) {
    return withAppBase(`/api/proxy${normalizedPath}`);
  }
  if (baseUrl) {
    return `${baseUrl}${normalizedPath}`;
  }
  return withAppBase(normalizedPath);
}
