import { AppState } from "react-native";
import { wpFetch, getLoginCookie } from "./_core/wp";

export function watchSession(onExpired) {
  let lastState = AppState.currentState;

  const subscription = AppState.addEventListener("change", async (nextState) => {
    if (lastState.match(/inactive|background/) && nextState === "active") {
      const cookie = await getLoginCookie();
      if (!cookie) {
        lastState = nextState;
        return;
      }

      try {
        const res = await wpFetch("/wp-json/wp/v2/users/me", { method: "GET" });
        if (res.status === 401 && typeof onExpired === "function") {
          onExpired();
        }
      } catch (error) {
        if (typeof onExpired === "function") {
          onExpired();
        } else {
          console.warn("[watchSession] failed", error);
        }
      }
    }
    lastState = nextState;
  });

  return () => subscription.remove();
}
