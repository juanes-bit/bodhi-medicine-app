import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';

const DEFAULT_BASE = 'https://staging.bodhimedicine.com';
const configuredBase = process.env.EXPO_PUBLIC_WP_BASE ?? DEFAULT_BASE;
export const BASE = configuredBase.replace(/\/$/, '') || DEFAULT_BASE;

const USER_ID_KEY = 'wp_user_id';
const COOKIE_CACHE_KEY = 'wp_cookie_cache';

let WP_COOKIE = null;
let WP_NONCE = null;
let nonceRefreshPromise = null;

export const setWpSession = ({ cookie, nonce }) => {
  if (cookie) WP_COOKIE = cookie;
  if (nonce) WP_NONCE = nonce;
};

const serializeCookieJar = (jar = {}) =>
  Object.values(jar)
    .filter((cookie) => cookie?.value)
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

const syncCookieFromManager = async () => {
  try {
    const jar = await CookieManager.get(BASE);
    WP_COOKIE = serializeCookieJar(jar) || WP_COOKIE;
    if (WP_COOKIE) {
      await AsyncStorage.setItem(COOKIE_CACHE_KEY, WP_COOKIE);
    }
  } catch {
    // ignore
  }
  return WP_COOKIE;
};

const ensureCookie = async () => {
  if (WP_COOKIE) return WP_COOKIE;
  const stored = await AsyncStorage.getItem(COOKIE_CACHE_KEY);
  if (stored) {
    WP_COOKIE = stored;
    return WP_COOKIE;
  }
  return syncCookieFromManager();
};

const parseResponseBody = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const resolveWpUrl = (path) => {
  if (!path) throw new Error('path_required');
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/wp-json/')) return `${BASE}${path}`;
  const sanitized = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}/wp-json${sanitized}`;
};

async function fetchJson(path, { method = 'GET', headers = {}, body } = {}) {
  const fullUrl = resolveWpUrl(path);
  const isBodhiEndpoint = fullUrl.includes('/wp-json/bodhi/v1/');
  const isWpEndpoint = fullUrl.includes('/wp-json/');
  const needsNonce = isWpEndpoint && !isBodhiEndpoint;

  const baseHeaders = { Accept: 'application/json', ...headers };

  const cookie = await ensureCookie();
  if (cookie && !baseHeaders.Cookie) {
    baseHeaders.Cookie = cookie;
  }

  if (needsNonce && !WP_NONCE) {
    await ensureNonce();
  }
  if (needsNonce && WP_NONCE && !baseHeaders['X-WP-Nonce']) {
    baseHeaders['X-WP-Nonce'] = WP_NONCE;
  }

  const doFetch = async (withNonce = baseHeaders.hasOwnProperty('X-WP-Nonce')) => {
    const finalHeaders = { ...baseHeaders };
    if (!withNonce) delete finalHeaders['X-WP-Nonce'];

    const response = await fetch(fullUrl, {
      method,
      headers: finalHeaders,
      body,
      credentials: 'include',
    });

    const data = await parseResponseBody(response);

    if (
      needsNonce &&
      withNonce &&
      (response.status === 401 || response.status === 403) &&
      data &&
      typeof data === 'object' &&
      (data.code === 'rest_cookie_invalid_nonce' || data.code === 'rest_forbidden')
    ) {
      const refreshed = await refreshNonce();
      if (refreshed && withNonce) {
        baseHeaders['X-WP-Nonce'] = refreshed;
        const retryHeaders = { ...baseHeaders, 'X-WP-Nonce': refreshed };
        const retryResponse = await fetch(fullUrl, {
          method,
          headers: retryHeaders,
          body,
          credentials: 'include',
        });
        const retryData = await parseResponseBody(retryResponse);
        if (!retryResponse.ok) {
          throw new Error(
            typeof retryData === 'string'
              ? retryData
              : JSON.stringify(retryData || { status: retryResponse.status }),
          );
        }
        return retryData;
      }
    }

    if (!response.ok) {
      throw new Error(
        typeof data === 'string'
          ? data
          : JSON.stringify(data || { status: response.status }),
      );
    }

    return data;
  };

  return doFetch(Boolean(baseHeaders['X-WP-Nonce']));
}

async function refreshNonce() {
  if (nonceRefreshPromise) return nonceRefreshPromise;

  nonceRefreshPromise = (async () => {
    await ensureCookie();
    if (!WP_COOKIE) {
      return null;
    }

    try {
      const res = await fetch(`${BASE}/wp-json/bodhi/v1/nonce`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Cookie: WP_COOKIE,
        },
        credentials: 'include',
      });
      const json = await parseResponseBody(res);
      if (res.ok && json && typeof json === 'object' && json.nonce) {
        WP_NONCE = json.nonce;
        return WP_NONCE;
      }
    } catch {
      // ignore
    }

    try {
      const res = await fetch(`${BASE}/wp-json/bm/v1/form-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: WP_COOKIE,
        },
        body: JSON.stringify({ refresh_nonce: true }),
        credentials: 'include',
      });
      const json = await parseResponseBody(res);
      if (res.ok && json && typeof json === 'object' && json.nonce) {
        WP_NONCE = json.nonce;
        return WP_NONCE;
      }
    } catch {
      // ignore
    }

    WP_NONCE = null;
    return null;
  })();

  try {
    return await nonceRefreshPromise;
  } finally {
    nonceRefreshPromise = null;
  }
}

export async function ensureNonce(force = false) {
  if (force) WP_NONCE = null;
  if (WP_NONCE && !force) return WP_NONCE;
  return refreshNonce();
}

export async function getLoginCookie() {
  const cookie = await ensureCookie();
  return cookie || null;
}

export async function wpLogin(email, password) {
  await CookieManager.clearAll(true);
  WP_COOKIE = null;
  WP_NONCE = null;

  const response = await fetch(`${BASE}/wp-json/bm/v1/form-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  const data = await parseResponseBody(response);
  if (!response.ok || !data || typeof data !== 'object' || !data.ok) {
    throw new Error(
      typeof data === 'string' ? data : `login ${response.status}`,
    );
  }

  await syncCookieFromManager();
  if (typeof data.nonce === 'string' && data.nonce) {
    WP_NONCE = data.nonce;
  }

  if (data?.user?.id) {
    await AsyncStorage.setItem(USER_ID_KEY, String(data.user.id));
  }

  setWpSession({ cookie: WP_COOKIE, nonce: WP_NONCE });
  return data;
}

export async function wpFetch(path, opts = {}) {
  const { method = 'GET', headers = {}, body } = opts;
  return fetchJson(path, { method, headers, body });
}

export const wpGet = (path, options = {}) =>
  wpFetch(path, { ...options, method: 'GET' });

export const wpPost = (path, body = {}, options = {}) =>
  wpFetch(path, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: JSON.stringify(body ?? {}),
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
