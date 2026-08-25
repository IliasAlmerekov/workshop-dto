/**
 * The deck's glyphs.
 *
 * `apps/web/src/components/ui/icons.tsx` is the workshop's icon family, traced
 * from the Figma library. It does not contain a browser, a database, a contract
 * or a question mark, because the app never needed them — so these are new. What
 * is *not* new is the drawing language: 24px box, `1.75px` stroke, round caps
 * and joins, `currentColor`, no fills. That is the app's stroke language copied
 * verbatim, so a glyph from either file can sit next to one from the other
 * without looking borrowed.
 *
 * Colour is always set by the caller with a token. A glyph that carries its own
 * hex cannot survive a themed surface.
 */

type IconProps = {
  size?: number;
  className?: string;
};

function box(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    "aria-hidden": true,
    focusable: "false" as const,
    className,
  };
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** The client. A browser window — what the participant's user actually holds. */
export function IconBrowser({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <rect x="2.5" y="4" width="19" height="16" rx="2.5" {...stroke} />
      <path d="M2.5 8.5h19" {...stroke} />
      <path d="M6 6.25h.01M8.5 6.25h.01" {...stroke} />
    </svg>
  );
}

/** The Entity. A database, because that is where the audience pictures it. */
export function IconDatabase({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" {...stroke} />
      <path d="M4.5 5.5v13c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-13" {...stroke} />
      <path d="M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3" {...stroke} />
    </svg>
  );
}

/** A DTO. A document with a short, deliberate list on it. */
export function IconContract({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path
        d="M6 2.75h7.5L19 8.25v13a1.5 1.5 0 0 1-1.5 1.5h-11a1.5 1.5 0 0 1-1.5-1.5V4.25a1.5 1.5 0 0 1 1.5-1.5Z"
        {...stroke}
      />
      <path d="M13.5 2.75v5.5H19" {...stroke} />
      <path d="M8.5 13h7M8.5 17h4.5" {...stroke} />
    </svg>
  );
}

/** The Mapper. Two lanes crossing — the one glyph that means "translate". */
export function IconMapper({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path d="M3 7h5.5c2 0 2.5 10 4.5 10H21" {...stroke} />
      <path d="M3 17h5.5c2 0 2.5-10 4.5-10H21" {...stroke} />
      <path d="M18.5 4.5 21 7l-2.5 2.5" {...stroke} />
      <path d="M18.5 14.5 21 17l-2.5 2.5" {...stroke} />
    </svg>
  );
}

/** The question put to the room. */
export function IconQuestion({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <circle cx="12" cy="12" r="9.25" {...stroke} />
      <path
        d="M9.25 9.25a2.75 2.75 0 1 1 3.9 2.5c-.75.35-1.15 1-1.15 1.85v.4"
        {...stroke}
      />
      <path d="M12 17.5h.01" {...stroke} />
    </svg>
  );
}

/** A hand going up. Used only on the opening question. */
export function IconHand({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path
        d="M8 12V4.75a1.75 1.75 0 0 1 3.5 0V11m0-1.25a1.75 1.75 0 0 1 3.5 0V12m0-1.5a1.75 1.75 0 0 1 3.5 0v4.75A6.75 6.75 0 0 1 11.75 22h-.5A6.75 6.75 0 0 1 4.5 15.25V13a1.75 1.75 0 0 1 3.5 0"
        {...stroke}
      />
    </svg>
  );
}

/** What must never cross the boundary. */
export function IconShield({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path
        d="M12 2.5 4.5 5.5v6c0 5 3.2 9 7.5 10.5 4.3-1.5 7.5-5.5 7.5-10.5v-6L12 2.5Z"
        {...stroke}
      />
      <path d="M9.25 12.25 11.5 14.5l3.5-4" {...stroke} />
    </svg>
  );
}

/** A field renamed. */
export function IconTag({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path
        d="M12.5 3H20a1 1 0 0 1 1 1v7.5a2 2 0 0 1-.6 1.4l-7.5 7.5a2 2 0 0 1-2.8 0l-6.5-6.5a2 2 0 0 1 0-2.8l7.5-7.5A2 2 0 0 1 12.5 3Z"
        {...stroke}
      />
      <path d="M16.75 7.25h.01" {...stroke} />
    </svg>
  );
}

