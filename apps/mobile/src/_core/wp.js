import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';

export const BASE = 'https://staging.bodhimedicine.com';

const NONCE_KEY = 'wp_nonce';
let _nonce = null;

async function buildCookieHeader() {
  const all = await CookieManager.get(BASE);
  const pairs = [];
  for (const [name, cookie] of Object.entries(all || {})) {
    if (cookie?.value) {
      pairs.push(`${name}=${cookie.value}`);
    }
  }
  return pairs.join('; ');
}

const isWP = (urlOrPath) => {
  try {
    const url = new URL(urlOrPath, BASE);
    return url.pathname.startsWith('/wp-json/');
  } catch {
    const path = String(urlOrPath || '');
    return path.startsWith('/wp-json/');
  }
};

export async function ensureNonce(force = false) {
  if (!force && _nonce) {
    return _nonce;
  }

  if (!force) {
    const cached = await AsyncStorage.getItem(NONCE_KEY);
    if (cached) {
      _nonce = cached;
      return _nonce;
    }
  }

  const headers = {};
  const cookie = await buildCookieHeader();
  if (cookie) {
    headers.Cookie = cookie;
  }

  const res = await fetch(`${BASE}/wp-json/bm/v1/rest-nonce`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    await AsyncStorage.removeItem(NONCE_KEY);
    throw new Error('rest-nonce 401');
  }

  const data = await res.json().catch(() => ({}));
  const nonce = data?.nonce || data?.data?.nonce || data?.x_wp_nonce || null;
  if (!nonce) {
    throw new Error('rest-nonce sin nonce');
  }

  _nonce = nonce;
  await AsyncStorage.setItem(NONCE_KEY, nonce);
  return _nonce;
}

async function headersWithNonce(headers = {}, force = false) {
  try {
    const nonce = await ensureNonce(force);
    return nonce ? { ...headers, 'X-WP-Nonce': nonce } : headers;
  } catch (error) {
    console.warn('[wp] ensureNonce failed', error);
    return headers;
  }
}

export async function wpLogin(email, password) {
  await CookieManager.clearAll(true);
  await AsyncStorage.removeItem(NONCE_KEY);
  _nonce = null;

  const res = await fetch(`${BASE}/wp-json/bm/v1/form-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: `${BASE}/` },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(`login ${res.status}`);
  }

  if (data?.nonce) {
    _nonce = data.nonce;
    await AsyncStorage.setItem(NONCE_KEY, data.nonce);
  }

  return data;
}

export async function wpFetch(path, options = {}) {
  const { method = 'GET', headers = {}, body, retry = true } = options;
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const needsWPAuth = isWP(url);

  const cookie = await buildCookieHeader();
  let requestHeaders = {
    'Content-Type': 'application/json',
    Referer: `${BASE}/`,
    ...(cookie ? { Cookie: cookie } : {}),
    ...headers,
  };

  delete requestHeaders.Authorization;
  delete requestHeaders.authorization;

  if (needsWPAuth) {
    requestHeaders = await headersWithNonce(requestHeaders);
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body,
    credentials: 'include',
  });

  if (needsWPAuth && retry && (response.status === 401 || response.status === 403)) {
    _nonce = null;
    await AsyncStorage.removeItem(NONCE_KEY);
    return wpFetch(path, { method, headers, body, retry: false });
  }

  return response;
}

export const wpGet = (path) => wpFetch(path, { method: 'GET' });

export const wpPost = (path, data) =>
  wpFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data ?? {}),
  });
