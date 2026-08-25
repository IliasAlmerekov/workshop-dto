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
 * It is the cheapest diagnostic in the workshop: two shows of hands tell both
 * speakers whether the next fifteen minutes should be an introduction or a
 * refresher. It is also the moment the audience does something instead of
 * watching, which is worth more here than any slide.
 */
export const ROOM_QUESTIONS = [
  "Who has heard of a DTO?",
  "Who has written a Mapper?",
] as const;

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
  { ordinal: "3", title: "Four exercises", icon: "exercises" },
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

/** What is left once the boundary has done its job. */
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

export const EXERCISES = [
  { id: "task1", n: "01", title: "Typed Request DTO" },
  { id: "task2", n: "02", title: "Request Mapper" },
  { id: "task3", n: "03", title: "External API DTO" },
  { id: "task4", n: "04", title: "Response DTO" },
] as const;
