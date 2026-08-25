"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  INTRO_MAX_EXIT_AT,
  INTRO_MIN_EXIT_AT,
  INTRO_TIMING,
  INTRO_TYPING_MS,
  INTRO_WORD,
  introSkipped,
  markIntroPlayed,
} from "@/lib/intro";

/**
 * `WORKSHOP` typed onto a white plane, which lifts to reveal the hero.
 *
 * The wordmark borrows the hero's own `h1` treatment — same weight, same
 * uppercase, same negative tracking — so this is not a splash screen with its
 * own taste. It is the page's headline, shown alone for a moment before the rest
 * of the page arrives around it.
 *
 * **The plane waits for the illustration.** It does not run on a fixed clock,
 * because what it covers does not take a fixed amount of time — a WebGL context,
 * a 1k HDRI and four transmission shaders are being prepared behind it. So the
 * composed intro plays in full (the floor), then the plane holds for the
 * renderer, and lifts the moment it is ready or when the ceiling is reached,
 * whichever comes first. On a fast machine that is barely longer than the
 * typing; on a slow one the curtain absorbs the wait that would otherwise have
 * been a loading study.
 *
 * The caret is what makes that variable wait legible. It arrives when the last
 * character lands and blinks until the plane lifts, so a held frame reads as a
 * cursor waiting rather than as a page that has stopped.
 *
 * Motion here is `opacity`, `transform` and `filter` only, and the typing is
 * keyframes with per-character delays — off the main thread, which matters more
 * on this element than anywhere else on the page, since it plays over the exact
 * work it exists to hide.
 */
export function IntroCurtain({
  sceneReady,
  onLift,
}: {
  /** The illustration has something real to show — live scene or 2D fallback. */
  sceneReady: boolean;
  onLift: () => void;
}) {
  const [pastFloor, setPastFloor] = useState(false);
  const [ceilingReached, setCeilingReached] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [done, setDone] = useState(false);
  const lifted = useRef(false);

  const lift = useCallback(() => {
    if (lifted.current) {
      return;
    }
    lifted.current = true;
    onLift();
  }, [onLift]);

  useEffect(() => {
    // A returning visitor, or someone who asked for reduced motion. The plane is
    // already `display: none` from the pre-paint stamp, so there is nothing to
    // animate away — hand the hero its reveal and get out of the tree.
    if (introSkipped()) {
      const frame = requestAnimationFrame(() => {
        lift();
        setDone(true);
      });
      return () => cancelAnimationFrame(frame);
    }

    markIntroPlayed();

    const toFloor = window.setTimeout(
      () => setPastFloor(true),
      INTRO_MIN_EXIT_AT,
    );
    // The ceiling. Whatever the renderer is doing, the wait ends here.
    const toCeiling = window.setTimeout(
      () => setCeilingReached(true),
      INTRO_MAX_EXIT_AT,
    );
    return () => {
      window.clearTimeout(toFloor);
      window.clearTimeout(toCeiling);
    };
  }, [lift]);

  // Derived, not stored: the exit is simply the moment the composed intro has
  // played *and* the illustration is ready — whichever of the two lands second
  // — or the moment the ceiling ends the wait regardless.
  const exiting = (pastFloor && sceneReady) || ceilingReached;

  // The hero begins its own reveal as the plane starts to lift, so its 420ms
  // material fade happens *inside* the 620ms exit. Two dissolves on top of each
  // other read as one handover; played in sequence they read as two screens.
  useEffect(() => {
    if (!exiting && !skipping) {
      return;
    }
    lift();
    const timer = window.setTimeout(
      () => setDone(true),
      skipping ? INTRO_TIMING.skipExit : INTRO_TIMING.exit,
    );
    return () => window.clearTimeout(timer);
  }, [exiting, skipping, lift]);

  // Anyone who wants the page now can have it. An intro that cannot be
  // dismissed is a modal without a close button — and the people most likely to
  // reach for a key here are the ones who have already seen it.
  const skip = useCallback(() => setSkipping(true), []);

  useEffect(() => {
    if (done || skipping) {
      return;
    }
    const passive = { passive: true } as const;
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip, passive);
    window.addEventListener("wheel", skip, passive);
    window.addEventListener("touchstart", skip, passive);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
    };
  }, [done, skipping, skip]);

  if (done) {
    return null;
  }

  const leaving = exiting || skipping;

  return (
    <div
      data-testid="intro-curtain"
      data-exiting={String(exiting)}
      data-skipping={String(skipping)}
      // Decorative in full: the real `WORKSHOP` is the hero's `h1`, already in
      // the document. Announcing this one would read the page's title twice.
      aria-hidden="true"
      className={`intro-curtain fixed inset-0 z-[100] flex items-center justify-center bg-white ${
        skipping
          ? "intro-curtain--skipping"
          : exiting
            ? "intro-curtain--exiting"
            : ""
      }`}
      style={{
        transitionDuration: `${
          skipping ? INTRO_TIMING.skipExit : INTRO_TIMING.exit
        }ms`,
      }}
    >
      <p
        className="intro-curtain__word flex text-[clamp(2.75rem,8.2vw,137px)] leading-none font-bold tracking-[-0.0496em] text-[#0a0a0a] uppercase"
        style={{ transitionDuration: `${INTRO_TIMING.exit}ms` }}
      >
        {INTRO_WORD.split("").map((character, index) => (
          <span
            key={`${character}-${index}`}
            className="intro-curtain__char"
            style={{
              animationDelay: `${index * INTRO_TIMING.charStep}ms`,
              animationDuration: `${INTRO_TIMING.charDuration}ms`,
            }}
          >
            {character}
          </span>
        ))}
        {/* Arrives with the last character and blinks until the plane lifts. It
            is what turns a variable wait into a cursor waiting rather than a
            page that has stopped — so it is only rendered while there is still
            something to wait for. */}
        {leaving ? null : (
          <span
            className="intro-curtain__caret"
            style={{
              animationDelay: `${INTRO_TYPING_MS}ms`,
              animationDuration: `${INTRO_TIMING.caretBlink}ms`,
            }}
          />
        )}
      </p>
    </div>
  );
}
