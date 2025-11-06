import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';

const DEFAULT_BASE = 'https://staging.bodhimedicine.com';
const envBase = process.env.EXPO_PUBLIC_BASE;
const BASE = envBase && typeof envBase === 'string' && envBase.trim()
  ? envBase.trim().replace(/\/$/, '')
  : DEFAULT_BASE;

const NONCE_KEY = 'wp_nonce';
const AJAX_NONCE_PATH = '/wp-admin/admin-ajax.php?action=bodhi_mobile_nonce';

let inFlightNoncePromise = null;

const isJsonLike = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value !== 'object') return false;
  if (typeof FormData !== 'undefined' && value instanceof FormData) return false;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return false;
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) return false;
  if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) return false;
  return true;
};

const parseJsonSafe = async (response) => {
  const clone = response.clone();
  try {
    return await clone.json();
  } catch {
    try {
      return await clone.text();
    } catch {
      return null;
    }
  }
};

const ensureLeadingSlash = (path) =>
  path.startsWith('/') ? path : `/${path}`;

const resolveUrl = (path) => (/^https?:\/\//i.test(path) ? path : `${BASE}${ensureLeadingSlash(path)}`);

const buildCookieHeader = async () => {
  try {
    const jar = await CookieManager.get(BASE);
    const parts = [];
    Object.entries(jar || {}).forEach(([name, value]) => {
      if (value?.value) {
        parts.push(`${name}=${value.value}`);
      }
    });
    return parts.join('; ');
  } catch {
    return '';
  }
};

const getStoredNonce = async () => {
  try {
    const value = await AsyncStorage.getItem(NONCE_KEY);
    return value || '';
  } catch {
    return '';
  }
};

const setStoredNonce = async (nonce) => {
  try {
    if (nonce) {
      await AsyncStorage.setItem(NONCE_KEY, nonce);
    } else {
      await AsyncStorage.removeItem(NONCE_KEY);
    }
  } catch {
    // ignore storage failures
  }
};

const refreshNonceViaAjax = async () => {
  if (inFlightNoncePromise) {
    return inFlightNoncePromise;
  }

  inFlightNoncePromise = (async () => {
    const cookieHeader = await buildCookieHeader();
    if (!cookieHeader) {
      throw new Error('nonce_refresh_missing_cookie');
    }

    const response = await fetch(`${BASE}${AJAX_NONCE_PATH}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Cookie: cookieHeader,
        Referer: `${BASE}/`,
      },
      credentials: 'include',
    });

    const payload = await parseJsonSafe(response);
    if (
      response.ok &&
      payload &&
      typeof payload === 'object' &&
      (payload?.data?.nonce || payload?.nonce)
    ) {
      const nonce = payload.data?.nonce ?? payload.nonce;
      await setStoredNonce(nonce);
      return nonce;
    }

    throw new Error('nonce_refresh_failed');
  })();

  try {
    return await inFlightNoncePromise;
  } finally {
    inFlightNoncePromise = null;
  }
};

const isNonceError = (response, payload) => {
  if (response.status !== 403 || !payload) return false;
  if (typeof payload === 'string') {
    return /nonce/i.test(payload);
  }
  if (typeof payload === 'object') {
    if (payload.code === 'rest_cookie_invalid_nonce') return true;
    if (typeof payload.message === 'string') {
      return /nonce/i.test(payload.message);
    }
  }
  return false;
};

const normalizeBody = (body) => {
  if (!isJsonLike(body)) {
    return body;
  }
  return JSON.stringify(body);
};

const shouldSetJsonContentType = (payload) => {
  if (typeof payload !== 'string') return false;
  const trimmed = payload.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
};

const doFetch = async (path, options = {}, { useNonce = true } = {}) => {
  const {
    method = 'GET',
    body: originalBody,
    headers = {},
    ...rest
  } = options;

  const payload = normalizeBody(originalBody);

  const finalHeaders = {
    Accept: 'application/json',
    ...(payload && shouldSetJsonContentType(payload)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...headers,
  };

  if (useNonce && !finalHeaders['X-WP-Nonce']) {
    const storedNonce = await getStoredNonce();
    if (storedNonce) {
      finalHeaders['X-WP-Nonce'] = storedNonce;
    }
  }

  if (!finalHeaders.Cookie) {
    const cookieHeader = await buildCookieHeader();
    if (cookieHeader) {
      finalHeaders.Cookie = cookieHeader;
    }
  }

  return fetch(resolveUrl(path), {
    method,
    body: payload,
    headers: finalHeaders,
    credentials: 'include',
    ...rest,
  });
};

export async function wpFetch(path, options = {}) {
  const { nonce = true, ...rest } = options;

  // 1) Primer intento con nonce actual (si aplica)
  let response = await doFetch(path, rest, { useNonce: nonce !== false });
  if (response.ok) {
    return parseJsonSafe(response);
  }

  const firstPayload = await parseJsonSafe(response);
  const nonceExpired = nonce !== false && isNonceError(response, firstPayload);

  if (nonceExpired) {
    await refreshNonceViaAjax();
    response = await doFetch(path, rest, { useNonce: true });
    if (response.ok) {
      return parseJsonSafe(response);
    }
  }

  const errorPayload = nonceExpired ? await parseJsonSafe(response) : firstPayload;
  const rawText =
    typeof errorPayload === 'string'
      ? errorPayload
      : JSON.stringify(errorPayload ?? {});

  let code = '';
  if (rawText) {
    try {
      const parsed = JSON.parse(rawText);
      if (parsed && typeof parsed === 'object') {
        code = parsed.code ?? '';
      }
    } catch {
      // ignore parse failure
    }
  }

  const error = new Error(`WP ${response.status}`);
  error.status = response.status;
  error.code = code;
  error.body = rawText;
  throw error;
}

export const wpGet = (path, options = {}) =>
  wpFetch(path, { ...options, method: 'GET' });

export const wpPost = (path, body, options = {}) =>
  wpFetch(path, {
    ...options,
    method: 'POST',
    body,
  });
