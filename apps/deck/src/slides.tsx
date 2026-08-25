import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  AGENDA,
  BOUNDARIES,
  ENTITY_FIELDS,
  LEGACY_PROFILE,
  MAPPER_JOBS,
  PARTS,
  RESPONSE_FIELDS,
  ROOM_QUESTION,
  STORY,
  TALK,
  TRANSFORMS,
} from "./content";
import { JsonBlock, type JsonLineSpec } from "./components/JsonBlock";
import { JOIN_URL, JoinQr } from "./components/JoinQr";
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
  IconLayers,
  IconLink,
  IconList,
  IconMail,
  IconMapper,
  IconMerge,
  IconNoLogic,
  IconPencil,
  IconQuestion,
  IconServer,
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
 * The thirteen slides.
 *
 * The order is the one thing here that is not negotiable, because it is the
 * argument. A DTO is *defined* before the leaking API is shown, not after: the
 * room needs the idea before it can read the evidence, and a slide of raw JSON
 * shown first is a puzzle rather than a point. The same rule runs through the
 * exercises the deck hands over to — issue #23's pipeline defines every
 * contract before the Mapper that fills it.
 *
 * A slide declares how many *fragments* it has — how many presses it takes to
 * get through it. Fragments exist where a block must not be readable before it
 * is spoken; everything else arrives whole, because a slide that withholds what
 * the speaker has already said is a slide fighting its speaker.
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
 * The deck says the word "boundary" more than any other, and for several slides
 * it was only a word. This is the line data has to cross — the server on one
 * side, the world on the other — so that "what crosses the boundary" becomes
 * something the room can point at instead of a phrase it has to hold in its
 * head.
 */
