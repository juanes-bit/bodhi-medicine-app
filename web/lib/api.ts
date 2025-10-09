let nonce: string | null = null;

const FALLBACK_BASE = 'https://staging.bodhimedicine.com';

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function joinUrl(base: string, path: string) {
  const normalizedBase = base ? stripTrailingSlash(base) : '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function resolveUrl(path: string) {
  const envBase = process.env.NEXT_PUBLIC_BASE?.trim();
  const wpBase = process.env.WP_BASE?.trim();

  if (typeof window !== 'undefined') {
    if (envBase) {
      const trimmed = stripTrailingSlash(envBase);
      if (/^https?:\/\//i.test(trimmed)) {
        try {
          const envUrl = new URL(trimmed);
          if (envUrl.origin === window.location.origin) {
            const prefix = envUrl.pathname === '/' ? '' : envUrl.pathname;
            return joinUrl(prefix, path);
          }
        } catch {
          // ignore parse errors and treat as relative
        }
      } else {
        const relative = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        return joinUrl(relative, path);
      }
    }
    return joinUrl('/api/wp', path);
  }

  const serverBase =
    (envBase && /^https?:\/\//i.test(envBase) ? envBase : wpBase) ?? FALLBACK_BASE;
  return joinUrl(serverBase, path);
}

export function setNonce(n: string) {
  nonce = n;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('wp_nonce', n);
    } catch {
      // ignore storage errors
    }
    try {
      const maxAge = 60 * 60 * 24 * 14; // 14 días ~ 2 semanas
      document.cookie = `wp_nonce=${encodeURIComponent(n)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } catch {
      // ignore cookie errors
    }
  }
}

export function getNonce() {
  if (nonce) return nonce;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('wp_nonce');
    if (stored) {
      nonce = stored;
      return stored;
    }
    const match = document.cookie.match(/(?:^|;\s*)wp_nonce=([^;]+)/);
    if (match) {
      const value = decodeURIComponent(match[1]);
      localStorage.setItem('wp_nonce', value);
      nonce = value;
      return value;
    }
    return '';
  }
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
  const res = await fetch(resolveUrl(path), {
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
    resolveUrl('/wp-admin/admin-ajax.php?action=bodhi_login'),
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
