import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DataTransitPipeline } from "./DataTransitPipeline";

const canRender3DPipeline = vi.fn();
vi.mock("@/lib/three/capabilities", () => ({
  canRender3DPipeline: () => canRender3DPipeline(),
}));

let sceneShouldThrow = false;
vi.mock("./three/DataPipelineScene", () => ({
  DataPipelineScene: ({ activeLayer }: { activeLayer: string }) => {
    if (sceneShouldThrow) {
      throw new Error("THREE.WebGLRenderer: Error creating WebGL context.");
    }
    return <div data-testid="3d-scene">3D scene: {activeLayer}</div>;
  },
}));

describe("DataTransitPipeline", () => {
  afterEach(() => {
    sceneShouldThrow = false;
  });

  it("renders the static 2D fallback first, even when 3D is capable (avoids a hydration mismatch)", () => {
    canRender3DPipeline.mockReturnValue(true);
    render(<DataTransitPipeline highlight="Mapper" />);

    expect(
      screen.getByRole("img", { name: /data pipeline/i }),
    ).toBeInTheDocument();
  });

  it("swaps in the 3D scene once capability is confirmed client-side", async () => {
    canRender3DPipeline.mockReturnValue(true);
    render(<DataTransitPipeline highlight="Entity" />);

    await waitFor(() =>
      expect(screen.getByTestId("3d-scene")).toBeInTheDocument(),
    );
    expect(screen.getByText("3D scene: Entity")).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: /data pipeline/i }),
    ).not.toBeInTheDocument();
  });

  it("stays on the 2D fallback forever when the browser can't render 3D", async () => {
    canRender3DPipeline.mockReturnValue(false);
    render(<DataTransitPipeline highlight="Response DTO" />);

    // Give any stray microtask a chance to resolve, then confirm the 3D
    // scene never mounts — the dynamic import is never even triggered.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByTestId("3d-scene")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /data pipeline/i }),
    ).toBeInTheDocument();
  });

  it("falls back to the 2D pipeline if the 3D scene throws while mounting (issue #13, e.g. real WebGL context creation failing after the cheap capability probe passed)", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    canRender3DPipeline.mockReturnValue(true);
    sceneShouldThrow = true;
    render(<DataTransitPipeline highlight="Entity" />);

    await waitFor(() =>
      expect(
        screen.getByRole("img", { name: /data pipeline/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("3d-scene")).not.toBeInTheDocument();
    consoleError.mockRestore();
  });
});
