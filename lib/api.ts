const BASE = process.env.NEXT_PUBLIC_BASE!; // "/api/wp"
let nonce: string | null = null;

export function setNonce(n: string) {
  nonce = n || '';
  if (typeof window !== 'undefined') localStorage.setItem('nonce', nonce);
}

export function getNonce(): string {
  return nonce || (typeof window !== 'undefined' ? localStorage.getItem('nonce') || '' : '');
}

async function handleJson(res: Response) {
  if (res.status === 401 || res.status === 403) throw new Error(`Auth ${res.status}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function api(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const n = getNonce();
  if (n) headers.set('X-WP-Nonce', n);
  headers.set('Accept', 'application/json');
  return handleJson(
    await fetch(`${BASE}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store',
    }),
  );
}

export async function login(username: string, password: string) {
  setNonce('');

  const res = await fetch(`${BASE}/wp-admin/admin-ajax.php?action=bodhi_login`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: new URLSearchParams({ username, password }).toString(),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  let nonceValue = '';
  try { nonceValue = (JSON.parse(text)?.nonce as string) || ''; } catch {}

  if (!nonceValue) {
    const tokenRes = await fetch(`${BASE}/wp-json/bodhi/v1/auth/token`, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    });
    if (!tokenRes.ok) throw new Error(`Auth ${tokenRes.status}`);
    const tokenJson = await tokenRes.json().catch(() => ({} as any));
    nonceValue = tokenJson?.nonce || tokenRes.headers.get('x-wp-nonce') || '';
  }

  if (!nonceValue) throw new Error('No se pudo obtener nonce');
  setNonce(nonceValue);
  return { ok: true };
}

export type CourseListItem = {
  id: number;
  title: string;
  slug: string;
  type: string;
  access: string;
};

export type Lesson = { id: number; title: string };
export type Module = { id: number; title: string; lessons: Lesson[] };
export type CourseDetail = { id: number; title: string; modules?: Module[] };
export type ProgressRes = {
  summary: { pct?: number };
  lessons: Array<{ id: number; done: boolean }>;
};
