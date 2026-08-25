/**
 * Every word the audience reads, in one file.
 *
 * Two audiences constrain this copy at once. The participants are junior
 * developers whose English may be weak, and the speakers are not native
 * speakers either — so a sentence that is hard to read is also hard to say over.
 * The rule applied throughout: short clauses, common words, and the technical
 * terms (`DTO`, `Mapper`, `Entity`, `boundary`) always spelled on screen rather
 * than only spoken, because an unfamiliar word heard blind is worse than the
 * same word read.
 *
 * Data is never invented here. The JSON, the field names and the raw form
 * values are the real ones — see `apps/api/src/Controller/DemoUserController.php`
 * and `docs/SPECIFICATION.md` §5.1 and §6.2.
 */

export const TALK = {
  wordmarkLead: "WORKSHOP",
  wordmarkSub: "DTO&Mapping",
  speakers: "KAMAL SHEKHO · ILIAS ALMEREKOV",
  where: "26 August 2026 · Hamburg",
} as const;

/**
 * The room is asked this before anything is explained.
 *
 * One sentence, in the middle of the slide, and nothing else on it. It is the
 * cheapest diagnostic in the workshop — a show of hands tells both speakers
 * whether the next fifteen minutes are an introduction or a refresher — and it
 * is the moment the audience does something instead of settling in to watch.
 */
export const ROOM_QUESTION =
  "Who knows what a DTO or a Mapper is?";

export type AgendaItem = {
  ordinal: string;
  title: string;
  /** Which glyph stands for it. Resolved in `slides.tsx`. */
  icon: "dto" | "mapper" | "exercises" | "questions" | "surprise";
};

/**
 * The promise made in minute two — topics only.
 *
 * No presenter names and no sub-points: an agenda is a map, and a map that
 * lists every street is not a map. Who speaks is obvious the moment they start
 * speaking, and the sub-points are the slides themselves.
 */
export const AGENDA: AgendaItem[] = [
  { ordinal: "1", title: "What is a DTO", icon: "dto" },
  { ordinal: "2", title: "What is a Mapper", icon: "mapper" },
  { ordinal: "3", title: "Six exercises", icon: "exercises" },
  { ordinal: "4", title: "Three questions", icon: "questions" },
  { ordinal: "5", title: "A surprise", icon: "surprise" },
];

/** The two section markers that ride along in the corner from slide 3 to 10. */
export const PARTS = {
  dto: "PART 1 — DTO",
  mapper: "PART 2 — MAPPER",
} as const;

export type EntityField = {
  /** Stable identity for the morph. Survivors keep it into the chip row. */
  id: string;
  key: string;
  value: string;
  /** Never allowed past the boundary. */
  secret?: boolean;
  /** Folded into `displayName` on the way out. */
  folds?: boolean;
};

/**
 * The literal body of `GET /api/demo/users/7/entity`. Nine fields, three of
 * which have no business leaving the server. `birthDate` and `createdAt` are
 * `DATE_ATOM` because the controller formats them that way — the unstable date
 * format is the point, not a typo.
 */
export const ENTITY_FIELDS: EntityField[] = [
  { id: "id", key: "id", value: "7" },
  { id: "userName", key: "userName", value: '"ada.lovelace"' },
  { id: "firstName", key: "firstName", value: '"Ada"', folds: true },
  { id: "lastName", key: "lastName", value: '"Lovelace"', folds: true },
  { id: "birthDate", key: "birthDate", value: '"1815-12-10T00:00:00+00:00"' },
  { id: "email", key: "email", value: '"ada@example.test"' },
  {
    id: "passwordHash",
    key: "passwordHash",
    value: '"$argon2id$v=19$m=65536,t=4,p=1$..."',
    secret: true,
  },
  {
    id: "internalNote",
    key: "internalNote",
    value: '"VIP migration candidate"',
    secret: true,
  },
  {
    id: "createdAt",
    key: "createdAt",
    value: '"2024-01-01T00:00:00+00:00"',
    secret: true,
  },
];

/**
 * `RegistrationResponse` — what is left once the boundary has done its job.
 *
 * These five fields are not chosen here: they are task 5's `fields` list in
 * `apps/web/src/lib/exercises/task5.ts`, so the contract the room sees on the
 * wall is the contract they are about to write.
 */
