"use client";

import type { HintCard } from "@/lib/exercises/types";
import { useMessages } from "@/lib/i18n";
import { useState } from "react";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";
import { IconLightbulb } from "@/components/ui/icons";

const MAX_CARDS = 3;

type HintPopoverProps = {
  /** Every hint for this task, in escalation order. */
  hints: HintCard[];
  /** How many the participant has already unlocked. */
  shown: number;
  /** Unlocks the next one. */
  onReveal: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ChevronIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={direction === "previous" ? "m14.5 6-6 6 6 6" : "m9.5 6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The progressive hints, as a popover hung off the button that asks for them.
 *
 * They used to stack up underneath the editor, which put the answer to
 * "what now?" below the fold, moved the Check/Continue row down a card at a
 * time, and left three panels of prose competing with the exercise once all
 * were open. Anchoring them to the trigger keeps the layout still, keeps the
 * hint beside the question it answers, and makes them dismissible — a hint
 * is a glance, not a section of the page.
 *
 * Escalation is unchanged (spec 7.3): each press reveals one more card, the
 * arrows keep every earlier card available, and the fourth step is still
 * `Insert solution` on the toolbar rather than anything in here.
 */
export function HintPopover({
  hints,
  shown,
  onReveal,
  open,
  onOpenChange,
}: HintPopoverProps) {
  const messages = useMessages();
  const unlockedCount = Math.min(hints.length, Math.max(shown, 1));
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, unlockedCount - 1),
  );
  const canReveal = shown < Math.min(MAX_CARDS, hints.length);
  const currentIndex = Math.min(activeIndex, Math.max(0, unlockedCount - 1));
  const activeHint = hints[currentIndex];

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          onClick={() => {
            // Opening for the first time reveals the first hint; while it is
            // already open the toolbar button just closes it, so a press never
            // silently burns a hint the participant cannot see.
            if (!open && shown === 0) {
              onReveal();
            }
          }}
          icon={<IconLightbulb size={18} />}
          className="data-[state=open]:border-[var(--accent)] data-[state=open]:text-[var(--accent)]"
        >
          {messages.exercise.showHint}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        aria-label={messages.exercise.hintsTitle}
        className="w-[min(24rem,calc(100vw-2rem))] p-0"
      >
        <PopoverArrow />

        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] py-2 ps-4 pe-2">
          <p className="flex items-center gap-2 text-xs font-semibold">
            <span aria-hidden="true" className="text-[var(--accent)]">
              <IconLightbulb size={15} />
            </span>
            {messages.exercise.hintsTitle}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              aria-label={messages.exercise.previousHint}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[var(--muted)]"
            >
              <ChevronIcon direction="previous" />
            </button>
            <p
              aria-live="polite"
              className="min-w-[5.75rem] text-center text-[11px] text-[var(--muted)]"
            >
              {messages.exercise.hintStep(currentIndex + 1, MAX_CARDS)}
            </p>
            <button
              type="button"
              onClick={() =>
                setActiveIndex(Math.min(unlockedCount - 1, currentIndex + 1))
              }
              disabled={currentIndex >= unlockedCount - 1}
              aria-label={messages.exercise.followingHint}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[var(--muted)]"
            >
              <ChevronIcon direction="next" />
            </button>
          </div>
        </div>

        {activeHint && (
          <div className="flex max-h-[min(22rem,50vh)] flex-col gap-1.5 overflow-y-auto px-4 py-3.5">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-[var(--muted)] uppercase">
              {messages.exercise.hintKind[activeHint.kind]}
            </p>
            <p className="text-[13px] leading-relaxed text-[var(--foreground)]">
              {activeHint.text}
            </p>
            {activeHint.kind === "syntax" && (
              <code className="mt-0.5 block overflow-x-auto rounded-md bg-[var(--background)] px-2.5 py-2 font-mono text-[11.5px] whitespace-pre text-[var(--accent)]">
                {activeHint.code}
              </code>
            )}
          </div>
        )}

        {canReveal && (
          <div className="border-t border-[var(--border)] px-4 py-2.5">
            <button
              type="button"
              onClick={() => {
                onReveal();
                setActiveIndex(Math.min(hints.length - 1, unlockedCount));
              }}
              className="w-full cursor-pointer rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-[12.5px] font-semibold text-[var(--accent)]"
            >
              {messages.exercise.nextHint}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
