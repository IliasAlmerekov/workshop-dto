"use client";

import { useId, useState } from "react";

/**
 * Deliberately no persistence (issue #20): the name lives only in this
 * component's local state for the duration of one download and is gone on
 * reload, unlike the rest of the workshop's progress in localStorage.
 */
export function CertificateForm() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "generating">("idle");
  const inputId = useId();
  const trimmedName = name.trim();

  async function handleDownload() {
    if (!trimmedName || status === "generating") {
      return;
    }
    setStatus("generating");
    try {
      const { downloadCertificate } =
        await import("@/lib/certificate/generateCertificate");
      await downloadCertificate({ name: trimmedName, completedAt: new Date() });
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <div>
        <p className="text-sm font-semibold">Get your certificate</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Enter your name to download a completion certificate as a PDF. Nothing
          is saved — it&apos;s generated in your browser and not sent anywhere.
        </p>
      </div>
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          void handleDownload();
        }}
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor={inputId} className="text-xs text-[var(--muted)]">
            Your name
          </label>
          <input
            id={inputId}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ada Lovelace"
            autoComplete="off"
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!trimmedName || status === "generating"}
          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-solid)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-foreground)] disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:text-[var(--muted)]"
        >
          {status === "generating"
            ? "Generating…"
            : "Download certificate (PDF)"}
        </button>
      </form>
    </div>
  );
}
