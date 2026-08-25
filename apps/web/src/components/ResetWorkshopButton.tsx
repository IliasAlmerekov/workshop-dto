"use client";

import { useState } from "react";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { useMessages } from "@/lib/i18n";
import { ConfirmDialog } from "./ConfirmDialog";
import { IconButton } from "./ui/IconButton";
import { IconRotateCcw } from "./ui/icons";

export function ResetWorkshopButton() {
  const { resetWorkshop } = useWorkshop();
  const messages = useMessages();
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        aria-label={messages.header.resetLabel}
        title={messages.header.resetLabel}
        onClick={() => setOpen(true)}
      >
        <IconRotateCcw size={22} />
      </IconButton>

      <ConfirmDialog
        open={open}
        tone="danger"
        icon={<IconRotateCcw size={20} />}
        title={messages.header.resetTitle}
        description={messages.header.resetDescription}
        confirmLabel={messages.header.resetConfirm}
        onConfirm={() => {
          resetWorkshop();
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
