/**
 * The workshop's icon family, traced from the Figma library's exported SVGs
 * (`Icon/*` in `HAuazsHk1Uw3NPQoOdJmSW`). Path geometry, viewBox and the
 * 1.75px round-cap stroke are copied verbatim from those exports — nothing
 * here is redrawn by hand.
 *
 * The one change from the raw export: Figma bakes a literal colour into every
 * stroke (`#66656E`, `#9AA0A6`, `white`). That cannot survive a dark theme or
 * a button's disabled state, so stroke and fill bind to `currentColor` and the
 * caller sets the colour with a token. Sizes default to each icon's own Figma
 * size and stay overridable, since the same glyph appears at 17–32px.
 */

type IconProps = {
  size?: number;
  className?: string;
};

function svgProps(size: number, box: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: `0 0 ${box} ${box}`,
    fill: "none" as const,
    "aria-hidden": true,
    focusable: "false" as const,
    className,
  };
}

/** Shared by every stroked glyph in the set — one stroke language, per DESIGN.md. */
const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** `Icon/play` — the Check solution button's leading glyph. Solid, not stroked. */
export function IconPlay({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, 18, className)}>
      <path d="M4.5 2.25L15 9L4.5 15.75V2.25Z" fill="currentColor" />
    </svg>
  );
}

/** `Icon/lightbulb` — Show hint. */
export function IconLightbulb({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, 18, className)}>
      <path
        d="M11.25 10.5C11.4 9.75 11.775 9.225 12.375 8.625C13.125 7.95 13.5 6.975 13.5 6C13.5 4.80653 13.0259 3.66193 12.182 2.81802C11.3381 1.97411 10.1935 1.5 9 1.5C7.80653 1.5 6.66193 1.97411 5.81802 2.81802C4.97411 3.66193 4.5 4.80653 4.5 6C4.5 6.75 4.65 7.65 5.625 8.625C6.15 9.15 6.6 9.75 6.75 10.5"
        {...stroke}
      />
      <path d="M6.75 13.5H11.25" {...stroke} />
      <path d="M7.5 16.5H10.5" {...stroke} />
    </svg>
  );
}

/** `Icon/arrow-right` — Continue. */
export function IconArrowRight({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, 18, className)}>
      <path d="M3.75 9H14.25" {...stroke} />
      <path d="M9 3.75L14.25 9L9 14.25" {...stroke} />
    </svg>
  );
}

/** `Icon/clipboard-list` — the task brief's goal badge. */
export function IconClipboardList({ size = 32, className }: IconProps) {
  return (
    <svg {...svgProps(size, 32, className)}>
      <path
        d="M20 2.66667H12C11.2636 2.66667 10.6667 3.26362 10.6667 4V6.66667C10.6667 7.40305 11.2636 8 12 8H20C20.7364 8 21.3333 7.40305 21.3333 6.66667V4C21.3333 3.26362 20.7364 2.66667 20 2.66667Z"
        {...stroke}
      />
      <path
        d="M21.3333 5.33333H24C24.7072 5.33333 25.3855 5.61428 25.8856 6.11438C26.3857 6.61448 26.6667 7.29276 26.6667 8V26.6667C26.6667 27.3739 26.3857 28.0522 25.8856 28.5523C25.3855 29.0524 24.7072 29.3333 24 29.3333H8C7.29276 29.3333 6.61448 29.0524 6.11438 28.5523C5.61428 28.0522 5.33333 27.3739 5.33333 26.6667V8C5.33333 7.29276 5.61428 6.61448 6.11438 6.11438C6.61448 5.61428 7.29276 5.33333 8 5.33333H10.6667"
        {...stroke}
      />
      <path d="M16 14.6667H21.3333" {...stroke} />
      <path d="M16 21.3333H21.3333" {...stroke} />
      <path d="M10.6667 14.6667H10.68" {...stroke} />
      <path d="M10.6667 21.3333H10.68" {...stroke} />
    </svg>
  );
}

