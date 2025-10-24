import { Alert, DevSettings, Platform } from "react-native";
import CookieManager from "@react-native-cookies/cookies";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function resetWpSession() {
  try {
    await AsyncStorage.multiRemove(["wp_nonce", "wp_uid", "wp_token", "wp_cookie_cache"]);
    await CookieManager.clearAll();
    if (Platform.OS === "ios") {
      await CookieManager.clearAll(true);
    }

    console.log("[resetWpSession] cookies + storage limpiados");
    Alert.alert("Listo", "Sesión de WP limpiada");
  } catch (e) {
    console.warn("[resetWpSession] error", e);
    Alert.alert("Error", String(e?.message ?? e));
  }
}

if (__DEV__) {
  DevSettings.addMenuItem("🧹 Limpiar sesión WP", () => {
    resetWpSession();
  });
}
