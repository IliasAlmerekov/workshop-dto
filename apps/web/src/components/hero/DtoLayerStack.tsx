"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supportsWebGL } from "@/lib/three/capabilities";
import {
  pickSceneQuality,
  readDeviceHints,
  type SceneQuality,
} from "@/lib/three/quality";
import { SceneErrorBoundary } from "@/components/three/SceneErrorBoundary";
import {
  DtoLayerStackFallback,
  STACK_DESCRIPTION,
} from "./DtoLayerStackFallback";
import { DtoLayerStackLoading } from "./DtoLayerStackLoading";
import type { Language } from "@/lib/workshop/types";
import {
  HERO_LOADER_EXIT_MS,
  HERO_PREVIEW_MS,
  HERO_TRACK_TEXT_MS,
  TRACK_FOCUS_LAYER_INDEX,
  TRACK_PREVIEWS,
} from "./heroMotion";

/**
 * Gate in front of the hero's glass scene. It owns the two decisions that
 * must not reach the scene itself:
 *
 *  - whether WebGL exists at all, which decides 3D against the static vector;
 *  - how expensive this device may render, from `pickSceneQuality`;
 *
 * Both are read after mount. A lightweight CSS glass study holds the reserved
 * area during capability checks and renderer warm-up. The labelled vector is
 * reserved for an actual unavailable/failed WebGL path, so successful devices
 * never flash a lower-fidelity copy of the finished pipeline.
 */
const DtoLayerStackCanvas = dynamic(() => import("./DtoLayerStackCanvas"), {
  ssr: false,
  loading: () => null,
});

type Mode =
  | { kind: "pending" }
  | { kind: "flat" }
  | { kind: "glass"; quality: SceneQuality; reducedMotion: boolean };

type DtoLayerStackProps = {
  className?: string;
  previewTrack?: Language | null;
  selectedTrack?: Language | null;
  expanded?: boolean;
  /**
   * Index into `DTO_LAYERS` to light, overriding the track-derived focus —
   * how the workshop points the same stack at the boundary the current
   * exercise builds.
   */
  focusLayerIndex?: number | null;
  /**
   * Hold the reveal even once the renderer is warm. The landing page's intro
   * curtain covers the illustration while it warms up, and the slabs' opening
   * move must not be spent behind it — the whole point of clocking that move
   * from the reveal is that someone is there to see it.
   */
  readyToReveal?: boolean;
  /**
   * Fired once the illustration has something real to show — a warmed-up live
   * scene, or the 2D fallback on a device without WebGL. The landing page's
   * intro curtain waits on this rather than on a fixed duration, so the wait it
   * absorbs is the actual one.
   */
  onSettled?: () => void;
  /** The hero's track card and exercise counter; off outside the landing page. */
  trackOverlay?: boolean;
  /** Announced by the scene's `role="img"`. */
  description?: string;
};

/**
 * Where the preview card sits when no track is previewed, as a percentage of
 * the illustration's height. Stage travel is expressed as an offset from it so
 * the movement can live in a transform.
 */
const PREVIEW_BASE_TOP = 40.1;

const TRACK_ORDER = Object.keys(TRACK_PREVIEWS) as Language[];

/**
 * One line of the track card, holding all four languages at once and
 * cross-fading between them.
 *
 * Now that the card no longer travels between stages, changing language is a
 * pure text swap at fixed coordinates — and a text swap in place reads as a
 * glitch, not as a change. So every language is rendered, stacked, and only
 * opacity, blur and a 2px settle separate the live one from the rest. The words
 * dissolve *through* each other: blur is what bridges two different strings at
 * the same origin into one label morphing, where a plain crossfade would show
 * two overlapping texts.
 *
 * Keeping all four mounted is also what makes a fast scrub across the picker
 * feel right. These are transitions on stable nodes, so a language change
 * mid-fade retargets from wherever the opacity currently is; keyed remounts or
 * keyframes would restart from zero every time the pointer moved on.
 */
function TrackLine({
  shown,
  visible,
  height,
  className,
  render,
}: {
  shown: Language;
  /** Whether the card itself is on screen. */
  visible: boolean;
  /** Reserved height, in px — the layers are absolute and cannot size it. */
  height: number;
  className: string;
  render: (track: Language) => string;
}) {
  return (
    <span className="relative block" style={{ height }}>
      {TRACK_ORDER.map((track) => (
        <span
          key={track}
          // All four are always mounted, so "which language does the card
          // read?" cannot be answered from text content alone — by anyone,
          // including a test. This names the live one.
          data-track={track}
          data-live={String(track === shown)}
          className={`absolute inset-0 block transition-[opacity,filter,transform] ease-out motion-reduce:transition-none ${className}`}
          style={{
            transitionDuration: `${HERO_TRACK_TEXT_MS}ms`,
            // While the card is leaving, the text holds and only fades once the
            // card is already gone. Without the delay the language would fade
            // out from under a card that is still visible — a second change
            // starting exactly where the eye is following the first.
            transitionDelay: visible ? "0ms" : `${HERO_PREVIEW_MS}ms`,
            opacity: track === shown ? 1 : 0,
            filter: track === shown ? "blur(0px)" : "blur(4px)",
            transform: track === shown ? "translateY(0)" : "translateY(2px)",
          }}
        >
          {render(track)}
        </span>
      ))}
    </span>
  );
}

