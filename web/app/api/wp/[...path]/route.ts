import { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET = (process.env.WP_BASE ?? 'https://staging.bodhimedicine.com').replace(/\/+$/,'');

async function handler(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const joined = path.join('/');
  const search = req.nextUrl.search || '';
  const upstream = `${TARGET}/${joined}${search}`;

  const headers = new Headers(req.headers);
  headers.set('accept-encoding', 'identity');
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');

  const session = req.cookies.get('wp_session')?.value;
  if (session) headers.set('cookie', session); else headers.delete('cookie');

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
  for (let cookie of setCookies) {
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
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
};
