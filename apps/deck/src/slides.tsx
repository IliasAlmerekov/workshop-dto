import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  AGENDA,
  ENTITY_FIELDS,
  EXERCISES,
  MAPPER_JOBS,
  PARTS,
  RESPONSE_FIELDS,
  ROOM_QUESTIONS,
  TALK,
  TRANSFORMS,
} from "./content";
import { JsonBlock, type JsonLineSpec } from "./components/JsonBlock";
import {
  IconBrowser,
  IconCalendar,
  IconCase,
  IconClock,
  IconContract,
  IconDatabase,
  IconDrop,
  IconFilter,
  IconGift,
  IconHand,
  IconLayers,
  IconLink,
  IconList,
  IconMapper,
  IconMerge,
  IconNoLogic,
  IconPencil,
  IconQuestion,
  IconShield,
  IconTag,
  IconTrim,
  IconType,
} from "./components/icons";
import {
  Card,
  Connector,
  FADE,
  FieldChip,
  IconBadge,
  Lead,
  MORPH,
  Rise,
  Station,
  Title,
  Wordmark,
} from "./components/primitives";

/**
 * The twelve slides.
 *
 * A slide declares how many *fragments* it has — how many presses it takes to
 * get through it — and renders itself for a given fragment. Fragments are used
 * where a block must not be readable before it is spoken: the question put to
 * the room, the boundary doing its work, the two comparisons, and the three
 * costs at the end. Everything else arrives whole, because a slide that
 * withholds what the speaker has already said is a slide fighting its speaker.
 *
 * `part` names the section marker parked in the top-right corner. It is the
 * agenda's own line, still on screen eight slides later.
 */
export type Slide = {
  id: string;
  fragments: number;
  part?: keyof typeof PARTS;
  /** The welcome slide owns the whole frame; the rest sit inside the chrome. */
  bare?: boolean;
  render: (fragment: number) => ReactNode;
};

/* ------------------------------------------------------------------ *
 * Small shared layout helpers, local to the slides.
 * ------------------------------------------------------------------ */

/**
 * The slide's writing area, on the hero's own left margin (`x: 105`).
 *
 * The title sits at a fixed height on every slide — a heading that moves
 * depending on how much is under it makes a deck feel assembled rather than
 * designed. Everything after it goes in `Fill`, which centres itself in
 * whatever height is left.
 */
function Body({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-[105px] top-[132px] bottom-[92px] flex flex-col">
      {children}
    </div>
  );
}

/** The main visual, centred in the space below the title. */
function Fill({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col justify-center">{children}</div>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: "var(--text-label-eyebrow)",
        lineHeight: "var(--leading-label-eyebrow)",
        letterSpacing: "var(--tracking-label-eyebrow)",
        fontWeight: 700,
        textTransform: "uppercase",
        color: "var(--color-text-accent)",
      }}
    >
      {children}
    </span>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: "var(--text-body-compact)",
        lineHeight: "var(--leading-body-compact)",
        letterSpacing: "var(--tracking-body-compact)",
        color: "var(--color-text-subtle)",
      }}
    >
      {children}
    </span>
  );
}

/** A lane label for the two-lane comparison slides. */
function LaneLabel({ text, danger }: { text: string; danger?: boolean }) {
  return (
    <span
      style={{
        fontSize: "var(--text-label-eyebrow)",
        letterSpacing: "var(--tracking-label-eyebrow)",
        fontWeight: 700,
        textTransform: "uppercase",
        color: danger
          ? "var(--color-status-danger)"
          : "var(--color-text-accent)",
      }}
    >
      {text}
    </span>
  );
}

/**
 * The boundary itself, drawn.
 *
 * The deck says the word "boundary" more than any other, and for three slides
 * it was only a word. This is the line data has to cross — the server on one
 * side, the world on the other — so that "what crosses the boundary" becomes
 * something the room can point at instead of a phrase it has to hold in its
 * head.
 */
