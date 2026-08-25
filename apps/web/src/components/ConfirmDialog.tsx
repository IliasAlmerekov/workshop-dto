"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useMessages } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /**
   * `danger` for an action that destroys work — it colours the badge and the
   * confirm button with the failure token and keeps Cancel as the safe default.
   * `accent` is the neutral case (switching track, for instance).
   */
  tone?: "accent" | "danger";
  /** Glyph for the dialog's badge; usually the trigger's own icon. */
  icon?: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  tone = "accent",
  icon,
}: ConfirmDialogProps) {
  const messages = useMessages();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const cancelText = cancelLabel ?? messages.common.cancel;
  const danger = tone === "danger";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      // Focus lands on the way out, not on the destructive button: a stray
      // Enter after opening must not wipe the participant's progress.
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="confirm-dialog w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--foreground)] shadow-popover"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClose={onCancel}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onCancel();
        }
      }}
    >
      <div className="flex flex-col gap-14 p-20">
        <div className="flex items-start gap-14">
          {icon && (
            <span
              aria-hidden="true"
              className={cn(
                "flex size-40 shrink-0 items-center justify-center rounded-2xl",
                danger
                  ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                  : "bg-[var(--accent-soft)] text-[var(--accent-on-soft)]",
              )}
            >
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-heading-card leading-heading-card tracking-heading-card font-bold"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-description"
              className="text-body-small leading-body-small mt-6 text-[var(--muted)]"
            >
              {description}
            </p>
          </div>
        </div>

        {/* Cancel first in the DOM so it is the first stop on Tab, and the
            destructive action sits apart from it at the far end of the row. */}
        <div className="flex flex-wrap justify-end gap-8">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={danger ? "danger" : "accent"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
