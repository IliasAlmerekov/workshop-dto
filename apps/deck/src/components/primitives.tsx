import { motion, type Transition } from "framer-motion";
import {
  type CSSProperties,
  type ReactNode,
} from "react";

/**
 * The deck's shared parts.
 *
 * Two rules run through all of them. Every value comes from `theme.css` by
 * variable, never by literal — a hex code typed here would be a fourth copy of
 * a set DESIGN.md says has exactly three. And anything that has to survive a
 * slide change carries a `layoutId`: that identity, not a transition name, is
 * what makes the morph a morph. An element with no `layoutId` is one the
 * audience is allowed to see appear.
 */

/**
 * The site's own commitment curve, at the site's own commitment duration.
 *
 * A small, low-bounce spring lets a connected object keep its momentum when the
 * presenter advances quickly, without turning a teaching diagram into a toy.
 * The visual duration stays long enough for a room to follow a shared element.
 */
export const MORPH: Transition = {
  type: "spring",
  visualDuration: 0.82,
  bounce: 0.1,
};

/** Content arrives quickly, then settles — it should never make the speaker wait. */
export const FADE: Transition = {
  duration: 0.58,
  ease: [0.23, 1, 0.32, 1],
};

/**
 * A block of ordinary content rises into focus with a trace of depth. The
 * distance is deliberately small: visual hierarchy comes from the stagger,
 * not from objects flying across the projector.
 *
 * `i` is its place in the reading order, and the stagger is generous on
 * purpose: a slide whose four blocks land within 200ms of each other reads as
 * one flash, and there is nothing for the eye to follow.
 */
export function Rise({
  i = 0,
  children,
  className,
  style,
}: {
  i?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const enterTransform = "translate3d(0, 18px, 0) scale(0.985)";
  const exitTransform = "translate3d(0, -10px, 0) scale(0.992)";
  return (
    <motion.div
      initial={{ opacity: 0, transform: enterTransform, filter: "blur(3px)" }}
      animate={{ opacity: 1, transform: "none", filter: "blur(0px)" }}
      exit={{ opacity: 0, transform: exitTransform, filter: "blur(2px)" }}
      transition={{ ...FADE, delay: Math.min(i, 7) * 0.07 }}
      className={className}
      style={{ willChange: "transform, opacity, filter", ...style }}
    >
      {children}
    </motion.div>
  );
}

/**
 * The icon badge from DESIGN.md: a `radius/2xl` square of `bg/accent-subtle`
 * holding one accent glyph. The app uses it at 72px with a 32px glyph; the deck
 * keeps that ratio and lets the caller pick the rung.
 */
export function IconBadge({
  children,
  size = 72,
  tone = "accent",
}: {
  children: ReactNode;
  size?: number;
  tone?: "accent" | "danger" | "quiet";
}) {
  const palette = {
    accent: {
      background: "var(--color-bg-accent-subtle)",
      color: "var(--color-text-accent)",
    },
    danger: {
      background: "var(--color-status-danger-subtle)",
      color: "var(--color-status-danger)",
    },
    quiet: {
      background: "var(--color-bg-accent-subtle)",
      color: "var(--color-text-accent)",
    },
  }[tone];

  return (
    <span
      className="inline-flex flex-none items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: "var(--radius-2xl)",
        ...palette,
      }}
    >
      {children}
    </span>
  );
}

/**
 * `WORKSHOP DTO&Mapping`, the one element present on every slide.
 *
 * On the welcome slide it is the full-size wordmark in the middle of a white
 * plane; everywhere after, it is a small mark in the top-left corner. It is the
 * same node throughout — which is why the first slide change reads as the title
 * getting out of the way rather than as one screen replacing another.
 */
