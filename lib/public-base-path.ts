/**
 * Shared with next.config and client bundles.
 * Set NEXT_PUBLIC_BASE_PATH=/sca (or sca) when the app is served under a subpath.
 * Leave unset for local dev at the site root.
 */
export function getPublicBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
  if (!raw) return "";
  const inner = raw.replace(/^\/+|\/+$/g, "");
  return inner ? `/${inner}` : "";
}
