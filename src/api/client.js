import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "https://staging.bodhimedicine.com";
export const WP_API_PREFIX = "/wp-json/bodhi/v1";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use(async (config) => {
  try {
    const nonce = await AsyncStorage.getItem("wp_rest_nonce");
    if (nonce) {
      config.headers = {
        ...(config.headers || {}),
        "X-WP-Nonce": nonce,
      };
    }
  } catch (err) {
    console.warn("[api] failed to inject nonce", err);
  }
  return config;
});

export default api;
