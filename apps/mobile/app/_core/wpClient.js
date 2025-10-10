import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE =
  process.env.EXPO_PUBLIC_BASE || "https://staging.bodhimedicine.com";

async function getNonce() {
  const keys = ["wp_nonce", "token", "nonce"];
  for (const key of keys) {
    // respect existing storage keys without redefining auth behavior
    const value = await AsyncStorage.getItem(key);
    if (value) {
      return value;
    }
  }
  return global.__WP_NONCE || null;
}

export async function wpGet(path) {
  const headers = new Headers();
  const nonce = await getNonce();
  if (nonce) {
    headers.set("X-WP-Nonce", nonce);
  }
  const url = path.startsWith("http") ? path : `${BASE}/wp${path}`;
  const response = await fetch(url, { method: "GET", headers });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  }

  return data;
}

export async function wpPost(path, json) {
  const headers = new Headers({ "Content-Type": "application/json" });
  const nonce = await getNonce();
  if (nonce) {
    headers.set("X-WP-Nonce", nonce);
  }

  const response = await fetch(`${BASE}/wp${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(json || {}),
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  }

  return data;
}