/** Whitespace cut off. */
export function IconTrim({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <circle cx="6" cy="6" r="2.75" {...stroke} />
      <circle cx="6" cy="18" r="2.75" {...stroke} />
      <path d="M8.25 7.75 20 19M8.25 16.25 20 5" {...stroke} />
    </svg>
  );
}

/** Case normalised. */
export function IconCase({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path d="M2.75 18 7 6l4.25 12M4.4 14h5.2" {...stroke} />
      <path d="M14 18v-7.5M14 13a3 3 0 1 1 6 0v5" {...stroke} />
    </svg>
  );
}

/** Text becomes a real date. */
export function IconCalendar({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" {...stroke} />
      <path d="M3.5 10h17M8 3v4M16 3v4" {...stroke} />
      <path d="M8 14h.01M12 14h.01M16 14h.01" {...stroke} />
    </svg>
  );
}

/** Two values folded into one. */
export function IconMerge({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path d="M3 5h3.5c3 0 4 7 7 7H21" {...stroke} />
      <path d="M3 19h3.5c3 0 4-7 7-7" {...stroke} />
      <path d="M18 9l3 3-3 3" {...stroke} />
    </svg>
  );
}

/** A field deliberately left out. */
export function IconDrop({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path d="M4 7h16M9.5 7V4.5h5V7" {...stroke} />
      <path
        d="M5.75 7l.9 12.1A1.5 1.5 0 0 0 8.15 20.5h7.7a1.5 1.5 0 0 0 1.5-1.4L18.25 7"
        {...stroke}
      />
      <path d="M10 11v5.5M14 11v5.5" {...stroke} />
    </svg>
  );
}

/** The cost of an extra layer: more files. */
export function IconLayers({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path d="M12 2.5 21 7l-9 4.5L3 7l9-4.5Z" {...stroke} />
      <path d="M3 12l9 4.5L21 12" {...stroke} />
      <path d="M3 17l9 4.5L21 17" {...stroke} />
    </svg>
  );
}

/** Two places to keep in step. */
export function IconLink({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path d="M9.5 14.5 14.5 9.5" {...stroke} />
      <path
        d="M12.75 6.25 14.5 4.5a4.25 4.25 0 0 1 6 6l-1.75 1.75"
        {...stroke}
      />
      <path
        d="M11.25 17.75 9.5 19.5a4.25 4.25 0 0 1-6-6l1.75-1.75"
        {...stroke}
      />
    </svg>
  );
}

/** When the price is not worth paying. */
export function IconClock({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <circle cx="12" cy="12" r="9.25" {...stroke} />
      <path d="M12 7v5.25l3.25 2" {...stroke} />
    </svg>
  );
}

/** Only the chosen data travels. */
export function IconFilter({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path d="M3 5h18l-7 8.5v6l-4-2.25v-3.75L3 5Z" {...stroke} />
    </svg>
  );
}

/** Types declared, so mistakes surface early. */
export function IconType({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path d="M4 6.5V4.5h16v2M12 4.5V19.5M9 19.5h6" {...stroke} />
    </svg>
  );
}

/** No business logic inside. */
export function IconNoLogic({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <circle cx="12" cy="12" r="9.25" {...stroke} />
      <path d="M5.5 5.5l13 13" {...stroke} />
      <path d="M9 12h6" {...stroke} />
    </svg>
  );
}

/** A pencil — the participant's own turn. */
export function IconPencil({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path
        d="M4 20h4l11-11a2.83 2.83 0 0 0-4-4L4 16v4Z"
        {...stroke}
      />
      <path d="M14.5 5.5 18.5 9.5" {...stroke} />
    </svg>
  );
}

/** The list the deck opens with. */
export function IconList({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20" {...stroke} />
      <path d="M4 6.5h.01M4 12h.01M4 17.5h.01" {...stroke} />
    </svg>
  );
}

/** The gift at the end. Named, never explained. */
export function IconGift({ size = 24, className }: IconProps) {
  return (
    <svg {...box(size, className)}>
      <rect x="3.5" y="8.5" width="17" height="12.5" rx="1.5" {...stroke} />
      <path d="M3.5 13h17M12 8.5V21" {...stroke} />
      <path
        d="M12 8.5S10.5 3 8 3a2.5 2.5 0 0 0 0 5.5M12 8.5S13.5 3 16 3a2.5 2.5 0 0 1 0 5.5"
        {...stroke}
      />
    </svg>
  );
}
