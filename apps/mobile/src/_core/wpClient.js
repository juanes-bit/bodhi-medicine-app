import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';

const DEFAULT_BASE = 'https://staging.bodhimedicine.com';
const envBase = process.env.EXPO_PUBLIC_BASE;
const BASE = envBase && typeof envBase === 'string' && envBase.trim()
  ? envBase.trim().replace(/\/$/, '')
  : DEFAULT_BASE;

async function buildCookieHeader() {
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
}

const parseJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export async function wpFetch(path, options = {}) {
  const nonce = (await AsyncStorage.getItem('wp_nonce')) ?? '';
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    'X-WP-Nonce': nonce,
    ...(options.headers || {}),
  };

  const cookieHeader = await buildCookieHeader();
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  const url = /^https?:\/\//i.test(path) ? path : `${BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await parseJson(response);
  if (!response.ok) {
    const error = new Error(
      typeof data === 'string' ? data : JSON.stringify(data)
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export const wpGet = (path) => wpFetch(path, { method: 'GET' });

export const wpPost = (path, body) =>
  wpFetch(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

