const STORAGE_KEY = "ifc-reader-settings";

export const DEFAULT_SETTINGS = {
  theme: "auto", // 'auto' | 'light' | 'dark'
  units: "m", // 'm' | 'ft'
  selectColor: "#ff9800",
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private browsing / storage full: settings just won't persist.
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "auto") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

const METERS_TO_FEET = 3.28084;

export function formatLength(meters, units) {
  if (meters == null || Number.isNaN(meters)) return "—";
  if (units === "ft") return `${(meters * METERS_TO_FEET).toFixed(2)} ft`;
  return `${meters.toFixed(3)} m`;
}
