import type { Language, TaskId } from "@/lib/workshop/types";

/**
 * The workshop's source strings.
 *
 * Every participant-facing string lives here; `de.ts` is typed as `Messages`,
 * so a missing or renamed German entry is a compile error rather than an
 * English word surfacing mid-sentence in a German session.
 *
 * **Code is not translated.** Field names, starter code, model solutions and
 * the identifiers a participant types stay as they are in every locale — they
 * are the subject matter, not prose about it. The same goes for the four
 * boundary labels the illustration renders (`Request DTO`, `Mapper`, …),
 * which name the pattern rather than describe it.
 */

export type TaskCopy = {
  title: string;
  shortTitle: string;
  question: string;
  description: string;
  fields: string[];
  explanation: string;
};

export type HintCopy = {
  concept: string;
  fields: string;
  syntax: string;
};

export type ConstructCopy = {
  /** The declaration is there and correct. */
  ok: string;
  /** Nothing recognisable was found. */
  missing: string;
  /**
   * Found, but not immutable — only PHP's `final` and Python's
   * `frozen=True` have this middle state; the other tracks get it for free
   * from `record`/`readonly`.
   */
  notImmutable?: string;
};

export type QuizOptionCopy = { text: string; feedback: string };

export type Messages = {
  locale: {
    label: string;
    /** Announced by the segmented control that switches the interface language. */
    groupLabel: string;
  };
  meta: {
    title: string;
    description: string;
    storyTitle: string;
    demoTitle: string;
  };
  landing: {
    eyebrow: [string, string, string];
    workshop: string;
    lede: string;
    pickerHeading: string;
  };
  header: {
    workshopTag: string;
    programmingLanguage: string;
    selectLanguage: string;
    switchTitle: string;
    switchDescription: (language: string, task: string) => string;
    switchConfirm: string;
    switchCancel: string;
    resetLabel: string;
    resetTitle: string;
    resetDescription: string;
    resetConfirm: string;
    toDarkTheme: string;
    toLightTheme: string;
  };
  common: {
    cancel: string;
    back: string;
    loading: string;
  };
  stepper: {
    label: string;
    locked: string;
  };
  exercise: {
    loading: string;
    eyebrow: (order: string) => string;
    yourTask: string;
    completeWith: (fileName: string) => string;
    checkSolution: string;
    /** The Check solution button while its staged run is playing. */
    checking: string;
    showHint: string;
    insertSolution: string;
    continue: string;
    editorLabel: (title: string) => string;
    expandEditor: string;
    collapseEditor: string;
    hintsTitle: string;
    hintStep: (shown: number, total: number) => string;
    previousHint: string;
    followingHint: string;
    nextHint: string;
    closeHints: string;
    hintKind: { concept: string; fields: string; syntax: string };
  };
  /** The pre-validator exercise card, kept as a fallback for a task without an adapter. */
  previewCard: {
    hintsLater: string;
    accepted: string;
    prompt: string;
  };
  result: {
    eyebrow: string;
    idle: string;
    correct: string;
    failed: (failed: number, total: number) => string;
    disclaimer: string;
    /** Header of the validation panel and its pass counter pill. */
    outputTitle: string;
    testsPassed: (passed: number, total: number) => string;
    passedHeadline: string;
    passedSubline: string;
    failedHeadline: string;
    failedSubline: string;
    checkPassed: string;
    checkFailed: string;
    outputSectionTitle: string;
    nextStepTitle: string;
    nextStepLead: (task: string) => string;
    nextStepReady: string;
    lastStepLead: string;
    guidanceTitle: string;
    whatToFix: string;
    needNudge: string;
    /** The staged stage list shown while a check runs. */
    run: {
      title: string;
      progress: (done: number, total: number) => string;
      announcement: string;
      steps: {
        parse: (fileName: string) => string;
        structure: string;
        rules: (count: number) => string;
        report: string;
      };
    };
  };
  health: {
    waking: string;
  };
  jsonPanel: {
    loading: string;
    waking: (attempt: number, max: number) => string;
    error: (attempts: number, message: string) => string;
    retry: string;
    leaked: (fields: string) => string;
    entityTitle: string;
    entityDescription: string;
    dtoTitle: string;
    dtoDescription: string;
  };
  comparison: {
    heading: string;
    body: string;
  };
  completion: {
    heading: string;
    body: string;
    quizHeading: string;
    beforeAfterHeading: string;
    flowTitle: string;
    flowNote: string;
    protectedHeading: string;
    repositoryHeading: string;
    viewRepository: string;
  };
  quiz: {
    questions: {
      prompt: string;
      options: QuizOptionCopy[];
    }[];
  };
  boundaries: { title: string; body: string }[];
  story: {
    back: string;
    eyebrow: string;
    heading: string;
    ledeBefore: string;
    ledeUserRegistration: string;
    ledeAfter: string;
    termsHeading: string;
    termsIntro: string;
    terms: { term: string; definition: string }[];
    originHeading: string;
    historically: string;
    historicallyBody: string;
    today: string;
    todayBody: string;
    liveHeading: string;
    liveBody: string;
    flowsHeading: string;
    withoutDtoTitle: string;
    withoutDtoNote: string;
    withDtoTitle: string;
    withDtoNote: string;
    whereHeading: string;
    whereBody: string;
    afterEyebrow: string;
    tradeoffsHeading: string;
    benefitsLabel: string;
    benefits: string[];
    drawbacksLabel: string;
    drawbacks: string[];
    ruleHeading: string;
    ruleBody: string;
    startExercises: string;
    openComparison: string;
  };
  demo: {
    heading: string;
    body: string;
  };
  tasks: Record<TaskId, TaskCopy>;
  hints: Record<TaskId, Record<Language, HintCopy>>;
  /** The one structural check each language adapter runs before the field checks. */
  construct: Record<TaskId, Record<Language, ConstructCopy>>;
  checks: {
    fieldMissingRequest: (field: string) => string;
    fieldWrongType: (field: string, expected: string, found: string) => string;
    fieldDeclared: (field: string) => string;
    kindString: string;
    kindDate: string;
    immutableUnknown: string;
    immutableMissing: (fields: string) => string;
    immutableAll: string;
    missingFromResult: (field: string) => string;
    missingFromResponse: (field: string) => string;
    readsFrom: (field: string, source: string) => string;
    shouldReadFrom: (field: string, source: string) => string;
    trims: (field: string) => string;
    shouldTrim: (field: string) => string;
    lowercased: (field: string) => string;
    shouldLowercase: (field: string) => string;
    isDate: (field: string) => string;
    shouldBeDate: (field: string) => string;
    isInteger: (field: string) => string;
    shouldBeInteger: (field: string) => string;
    comparesVerified: (field: string) => string;
    shouldCompareVerified: (field: string) => string;
    isTimestamp: (field: string) => string;
    shouldBeTimestamp: (field: string) => string;
    carriedOver: (field: string) => string;
    shouldCarryOver: (field: string) => string;
    includes: (field: string, source: string) => string;
    shouldInclude: (field: string, source: string) => string;
    readsFromUser: (field: string, source: string) => string;
    shouldReadFromUser: (field: string, source: string) => string;
    formatted: (field: string) => string;
    shouldFormat: (field: string) => string;
    leaks: (field: string) => string;
    notExposed: (field: string) => string;
  };
};