/** `Icon/lock` — a stepper step that has not unlocked yet. */
export function IconLock({ size = 17, className }: IconProps) {
  return (
    <svg {...svgProps(size, 17, className)}>
      <path
        d="M13.4583 7.79167H3.54167C2.75926 7.79167 2.125 8.42593 2.125 9.20833V14.1667C2.125 14.9491 2.75926 15.5833 3.54167 15.5833H13.4583C14.2407 15.5833 14.875 14.9491 14.875 14.1667V9.20833C14.875 8.42593 14.2407 7.79167 13.4583 7.79167Z"
        {...stroke}
      />
      <path
        d="M4.95833 7.79167V4.95833C4.95833 4.01902 5.33147 3.11819 5.99566 2.454C6.65986 1.78981 7.56069 1.41667 8.5 1.41667C9.43931 1.41667 10.3401 1.78981 11.0043 2.454C11.6685 3.11819 12.0417 4.01902 12.0417 4.95833V7.79167"
        {...stroke}
      />
    </svg>
  );
}

/** `Icon/maximize` — the editor tab bar's expand control. */
export function IconMaximize({ size = 19, className }: IconProps) {
  return (
    <svg {...svgProps(size, 19, className)}>
      <path d="M11.875 2.375H16.625V7.125" {...stroke} />
      <path d="M7.125 16.625H2.375V11.875" {...stroke} />
      <path d="M16.625 2.375L11.0833 7.91667" {...stroke} />
      <path d="M2.375 16.625L7.91667 11.0833" {...stroke} />
    </svg>
  );
}

/** `Icon/x` — collapses the expanded editor. */
export function IconX({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, 18, className)}>
      <path d="M13.5 4.5L4.5 13.5" {...stroke} />
      <path d="M4.5 4.5L13.5 13.5" {...stroke} />
    </svg>
  );
}

/** `Icon/chevron-down` — the track selector's trailing glyph. */
export function IconChevronDown({ size = 20, className }: IconProps) {
  return (
    <svg {...svgProps(size, 20, className)}>
      <path d="M5 7.5L10 12.5L15 7.5" {...stroke} />
    </svg>
  );
}

/** `Icon/sun` — the app bar's theme toggle in its dark-theme state. */
export function IconSun({ size = 19, className }: IconProps) {
  return (
    <svg {...svgProps(size, 19, className)}>
      <path
        d="M9.5 12.6667C11.2489 12.6667 12.6667 11.2489 12.6667 9.5C12.6667 7.7511 11.2489 6.33333 9.5 6.33333C7.7511 6.33333 6.33333 7.7511 6.33333 9.5C6.33333 11.2489 7.7511 12.6667 9.5 12.6667Z"
        {...stroke}
      />
      <path d="M9.5 1.58333V3.16667" {...stroke} />
      <path d="M9.5 15.8333V17.4167" {...stroke} />
      <path d="M3.90292 3.90292L5.01917 5.01917" {...stroke} />
      <path d="M13.9808 13.9808L15.0971 15.0971" {...stroke} />
      <path d="M1.58333 9.5H3.16667" {...stroke} />
      <path d="M15.8333 9.5H17.4167" {...stroke} />
      <path d="M5.01917 13.9808L3.90292 15.0971" {...stroke} />
      <path d="M15.0971 3.90292L13.9808 5.01917" {...stroke} />
    </svg>
  );
}

/** `Icon/moon` — the app bar's theme toggle in its light-theme state. */
export function IconMoon({ size = 22, className }: IconProps) {
  return (
    <svg {...svgProps(size, 22, className)}>
      <path
        d="M11 2.75C9.90598 3.84402 9.29137 5.32782 9.29137 6.875C9.29137 8.42218 9.90598 9.90598 11 11C12.094 12.094 13.5778 12.7086 15.125 12.7086C16.6722 12.7086 18.156 12.094 19.25 11C19.25 12.6317 18.7661 14.2267 17.8596 15.5835C16.9531 16.9402 15.6646 17.9976 14.1571 18.622C12.6496 19.2464 10.9908 19.4098 9.39051 19.0915C7.79016 18.7732 6.32015 17.9874 5.16637 16.8336C4.01259 15.6798 3.22685 14.2098 2.90852 12.6095C2.59019 11.0092 2.75357 9.35035 3.37799 7.84286C4.00242 6.33537 5.05984 5.0469 6.41655 4.14038C7.77325 3.23385 9.3683 2.75 11 2.75Z"
        {...stroke}
      />
    </svg>
  );
}

