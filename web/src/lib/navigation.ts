import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Returns a navigate-back callback that falls back to a given path
 * when there is no previous history entry.
 *
 * Use this for "back" buttons: if the user arrived via an in-app link
 * it navigates one step back, otherwise it goes to the fallback path
 * (default `/fixtures`).
 */
export function useNavigateBack(fallbackPath = "/fixtures"): () => void {
  const navigate = useNavigate();

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  }, [navigate, fallbackPath]);

  return goBack;
}
