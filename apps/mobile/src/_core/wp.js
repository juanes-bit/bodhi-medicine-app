import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';

export const BASE = 'https://staging.bodhimedicine.com';

const NONCE_KEY = 'wp_nonce';
const USER_ID_KEY = 'wp_user_id';
const CANDIDATE_NONCE_ENDPOINTS = [
  '/wp-json/bm/v1/nonce',
  '/wp-json/bodhi/v1/nonce',
  '/wp-json/wp/v1/nonce',
  '/?rest_route=/wp/v1/nonce',
];

const NONCE_TTL_MS = 9 * 60 * 1000;
let _nonce = null;
let _nonceExp = 0;
let _retrying = false;
let _inRefresh = false;

const sanitizeNonce = (nonce) => {
  // helper to sanitize nonce-like values returned by different endpoints

  if (!nonce) return null;
  try {
    const trimmed = String(nonce).trim().replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
    return /^[a-zA-Z0-9]+$/.test(trimmed) ? trimmed : null;
  } catch {
    return null;
  }
};

function pickNonceLike(obj) {
  if (!obj || typeof obj !== 'object') return null;
  return (obj.nonce || obj.wp_nonce || obj.rest_nonce || obj._wpnonce || obj._wp_nonce || null);
}

async function fetchNonceFromEndpoints(endpoints = []) {
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${BASE}${endpoint}`, {
        headers: { Referer: BASE },
        credentials: 'include',
      });
      if (!res.ok) continue;
      const json = await res.json().catch(() => ({}));
      const nonce = sanitizeNonce(pickNonceLike(json));
      if (nonce) return nonce;
    } catch (_) {}
  }
  return null;
}

async function buildCookieHeader() {
  const all = await CookieManager.get(BASE);
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

const withNonceQuery = (url, nonce) => {
  if (!nonce) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('_wpnonce')) parsed.searchParams.set('_wpnonce', nonce);
    return parsed.toString();
  } catch {
    return url;
  }
};

const toURL = (path) => (path.startsWith('http') ? path : `${BASE}${path}`);
const now = () => Date.now();
const isExpired = () => !_nonce || now() > _nonceExp;

export async function ensureNonce(force = false) {
  if (!force && !isExpired()) return _nonce;
  if (_inRefresh) return _nonce;

  _inRefresh = true;
  try {
    const saved = sanitizeNonce(await AsyncStorage.getItem(NONCE_KEY));
    if (!force && saved && !isExpired()) {
      _nonce = saved;
      _nonceExp = now() + NONCE_TTL_MS;
      return _nonce;
    }

    const candidates = [
      '/wp-json/wp/v2/users/me',
      '/wp-json/bodhi/v1/me',
    ];

    for (const endpoint of candidates) {
      try {
        const res = await fetch(`${BASE}${endpoint}`, {
          headers: { Referer: BASE },
          credentials: 'include',
        });

        const headerNonce = sanitizeNonce(
          res.headers.get('X-WP-Nonce') || res.headers.get('x-wp-nonce'),
        );
        if (headerNonce) {
          _nonce = headerNonce;
          _nonceExp = now() + NONCE_TTL_MS;
          await AsyncStorage.setItem(NONCE_KEY, _nonce);
          return _nonce;
        }

        if (!res.ok) continue;
        const data = await res.json().catch(() => ({}));
        const dataNonce = sanitizeNonce(
          data?.nonce ?? data?._wp_nonce ?? data?.x_wp_nonce ?? data?.data?.nonce,
        );
        if (dataNonce) {
          _nonce = dataNonce;
          _nonceExp = now() + NONCE_TTL_MS;
          await AsyncStorage.setItem(NONCE_KEY, _nonce);
          return _nonce;
        }
      } catch (_) {}
    }

    const restNonce = await fetchNonceFromEndpoints(CANDIDATE_NONCE_ENDPOINTS);
    if (restNonce) {
      _nonce = restNonce;
      _nonceExp = now() + NONCE_TTL_MS;
      await AsyncStorage.setItem(NONCE_KEY, _nonce);
      return _nonce;
    }

    _nonce = null;
    _nonceExp = 0;
    await AsyncStorage.removeItem(NONCE_KEY);
    return null;
  } finally {
    _inRefresh = false;
  }
}

export async function wpLogin(email, password) {
  await CookieManager.clearAll(true);
  await AsyncStorage.removeItem(NONCE_KEY);
  _nonce = null;

  const res = await fetch(`${BASE}/wp-json/bm/v1/form-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: BASE },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(`login ${res.status}`);
  }

  if (data?.nonce) {
    const n = sanitizeNonce(data.nonce);
    if (n) {
      _nonce = n;
      _nonceExp = now() + NONCE_TTL_MS;
      await AsyncStorage.setItem(NONCE_KEY, _nonce);
    }
  }

  if (data?.user?.id) {
    await AsyncStorage.setItem(USER_ID_KEY, String(data.user.id));
  }

  return data;
}

export async function wpFetch(path, opts = {}) {
  const url = toURL(path);

  const doFetch = async () => {
    const headers = { ...(opts.headers || {}) };
    const method = opts.method ?? 'GET';
    const body = opts.body;
    const needsNonce = isWP(path);

    const cookieHeader = await buildCookieHeader();
    if (cookieHeader) headers.Cookie = cookieHeader;

    delete headers.Authorization;
    delete headers.authorization;

    if (needsNonce) {
      if (!_nonce) _nonce = sanitizeNonce(await AsyncStorage.getItem(NONCE_KEY));
      if (!_nonce) await ensureNonce();
      const sanitized = sanitizeNonce(_nonce);
      if (sanitized) headers["X-WP-Nonce"] = sanitized;
      headers["Referer"] = headers["Referer"] || BASE;
      headers["X-Requested-With"] = headers["X-Requested-With"] || "XMLHttpRequest";
    }

    const finalUrl =
      needsNonce && _nonce ? withNonceQuery(url, sanitizeNonce(_nonce)) : url;

    return fetch(finalUrl, {
      ...opts,
      method,
      headers,
      body,
      credentials: 'include',
    });
  };

  let response = await doFetch();

  if ((response.status === 401 || response.status === 403) && isWP(path) && !_retrying) {
    try {
      const payload = await response.clone().json().catch(() => ({}));
      const code = payload?.code;
      if (code === "rest_cookie_invalid_nonce" || code === "rest_forbidden") {
        if (__DEV__) console.log("[wpFetch] nonce inválido → refresh");
        _retrying = true;
        _nonce = null;
        await ensureNonce(true);
        response = await doFetch();

        if ((response.status === 401 || response.status === 403) && sanitizeNonce(_nonce)) {
          const fallbackUrl = withNonceQuery(url, sanitizeNonce(_nonce));
          response = await fetch(fallbackUrl, {
            ...opts,
            headers: {
              ...(opts.headers || {}),
              Referer: BASE,
              "X-Requested-With": "XMLHttpRequest",
              "X-WP-Nonce": sanitizeNonce(_nonce),
            },
            credentials: "include",
          });
        }
      }
    } finally {
      _retrying = false;
    }
  }

  if (opts.raw) return response;
  try {
    return await response.json();
  } catch {
    return null;
  }
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
