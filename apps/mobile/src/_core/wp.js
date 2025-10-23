import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';

export const BASE = 'https://staging.bodhimedicine.com';

const NONCE_KEY = 'wp_nonce';
const USER_ID_KEY = 'wp_user_id';
let _nonce = null;

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

const isWP = (urlOrPath) => {
  try {
    return new URL(urlOrPath, BASE).pathname.startsWith('/wp-json/');
  } catch {
    return String(urlOrPath || '').includes('/wp-json/');
  }
};

const toURL = (path) => (path.startsWith('http') ? path : `${BASE}${path}`);

export async function ensureNonce(force = false) {
  if (!force && _nonce) return _nonce;

  if (!force) {
    const saved = await AsyncStorage.getItem(NONCE_KEY);
    if (saved) {
      _nonce = saved;
      return _nonce;
    }
  }

  try {
    const res = await fetch(`${BASE}/wp-json/bm/v1/rest-nonce`, {
      headers: { Referer: BASE },
      credentials: 'include',
    });

    if (res.ok) {
      const payload = await res.json().catch(() => ({}));
      _nonce = payload?.nonce ?? null;
      if (_nonce) await AsyncStorage.setItem(NONCE_KEY, _nonce);
      return _nonce;
    }
  } catch {}

  _nonce = null;
  return null;
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
    _nonce = data.nonce;
    await AsyncStorage.setItem(NONCE_KEY, _nonce);
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
    const needsNonce = isWP(url);

    const cookieHeader = await buildCookieHeader();
    if (cookieHeader) headers.Cookie = cookieHeader;
    if (!headers.Referer) headers.Referer = BASE;

    delete headers.Authorization;
    delete headers.authorization;

    if (needsNonce) {
      if (!_nonce) _nonce = await AsyncStorage.getItem(NONCE_KEY);
      if (!_nonce) await ensureNonce();
      if (_nonce) headers['X-WP-Nonce'] = _nonce;
    }

    return fetch(url, {
      ...opts,
      method,
      headers,
      body,
      credentials: 'include',
    });
  };

  let response = await doFetch();

  if ((response.status === 401 || response.status === 403) && isWP(url)) {
    try {
      const payload = await response.clone().json().catch(() => ({}));
      const code = payload?.code;
      if (code === 'rest_cookie_invalid_nonce' || code === 'rest_forbidden') {
        if (__DEV__) console.log('[wpFetch] nonce inválido → refresh');
        await ensureNonce(true);
        response = await doFetch();
      }
    } catch (_) {}
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
