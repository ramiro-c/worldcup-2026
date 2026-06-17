/**
 * Fire-and-forget page view tracking.
 * Posts to /api/analytics — never throws, never blocks UI.
 */
export function trackPageView(path: string, matchId?: string): void {
  try {
    const body = JSON.stringify({
      path,
      ...(matchId ? { matchId } : {}),
      timestamp: new Date().toISOString(),
    });

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Silently fail — analytics must never block UI
    });
  } catch {
    // Silently fail
  }
}
