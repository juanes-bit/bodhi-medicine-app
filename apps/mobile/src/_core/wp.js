import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';
import { me } from './bodhi';

const DEFAULT_BASE = 'https://staging.bodhimedicine.com';
const configuredBase = process.env.EXPO_PUBLIC_WP_BASE ?? DEFAULT_BASE;
export const BASE = configuredBase.replace(/\/$/, '') || DEFAULT_BASE;
// Normalized REST root so callers can pass bare resource paths.
const API_ROOT = `${BASE}/wp-json`;

const USER_ID_KEY = 'wp_user_id';
const COOKIE_CACHE_KEY = 'wp_cookie_cache';

let WP_COOKIE = null;
let WP_NONCE = null;
let nonceRefreshPromise = null;
let WP_NONCE_TS = 0;

const NONCE_TTL_MS = 10 * 60 * 1000;

export const setWpSession = ({ cookie, nonce }) => {
  if (cookie) WP_COOKIE = cookie;
  if (nonce) {
    WP_NONCE = nonce;
    WP_NONCE_TS = Date.now();
  }
};

const syncCookieFromManager = async () => {
  try {
    const jar = await CookieManager.get(BASE);
    WP_COOKIE = buildCookieString(jar) || WP_COOKIE;
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

function buildCookieString(jar = {}) {
  // Flatten the native cookie jar into a single header string.
  const parts = [];
  Object.entries(jar || {}).forEach(([name, v]) => {
    if (v?.value) {
      parts.push(`${name}=${v.value}`);
    }
  });
  return parts.join('; ');
}

async function buildCookieHeader() {
  try {
    // Always refresh from CookieManager to honor updates from web views.
    const jar = await CookieManager.get(BASE);
    return buildCookieString(jar);
  } catch {
    return '';
  }
}

const parseResponseBody = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export async function wpFetch(path, { method = 'GET', body, headers = {}, nonce = true } = {}) {
  // Shared fetch helper; forces Cookie header on every request.
  const isAbsolute = /^https?:\/\//i.test(path);
  const url = isAbsolute
    ? path
    : `${API_ROOT}${path.startsWith('/wp-json') ? path.replace('/wp-json', '') : path}`;

  const h = {
    Accept: 'application/json',
    Referer: BASE,
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  };

  const cookieHeader = await buildCookieHeader();
  if (cookieHeader) {
    h.Cookie = cookieHeader;
  }

  if (nonce) {
    const currentNonce = await ensureNonce();
    if (currentNonce) {
      h['X-WP-Nonce'] = currentNonce;
    }
  }

  const response = await fetch(url, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const error = new Error(JSON.stringify(data));
    error.status = response.status;
    throw error;
  }

  return data;
}

async function refreshNonce() {
  if (nonceRefreshPromise) return nonceRefreshPromise;

  nonceRefreshPromise = (async () => {
    await ensureCookie();
    if (!WP_COOKIE) {
      return null;
    }

    const nonceCandidates = [
      '/wp-json/bodhi-mobile/v1/nonce',
      '/wp-json/bodhi/v1/nonce',
    ];

    for (const path of nonceCandidates) {
      try {
        const res = await fetch(`${BASE}${path}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Cookie: WP_COOKIE,
            Referer: `${BASE}/`,
          },
          credentials: 'include',
        });
        const json = await parseResponseBody(res);
        if (res.ok && json && typeof json === 'object' && json.nonce) {
          WP_NONCE = json.nonce;
          WP_NONCE_TS = Date.now();
          return WP_NONCE;
        }
      } catch {
        // ignore
      }
    }

    const secondaryCandidates = [
      { path: '/wp-json/bm/v1/form-login?refresh_nonce=1', method: 'GET', body: null },
      {
        path: '/wp-json/bm/v1/form-login',
        method: 'POST',
        body: JSON.stringify({ refresh_nonce: true }),
      },
    ];

    for (const candidate of secondaryCandidates) {
      try {
        const res = await fetch(`${BASE}${candidate.path}`, {
          method: candidate.method,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Cookie: WP_COOKIE,
            Referer: `${BASE}/`,
          },
          body: candidate.body,
          credentials: 'include',
        });
        const json = await parseResponseBody(res);
        if (res.ok && json && typeof json === 'object' && json.nonce) {
          WP_NONCE = json.nonce;
          WP_NONCE_TS = Date.now();
          return WP_NONCE;
        }
      } catch {
        // ignore
      }
    }

    WP_NONCE = null;
    WP_NONCE_TS = 0;
    return null;
  })();

  try {
    return await nonceRefreshPromise;
  } finally {
    nonceRefreshPromise = null;
  }
}

export async function ensureNonce(force = false) {
  if (!force && WP_NONCE && Date.now() - WP_NONCE_TS < NONCE_TTL_MS) {
    return WP_NONCE;
  }

  if (force) {
    WP_NONCE = null;
    WP_NONCE_TS = 0;
  }

  const refreshed = await refreshNonce();
  return refreshed;
}

export async function getLoginCookie() {
  const cookie = await ensureCookie();
  return cookie || null;
}

export async function wpLogin(email, password) {
  await CookieManager.clearAll(true);
  WP_COOKIE = null;
  WP_NONCE = null;

  const extractLoginMessage = (payload, status) => {
    if (typeof payload === 'string' && payload.trim()) {
      return payload.trim();
    }
    if (payload && typeof payload === 'object') {
      if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message.trim();
      }
      if (typeof payload.err === 'string' && payload.err.trim()) {
        return payload.err.trim();
      }
    }
    if (status === 401 || status === 403) {
      return 'Correo o contraseña incorrectos.';
    }
    return 'No fue posible iniciar sesión. Inténtalo de nuevo.';
  };

  const loginCandidates = [
    {
      path: '/wp-admin/admin-ajax.php?action=bodhi_login',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password }).toString(),
      },
    },
    {
      path: '/wp-json/bm/v1/form-login',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      },
    },
  ];

  let lastError = null;

  for (const candidate of loginCandidates) {
    try {
      const response = await fetch(`${BASE}${candidate.path}`, {
        ...candidate.options,
        credentials: 'include',
      });
      const data = await parseResponseBody(response);

      if (!response.ok || !data || typeof data !== 'object' || !data.ok) {
        const message = extractLoginMessage(data, response.status);
        const error = new Error(message);
        error.status = response.status;
        error.code = data?.code ?? 'login_failed';
        lastError = error;
        continue;
      }

      await syncCookieFromManager();

      if (typeof data.nonce === 'string' && data.nonce) {
        WP_NONCE = data.nonce;
        WP_NONCE_TS = Date.now();
      }

      if (data?.user?.id) {
        await AsyncStorage.setItem(USER_ID_KEY, String(data.user.id));
      }

      setWpSession({ cookie: WP_COOKIE, nonce: WP_NONCE });
      await verifySession();
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('No fue posible iniciar sesión. Inténtalo de nuevo.');
}

export async function verifySession() {
  const jar = await CookieManager.get(BASE);
  console.log('[cookie jar]', jar);

  const profile = await me();
  console.log('[me]', profile);
  return profile;
}

export const wpGet = (path, options = {}) =>
  wpFetch(path, { ...options, method: 'GET' });

export const wpPost = (path, body = {}, options = {}) =>
  wpFetch(path, {
    ...options,
    method: 'POST',
    body,
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
