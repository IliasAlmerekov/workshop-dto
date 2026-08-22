import { KnowledgeCheck } from "./KnowledgeCheck";
import { EntityDtoComparisonPanel } from "./EntityDtoComparisonPanel";
import { FlowDiagram } from "./FlowDiagram";
import { BOUNDARY_USE_CASES } from "@/lib/workshop/boundaries";

const REPO_URL = "https://github.com/IliasAlmerekov/workshop-dto";

const MODEL_SOLUTION_LINKS = [
  {
    label: "User entity",
    href: `${REPO_URL}/blob/main/apps/api/src/Entity/User.php`,
  },
  {
    label: "UserResponse DTO",
    href: `${REPO_URL}/blob/main/apps/api/src/Dto/UserResponse.php`,
  },
  {
    label: "UserResponseMapper",
    href: `${REPO_URL}/blob/main/apps/api/src/Mapper/UserResponseMapper.php`,
  },
];

/**
 * Shown once all four exercises are complete (spec section 7.5) — reached
 * only through firstIncompleteTaskId returning null, so these links and the
 * live comparison never render while a task is still unfinished.
 */
export function CompletionScreen() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-8 py-16">
      <div className="text-center">
        <p className="text-4xl font-bold">All four exercises complete 🎉</p>
        <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
          You defined typed DTOs, wrote explicit mappers, isolated a foreign API
          contract, and produced a safe public response.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Quick knowledge check</h2>
        <KnowledgeCheck />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Before and after, one more time</h2>
        <EntityDtoComparisonPanel />
        <FlowDiagram
          title="The safe data flow you just built"
          steps={[
            { label: "User entity" },
            { label: "UserResponseMapper", tone: "safe" },
            { label: "UserResponse DTO", tone: "safe" },
            { label: "Serializer" },
            { label: "Client" },
          ]}
          note="The mapper is the only place that knows about both shapes."
          noteTone="safe"
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">What each exercise protected</h2>
        <ol className="flex flex-col gap-2">
          {BOUNDARY_USE_CASES.map((boundary, index) => (
            <li
              key={boundary.title}
              className="flex gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
            >
              <span className="shrink-0 font-semibold text-[var(--accent)]">
                {index + 1}.
              </span>
              <span>
                <strong>{boundary.title}</strong> — {boundary.body}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-8">
        <h2 className="text-sm font-semibold tracking-[0.1em] text-[var(--muted)] uppercase">
          Repository and model solutions
        </h2>
        <div className="flex flex-wrap gap-3">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"
          >
            View the repository
          </a>
          {MODEL_SOLUTION_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
