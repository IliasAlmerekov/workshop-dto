"use client";

import Image from "next/image";
import { useRef } from "react";
import type { Language } from "@/lib/workshop/types";
import { TRACKS } from "./tracks";

type TrackPickerProps = {
  value: Language | null;
  onChange: (language: Language) => void;
  /** Opens the chosen track. Arrow-key selection intentionally does not call it. */
  onActivate?: (language: Language) => void;
  previewed?: Language | null;
  committed?: Language | null;
  onPreviewChange?: (language: Language | null) => void;
  /**
   * Id of the visible heading that labels the group. Preferred over an
   * `aria-label` so the group and the heading a participant actually reads
   * are the same string, not two copies of it.
   */
  labelledBy: string;
};

const ARROW_STEP: Record<string, 1 | -1> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/**
 * The hero's Language Card row. A radio group rather than four buttons: the
 * tracks are mutually exclusive, so arrow keys must move the selection and Tab
 * must pass over the group as one stop.
 */
export function TrackPicker({
  value,
  onChange,
  onActivate,
  previewed = null,
  committed = null,
  onPreviewChange,
  labelledBy,
}: TrackPickerProps) {
  const cards = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = TRACKS.findIndex((track) => track.language === value);
  const tabbableIndex = selectedIndex === -1 ? 0 : selectedIndex;

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    if (committed) {
      return;
    }
    const step = ARROW_STEP[event.key];
    if (step === undefined) {
      return;
    }
    event.preventDefault();
    const next = (index + step + TRACKS.length) % TRACKS.length;
    onChange(TRACKS[next].language);
    onPreviewChange?.(TRACKS[next].language);
    cards.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="flex flex-wrap gap-[14px] xl:gap-[18px]"
    >
      {TRACKS.map((track, index) => {
        const selected = value === track.language;
        const previewActive = previewed === track.language;
        const committedActive = committed === track.language;
        const dimmed = committed !== null && !committedActive;
        const visuallyActive = previewed !== null ? previewActive : selected;
        return (
          <button
            key={track.language}
            ref={(node) => {
              cards.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={committed !== null}
            tabIndex={index === tabbableIndex ? 0 : -1}
            onClick={() => {
              if (committed) {
                return;
              }
              onChange(track.language);
              onActivate?.(track.language);
            }}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onPointerEnter={(event) => {
              if (!committed && event.pointerType !== "touch") {
                onPreviewChange?.(track.language);
              }
            }}
            onPointerLeave={(event) => {
              if (!committed && event.pointerType !== "touch") {
                onPreviewChange?.(null);
              }
            }}
            onFocus={() => {
              if (!committed) {
                onPreviewChange?.(track.language);
              }
            }}
            onBlur={() => {
              if (!committed) {
                onPreviewChange?.(null);
              }
            }}
            style={{ flexBasis: Math.round(track.width * 0.82) }}
            className={`group flex h-[132px] min-w-[128px] grow cursor-pointer flex-col items-center justify-between rounded-[12px] border px-[15px] pt-[18px] pb-[15px] transition-[border-color,background-color,transform,opacity,filter] duration-300 ease-out motion-reduce:transition-none sm:grow-0 ${
              visuallyActive || committedActive
                ? "-translate-y-px border-border-accent bg-bg-surface"
                : "border-border-strong bg-bg-surface-muted hover:-translate-y-px hover:border-border-accent/45 hover:bg-bg-surface"
            } ${dimmed ? "opacity-[0.36] saturate-[0.55]" : "opacity-100"} ${
              committedActive ? "scale-[1.015]" : ""
            }`}
          >
            <span className="flex h-[53px] w-[66px] items-center justify-center">
              {/* Brand marks are the exact exported assets from Figma and are
                  locally versioned. `unoptimized` preserves those bytes while
                  Next's Image component still reserves the intrinsic box. */}
              <Image
                src={track.logo}
                alt=""
                width={track.logoWidth}
                height={track.logoHeight}
                unoptimized
                className="max-h-full max-w-full object-contain"
                style={{ width: "auto", height: "auto" }}
              />
            </span>
            <span
              className={`text-[20px] leading-[1.3] tracking-[-0.0125em] ${
                visuallyActive || committedActive
                  ? "text-text-accent"
                  : "text-text-primary"
              }`}
            >
              {track.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
