"use client";

import { useState } from "react";
import type { TaskDefinition } from "@/lib/workshop/tasks";
import type { TaskProgress, Language } from "@/lib/workshop/types";
import { fileExtension } from "@/lib/workshop/fileExtension";
import { starterCode } from "@/lib/workshop/starterCode";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { CodeEditor } from "./CodeEditor";

type ExerciseCardProps = {
  task: TaskDefinition;
  progress: TaskProgress;
  language: Language;
};

function ClipboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="4"
        width="14"
        height="17"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9 4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6H9V4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 11h6M9 15h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ExerciseCard({ task, progress, language }: ExerciseCardProps) {
  const { updateDraft, completeTask } = useWorkshop();
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Until the participant edits this task, the editor shows the current
  // track's starter code without writing it to storage. That keeps an
  // untouched task pristine across language switches, and lets a deliberately
  // emptied editor stay empty instead of snapping the template back.
  const editorValue = progress.touched
    ? progress.draft
    : starterCode(task.id, language);

  return (
    <section className="flex flex-col gap-6 px-8 py-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.12em] text-[var(--accent)] uppercase">
          Exercise {String(task.order).padStart(2, "0")}
        </p>
        <h1 className="mt-3 text-[2.75rem] leading-[1.05] font-bold tracking-tight">
          {task.title}
        </h1>
        <p className="mt-2 text-lg text-[var(--muted)]">{task.question}</p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          {task.description}
        </p>
      </div>

      <div className="flex gap-4 rounded-xl border border-[var(--border)] p-5">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"
        >
          <ClipboardIcon />
        </span>
        <div>
          <p className="text-sm font-semibold">Your task</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Complete{" "}
            <code className="font-mono text-[var(--accent)]">
              {task.fileName}
            </code>{" "}
            with the following fields:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {task.fields.map((field) => (
              <span
                key={field}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--accent)]"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      </div>

      <CodeEditor
        id={`draft-${task.id}`}
        label={`Your solution for ${task.title}`}
        fileName={`${task.fileName}.${fileExtension(language)}`}
        language={language}
        value={editorValue}
        onChange={(value) => {
          updateDraft(task.id, value);
          setChecked(false);
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)]"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5.5v13l11-6.5-11-6.5Z" />
          </svg>
          Check solution
        </button>
        <button
          type="button"
          onClick={() => setShowHint((value) => !value)}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-semibold"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .9 1.7h5.4c.1-.7.4-1.3.9-1.7A6 6 0 0 0 12 3Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Show hint
        </button>
        <button
          type="button"
          disabled={!checked}
          onClick={() => completeTask(task.id)}
          className="ml-auto flex items-center gap-2 rounded-lg bg-[var(--accent-solid)] px-5 py-3 text-sm font-semibold text-[var(--accent-foreground)] disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:text-[var(--muted)]"
        >
          Continue
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {showHint && (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--muted)]">
          Progressive hints for this exercise unlock once task validation ships
          in a future update.
        </p>
      )}

      <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M12 11v5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="12" cy="8" r="1" fill="currentColor" />
        </svg>
        {checked
          ? "Preview build: any draft is accepted. Continue to the next exercise."
          : "Check solution to preview the flow — real validation ships in a future update."}
      </p>
    </section>
  );
}
