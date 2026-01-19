import { NextRequest, NextResponse } from 'next/server';

// Target API (server-side only). Example: https://api.domain.com
const targetBase = (process.env.API_PROXY_TARGET || '').replace(/\/+$/, '');

if (!targetBase) {
  console.warn('API proxy is enabled but API_PROXY_TARGET is not set.');
}

// Headers we do not want to forward back to the client
const hopByHopHeaders = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
];

async function proxy(request: NextRequest) {
  if (!targetBase) {
    return NextResponse.json(
      { error: 'API proxy not configured. Set API_PROXY_TARGET.' },
      { status: 500 }
    );
  }

  const pathSegments = request.nextUrl.pathname.replace(/^\/api\/proxy/, '');
  const targetUrl = `${targetBase}${pathSegments}${request.nextUrl.search}`;

  // Clone headers, but drop host-related ones
  const outgoingHeaders = new Headers(request.headers);
  outgoingHeaders.delete('host');
  outgoingHeaders.delete('content-length');

  const fetchOptions: RequestInit = {
    method: request.method,
    headers: outgoingHeaders,
    redirect: 'manual',
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
  };

  const response = await fetch(targetUrl, fetchOptions);

  // Copy response headers except hop-by-hop
  const incomingHeaders = new Headers(response.headers);
  hopByHopHeaders.forEach((h) => incomingHeaders.delete(h));

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: incomingHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
