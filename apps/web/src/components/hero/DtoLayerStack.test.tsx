import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DtoLayerStack } from "./DtoLayerStack";

const state = vi.hoisted(() => ({
  supportsWebGL: true,
  reducedMotion: false,
  hoverable: true,
  sceneFails: false,
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockCanvas({
      visible,
      reducedMotion,
      previewTrack,
      selectedTrack,
      expanded,
      onReady,
      onContextLost,
    }: {
      visible: boolean;
      reducedMotion: boolean;
      previewTrack: string | null;
      selectedTrack: string | null;
      expanded: boolean;
      onReady: () => void;
      onContextLost: () => void;
    }) {
      if (state.sceneFails) {
        throw new Error("scene failed before ready");
      }

      return (
        <div
          data-testid="hero-canvas"
          data-visible={String(visible)}
          data-reduced-motion={String(reducedMotion)}
          data-preview-track={previewTrack ?? ""}
          data-selected-track={selectedTrack ?? ""}
          data-expanded={String(expanded)}
        >
          <button onClick={onReady}>ready</button>
          <button onClick={onContextLost}>lose context</button>
        </div>
      );
    },
}));

vi.mock("@/lib/three/capabilities", () => ({
  supportsWebGL: () => state.supportsWebGL,
}));

vi.mock("@/lib/three/quality", () => ({
  pickSceneQuality: () => ({ tier: "high" }),
  readDeviceHints: () => ({}),
}));

