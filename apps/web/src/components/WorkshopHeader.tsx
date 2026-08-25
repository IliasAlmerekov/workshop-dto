"use client";

import Link from "next/link";
import { useMessages } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ResetWorkshopButton } from "./ResetWorkshopButton";
import { ThemeToggle } from "./ThemeToggle";

/**
 * The workshop app bar (Figma `App Bar`, 40:85): 79px tall on `bg/surface`
 * with a hairline bottom border, the brand lockup left and the participant's
 * controls right at a 26px rhythm.
 *
 * Two deliberate departures from the library frame: the avatar is dropped —
 * the workshop has no accounts (see CLAUDE.md), so a participant chip would
 * imply state that does not exist — and the locale switcher and reset action
 * join the row, since both are real controls this build ships.
 */
export function WorkshopHeader() {
  const messages = useMessages();

  return (
    <header className="workshop-gutter flex min-h-[79px] flex-wrap items-center gap-16 border-b border-[var(--border)] bg-[var(--surface)] py-12">
      <Link href="/" className="flex items-center gap-16">
        <span className="text-heading-brand leading-heading-brand tracking-heading-brand font-bold text-[var(--foreground)]">
          DTO &amp; Mapping
        </span>
        <span
          aria-hidden="true"
          className="size-[7px] shrink-0 rounded-full bg-[var(--accent-solid)]"
        />
        <span className="text-label-eyebrow leading-label-eyebrow tracking-label-eyebrow font-bold text-[var(--muted)] uppercase">
          {messages.header.workshopTag}
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-26">
        <LanguageSwitcher />
        <LocaleSwitcher />
        <ResetWorkshopButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
