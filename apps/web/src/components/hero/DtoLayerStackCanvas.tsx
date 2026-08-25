"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { NeutralToneMapping } from "three";
import type { SceneQuality } from "@/lib/three/quality";
import type { Language } from "@/lib/workshop/types";
import DtoLayerStackScene from "./DtoLayerStackScene";
import type { AnchorRectRef } from "./DtoLayerStackScene";
import type { HeroPointerRef } from "./SnowField";
import { HERO_REVEAL_MS } from "./heroMotion";

type DtoLayerStackCanvasProps = {
  className?: string;
  quality: SceneQuality;
  visible: boolean;
  description: string;
  reducedMotion: boolean;
  previewTrack: Language | null;
  selectedTrack: Language | null;
  expanded: boolean;
  hovered: boolean;
  pointer: HeroPointerRef;
  anchorRect: AnchorRectRef;
  focusLayerIndex: number | null;
  onReady: () => void;
  onContextLost: () => void;
};

/** The entire heavy R3F branch lives behind one dynamic import. */
export default function DtoLayerStackCanvas({
  className,
  quality,
  visible,
  description,
  reducedMotion,
  previewTrack,
  selectedTrack,
  expanded,
  hovered,
  pointer,
  anchorRect,
  focusLayerIndex,
  onReady,
  onContextLost,
}: DtoLayerStackCanvasProps) {
  return (
    <div
      className={className}
      role={visible ? "img" : undefined}
      aria-label={visible ? description : undefined}
      style={{
        opacity: visible ? 1 : 0,
        // The live material dissolves over the lightweight loading study once
        // the HDRI and the field's shader are ready. The curve is short enough
        // to overlap the study's own exit rather than follow it, so the frame
        // never dips to empty in the middle of the handover.
        transition: reducedMotion
          ? undefined
          : `opacity ${HERO_REVEAL_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        willChange: reducedMotion || visible ? undefined : "opacity",
      }}
    >
      <Canvas
        // Percentage-closer soft shadows, because the scene now has a sun in
        // it and a sun eight degrees above the horizon is the whole reason the
        // stack reads as three-dimensional. Soft rather than hard filtering:
        // the real sun is half a degree wide and its shadow edge softens with
        // distance from the caster, and a shadow this long spends most of its
        // length far enough away that a hard edge would be visibly a texture.
        // Whether the map is actually allocated is the light's decision, per
        // quality tier — the stack's *contact* with the ground is still real
        // displaced geometry, not a dark ellipse under a floating box.
        shadows="soft"
        dpr={quality.dpr}
        frameloop="demand"
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          // The canvas keeps its own alpha and paints no background, so the
          // snow field's rim dissolves into the page's `bg/canvas` instead of
          // meeting a seam where the scene's backdrop and the page's differ by
          // a value or two.
          alpha: true,
          // Neutral rather than none. An HDRI-lit snow scene spends most of its
          // range in the top stop: with no curve at all every surface facing
          // the sky clips to the same flat white and the material stops
          // describing its own shape. A filmic curve would fix that and drift
          // the design tokens with it; the neutral curve rolls off the
          // highlights and leaves everything below them where it was.
          toneMapping: NeutralToneMapping,
          toneMappingExposure: 1.24,
        }}
        resize={{ scroll: false }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            "webglcontextlost",
            (event) => {
              event.preventDefault();
              onContextLost();
            },
            { once: true },
          );
        }}
      >
        <Suspense fallback={null}>
          <DtoLayerStackScene
            quality={quality}
            reducedMotion={reducedMotion}
            previewTrack={previewTrack}
            selectedTrack={selectedTrack}
            expanded={expanded}
            hovered={hovered}
            pointer={pointer}
            anchorRect={anchorRect}
            focusLayerIndex={focusLayerIndex}
            revealed={visible}
            onReady={onReady}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
