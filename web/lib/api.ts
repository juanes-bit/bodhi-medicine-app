let nonce: string | null = null;
const BASE = process.env.NEXT_PUBLIC_BASE!; // https://staging.bodhimedicine.com

export function setNonce(n: string) {
  nonce = n;
  if (typeof window !== 'undefined') localStorage.setItem('nonce', n);
}

export function getNonce() {
  if (nonce) return nonce;
  if (typeof window !== 'undefined') return localStorage.getItem('nonce') ?? '';
  return '';
}

async function handleJson(res: Response) {
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      const next = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?next=${next}`;
    }
    throw new Error(`Auth ${res.status}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'X-WP-Nonce': getNonce(),
      ...(init.headers || {}),
    },
  });
  return handleJson(res);
}

export type CourseListItem = {
  id: number; title: string; slug: string; type: string; access: string;
};
export type Lesson = { id: number; title: string };
export type Module = { id: number; title: string; lessons: Lesson[] };
export type CourseDetail = { id: number; title: string; modules?: Module[] };
export type ProgressRes = { summary: { pct?: number }, lessons: Array<{id:number; done:boolean}> };

export async function login(username: string, password: string) {
  const res = await fetch(
    `${BASE}/wp-admin/admin-ajax.php?action=bodhi_login`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password }).toString(),
    }
  );
  const json = await handleJson(res);
  if (!json?.ok || !json?.nonce) throw new Error('Login inválido');
  setNonce(json.nonce);
  return json; // { ok, user, nonce }
}
