/**
 * Validates that a match ID is in the expected format.
 *
 * Match IDs are slugs from wheniskickoff like "slo-vs-usa-2026-06-14"
 * or numeric strings like "123". Only lowercase letters, numbers,
 * and hyphens are allowed — no spaces, slashes, or special chars.
 */
export function isValidMatchId(id: string | undefined | null): boolean {
  if (!id || typeof id !== "string") return false;
  const trimmed = id.trim();
  if (trimmed.length === 0) return false;
  return /^[a-z0-9-]+$/.test(trimmed);
}
