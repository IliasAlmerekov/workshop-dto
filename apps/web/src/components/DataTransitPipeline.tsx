"use client";

import { Component, useEffect, useState } from "react";
import type { ComponentType, ErrorInfo, ReactNode } from "react";
import { IsometricStack, type StackLayer } from "./IsometricStack";
import { canRender3DPipeline } from "@/lib/three/capabilities";

type DataTransitPipelineProps = {
  size?: number;
  highlight?: StackLayer;
  className?: string;
};

type SceneComponent = ComponentType<{ activeLayer: StackLayer; size: number }>;

type SceneErrorBoundaryProps = { fallback: ReactNode; children: ReactNode };
type SceneErrorBoundaryState = { failed: boolean };

/**
 * `supportsWebGL()`'s cheap detection canvas can succeed while the real
 * `@react-three/fiber` canvas still fails to create its WebGL context (GPU
 * resource exhaustion, a context-attribute combination the driver rejects,
 * context loss) — verified live: forcing `getContext` to fail after the
 * capability check passes throws "THREE.WebGLRenderer: Error creating WebGL
 * context" with no existing safety net (issue #13). This boundary is that
 * net, so a mid-session failure degrades to the 2D fallback instead of
 * taking down the pipeline (or the page).
 */
class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(
      "Data Transit Lab 3D scene failed, falling back to 2D:",
      error,
      info,
    );
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

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

  const fallback = (
    <IsometricStack size={size} highlight={highlight} className={className} />
  );

  if (!Scene) {
    return fallback;
  }

  return (
    <SceneErrorBoundary fallback={fallback}>
      <Scene activeLayer={highlight} size={size} />
    </SceneErrorBoundary>
  );
}
