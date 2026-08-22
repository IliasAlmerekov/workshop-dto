import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ResetWorkshopButton } from "./ResetWorkshopButton";
import { ThemeToggle } from "./ThemeToggle";

export function WorkshopHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-8 py-4">
      <Link href="/" className="flex items-center gap-3">
        <span className="text-xl font-bold tracking-tight">
          DTO &amp; Mapping
        </span>
        <span aria-hidden="true" className="text-[var(--accent)]">
          •
        </span>
        <span className="text-[11px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
          Workshop
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <ResetWorkshopButton />
        <ThemeToggle />
        <div
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]"
        >
          JD
        </div>
      </div>
    </header>
  );
}