function Boundary({
  label,
  breached,
  height = 430,
}: {
  label: string;
  breached?: boolean;
  height?: number;
}) {
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
          height,
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

/** The far side of each boundary, per `BOUNDARIES`. */
const BOUNDARY_GLYPH: Record<string, ReactNode> = {
  inbound: <IconServer size={26} />,
  notification: <IconMail size={26} />,
  public: <IconBrowser size={26} />,
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
   * The site's opening curtain, held still. Whoever is in the room is
   * about to open the workshop URL; the first thing they will see there
   * is `WORKSHOP` typing itself onto white. Starting the talk with the
   * same gesture makes the deck and the app one object. */
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
   * One sentence in the middle of an otherwise empty slide, before a
   * single definition. A show of hands tells both speakers whether the
   * next fifteen minutes are an introduction or a refresher — and it is
   * the moment the room does something instead of watching.
   *
   * Nothing else belongs on this slide. A second line would be read
   * while the first is still being answered. */
  {
    id: "ask",
    fragments: 1,
    render: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[160px]">
        <Rise i={0}>
          <p
            className="text-center"
            style={{
              fontSize: "var(--text-heading-page)",
              lineHeight: "var(--leading-heading-page)",
              letterSpacing: "var(--tracking-heading-page)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
              maxWidth: "1120px",
            }}
          >
            {ROOM_QUESTION}
          </p>
        </Rise>
      </div>
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
                    <IconBadge size={64}>
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

  /* 4 — What is a DTO ---------------------------------------------- *
   * The idea first, before any evidence. Three properties, and the
   * contract they describe standing next to them so the abstract line
   * and the concrete thing are read together.
   *
   * The card is `RegistrationResponse`, with task 5's own field list —
   * the room is looking at something they will write, not an example. */
  {
    id: "what-is-dto",
    fragments: 1,
    part: "dto",
    render: () => (
      <Body>
        <Eyebrow>DTO = Data Transfer Object</Eyebrow>
        <div className="mt-[10px]">
          <Title>What is a DTO?</Title>
        </div>
        <Fill>
          <div className="flex items-center justify-center gap-[64px]">
            <div className="flex w-[700px] flex-col gap-[28px]">
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
                    RegistrationResponse
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

  /* 5 — When a DTO is useful ---------------------------------------- *
   * One rule, then three concrete examples. The old version made the room
   * decode a full architecture before it knew what to look for; each row now
   * answers the same child-simple question: data is crossing a boundary, so
   * put a named DTO in the middle. */
  {
    id: "where",
    fragments: 1,
    part: "dto",
    render: () => (
      <Body>
        <Title>When do we use a DTO?</Title>
        <div className="mt-[14px]">
          <Lead>Use one whenever data crosses into or out of your code.</Lead>
        </div>
        <Fill>
          <div className="flex flex-col gap-[18px]">
            {BOUNDARIES.map((boundary, index) => (
              <Rise key={boundary.id} i={index}>
                <Card
                  style={{
                    minHeight: "104px",
                    padding: "var(--spacing-18) var(--spacing-22)",
                  }}
                >
                  <div className="flex items-center gap-[20px]">
                    <IconBadge size={52}>
                      {BOUNDARY_GLYPH[boundary.id]}
                    </IconBadge>
                    <div className="w-[250px] flex-none">
                      <LaneLabel text={boundary.label} />
                      <div className="mt-[4px]"><Caption>{boundary.note}</Caption></div>
                    </div>
                    <span style={{ color: "var(--color-text-subtle)" }}>→</span>
                    <div className="flex flex-1 items-center justify-center gap-[12px] rounded-[var(--radius-xl)] border border-[var(--color-border-accent)] bg-[var(--color-bg-accent-subtle)] px-[18px] py-[14px]">
                      <span style={{ color: "var(--color-text-accent)" }}><IconContract size={24} /></span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body-language)", color: "var(--color-text-accent)" }}>{boundary.contract}</span>
                    </div>
                    <span style={{ color: "var(--color-text-subtle)" }}>→</span>
                    <span className="w-[205px]" style={{ fontSize: "var(--text-body-question)", color: "var(--color-text-secondary)" }}>{boundary.to}</span>
                  </div>
                </Card>
              </Rise>
            ))}
          </div>
          <div className="mt-[30px]">
            <Rise i={4}>
              <Caption>
                The DTO is the labelled box in the middle. It says exactly what
                may cross the boundary.
              </Caption>
            </Rise>
          </div>
        </Fill>
      </Body>
    ),
  },

  /* 6 — Without / With a DTO --------------------------------------- *
   * Now the evidence, and only now — the room has the idea, so the JSON
   * is an argument rather than a puzzle.
   *
   * Three fragments. The whole row goes out through a boundary that is
   * not there; three of the fields turn out to be things nobody meant to
   * publish; then the contract does its job. The last transition is the
   * comparison, made as one movement instead of two pictures. */
  {
    id: "compare-dto",
    fragments: 3,
    part: "dto",
    render: (fragment) => (
      <Body>
        <Eyebrow>{fragment < 2 ? "Without a DTO" : "With a DTO"}</Eyebrow>
        <div className="mt-[10px]">
          <Title>
            {fragment < 2
              ? "The client sees everything"
              : "The client sees a contract"}
          </Title>
        </div>
        <Fill>
          <div className="flex items-center justify-center gap-[26px]">
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

  /* 7 — What is a Mapper ------------------------------------------- *
   * The second concept mirrors the first: the left side names the job in
   * plain verbs; the right side proves it with one before/after translation. */
  {
    id: "what-is-mapper",
    fragments: 1,
    part: "mapper",
    render: () => (
      <Body>
        <Eyebrow>Mapper = one place for data changes</Eyebrow>
        <div className="mt-[10px]">
          <Title>What is a Mapper?</Title>
        </div>
        <Fill>
          <div className="flex items-stretch justify-center gap-[56px]">
            <div className="flex w-[330px] flex-none flex-col justify-center gap-[18px]">
              {[
                [<IconTag size={26} />, "Rename", "user_name → userName"],
                [<IconTrim size={26} />, "Clean", "remove spaces, lowercase email"],
                [<IconCalendar size={26} />, "Convert", "text date → real date"],
              ].map(([icon, title, note], index) => (
                <Rise key={String(title)} i={index}>
                  <div className="flex min-h-[72px] items-center gap-[16px]">
                    <IconBadge size={52}>{icon as ReactNode}</IconBadge>
                    <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                      <span style={{ fontSize: "var(--text-heading-card)", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</span>
                      <span style={{ fontSize: "var(--text-body-small)", color: "var(--color-text-secondary)" }}>{note}</span>
                    </div>
                  </div>
                </Rise>
              ))}
            </div>
            <div className="flex flex-none items-stretch gap-[18px]">
              <Card
                style={{
                  width: "330px",
                  minHeight: "224px",
                  padding: "var(--spacing-22)",
                }}
              >
                <div className="flex flex-col gap-[8px]">
                  <Caption>before</Caption>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body-small)", lineHeight: "var(--leading-body-small)", color: "var(--color-text-muted)", whiteSpace: "pre" }}>
                    user_name: &quot;  Ada.Lovelace &quot;
                  </code>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body-small)", lineHeight: "var(--leading-body-small)", color: "var(--color-text-muted)", whiteSpace: "pre" }}>
                    email: &quot; ADA@EXAMPLE.TEST &quot;
                  </code>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body-small)", lineHeight: "var(--leading-body-small)", color: "var(--color-text-muted)", whiteSpace: "pre" }}>
                    birth_date: &quot;1815-12-10&quot;
                  </code>
                </div>
              </Card>
              <Station
                id="mapper"
                label="Mapper"
                sub="one clear place"
                icon={<IconMapper size={34} />}
                width={190}
                minHeight={224}
                lit
              />
              <Card
                style={{
                  width: "330px",
                  minHeight: "224px",
                  padding: "var(--spacing-22)",
                }}
                accent
              >
                <div className="flex flex-col gap-[8px]">
                  <Caption>after</Caption>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body-small)", lineHeight: "var(--leading-body-small)", color: "var(--color-text-accent)", whiteSpace: "pre" }}>
                    userName: &quot;ada.lovelace&quot;
                  </code>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body-small)", lineHeight: "var(--leading-body-small)", color: "var(--color-text-accent)", whiteSpace: "pre" }}>
                    email: &quot;ada@example.test&quot;
                  </code>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-body-small)", lineHeight: "var(--leading-body-small)", color: "var(--color-text-accent)", whiteSpace: "pre" }}>
                    birthDate: Date(1815-12-10)
                  </code>
                </div>
              </Card>
            </div>
          </div>
          <div className="mt-[30px]">
            <Rise i={3}>
              <Caption>
                A DTO names the shape. A Mapper changes data into that shape.
              </Caption>
            </Rise>
          </div>
        </Fill>
      </Body>
    ),
  },

  /* 8 — Six small jobs --------------------------------------------- *
   * The six jobs are named and given identities here, because the next
   * slide throws them across a codebase. Nothing is invented: the values
   * are the real legacy profile from exercise 02. */
  {
    id: "jobs",
    fragments: 1,
    part: "mapper",
    render: () => (
      <Body>
        <Title>A Mapper makes six small changes</Title>
        <div className="mt-[14px]">
          <Lead>Small transformations stay visible when they live in one place.</Lead>
        </div>
        <Fill>
          <div className="grid grid-cols-3 gap-[16px]">
            {MAPPER_JOBS.map((job, index) => (
              <Rise key={job.id} i={index}>
                <Card
                  style={{
                    minHeight: "92px",
                    padding: "var(--spacing-18)",
                  }}
                >
                  <div className="flex items-center gap-[14px]">
                    <IconBadge size={56}>{JOB_GLYPH[job.id]}</IconBadge>
                    <div className="flex flex-col gap-[2px]">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-heading-card)", fontWeight: 700, color: "var(--color-text-primary)" }}>{job.label}</span>
                      <Caption>one transformation</Caption>
                    </div>
                  </div>
                </Card>
              </Rise>
            ))}
          </div>
          <motion.div
            key="transforms"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={MORPH}
            className="mt-[34px] rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface-muted)] p-[var(--spacing-22)]"
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
                    fontSize: "var(--text-body-small)",
                    color: "var(--color-text-muted)",
                    minWidth: "300px",
                    whiteSpace: "pre",
                  }}
                >
                  {transform.from}
                </code>
                <span style={{ color: "var(--color-text-subtle)" }}>→</span>
                <code
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-body-small)",
                    color: "var(--color-text-accent)",
                  }}
                >
                  {transform.to}
                </code>
              </motion.div>
            ))}
          </motion.div>
        </Fill>
      </Body>
    ),
  },

  /* 9 — Where does this logic live --------------------------------- *
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
            <div className="flex justify-center gap-[22px]">
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
                      CreateUserRequestMapper
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

  /* 10 — The honest price ------------------------------------------ *
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
          <div className="flex justify-center gap-[24px]">
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

  /* 11 — The situation ---------------------------------------------- *
   * The brief for the exercises, and the slide issue #23 exists to make
   * necessary. Without it, "define `WelcomeEmail`" is a syntax puzzle;
   * with it, it is one step of replacing a registration system. The
   * caveat is not a footnote — the room has to know nothing is sent and
   * nothing is saved before it starts writing code that looks like it
   * would. */
  {
    id: "situation",
    fragments: 4,
    render: (fragment) => (
      <Body>
        <Eyebrow>Part 3 — Your exercises</Eyebrow>
        <div className="mt-[10px]">
          <Title>{STORY.headline}</Title>
        </div>
        <div className="mt-[14px]">
          <Lead>You will define the DTOs and write the Mappers that connect each system.</Lead>
        </div>
        <Fill>
          <div className="flex flex-col gap-[20px]">
            {STORY.steps.map((step, index) => (
              <motion.div
                key={step}
                animate={{
                  opacity: fragment >= index ? 1 : 0,
                  x: fragment >= index ? 0 : 40,
                }}
                initial={false}
                transition={MORPH}
                className="flex items-center gap-[24px]"
              >
                <IconBadge size={62}>
                  {
                    [
                      <IconServer key="s" size={28} />,
                      <IconDatabase key="d" size={28} />,
                      <IconMail key="m" size={28} />,
                      <IconBrowser key="b" size={28} />,
                    ][index]
                  }
                </IconBadge>
                <span
                  style={{
                    fontSize: "var(--text-body-lead)",
                    lineHeight: "var(--leading-body-lead)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {step}
                </span>
              </motion.div>
            ))}
          </div>
          <motion.div
            animate={{ opacity: fragment >= STORY.steps.length - 1 ? 1 : 0 }}
            initial={false}
            transition={{ ...MORPH, delay: 0.25 }}
            className="mt-[40px] flex items-center gap-[14px]"
          >
            <span style={{ color: "var(--color-text-accent)" }}>
              <IconShield size={24} />
            </span>
            <span
              style={{
                fontSize: "var(--text-body-question)",
                lineHeight: "var(--leading-body-question)",
                color: "var(--color-text-accent)",
                fontWeight: 500,
              }}
            >
              {STORY.caveat}
            </span>
          </motion.div>
        </Fill>
      </Body>
    ),
  },

  /* 12 — Questions --------------------------------------------------- *
   * One line, centred, nothing else. This is the pause before the room
   * takes over, and anything else on the wall would be something to read
   * instead of something to ask. */
  {
    id: "questions",
    fragments: 1,
    render: () => (
      <Body>
        <Fill>
          <Rise i={0}>
            <p
              className="text-center"
              style={{
                fontSize: "var(--text-heading-page)",
                lineHeight: "var(--leading-heading-page)",
                letterSpacing: "var(--tracking-heading-page)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              Do you have any questions?
            </p>
          </Rise>
        </Fill>
      </Body>
    ),
  },

  /* 13 — Join ------------------------------------------------------- *
   * The last thing on the wall, and the only slide the room has to act
   * on. The URL is spelled out at display size *and* offered as a code:
   * a QR nobody at the back can scan is decoration, and a URL nobody
   * wants to type is a barrier. Both, and the slide can stay up while
   * people get in.
   *
   * The Mapper box has been the deck's travelling companion since slide
   * 7; it does not appear here. This slide is the room's turn, not
   * ours. */
  {
    id: "join",
    fragments: 1,
    render: () => (
      <Body>
        <Title>Your turn</Title>
        <div className="mt-[14px]">
          <Lead>Open this, pick your language, and start with exercise 01.</Lead>
        </div>
        <Fill>
          <div className="flex items-center justify-center gap-[64px]">
            <Rise i={1}>
              <Card style={{ padding: "var(--spacing-20)" }}>
                <JoinQr size={300} />
              </Card>
            </Rise>
            <div className="flex flex-col gap-[30px]">
              <Rise i={2}>
                <a
                  href={JOIN_URL}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "40px",
                    lineHeight: 1.2,
                    letterSpacing: "-1px",
                    color: "var(--color-text-accent)",
                    textDecoration: "none",
                    fontWeight: 400,
                  }}
                >
                  workshop-dto-web
                  <span style={{ color: "var(--color-text-muted)" }}>
                    .onrender.com
                  </span>
                </a>
              </Rise>
              <Rise i={3}>
                <div className="flex items-center gap-[22px]">
                  <span
                    style={{
                      fontSize: "var(--text-body-lead)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Six exercises. Then three short questions.
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
              <Rise i={4}>
                <Caption>
                  No account, no install. The first load can take a moment —
                  the demo API wakes up.
                </Caption>
              </Rise>
            </div>
          </div>
        </Fill>
      </Body>
    ),
  },
];