export function Wordmark({
  corner,
  typed,
}: {
  corner: boolean;
  /** Type `WORKSHOP` in rather than fading it, as the landing page does. */
  typed?: boolean;
}) {
  return (
    <motion.div
      layoutId="wordmark"
      transition={MORPH}
      className={
        corner
          ? "absolute top-[34px] left-[44px] z-30 flex items-baseline gap-[10px]"
          : "flex flex-col items-center gap-[6px]"
      }
    >
      <span
        style={{
          fontSize: corner
            ? "var(--text-heading-brand)"
            : "var(--text-display-hero)",
          lineHeight: corner
            ? "var(--leading-heading-brand)"
            : "var(--leading-display-hero)",
          letterSpacing: corner
            ? "var(--tracking-heading-brand)"
            : "var(--tracking-display-hero)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        {typed && !corner ? <TypedWord word="WORKSHOP" /> : "WORKSHOP"}
      </span>
      <span
        style={{
          fontSize: corner
            ? "var(--text-heading-brand)"
            : "var(--text-display-sub)",
          lineHeight: corner
            ? "var(--leading-heading-brand)"
            : "var(--leading-display-sub)",
          letterSpacing: corner
            ? "var(--tracking-heading-brand)"
            : "var(--tracking-display-sub)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        DTO<span style={{ color: "var(--color-text-accent)" }}>&</span>Mapping
      </span>
    </motion.div>
  );
}

/**
 * `WORKSHOP` typed one character at a time, exactly as the site types it.
 *
 * Not a decorative flourish: the audience has just been told to open the
 * workshop URL, and the first thing they will see there is this. Opening the
 * talk with the same gesture makes the deck and the app one thing.
 */
export function TypedWord({
  word,
  charStep = 62,
  caret = true,
}: {
  word: string;
  charStep?: number;
  caret?: boolean;
}) {
  return (
    <span className="flex items-stretch">
      {word.split("").map((character, index) => (
        <span
          key={`${character}-${index}`}
          className="deck-char"
          style={{ animationDelay: `${index * charStep}ms` }}
        >
          {character}
        </span>
      ))}
      {caret ? (
        <span
          className="deck-caret"
          style={{ animationDelay: `${word.length * charStep + 260}ms` }}
        />
      ) : null}
    </span>
  );
}

/**
 * The section marker. Lifted out of the agenda list and parked in the corner,
 * where it stays for the whole of its part — so the agenda's promise is
 * visibly still being kept four slides later.
 */
export function SectionLabel({ text, id }: { text: string; id: string }) {
  return (
    <motion.div
      layoutId={`part-${id}`}
      transition={MORPH}
      className="absolute top-[40px] right-[48px] z-30"
      style={{
        fontSize: "var(--text-label-eyebrow)",
        lineHeight: "var(--leading-label-eyebrow)",
        letterSpacing: "var(--tracking-label-eyebrow)",
        fontWeight: 700,
        textTransform: "uppercase",
        color: "var(--color-text-subtle)",
      }}
    >
      {text}
    </motion.div>
  );
}

/** `Heading/Page` — 52px, the only size a slide title is ever set at. */
export function Title({ children, i = 0 }: { children: ReactNode; i?: number }) {
  return (
    <Rise i={i}>
      <h2
        style={{
          fontSize: "var(--text-heading-page)",
          lineHeight: "var(--leading-heading-page)",
          letterSpacing: "var(--tracking-heading-page)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          margin: 0,
        }}
      >
        {children}
      </h2>
    </Rise>
  );
}

/** `Body/Lead` — 22px. One or two of these per slide, never more. */
export function Lead({
  children,
  i = 1,
  accent,
}: {
  children: ReactNode;
  i?: number;
  accent?: boolean;
}) {
  return (
    <Rise i={i}>
      <p
        style={{
          fontSize: "var(--text-body-lead)",
          lineHeight: "var(--leading-body-lead)",
          letterSpacing: "var(--tracking-body-lead)",
          color: accent
            ? "var(--color-text-accent)"
            : "var(--color-text-secondary)",
          margin: 0,
          maxWidth: "780px",
        }}
      >
        {children}
      </p>
    </Rise>
  );
}

/**
 * The field contract chip, per DESIGN.md: hug width, 28px tall, `radius/lg`,
 * `bg/surface`, a hairline, and `Label/Field Chip` in Accent Blue.
 *
 * `layoutId` is the whole point of this component. The same five chips are a
 * row of JSON keys on one slide, a card on the next and a pipeline station on
 * the one after — one set of nodes moving, not three drawings of the same idea.
 */
export function FieldChip({
  id,
  label,
  mono = true,
  muted,
}: {
  id: string;
  label: string;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <motion.span
      layoutId={`field-${id}`}
      transition={MORPH}
      className="inline-flex items-center"
      style={{
        /* One rung up from DESIGN.md's 28px/13px chip. That chip is sized for
           a participant at a laptop; this one is read from the back of a room.
           The ramp is the same, the rung is not. */
        height: "34px",
        padding: "0 var(--spacing-14)",
        borderRadius: "var(--radius-lg)",
        background: muted
          ? "var(--color-bg-surface-muted)"
          : "var(--color-bg-surface)",
        border: "1px solid var(--color-border-default)",
        fontFamily: mono ? "var(--font-mono)" : "var(--font-inter)",
        fontSize: "var(--text-body-small)",
        lineHeight: "var(--leading-body-small)",
        fontWeight: 600,
        color: muted ? "var(--color-text-muted)" : "var(--color-text-accent)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </motion.span>
  );
}

/**
 * A card, `radius/xl` on `bg/surface` with one hairline and no shadow —
 * DESIGN.md is explicit that surface contrast plus a border already reads as
 * lifted, and that a shadow never substitutes for the border.
 */
export function Card({
  children,
  className,
  style,
  layoutId,
  accent,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  layoutId?: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      layoutId={layoutId}
      transition={MORPH}
      className={className}
      style={{
        borderRadius: "var(--radius-xl)",
        background: "var(--color-bg-surface)",
        border: `1px solid ${
          accent ? "var(--color-border-accent)" : "var(--color-border-default)"
        }`,
        boxShadow: "var(--shadow-card)",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * One station on the data-flow pipeline — the 2D reading of the hero's four
 * glass slabs.
 *
 * `lit` is the hero's rule brought forward: exactly one boundary is lit at any
 * moment, and it is lit in Accent Blue. Nothing else on a pipeline slide may
 * take that colour, so wherever the eye lands, that is the station being
 * talked about.
 */
export function Station({
  id,
  label,
  sub,
  icon,
  lit,
  dim,
  danger,
  width = 244,
  minHeight,
}: {
  id: string;
  label: string;
  sub?: string;
  /** One glyph above the label. A named box is a label; a box with a glyph is a thing. */
  icon?: ReactNode;
  lit?: boolean;
  dim?: boolean;
  danger?: boolean;
  width?: number;
  minHeight?: number;
}) {
  const border = danger
    ? "var(--color-status-danger-border)"
    : lit
      ? "var(--color-border-accent)"
      : "var(--color-border-strong)";

  return (
    <motion.div
      layoutId={`station-${id}`}
      transition={MORPH}
      className="flex flex-col items-center justify-center text-center"
      style={{
        width,
        minHeight: minHeight ?? (icon ? "140px" : "128px"),
        gap: "var(--spacing-6)",
        padding: "var(--spacing-18) var(--spacing-16)",
        borderRadius: "var(--radius-xl)",
        background: danger
          ? "var(--color-status-danger-subtle)"
          : lit
            ? "var(--color-bg-accent-subtle)"
            : "var(--color-bg-surface)",
        border: `1px solid ${border}`,
        boxShadow: lit ? "var(--shadow-raised)" : "var(--shadow-card)",
        opacity: dim ? 0.38 : 1,
      }}
    >
      {icon ? (
        <span
          style={{
            color: "var(--color-text-accent)",
            marginBottom: "var(--spacing-2)",
          }}
        >
          {icon}
        </span>
      ) : null}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-body-language)",
          fontWeight: 400,
          color: danger
            ? "var(--color-status-danger)"
            : lit
              ? "var(--color-text-accent)"
              : "var(--color-text-primary)",
        }}
      >
        {label}
      </span>
      {sub ? (
        <span
          style={{
            fontSize: "var(--text-body-compact)",
            letterSpacing: "var(--tracking-body-compact)",
            color: "var(--color-text-subtle)",
          }}
        >
          {sub}
        </span>
      ) : null}
    </motion.div>
  );
}

/**
 * The dashed connector between two stations. Static by design: DESIGN.md keeps
 * the reference network still because it describes the shared pipeline, not the
 * selected track — a connector that animates on every slide would be motion
 * that means nothing.
 */
export function Connector({ width = 52 }: { width?: number }) {
  return (
    <div
      aria-hidden
      className="relative flex items-center justify-center"
      style={{ width, flex: "none", height: "16px" }}
    >
      <span
        style={{
          position: "absolute",
          inset: "auto 0",
          height: 0,
          borderTop: "1px dashed var(--color-border-strong)",
        }}
      />
      {/* The hero's connectors are decorative and carry no direction. These
          ones do — data moves left to right across a boundary, and that is the
          claim the diagram is making — so they get a head. */}
      <span
        style={{
          position: "relative",
          fontSize: "var(--text-body-compact)",
          lineHeight: 1,
          color: "var(--color-text-muted)",
          background: "var(--color-bg-canvas)",
          padding: "0 2px",
        }}
      >
        ›
      </span>
    </div>
  );
}

/**
 * `bg/code` with the dark syntax half. The single deliberate exception to
 * DESIGN.md's light-only theme, and only ever under code.
 */
export function CodeSurface({
  children,
  className,
  style,
  layoutId,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  layoutId?: string;
}) {
  return (
    <motion.div
      layoutId={layoutId}
      transition={MORPH}
      className={className}
      style={{
        borderRadius: "var(--radius-xl)",
        background: "var(--code-bg)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-code-editor)",
        lineHeight: "var(--leading-code-editor)",
        color: "var(--code-foreground)",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}