function TrackOverlay({
  track,
  transitioning,
  expanded,
  hovered,
}: {
  track: Language | null;
  transitioning: boolean;
  expanded: boolean;
  hovered: boolean;
}) {
  const preview = track ? TRACK_PREVIEWS[track] : null;
  // The card fades out still naming the language it was showing. Falling back
  // to a placeholder would swap the text to "Track / UserDTO" on the way out,
  // which is a second change happening exactly when the eye is following the
  // first one.
  // React's sanctioned "adjust state when a prop changes": setting state during
  // render for this component re-renders it before anything is committed, so
  // there is no extra frame and no effect in the middle.
  const [shown, setShown] = useState<Language>(TRACK_ORDER[0]);
  if (track && track !== shown) {
    setShown(track);
  }

  // The card annotates one slab, so it has to travel with it. Both separations
  // move the slabs apart, and the Request DTO pane is the outermost one — it
  // travels furthest of the four — so a step that ignored either would leave the
  // card drifting off the boundary it points at. These are measured against the
  // rendered scene, in the same units as the base step, not derived: the
  // perspective camera makes the world-to-percent relation non-linear.
  const stageStep = 15.6 + (expanded ? 3.2 : 0) + (hovered ? 4.3 : 0);
  const stageTop = preview
    ? 47.9 + (TRACK_FOCUS_LAYER_INDEX - 1.5) * stageStep
    : PREVIEW_BASE_TOP;

  return (
    <div aria-hidden="true" className="absolute inset-0 z-20 overflow-hidden">
      {/* Stage travel happens here rather than on the card's own `top`.
          A percentage `translateY` resolves against this wrapper's own height,
          and the wrapper is `inset-0` — so it resolves against the illustration
          exactly as the percentage `top` did, at the same visual positions, but
          on the compositor. Animating `top` re-laid-out and re-painted a card
          carrying a `backdrop-blur`, which meant re-sampling the blur over the
          live WebGL canvas on every frame of a hover that also happens to be
          driving a camera move. */}
      <div
        className="absolute inset-0 transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{
          transform: `translate3d(0, ${stageTop - PREVIEW_BASE_TOP}%, 0)`,
          transitionDuration: `${HERO_PREVIEW_MS}ms`,
        }}
      >
        <div
          data-testid="hero-track-preview"
          data-visible={String(preview !== null)}
          data-layer-index={preview ? TRACK_FOCUS_LAYER_INDEX : ""}
          style={{
            top: `${PREVIEW_BASE_TOP}%`,
            transitionDuration: `${HERO_PREVIEW_MS}ms`,
          }}
          className={`hero-track-preview absolute left-[3%] flex -translate-y-1/2 items-center transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            preview ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"
          } ${transitioning ? "hero-track-preview--committed" : ""}`}
        >
          <div className="w-[118px] rounded-[10px] border border-[#dbe5fe]/90 bg-white/75 px-3 py-2.5 shadow-[0_12px_36px_rgba(79,126,255,0.10)] backdrop-blur-md">
            <p className="text-[9px] leading-none font-bold tracking-[0.16em] text-[#6673b3] uppercase">
              Track
            </p>
            <span className="mt-1.5 block">
              <TrackLine
                shown={shown}
                visible={preview !== null}
                height={15}
                className="text-[15px] leading-none font-semibold tracking-[-0.02em] text-[#111421]"
                render={(entry) => TRACK_PREVIEWS[entry].label}
              />
            </span>
            <code className="mt-2 block font-mono">
              <TrackLine
                shown={shown}
                visible={preview !== null}
                height={8}
                className="whitespace-nowrap text-[8px] leading-none text-[#596176]"
                render={(entry) => TRACK_PREVIEWS[entry].snippet}
              />
            </code>
          </div>
          <span className="relative h-px w-[82px] bg-gradient-to-r from-[#8caefb] to-[#b8c8ea]">
            <span className="absolute top-1/2 right-0 size-[6px] -translate-y-1/2 rounded-full bg-[#4a6bfa] shadow-[0_0_12px_rgba(74,107,250,0.65)]" />
          </span>
        </div>
      </div>

      <div
        data-testid="hero-exercise-reveal"
        data-active={String(transitioning)}
        className={`hero-exercise-reveal absolute top-[43%] left-[34%] -translate-y-1/2 ${
          transitioning ? "hero-exercise-reveal--active" : "opacity-0"
        }`}
      >
        <p className="text-[10px] leading-none font-bold tracking-[0.18em] text-[#6673b3] uppercase">
          Exercise
        </p>
        <p className="mt-1 text-[28px] leading-none font-semibold tracking-[-0.045em] text-[#111421]">
          01
        </p>
      </div>
    </div>
  );
}

