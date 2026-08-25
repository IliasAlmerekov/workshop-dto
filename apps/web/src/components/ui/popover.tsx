"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

/**
 * The shadcn Popover, restyled onto this project's tokens.
 *
 * Radix earns its place here: a popover has to trap and restore focus, close
 * on Escape and on an outside click, flip when it would leave the viewport,
 * and wire `aria-expanded`/`aria-controls` between trigger and content. Those
 * are the parts that quietly break in a hand-rolled version, and they matter
 * on a surface the workshop promises is fully keyboard-operable.
 *
 * The dependency is `@radix-ui/react-popover`, not shadcn's `radix-ui`
 * umbrella: the umbrella re-exports every primitive, so importing it from a
 * component the exercise page renders on every task pulled the whole set
 * into that module graph.
 *
 * What is *not* taken from shadcn is its palette: `bg-popover`,
 * `text-popover-foreground` and `border-border` do not exist in this project,
 * whose theme is `--surface`, `--foreground`, `--border` (see `globals.css`).
 * Nor is `tw-animate-css` — the open/close motion is one keyframe pair in
 * `globals.css`, the same way every other animation in this codebase is
 * written, and it is disabled under `prefers-reduced-motion` there.
 */
function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={16}
        className={cn(
          "popover-content z-50 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--foreground)] shadow-[0_1px_3px_rgba(9,9,11,0.06),0_18px_48px_-16px_rgba(9,9,11,0.22)] outline-hidden",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverArrow({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Arrow>) {
  return (
    <PopoverPrimitive.Arrow
      data-slot="popover-arrow"
      width={14}
      height={7}
      // The arrow is drawn from the surface colour with a stroked edge so it
      // reads as part of the same panel rather than a separate triangle.
      className={cn(
        "fill-[var(--surface)] stroke-[var(--border)] [stroke-width:1px]",
        className,
      )}
      {...props}
    />
  );
}

export { Popover, PopoverAnchor, PopoverArrow, PopoverContent, PopoverTrigger };
