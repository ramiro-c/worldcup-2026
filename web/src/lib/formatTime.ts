/**
 * Format a match date/time as a localized string in the given timezone.
 *
 * Parses `{date}T{time}Z` as UTC and formats via Intl.DateTimeFormat.
 * When time is null (historical matches), returns the date as-is.
 */
export function formatMatchTime(
  date: string,
  time: string | null,
  timezone: string
): string {
  if (!time) return date;

  try {
    const utcString = `${date}T${time}Z`;
    const d = new Date(utcString);

    if (isNaN(d.getTime())) return `${date} ${time}`;

    return new Intl.DateTimeFormat("es-AR", {
      timeZone: timezone,
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return `${date} ${time}`;
  }
}