const CONCEPT_HINTS: Record<TaskId, string> = {
  "request-dto":
    "A request DTO makes the input contract explicit and prevents it from being changed after creation.",
  "request-mapper":
    "The mapper is the one place that translates a foreign shape (snake_case, stray whitespace) into your application's own typed contract.",
  "external-api":
    "The Identity Service's response is a foreign contract with its own field names and representations — the mapper is the one place that isolates it.",
  "response-dto":
    "The public response contains only what a client needs — building it explicitly means passwordHash and internalNote can never leak by accident.",
};

export const en: Messages = {
  locale: {
    label: "Interface language",
    groupLabel: "Interface language",
  },
  meta: {
    title: "DTO & Mapper Workshop",
    description: "Browser-based DTO and mapper workshop for junior developers.",
    storyTitle: "The DTO & Mapper story — DTO & Mapper Workshop",
    demoTitle: "Entity vs. DTO — DTO & Mapper Workshop",
  },
  landing: {
    eyebrow: ["Practice", "Understand", "Apply"],
    workshop: "Workshop",
    lede: "A guided, interactive workshop to master DTOs and Mappers with real-world examples.",
    pickerHeading: "Choose your programming language",
  },
  header: {
    workshopTag: "Workshop",
    programmingLanguage: "Programming language",
    selectLanguage: "Select language",
    switchTitle: "Switch language?",
    switchDescription: (language, task) =>
      `Switching to ${language} will clear your current draft for "${task}". Completed tasks stay completed.`,
    switchConfirm: "Switch and clear draft",
    switchCancel: "Keep current draft",
    resetLabel: "Reset workshop",
    resetTitle: "Reset the whole workshop?",
    resetDescription:
      "This clears your language selection and all task progress on this device. This cannot be undone.",
    resetConfirm: "Reset everything",
    toDarkTheme: "Switch to dark theme",
    toLightTheme: "Switch to light theme",
  },
  common: {
    cancel: "Cancel",
    back: "← Back",
    loading: "Loading…",
  },
  stepper: {
    label: "Exercise progress",
    locked: "locked",
  },
  exercise: {
    loading: "Loading exercise…",
    eyebrow: (order) => `Exercise ${order}`,
    yourTask: "Your task",
    completeWith: () => "with the following:",
    checkSolution: "Check solution",
    checking: "Checking…",
    showHint: "Show hint",
    insertSolution: "Insert solution",
    continue: "Continue",
    editorLabel: (title) => `Your solution for ${title}`,
    expandEditor: "Expand editor",
    collapseEditor: "Collapse editor",
    hintsTitle: "Hints",
    hintStep: (shown, total) => `Hint ${shown} of ${total}`,
    previousHint: "Previous hint",
    followingHint: "Next unlocked hint",
    nextHint: "Next hint",
    closeHints: "Close hints",
    hintKind: { concept: "Concept", fields: "Fields", syntax: "Syntax" },
  },
  previewCard: {
    hintsLater:
      "Progressive hints for this exercise unlock once task validation ships in a future update.",
    accepted:
      "Preview build: any draft is accepted. Continue to the next exercise.",
    prompt:
      "Check solution to preview the flow — real validation ships in a future update.",
  },
  result: {
    eyebrow: "Result",
    idle: "// run Check solution to see the result here",
    correct: "Correct — all checks pass",
    failed: (failed, total) => `${failed} of ${total} checks failed`,
    disclaimer:
      "Your code is never executed. The checks read its structure, and the result is the sample payload through a correct mapper.",
    outputTitle: "Validation output",
    testsPassed: (passed, total) => `${passed} / ${total} checks passed`,
    passedHeadline: "All checks passed",
    passedSubline: "Great job! Your solution meets all requirements.",
    failedHeadline: "Validation failed",
    failedSubline:
      "Your code did not pass all required checks. Fix the issues below and try again.",
    checkPassed: "Passed",
    checkFailed: "Failed",
    outputSectionTitle: "Output",
    nextStepTitle: "Next step",
    nextStepLead: (task) => `You can continue to ${task}`,
    nextStepReady: "Ready",
    lastStepLead: "You can finish the workshop",
    guidanceTitle: "Details & guidance",
    whatToFix: "What to fix",
    needNudge: "Need a nudge? Use Show hint under the editor.",
    run: {
      title: "Running checks",
      progress: (done, total) => `${done} / ${total}`,
      announcement: "Running checks…",
      steps: {
        parse: (fileName) => `Parsing ${fileName}`,
        structure: "Reading the syntax tree",
        rules: (count) =>
          count === 1
            ? "Applying 1 business rule"
            : `Applying ${count} business rules`,
        report: "Collecting the report",
      },
    },
  },
  health: {
    waking: "Waking up the demo API… exercises work without it.",
  },
  jsonPanel: {
    loading: "Loading…",
    waking: (attempt, max) =>
      `Waking up the demo API… retry ${attempt} of ${max}`,
    error: (attempts, message) =>
      `Still unreachable after ${attempts} attempts: ${message}`,
    retry: "Retry",
    leaked: (fields) => `Leaked: ${fields}`,
    entityTitle: "Entity endpoint",
    entityDescription: "Serializes the internal entity as-is.",
    dtoTitle: "DTO endpoint",
    dtoDescription:
      "Mapped through UserResponseMapper — only what the client needs.",
  },
  comparison: {
    heading: "See it live against the real Symfony API",
    body: "Both panels call the real demo API for the same user. The left endpoint serializes the internal entity directly; the right one goes through the real UserResponseMapper your solution mirrors.",
  },
  completion: {
    heading: "All four exercises complete 🎉",
    body: "You defined typed DTOs, wrote explicit mappers, isolated a foreign API contract, and produced a safe public response.",
    quizHeading: "Quick knowledge check",
    beforeAfterHeading: "Before and after, one more time",
    flowTitle: "The safe data flow you just built",
    flowNote: "The mapper is the only place that knows about both shapes.",
    protectedHeading: "What each exercise protected",
    repositoryHeading: "Repository and model solutions",
    viewRepository: "View the repository",
  },
  quiz: {
    questions: [
      {
        prompt:
          "Why is it risky to serialize the internal User entity directly in an API response?",
        options: [
          {
            text: "It's slower than mapping to a DTO.",
            feedback:
              "Performance isn't the core issue — the entity converts to JSON just as fast as a DTO would.",
          },
          {
            text: "It couples the public API contract to internal fields, and can leak sensitive data like a password hash.",
            feedback:
              "Exactly — the entity endpoint in this workshop leaks passwordHash and internalNote for precisely this reason.",
          },
          {
            text: "Entities can't be serialized to JSON at all.",
            feedback:
              "They can — that's exactly what the leaking entity endpoint in this workshop does.",
          },
          {
            text: "It requires writing more code than a DTO would.",
            feedback:
              "It's actually less code — which is exactly what makes skipping the DTO tempting, and risky.",
          },
        ],
      },
      {
        prompt: "What does a mapper's map() method own?",
        options: [
          {
            text: "Persisting the mapped object to a database.",
            feedback:
              "That's a different concern — and part of why this workshop's mapper is deliberately not the same thing as the database Data Mapper pattern.",
          },
          {
            text: "Explicit translation between two data shapes: renaming, normalizing, converting, and choosing what to include or drop.",
            feedback:
              "Right — that's exactly what every mapper across all four exercises did.",
          },
          {
            text: "Deciding whether the incoming request is authorized.",
            feedback:
              "Authorization belongs to a different layer — a mapper trusts that's already been checked.",
          },
          {
            text: "Validating that required fields are present.",
            feedback:
              "Close, but validation is a separate concern — a mapper transforms data it already trusts is well-formed.",
          },
        ],
      },
      {
        prompt: "When is a DTO probably not worth the extra code?",
        options: [
          {
            text: "When the data crosses into a public, external API.",
            feedback:
              "That's exactly where a DTO earns its keep — a public contract needs the protection.",
          },
          {
            text: "When a field is security-sensitive, like a password hash.",
            feedback:
              "That's the opposite — a security-sensitive field is the strongest reason to map explicitly.",
          },
          {
            text: "In small, short-lived, single-process code where the producer and consumer already share full trust.",
            feedback:
              "Right — without a real boundary, the mapper is just extra ceremony with nothing to protect.",
          },
          {
            text: "Whenever the entity has more than five fields.",
            feedback:
              "Field count isn't the deciding factor — whether a real boundary exists is.",
          },
        ],
      },
    ],
  },
  boundaries: [
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
  ],
  story: {
    back: "← Back",
    eyebrow: "Before you start",
    heading: "Why DTOs and Mappers exist",
    ledeBefore: "Every exercise in this workshop belongs to one story: ",
    ledeUserRegistration: "user registration",
    ledeAfter:
      ". A client sends registration data. The application normalizes it, checks it against an external identity service, and returns a safe public response. The internal User entity along the way carries more than that public response should ever show.",
    termsHeading: "Four terms, precisely",
    termsIntro:
      "These get used loosely in the wild. Here they mean exactly this:",
    terms: [
      {
        term: "Entity",
        definition:
          "The internal model your application actually works with. It carries everything the application needs — including fields no client should ever see, like a password hash or an internal note.",
      },
      {
        term: "DTO (Data Transfer Object)",
        definition:
          "A small object that carries deliberately chosen data across a boundary. It has no business logic. In this workshop, DTOs are immutable and explicitly typed.",
      },
      {
        term: "Object Mapper / Assembler",
        definition:
          "A class that explicitly translates between two data models — renaming fields, normalizing values, converting types, combining or dropping fields. The UserResponseMapper you'll write in Exercise 4 is one of these.",
      },
      {
        term: "Data Mapper (a different pattern)",
        definition:
          'Not the same thing. "Data Mapper" is also the name of a persistence-layer pattern that moves data between objects and a database. This workshop never uses that meaning — every "mapper" here is the Object Mapper/Assembler kind above.',
      },
    ],
    originHeading: "Where this comes from",
    historically: "Historically",
    historicallyBody:
      ", transfer objects mattered most for remote calls: instead of many small, chatty round trips, a distributed system sends one deliberate packet of data.",
    today: "Today",
    todayBody:
      ", in ordinary web applications, the bigger win is different: a DTO protects your API contract and makes every transformation visible in one place, instead of implicit conversions scattered across the codebase. Mappers exist for the same reason — two data models get glued together on purpose, not by accident.",
    liveHeading: "See it live",
    liveBody:
      "Both panels below call the real Symfony demo API for the same user. Nothing here is invented — this is what actually happens when an entity is serialized directly, next to what a mapper produces instead.",
    flowsHeading: "Two data flows",
    withoutDtoTitle: "Without a DTO",
    withoutDtoNote:
      "The client is unintentionally coupled to the entity — a field renamed inside the entity breaks the public contract too.",
    withDtoTitle: "With a DTO and mapper",
    withDtoNote:
      "The mapper is the only place that knows about both shapes. The entity is free to change behind it.",
    whereHeading: "Where this shows up in the workshop",
    whereBody: "Every exercise ahead is one of these boundaries:",
    afterEyebrow: "After the exercises",
    tradeoffsHeading: "Benefits, drawbacks, and when to skip this",
    benefitsLabel: "Benefits",
    benefits: [
      "A stable, deliberately defined API contract.",
      "No accidental exposure of internal or sensitive fields.",
      "Clear types and earlier error detection.",
      "Controlled renaming and formatting, in one visible place.",
      "The entity and the API can evolve independently.",
      "Transformations are easy to find and easy to test.",
      "A third-party provider stays behind your own boundary.",
    ],
    drawbacksLabel: "Drawbacks",
    drawbacks: [
      "Extra classes or records to define and maintain.",
      "More mapping code, and more tests for that code.",
      "Field lists can end up duplicated between entity and DTO.",
      "A field rename now means updating more than one place.",
      "For a small, short-lived app, the ceremony can outweigh the benefit.",
      "A generic or automatic mapper can hide a transformation that actually mattered.",
    ],
    ruleHeading: "The decision rule",
    ruleBody:
      "This workshop does not teach “always use a DTO.” Use one where a real boundary exists and something valuable crosses it: a public API, a third-party contract, a client you don’t control, or a security-sensitive field that must never leak. Skip the ceremony for small, short-lived, single-process code where the entity and its consumer already share the same trust boundary — there, a mapper is just extra code with nothing to protect.",
    startExercises: "Start the exercises",
    openComparison: "Open the entity vs. DTO comparison on its own",
  },
  demo: {
    heading: "Entity leak vs. safe DTO response",
    body: "Both panels call the real Symfony demo API for the same user. The left endpoint serializes the internal entity directly; the right one goes through an explicit UserResponseMapper.",
  },
  tasks: {
    "request-dto": {
      title: "Typed Request DTO",
      shortTitle: "Request DTO",
      question: "How do we define a clear and typed input contract?",
      description:
        "We start by modeling the input contract for creating a user. Complete an immutable CreateUserRequest that captures all required fields with strong types.",
      fields: [
        "userName: string",
        "firstName: string",
        "lastName: string",
        "birthDate: date",
        "email: string",
      ],
      explanation:
        "CreateUserRequest is a DTO, not the domain entity: it exists only to make the data crossing this boundary explicit and typed. Marking every field immutable means nothing downstream can silently mutate the request after it was created.",
    },
    "request-mapper": {
      title: "Request Mapper",
      shortTitle: "Request Mapper",
      question: "Where do renaming, normalization, and type conversion belong?",
      description:
        "Raw request data arrives with snake_case keys, stray whitespace, and mixed casing. Map it onto the typed CreateUserRequest from step one.",
      fields: [
        "user_name → userName",
        "trim whitespace",
        "lowercase userName & email",
        "birth_date → typed date",
      ],
      explanation:
        "The mapper concentrates boundary logic in one visible, testable place. Renaming, trimming, and case normalization all happen here — once — instead of being repeated (or forgotten) everywhere the request is used.",
    },
    "external-api": {
      title: "External API DTO and Mapper",
      shortTitle: "External API",
      question:
        "How do we protect our application from a foreign API contract?",
      description:
        "The external identity service returns its own vocabulary. Map its response onto a dedicated result type owned by our application.",
      fields: [
        "subject_id → userId: number",
        "verification_state → verified: boolean",
        "checked_at → checkedAt: timestamp",
      ],
      explanation:
        "Isolating the third-party vocabulary at the integration boundary means a provider change to field names, casing, or representation only touches this one mapper — the rest of the application keeps working against its own stable contract.",
    },
    "response-dto": {
      title: "Response DTO and Entity Mapper",
      shortTitle: "Response DTO",
      question: "How do we produce a safe, stable public response?",
      description:
        "The internal User entity carries more than the public contract should expose. Map it onto a response that is safe to serialize.",
      fields: [
        "id, userName, email kept as is",
        "firstName + lastName → displayName",
        "birthDate formatted YYYY-MM-DD",
        "passwordHash & internalNote omitted",
      ],
      explanation:
        "The public contract contains only what the client actually needs. Building it explicitly — rather than serializing the entity directly — means passwordHash and internalNote can never leak by accident, even as the entity grows new fields over time.",
    },
  },
  hints: {
    "request-dto": {
      php: {
        concept: CONCEPT_HINTS["request-dto"],
        fields:
          "You need userName, firstName, lastName, birthDate, and email — all typed and all readonly.",
        syntax:
          "Use PHP's constructor property promotion — each parameter becomes a public readonly property.",
      },
      typescript: {
        concept: CONCEPT_HINTS["request-dto"],
        fields:
          "You need userName, firstName, lastName, birthDate, and email — all typed and all readonly.",
        syntax:
          "In TypeScript, mark each property readonly inside an object type.",
      },
      python: {
        concept: CONCEPT_HINTS["request-dto"],
        fields:
          "You need userName, firstName, lastName, birthDate, and email — all typed.",
        syntax:
          "In a frozen dataclass, every declared attribute is immutable — just annotate the type.",
      },
      java: {
        concept: CONCEPT_HINTS["request-dto"],
        fields:
          "You need userName, firstName, lastName, birthDate, and email — all typed.",
        syntax:
          "A record's components are implicitly immutable — just list them, comma-separated.",
      },
    },
    "request-mapper": {
      php: {
        concept: CONCEPT_HINTS["request-mapper"],
        fields:
          "Read each $raw['...'] field, trim it, and for userName/email also lowercase it. Convert birth_date into a real DateTimeImmutable.",
        syntax:
          "Use PHP's named arguments and wrap trim() with strtolower() where needed.",
      },
      typescript: {
        concept: CONCEPT_HINTS["request-mapper"],
        fields:
          "Read each raw.* field, trim it, and for userName/email also lowercase it. Convert birth_date into a real Date.",
        syntax: "Chain the transformations directly on the raw field access.",
      },
      python: {
        concept: CONCEPT_HINTS["request-mapper"],
        fields:
          'Read each raw["..."] field, strip it, and for userName/email also lowercase it. Convert birth_date into a real date.',
        syntax: "Chain .strip() and .lower() directly on the raw field access.",
      },
      java: {
        concept: CONCEPT_HINTS["request-mapper"],
        fields:
          'Read each raw.get("...") field, trim it, and for userName/email also lowercase it. Convert birth_date into a real LocalDate — arguments are positional, in the same order as the record.',
        syntax: "Chain .trim() and .toLowerCase() directly on the map lookup.",
      },
    },
    "external-api": {
      php: {
        concept: CONCEPT_HINTS["external-api"],
        fields:
          "Convert $raw['subject_id'] to an int, compare $raw['verification_state'] against 'VERIFIED' to get a bool, and convert $raw['checked_at'] into a real DateTimeImmutable.",
        syntax:
          "Use intval() for the number, a strict comparison for the boolean, and new DateTimeImmutable(...) for the timestamp.",
      },
      typescript: {
        concept: CONCEPT_HINTS["external-api"],
        fields:
          'Convert raw.subject_id to a number, compare raw.verification_state against "VERIFIED" to get a boolean, and convert raw.checked_at into a real Date.',
        syntax:
          "Use parseInt for the number, a strict equality comparison for the boolean, and the Date constructor for the timestamp.",
      },
      python: {
        concept: CONCEPT_HINTS["external-api"],
        fields:
          'Convert raw["subject_id"] to an int, compare raw["verification_state"] against "VERIFIED" to get a bool, and convert raw["checked_at"] into a real datetime.',
        syntax:
          "Use int() for the number, an equality comparison for the boolean, and datetime.fromisoformat(...) for the timestamp.",
      },
      java: {
        concept: CONCEPT_HINTS["external-api"],
        fields:
          'Convert raw.get("subject_id") to an int, compare raw.get("verification_state") against "VERIFIED" to get a boolean, and convert raw.get("checked_at") into a real Instant — arguments are positional, in the same order as the record.',
        syntax:
          "Use Integer.parseInt for the number, .equals(...) for the boolean, and Instant.parse for the timestamp.",
      },
    },
    "response-dto": {
      php: {
        concept: CONCEPT_HINTS["response-dto"],
        fields:
          "Carry over $user->userName and $user->email as-is, combine $user->firstName and $user->lastName into displayName, and format $user->birthDate as YYYY-MM-DD.",
        syntax:
          "Use string interpolation for displayName and ->format('Y-m-d') for the date.",
      },
      typescript: {
        concept: CONCEPT_HINTS["response-dto"],
        fields:
          "Carry over userName and email as-is, combine user.firstName and user.lastName into displayName, and format user.birthDate as YYYY-MM-DD.",
        syntax:
          "Use a template literal for displayName and toISOString().slice(0, 10) for the date format.",
      },
      python: {
        concept: CONCEPT_HINTS["response-dto"],
        fields:
          "Carry over user.userName and user.email as-is, combine user.firstName and user.lastName into displayName, and format user.birthDate as YYYY-MM-DD.",
        syntax:
          "Use an f-string for displayName and .strftime(...) for the date.",
      },
      java: {
        concept: CONCEPT_HINTS["response-dto"],
        fields:
          "Carry over user.userName() and user.email() as-is, combine user.firstName() and user.lastName() into displayName, and format user.birthDate() as YYYY-MM-DD — arguments are positional, in the same order as the record.",
        syntax:
          "Concatenate strings for displayName and use .format(DateTimeFormatter.ISO_LOCAL_DATE) for the date.",
      },
    },
  },
  construct: {
    "request-dto": {
      php: {
        ok: "CreateUserRequest is declared as a final class.",
        missing: "No CreateUserRequest class was found.",
        notImmutable: 'CreateUserRequest should be a "final" class.',
      },
      typescript: {
        ok: "CreateUserRequest is declared.",
        missing: "No CreateUserRequest type or class was found.",
      },
      python: {
        ok: "CreateUserRequest is a frozen dataclass.",
        missing: "No CreateUserRequest class was found.",
        notImmutable:
          "CreateUserRequest should be decorated with @dataclass(frozen=True).",
      },
      java: {
        ok: "CreateUserRequest is declared as a record.",
        missing: "No CreateUserRequest record was found.",
      },
    },
    "request-mapper": {
      php: {
        ok: "map() returns a new CreateUserRequest with named arguments.",
        missing:
          "map() should return new CreateUserRequest(...) using named arguments.",
      },
      typescript: {
        ok: "mapCreateUserRequest returns an object.",
        missing: "mapCreateUserRequest should return an object literal.",
      },
      python: {
        ok: "map() returns CreateUserRequest with keyword arguments.",
        missing:
          "map() should return CreateUserRequest(...) using keyword arguments.",
      },
      java: {
        ok: "map() returns a new CreateUserRequest.",
        missing:
          "map() should return new CreateUserRequest(...) with all five arguments, in order.",
      },
    },
    "external-api": {
      php: {
        ok: "map() returns a new IdentityCheckResult with named arguments.",
        missing:
          "map() should return new IdentityCheckResult(...) using named arguments.",
      },
      typescript: {
        ok: "mapIdentityCheck returns an object.",
        missing: "mapIdentityCheck should return an object literal.",
      },
      python: {
        ok: "map() returns IdentityCheckResult with keyword arguments.",
        missing:
          "map() should return IdentityCheckResult(...) using keyword arguments.",
      },
      java: {
        ok: "map() returns a new IdentityCheckResult.",
        missing:
          "map() should return new IdentityCheckResult(...) with all three arguments, in order.",
      },
    },
    "response-dto": {
      php: {
        ok: "map() returns a new UserResponse with named arguments.",
        missing:
          "map() should return new UserResponse(...) using named arguments.",
      },
      typescript: {
        ok: "mapUserResponse returns an object.",
        missing: "mapUserResponse should return an object literal.",
      },
      python: {
        ok: "map() returns UserResponse with keyword arguments.",
        missing:
          "map() should return UserResponse(...) using keyword arguments.",
      },
      java: {
        ok: "map() returns a new UserResponse.",
        missing:
          "map() should return new UserResponse(...) with all five arguments, in order.",
      },
    },
  },
  checks: {
    fieldMissingRequest: (field) => `${field} is missing from the request.`,
    fieldWrongType: (field, expected, found) =>
      `${field} should be ${expected}, not "${found}".`,
    fieldDeclared: (field) => `${field} is declared correctly.`,
    kindString: "a string",
    kindDate: "a date type",
    immutableUnknown:
      "No fields were found yet, so immutability can't be checked.",
    immutableMissing: (fields) => `${fields} must be immutable.`,
    immutableAll: "All fields are immutable.",
    missingFromResult: (field) => `${field} is missing from the mapped result.`,
    missingFromResponse: (field) =>
      `${field} is missing from the mapped response.`,
    readsFrom: (field, source) => `${field} reads from "${source}".`,
    shouldReadFrom: (field, source) => `${field} should read from "${source}".`,
    trims: (field) => `${field} trims whitespace.`,
    shouldTrim: (field) => `${field} still has untrimmed whitespace.`,
    lowercased: (field) => `${field} is lowercased.`,
    shouldLowercase: (field) => `${field} should be lowercased.`,
    isDate: (field) => `${field} is converted to a date type.`,
    shouldBeDate: (field) => `${field} is still text instead of a date type.`,
    isInteger: (field) => `${field} is converted to an integer.`,
    shouldBeInteger: (field) => `${field} is still text instead of an integer.`,
    comparesVerified: (field) => `${field} compares against "VERIFIED".`,
    shouldCompareVerified: (field) =>
      `${field} should compare verification_state against "VERIFIED".`,
    isTimestamp: (field) => `${field} is converted to a timestamp type.`,
    shouldBeTimestamp: (field) =>
      `${field} is still text instead of a timestamp.`,
    carriedOver: (field) => `${field} is carried over from the user.`,
    shouldCarryOver: (field) =>
      `${field} should be carried over from the user.`,
    includes: (field, source) => `${field} includes ${source}.`,
    shouldInclude: (field, source) => `${field} should include ${source}.`,
    readsFromUser: (field, source) =>
      `${field} reads from the user's ${source}.`,
    shouldReadFromUser: (field, source) =>
      `${field} should read from the user's ${source}.`,
    formatted: (field) => `${field} is formatted as YYYY-MM-DD.`,
    shouldFormat: (field) => `${field} is not yet formatted as YYYY-MM-DD.`,
    leaks: (field) => `${field} must not appear in the response.`,
    notExposed: (field) => `${field} is not exposed.`,
  },
};
