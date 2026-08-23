# workshop-dto — Visual Language

> A quiet, paper-white teaching surface with one loud moment. Enormous display type opens the
> workshop; from there the interface recedes into hairline-bordered white cards on a near-white
> canvas, and a single electric blue marks the only things the participant must notice — the current
> step, the code contract, and the action that checks their work.

**Theme:** light only
**Source of truth:** the Figma file `HAuazsHk1Uw3NPQoOdJmSW` (pages `🎨 Foundations`, `🧩 Components`,
`📄 Screens`). Every value below was measured from `reference/hero_section.png` and
`reference/task.png` and is bound as a Figma variable or style. `tokens.json` and `theme.css` are
generated views of the same set — change all three together, never one alone.

The system has two chromatic jobs and keeps them separate. **Accent Blue** (`#1e62fd`) is
*attention*: the active step, the ampersand in the wordmark, field contracts, exercise labels.
**Action Navy** (`#02205a`) is *commitment*: the primary button, and nothing else. Everything that is
neither is a neutral.

---

## Tokens — Colour

Colour is a two-layer system. **Primitives** are the raw values; nothing in a screen may reference
them directly except code syntax. **Semantic** tokens alias primitives and are the only names a
component or screen is allowed to bind.

### Primitives — Neutral

| Token | Value | Notes |
|-------|-------|-------|
| `neutral/black` | `#0a0a0a` | Display headlines, exercise titles, primary labels |
| `neutral/900` | `#131319` | Locked-step labels, code punctuation |
| `neutral/700` | `#373c46` | Long-form body copy |
| `neutral/600` | `#494a57` | Trailing metadata, inline code tags |
| `neutral/500` | `#66656e` | Editor gutter, chevrons, secondary glyphs |
| `neutral/400` | `#9aa0a6` | Disabled labels, lock glyphs, info glyph |
| `neutral/300` | `#dcdcde` | Card borders on the hero canvas, dashed connectors |
| `neutral/200` | `#ececee` | Card borders inside the app window |
| `neutral/100` | `#f6f6f6` | Hero page canvas |
| `neutral/50` | `#fafafa` | Recessed strips — hero cards, editor gutter and tab bar |
| `neutral/white` | `#ffffff` | Pure white, avatar and badge text |
| `neutral/app` | `#f9f8fa` | Viewport behind the app window |
| `neutral/surface` | `#fefefe` | The app window and every card inside it |
| `neutral/disabled` | `#e4e5e8` | Disabled button fill, avatar fill |

Two near-whites do the elevation work. `neutral/100` is the hero canvas and `neutral/50` sits on top
of it; inside the app, `neutral/app` is the viewport and `neutral/surface` sits on top. The pair is
always ~4 values apart — enough to read as a lift, never enough to read as a colour.

### Primitives — Chromatic

| Token | Value | Notes |
|-------|-------|-------|
| `blue/700` | `#0b3fd0` | Pressed accent |
| `blue/600` | `#1e62fd` | **Accent Blue** — the system's one attention colour |
| `blue/500` | `#5b8dfe` | Hover accent |
| `blue/300` | `#a8c2fd` | Decorative connector nodes |
| `blue/100` | `#dbe5fe` | Accent border on tinted surfaces |
| `blue/50` | `#eef1fd` | Accent wash behind icon badges |
| `navy/900` | `#02205a` | **Action Navy** — primary button only |
| `navy/800` | `#00267e` | Type names in code |
| `lavender/300` | `#cfd2ec` | Illustration tint |
| `lavender/100` | `#e6e8f7` | Illustration tint, lightest |

### Primitives — Code syntax

The only place primitives are bound directly, because syntax colour is not a UI role.

| Token | Value | Applies to |
|-------|-------|------------|
| `code/keyword` | `#5b21d6` | `export`, `type`, `class`, `def`, `public` |
| `code/type` | `#00267e` | Declared type and class names |
| `code/identifier` | `#131319` | Fields, variables |
| `code/comment` | `#7d7f8b` | `// TODO:` starter hints |
| `code/punctuation` | `#131319` | Braces, operators |
| `code/linenumber` | `#66656e` | Gutter numerals |

