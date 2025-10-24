import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';

const WP_BASE = 'https://staging.bodhimedicine.com';
export const BASE = WP_BASE;

const USER_ID_KEY = 'wp_user_id';
const NONCE_ENDPOINT = '/wp-json/bodhi/v1/nonce';
const NONCE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

let REST_NONCE = null;
let REST_NONCE_TS = 0;
let nonceRefreshPromise = null;

const normalizeNonce = (value) => {
  if (!value) return null;
  try {
    return String(value).trim().replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
  } catch {
    return null;
  }
};

const isNonceFresh = () => Boolean(REST_NONCE) && Date.now() - REST_NONCE_TS < NONCE_TTL_MS;

const stampNonce = (nonce) => {
  REST_NONCE = nonce || null;
  REST_NONCE_TS = nonce ? Date.now() : 0;
  return REST_NONCE;
};

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

const toAbsoluteUrl = (input) => {
  if (!input) return new URL(WP_BASE);
  if (typeof input === 'string' && input.startsWith('http')) return new URL(input);
  const path = typeof input === 'string' ? (input.startsWith('/') ? input : `/${input}`) : input;
  return new URL(path, `${WP_BASE}/`);
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

export async function ensureNonce(force = false) {
  if (force) stampNonce(null);
  if (isNonceFresh()) return REST_NONCE;
  if (nonceRefreshPromise) return nonceRefreshPromise;

  nonceRefreshPromise = (async () => {
    try {
      const res = await fetch(`${WP_BASE}${NONCE_ENDPOINT}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Referer: `${WP_BASE}/`,
          Accept: 'application/json',
        },
      });
      if (!res.ok) throw new Error(`nonce ${res.status}`);
      const data = await res.json().catch(() => ({}));
      const nonce = normalizeNonce(data?.nonce);
      return stampNonce(nonce);
    } catch (error) {
      console.log('[wpFetch] nonce fetch failed', error?.message || error);
      return stampNonce(null);
    }
  })();

  try {
    return await nonceRefreshPromise;
  } finally {
    nonceRefreshPromise = null;
  }
}

export async function getLoginCookie() {
  const header = await buildCookieHeader();
  return header || null;
}

export async function wpLogin(email, password) {
  await CookieManager.clearAll(true);
  stampNonce(null);

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
    stampNonce(responseNonce);
  } else {
    await ensureNonce(true);
  }

  if (data?.user?.id) {
    await AsyncStorage.setItem(USER_ID_KEY, String(data.user.id));
  }

  return data;
}

export async function wpFetch(path, opts = {}) {
  const url = toAbsoluteUrl(path);
  const headers = new Headers(opts.headers || {});

  const cookieHeader = await buildCookieHeader();
  if (cookieHeader && !headers.has('Cookie')) headers.set('Cookie', cookieHeader);

  if (!headers.has('Referer')) headers.set('Referer', `${WP_BASE}/`);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  const needsNonce = url.pathname.startsWith('/wp-json/');
  let nonce = null;
  if (needsNonce) {
    nonce = normalizeNonce(REST_NONCE) || (await ensureNonce());
    if (nonce) {
      headers.set('X-WP-Nonce', nonce);
      url.searchParams.set('_wpnonce', nonce);
    }
    if (!headers.has('X-Requested-With')) headers.set('X-Requested-With', 'XMLHttpRequest');
  }

  const requestInit = {
    ...opts,
    method: opts.method ?? 'GET',
    body: opts.body,
    headers,
    credentials: 'include',
  };

  let response = await fetch(url.toString(), requestInit);

  if (needsNonce && response.status === 403) {
    const text = await response.clone().text();
    if (text.includes('rest_cookie_invalid_nonce')) {
      const fresh = await ensureNonce(true);
      if (fresh) {
        headers.set('X-WP-Nonce', fresh);
        url.searchParams.set('_wpnonce', fresh);
        response = await fetch(url.toString(), {
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
