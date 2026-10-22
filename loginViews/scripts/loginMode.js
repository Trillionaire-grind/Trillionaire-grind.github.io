export const MODE_STORAGE_KEY = "network-login-mode";

/** Resolve demo vs live from URL override, saved preference, or Firebase availability. */
export function resolveDemoMode(params, firebaseConfigured) {
  if (params.get("demo") === "1") {
    localStorage.setItem(MODE_STORAGE_KEY, "demo");
    return true;
  }
  if (params.get("live") === "1") {
    localStorage.setItem(MODE_STORAGE_KEY, "live");
    return false;
  }
  const stored = localStorage.getItem(MODE_STORAGE_KEY);
  if (stored === "demo") return true;
  if (stored === "live") return false;
  return !firebaseConfigured;
}

export function setAppMode(mode) {
  localStorage.setItem(MODE_STORAGE_KEY, mode === "demo" ? "demo" : "live");
}

export function reloadWithMode(mode) {
  setAppMode(mode);
  const params = new URLSearchParams(window.location.search);
  params.delete("demo");
  params.delete("live");
  params.delete("preview");
  const qs = params.toString();
  window.location.href = "login.html" + (qs ? "?" + qs : "");
}
