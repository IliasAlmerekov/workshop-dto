"use client";

import Link from "next/link";
import { JsonEndpointPanel } from "@/components/JsonEndpointPanel";
import { API_BASE_URL } from "@/lib/config";
import { useMessages } from "@/lib/i18n";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function DemoPage() {
  const messages = useMessages();
  useDocumentTitle(messages.meta.demoTitle);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-14">
      <div>
        <Link href="/" className="text-sm text-[var(--accent)]">
          {messages.common.back}
        </Link>
        <h1 className="mt-4 text-3xl font-bold">{messages.demo.heading}</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          {messages.demo.body}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
    </main>
  );
}
