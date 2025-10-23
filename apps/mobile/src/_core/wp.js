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
    return String(urlOrPath || '').startsWith('/wp-json/');
  }
};

export async function ensureNonce(force = false) {
  if (!force && _nonce) {
    return _nonce;
  }

  if (!force) {
    const saved = await AsyncStorage.getItem(NONCE_KEY);
    if (saved) {
      _nonce = saved;
      return _nonce;
    }
  }

  const res = await fetch(`${BASE}/wp-json/bm/v1/rest-nonce`, {
    method: 'GET',
    headers: { Referer: BASE },
    credentials: 'include',
  });

  if (res.status === 401) {
    _nonce = null;
    await AsyncStorage.removeItem(NONCE_KEY);
    return null;
  }

  let payload = {};
  try {
    payload = await res.json();
  } catch {}

  _nonce = payload?.nonce ?? payload?.data?.nonce ?? payload?.x_wp_nonce ?? null;
  if (_nonce) {
    await AsyncStorage.setItem(NONCE_KEY, _nonce);
  }
  return _nonce;
}

async function headersWithNonce(headers = {}) {
  const nonce = await ensureNonce();
  return nonce ? { ...headers, 'X-WP-Nonce': nonce } : headers;
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

export async function wpFetch(path, { method = 'GET', headers = {}, body, retry = true } = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const needsWP = isWP(url);

  const cookieHeader = await buildCookieHeader();
  let requestHeaders = {
    'Content-Type': 'application/json',
    Referer: BASE,
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...headers,
  };

  delete requestHeaders.Authorization;
  delete requestHeaders.authorization;

  if (needsWP) {
    requestHeaders = await headersWithNonce(requestHeaders);
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body,
    credentials: 'include',
  });

  if (needsWP && retry && (response.status === 401 || response.status === 403)) {
    _nonce = null;
    await AsyncStorage.removeItem(NONCE_KEY);
    await ensureNonce(true);
    return wpFetch(path, { method, headers, body, retry: false });
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
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

