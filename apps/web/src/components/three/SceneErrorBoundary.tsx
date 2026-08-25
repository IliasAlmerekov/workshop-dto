"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback: ReactNode;
  onError?: () => void;
};

/**
 * A failed 3D scene must degrade to the 2D illustration, never to a blank
 * column or a crashed page. Driver bugs, an HDRI that will not decode and
 * out-of-memory shader compiles all surface as a throw during render, which
 * only an error boundary can catch — and error boundaries have to be classes.
 */
export class SceneErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Not user-facing: the fallback already tells the visual story. Logged so
    // a participant reporting "the picture is flat" can be diagnosed.
    console.warn("3D scene failed, falling back to the 2D illustration", error);
    this.props.onError?.();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
