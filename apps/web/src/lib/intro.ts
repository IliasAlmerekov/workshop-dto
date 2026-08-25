/**
 * The landing page's opening curtain: a white plane with `WORKSHOP` typed
 * across it, which lifts to reveal the hero.
 *
 * Two decisions are encoded here rather than in the component, because both
 * have to be answered *before the first paint* — a curtain that appears one
 * frame late has already shown the hero it was meant to introduce, and a
 * curtain that lingers one frame too long flashes at someone who has seen it.
 */
export const INTRO_STORAGE_KEY = "dto-mapper-workshop-intro";

/**
 * Once per session, not once per load.
 *
 * An intro is a first impression, and a first impression cannot be made twice.
 * Played on every load it stops being an introduction and becomes a toll — paid
 * by the two people who reload most, the participant who refreshes after losing
 * their place and whoever is building this. `sessionStorage` (not `local`) keeps
 * it a real welcome: a new tab or a new day earns it again, the reload during a
 * workshop does not.
 *
 * Set this to `false` to play it on every load.
 */
export const INTRO_ONCE_PER_SESSION = true;

/** The word the curtain types. Split per character by the component. */
export const INTRO_WORD = "WORKSHOP";

/**
 * The curtain's timeline, in milliseconds.
 *
 * The curtain is not on a fixed clock. It has a **floor**, a **wait**, and a
 * **ceiling**, because the thing it is covering does not take a fixed amount of
 * time: behind the plane a WebGL context is being created, a 1k HDRI decoded and
 * four transmission shaders compiled, and that lands anywhere between a few
 * hundred milliseconds on a workstation and several seconds on a cold cache.
 *
 * A single longer duration would only be a guess at that — too slow for the
 * machine that was ready early, still too fast for the one that was not. So the
 * floor is the composed intro that always plays, the wait holds for the renderer
 * past it, and the ceiling is the promise that the wait ends whatever happens.
 *
 * `charStep` is the cadence between characters and `charDuration` how long each
 * one takes to land, so the typing runs for `charStep * (n - 1) + charDuration`.
 */
export const INTRO_TIMING = {
  charStep: 62,
  charDuration: 260,
  /** The beat after the last character, where the finished wordmark just sits. */
  minHold: 420,
  /**
   * How much longer the curtain will hold past its floor, waiting for the
   * illustration to be ready. Bounded on purpose: past a couple of seconds the
   * honest move is to hand over to the hero's own loading study, which is a
   * designed state, rather than keep someone in front of a wordmark.
   */
  maxWait: 1400,
  exit: 620,
  /** Period of the caret's blink while the curtain waits. */
  caretBlink: 1000,
  /** A skip is a request for the page *now*, so it gets a fast fade, not the
   *  composed exit. Slow where the user is deciding, fast where we respond. */
  skipExit: 220,
} as const;

export const INTRO_TYPING_MS =
  INTRO_TIMING.charStep * (INTRO_WORD.length - 1) + INTRO_TIMING.charDuration;

/** The earliest the plane may start lifting: the composed intro, in full. */
export const INTRO_MIN_EXIT_AT = INTRO_TYPING_MS + INTRO_TIMING.minHold;

/** The latest it may start, however unready the renderer still is. */
export const INTRO_MAX_EXIT_AT = INTRO_MIN_EXIT_AT + INTRO_TIMING.maxWait;

export function markIntroPlayed() {
  try {
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
  } catch {
    // A blocked storage means the intro plays again. Harmless.
  }
}

/**
 * Runs in `<head>` before the first paint and stamps `data-intro="skip"` on the
 * root when the curtain must not be seen at all.
 *
 * This has to be an inline script rather than React state. The server cannot
 * know whether this session has already seen the intro, so whichever default it
 * renders is wrong half the time: render the curtain and a returning visitor
 * gets a white flash before hydration removes it; omit it and a first-time
 * visitor sees the hero for a frame before it is covered. A synchronous script
 * in `<head>` settles it before anything is painted, which is the same reason
 * `THEME_INIT_SCRIPT` exists.
 *
 * Reduced motion skips it outright rather than showing a still curtain. Gentler
 * motion is the right answer when an animation carries meaning; this one is
 * pure delight, and stripped of its motion all that is left is a 1.4s wait in
 * front of the content.
 */
export const INTRO_INIT_SCRIPT = `(function(){try{var skip=false;if(${String(
  INTRO_ONCE_PER_SESSION,
)}&&sessionStorage.getItem("${INTRO_STORAGE_KEY}"))skip=true;if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)skip=true;if(skip)document.documentElement.dataset.intro="skip";}catch(e){}})();`;

/** Mirrors `INTRO_INIT_SCRIPT` for the React tree, which reads the same stamp. */
export function introSkipped(): boolean {
  if (typeof document === "undefined") {
    return true;
  }
  return document.documentElement.dataset.intro === "skip";
}