### Semantic

| Token | Aliases | Role |
|-------|---------|------|
| `bg/canvas` | `neutral/100` | Hero page background |
| `bg/app` | `neutral/app` | Viewport behind the app window |
| `bg/surface` | `neutral/surface` | App window, every card, editor body |
| `bg/surface-muted` | `neutral/50` | Recessed strips: gutter, tab bar, hero cards |
| `bg/accent-subtle` | `blue/50` | Icon badge wash |
| `bg/accent` | `blue/600` | Active step badge, active underline, brand dot |
| `bg/action` | `navy/900` | Primary button |
| `bg/disabled` | `neutral/disabled` | Disabled button |
| `text/primary` | `neutral/black` | Headlines, titles, active labels |
| `text/secondary` | `neutral/700` | Body copy |
| `text/subtle` | `neutral/500` | Gutter, chevrons, `WORKSHOP` eyebrow in the bar |
| `text/muted` | `neutral/400` | Disabled text, lock glyphs |
| `text/accent` | `blue/600` | `EXERCISE 01`, field chips, the `&` |
| `text/inverse` | `neutral/white` | Text on Action Navy and Accent Blue |
| `border/default` | `neutral/200` | Every border inside the app window |
| `border/strong` | `neutral/300` | Hero card borders, dashed connectors |
| `border/accent` | `blue/600` | Focus and selected outlines |

---

## Tokens — Typography

### Inter — the interface typeface · `--font-inter`

- **Source:** Google Fonts, `wght@400;500;600;700`, `display=swap`. SIL OFL — no licence note needed.
- **Weights in use:** 400 Regular, 500 Medium, 600 Semi Bold, 700 Bold.
- **Optical sizing:** `font-optical-sizing: auto` on `html`.
- **Numerals:** `font-variant-numeric: tabular-nums` globally, so before/after JSON panels and
  validation counters stay column-aligned.
- **Tracking is size-dependent and non-linear.** Inter ships loose at display sizes and needs heavy
  negative tracking to hold together, and a touch of positive tracking at caption sizes. Always take
  the value from the ramp below; a single uniform tracking breaks at one end of the scale.

> **Caveat worth knowing.** `reference/*.png` was rendered in a narrower system grotesque (metrics
> match Roboto). Inter is the specified typeface, so the ramp below tunes size and tracking to make
> Inter occupy the same footprint as the reference rather than switching fonts. This is why the
> display tracking looks extreme (−0.05em) — it is deliberate, not a typo.

### JetBrains Mono — the code typeface · `--font-mono`

Used for the editor, inline type names, and field-contract chips that quote code. The workshop is a
code-reading surface; a proportional font in the editor would misrepresent what participants type.
This is the one deliberate addition to a single-typeface system — do not extend it to UI labels.

### Type ramp

Every style below exists as a Figma text style of the same name.

