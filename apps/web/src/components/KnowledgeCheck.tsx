"use client";

import { useState } from "react";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { useMessages } from "@/lib/i18n";

/**
 * Three concise questions (spec 7.5/16.4) checking Entity exposure, mapper
 * responsibility, and DTO trade-offs — the three things the four exercises
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
    <div className="flex flex-col gap-6">
      {QUESTIONS.map((question, questionIndex) => {
        const copy = messages.quiz.questions[questionIndex];
        const selected = answered[question.id];
        return (
          <fieldset
            key={question.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <legend className="px-1 text-sm font-semibold">
              {questionIndex + 1}. {copy.prompt}
            </legend>
            <div className="mt-3 flex flex-col gap-2">
              {copy.options.map((option, optionIndex) => {
                const isSelected = selected === optionIndex;
                const correct = optionIndex === question.correctIndex;
                return (
                  <button
                    key={option.text}
                    type="button"
                    onClick={() => handleAnswer(question.id, optionIndex)}
                    aria-pressed={isSelected}
                    className={`rounded-lg border px-4 py-2.5 text-left text-sm ${
                      isSelected
                        ? correct
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-amber-500 bg-amber-500/10"
                        : "border-[var(--border)] hover:bg-[var(--background)]"
                    }`}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>
            {selected !== undefined && (
              <p
                role="status"
                className={`mt-3 text-sm ${
                  selected === question.correctIndex
                    ? "text-[var(--accent)]"
                    : "text-amber-600"
                }`}
              >
                {selected === question.correctIndex ? "✓ " : "! "}
                {copy.options[selected].feedback}
              </p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
