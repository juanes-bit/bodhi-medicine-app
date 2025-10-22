import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';

const BASE = (process.env.EXPO_PUBLIC_BASE || 'https://staging.bodhimedicine.com').replace(/\/$/, '');

// ---- helpers ----
async function buildCookieHeader() {
  const all = await CookieManager.get(BASE);
  const pairs = [];
  for (const [name, cookie] of Object.entries(all || {})) {
    if (cookie?.value) pairs.push(`${name}=${cookie.value}`);
  }
  return pairs.join('; ');
}

function isWP(path) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  return url.startsWith(`${BASE}/wp-json/`);
}

const NONCE_KEY = 'wp_nonce';
const NONCE_TS_KEY = 'wp_nonce_ts';

export async function ensureNonce(force = false) {
  if (!force) {
    const cached = await AsyncStorage.getItem(NONCE_KEY);
    if (cached) return cached;
  }

  const cookie = await buildCookieHeader();
  const headers = {
    'Content-Type': 'application/json',
    'Referer': `${BASE}/`,
    'X-From-wpFetch': '1',
    ...(cookie ? { Cookie: cookie } : {}),
  };

  const url = `${BASE}/wp-json/bm/v1/rest-nonce`;
  const res = await fetch(url, { method: 'GET', headers });

  if (res.status === 401) {
    await AsyncStorage.multiRemove([NONCE_KEY, NONCE_TS_KEY]);
    throw new Error('rest-nonce 401');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`rest-nonce ${res.status} ${body}`);
  }

  const data = await res.json();
  const nonce = data?.nonce || data?.data?.nonce || data?.x_wp_nonce || '';
  if (!nonce) throw new Error('rest-nonce sin nonce');

  await AsyncStorage.setItem(NONCE_KEY, nonce);
  await AsyncStorage.setItem(NONCE_TS_KEY, String(Date.now()));
  return nonce;
}

export async function wpLogin(email, password) {
  await CookieManager.clearAll(true);
  await AsyncStorage.multiRemove([NONCE_KEY, NONCE_TS_KEY]);

  const url = `${BASE}/wp-json/bm/v1/form-login`;
  const headers = {
    'Content-Type': 'application/json',
    'Referer': `${BASE}/`,
    'X-From-wpFetch': '1',
  };
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.ok) {
    throw new Error(`login ${res.status}`);
  }

  if (data?.nonce) await AsyncStorage.setItem(NONCE_KEY, data.nonce);
  return data;
}

export async function wpFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const cookie = await buildCookieHeader();

  let nonce = null;
  if (isWP(path)) {
    try { nonce = await ensureNonce(false); } catch {}
  }

  const headers = {
    'Content-Type': 'application/json',
    'Referer': `${BASE}/`,
    'X-From-wpFetch': '1',
    ...(cookie ? { Cookie: cookie } : {}),
    ...(nonce ? { 'X-WP-Nonce': nonce } : {}),
    ...(options.headers || {}),
  };

  delete headers.Authorization;
  delete headers.authorization;

  const doFetch = (overrideHeaders = headers) => fetch(url, { ...options, headers: overrideHeaders });

  let res = await doFetch();
  if (res.status === 403) {
    let payload = null;
    try { payload = await res.clone().json(); } catch {}
    if (payload?.code === 'rest_cookie_invalid_nonce') {
      const fresh = await ensureNonce(true);
      const headers2 = { ...headers, 'X-WP-Nonce': fresh };
      res = await doFetch(headers2);
    }
  }

  return res;
}