| Style | Font | Size | Weight | Line height | Tracking | Used for |
|-------|------|------|--------|-------------|----------|----------|
| `Display/Hero` | Inter | 137 | 700 | 100% | −6.80px | `WORKSHOP` |
| `Display/Sub` | Inter | 100 | 700 | 100% | −4.58px | `DTO&Mapping` |
| `Heading/Page` | Inter | 52 | 700 | 110% | −2.20px | Exercise title |
| `Heading/Brand` | Inter | 26 | 700 | 120% | −0.60px | App bar wordmark |
| `Heading/Card` | Inter | 18 | 700 | 130% | −0.20px | `Your task` |
| `Body/Lead` | Inter | 22 | 400 | 164% | −0.30px | Hero lead paragraph |
| `Body/Question` | Inter | 19 | 400 | 145% | −0.50px | Exercise question line |
| `Body/Language` | Inter | 24 | 400 | 130% | −0.30px | Track card label |
| `Body/Default` | Inter | 16 | 400 | 144% | 0 | Selector label, generic body |
| `Body/Default Medium` | Inter | 16 | 500 | 144% | 0 | Secondary/disabled button label |
| `Body/Default Bold` | Inter | 16 | 700 | 144% | 0 | Primary button, active step |
| `Body/Small` | Inter | 15 | 400 | 153% | 0 | Intro paragraph, task sentence, file tab |
| `Body/Small Medium` | Inter | 15 | 500 | 150% | 0 | Step numerals, avatar initials |
| `Body/Compact` | Inter | 14 | 400 | 150% | −0.10px | Trailing metadata |
| `Body/Compact Bold` | Inter | 14 | 700 | 140% | −0.30px | Context panel row titles |
| `Body/Panel` | Inter | 12.5 | 400 | 150% | −0.30px | Context panel copy, validation note |
| `Label/Eyebrow` | Inter | 15 | 700 | 120% | +0.20px | Uppercase eyebrows and section labels |
| `Label/Caption` | Inter | 13 | 400 | 140% | +0.10px | Documentation captions |
| `Label/Caption Bold` | Inter | 13 | 700 | 140% | +0.10px | Documentation captions, emphasised |
| `Label/Field Chip` | Inter | 13 | 600 | 130% | −0.10px | Field contract chips |
| `Code/Editor` | JetBrains Mono | 14 | 400 | 186% | 0 | Editor body (26px line pitch) |
| `Code/Inline` | JetBrains Mono | 14 | 400 | 150% | 0 | Type names inside prose |
| `Code/Gutter` | JetBrains Mono | 13 | 400 | 200% | 0 | Line numbers |

---

## Tokens — Spacing, Radius, Layout

**Density:** compact. Content is dense inside a block; blocks are separated generously.

### Spacing scale

`2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 24 · 26 · 28 · 30 · 32 · 40 · 48 · 54 · 64 · 80`

Common values: `10` between chips, `12`–`14` between an icon and its label, `18`–`24` inside cards,
`26`–`30` between stacked blocks, `44`–`51` for the app window's left gutter.

### Radius

| Token | Value | Applies to |
|-------|-------|------------|
| `radius/sm` | 2px | Nothing yet — reserved |
| `radius/md` | 6px | Small inline surfaces |
| `radius/lg` | 8px | Buttons, field chips, icon buttons, language selector, lock badge |
| `radius/xl` | 12px | Cards: track picker, task brief, code editor |
| `radius/2xl` | 14px | App window, context panel, icon badges |
| `radius/full` | 9999px | Step badges, avatar, brand dot |

Nothing rectangular exceeds 14px. Roundness increases with the surface's size, not with its
importance.

### Layout

- **Screen frame:** 1672 × 941. Both screens use it.
- **Hero:** content starts at `x: 105`; the illustration occupies `x: 950 → 1672`, full-bleed
  vertically.
- **Exercise:** the app window is inset `9px` horizontally and `7px` vertically, `1653 × 924`.
  The app bar is `79px` tall, the stepper `87px`, and a `1px` divider at `x: 1047` splits the
  work column (left) from the context column (right).
- **Track cards:** `165px` tall, widths hug their content — `195 / 216 / 216 / 213` — with `27px`
  gaps.

---

## Elevation

Elevation is carried by surface contrast and hairline borders. Shadows exist but are almost
invisible by design and never substitute for a border.

| Style | Shadow | Used on |
|-------|--------|---------|
| `Elevation/Card` | `0 1 2 rgba(5,13,38,.04)` | Cards, if anything at all |
| `Elevation/Raised` | `0 4 12 -2 rgba(5,13,38,.06)`, `0 1 3 rgba(5,13,38,.04)` | Hovered card |
| `Elevation/Popover` | `0 12 32 -8 rgba(5,13,38,.12)`, `0 2 6 rgba(5,13,38,.05)` | Dropdowns |
| `Elevation/Layer 3D` | `0 28 48 -12 rgba(5,13,38,.14)`, `0 6 14 -4 rgba(5,13,38,.06)` | The DTO layer illustration |

A card on the canvas needs no shadow: `#fefefe` on `#f9f8fa` plus a `#ececee` hairline already reads
as lifted.

---

## Components

