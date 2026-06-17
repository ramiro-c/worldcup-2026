import { useCallback, useState } from "react";

const STORAGE_KEY = "preferredTimezone";

const DEFAULT_ZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function getStoredTimezone(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getBrowserTimezone();
    // Validate the stored value is a real IANA zone
    Intl.DateTimeFormat(undefined, { timeZone: stored });
    return stored;
  } catch {
    return getBrowserTimezone();
  }
}

export function useTimezone() {
  const [timezone, setTimezoneState] = useState<string>(getStoredTimezone);

  const setTimezone = useCallback((tz: string) => {
    try {
      // Validate before persisting
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      localStorage.setItem(STORAGE_KEY, tz);
      setTimezoneState(tz);
    } catch {
      // Invalid timezone — ignore
    }
  }, []);

  return {
    timezone,
    setTimezone,
    availableTimezones: DEFAULT_ZONES,
  };
}
