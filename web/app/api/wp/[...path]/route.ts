import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const WP_BASE = process.env.WP_BASE!; // p.ej. https://staging.bodhimedicine.com

const HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'host',
  'accept-encoding',
]);

function buildUrl(path: string[] = [], req: NextRequest) {
  const joined = path.length ? path.join('/') : '';
  const search = req.nextUrl.search || '';
  const slash = joined ? `/${joined}` : '';
  return `${WP_BASE}${slash}${search}`;
}

function sanitizeReqHeaders(src: Headers) {
  const headers = new Headers();
  src.forEach((value, key) => {
    if (!HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  return headers;
}

function rewriteSetCookies(all?: string[]) {
  return (all ?? []).map((cookie) =>
    cookie
      .replace(/;\s*Domain=[^;]*/ig, '')
      .replace(/;\s*Secure/ig, '')
      .replace(/;\s*Path=[^;]*/i, '; Path=/')
      .concat(/;\s*SameSite=/i.test(cookie) ? '' : '; SameSite=Lax')
  );
}

function sanitizeResHeaders(src: Headers) {
  const out = new Headers();
  src.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'set-cookie' || lower === 'content-encoding' || lower === 'transfer-encoding' || lower === 'content-length' || lower === 'connection') return;
    out.set(key, value);
  });

  const raw = (src as any).raw?.();
  const setCookies: string[] | undefined = raw ? raw['set-cookie'] : undefined;
  for (const cookie of rewriteSetCookies(setCookies)) out.append('set-cookie', cookie);
  return out;
}

async function resolvePath(ctx: { params: { path: string[] } | Promise<{ path: string[] }> }): Promise<string[]> {
  const raw = ctx?.params;
  if (!raw) return [];
  if (typeof (raw as Promise<{ path: string[] }>).then === 'function') {
    const awaited = await raw;
    return awaited?.path ?? [];
  }
  return (raw as { path: string[] })?.path ?? [];
}

async function forward(method: string, req: NextRequest, ctx: { params: { path: string[] } | Promise<{ path: string[] }> }) {
  const path = await resolvePath(ctx);
  const url = buildUrl(path, req);
  const headers = sanitizeReqHeaders(req.headers);

  const isAdminAjax = url.includes('/wp-admin/admin-ajax.php');
  if (isAdminAjax) {
    headers.set('origin', WP_BASE);
    headers.set('referer', `${WP_BASE}/wp-admin/admin-ajax.php`);
  }

  let body: string | ArrayBuffer | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const contentType = req.headers.get('content-type') || '';
    if (isAdminAjax || /application\/x-www-form-urlencoded|json|text/i.test(contentType)) {
      body = await req.text();
      if (isAdminAjax && !/application\/x-www-form-urlencoded/i.test(contentType)) {
        headers.set('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
      }
    } else {
      body = await req.arrayBuffer();
    }
  }

  const upstream = await fetch(url, {
    method,
    headers,
    body,
    redirect: 'manual',
  });
  const resHeaders = sanitizeResHeaders(upstream.headers);
  const buffer = await upstream.arrayBuffer();
  return new Response(buffer, { status: upstream.status, headers: resHeaders });
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } | Promise<{ path: string[] }> }) {
  return forward('GET', req, ctx);
}
export async function POST(req: NextRequest, ctx: { params: { path: string[] } | Promise<{ path: string[] }> }) {
  return forward('POST', req, ctx);
}
export async function PUT(req: NextRequest, ctx: { params: { path: string[] } | Promise<{ path: string[] }> }) {
  return forward('PUT', req, ctx);
}
export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } | Promise<{ path: string[] }> }) {
  return forward('PATCH', req, ctx);
}
export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } | Promise<{ path: string[] }> }) {
  return forward('DELETE', req, ctx);
}
export async function HEAD(req: NextRequest, ctx: { params: { path: string[] } | Promise<{ path: string[] }> }) {
  return forward('HEAD', req, ctx);
}
export async function OPTIONS(req: NextRequest, ctx: { params: { path: string[] } | Promise<{ path: string[] }> }) {
  return forward('OPTIONS', req, ctx);
}
