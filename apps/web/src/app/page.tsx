"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LanguagePicker } from "@/components/LanguagePicker";
import { HealthStatus } from "@/components/HealthStatus";
import { IsometricStack } from "@/components/IsometricStack";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";

export default function Home() {
  const { state, hydrated, selectLanguage } = useWorkshop();
  const router = useRouter();

  return (
    <>
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <main className="mx-auto grid w-full max-w-[1400px] flex-1 items-center gap-8 px-10 py-14 lg:grid-cols-[1fr_0.95fr]">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.18em] text-[var(--foreground)] uppercase">
            <span>Practice</span>
            <span aria-hidden="true" className="text-[var(--accent)]">
              •
            </span>
            <span>Understand</span>
            <span aria-hidden="true" className="text-[var(--accent)]">
              •
            </span>
            <span>Apply</span>
          </div>

          <h1 className="mt-8">
            <span className="block text-[clamp(3.5rem,7.5vw,6.5rem)] leading-[0.92] font-extrabold tracking-[-0.03em] uppercase">
              Workshop
            </span>
            <span className="mt-1 block text-[clamp(2.6rem,5.4vw,4.7rem)] leading-[1.05] font-normal tracking-[-0.02em]">
              DTO<span className="font-medium text-[var(--accent)]">&amp;</span>
              Mapping
            </span>
          </h1>

          <p className="mt-8 max-w-md text-[1.05rem] leading-relaxed text-[var(--muted)]">
            A guided, interactive workshop to master DTOs and mappers with
            real-world examples. No installation, no account.
          </p>

          <h2 className="mt-12 text-[11px] font-semibold tracking-[0.14em] uppercase">
            Choose your programming language
          </h2>
          <div className="mt-4">
            <LanguagePicker value={state.language} onChange={selectLanguage} />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <button
              type="button"
              disabled={!hydrated || !state.language}
              onClick={() => router.push("/workshop")}
              className="rounded-lg bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[var(--shadow)] disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:text-[var(--muted)] disabled:shadow-none"
            >
              Start without login
            </button>
            <HealthStatus />
          </div>

          <Link
            href="/story"
            className="mt-4 text-sm text-[var(--accent)] hover:underline"
          >
            Why DTOs and Mappers exist →
          </Link>
          <Link
            href="/demo"
            className="mt-2 text-sm text-[var(--accent)] hover:underline"
          >
            See a real entity leak vs. safe DTO response →
          </Link>
        </div>

        <div className="hidden justify-self-center lg:block">
          <IsometricStack size={560} />
        </div>
      </main>
    </>
  );
}
