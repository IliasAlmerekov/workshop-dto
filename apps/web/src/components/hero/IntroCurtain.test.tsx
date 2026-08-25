import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IntroCurtain } from "./IntroCurtain";
import {
  INTRO_MAX_EXIT_AT,
  INTRO_MIN_EXIT_AT,
  INTRO_STORAGE_KEY,
  INTRO_TIMING,
  INTRO_TYPING_MS,
  INTRO_WORD,
} from "@/lib/intro";

describe("IntroCurtain", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete document.documentElement.dataset.intro;
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("types the word one character at a time", () => {
    render(<IntroCurtain sceneReady={false} onLift={vi.fn()} />);

    const characters = screen
      .getByTestId("intro-curtain")
      .querySelectorAll(".intro-curtain__char");

    expect(characters).toHaveLength(INTRO_WORD.length);
    expect(Array.from(characters, (node) => node.textContent).join("")).toBe(
      INTRO_WORD,
    );
    // Each character waits for the one before it, which is what makes the
    // reveal read as typing rather than as a single fade.
    expect(characters[0]).toHaveStyle({ animationDelay: "0ms" });
    expect(characters[1]).toHaveStyle({
      animationDelay: `${INTRO_TIMING.charStep}ms`,
    });
  });

  it("blinks a caret from the end of the typing, so a held frame reads as waiting", () => {
    render(<IntroCurtain sceneReady={false} onLift={vi.fn()} />);

    expect(
      screen
        .getByTestId("intro-curtain")
        .querySelector(".intro-curtain__caret"),
    ).toHaveStyle({ animationDelay: `${INTRO_TYPING_MS}ms` });
  });

  it("is hidden from assistive technology, so the page's title is not read twice", () => {
    render(<IntroCurtain sceneReady={false} onLift={vi.fn()} />);

    expect(screen.getByTestId("intro-curtain")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("holds past the composed intro while the illustration is still warming up", () => {
    const onLift = vi.fn();
    render(<IntroCurtain sceneReady={false} onLift={onLift} />);

    act(() => vi.advanceTimersByTime(INTRO_MIN_EXIT_AT + 200));

    expect(onLift).not.toHaveBeenCalled();
    expect(screen.getByTestId("intro-curtain")).toHaveAttribute(
      "data-exiting",
      "false",
    );
  });

  it("lifts as soon as the illustration is ready, once the intro has played", () => {
    const onLift = vi.fn();
    const { rerender } = render(
      <IntroCurtain sceneReady={false} onLift={onLift} />,
    );

    // Ready early: the floor still has to pass, so the wordmark always reads.
    rerender(<IntroCurtain sceneReady onLift={onLift} />);
    expect(onLift).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(INTRO_MIN_EXIT_AT));
    expect(onLift).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("intro-curtain")).toHaveAttribute(
      "data-exiting",
      "true",
    );

    act(() => vi.advanceTimersByTime(INTRO_TIMING.exit));
    expect(screen.queryByTestId("intro-curtain")).not.toBeInTheDocument();
  });

  it("gives up waiting at the ceiling and hands over to the hero's own loading state", () => {
    const onLift = vi.fn();
    render(<IntroCurtain sceneReady={false} onLift={onLift} />);

    act(() => vi.advanceTimersByTime(INTRO_MAX_EXIT_AT));

    expect(onLift).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(INTRO_TIMING.exit));
    expect(screen.queryByTestId("intro-curtain")).not.toBeInTheDocument();
  });

  it("marks the session so a reload does not replay it", () => {
    render(<IntroCurtain sceneReady={false} onLift={vi.fn()} />);

    expect(window.sessionStorage.getItem(INTRO_STORAGE_KEY)).toBe("1");
  });

  it("skips straight to the hero when the pre-paint stamp says so", () => {
    document.documentElement.dataset.intro = "skip";
    const onLift = vi.fn();
    render(<IntroCurtain sceneReady={false} onLift={onLift} />);

    act(() => vi.advanceTimersByTime(32));

    expect(onLift).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("intro-curtain")).not.toBeInTheDocument();
    // Nothing played, so nothing is recorded as played.
    expect(window.sessionStorage.getItem(INTRO_STORAGE_KEY)).toBeNull();
  });

  it("lets a keypress dismiss it mid-wait and reveals the hero at once", () => {
    const onLift = vi.fn();
    render(<IntroCurtain sceneReady={false} onLift={onLift} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onLift).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("intro-curtain")).toHaveAttribute(
      "data-skipping",
      "true",
    );

    act(() => vi.advanceTimersByTime(INTRO_TIMING.skipExit));
    expect(screen.queryByTestId("intro-curtain")).not.toBeInTheDocument();
  });

  it("reveals the hero only once, however it is dismissed", () => {
    const onLift = vi.fn();
    render(<IntroCurtain sceneReady onLift={onLift} />);

    fireEvent.keyDown(window, { key: "a" });
    act(() => vi.advanceTimersByTime(INTRO_MAX_EXIT_AT + INTRO_TIMING.exit));

    expect(onLift).toHaveBeenCalledTimes(1);
  });
});
