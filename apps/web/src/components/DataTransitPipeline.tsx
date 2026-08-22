"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { IsometricStack, type StackLayer } from "./IsometricStack";
import { canRender3DPipeline } from "@/lib/three/capabilities";

type DataTransitPipelineProps = {
  size?: number;
  highlight?: StackLayer;
  className?: string;
};

type SceneComponent = ComponentType<{ activeLayer: StackLayer; size: number }>;

/**
 * The "Data Transit Lab" pipeline (spec section 11). Renders the R3F/Drei
 * scene only when the browser can actually support it — WebGL present, no
 * `prefers-reduced-motion` — and falls back to the existing static
 * `IsometricStack` SVG otherwise. The 3D module (`three`, `@react-three/*`,
 * `gsap`) is only ever fetched in the capable branch: a participant who
 * can't or doesn't want motion never downloads it (spec 11's "dynamisches
 * Laden schwerer... 3D-Module").
 *
 * The capability check needs `window`, so the first render — server and
 * client alike, before hydration's effects run — always shows the 2D
 * fallback. That keeps hydration consistent and means core content (the
 * exercise itself) is never delayed waiting on this decision.
 */
export function DataTransitPipeline({
  size = 420,
  highlight = "Mapper",
  className,
}: DataTransitPipelineProps) {
  const [Scene, setScene] = useState<SceneComponent | null>(null);

  useEffect(() => {
    if (!canRender3DPipeline()) {
      return;
    }
    let cancelled = false;
    import("./three/DataPipelineScene").then((module) => {
      if (!cancelled) {
        setScene(() => module.DataPipelineScene);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Scene) {
    return (
      <IsometricStack size={size} highlight={highlight} className={className} />
    );
  }

  return <Scene activeLayer={highlight} size={size} />;
}
