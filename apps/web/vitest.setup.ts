import "@testing-library/jest-dom/vitest";
import { afterEach, expect } from "vitest";
import { cleanup, configure } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";

// jest-axe ships this matcher typed for Jest's own MatcherState, not
// vitest's — the runtime shape (a function returning {pass, message}) is
// identical, so this cast is a type-only bridge, not a behavior change.
expect.extend(
  toHaveNoViolations as unknown as Record<
    string,
    (received: unknown) => { pass: boolean; message: () => string }
  >,
);

// See `testTimeout` in vitest.config.ts: findBy* here waits on a dynamic
// adapter import, not on a render.
configure({ asyncUtilTimeout: 5_000 });

afterEach(() => {
  cleanup();
});

/**
 * Node 25 exposes a process-level `localStorage` binding that can shadow
 * jsdom's realm-local Storage. Merely checking for `.clear()` is insufficient:
 * the Node implementation has the API but is shared by concurrently running
 * Vitest files, so one journey can observe another journey's completed tasks.
 * Give every jsdom worker its own deterministic in-memory stores.
 */
if (typeof window !== "undefined") {
  const createStorage = (): Storage => {
    const entries = new Map<string, string>();
    return {
      get length() {
        return entries.size;
      },
      key: (index: number) => [...entries.keys()][index] ?? null,
      getItem: (key: string) => entries.get(String(key)) ?? null,
      setItem: (key: string, value: string) => {
        entries.set(String(key), String(value));
      },
      removeItem: (key: string) => {
        entries.delete(String(key));
      },
      clear: () => {
        entries.clear();
      },
    } satisfies Storage;
  };

  for (const name of ["localStorage", "sessionStorage"] as const) {
    Object.defineProperty(window, name, {
      value: createStorage(),
      configurable: true,
      writable: false,
    });
    Object.defineProperty(globalThis, name, {
      value: window[name],
      configurable: true,
      writable: false,
    });
  }
}

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

/**
 * Radix's popover measures its trigger to position itself, and jsdom ships
 * neither `ResizeObserver` nor `Element.prototype.scrollIntoView`. Both are
 * pure layout concerns with no bearing on what these tests assert, so a
 * no-op stands in rather than a layout engine.
 */
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  globalThis.ResizeObserver = window.ResizeObserver;
}

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

/**
 * Radix's select uses the Pointer Capture API to keep tracking the pointer
 * once a press leaves the trigger. jsdom implements none of it, and the
 * missing methods throw during the very first click.
 */
if (typeof Element !== "undefined" && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

if (typeof window !== "undefined" && !window.DOMRect) {
  window.DOMRect = class {
    constructor(
      public x = 0,
      public y = 0,
      public width = 0,
      public height = 0,
    ) {}
    top = 0;
    left = 0;
    right = 0;
    bottom = 0;
    toJSON() {
      return this;
    }
    static fromRect(rect?: DOMRectInit) {
      return new window.DOMRect(rect?.x, rect?.y, rect?.width, rect?.height);
    }
  } as unknown as typeof DOMRect;
}
