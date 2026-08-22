"use client";

import { useState } from "react";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { ConfirmDialog } from "./ConfirmDialog";

export function ResetWorkshopButton() {
  const { resetWorkshop } = useWorkshop();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Reset workshop"
        title="Reset workshop"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
        onClick={() => setOpen(true)}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 12a8 8 0 1 1 2.6 5.9M4 12V6m0 6h6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <ConfirmDialog
        open={open}
        title="Reset the whole workshop?"
        description="This clears your language selection and all task progress on this device. This cannot be undone."
        confirmLabel="Reset everything"
        onConfirm={() => {
          resetWorkshop();
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
