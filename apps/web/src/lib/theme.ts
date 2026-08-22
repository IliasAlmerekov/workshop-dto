export const THEME_STORAGE_KEY = "dto-mapper-workshop-theme";

export type Theme = "light" | "dark";

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/**
 * Light is the deliberate default for a first visit: the workshop is run in
 * lit rooms and often on a projector. The OS preference is intentionally not
 * consulted — only an explicit choice via the toggle switches to dark.
 */
export function loadTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function saveTheme(theme: Theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.dataset.theme=s==="dark"?"dark":"light";}catch(e){}})();`;