Each entry exists as a Figma component of the same name.

### Language Card — *variants: Java · Python · PHP · TypeScript*
The hero's track picker. `165px` tall, `radius/xl`, `bg/surface-muted` fill, `1px border/strong`.
Vertical stack: a `82 × 66` logo slot, `21px` gap, then a `Body/Language` label in `text/primary`.
Padding `28` top, `22` bottom. Widths hug the widest of logo or label, so the four cards are
deliberately uneven. Brand logos come from `icons/*.png` — never redraw them.

### Button — *variants: Primary · Secondary · Disabled*
`54px` tall, `radius/lg`, horizontal auto-layout with `26px` side padding and a `12px` gap around an
`18px` icon.
- **Primary** — `bg/action` fill, `text/inverse`, `Body/Default Bold`, leading play glyph. The only
  Action Navy surface in the product.
- **Secondary** — `bg/surface`, `1px border/default`, `text/primary`, `Body/Default Medium`, leading
  glyph.
- **Disabled** — `bg/disabled`, `text/muted`, trailing arrow. Reads as unavailable, not as an error.

### Field Chip
The field contract quoted from the task. Hug width, `28px` tall, `radius/lg`, `bg/surface`,
`1px border/default`, `Label/Field Chip` in `text/accent`, `10px` side padding. Chips sit in a
`10px`-gapped row and wrap.

### Step Item — *variants: Active · Locked*
- **Active** — `38px` `bg/accent` circle with `Body/Small Medium` in `text/inverse`, `14px` gap, label
  in `Body/Default Bold` `text/primary`.
- **Locked** — `bg/surface` circle with `1px border/default` and a `text/subtle` numeral, label in
  `Body/Default` `neutral/900`, then a `34px` `radius/lg` box holding a `17px` lock glyph in
  `text/muted`.

Locked steps unlock only when the previous task passes every check.

### Exercise Stepper
`87px` tall, `bg/surface`, `1px border/default` on the bottom edge only, `44px` left padding.
Step → `18px` → dashed connector (`1.5px`, `7/7` dash, `border/strong`) → step. A `179 × 3`
`bg/accent` bar is pinned to the bottom-left under the active step.

### App Bar
`79px` tall, `bg/surface`, hairline bottom border, `45px` left / `39px` right padding. Left: the
`Heading/Brand` wordmark, a `7px` `bg/accent` dot, and `WORKSHOP` in `Label/Eyebrow` `text/subtle`.
Right: Language Selector, Icon Button, Avatar with `26px` gaps.

### Language Selector
`207 × 47`, `radius/lg`, `bg/surface`, `1px border/default`. A `24px` track badge, the track name in
`Body/Default`, and a `20px` chevron in `neutral/500` pushed to the right edge.

### Avatar
`40px` `radius/full` circle, `bg/disabled`, initials in `Body/Small Medium` `text/subtle`.

### Icon Button
`40 × 40`, no fill, no border, `radius/lg`, a `22px` glyph in `neutral/900`. Used for the theme
toggle and the editor controls.

### Task Brief
`radius/xl` card, `bg/surface`, `1px border/default`, padding `23 / 26 / 23 / 19`. A `72px`
`radius/2xl` `bg/accent-subtle` square holds a `32px` accent glyph; `30px` gap; then a column of
`Your task` (`Heading/Card`), the instruction sentence (`Body/Small`, `text/secondary`, with the type
name switched to `Code/Inline` in `text/accent`), and the Field Chip row.

### Code Editor
`radius/xl`, `bg/surface`, `1px border/default`, clipped.
- **Tab bar** — `49px`, `bg/surface-muted`. The active tab is `bg/surface` with a right hairline and
  holds a `20px` track badge, the filename in `Body/Small`, and an `18px` close glyph. Sun and expand
  glyphs sit at the right edge in `neutral/500`.
- **Gutter** — `54px` wide, `bg/surface-muted`, right-aligned `Code/Gutter` numerals with `19px`
  right padding.
- **Body** — `Code/Editor` at a `26px` line pitch, `17px` left padding, coloured by the `code/*`
  tokens.