function Boundary({ label, breached }: { label: string; breached?: boolean }) {
  return (
    <div className="flex flex-none flex-col items-center gap-[14px]">
      <span
        style={{
          fontSize: "var(--text-label-eyebrow)",
          letterSpacing: "var(--tracking-label-eyebrow)",
          fontWeight: 700,
          textTransform: "uppercase",
          color: breached
            ? "var(--color-status-danger)"
            : "var(--color-text-accent)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: 0,
          height: "430px",
          borderLeft: `3px dashed ${
            breached
              ? "var(--color-status-danger-border)"
              : "var(--color-border-accent)"
          }`,
        }}
      />
    </div>
  );
}

/** One labelled end of the boundary — a glyph and a caption, nothing else. */
function Pole({
  icon,
  label,
  sub,
  tone = "quiet",
}: {
  icon: ReactNode;
  label: string;
  sub: string;
  tone?: "accent" | "danger" | "quiet";
}) {
  return (
    <div className="flex w-[180px] flex-none flex-col items-center gap-[16px] text-center">
      <IconBadge size={84} tone={tone}>
        {icon}
      </IconBadge>
      <div className="flex flex-col gap-[4px]">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-body-language)",
            color: "var(--color-text-primary)",
          }}
        >
          {label}
        </span>
        <Caption>{sub}</Caption>
      </div>
    </div>
  );
}

const AGENDA_GLYPH = {
  dto: <IconContract size={30} />,
  mapper: <IconMapper size={30} />,
  exercises: <IconPencil size={30} />,
  questions: <IconQuestion size={30} />,
  surprise: <IconGift size={30} />,
} as const;

const JOB_GLYPH: Record<string, ReactNode> = {
  rename: <IconTag size={20} />,
  trim: <IconTrim size={20} />,
  lowercase: <IconCase size={20} />,
  "to-date": <IconCalendar size={20} />,
  join: <IconMerge size={20} />,
  drop: <IconDrop size={20} />,
};

/** The job chip, shared by the scatter slide and the one that gathers it back. */
function JobChip({ id, label }: { id: string; label: string }) {
  return (
    <motion.span
      layoutId={`job-${id}`}
      transition={MORPH}
      className="inline-flex items-center gap-[8px]"
      style={{
        height: "36px",
        padding: "0 var(--spacing-12)",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-default)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-body-small)",
        color: "var(--color-text-accent)",
        whiteSpace: "nowrap",
      }}
    >
      {JOB_GLYPH[id]}
      {label}
    </motion.span>
  );
}

const entityLines: JsonLineSpec[] = ENTITY_FIELDS.map((field) => ({
  /* `firstName` carries the identity that becomes `displayName`, so the merge
     is one box changing its label rather than two boxes swapped for a third. */
  morphId: field.id === "firstName" ? "displayName" : field.id,
  key: field.key,
  value: field.value,
  danger: field.secret,
}));

const responseLines: JsonLineSpec[] = RESPONSE_FIELDS.map((field) => ({
  morphId: field.id,
  key: field.key,
  value: field.value,
}));

/* ------------------------------------------------------------------ *
 * The deck.
 * ------------------------------------------------------------------ */

