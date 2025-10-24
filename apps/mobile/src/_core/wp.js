import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';

const WP_BASE = 'https://staging.bodhimedicine.com';
export const BASE = WP_BASE;

const USER_ID_KEY = 'wp_user_id';

let REST_NONCE = null;
let REST_NONCE_TS = 0;
const NONCE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

const normalizeNonce = (value) => {
  if (!value) return null;
  try {
    return String(value).trim().replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
  } catch {
    return null;
  }
};

const isNonceFresh = () => Boolean(REST_NONCE) && Date.now() - REST_NONCE_TS < NONCE_TTL_MS;

async function buildCookieHeader() {
  const all = await CookieManager.get(WP_BASE);
  const pairs = [];
  for (const cookie of Object.values(all || {})) {
    if (cookie?.value) {
      pairs.push(`${cookie.name}=${cookie.value}`);
    }
  }
  return pairs.join('; ');
}

const isWP = (value = '') => {
  try {
    if (value.startsWith('/wp-json/')) return true;
    const url = new URL(value);
    return url.pathname.startsWith('/wp-json/');
  } catch {
    return String(value || '').includes('/wp-json/');
  }
};

async function scrapeRestNonce() {
  try {
    const headers = { Accept: 'text/html,*/*' };
    const cookieHeader = await buildCookieHeader();
    if (cookieHeader) headers.Cookie = cookieHeader;

    const res = await fetch(`${WP_BASE}/`, {
      method: 'GET',
      credentials: 'include',
      headers,
    });

    const html = await res.text();

    let match = html.match(/wpApiSettings\s*=\s*({[^<]+})/);
    if (match) {
      try {
        const obj = JSON.parse(match[1]);
        const nonce = normalizeNonce(obj?.nonce);
        if (nonce) {
          REST_NONCE = nonce;
          REST_NONCE_TS = Date.now();
          console.log('[wpFetch] nonce ok', `${REST_NONCE.slice(0, 8)}…`);
          return REST_NONCE;
        }
      } catch {}
    }

    match = html.match(/data-wp-api-nonce="([^"]+)"/i);
    if (match) {
      const nonce = normalizeNonce(match[1]);
      if (nonce) {
        REST_NONCE = nonce;
        REST_NONCE_TS = Date.now();
        console.log('[wpFetch] nonce ok', `${REST_NONCE.slice(0, 8)}…`);
        return REST_NONCE;
      }
    }

    match = html.match(/<meta[^>]+name=["']rest-nonce["'][^>]+content=["']([^"']+)["']/i);
    if (match) {
      const nonce = normalizeNonce(match[1]);
      if (nonce) {
        REST_NONCE = nonce;
        REST_NONCE_TS = Date.now();
        console.log('[wpFetch] nonce ok', `${REST_NONCE.slice(0, 8)}…`);
        return REST_NONCE;
      }
    }
  } catch (error) {
    console.log('[wpFetch] scrapeRestNonce error', error?.message);
  }
  return null;
}

export async function ensureNonce(force = false) {
  if (force) {
    REST_NONCE = null;
    REST_NONCE_TS = 0;
  }
  if (isNonceFresh()) return REST_NONCE;
  return await scrapeRestNonce();
}

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

export async function getLoginCookie() {
  const header = await buildCookieHeader();
  return header || null;
}

export async function wpLogin(email, password) {
  await CookieManager.clearAll(true);

  REST_NONCE = null;
  REST_NONCE_TS = 0;

  const res = await fetch(`${WP_BASE}/wp-json/bm/v1/form-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: `${WP_BASE}/` },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  const data = await safeJson(res.clone());
  if (!res.ok || !data?.ok) {
    throw new Error(`login ${res.status}`);
  }

  const responseNonce = normalizeNonce(data?.nonce);
  if (responseNonce) {
    REST_NONCE = responseNonce;
    REST_NONCE_TS = Date.now();
  } else {
    await ensureNonce(true);
  }

  if (data?.user?.id) {
    await AsyncStorage.setItem(USER_ID_KEY, String(data.user.id));
  }

  return data;
}

export async function wpFetch(path, opts = {}) {
  const url = path.startsWith('http') ? path : `${WP_BASE}${path}`;
  const needsNonce = isWP(path);
  const headers = { ...(opts.headers || {}) };
  const method = opts.method ?? 'GET';
  const body = opts.body;

  const cookieHeader = await buildCookieHeader();
  if (cookieHeader && !headers.Cookie) {
    headers.Cookie = cookieHeader;
  }

  if (!headers.Referer && !headers.referer) {
    headers.Referer = `${WP_BASE}/`;
  }

  if (needsNonce) {
    if (!isNonceFresh()) await ensureNonce();
    if (isNonceFresh() && !headers['X-WP-Nonce'] && !headers['x-wp-nonce']) {
      headers['X-WP-Nonce'] = REST_NONCE;
    }
    headers['X-Requested-With'] = headers['X-Requested-With'] || 'XMLHttpRequest';
  }

  const requestInit = {
    ...opts,
    method,
    headers,
    body,
    credentials: 'include',
  };

  let response = await fetch(url, requestInit);

  if (response.status === 403 && needsNonce) {
    const payload = await safeJson(response.clone());
    if (payload?.code === 'rest_cookie_invalid_nonce') {
      console.log('[wpFetch] nonce inválido → refresh');
      await ensureNonce(true);
      if (isNonceFresh()) {
        headers['X-WP-Nonce'] = REST_NONCE;
        response = await fetch(url, {
          ...requestInit,
          headers,
        });
      }
    }
  }

  if (opts.raw) return response;

  const data = await safeJson(response.clone());
  if (!response.ok) {
    const error = new Error(data?.message || response.statusText);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const wpGet = (path) => wpFetch(path, { method: 'GET' });

export const wpPost = (path, data) =>
  wpFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data ?? {}),
  });

export async function wpGetStoredUserId() {
  try {
    const value = await AsyncStorage.getItem(USER_ID_KEY);
    return value ? parseInt(value, 10) : null;
  } catch {
    return null;
  }
}

export async function wpSetStoredUserId(id) {
  try {
    await AsyncStorage.setItem(USER_ID_KEY, String(id));
  } catch {}
}
