import { describe, expect, it } from "vitest";
import { en } from "./en";
import { de } from "./de";
import { LOCALES, isLocale, loadLocale } from "./locale";
import { TASK_IDS, LANGUAGES } from "@/lib/workshop/types";
import { TASK_DEFINITIONS } from "@/lib/workshop/tasks";
import { loadTask1Adapter } from "@/lib/exercises/task1Adapters";
import { loadTask2Adapter } from "@/lib/exercises/task2Adapters";
import { loadTask3Adapter } from "@/lib/exercises/task3Adapters";
import { loadTask4Adapter } from "@/lib/exercises/task4Adapters";
import type { TaskId } from "@/lib/workshop/types";

const LOADERS = {
  "request-dto": loadTask1Adapter,
  "request-mapper": loadTask2Adapter,
  "external-api": loadTask3Adapter,
  "response-dto": loadTask4Adapter,
} as const;

/**
 * The German catalogue is typed as `Messages`, so a *missing* key is already
 * a compile error. What the compiler cannot catch is a key left at its
 * English text, or a hint list that drifted out of step with the adapter it
 * annotates — which is what these check.
 */
describe("message catalogues", () => {
  it("translates every task's prose without touching its field identifiers", () => {
    for (const taskId of TASK_IDS) {
      expect(de.tasks[taskId].title).not.toBe(en.tasks[taskId].title);
      expect(de.tasks[taskId].description).not.toBe(
        en.tasks[taskId].description,
      );
      expect(de.tasks[taskId].explanation).not.toBe(
        en.tasks[taskId].explanation,
      );
      expect(de.tasks[taskId].fields).toHaveLength(
        en.tasks[taskId].fields.length,
      );
    }

    // Identifiers are code, so they must survive translation verbatim.
    expect(de.tasks["request-dto"].fields).toEqual(
      en.tasks["request-dto"].fields,
    );
  });

  it("gives every task and track a German hint set", () => {
    for (const taskId of TASK_IDS) {
      for (const language of LANGUAGES) {
        const german = de.hints[taskId][language];
        const english = en.hints[taskId][language];
        expect(german.concept).not.toBe(english.concept);
        expect(german.fields).not.toBe(english.fields);
        expect(german.syntax).not.toBe(english.syntax);
      }
    }
  });

  it("keeps the English hints in the catalogue identical to the adapters'", async () => {
    for (const taskId of TASK_IDS) {
      for (const language of LANGUAGES) {
        const adapter = await LOADERS[taskId as TaskId](language);
        const copy = en.hints[taskId][language];
        expect(adapter.hints.map((hint) => hint.text)).toEqual([
          copy.concept,
          copy.fields,
          copy.syntax,
        ]);
      }
    }
  });

  it("keeps the English task copy identical to the task definitions", () => {
    for (const task of TASK_DEFINITIONS) {
      expect(en.tasks[task.id].shortTitle).toBe(task.shortTitle);
      expect(en.tasks[task.id].title).toBe(task.title);
    }
  });

  it("translates the quiz option-for-option", () => {
    expect(de.quiz.questions).toHaveLength(en.quiz.questions.length);
    de.quiz.questions.forEach((question, index) => {
      expect(question.options).toHaveLength(
        en.quiz.questions[index].options.length,
      );
      expect(question.prompt).not.toBe(en.quiz.questions[index].prompt);
    });
  });

  it("defaults to English and rejects an unknown stored locale", () => {
    expect(LOCALES).toEqual(["en", "de"]);
    expect(isLocale("fr")).toBe(false);
    window.localStorage.setItem("dto-mapper-workshop-locale", "fr");
    expect(loadLocale()).toBe("en");
    window.localStorage.setItem("dto-mapper-workshop-locale", "de");
    expect(loadLocale()).toBe("de");
  });
});