export const SLIDES: Slide[] = [
  /* 1 — Welcome ---------------------------------------------------- *
   * The site's opening curtain, held still. Whoever is in the room has
   * just been asked to open the workshop URL; the first thing they will
   * see there is `WORKSHOP` typing itself onto white. Starting the talk
   * with the same gesture makes the deck and the app one object. */
  {
    id: "welcome",
    fragments: 1,
    bare: true,
    render: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
        <Wordmark corner={false} typed />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...FADE, delay: 1.4 }}
          className="mt-[54px] flex flex-col items-center gap-[10px]"
        >
          <span
            style={{
              fontSize: "var(--text-label-eyebrow)",
              letterSpacing: "var(--tracking-label-eyebrow)",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--color-text-subtle)",
            }}
          >
            {TALK.speakers}
          </span>
          <span
            style={{
              fontSize: "var(--text-body-compact)",
              letterSpacing: "var(--tracking-body-compact)",
              color: "var(--color-text-muted)",
            }}
          >
            {TALK.where}
          </span>
        </motion.div>
      </div>
    ),
  },

  /* 2 — The question to the room ------------------------------------ *
   * Before a single definition. Two shows of hands tell both speakers
   * whether the next fifteen minutes are an introduction or a refresher
   * — and, worth more than that, the room does something in minute two
   * instead of settling in to watch.
   *
   * One question per press, so the second is not read while the first is
   * still being answered. */
  {
    id: "ask",
    fragments: 2,
    render: (fragment) => (
      <Body>
        <Title>Before we start</Title>
        <Fill>
          <div className="flex flex-col gap-[44px]">
            {ROOM_QUESTIONS.map((question, index) => (
              <AnimatePresence key={question}>
                {fragment >= index ? (
                  <motion.div
                    initial={{ opacity: 0, x: 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={MORPH}
                    className="flex items-center gap-[32px]"
                  >
                    <IconBadge size={92} tone={index === 0 ? "accent" : "quiet"}>
                      <IconHand size={44} />
                    </IconBadge>
                    <span
                      style={{
                        fontSize: "var(--text-heading-page)",
                        lineHeight: "var(--leading-heading-page)",
                        letterSpacing: "var(--tracking-heading-page)",
                        fontWeight: 700,
                        color:
                          index === 0
                            ? "var(--color-text-primary)"
                            : "var(--color-text-secondary)",
                      }}
                    >
                      {question}
                    </span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            ))}
          </div>
          <div className="mt-[54px]">
            <Rise i={3}>
              <Caption>Hands up. There is no wrong answer.</Caption>
            </Rise>
          </div>
        </Fill>
      </Body>
    ),
  },

  /* 3 — Agenda ----------------------------------------------------- *
   * A list. Topics only — no presenter names, no sub-points: who speaks
   * is obvious the moment they speak, and the sub-points are the slides.
   *
   * Items 1 and 2 are not decoration. They physically leave this list
   * and live in the corner for the rest of their part, so the promise
   * made here is visibly still being kept eight slides later. */
  {
    id: "agenda",
    fragments: 1,
    render: () => (
      <Body>
        <div className="flex items-center gap-[20px]">
          <span style={{ color: "var(--color-text-accent)" }}>
            <IconList size={32} />
          </span>
          <Title>Agenda</Title>
        </div>
        <Fill>
          <div className="flex flex-col gap-[22px]">
            {AGENDA.map((item, index) => {
              const part =
                item.icon === "dto"
                  ? "dto"
                  : item.icon === "mapper"
                    ? "mapper"
                    : null;

              return (
                <Rise key={item.ordinal} i={index}>
                  <div className="flex items-center gap-[26px]">
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-body-language)",
                        color: "var(--color-text-muted)",
                        width: "26px",
                      }}
                    >
                      {item.ordinal}
                    </span>
                    <IconBadge size={64} tone={part ? "accent" : "quiet"}>
                      {AGENDA_GLYPH[item.icon]}
                    </IconBadge>
                    {part ? (
                      <motion.span
                        layoutId={`part-${part}`}
                        transition={MORPH}
                        style={{
                          fontSize: "var(--text-heading-brand)",
                          lineHeight: "var(--leading-heading-brand)",
                          letterSpacing: "var(--tracking-heading-brand)",
                          fontWeight: 700,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {item.title}
                      </motion.span>
                    ) : (
                      <span
                        style={{
                          fontSize: "var(--text-heading-brand)",
                          lineHeight: "var(--leading-heading-brand)",
                          letterSpacing: "var(--tracking-heading-brand)",
                          fontWeight: 700,
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {item.title}
                      </span>
                    )}
                  </div>
                </Rise>
              );
            })}
          </div>
        </Fill>
      </Body>
    ),
  },

  /* 4 — What our API sends today ------------------------------------ *
   * The slide that has to earn the rest of the deck, so it must not read
   * as "here is some JSON". It is an accusation, and the picture carries
   * it: the Entity on the left, the client on the right, and between
   * them the boundary — which right now stops nothing.
   *
   * Three fragments. The whole row goes out; three of the fields turn
   * out to be things nobody meant to publish; then the boundary finally
   * does its job and the response becomes a decision. That last
   * transition is the definition of a DTO, given before the word is. */
  {
    id: "problem",
    fragments: 3,
    part: "dto",
    render: (fragment) => (
      <Body>
        <Eyebrow>
          {fragment < 2 ? "Our API today" : "Our API after one decision"}
        </Eyebrow>
        <div className="mt-[10px]">
          <Title>
            {fragment < 2
              ? "The client asked for a user"
              : "Now the client gets a contract"}
          </Title>
        </div>
        <Fill>
          <div className="flex items-center gap-[26px]">
            <Pole
              icon={<IconDatabase size={40} />}
              label="User"
              sub="one row in your database"
              tone={fragment === 1 ? "danger" : "quiet"}
            />
            <Boundary
              label={fragment < 2 ? "no boundary" : "the boundary"}
              breached={fragment < 2}
            />
            <div className="flex flex-1 flex-col gap-[20px]">
              <JsonBlock
                lines={fragment < 2 ? entityLines : responseLines}
                flagged={fragment >= 1}
                width={640}
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={fragment}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={FADE}
                  className="flex items-center gap-[14px]"
                  style={{ maxWidth: "640px" }}
                >
                  {fragment === 0 ? (
                    <span
                      style={{
                        fontSize: "var(--text-body-question)",
                        lineHeight: "var(--leading-body-question)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Nine fields went out. Nobody chose them — the serializer
                      did.
                    </span>
                  ) : null}
                  {fragment === 1 ? (
                    <>
                      <span style={{ color: "var(--color-status-danger)" }}>
                        <IconShield size={26} />
                      </span>
                      <span
                        style={{
                          fontSize: "var(--text-body-question)",
                          lineHeight: "var(--leading-body-question)",
                          color: "var(--color-status-danger)",
                          fontWeight: 500,
                        }}
                      >
                        A password hash and an internal note are now public.
                      </span>
                    </>
                  ) : null}
                  {fragment === 2 ? (
                    <>
                      <span style={{ color: "var(--color-text-accent)" }}>
                        <IconFilter size={26} />
                      </span>
                      <span
                        style={{
                          fontSize: "var(--text-body-question)",
                          lineHeight: "var(--leading-body-question)",
                          color: "var(--color-text-accent)",
                          fontWeight: 500,
                        }}
                      >
                        Five fields. Every one of them chosen by us.
                      </span>
                    </>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>
            <Pole
              icon={<IconBrowser size={40} />}
              label="Client"
              sub="a browser, an app, anyone"
            />
          </div>
        </Fill>
      </Body>
    ),
  },

  /* 5 — What is a DTO ---------------------------------------------- *
   * The five surviving lines arrive here as the five chips of a field
   * contract. Same nodes, new arrangement — so the definition reads as a
   * consequence of what just happened, not as a new topic. */
  {
    id: "what-is-dto",
    fragments: 1,
    part: "dto",
    render: () => (
      <Body>
        <Title>A DTO is a promise</Title>
        <Fill>
          <div className="flex items-center justify-between gap-[64px]">
            <div className="flex flex-col gap-[28px]">
              {[
                {
                  icon: <IconFilter size={30} />,
                  text: "It carries only the data you choose.",
                },
                { icon: <IconType size={30} />, text: "It has clear types." },
                {
                  icon: <IconNoLogic size={30} />,
                  text: "It has no business logic.",
                },
              ].map((point, index) => (
                <Rise key={point.text} i={index}>
                  <div className="flex items-center gap-[24px]">
                    <IconBadge size={64}>{point.icon}</IconBadge>
                    <span
                      style={{
                        fontSize: "var(--text-body-lead)",
                        lineHeight: "var(--leading-body-lead)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {point.text}
                    </span>
                  </div>
                </Rise>
              ))}
            </div>
            <Card
              layoutId="station-response-dto"
              style={{ padding: "var(--spacing-30)" }}
              accent
            >
              <div className="flex flex-col gap-[22px]">
                <div className="flex items-center gap-[14px]">
                  <span style={{ color: "var(--color-text-accent)" }}>
                    <IconContract size={26} />
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-heading-card)",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    UserResponse
                  </span>
                </div>
                <div className="flex flex-col items-start gap-[10px]">
                  {RESPONSE_FIELDS.map((field) => (
                    <FieldChip key={field.id} id={field.id} label={field.key} />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </Fill>
      </Body>
    ),
  },

  /* 6 — Where a DTO lives ------------------------------------------ *
   * The 2D reading of the hero's four glass slabs, drawn once and reused
   * for the rest of the deck. The card from the previous slide does not
   * fade out and a diagram fade in: it shrinks and takes its place as
   * one station in a line. */
  {
    id: "where",
    fragments: 1,
    part: "dto",
    render: () => (
      <Body>
        <Title>DTOs live on boundaries</Title>
        <div className="mt-[14px]">
          <Lead>A boundary is where data leaves your code.</Lead>
        </div>
        <Fill>
          <div className="flex items-center">
            <Station
              id="client-in"
              label="Client"
              sub="the form"
              icon={<IconBrowser size={26} />}
              width={172}
            />
            <Connector />
            <Station
              id="request-dto"
              label="Request DTO"
              sub="boundary"
              icon={<IconContract size={26} />}
            />
            <Connector />
            <Station
              id="mapper"
              label="Mapper"
              sub="translate"
              icon={<IconMapper size={26} />}
              width={196}
            />
            <Connector />
            <Station
              id="entity"
              label="Entity"
              sub="your code"
              icon={<IconDatabase size={26} />}
              width={196}
            />
            <Connector />
            <Station
              id="response-dto"
              label="Response DTO"
              sub="boundary"
              icon={<IconContract size={26} />}
              lit
            />
            <Connector />
            <Station
              id="client-out"
              label="Client"
              sub="the app"
              icon={<IconBrowser size={26} />}
              width={172}
            />
          </div>
          <div className="mt-[34px]">
            <Rise i={3}>
              <Caption>
                Two boundaries, one Entity in the middle. The Entity never
                travels.
              </Caption>
            </Rise>
          </div>
        </Fill>
      </Body>
    ),
  },

  /* 7 — Without / With DTO ----------------------------------------- *
   * Two fragments, and the only correct use of one here: the second lane
   * is the answer to the first, so showing both at once answers a
   * question the room has not been asked yet. The pipeline tears apart
   * to build them — the Entity goes up into the broken lane, the Mapper
   * and the Response DTO come down into the working one. */
  {
    id: "compare-dto",
    fragments: 2,
    part: "dto",
    render: (fragment) => (
      <Body>
        <Title>Same data, two contracts</Title>
        <Fill>
          <div className="flex flex-col gap-[54px]">
            <div className="flex flex-col gap-[16px]">
              <LaneLabel text="Without DTO" danger />
              <div className="flex items-center">
                <Station
                  id="entity"
                  label="Entity"
                  icon={<IconDatabase size={26} />}
                  width={196}
                  danger
                />
                <Connector />
                <Station id="serializer" label="Serializer" width={196} />
                <Connector />
                <Station
                  id="client-out"
                  label="Client"
                  icon={<IconBrowser size={26} />}
                  width={172}
                />
                <div className="ml-[44px] flex flex-col gap-[6px]">
                  {[
                    "The client sees your database.",
                    "One rename breaks the client.",
                  ].map((line) => (
                    <span
                      key={line}
                      style={{
                        fontSize: "var(--text-body-question)",
                        color: "var(--color-status-danger)",
                      }}
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {fragment >= 1 ? (
                <motion.div
                  key="with"
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={MORPH}
                  className="flex flex-col gap-[16px]"
                >
                  <LaneLabel text="With DTO" />
                  <div className="flex items-center">
                    <Station
                      id="entity-safe"
                      label="Entity"
                      icon={<IconDatabase size={26} />}
                      width={196}
                    />
                    <Connector />
                    <Station
                      id="mapper"
                      label="Mapper"
                      icon={<IconMapper size={26} />}
                      width={196}
                      lit
                    />
                    <Connector />
                    <Station
                      id="response-dto"
                      label="Response DTO"
                      icon={<IconContract size={26} />}
                    />
                    <Connector />
                    <Station
                      id="client-in"
                      label="Client"
                      icon={<IconBrowser size={26} />}
                      width={172}
                    />
                    <div className="ml-[44px] flex flex-col gap-[6px]">
                      {[
                        "The client sees what you chose.",
                        "You change the Entity freely.",
                      ].map((line) => (
                        <span
                          key={line}
                          style={{
                            fontSize: "var(--text-body-question)",
                            color: "var(--color-text-accent)",
                          }}
                        >
                          {line}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </Fill>
      </Body>
    ),
  },

  /* 8 — What is a Mapper ------------------------------------------- *
   * The handover. The Mapper station leaves the pipeline and comes to
   * the middle of the screen, so the room sees the subject change before
   * the second speaker has opened his mouth. */
  {
    id: "what-is-mapper",
    fragments: 1,
    part: "mapper",
    render: () => (
      <Body>
        <Title>A Mapper is a translator</Title>
        <div className="mt-[14px]">
          <Lead i={1}>It moves data from one shape into another.</Lead>
        </div>
        <Fill>
          <div className="flex items-center gap-[32px]">
            <Card style={{ padding: "var(--spacing-24)" }}>
              <div className="flex flex-col gap-[12px]">
                <Caption>what arrives</Caption>
                <div className="flex flex-col gap-[8px]">
                  {TRANSFORMS.map((transform) => (
                    <code
                      key={transform.id}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-body-question)",
                        color: "var(--color-text-muted)",
                        whiteSpace: "pre",
                      }}
                    >
                      {transform.from}
                    </code>
                  ))}
                </div>
              </div>
            </Card>
            <Connector width={44} />
            <Station
              id="mapper"
              label="Mapper"
              sub="one file"
              icon={<IconMapper size={34} />}
              width={280}
              lit
            />
            <Connector width={44} />
            <Card style={{ padding: "var(--spacing-24)" }} accent>
              <div className="flex flex-col gap-[12px]">
                <Caption>what we keep</Caption>
                <div className="flex flex-col gap-[8px]">
                  {TRANSFORMS.map((transform) => (
                    <code
                      key={transform.id}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-body-question)",
                        color: "var(--color-text-accent)",
                      }}
                    >
                      {transform.to}
                    </code>
                  ))}
                </div>
              </div>
            </Card>
          </div>
          <div className="mt-[34px]">
            <Rise i={3}>
              <Caption>One place. Visible. Easy to test.</Caption>
            </Rise>
          </div>
        </Fill>
      </Body>
    ),
  },

  /* 9 — Six small jobs --------------------------------------------- *
   * The six jobs are named and given identities here, because the next
   * slide throws them across a codebase. Nothing is invented: the values
   * are the real raw form data from task 2. */
  {
    id: "jobs",
    fragments: 2,
    part: "mapper",
    render: (fragment) => (
      <Body>
        <Title>Six small jobs</Title>
        <Fill>
          <div className="flex gap-[16px]">
            {MAPPER_JOBS.map((job, index) => (
              <Rise key={job.id} i={index}>
                <Card style={{ width: "196px", padding: "var(--spacing-20)" }}>
                  <div className="flex flex-col items-center gap-[14px] text-center">
                    <IconBadge size={56}>{JOB_GLYPH[job.id]}</IconBadge>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-body-small)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {job.label}
                    </span>
                  </div>
                </Card>
              </Rise>
            ))}
          </div>
          <AnimatePresence>
            {fragment >= 1 ? (
              <motion.div
                key="transforms"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={MORPH}
                className="mt-[52px] flex flex-col gap-[20px]"
              >
                {TRANSFORMS.map((transform, index) => (
                  <motion.div
                    key={transform.id}
                    initial={{ opacity: 0, x: -28 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...MORPH, delay: 0.24 * index }}
                    className="flex items-center gap-[24px]"
                  >
                    <code
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-body-question)",
                        color: "var(--color-text-muted)",
                        minWidth: "340px",
                        whiteSpace: "pre",
                      }}
                    >
                      {transform.from}
                    </code>
                    <span style={{ color: "var(--color-text-subtle)" }}>→</span>
                    <code
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-body-question)",
                        color: "var(--color-text-accent)",
                      }}
                    >
                      {transform.to}
                    </code>
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Fill>
      </Body>
    ),
  },

  /* 10 — Where does this logic live --------------------------------- *
   * The argument for a Mapper, made by taking one away. The six jobs
   * scatter into four files, then gather back into one box. The scatter
   * is the only place in the deck where the layout is allowed to look
   * untidy, because untidiness is the point being made. */
  {
    id: "compare-mapper",
    fragments: 2,
    part: "mapper",
    render: (fragment) =>
      fragment === 0 ? (
        <Body>
          <Title>Where does this logic live?</Title>
          <div className="mt-[14px]">
            <Lead>
              Without a Mapper — in the controller, and the service, and the
              template.
            </Lead>
          </div>
          <Fill>
            <div className="flex gap-[22px]">
              {["Controller", "Service", "Repository", "Template"].map(
                (home, index) => (
                  <Rise key={home} i={index}>
                    <Card
                      style={{
                        width: "300px",
                        minHeight: "180px",
                        padding: "var(--spacing-22)",
                      }}
                    >
                      <div className="flex flex-col gap-[16px]">
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-body-small)",
                            color: "var(--color-text-subtle)",
                          }}
                        >
                          {home}
                        </span>
                        <div className="flex flex-wrap gap-[10px]">
                          {MAPPER_JOBS.filter((job) => job.home === home).map(
                            (job) => (
                              <JobChip
                                key={job.id}
                                id={job.id}
                                label={job.label}
                              />
                            ),
                          )}
                        </div>
                      </div>
                    </Card>
                  </Rise>
                ),
              )}
            </div>
          </Fill>
        </Body>
      ) : (
        <Body>
          <Title>Where does this logic live?</Title>
          <div className="mt-[14px]">
            <Lead accent>With a Mapper — in one file you can test.</Lead>
          </div>
          <Fill>
            <div className="flex justify-center">
              <Card
                layoutId="station-mapper"
                accent
                style={{ padding: "var(--spacing-32)", width: "780px" }}
              >
                <div className="flex flex-col gap-[24px]">
                  <div className="flex items-center gap-[14px]">
                    <span style={{ color: "var(--color-text-accent)" }}>
                      <IconMapper size={26} />
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-heading-card)",
                        fontWeight: 700,
                        color: "var(--color-text-accent)",
                      }}
                    >
                      UserResponseMapper
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-[12px]">
                    {MAPPER_JOBS.map((job) => (
                      <JobChip key={job.id} id={job.id} label={job.label} />
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </Fill>
        </Body>
      ),
  },

  /* 11 — The honest price ------------------------------------------ *
   * The workshop's own position, from SPECIFICATION.md §4.5: no rule
   * that says "always a DTO", a reasoned decision at real boundaries.
   * Three fragments so each cost lands on its own, and the last one —
   * "maybe skip it" — is not buried under the two above it. */
  {
    id: "price",
    fragments: 3,
    part: "mapper",
    render: (fragment) => (
      <Body>
        <Title>The honest price</Title>
        <Fill>
          <div className="flex gap-[24px]">
            {[
              {
                icon: <IconLayers size={32} />,
                text: "More classes. More code to write.",
              },
              {
                icon: <IconLink size={32} />,
                text: "One new field, two files to change.",
              },
              {
                icon: <IconClock size={32} />,
                text: "Small, short-lived app? Maybe skip it.",
              },
            ].map((cost, index) => (
              /* The slot exists from the first press; only its contents wait.
                 A card that pushed its neighbours aside as it arrived would be
                 two motions where the slide means one. */
              <motion.div
                key={cost.text}
                animate={{
                  opacity: fragment >= index ? 1 : 0,
                  y: fragment >= index ? 0 : 30,
                }}
                initial={false}
                transition={MORPH}
              >
                    <Card
                      style={{
                        width: "396px",
                        minHeight: "236px",
                        padding: "var(--spacing-28)",
                      }}
                    >
                      <div className="flex h-full flex-col justify-between gap-[26px]">
                        <IconBadge size={72} tone="quiet">
                          {cost.icon}
                        </IconBadge>
                        <span
                          style={{
                            fontSize: "var(--text-body-lead)",
                            lineHeight: "var(--leading-body-lead)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {cost.text}
                        </span>
                      </div>
                    </Card>
              </motion.div>
            ))}
          </div>
          <AnimatePresence>
            {fragment >= 2 ? (
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...MORPH, delay: 0.3 }}
                className="mt-[48px]"
              >
                <Lead i={0} accent>
                  So: not a rule. A decision, at a real boundary.
                </Lead>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Fill>
      </Body>
    ),
  },

  /* 12 — Your turn -------------------------------------------------- *
   * The deck hands over to the app. The Mapper box becomes exercise 02,
   * so the thing the room has just been looking at is the thing they are
   * about to write. The surprise is named and not explained — it was
   * promised on the agenda, and it stays a surprise. */
  {
    id: "your-turn",
    fragments: 1,
    render: () => (
      <Body>
        <Title>Your turn</Title>
        <div className="mt-[14px]">
          <Lead>Four exercises. Pick your language and start.</Lead>
        </div>
        <Fill>
          <div className="flex gap-[24px]">
            {EXERCISES.map((exercise, index) => (
              <Card
                key={exercise.id}
                layoutId={exercise.id === "task2" ? "station-mapper" : undefined}
                accent={exercise.id === "task2"}
                style={{
                  width: "330px",
                  minHeight: "200px",
                  padding: "var(--spacing-24)",
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...FADE, delay: index * 0.13 }}
                  className="flex h-full flex-col justify-between gap-[24px]"
                >
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        display: "inline-flex",
                        width: "38px",
                        height: "38px",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "var(--radius-full)",
                        background: "var(--color-bg-accent)",
                        color: "var(--color-text-inverse)",
                        fontSize: "var(--text-body-small)",
                        fontWeight: 500,
                      }}
                    >
                      {exercise.n}
                    </span>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {exercise.id === "task2" ? (
                        <IconMapper size={26} />
                      ) : (
                        <IconContract size={26} />
                      )}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "var(--text-heading-card)",
                      lineHeight: "var(--leading-heading-card)",
                      letterSpacing: "var(--tracking-heading-card)",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {exercise.title}
                  </span>
                </motion.div>
              </Card>
            ))}
          </div>
          <div className="mt-[44px]">
            <Rise i={5}>
              <div className="flex items-center gap-[22px]">
                <span
                  style={{
                    fontSize: "var(--text-body-lead)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Then three short questions.
                </span>
                <span
                  className="inline-flex items-center gap-[12px]"
                  style={{
                    fontSize: "var(--text-body-lead)",
                    color: "var(--color-text-accent)",
                    fontWeight: 500,
                  }}
                >
                  <IconGift size={26} />
                  And one more thing.
                </span>
              </div>
            </Rise>
          </div>
        </Fill>
      </Body>
    ),
  },
];
