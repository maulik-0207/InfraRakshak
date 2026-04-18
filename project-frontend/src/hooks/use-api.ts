"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic data-fetching hook.
 * - Returns { data: null } on any error so components can simply guard with `data &&`
 * - Aborts in-flight requests on URL change or unmount
 * - Pass null as url to skip fetching
 */
export function useApi<T>(url: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef(url);

  const fetchData = useCallback(async (fetchUrl: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(fetchUrl, {
        signal: abortRef.current.signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        setData(null);
        setError(`HTTP ${res.status}`);
        return;
      }

      const text = await res.text();
      if (!text) {
        setData(null);
        return;
      }

      setData(JSON.parse(text));
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setData(null);
        setError(err.message ?? "Request failed");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    urlRef.current = url;
    if (url) {
      fetchData(url);
    } else {
      setData(null);
      setLoading(false);
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [url, fetchData]);

  const refetch = useCallback(() => {
    if (urlRef.current) fetchData(urlRef.current);
  }, [fetchData]);

  return { data, loading, error, refetch };
}
