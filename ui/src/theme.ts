import { useSyncExternalStore } from "react";
import { syncDesktopTitlebar } from "./desktopTitlebar";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "orx:theme";

function readStoredPreference(): ThemePreference {
  // Migrate saved system/dark preferences to the fixed light appearance.
  try {
    localStorage.setItem(STORAGE_KEY, "light");
  } catch {
    // The light appearance still applies for this session.
  }
  return "light";
}

let preference: ThemePreference = readStoredPreference();
const listeners = new Set<() => void>();

function resolveTheme(): "light" {
  return "light";
}

function applyResolvedTheme(): void {
  document.documentElement.dataset.theme = resolveTheme();
  syncDesktopTitlebar(preference);
}

export function setThemePreference(_next: ThemePreference): void {
  preference = "light";
  try {
    localStorage.setItem(STORAGE_KEY, "light");
  } catch {
    // Non-fatal: the in-memory preference still applies for this session.
  }
  applyResolvedTheme();
  for (const listener of listeners) listener();
}

export function getThemePreference(): ThemePreference {
  return preference;
}

// The inline script in index.html sets the initial data-theme before paint;
// re-assert it here in case that script was blocked.
applyResolvedTheme();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Current theme preference, reflected on <html data-theme> and persisted. */
export function useThemePreference(): [
  ThemePreference,
  (next: ThemePreference) => void,
] {
  const value = useSyncExternalStore(
    subscribe,
    () => preference,
    () => preference,
  );
  return [value, setThemePreference];
}
