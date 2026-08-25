"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import type { SceneQuality } from "@/lib/three/quality";
import type { Language } from "@/lib/workshop/types";
import DtoLayerStackScene from "./DtoLayerStackScene";
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
        // The live material dissolves over the lightweight glass loading study
        // once the HDRI and transmission buffers are ready. 720ms was long
        // enough that the study — which used to be unmounted on the same tick —
        // left the frame nearly empty for most of the handover; the shorter
        // curve overlaps the study's own exit instead of following it.
        transition: reducedMotion
          ? undefined
          : `opacity ${HERO_REVEAL_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        willChange: reducedMotion || visible ? undefined : "opacity",
      }}
    >
      <Canvas
        // Unmapped: the illustration's colours are design tokens, and a
        // filmic curve over them would drift the accent and the backdrop.
        flat
        // No shadow maps. Clear glass under a directional light casts a flat
        // opaque rectangle, so the blocks cast nothing; the only shadow in the
        // scene is the contact pool, which renders from depth on its own.
        shadows={false}
        dpr={quality.dpr}
        frameloop="demand"
        gl={{ antialias: true, powerPreference: "high-performance" }}
        resize={{ scroll: false }}
        onCreated={({ gl }) => {
          // One shared transmission pass feeds all four blocks; this is the
          // fraction of the canvas it renders at, and it is the single most
          // expensive setting in the scene.
          gl.transmissionResolutionScale = quality.transmissionResolutionScale;
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
            focusLayerIndex={focusLayerIndex}
            revealed={visible}
            onReady={onReady}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
