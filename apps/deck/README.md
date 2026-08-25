# deck — the workshop's opening talk

Twelve slides for the ~15 minutes before the exercises, in the order
`docs/SPECIFICATION.md` §8 puts them.

The deck opens by asking the room something rather than telling it: two shows
of hands — *who has heard of a DTO, who has written a Mapper* — before a single
definition. That answer changes how the next fifteen minutes are pitched, and
it costs one slide. Only then the agenda, then part 1 (DTO), then part 2
(Mapper), then a hand-off to the app. Kamal presents part 1, Ilias part 2.

## Run it

```bash
pnpm dev:deck        # dev server, from the repo root
pnpm build:deck      # dist/index.html — one file, nothing external
pnpm typecheck:deck
```

`dist/index.html` is the deliverable. Both typefaces are inlined as data URIs
and no stylesheet, font or API is fetched at runtime, so the file plays from a
USB stick in a room with no network.

## Presenting

| Input | Effect |
| --- | --- |
| `→` `Space` `PageDown`, or a tap on the right of the slide | forward one step |
| `←` `PageUp`, or a tap on the left quarter | back one step |
| `Home` / `End` | first / last step |

A step is a slide *or* a fragment of one. Fragments exist where a block must not
be readable before it is spoken: the two questions to the room, the boundary
doing its work, the two comparisons, the transform list, and the three costs.

Turn on the OS reduced-motion setting to get a plain slide show: every morph
becomes an instant cut. That is the escape hatch if the room's hardware
struggles.

## How it is built

- **Design tokens come from the repo root.** `src/deck.css` imports
  `../../../theme.css` rather than restating any value, so the deck cannot drift
  from the site. DESIGN.md is the authority; two deliberate departures from it
  are commented where they happen — a dark `bg/code` surface under code
  (projected light-on-light code is unreadable), and chips and pipeline
  stations one rung up the type ramp (a wall is not a laptop).
- **The morph is `layoutId`, not a transition.** Framer Motion matches elements
  across slides by identity: `wordmark`, `part-dto`, `part-mapper`,
  `field-<name>`, `json-<name>`, `station-<name>`, `job-<name>`. An element
  without a `layoutId` is one the audience is meant to see appear. To change how
  something morphs, change what carries which id — not the easing.
- **Two motions, deliberately kept apart.** Ordinary blocks are *pushed* in from
  the direction of travel (`DirectionContext`, consumed by `Rise`), so pressing
  back visibly undoes rather than repeats. Morphing elements do not take that
  ride: Framer measures layout animations in viewport space, so a `layoutId`
  element inside a sliding parent would be measured against a moving frame and
  land wrong. The slide pushes; the morph travels.
- **Durations come from DESIGN.md.** A morph runs 1050ms on
  `cubic-bezier(0.22, 1, 0.36, 1)` — the site's own commit transition. The first
  pass used 620ms, the curtain's *exit* duration, which was the wrong number
  from the right file: a curtain lifting off a finished page can be brisk, a
  shape crossing a wall in front of a room cannot.
- **Glyphs are drawn, not installed.** `src/components/icons.tsx` follows the
  app's stroke language exactly — 24px box, `1.75px` round-cap stroke,
  `currentColor`, no fills — because `apps/web/src/components/ui/icons.tsx` had
  no browser, database, contract or question mark. No icon library is a
  dependency, and nothing carries its own colour.
- **Fixed stage, scaled to fit.** Slides are composed against 1600×900 and the
  whole frame is scaled to the display. The talk is given on a room's
  interactive whiteboard of unknown size; letterboxing is a better failure than
  a layout reflowing in front of an audience.
- **No invented data.** The JSON is the real body of
  `GET /api/demo/users/7/entity` (see `apps/api/src/Controller/DemoUserController.php`),
  and the raw form values are task 2's from `docs/SPECIFICATION.md` §6.2. All
  copy lives in `src/content.ts`.

## Scope

The deck stops at "your turn". The four exercises, the knowledge check and the
certificate belong to `apps/web` and are not duplicated here — the agenda
promises them, the app delivers them.
