export type FlowStep = {
  label: string;
  tone?: "default" | "warning" | "safe";
};

const BOX_TONE: Record<NonNullable<FlowStep["tone"]>, string> = {
  default:
    "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]",
  warning:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  safe: "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]",
};

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-[var(--muted)]"
    >
      <path
        d="M4 12h15M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type FlowDiagramProps = {
  title: string;
  steps: FlowStep[];
  /** A short callout shown under the flow, e.g. flagging an unwanted coupling. */
  note?: string;
  noteTone?: "warning" | "safe";
};

/**
 * A static, purely CSS/SVG flow diagram — boxes and arrows, no motion or
 * WebGL (spec section 11's accessibility requirement applies to every
 * diagram in the workshop, not just the later 3D visualization). The whole
 * figure also gets one plain-text aria-label so screen readers get the flow
 * as a sentence, not a sequence of disconnected box readings.
 */
export function FlowDiagram({
  title,
  steps,
  note,
  noteTone = "warning",
}: FlowDiagramProps) {
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-xs font-semibold tracking-[0.1em] text-[var(--muted)] uppercase">
        {title}
      </figcaption>
      <div
        role="img"
        aria-label={`${title}: ${steps.map((step) => step.label).join(" → ")}`}
        className="flex flex-wrap items-center gap-2"
      >
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-2">
            <span
              className={`rounded-lg border px-3 py-2 text-sm font-medium whitespace-nowrap ${BOX_TONE[step.tone ?? "default"]}`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && <ArrowIcon />}
          </div>
        ))}
      </div>
      {note && (
        <p
          className={`text-xs font-medium ${
            noteTone === "safe" ? "text-[var(--accent)]" : "text-amber-600"
          }`}
        >
          {noteTone === "warning" ? "⚠ " : "✓ "}
          {note}
        </p>
      )}
    </figure>
  );
}
