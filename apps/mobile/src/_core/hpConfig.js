import AsyncStorage from '@react-native-async-storage/async-storage';

const K_MODE = 'api_mode'; // 'wp' (default) | 'hp-mock' | 'hp'
const K_UID = 'hp_user_id';
const K_BASE = 'hp_base';
const K_JWT = 'hp_jwt';

const DEFAULT_HP_BASE = 'https://staging.bodhimedicine.com/wp-json/hunterprice/v1';

export const API_MODES = {
  WP: 'wp',
  HP_MOCK: 'hp-mock',
  HP: 'hp',
};

const trimTrailingSlash = (value) =>
  typeof value === 'string' ? value.replace(/\/$/, '') : value;

export async function setApiMode(value) {
  const allowed = Object.values(API_MODES);
  const next = allowed.includes(value) ? value : API_MODES.WP;
  await AsyncStorage.setItem(K_MODE, next);
}

export async function getApiMode() {
  const stored = await AsyncStorage.getItem(K_MODE);
  if (stored && Object.values(API_MODES).includes(stored)) {
    return stored;
  }
  return API_MODES.WP;
}

export async function setHpUserId(value) {
  if (value == null) {
    await AsyncStorage.removeItem(K_UID);
    return;
  }
  await AsyncStorage.setItem(K_UID, String(value));
}

export async function getHpUserId() {
  const stored = await AsyncStorage.getItem(K_UID);
  if (!stored) {
    throw new Error('hp_user_id vacío');
  }
  return stored;
}

export async function setHpBase(baseUrl) {
  if (!baseUrl) {
    await AsyncStorage.removeItem(K_BASE);
    return;
  }
  await AsyncStorage.setItem(K_BASE, trimTrailingSlash(baseUrl.trim()));
}

export async function getHpBase() {
  const stored = await AsyncStorage.getItem(K_BASE);
  if (stored && stored.trim()) {
    return trimTrailingSlash(stored.trim());
  }
  return DEFAULT_HP_BASE;
}

export async function setHpJwt(jwt) {
  if (!jwt) {
    await AsyncStorage.removeItem(K_JWT);
    return;
  }
  await AsyncStorage.setItem(K_JWT, jwt);
}

export async function getHpJwt() {
  const stored = await AsyncStorage.getItem(K_JWT);
  return stored || null;
}

export async function onWpLoginSetHpUserId(me) {
  if (me?.id == null) {
    return;
  }
  await setHpUserId(me.id);
}

if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis, {
    setApiMode,
    getApiMode,
    setHpBase,
    getHpBase,
    setHpUserId,
    getHpUserId,
    setHpJwt,
    getHpJwt,
  });
}