describe("DtoLayerStack", () => {
  beforeEach(() => {
    state.supportsWebGL = true;
    state.reducedMotion = false;
    state.hoverable = true;
    state.sceneFails = false;
    window.matchMedia = vi.fn(
      (query: string) =>
        ({
          matches: query.includes("hover")
            ? state.hoverable
            : state.reducedMotion,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList,
    );
  });

  it("passes the reduced-motion preference into the live scene", async () => {
    state.reducedMotion = true;
    render(<DtoLayerStack className="hero" />);

    expect(await screen.findByTestId("hero-canvas")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
  });

  it("shows a glass loading state while the live scene warms up", async () => {
    render(<DtoLayerStack className="hero" />);

    expect(
      screen.getByRole("status", { name: /preparing the 3d pipeline/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", {
        name: /the four layers the workshop works through/i,
      }),
    ).not.toBeInTheDocument();

    const canvas = await screen.findByTestId("hero-canvas");
    expect(canvas).toHaveAttribute("data-visible", "false");

    fireEvent.click(screen.getByRole("button", { name: "ready" }));
    expect(canvas).toHaveAttribute("data-visible", "true");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("uses the static vector stack when WebGL is unavailable", async () => {
    state.supportsWebGL = false;
    render(<DtoLayerStack className="hero" />);

    expect(
      await screen.findByRole("img", {
        name: /the four layers the workshop works through/i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("hero-canvas")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps the highlight on the Request DTO whichever language is previewed", async () => {
    state.supportsWebGL = false;
    const { container, rerender } = render(
      <DtoLayerStack className="hero" previewTrack="java" />,
    );

    await screen.findByRole("img", {
      name: /the four layers the workshop works through/i,
    });

    const activeIds = () =>
      Array.from(
        container.querySelectorAll('[data-layer-id][data-active="true"]'),
        (node) => node.getAttribute("data-layer-id"),
      );

    // Exactly one slab is lit, and it is the same one for every track: a
    // language does not own a pipeline stage, but every track writes the
    // Request DTO first.
    expect(activeIds()).toEqual(["request-dto"]);
    expect(screen.getByTestId("hero-track-preview")).toHaveAttribute(
      "data-layer-index",
      "0",
    );

    for (const track of ["python", "php", "typescript"] as const) {
      rerender(<DtoLayerStack className="hero" previewTrack={track} />);
      expect(activeIds(), track).toEqual(["request-dto"]);
    }
  });

  it("rests the accent on the Request DTO when nothing is previewed", async () => {
    state.supportsWebGL = false;
    const { container } = render(<DtoLayerStack className="hero" />);

    await screen.findByRole("img", {
      name: /the four layers the workshop works through/i,
    });

    // The resting accent and the one every track preview lands on are the same
    // slab, so choosing a language confirms the composition instead of moving
    // its single lit boundary somewhere else.
    expect(
      container.querySelector('[data-layer-id="request-dto"]'),
    ).toHaveAttribute("data-active", "true");
    expect(container.querySelector('[data-layer-id="mapper"]')).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  it("keeps connector lines and nodes static while the track preview changes", async () => {
    state.supportsWebGL = false;
    const { container, rerender } = render(
      <DtoLayerStack className="hero" previewTrack="java" />,
    );

    await screen.findByRole("img", {
      name: /the four layers the workshop works through/i,
    });

    const connectorTones = () =>
      Array.from(
        container.querySelectorAll('[data-connector-node="static"]'),
        (node) => node.getAttribute("data-tone"),
      );
    const connectorLines = Array.from(
      container.querySelectorAll('[data-connector-network="line"]'),
    );

    expect(connectorTones()).toEqual(["accent", "accent", "muted", "muted"]);
    expect(connectorLines).not.toHaveLength(0);

    rerender(<DtoLayerStack className="hero" previewTrack="typescript" />);

    expect(connectorTones()).toEqual(["accent", "accent", "muted", "muted"]);
    connectorLines.forEach((line) => {
      expect(line).not.toHaveAttribute("data-connector-phase");
      expect(line).not.toHaveAttribute("style");
    });
  });

  it("keeps the reference spacing at rest and adds a small separation on preview", async () => {
    state.supportsWebGL = false;
    const { container, rerender } = render(
      <DtoLayerStack className="hero" previewTrack="java" />,
    );

    await screen.findByRole("img", {
      name: /the four layers the workshop works through/i,
    });

    const requestLayer = container.querySelector(
      '[data-layer-id="request-dto"]',
    );

    expect(requestLayer).toHaveStyle({ transform: "translateY(0)" });

    rerender(<DtoLayerStack className="hero" previewTrack="java" expanded />);
    expect(requestLayer).toHaveStyle({ transform: "translateY(-36px)" });
  });

  it("separates the stack further while the pointer is over the illustration", async () => {
    state.supportsWebGL = false;
    const { container } = render(
      <DtoLayerStack className="hero" previewTrack="java" />,
    );

    await screen.findByRole("img", {
      name: /the four layers the workshop works through/i,
    });

    const requestLayer = container.querySelector(
      '[data-layer-id="request-dto"]',
    );
    expect(requestLayer).toHaveStyle({ transform: "translateY(0)" });

    // Hover alone opens the stack; the outermost layer sits 1.5 units of
    // separation from the centre.
    fireEvent.pointerEnter(screen.getByTestId("hero-hover-area"));
    expect(requestLayer).toHaveStyle({ transform: "translateY(-48px)" });

    fireEvent.pointerLeave(screen.getByTestId("hero-hover-area"));
    expect(requestLayer).toHaveStyle({ transform: "translateY(0)" });
  });

  it("adds the hover separation on top of the picker's, rather than replacing it", async () => {
    state.supportsWebGL = false;
    const { container } = render(
      <DtoLayerStack className="hero" previewTrack="java" expanded />,
    );

    await screen.findByRole("img", {
      name: /the four layers the workshop works through/i,
    });

    const requestLayer = container.querySelector(
      '[data-layer-id="request-dto"]',
    );
    expect(requestLayer).toHaveStyle({ transform: "translateY(-36px)" });

    fireEvent.pointerEnter(screen.getByTestId("hero-hover-area"));
    expect(requestLayer).toHaveStyle({ transform: "translateY(-84px)" });
  });

  it("offers no hover affordance when the pointer is coarse", async () => {
    state.supportsWebGL = false;
    state.hoverable = false;
    render(<DtoLayerStack className="hero" />);

    await screen.findByRole("img", {
      name: /the four layers the workshop works through/i,
    });

    expect(screen.queryByTestId("hero-hover-area")).not.toBeInTheDocument();
  });

  it("re-presses the two DTO inscriptions into the committed track's syntax", async () => {
    state.supportsWebGL = false;
    const { container, rerender } = render(
      <DtoLayerStack className="hero" previewTrack="php" />,
    );
    await screen.findByRole("img", { name: /the four layers/i });

    const inscription = (layerId: string, kind: "role" | "declaration") =>
      container.querySelector(
        `[data-layer-id="${layerId}"] [data-layer-label="${kind}"]`,
      );

    // A hover preview is a question, not an answer: nothing is renamed yet.
    expect(inscription("request-dto", "declaration")).toBeNull();
    expect(inscription("request-dto", "role")).toHaveTextContent("Request DTO");

    rerender(
      <DtoLayerStack className="hero" previewTrack="php" selectedTrack="php" />,
    );

    expect(inscription("request-dto", "declaration")).toHaveTextContent(
      "final class UserRequest",
    );
    expect(inscription("response-dto", "declaration")).toHaveTextContent(
      "final class UserResponse",
    );
    // The boundaries a language does not decide keep their role names.
    expect(inscription("mapper", "declaration")).toBeNull();
    expect(inscription("entity", "declaration")).toBeNull();
    expect(inscription("mapper", "role")).toHaveTextContent("Mapper");
  });

  it("recovers to the static vector stack after WebGL context loss", async () => {
    render(<DtoLayerStack className="hero" />);

    await screen.findByTestId("hero-canvas");
    fireEvent.click(screen.getByRole("button", { name: "lose context" }));

    await waitFor(() => {
      expect(
        screen.getByRole("img", {
          name: /the four layers the workshop works through/i,
        }),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("hero-canvas")).not.toBeInTheDocument();
    });
  });

  it("falls back to the static stack when the scene fails before it is ready", async () => {
    state.sceneFails = true;
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<DtoLayerStack className="hero" />);

    expect(
      await screen.findByRole("img", {
        name: /the four layers the workshop works through/i,
      }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    warning.mockRestore();
  });
});
