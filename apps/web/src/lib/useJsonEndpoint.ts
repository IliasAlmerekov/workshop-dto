"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A Render free-tier service can take roughly a minute to wake from a cold
 * start (spec section 12.4). Auto-retry a bounded number of times with
 * backoff before surfacing a real error, so the first request after an idle
 * period reads as "waking up" rather than "broken".
 */
const MAX_AUTO_RETRIES = 4;
const RETRY_DELAYS_MS = [1500, 3000, 6000, 12000];

export type JsonEndpointState =
  | { status: "loading" }
  | { status: "waking"; attempt: number; maxAttempts: number }
  | { status: "success"; data: unknown }
  | { status: "error"; message: string; attempts: number };

type Resolved = {
  /** Identifies which fetch cycle+attempt this result belongs to. */
  key: string;
  result: JsonEndpointState;
};

/**
 * Fetches a JSON endpoint, auto-retrying through a cold start, and exposes
 * loading/waking/success/error plus a manual retry that starts a fresh cycle.
 */
export function useJsonEndpoint(
  url: string,
): JsonEndpointState & { retry: () => void } {
  const [cycle, setCycle] = useState(0);
  const requestPrefix = `${url}:${cycle}:`;

  const [resolved, setResolved] = useState<Resolved>({
    key: `${requestPrefix}0`,
    result: { status: "loading" },
  });

  const retry = useCallback(() => {
    setCycle((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function attempt(failures: number) {
      const key = `${requestPrefix}${failures}`;

      async function run() {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }
          const data: unknown = JSON.parse(await response.text());

          if (!cancelled) {
            setResolved({ key, result: { status: "success", data } });
          }
        } catch (error) {
          if (cancelled) {
            return;
          }

          const failedAttempts = failures + 1;
          if (failedAttempts > MAX_AUTO_RETRIES) {
            setResolved({
              key,
              result: {
                status: "error",
                message:
                  error instanceof Error ? error.message : "Unknown error",
                attempts: failedAttempts,
              },
            });
            return;
          }

          setResolved({
            key,
            result: {
              status: "waking",
              attempt: failedAttempts,
              maxAttempts: MAX_AUTO_RETRIES,
            },
          });
          const delay =
            RETRY_DELAYS_MS[
              Math.min(failedAttempts - 1, RETRY_DELAYS_MS.length - 1)
            ];
          timeoutId = setTimeout(() => attempt(failedAttempts), delay);
        }
      }

      void run();
    }

    attempt(0);

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- requestPrefix already encodes url + cycle
  }, [requestPrefix]);

  // Derived during render, not via an effect: a fresh cycle shows as loading
  // immediately, even while a stale result from a previous cycle is still
  // the last thing that resolved.
  const current: JsonEndpointState = resolved.key.startsWith(requestPrefix)
    ? resolved.result
    : { status: "loading" };

  return { ...current, retry };
}
