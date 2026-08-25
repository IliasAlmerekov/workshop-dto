"use client";

import { useState } from "react";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { useMessages } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { IconCircleCheck, IconCircleX } from "./ui/icons";

/**
 * Three concise questions (spec 7.5/16.4) checking Entity exposure, mapper
 * responsibility, and DTO trade-offs — the concepts the six registration stages
 * actually taught. Not graded: every answer gets explanatory feedback
 * rather than a pass/fail, matching the workshop's non-punitive tone
 * elsewhere ("Insert solution" never punishes either).
 *
 * Only the ids and which option is right live here. The prompts, answers and
 * feedback are copy, so they live in the message catalogues and stay in
 * lockstep across locales by index.
 */
const QUESTIONS = [
  { id: "entity-exposure", correctIndex: 1 },
  { id: "mapper-responsibility", correctIndex: 1 },
  { id: "dto-tradeoffs", correctIndex: 2 },
] as const;

export function KnowledgeCheck() {
  const { state, completeQuiz } = useWorkshop();
  const messages = useMessages();
  const [answered, setAnswered] = useState<Record<string, number>>({});

  function handleAnswer(questionId: string, optionIndex: number) {
    const next = { ...answered, [questionId]: optionIndex };
    setAnswered(next);
    if (Object.keys(next).length === QUESTIONS.length && !state.quizCompleted) {
      completeQuiz();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {QUESTIONS.map((question, questionIndex) => {
        const copy = messages.quiz.questions[questionIndex];
        const selected = answered[question.id];
        return (
          <fieldset
            key={question.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"
          >
            <legend className="flex w-full items-start gap-3 px-1 text-body font-bold text-[var(--foreground)]">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-label-caption font-bold text-[var(--accent-on-soft)]"
              >
                {questionIndex + 1}
              </span>
              <span>{copy.prompt}</span>
            </legend>
            <div className="mt-5 flex flex-col gap-2">
              {copy.options.map((option, optionIndex) => {
                const isSelected = selected === optionIndex;
                const correct = optionIndex === question.correctIndex;
                return (
                  <button
                    key={option.text}
                    type="button"
                    onClick={() => handleAnswer(question.id, optionIndex)}
                    aria-pressed={isSelected}
                    className={cn(
                      "min-h-11 rounded-lg border px-4 py-3 text-left text-body-small leading-body-small text-[var(--foreground)] transition-colors motion-reduce:transition-none",
                      isSelected &&
                        correct &&
                        "border-[var(--success-border)] bg-[var(--success-soft)]",
                      isSelected &&
                        !correct &&
                        "border-[var(--danger-border)] bg-[var(--danger-soft)]",
                      !isSelected &&
                        "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)]",
                    )}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>
            {selected !== undefined && (
              <p
                role="status"
                className={cn(
                  "mt-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-body-small leading-body-small",
                  selected === question.correctIndex
                    ? "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-on-soft)]"
                    : "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]",
                )}
              >
                {selected === question.correctIndex ? (
                  <IconCircleCheck size={18} className="mt-0.5 shrink-0" />
                ) : (
                  <IconCircleX size={18} className="mt-0.5 shrink-0" />
                )}
                {copy.options[selected].feedback}
              </p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
