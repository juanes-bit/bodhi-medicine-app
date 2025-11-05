import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  wpFetch as coreWpFetch,
  wpGetStoredUserId,
  wpSetStoredUserId,
  ensureNonce,
} from './wp';

export async function wpFetch(path: string, options: RequestInit = {}) {
  const nonce = (await AsyncStorage.getItem('wp_nonce')) ?? '';
  const headers = {
    'X-WP-Nonce': nonce,
    ...(options.headers as Record<string, string> | undefined),
  };

  return coreWpFetch(path, {
    ...options,
    headers,
  });
}

export const wpGet = async (path: string) => wpFetch(path, { method: 'GET' });

export const wpPost = async (path: string, body?: any) =>
  wpFetch(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

export { wpGetStoredUserId, wpSetStoredUserId, ensureNonce };
