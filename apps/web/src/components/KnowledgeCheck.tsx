"use client";

import { useState } from "react";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";

type QuizOption = {
  text: string;
  correct: boolean;
  feedback: string;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
};

/**
 * Three concise questions (spec 7.5/16.4) checking Entity exposure, mapper
 * responsibility, and DTO trade-offs — the three things the four exercises
 * actually taught. Not graded: every answer gets explanatory feedback
 * rather than a pass/fail, matching the workshop's non-punitive tone
 * elsewhere ("Insert solution" never punishes either).
 */
const QUESTIONS: QuizQuestion[] = [
  {
    id: "entity-exposure",
    prompt:
      "Why is it risky to serialize the internal User entity directly in an API response?",
    options: [
      {
        text: "It's slower than mapping to a DTO.",
        correct: false,
        feedback:
          "Performance isn't the core issue — the entity converts to JSON just as fast as a DTO would.",
      },
      {
        text: "It couples the public API contract to internal fields, and can leak sensitive data like a password hash.",
        correct: true,
        feedback:
          "Exactly — the entity endpoint in this workshop leaks passwordHash and internalNote for precisely this reason.",
      },
      {
        text: "Entities can't be serialized to JSON at all.",
        correct: false,
        feedback:
          "They can — that's exactly what the leaking entity endpoint in this workshop does.",
      },
      {
        text: "It requires writing more code than a DTO would.",
        correct: false,
        feedback:
          "It's actually less code — which is exactly what makes skipping the DTO tempting, and risky.",
      },
    ],
  },
  {
    id: "mapper-responsibility",
    prompt: "What does a mapper's map() method own?",
    options: [
      {
        text: "Persisting the mapped object to a database.",
        correct: false,
        feedback:
          "That's a different concern — and part of why this workshop's mapper is deliberately not the same thing as the database Data Mapper pattern.",
      },
      {
        text: "Explicit translation between two data shapes: renaming, normalizing, converting, and choosing what to include or drop.",
        correct: true,
        feedback:
          "Right — that's exactly what every mapper across all four exercises did.",
      },
      {
        text: "Deciding whether the incoming request is authorized.",
        correct: false,
        feedback:
          "Authorization belongs to a different layer — a mapper trusts that's already been checked.",
      },
      {
        text: "Validating that required fields are present.",
        correct: false,
        feedback:
          "Close, but validation is a separate concern — a mapper transforms data it already trusts is well-formed.",
      },
    ],
  },
  {
    id: "dto-tradeoffs",
    prompt: "When is a DTO probably not worth the extra code?",
    options: [
      {
        text: "When the data crosses into a public, external API.",
        correct: false,
        feedback:
          "That's exactly where a DTO earns its keep — a public contract needs the protection.",
      },
      {
        text: "When a field is security-sensitive, like a password hash.",
        correct: false,
        feedback:
          "That's the opposite — a security-sensitive field is the strongest reason to map explicitly.",
      },
      {
        text: "In small, short-lived, single-process code where the producer and consumer already share full trust.",
        correct: true,
        feedback:
          "Right — without a real boundary, the mapper is just extra ceremony with nothing to protect.",
      },
      {
        text: "Whenever the entity has more than five fields.",
        correct: false,
        feedback:
          "Field count isn't the deciding factor — whether a real boundary exists is.",
      },
    ],
  },
];

export function KnowledgeCheck() {
  const { state, completeQuiz } = useWorkshop();
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
        const selected = answered[question.id];
        return (
          <fieldset
            key={question.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <legend className="px-1 text-sm font-semibold">
              {questionIndex + 1}. {question.prompt}
            </legend>
            <div className="mt-3 flex flex-col gap-2">
              {question.options.map((option, optionIndex) => {
                const isSelected = selected === optionIndex;
                return (
                  <button
                    key={option.text}
                    type="button"
                    onClick={() => handleAnswer(question.id, optionIndex)}
                    aria-pressed={isSelected}
                    className={`rounded-lg border px-4 py-2.5 text-left text-sm ${
                      isSelected
                        ? option.correct
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
                  question.options[selected].correct
                    ? "text-[var(--accent)]"
                    : "text-amber-600"
                }`}
              >
                {question.options[selected].correct ? "✓ " : "! "}
                {question.options[selected].feedback}
              </p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
