"use client";

import { useId, useState } from "react";
import { Button } from "./ui/Button";
import { IconCircleCheck, IconSpinner } from "./ui/icons";

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
    <section
      aria-labelledby={`${inputId}-heading`}
      className="flex flex-col gap-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8"
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--accent-soft)] text-[var(--accent)]">
          <IconCircleCheck size={28} />
        </div>
        <div className="min-w-0">
          <h2
            id={`${inputId}-heading`}
            className="text-heading-card leading-heading-card tracking-heading-card font-bold text-[var(--foreground)]"
          >
            Get your certificate
          </h2>
          <p className="mt-2 max-w-[54ch] text-body-small leading-body-small text-[var(--muted)]">
            Enter your name to download a completion certificate as a PDF.
            Nothing is saved — it&apos;s generated in your browser and not sent
            anywhere.
          </p>
        </div>
      </div>
      <form
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          void handleDownload();
        }}
      >
        <div className="flex flex-1 flex-col gap-2">
          <label
            htmlFor={inputId}
            className="text-label-caption leading-label-caption font-bold text-[var(--foreground)]"
          >
            Your name
          </label>
          <input
            id={inputId}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ada Lovelace"
            autoComplete="off"
            className="h-[54px] rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-body-small text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted)] hover:border-[var(--border-strong)] focus:border-[var(--accent)]"
          />
        </div>
        <Button
          type="submit"
          disabled={!trimmedName || status === "generating"}
          variant="primary"
          icon={
            status === "generating" ? (
              <IconSpinner
                size={18}
                className="animate-spin motion-reduce:animate-none"
              />
            ) : (
              <IconCircleCheck size={18} />
            )
          }
          className="h-[54px] justify-center px-6"
        >
          {status === "generating"
            ? "Generating…"
            : "Download certificate (PDF)"}
        </Button>
      </form>
    </section>
  );
}
