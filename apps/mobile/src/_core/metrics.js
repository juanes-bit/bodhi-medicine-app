export function logTiming(name, durationMs, extra = {}) {
  if (typeof console?.log !== "function") {
    return;
  }
  const payload = { durationMs, ...extra };
  if (__DEV__) {
    console.log(`[perf] ${name}`, payload);
  }
}
