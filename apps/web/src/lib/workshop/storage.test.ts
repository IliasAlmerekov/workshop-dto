import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  clearState,
  createDefaultState,
  loadState,
  saveState,
} from "./storage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("workshop storage", () => {
  it("returns a fresh default state when nothing is stored yet", () => {
    const state = loadState();
    expect(state.language).toBeNull();
    expect(state.tasks["request-dto"]).toEqual({
      completed: false,
      draft: "",
      touched: false,
      hintsUsed: 0,
    });
  });

  it("round-trips a saved state", () => {
    const state = createDefaultState();
    state.language = "typescript";
    state.tasks["request-dto"].draft = "export type X = {}";
    saveState(state);

    expect(loadState()).toEqual(state);
  });

  it("resets to defaults when the stored schema version does not match", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: SCHEMA_VERSION - 1,
        language: "java",
        tasks: {},
      }),
    );

    const state = loadState();
    expect(state.version).toBe(SCHEMA_VERSION);
    expect(state.language).toBeNull();
  });

  it("resets to defaults when the stored value is corrupt JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");

    expect(loadState()).toEqual(createDefaultState());
  });

  it("resets to defaults instead of crashing when a task is missing", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: SCHEMA_VERSION,
        language: null,
        tasks: {},
        quizCompleted: false,
      }),
    );

    expect(loadState()).toEqual(createDefaultState());
  });

  it("resets to defaults when the stored language is not a supported track", () => {
    const seeded = createDefaultState();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...seeded, language: "ruby" }),
    );

    expect(loadState().language).toBeNull();
  });

  it("resets to defaults when a task's fields have the wrong types", () => {
    const seeded = createDefaultState();
    seeded.tasks["request-dto"] = {
      // @ts-expect-error -- deliberately malformed to test the runtime guard
      completed: "yes",
      draft: "",
      touched: false,
      hintsUsed: 0,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    expect(loadState()).toEqual(createDefaultState());
  });

  it("clearState removes the persisted entry", () => {
    saveState(createDefaultState());
    clearState();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
