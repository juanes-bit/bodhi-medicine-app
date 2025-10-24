import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';

export const BASE = 'https://staging.bodhimedicine.com';

const USER_ID_KEY = 'wp_user_id';
const NONCE_ENDPOINT = '/wp-json/bodhi/v1/nonce';

let CACHED_NONCE = null;

const normalizeNonce = (value) => {
  if (!value) return null;
  try {
    return String(value).trim().replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
  } catch {
    return null;
  }
};

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

const toAbsoluteUrl = (path) =>
  path && path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? path : `/${path}`}`;

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

export async function ensureNonce(force = false) {
  if (force) CACHED_NONCE = null;
  if (CACHED_NONCE && !force) return CACHED_NONCE;

  try {
    const res = await fetch(`${BASE}${NONCE_ENDPOINT}`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      CACHED_NONCE = normalizeNonce(data?.nonce) ?? null;
      return CACHED_NONCE;
    }
  } catch {
    // ignore
  }

  CACHED_NONCE = null;
  return null;
}

export async function getLoginCookie() {
  const header = await buildCookieHeader();
  return header || null;
}

export async function wpLogin(email, password) {
  await CookieManager.clearAll(true);
  CACHED_NONCE = null;

  const res = await fetch(`${BASE}/wp-json/bm/v1/form-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: `${BASE}/` },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  const data = await safeJson(res.clone());
  if (!res.ok || !data?.ok) {
    throw new Error(`login ${res.status}`);
  }

  const responseNonce = normalizeNonce(data?.nonce);
  if (responseNonce) {
    CACHED_NONCE = responseNonce;
  }

  if (data?.user?.id) {
    await AsyncStorage.setItem(USER_ID_KEY, String(data.user.id));
  }

  return data;
}

export async function wpFetch(path, opts = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    includeNonce = false,
    requireNonce = false,
    raw = false,
  } = opts;

  if (!path) throw new Error('path_required');

  const url = toAbsoluteUrl(path);
  const baseHeaders = { Accept: 'application/json', ...headers };
  if (!('Referer' in baseHeaders) && !('referer' in baseHeaders)) {
    baseHeaders.Referer = `${BASE}/`;
  }

  const cookieHeader = await buildCookieHeader();
  if (cookieHeader && !('Cookie' in baseHeaders)) {
    baseHeaders.Cookie = cookieHeader;
  }

  let nonce = null;
  if (includeNonce || requireNonce) {
    nonce = await ensureNonce();
    if (requireNonce && !nonce) throw new Error('nonce_unavailable');
    if (nonce) baseHeaders['X-WP-Nonce'] = nonce;
  }

  const doFetch = async (withNonce) => {
    const finalHeaders = { ...baseHeaders };
    if (!withNonce) delete finalHeaders['X-WP-Nonce'];

    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body,
      credentials: 'include',
    });

    if (res.status === 401 || res.status === 403) {
      try {
        const payload = await res.clone().json();
        if (payload?.code === 'rest_cookie_invalid_nonce') {
          CACHED_NONCE = null;
          if (withNonce) {
            return doFetch(false);
          }
        }
      } catch {
        // ignore
      }
    }

    return res;
  };

  const response = await doFetch(Boolean(nonce));

  if (raw) return response;

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `${response.status}`);
  }

  if (response.status === 204) return null;
  return safeJson(response);
}

export const wpGet = (path, options = {}) => wpFetch(path, { ...options, method: 'GET' });

export const wpPost = (path, data, options = {}) =>
  wpFetch(path, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: JSON.stringify(data ?? {}),
    requireNonce: true,
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
  } catch {
    // ignore
  }
}
