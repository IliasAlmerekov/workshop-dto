export type BoundaryUseCase = {
  title: string;
  body: string;
};

/**
 * The four system boundaries the workshop's exercises each cover (spec
 * section 4.1). Shared between the /story narrative (issue #9) and the
 * completion summary (issue #10) so the framing and the wrap-up describe
 * the same four boundaries the same way, instead of two independently
 * drifting copies.
 */
export const BOUNDARY_USE_CASES: BoundaryUseCase[] = [
  {
    title: "HTTP request → application",
    body: "Exercise 1: the client sends registration data. A typed CreateUserRequest makes exactly what the application accepts explicit.",
  },
  {
    title: "Normalizing that input",
    body: "Exercise 2: raw request fields get renamed, trimmed, and converted before anything else touches them.",
  },
  {
    title: "External API → your application",
    body: "Exercise 3: a third-party identity service has its own vocabulary. A mapper isolates it so a provider change never ripples through your code.",
  },
  {
    title: "Application → HTTP response",
    body: "Exercise 4: the public response is built on purpose, not serialized straight from the entity — so internal fields can't leak by accident.",
  },
];
