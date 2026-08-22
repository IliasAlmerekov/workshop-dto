import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useJsonEndpoint } from "./useJsonEndpoint";

function jsonResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as Response);
}

function failedResponse() {
  return Promise.reject(new Error("network down"));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useJsonEndpoint", () => {
  it("starts loading, then resolves to success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => jsonResponse({ ok: true })),
    );

    const { result } = renderHook(() => useJsonEndpoint("/api/thing"));
    expect(result.current.status).toBe("loading");

    await vi.waitFor(() => expect(result.current.status).toBe("success"));
  });

  it("auto-retries with backoff, showing 'waking' before a final error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => failedResponse()),
    );

    const { result } = renderHook(() => useJsonEndpoint("/api/thing"));

    await vi.waitFor(() => expect(result.current.status).toBe("waking"));
    expect(result.current).toMatchObject({
      status: "waking",
      attempt: 1,
      maxAttempts: 4,
    });

    // Drain all four backoff delays (1.5s, 3s, 6s, 12s) to reach the final error.
    for (let i = 0; i < 4; i += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(15000);
      });
    }

    await vi.waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current).toMatchObject({ status: "error", attempts: 5 });
  });

  it("recovers to success if the API comes back up during auto-retry", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => failedResponse())
      .mockImplementation(() => jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useJsonEndpoint("/api/thing"));

    await vi.waitFor(() => expect(result.current.status).toBe("waking"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    await vi.waitFor(() => expect(result.current.status).toBe("success"));
  });

  it("retry() starts a fresh cycle that can succeed after a final error", async () => {
    vi.useRealTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(await jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useJsonEndpoint("/api/thing"));
    await waitFor(() => expect(result.current.status).toBe("success"));

    act(() => result.current.retry());

    // A fresh cycle starts from loading again, not from a stale error.
    expect(result.current.status).not.toBe("error");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
