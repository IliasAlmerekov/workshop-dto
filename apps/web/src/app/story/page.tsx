"use client";

import Link from "next/link";
import { JsonEndpointPanel } from "@/components/JsonEndpointPanel";
import { FlowDiagram } from "@/components/FlowDiagram";
import { API_BASE_URL } from "@/lib/config";
import { useMessages } from "@/lib/i18n";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function StoryPage() {
  const messages = useMessages();
  const story = messages.story;
  useDocumentTitle(messages.meta.storyTitle);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-14 px-6 py-14">
      <div>
        <Link href="/" className="text-sm text-[var(--accent)]">
          {story.back}
        </Link>
        <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
          {story.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          {story.heading}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
          {story.ledeBefore}
          <strong className="text-[var(--foreground)]">
            {story.ledeUserRegistration}
          </strong>
          {story.ledeAfter}
        </p>
      </div>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold">{story.termsHeading}</h2>
        <p className="text-[var(--muted)]">{story.termsIntro}</p>
        <dl className="grid gap-4 sm:grid-cols-2">
          {story.terms.map(({ term, definition }) => (
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
        <h2 className="text-2xl font-bold">{story.originHeading}</h2>
        <p className="text-[var(--muted)]">
          <strong className="text-[var(--foreground)]">
            {story.historically}
          </strong>
          {story.historicallyBody}
        </p>
        <p className="text-[var(--muted)]">
          <strong className="text-[var(--foreground)]">{story.today}</strong>
          {story.todayBody}
        </p>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold">{story.liveHeading}</h2>
        <p className="text-[var(--muted)]">{story.liveBody}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <JsonEndpointPanel
            title={messages.jsonPanel.entityTitle}
            description={messages.jsonPanel.entityDescription}
            path="/api/demo/users/7/entity"
            url={`${API_BASE_URL}/api/demo/users/7/entity`}
            tone="warning"
            flagFields={["passwordHash", "internalNote"]}
          />
          <JsonEndpointPanel
            title={messages.jsonPanel.dtoTitle}
            description={messages.jsonPanel.dtoDescription}
            path="/api/demo/users/7/dto"
            url={`${API_BASE_URL}/api/demo/users/7/dto`}
            tone="safe"
          />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold">{story.flowsHeading}</h2>
        <FlowDiagram
          title={story.withoutDtoTitle}
          steps={[
            { label: "User entity", tone: "warning" },
            { label: "Serializer" },
            { label: "Client" },
          ]}
          note={story.withoutDtoNote}
          noteTone="warning"
        />
        <FlowDiagram
          title={story.withDtoTitle}
          steps={[
            { label: "User entity" },
            { label: "UserResponseMapper", tone: "safe" },
            { label: "UserResponse DTO", tone: "safe" },
            { label: "Serializer" },
            { label: "Client" },
          ]}
          note={story.withDtoNote}
          noteTone="safe"
        />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold">{story.whereHeading}</h2>
        <p className="text-[var(--muted)]">{story.whereBody}</p>
        <ol className="flex flex-col gap-3">
          {messages.boundaries.map((boundary, index) => (
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
            {story.afterEyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-bold">{story.tradeoffsHeading}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-5">
            <p className="font-semibold text-[var(--accent)]">
              {story.benefitsLabel}
            </p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-[var(--foreground)]">
              {story.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-2">
                  <span aria-hidden="true">+</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <p className="font-semibold text-amber-600">
              {story.drawbacksLabel}
            </p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-[var(--foreground)]">
              {story.drawbacks.map((drawback) => (
                <li key={drawback} className="flex gap-2">
                  <span aria-hidden="true">−</span>
                  {drawback}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="font-semibold">{story.ruleHeading}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{story.ruleBody}</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-8">
        <Link
          href="/"
          className="rounded-lg bg-[var(--accent-solid)] px-5 py-3 text-sm font-semibold text-[var(--accent-foreground)]"
        >
          {story.startExercises}
        </Link>
        <Link
          href="/demo"
          className="rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-semibold"
        >
          {story.openComparison}
        </Link>
      </div>
    </main>
  );
}
