"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";

/**
 * The shadcn Select, adapted to this project the same way `popover.tsx` was.
 *
 * Kept from the original: the Radix primitive (typeahead, roving focus,
 * Escape/outside-click, collision handling, `aria-activedescendant` — the
 * parts a native `<select>` gives for free and a custom listbox usually gets
 * wrong), the portalled popper content, and the `indicatorPosition` context.
 * That last one earns its keep here: the language rows lead with a track
 * logo, so the checkmark belongs on the trailing edge, not fighting the icon
 * for the leading one.
 *
 * Dropped, because nothing in this codebase uses them: `class-variance-
 * authority` (the trigger has one shape, so a variant table would describe a
 * choice that does not exist), `lucide-react` (every icon here is an inline
 * SVG), and the `indicator`/`indicatorVisibility` escape hatches.
 *
 * Retokenised throughout: shadcn's `bg-popover`, `border-input`,
 * `text-muted-foreground` and `bg-accent` do not exist in this theme, whose
 * vocabulary is `--surface`, `--border`, `--muted`, `--accent-soft`.
 * `tw-animate-css` is replaced by the `select-content` keyframes in
 * `globals.css`, which honour `prefers-reduced-motion`.
 */

const SelectContext = React.createContext<{
  indicatorPosition: "left" | "right";
}>({ indicatorPosition: "left" });

function Select({
  indicatorPosition = "left",
  ...props
}: {
  indicatorPosition?: "left" | "right";
} & React.ComponentProps<typeof SelectPrimitive.Root>) {
  const value = React.useMemo(
    () => ({ indicatorPosition }),
    [indicatorPosition],
  );

  return (
    <SelectContext.Provider value={value}>
      <SelectPrimitive.Root {...props} />
    </SelectContext.Provider>
  );
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5.5 12.5 10 17l8.5-9.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] outline-hidden transition-colors duration-150 select-none focus-visible:border-[var(--accent)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent-soft)] data-[state=open]:border-[var(--accent)] motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronIcon className="ml-auto shrink-0 text-[var(--muted)] transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-[var(--muted)]",
        className,
      )}
      {...props}
    >
      <ChevronIcon className="rotate-180" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-[var(--muted)]",
        className,
      )}
      {...props}
    >
      <ChevronIcon />
    </SelectPrimitive.ScrollDownButton>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          "select-content relative z-50 max-h-96 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[0_1px_3px_rgba(9,9,11,0.06),0_18px_48px_-16px_rgba(9,9,11,0.22)]",
          className,
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className="p-1.5">
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-2 py-1.5 text-[10px] font-semibold tracking-[0.1em] text-[var(--muted)] uppercase",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  const { indicatorPosition } = React.useContext(SelectContext);

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-2.5 rounded-lg py-2 text-sm whitespace-nowrap outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-[var(--background)] data-[state=checked]:font-semibold data-[state=checked]:text-[var(--accent)]",
        indicatorPosition === "left" ? "ps-8 pe-2.5" : "ps-2.5 pe-8",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute flex h-3.5 w-3.5 items-center justify-center text-[var(--accent)]",
          indicatorPosition === "left" ? "start-2" : "end-2.5",
        )}
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("-mx-1.5 my-1.5 h-px bg-[var(--border)]", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
