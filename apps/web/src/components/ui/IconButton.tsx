"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Borderless icon action (Figma `Icon Button`, 39:19): a 40×40 `radius/lg`
 * square around a 22px glyph, used for the app bar's theme toggle and the
 * editor's own controls.
 *
 * 40px meets the 44px guidance only once the row's 26px gaps are counted, so
 * the hit area is the full square — never the glyph — and a `bg/surface-muted`
 * wash on hover gives the press its feedback without moving any bounds.
 */
type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required: the button carries no text, so it must name itself. */
  "aria-label": string;
  children: ReactNode;
};

export function IconButton({ className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex size-40 cursor-pointer items-center justify-center rounded-lg",
        "text-[var(--muted)] transition-colors duration-150 motion-reduce:transition-none",
        "hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
