import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// jsdom has no real WebGL — canRender3DPipeline()'s capability probe must
// see this as "unsupported" (matching a real no-WebGL browser) rather than
// tripping jsdom's noisy "not implemented" console.error on every test that
// renders the data pipeline.
if (typeof HTMLCanvasElement !== "undefined") {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    contextId: string,
    ...args: unknown[]
  ) {
    if (
      contextId === "webgl2" ||
      contextId === "webgl" ||
      contextId === "experimental-webgl"
    ) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- delegating to the real overload set
    return (originalGetContext as any).call(this, contextId, ...args);
  } as typeof HTMLCanvasElement.prototype.getContext;
}

// jsdom does not implement the native <dialog> modal behavior yet.
if (
  typeof HTMLDialogElement !== "undefined" &&
  !HTMLDialogElement.prototype.showModal
) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
    this.dispatchEvent(new Event("open"));
    if (!this.hasAttribute("tabindex")) {
      this.tabIndex = -1;
    }
    this.focus();
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
  Object.defineProperty(HTMLDialogElement.prototype, "open", {
    get(this: HTMLDialogElement) {
      return this.hasAttribute("open");
    },
    set(this: HTMLDialogElement, value: boolean) {
      if (value) {
        this.setAttribute("open", "");
      } else {
        this.removeAttribute("open");
      }
    },
    configurable: true,
  });
}
