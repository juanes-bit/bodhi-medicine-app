import AsyncStorage from '@react-native-async-storage/async-storage';
import { wpGetStoredUserId, wpSetStoredUserId, ensureNonce } from './wp';

const defaultBase = process.env.EXPO_PUBLIC_BASE || 'https://staging.bodhimedicine.com';

export async function wpFetch(path: string, options: RequestInit = {}) {
  const base = defaultBase.replace(/\/$/, '');
  const nonce = (await AsyncStorage.getItem('wp_nonce')) ?? '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-WP-Nonce': nonce,
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${base}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    throw new Error(`WP ${res.status}`);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

export const wpGet = async (path: string) => wpFetch(path, { method: 'GET' });

export const wpPost = async (path: string, body?: any) =>
  wpFetch(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

export { wpGetStoredUserId, wpSetStoredUserId, ensureNonce };
