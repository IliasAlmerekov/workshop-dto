import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PARTS } from "./content";
import { SLIDES } from "./slides";
import {
  MORPH,
  SectionLabel,
  Wordmark,
} from "./components/primitives";

/** The frame every slide is composed against. See `.stage` in deck.css. */
const STAGE = { width: 1600, height: 900 } as const;

/**
 * A step is one press: a slide, at one of its fragments. Flattening the deck
 * into a single list of steps means forward and back are one operation each,
 * and the presenter never has to remember whether the next press advances a
 * fragment or a slide.
 */
type Step = { slide: number; fragment: number };

function buildSteps(): Step[] {
  return SLIDES.flatMap((slide, index) =>
    Array.from({ length: slide.fragments }, (_, fragment) => ({
      slide: index,
      fragment,
    })),
  );
}

export default function App() {
  const steps = useMemo(buildSteps, []);
  const [at, setAt] = useState(0);
  const [scale, setScale] = useState(1);
  const reduced = useReducedMotion();

  const step = steps[at];
  const slide = SLIDES[step.slide];

  const go = useCallback(
    (delta: number) =>
      setAt((current) => {
        const next = Math.max(0, Math.min(steps.length - 1, current + delta));
        return next;
      }),
    [steps.length],
  );

  /* Scale-to-fit. The talk is given on a room's interactive whiteboard whose
     exact size nobody has measured, so the deck refuses to reflow: it composes
     against a fixed frame and scales the whole frame down to whatever it is
     given. Letterboxing is visible; a layout reflowing live in front of an
     audience is embarrassing. */
  useEffect(() => {
    const fit = () =>
      setScale(
        Math.min(
          window.innerWidth / STAGE.width,
          window.innerHeight / STAGE.height,
        ),
      );
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        go(1);
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        go(-1);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        setAt(0);
      }
      if (event.key === "End") {
        event.preventDefault();
        setAt(steps.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, steps.length]);

  return (
    /* Reduced motion is a project invariant, and here it doubles as the escape
       hatch: one OS setting turns a morphing deck into a plain, reliable slide
       show on hardware nobody has rehearsed on. */
    <MotionConfig
      transition={reduced ? { duration: 0 } : MORPH}
      reducedMotion={reduced ? "always" : "never"}
    >
      <div className="stage-fit">
        <div className="stage" style={{ transform: `scale(${scale})` }}>
          <LayoutGroup>
            {/* The wordmark is the deck's one continuous element. On the
                welcome slide it is the headline in the middle of a white
                plane; from the second press on it lives in the corner. Same
                node, so the first slide change reads as the title stepping
                aside rather than one screen replacing another. */}
            {step.slide > 0 ? <Wordmark corner /> : null}

            {slide.part ? (
              <SectionLabel id={slide.part} text={PARTS[slide.part]} />
            ) : null}

            {/* `mode="sync"` — the default — is required, not incidental. The
                outgoing slide has to stay mounted while the incoming one
                arrives, because that overlap is where Framer matches the two
                copies of a `layoutId` and morphs between them. `mode="wait"`
                would play the deck as a stack of unrelated screens. */}
            <AnimatePresence>
              <motion.div
                key={slide.id}
                className="absolute inset-0"
                variants={SLIDE_FADE}
                initial="enter"
                animate="center"
                exit="exit"
                transition={FADE_THROUGH}
                style={{ willChange: "transform, opacity, filter" }}
              >
                {slide.render(step.fragment)}
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>

          {/* Tap zones for the board. A presenter standing at the screen
              advances by touching the slide, not by finding an arrow — but the
              keyboard and any clicker keep working, so nothing depends on this. */}
          <button
            type="button"
            aria-label="Previous"
            className="tap-zone left-0 w-[22%] cursor-w-resize opacity-0"
            onClick={() => go(-1)}
          />
          <button
            type="button"
            aria-label="Next"
            className="tap-zone right-0 w-[78%] cursor-e-resize opacity-0"
            onClick={() => go(1)}
          />

          {step.slide > 0 ? (
            <div className="pointer-events-none absolute bottom-[34px] left-[105px] z-30 flex items-center gap-[14px]">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-body-panel)",
                  letterSpacing: "var(--tracking-body-panel)",
                  color: "var(--color-text-muted)",
                }}
              >
                {String(step.slide + 1).padStart(2, "0")} /{" "}
                {String(SLIDES.length).padStart(2, "0")}
              </span>
              <div className="flex gap-[6px]">
                {SLIDES.map((entry, index) => (
                  <span
                    key={entry.id}
                    style={{
                      width: index === step.slide ? "18px" : "6px",
                      height: "6px",
                      borderRadius: "var(--radius-full)",
                      background:
                        index === step.slide
                          ? "var(--color-bg-accent)"
                          : "var(--color-border-strong)",
                      transition: "width 320ms cubic-bezier(0.22,1,0.36,1)",
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <motion.div
            className="pointer-events-none absolute bottom-0 left-0 z-30 h-[2px]"
            style={{
              width: "100%",
              background: "var(--color-bg-accent)",
              transformOrigin: "left center",
              willChange: "transform",
            }}
            animate={{ transform: `scaleX(${(at + 1) / steps.length})` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </MotionConfig>
  );
}

/* A steady transition keeps every slide on the same visual axis. Blur and a
   tiny scale change soften the handover without exposing the canvas at an edge. */
const SLIDE_FADE = {
  enter: {
    opacity: 0,
    transform: "scale(0.992)",
    filter: "blur(4px)",
  },
  center: { opacity: 1, transform: "none", filter: "blur(0px)" },
  exit: {
    opacity: 0,
    transform: "scale(0.996)",
    filter: "blur(2px)",
  },
} as const;

const FADE_THROUGH = { duration: 0.5, ease: [0.23, 1, 0.32, 1] } as const;