export function DtoLayerStack({
  className,
  previewTrack = null,
  selectedTrack = null,
  expanded = false,
  focusLayerIndex = null,
  readyToReveal = true,
  onSettled,
  trackOverlay = true,
  description = STACK_DESCRIPTION,
}: DtoLayerStackProps) {
  const activeTrack = selectedTrack ?? previewTrack;
  const [mode, setMode] = useState<Mode>({ kind: "pending" });
  const [sceneReady, setSceneReady] = useState(false);
  const handleReady = useCallback(() => setSceneReady(true), []);
  const handleContextLost = useCallback(() => {
    setSceneReady(false);
    setMode({ kind: "flat" });
  }, []);
  const handleSceneError = useCallback(() => {
    setSceneReady(false);
    setMode({ kind: "flat" });
  }, []);

  // The study is still the right thing to show while capabilities are read and
  // the renderer warms up, but it must leave *under* the incoming canvas rather
  // than be cut away on the same tick. It keeps rendering, unannounced and
  // fading, for as long as its exit lasts.
  // There is nothing to warm up on the flat path, so it settles the moment the
  // capability check has answered.
  const settled = mode.kind === "flat" || sceneReady;
  const revealed = sceneReady && readyToReveal;
  const loaderNeeded =
    mode.kind === "pending" || (mode.kind === "glass" && !revealed);
  const [loaderMounted, setLoaderMounted] = useState(true);

  // One-way: `pending` either warms up into a ready scene or falls to `flat`,
  // and `flat` is terminal — context loss and scene errors both land there. So
  // the study is never needed again once it has left, and this only ever has to
  // schedule its unmount.
  useEffect(() => {
    if (loaderNeeded) {
      return;
    }
    const timer = window.setTimeout(
      () => setLoaderMounted(false),
      HERO_LOADER_EXIT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [loaderNeeded]);

  // Hover-to-separate is a pointer affordance, so it is gated on there being a
  // real pointer. A touch device fires hover on tap and would leave the stack
  // held open with no way to close it.
  const [hoverable, setHoverable] = useState(false);
  const [hovered, setHovered] = useState(false);
  const handleEnter = useCallback(() => setHovered(true), []);
  const handleLeave = useCallback(() => setHovered(false), []);

  useEffect(() => {
    if (settled) {
      onSettled?.();
    }
  }, [settled, onSettled]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!supportsWebGL()) {
        setMode({ kind: "flat" });
        return;
      }
      setMode({
        kind: "glass",
        quality: pickSceneQuality(readDeviceHints()),
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setHoverable(query.matches);
    // Read after paint, not in the effect body: the first render has to agree
    // with the server, which cannot know what pointer the client has.
    const frame = requestAnimationFrame(sync);
    query.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div className={className} style={{ pointerEvents: "none" }}>
      {loaderMounted ? (
        <DtoLayerStackLoading
          exiting={!loaderNeeded}
          className="absolute inset-0 h-full w-full"
        />
      ) : null}
      {mode.kind === "flat" ? (
        <DtoLayerStackFallback
          activeTrack={activeTrack}
          focusLayerIndex={focusLayerIndex}
          expanded={expanded}
          hovered={hovered}
          description={description}
          className="absolute inset-0 h-full w-full"
        />
      ) : null}
      {mode.kind === "glass" ? (
        <SceneErrorBoundary fallback={null} onError={handleSceneError}>
          <DtoLayerStackCanvas
            className="absolute inset-0 h-full w-full"
            quality={mode.quality}
            reducedMotion={mode.reducedMotion}
            previewTrack={previewTrack}
            selectedTrack={selectedTrack}
            expanded={expanded}
            hovered={hovered}
            focusLayerIndex={focusLayerIndex}
            visible={revealed}
            description={description}
            onReady={handleReady}
            onContextLost={handleContextLost}
          />
        </SceneErrorBoundary>
      ) : null}
      {trackOverlay ? (
        <TrackOverlay
          track={selectedTrack ?? previewTrack}
          transitioning={selectedTrack !== null}
          expanded={expanded}
          hovered={hovered}
        />
      ) : null}

      {/* The only element in here that takes pointer events. The root stays
          `pointer-events: none` on purpose: at desktop widths below ~1750px
          this 722px illustration overlaps the picker's cards, and it must not
          eat their hover or their clicks. This hit area does not change that —
          it sits inside the root's own `z-0` stacking context, so the text
          column at `z-10` is painted above it and keeps winning the hit test
          wherever the two overlap.

          Hover is read from the DOM rather than from R3F's raycaster. The
          question is only "is the pointer over the illustration", which needs
          no per-frame ray against four refracting meshes — and leaving the
          canvas itself untouchable keeps `state.pointer` at rest, so nothing
          else in the scene starts reacting to the pointer as a side effect. */}
      {hoverable ? (
        <div
          data-testid="hero-hover-area"
          aria-hidden="true"
          className="absolute inset-0"
          style={{ pointerEvents: "auto" }}
          onPointerEnter={handleEnter}
          onPointerLeave={handleLeave}
        />
      ) : null}
    </div>
  );
}