The editor is a mock. It never executes participant code — see the invariants in `CLAUDE.md`.

### Info Row
One row of the exercise context panel. `67px` tall, `bg/surface`, padding `14 / 12`. A `43px`
`radius/2xl` `bg/accent-subtle` badge with a `22px` accent glyph, `14px` gap, then a column of a
`Body/Compact Bold` title and `Body/Panel` copy in `text/secondary`. An optional trailing value sits
right-aligned in `Body/Compact`. Rows are separated by inset `1px border/default` dividers, not by
gaps.

---

## Screens

### `01 · Hero — Track Picker`
Eyebrow → display lockup → lead → picker label → four track cards, all left-aligned on a `105px`
margin, against a full-height illustration on the right. The `&` in `DTO&Mapping` is the only
coloured glyph in the type block.

### `02 · Exercise — Typed Request DTO`
App bar → stepper → two columns. Left: exercise label, title, question, intro, task brief, editor,
actions, validation note. Right: the DTO layer illustration above a context panel of four Info Rows.
The right column explains; the left column is where work happens. Never move an action into the
right column.

---

## Do's and Don'ts

### Do
- Bind `Semantic` tokens in components and screens; reach for `Primitives` only for code syntax.
- Keep Accent Blue for attention and Action Navy for the single primary action. One of each per view.
- Build elevation from surface contrast plus a `1px` hairline. Reach for a shadow only when a surface
  genuinely floats over content, like a dropdown.
- Take tracking from the ramp for the size you are using. Display sizes need roughly −0.05em.
- Let the four track cards be uneven. They hug content, and forcing a grid loses the reference's
  rhythm.
- Keep code in JetBrains Mono and everything else in Inter.
- Keep `font-optical-sizing: auto` and `font-variant-numeric: tabular-nums` on `html`.

### Don't
- Don't use Action Navy for anything but the primary button, and don't give a view two primary
  buttons.
- Don't introduce a third accent hue. Success, warning and error states are not yet defined — add
  them to this file before using them.
- Don't exceed `14px` radius on a rectangular surface.
- Don't put a drop shadow on a card that already has a border.
- Don't set the display styles at their nominal tracking; `Display/Hero` without −6.80px falls apart.
- Don't redraw the brand logos or the isometric DTO illustration. Both are assets: logos in
  `icons/`, illustrations cropped from `reference/`.
- Don't let the context panel grow an action. It is read-only supporting material.

---

## Agent Prompt Guide

**Quick colour reference**
- page background: `#f9f8fa` (app) / `#f6f6f6` (hero)
- card surface: `#fefefe`
- border: `#ececee` (in app) / `#dcdcde` (on hero canvas)
- primary text: `#0a0a0a`
- body text: `#373c46`
- muted text: `#9aa0a6`
- accent / attention: `#1e62fd`
- primary action: `#02205a`

**Example component prompts**

1. *Track card*: 165px tall, hug width, 12px radius, `#fafafa` fill, 1px `#dcdcde` border. Centred
   column: 82×66 logo slot, 21px gap, 24px Inter Regular label in `#0a0a0a`. Padding 28 top, 22
   bottom.
2. *Primary button*: 54px tall, 8px radius, `#02205a` fill, 26px side padding, 12px gap, 18px white
   play glyph, 16px Inter Bold white label. No shadow, no border.
3. *Field chip*: hug width, 28px tall, 8px radius, white fill, 1px `#ececee` border, 10px side
   padding, 13px Inter Semi Bold in `#1e62fd`.
4. *Active step*: 38px `#1e62fd` circle with white 15px Medium numeral, 14px gap, 16px Inter Bold
   label in `#0a0a0a`, and a 179×3 `#1e62fd` bar pinned to the bottom of the stepper.
5. *Context row*: 67px tall, white, 14px side padding. 43px 14px-radius `#eef1fd` badge with a 22px
   `#1e62fd` glyph, 14px gap, 14px Inter Bold title over 12.5px Inter Regular copy in `#373c46`.
   Inset 1px `#ececee` divider below.
