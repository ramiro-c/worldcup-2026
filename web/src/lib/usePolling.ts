import { useEffect, useState, useRef } from "react";

interface UsePollingState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function usePolling<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  interval: number,
  shouldPoll: boolean,
  deps: React.DependencyList = []
): UsePollingState<T> {
  const [state, setState] = useState<UsePollingState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const mountedRef = useRef(true);
  const shouldPollRef = useRef(shouldPoll);
  const fetcherRef = useRef(fetcher);
  shouldPollRef.current = shouldPoll;
  fetcherRef.current = fetcher;

  useEffect(() => {
    mountedRef.current = true;
    let activeController: AbortController | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const execute = async () => {
      // Abort any in-flight request from a previous cycle
      if (activeController) {
        activeController.abort();
      }

      const controller = new AbortController();
      activeController = controller;

      try {
        setState((s) => ({ ...s, loading: true }));
        const data = await fetcherRef.current(controller.signal);
        if (mountedRef.current) {
          setState({ data, loading: false, error: null });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (mountedRef.current) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      }
    };

    // Fetch immediately on mount
    execute();

    // Then poll at the given interval — skip while document is hidden or shouldPoll is false
    intervalId = setInterval(() => {
      if (shouldPollRef.current && document.visibilityState === "visible") {
        execute();
      }
    }, interval);

    return () => {
      mountedRef.current = false;
      if (activeController) {
        activeController.abort();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [interval, ...deps]);

  return state;
}
