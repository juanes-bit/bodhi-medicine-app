import AsyncStorage from "@react-native-async-storage/async-storage";
import Cookies from "@react-native-cookies/cookies";
import { BASE, wpFetch } from "./_core/wp";

const PERSIST_KEY = "wpSession";

export async function persistSession() {
  try {
    const jar = await Cookies.get(BASE);
    const cookies = Object.values(jar || {}).map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: !!cookie.secure,
      httpOnly: !!cookie.httpOnly,
      version: cookie.version,
      expires: cookie.expires,
    }));

    await AsyncStorage.setItem(PERSIST_KEY, JSON.stringify({ cookies }));
  } catch (error) {
    console.warn("[persistSession] failed", error);
  }
}

export async function restoreSession() {
  try {
    const raw = await AsyncStorage.getItem(PERSIST_KEY);
    if (!raw) return false;

    const { cookies } = JSON.parse(raw);

    if (Array.isArray(cookies)) {
      for (const cookie of cookies) {
        await Cookies.set(BASE, cookie);
      }
    }

    try {
      await wpFetch('/wp-json/wp/v2/users/me', { method: 'GET' });
    } catch (error) {
      console.warn('[restoreSession] nonce refresh failed', error);
    }

    return true;
  } catch (error) {
    console.warn("[restoreSession] failed", error);
    return false;
  }
}
