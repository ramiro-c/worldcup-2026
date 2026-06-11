import { useEffect, useState } from "react";

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = []
): UseAsyncState<T> {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  };

  useEffect(() => {
    execute();
  }, deps);

  return { ...state, refetch: execute };
}