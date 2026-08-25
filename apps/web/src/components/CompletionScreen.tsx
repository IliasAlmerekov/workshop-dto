"use client";

import { KnowledgeCheck } from "./KnowledgeCheck";
import { CertificateForm } from "./CertificateForm";
import { BalloonsPopBackground } from "./ui/BalloonsPopBackground";
import { IconCircleCheck } from "./ui/icons";
import { useMessages } from "@/lib/i18n";

const REGISTRATION_RESPONSE = {
  id: 7,
  userName: "ada.lovelace",
  displayName: "Ada Lovelace",
  birthDate: "1815-12-10",
  email: "ada@example.test",
};

const WELCOME_EMAIL = {
  recipientEmail: "ada@example.test",
  recipientName: "Ada Lovelace",
  subject: "Welcome to the new registration service",
  body: "Welcome, Ada Lovelace!",
};

/**
 * Shown once all six registration stages are complete (spec section 7.5) — reached
 * only through firstIncompleteTaskId returning null. The real Entity-versus-
 * DTO comparison remains with Task 4, where that contrast is learned.
 */
export function CompletionScreen() {
  const messages = useMessages();

  return (
    <main className="relative isolate mx-auto flex w-full max-w-[1280px] flex-col gap-12 overflow-x-hidden px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
      <BalloonsPopBackground />
      <header className="relative z-10 border-b border-[var(--border)] pb-10 sm:pb-12">
        <div className="flex max-w-3xl items-start gap-4 sm:gap-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--accent)] text-[var(--accent-foreground)] sm:size-14">
            <IconCircleCheck size={30} />
          </div>
          <div>
            <h1 className="text-[clamp(2.15rem,5vw,52px)] leading-heading-page tracking-heading-page font-bold text-[var(--foreground)]">
              {messages.completion.heading}
            </h1>
            <p className="mt-4 max-w-[65ch] text-body leading-body text-[var(--muted)]">
              {messages.completion.body}
            </p>
          </div>
        </div>
      </header>

      <section
        aria-labelledby="registration-result-heading"
        className="relative z-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8"
      >
        <h2
          id="registration-result-heading"
          className="text-heading-card leading-heading-card tracking-heading-card font-bold text-[var(--foreground)]"
        >
          {messages.completion.resultHeading}
        </h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {[
            [messages.completion.responseHeading, REGISTRATION_RESPONSE],
            [messages.completion.emailHeading, WELCOME_EMAIL],
          ].map(([heading, value]) => (
            <section
              key={heading as string}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4"
            >
              <h3 className="text-body-small font-semibold text-[var(--foreground)]">
                {heading as string}
              </h3>
              <pre className="mt-3 overflow-x-auto text-body-compact leading-body-compact text-[var(--muted)]">
                {JSON.stringify(value, null, 2)}
              </pre>
            </section>
          ))}
        </div>
        <p className="mt-4 text-body-compact leading-body-compact text-[var(--muted)]">
          {messages.completion.resultNote}
        </p>
      </section>

      <div className="relative z-10 grid items-start gap-10 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:gap-12">
        <CertificateForm />

        <section
          aria-labelledby="knowledge-check-heading"
          className="flex flex-col gap-5"
        >
          <div>
            <h2
              id="knowledge-check-heading"
              className="text-heading-card leading-heading-card tracking-heading-card font-bold text-[var(--foreground)]"
            >
              {messages.completion.quizHeading}
            </h2>
            <p className="mt-2 text-body-small leading-body-small text-[var(--muted)]">
              Choose an answer for each question. You can revisit your choices
              at any time.
            </p>
          </div>
          <KnowledgeCheck />
        </section>
      </div>
    </main>
  );
}