export const RESPONSE_FIELDS = [
  { id: "id", key: "id", value: "7" },
  { id: "userName", key: "userName", value: '"ada.lovelace"' },
  { id: "displayName", key: "displayName", value: '"Ada Lovelace"' },
  { id: "birthDate", key: "birthDate", value: '"1815-12-10"' },
  { id: "email", key: "email", value: '"ada@example.test"' },
] as const;

/** The six jobs, and where each one ends up when no Mapper owns it. */
export const MAPPER_JOBS = [
  { id: "rename", label: "rename", home: "Controller" },
  { id: "trim", label: "trim", home: "Controller" },
  { id: "lowercase", label: "lowercase", home: "Service" },
  { id: "to-date", label: "to date", home: "Service" },
  { id: "join", label: "join", home: "Template" },
  { id: "drop", label: "drop", home: "Repository" },
] as const;

/** Real raw form values from the workshop's task 2. */
export const TRANSFORMS = [
  { id: "userName", from: '"  Ada.Lovelace "', to: '"ada.lovelace"' },
  { id: "email", from: '"  ADA@EXAMPLE.TEST "', to: '"ada@example.test"' },
  { id: "birthDate", from: '"1815-12-10"', to: "Date(1815-12-10)" },
] as const;

/**
 * The Registration Migration pipeline — six steps, three boundaries.
 *
 * Titles, order and `kind` come from `apps/web/src/lib/exercises/task[1-6].ts`,
 * not from this file. The pairing is the lesson: every boundary is a DTO
 * *defined first* and a Mapper written against it, which is why the deck draws
 * them as pairs rather than as a list of six.
 */
export const EXERCISES = [
  {
    id: "request-dto",
    n: "01",
    title: "Typed Request DTO",
    contract: "CreateUserRequest",
    kind: "dto",
    boundary: "inbound",
  },
  {
    id: "request-mapper",
    n: "02",
    title: "Request Mapper",
    contract: "legacyProfile →",
    kind: "mapper",
    boundary: "inbound",
  },
  {
    id: "welcome-email-dto",
    n: "03",
    title: "Welcome Email DTO",
    contract: "WelcomeEmail",
    kind: "dto",
    boundary: "notification",
  },
  {
    id: "welcome-email-mapper",
    n: "04",
    title: "Welcome Email Mapper",
    contract: "User →",
    kind: "mapper",
    boundary: "notification",
  },
  {
    id: "registration-response-dto",
    n: "05",
    title: "Registration Response DTO",
    contract: "RegistrationResponse",
    kind: "dto",
    boundary: "public",
  },
  {
    id: "registration-response-mapper",
    n: "06",
    title: "Registration Response Mapper",
    contract: "User →",
    kind: "mapper",
    boundary: "public",
  },
] as const;

/**
 * The situation the six exercises live in, from the spec in issue #23.
 *
 * The room needs this before it needs a task list: without it, "define
 * `WelcomeEmail`" is a syntax puzzle, and with it, it is one step of replacing
 * a registration system. Nothing here is a side effect — no email is sent, no
 * record is written.
 */
export const STORY = {
  headline: "Your task: replace an old registration system.",
  steps: [
    "A legacyProfile arrives from the old Registration API.",
    "We create an account in the new system.",
    "We prepare a welcome email.",
    "We return a safe result for the Registration Complete screen.",
  ],
  caveat: "Nothing is sent. Nothing is saved. You write the contracts.",
} as const;

/**
 * The three boundaries the pipeline crosses, and who is on the far side of
 * each. This is the architecture slide's data.
 */
export const BOUNDARIES = [
  {
    id: "inbound",
    label: "Inbound",
    from: "Legacy Registration API",
    contract: "CreateUserRequest",
    to: "Registration Service",
    note: "someone else's field names",
  },
  {
    id: "notification",
    label: "Notification",
    from: "User",
    contract: "WelcomeEmail",
    to: "Mail",
    note: "only what the email needs",
  },
  {
    id: "public",
    label: "Public API",
    from: "User",
    contract: "RegistrationResponse",
    to: "Client",
    note: "never the private fields",
  },
] as const;

/** The real legacy payload from task 2 — untidy on purpose. */
export const LEGACY_PROFILE = {
  user_name: "  Ada.Lovelace ",
  first_name: " Ada ",
  last_name: " Lovelace ",
  birth_date: "1815-12-10",
  email: " ADA@EXAMPLE.TEST ",
} as const;
