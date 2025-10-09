import { cookies, headers } from 'next/headers';

/** Convierte '/api/...' en 'http(s)://host/api/...' cuando corre en el server */
export async function absoluteUrl(path: string): Promise<string> {
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window !== 'undefined') return path;
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host =
    h.get('x-forwarded-host') ??
    h.get('host') ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') ??
    'localhost:3000';
  return `${proto}://${host}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Encabezados para reenviar cookies del usuario a nuestras rutas /api */
export async function authHeaders(): Promise<HeadersInit> {
  if (typeof window !== 'undefined') return { Accept: 'application/json' };
  const cookieStore = await cookies();
  const cookieJar = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
  const nonce = cookieStore.get('wp_nonce')?.value;
  const headersInit: Record<string, string> = { Accept: 'application/json' };
  if (cookieJar) headersInit.cookie = cookieJar;
  if (nonce) headersInit['X-WP-Nonce'] = nonce;
  return headersInit;
}

/** Parseo robusto: si no es JSON, lanza con snippet de HTML/texto */
export async function parseJsonStrict(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  const txt = await res.text();
  throw new Error(
    `Expected JSON, got ${res.status} ${res.statusText}. Body: ${txt.slice(
      0,
      200
    )}`
  );
}
