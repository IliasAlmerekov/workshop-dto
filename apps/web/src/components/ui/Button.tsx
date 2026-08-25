"use client";

import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

/**
 * The action button under the exercise editor (Figma `Button`, 38:54).
 *
 * One shell — 54px tall, `radius/lg`, 26px side padding, a 12px gap around an
 * 18px glyph — with three fills from the library's variants:
 *
 * - `primary`   → `bg/action` navy. The screen's single primary CTA.
 * - `accent`    → `bg/accent` blue. Progression (Continue) once it unlocks;
 *                 distinct from Check solution so the two never read alike.
 * - `secondary` → `bg/surface` + `border/default` hairline.
 * - `danger`    → `status/danger-solid`. Destroys work; never the default.
 *
 * Disabled is a state, not a variant: every fill collapses to `bg/disabled`
 * with `text/muted`, matching the Disabled variant Figma ships for Continue.
 */
type ButtonVariant = "primary" | "accent" | "secondary" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Glyph before the label — Check solution's play, Show hint's lightbulb. */
  icon?: ReactNode;
  /** Glyph after the label — Continue's arrow. */
  iconAfter?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-[var(--action)] text-[var(--action-foreground)]",
  accent: "bg-[var(--accent-solid)] text-[var(--accent-foreground)]",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]",
  danger: "bg-[var(--danger-solid)] text-[var(--status-foreground)]",
};

export function Button({
  variant = "secondary",
  icon,
  iconAfter,
  className,
  children,
  disabled,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        // The library draws these at 54px; trimmed to 44 — still exactly the
        // touch-target minimum — so the whole exercise fits one viewport
        // without the action row eating the editor's height.
        // 44 is not on the token scale, hence the literal.
        "flex h-[44px] shrink-0 cursor-pointer items-center gap-8 rounded-lg px-18",
        "text-body-small leading-body-small font-medium whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none",
        disabled
          ? "cursor-not-allowed border-transparent bg-[var(--disabled)] text-[var(--disabled-foreground)]"
          : VARIANTS[variant],
        // Bold is the primary CTA's own weight in the library; the other two
        // variants stay Medium so the hierarchy survives a colourless render.
        !disabled &&
          (variant === "primary" || variant === "danger") &&
          "font-bold",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
      {iconAfter}
    </button>
  );
}
