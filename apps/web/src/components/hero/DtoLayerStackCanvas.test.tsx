import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SceneQuality } from "@/lib/three/quality";
import DtoLayerStackCanvas from "./DtoLayerStackCanvas";

const captured = vi.hoisted(() => ({ frameloop: "" }));

vi.mock("@react-three/fiber", () => ({
  Canvas: ({
    children,
    frameloop,
  }: {
    children: React.ReactNode;
    frameloop: string;
  }) => {
    captured.frameloop = frameloop;
    return <div data-testid="r3f-canvas">{children}</div>;
  },
}));

vi.mock("./DtoLayerStackScene", () => ({
  default: () => null,
}));

const quality: SceneQuality = {
  tier: "high",
  dpr: [1, 1.5],
  transmissionResolutionScale: 1,
  environmentResolution: 512,
};

describe("DtoLayerStackCanvas", () => {
  beforeEach(() => {
    captured.frameloop = "";
  });

  it("uses demand rendering from mount instead of resetting the R3F clock later", () => {
    render(
      <DtoLayerStackCanvas
        quality={quality}
        reducedMotion={false}
        previewTrack={null}
        selectedTrack={null}
        expanded={false}
        hovered={false}
        focusLayerIndex={null}
        visible
        description="DTO layer stack"
        onReady={vi.fn()}
        onContextLost={vi.fn()}
      />,
    );

    expect(screen.getByTestId("r3f-canvas")).toBeInTheDocument();
    expect(captured.frameloop).toBe("demand");
  });
});
