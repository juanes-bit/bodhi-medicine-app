 import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';

function normInt(value: string | null | undefined, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? String(Math.floor(num)) : String(fallback);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET = (process.env.WP_BASE ?? 'https://staging.bodhimedicine.com').replace(/\/+$/,'');

async function handler(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const joined = path.join('/');
  const nextUrl = req.nextUrl;
  const searchParams = new URLSearchParams(nextUrl.searchParams); // copy to mutate safely
  if (searchParams.has('page')) {
    searchParams.set('page', normInt(searchParams.get('page'), 1));
  }
  if (searchParams.has('per_page')) {
    searchParams.set('per_page', normInt(searchParams.get('per_page'), 12));
  }
  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const action = nextUrl.searchParams.get('action');
  const upstream = `${TARGET}/${joined}${search}`;

  const headers = new Headers(req.headers);
  headers.set('accept-encoding', 'identity');
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');

  const session = req.cookies.get('wp_session')?.value ?? null;
  const isLoginRequest = joined === 'wp-admin/admin-ajax.php' && action === 'bodhi_login';
  const cookieHeader = headers.get('cookie');

  if (isLoginRequest) {
    headers.delete('cookie');
  } else if (cookieHeader || session) {
    const parts = (cookieHeader ?? '')
      .split(/;\s*/)
      .map(part => part.trim())
      .filter(Boolean)
      .filter(part => !/^wp_session=/i.test(part));

    let hasLoggedIn = parts.some(part => /^wordpress_logged_in_/i.test(part));
    if (session && !hasLoggedIn && !isLoginRequest) {
      parts.push(session);
      hasLoggedIn = true;
    }

    if (parts.length) headers.set('cookie', parts.join('; '));
    else headers.delete('cookie');
  } else {
    headers.delete('cookie');
  }

  const body = req.method === 'GET' || req.method === 'HEAD'
    ? undefined
    : Buffer.from(await req.arrayBuffer());

  const upstreamRes = await fetch(upstream, {
    method: req.method,
    headers,
    body,
    redirect: 'manual',
    cache: 'no-store',
  });

  const outHeaders = new Headers(upstreamRes.headers);
  outHeaders.delete('content-encoding');
  outHeaders.delete('content-length');
  outHeaders.delete('connection');

  const rawSet = (upstreamRes.headers as any).getSetCookie?.() as string[] | undefined;
  const setCookies = rawSet ?? (upstreamRes.headers.get('set-cookie') ? upstreamRes.headers.get('set-cookie')!.split(/,(?=[^ ;]+=)/g) : []);
  outHeaders.delete('set-cookie');

  let bridgeValue: string | null = null;
  for (const cookie of setCookies) {
    if (!cookie) continue;
    const trimmed = cookie.trim();
    if (!/wordpress_logged_in_|wordpress_sec_|wp-settings-/i.test(trimmed)) continue;

    let rewritten = trimmed
      .replace(/;\s*Domain=[^;]*/ig, '')
      .replace(/;\s*Secure/ig, '')
      .replace(/;\s*SameSite=None/ig, '; SameSite=Lax')
      .replace(/;\s*Path=[^;]*/ig, '; Path=/');
    if (!/;\s*SameSite=/i.test(rewritten)) rewritten += '; SameSite=Lax';
    if (!/;\s*Path=/i.test(rewritten)) rewritten += '; Path=/';

    outHeaders.append('set-cookie', rewritten);

    if (!bridgeValue) {
      const match = rewritten.match(/(wordpress_logged_in_[^=]+=[^;]+)/i);
      if (match) bridgeValue = match[1];
    }
  }

  const response = new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: outHeaders,
  });

  if (bridgeValue) {
    response.cookies.set('wp_session', bridgeValue, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: false,
    });
  }

  return response;
}

export {
  handler as DELETE, handler as GET, handler as OPTIONS, handler as PATCH, handler as POST,
  handler as PUT
};

