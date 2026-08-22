import Link from "next/link";
import { JsonEndpointPanel } from "@/components/JsonEndpointPanel";
import { API_BASE_URL } from "@/lib/config";

export const metadata = {
  title: "Entity vs. DTO — DTO & Mapper Workshop",
};

export default function DemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-14">
      <div>
        <Link href="/" className="text-sm text-[var(--accent)]">
          ← Back
        </Link>
        <h1 className="mt-4 text-3xl font-bold">
          Entity leak vs. safe DTO response
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Both panels call the real Symfony demo API for the same user. The left
          endpoint serializes the internal entity directly; the right one goes
          through an explicit{" "}
          <code className="font-mono">UserResponseMapper</code>.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
    </main>
  );
}
