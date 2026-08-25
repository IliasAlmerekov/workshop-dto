"use client";

import { useJsonEndpoint } from "@/lib/useJsonEndpoint";
import { useMessages } from "@/lib/i18n";

type JsonEndpointPanelProps = {
  title: string;
  description: string;
  path: string;
  url: string;
  tone: "warning" | "safe";
  flagFields?: string[];
};

export function JsonEndpointPanel({
  title,
  description,
  path,
  url,
  tone,
  flagFields = [],
}: JsonEndpointPanelProps) {
  const state = useJsonEndpoint(url);
  const messages = useMessages();

  const accentClass =
    tone === "warning" ? "text-amber-600" : "text-[var(--accent)]";
  const borderClass =
    tone === "warning" ? "border-amber-500/40" : "border-[var(--accent)]/40";

  return (
    <section
      className={`flex flex-col gap-3 rounded-xl border ${borderClass} bg-[var(--surface)] p-6`}
    >
      <div>
        <p
          className={`text-xs font-semibold tracking-[0.1em] uppercase ${accentClass}`}
        >
          {title}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        <code className="mt-2 block font-mono text-xs text-[var(--muted)]">
          GET {path}
        </code>
      </div>

      {state.status === "loading" && (
        <p role="status" className="text-sm text-[var(--muted)]">
          {messages.jsonPanel.loading}
        </p>
      )}

      {state.status === "waking" && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-[var(--muted)]"
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-500"
          />
          {messages.jsonPanel.waking(state.attempt, state.maxAttempts)}
        </p>
      )}

      {state.status === "error" && (
        <div role="alert" className="flex flex-col gap-2">
          <p className="text-sm text-amber-600">
            {messages.jsonPanel.error(state.attempts, state.message)}
          </p>
          <button
            type="button"
            onClick={state.retry}
            className="self-start rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
          >
            {messages.jsonPanel.retry}
          </button>
        </div>
      )}

      {state.status === "success" && (
        <>
          {flagFields.length > 0 &&
            typeof state.data === "object" &&
            state.data !== null &&
            flagFields.some(
              (field) => field in (state.data as Record<string, unknown>),
            ) && (
              <p className="text-xs font-medium text-amber-600">
                {messages.jsonPanel.leaked(
                  flagFields
                    .filter(
                      (field) =>
                        field in (state.data as Record<string, unknown>),
                    )
                    .join(", "),
                )}
              </p>
            )}
          <pre className="overflow-x-auto rounded-lg bg-[var(--background)] p-4 font-mono text-xs">
            {JSON.stringify(state.data, null, 2)}
          </pre>
        </>
      )}
    </section>
  );
}
