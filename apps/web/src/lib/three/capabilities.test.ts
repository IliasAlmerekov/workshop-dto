import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canRender3DPipeline,
  prefersReducedMotion,
  supportsWebGL,
} from "./capabilities";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("supportsWebGL", () => {
  it("is false in jsdom, which has no real WebGL context (spec 11's no-WebGL fallback)", () => {
    expect(supportsWebGL()).toBe(false);
  });

  it("is true when the browser returns a real context for any of the three context ids", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      (id: string) => (id === "webgl2" ? ({} as WebGL2RenderingContext) : null),
    );
    expect(supportsWebGL()).toBe(true);
  });

  it("does not throw even if getContext itself throws (some browsers do for disabled WebGL)", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => {
        throw new Error("WebGL disabled by browser policy");
      },
    );
    expect(supportsWebGL()).toBe(false);
  });
});

describe("prefersReducedMotion", () => {
  it("reflects the media query result", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    expect(prefersReducedMotion()).toBe(true);
  });

  it("is false when the media query does not match", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
    } as MediaQueryList);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe("canRender3DPipeline", () => {
  it("requires both WebGL support and no reduced-motion preference", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => ({}) as WebGL2RenderingContext,
    );

    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
    } as MediaQueryList);
    expect(canRender3DPipeline()).toBe(true);

    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    expect(canRender3DPipeline()).toBe(false);
  });

  it("is false without WebGL even when reduced motion is not requested", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
    } as MediaQueryList);
    expect(canRender3DPipeline()).toBe(false);
  });
});
