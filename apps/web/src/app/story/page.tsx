import Link from "next/link";
import { JsonEndpointPanel } from "@/components/JsonEndpointPanel";
import { FlowDiagram } from "@/components/FlowDiagram";
import { API_BASE_URL } from "@/lib/config";
import { BOUNDARY_USE_CASES } from "@/lib/workshop/boundaries";

export const metadata = {
  title: "The DTO & Mapper story — DTO & Mapper Workshop",
};

const TERMS = [
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
];

const BENEFITS = [
  "A stable, deliberately defined API contract.",
  "No accidental exposure of internal or sensitive fields.",
  "Clear types and earlier error detection.",
  "Controlled renaming and formatting, in one visible place.",
  "The entity and the API can evolve independently.",
  "Transformations are easy to find and easy to test.",
  "A third-party provider stays behind your own boundary.",
];

const DRAWBACKS = [
  "Extra classes or records to define and maintain.",
  "More mapping code, and more tests for that code.",
  "Field lists can end up duplicated between entity and DTO.",
  "A field rename now means updating more than one place.",
  "For a small, short-lived app, the ceremony can outweigh the benefit.",
  "A generic or automatic mapper can hide a transformation that actually mattered.",
];

export default function StoryPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-14 px-6 py-14">
      <div>
        <Link href="/" className="text-sm text-[var(--accent)]">
          ← Back
        </Link>
        <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
          Before you start
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          Why DTOs and Mappers exist
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
          Every exercise in this workshop belongs to one story:{" "}
          <strong className="text-[var(--foreground)]">
            user registration
          </strong>
          . A client sends registration data. The application normalizes it,
          checks it against an external identity service, and returns a safe
          public response. The internal <code className="font-mono">User</code>{" "}
          entity along the way carries more than that public response should
          ever show.
        </p>
      </div>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold">Four terms, precisely</h2>
        <p className="text-[var(--muted)]">
          These get used loosely in the wild. Here they mean exactly this:
        </p>
        <dl className="grid gap-4 sm:grid-cols-2">
          {TERMS.map(({ term, definition }) => (
            <div
              key={term}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <dt className="font-semibold">{term}</dt>
              <dd className="mt-1.5 text-sm text-[var(--muted)]">
                {definition}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold">Where this comes from</h2>
        <p className="text-[var(--muted)]">
          <strong className="text-[var(--foreground)]">Historically</strong>,
          transfer objects mattered most for remote calls: instead of many
          small, chatty round trips, a distributed system sends one deliberate
          packet of data.
        </p>
        <p className="text-[var(--muted)]">
          <strong className="text-[var(--foreground)]">Today</strong>, in
          ordinary web applications, the bigger win is different: a DTO protects
          your API contract and makes every transformation visible in one place,
          instead of implicit conversions scattered across the codebase. Mappers
          exist for the same reason — two data models get glued together on
          purpose, not by accident.
        </p>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold">See it live</h2>
        <p className="text-[var(--muted)]">
          Both panels below call the real Symfony demo API for the same user.
          Nothing here is invented — this is what actually happens when an
          entity is serialized directly, next to what a mapper produces instead.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <JsonEndpointPanel
            title="Entity endpoint"
            description="Serializes the internal entity as-is."
            path="/api/demo/users/7/entity"
            url={`${API_BASE_URL}/api/demo/users/7/entity`}
            tone="warning"
            flagFields={["passwordHash", "internalNote"]}
          />
          <JsonEndpointPanel
            title="DTO endpoint"
            description="Mapped through UserResponseMapper — only what the client needs."
            path="/api/demo/users/7/dto"
            url={`${API_BASE_URL}/api/demo/users/7/dto`}
            tone="safe"
          />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">Two data flows</h2>
        <FlowDiagram
          title="Without a DTO"
          steps={[
            { label: "User entity", tone: "warning" },
            { label: "Serializer" },
            { label: "Client" },
          ]}
          note="The client is unintentionally coupled to the entity — a field renamed inside the entity breaks the public contract too."
          noteTone="warning"
        />
        <FlowDiagram
          title="With a DTO and mapper"
          steps={[
            { label: "User entity" },
            { label: "UserResponseMapper", tone: "safe" },
            { label: "UserResponse DTO", tone: "safe" },
            { label: "Serializer" },
            { label: "Client" },
          ]}
          note="The mapper is the only place that knows about both shapes. The entity is free to change behind it."
          noteTone="safe"
        />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold">
          Where this shows up in the workshop
        </h2>
        <p className="text-[var(--muted)]">
          Every exercise ahead is one of these boundaries:
        </p>
        <ol className="flex flex-col gap-3">
          {BOUNDARY_USE_CASES.map((boundary, index) => (
            <li
              key={boundary.title}
              className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold">{boundary.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {boundary.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-6 border-t border-[var(--border)] pt-10">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
            After the exercises
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            Benefits, drawbacks, and when to skip this
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-5">
            <p className="font-semibold text-[var(--accent)]">Benefits</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-[var(--foreground)]">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex gap-2">
                  <span aria-hidden="true">+</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <p className="font-semibold text-amber-600">Drawbacks</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-[var(--foreground)]">
              {DRAWBACKS.map((drawback) => (
                <li key={drawback} className="flex gap-2">
                  <span aria-hidden="true">−</span>
                  {drawback}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="font-semibold">The decision rule</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            This workshop does not teach &ldquo;always use a DTO.&rdquo; Use one
            where a real boundary exists and something valuable crosses it: a
            public API, a third-party contract, a client you don&rsquo;t
            control, or a security-sensitive field that must never leak. Skip
            the ceremony for small, short-lived, single-process code where the
            entity and its consumer already share the same trust boundary —
            there, a mapper is just extra code with nothing to protect.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-8">
        <Link
          href="/"
          className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-foreground)]"
        >
          Start the exercises
        </Link>
        <Link
          href="/demo"
          className="rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-semibold"
        >
          Open the entity vs. DTO comparison on its own
        </Link>
      </div>
    </main>
  );
}
