import "vitest";

declare module "vitest" {
  interface Assertion<T = unknown> {
    /** From jest-axe: asserts an axe-core scan of the rendered DOM found no violations. */
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