/** `Icon/circle-check` — a passing check or verdict. Outlined ring, stroked tick. */
export function IconCircleCheck({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, 18, className)}>
      <path d="M16.5 9a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" {...stroke} />
      <path d="M6 9.15 8.1 11.25 12.3 6.9" {...stroke} />
    </svg>
  );
}

/** `Icon/circle-x` — a failing check. Outlined ring, stroked cross. */
export function IconCircleX({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, 18, className)}>
      <path d="M16.5 9a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" {...stroke} />
      <path d="M11.25 6.75 6.75 11.25" {...stroke} />
      <path d="M6.75 6.75l4.5 4.5" {...stroke} />
    </svg>
  );
}

/** The failed verdict's badge: a solid disc carrying an inverse cross. */
export function IconXOnDisc({ size = 32, className }: IconProps) {
  return (
    <svg {...svgProps(size, 32, className)}>
      <circle cx="16" cy="16" r="16" fill="currentColor" />
      <path
        d="M20.5 11.5 11.5 20.5M11.5 11.5l9 9"
        stroke="var(--status-foreground)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** `Icon/terminal` — the validation output panel's header badge. */
export function IconTerminal({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, 18, className)}>
      <path
        d="M14.25 2.25H3.75c-.83 0-1.5.67-1.5 1.5v10.5c0 .83.67 1.5 1.5 1.5h10.5c.83 0 1.5-.67 1.5-1.5V3.75c0-.83-.67-1.5-1.5-1.5Z"
        {...stroke}
      />
      <path d="M5.85 7.05 7.8 9l-1.95 1.95" {...stroke} />
      <path d="M9.9 11.1h2.7" {...stroke} />
    </svg>
  );
}

/** `Icon/chevron-up` — collapses the guidance section. */
export function IconChevronUp({ size = 18, className }: IconProps) {
  return (
    <svg {...svgProps(size, 18, className)}>
      <path d="M4.5 11.25 9 6.75l4.5 4.5" {...stroke} />
    </svg>
  );
}

/**
 * `Icon/rotate-ccw` — Reset workshop. Not in the Figma library, so it is drawn
 * on the same 22px grid and stroke language as the exported set: a full
 * counter-clockwise arc broken at the top-left, with the arrow head closing
 * back onto the arc's own start point rather than floating beside it.
 */
export function IconRotateCcw({ size = 22, className }: IconProps) {
  return (
    <svg {...svgProps(size, 22, className)}>
      <path
        d="M3.667 11a7.333 7.333 0 1 0 2.148-5.185L3.667 7.964"
        {...stroke}
      />
      <path d="M3.667 3.667v4.297h4.296" {...stroke} />
    </svg>
  );
}

/**
 * `Icon/spinner` — the stage a staged check run is currently on.
 *
 * A 270° arc rather than a ring with a gap, so the rotation reads at 14px.
 * The spin lives in `globals.css` (`.check-run-spinner`) with the rest of the
 * app's motion, where `prefers-reduced-motion` can switch it off.
 */
export function IconSpinner({ size = 16, className }: IconProps) {
  return (
    <svg {...svgProps(size, 18, className)}>
      <path d="M9 1.5a7.5 7.5 0 1 1-7.5 7.5" {...stroke} />
    </svg>
  );
}

/** `Icon/circle-dashed` — a stage still queued, drawn as an unfilled outline. */
export function IconCircleDashed({ size = 16, className }: IconProps) {
  return (
    <svg {...svgProps(size, 18, className)}>
      <path
        d="M16.5 9a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
        {...stroke}
        strokeDasharray="2.6 2.9"
      />
    </svg>
  );
}
