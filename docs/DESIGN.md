# DESIGN.md — Visuelles Fundament „Data Transit Lab"

Dieses Dokument löst die in [SPECIFICATION.md](./SPECIFICATION.md) Abschnitt 18 bewusst offen gelassene Entscheidung ein: die konkrete visuelle Sprache, Farben und Typografie des Workshops. Es beschreibt das **bereits implementierte** Erscheinungsbild (Issues #1–#10) so genau, dass es als verbindlicher Vertrag für alle künftigen Komponenten gilt — insbesondere für die 3D-Datenpipeline aus Issue #12, die auf diesem Fundament aufsetzt, statt eigene Stile zu erfinden.

## 1. Visuelle These

**„Data Transit Lab"**: Der Workshop ist ein Labor, kein Marketing-Produkt. Die Oberfläche tritt zurück, damit Code und Lerninhalt die Aufmerksamkeit behalten (Spec 11: „Code und Lerninhalt bleiben visuell dominant"). Daraus folgen drei Leitsätze:

1. **Ruhige Basis, punktuelle Betonung.** Der Hintergrund ist ein neutrales, warmes Hellgrau (`--background: #f4f4f5`) statt reinem Weiß oder Dunkelblau — es wirkt wie ein Arbeitstisch, nicht wie eine Bühne. Akzentfarbe (Blau) wird sparsam eingesetzt: für die eine primäre Aktion pro Ansicht, für Status und für den Ampersand im Logo.
2. **Glas statt Beton.** Wiederkehrende Motive (die isometrische Layer-Stack-Grafik, spätere 3D-Objekte) nutzen halbtransparente „Glas"-Flächen (`--glass-from`, `--glass-to`, `--glass-edge`, `--glow`) statt harter Vollflächen — die Datenpipeline soll durchscheinend und leicht wirken, nicht wie festes Gerät.
3. **Text ist die Benutzeroberfläche.** Erklärungen, Feedback und Statusmeldungen sind immer ausformulierter Text, nie nur ein Icon oder eine Farbe (siehe Abschnitt 6). Das ist zugleich Barrierefreiheits- und Lernprinzip: Ein Junior-Entwickler soll verstehen, *warum* etwas grün oder rot ist.

## 2. Typografie

| Rolle | Familie | Herkunft |
|---|---|---|
| Fließtext, UI | Inter | lokal selbst gehostet (kein externer Netzwerk-Request zur Laufzeit, siehe Abschnitt 8) |
| Code, Editor-Zeilennummern | JetBrains Mono | lokal selbst gehostet |
| Fallback | `system-ui, -apple-system, sans-serif` bzw. `ui-monospace, SFMono-Regular, monospace` | greift, falls Inter bzw. JetBrains Mono nicht lädt |

Skala (Tailwind-Utility-Klassen, gemessen an der tatsächlichen Nutzung im Code):

| Klasse | Einsatz |
|---|---|
| `text-xs` | Eyebrow-Labels (uppercase, tracking-wide), Badges, Zeitangaben |
| `text-sm` | Standard-UI-Text, Buttons, Beschreibungen — die mit Abstand häufigste Größe |
| `text-base` / `text-lg` | Hervorgehobene Absätze, Zwischenfragen |
| `text-xl` / `text-2xl` | Abschnitts-Überschriften (`h2`) |
| `text-4xl` bis `text-[2.75rem]` | Seiten-/Aufgaben-Überschriften (`h1`) |

Codeblöcke: `13px`/`22px` Zeilenhöhe, `tab-size: 2`, `white-space: pre` (siehe `.code-layer` in `globals.css` — bewusst kein Zeilenumbruch, damit die Zeilennummern-Gutter synchron bleibt; lange Zeilen scrollen horizontal).

## 3. Farbpalette

Alle Farben sind CSS-Custom-Properties in `apps/web/src/app/globals.css`, hell **und** dunkel definiert. Es gibt keine hartkodierten Hex-Werte in Komponenten — jede Komponente referenziert ausschließlich diese Tokens (Ausnahme: die Tailwind-Skala `amber-*` für Warnzustände, siehe Abschnitt 6).

| Token | Hell | Dunkel | Zweck |
|---|---|---|---|
| `--background` | `#f4f4f5` | `#09090b` | Seitenhintergrund |
| `--surface` / `--surface-raised` | `#ffffff` | `#131316` / `#18181b` | Karten, Panels |
| `--foreground` | `#09090b` | `#fafafa` | Primärtext |
| `--muted` | `#6b6b76` | `#a1a1aa` | Sekundärtext, Beschreibungen |
| `--border` | `#e4e4e7` | `#27272a` | Kartenrahmen, Trenner |
| `--accent` | `#2563eb` | `#3b82f6` | Text/Rahmen auf `--background`/`--surface`, Fokusring |
| `--accent-solid` | `#2563eb` | `#2f6fe0` | Hintergrund gefüllter Buttons (mit `--accent-foreground`-Text) |
| `--accent-soft` | `#eff4ff` | `rgba(59,130,246,.14)` | Hintergrund für „sicher"/aktiv/erfolgreich |
| `--accent-foreground` | `#ffffff` | `#ffffff` | Text auf `--accent-solid`-Flächen |
| `--glass-from/to/edge`, `--glow` | s. Datei | s. Datei | Isometrische/3D-Flächen |
| `--code-bg` | `#ffffff` | `#131316` | Editor-Hintergrund |
| `--shadow-sm/--shadow/--shadow-lg` | s. Datei | s. Datei | Erhabene Flächen, gestaffelt nach Wichtigkeit |
| `--syntax-*` | s. Datei | s. Datei | Manuelle Syntax-Highlighting-Farben (Platzhalter-Editor) |

Zusätzlich, **nicht** als eigenes Token, sondern bewusst über Tailwinds `amber-500`-Skala: Warn-/Fehlerfarbe (siehe Abschnitt 6). Der Theme-Wechsel wird per `data-theme`-Attribut auf `<html>` gesteuert und vor dem ersten Render per Inline-Skript gesetzt (`THEME_INIT_SCRIPT`), um einen Flackerübergang zu vermeiden.

**Kontrast-Korrekturen (issue #13):** Zwei Token-Werte wurden gegenüber der ursprünglichen Fassung angepasst, nachdem eine WCAG-AA-Prüfung (4.5:1 für normalen Text) reale Verstöße fand:
- `--muted` (hell): `#71717a` auf `--background` erreichte nur 4.40:1. Auf `#6b6b76` abgedunkelt → 4.79:1 auf `--background`, 5.26:1 auf `--surface`.
- `--accent-solid` (neu, dunkel `#2f6fe0`): Weißer Button-Text auf dem alten `--accent` (`#3b82f6`) erreichte im Dark Mode nur 3.68:1. `--accent` selbst blieb unverändert (als Text-/Rahmenfarbe auf `--background` bereits 5.41:1) — gefüllte Buttons verwenden seitdem `--accent-solid` statt `--accent` als Hintergrund.

## 4. Abstände und Radien

Konsistente Tailwind-Skalen, keine Sonderwerte außer wo explizit begründet:

- **Innenabstand:** Karten `p-4`–`p-6`, Buttons `px-4 py-2` (sekundär) bis `px-5 py-3` (primär).
- **Abstand zwischen Elementen:** `gap-2`/`gap-3`/`gap-4` innerhalb einer Komponente, `gap-6`/`gap-8` zwischen Abschnitten, `gap-12`/`gap-14` zwischen Seitenblöcken (z. B. `/story`).
- **Radien:** `rounded-lg` (Buttons, kleinere Karten) und `rounded-xl` (Panels, größere Karten) dominieren; `rounded-full` ausschließlich für Icon-Buttons, Avatare und Badges; `rounded-md` für kleinere eingebettete Elemente (Code-Zitate, Chips).

## 5. Layout-Muster

| Muster | Beispiel | Beschreibung |
|---|---|---|
| Zentrierter Lesefluss | `/story`, `CompletionScreen` | `max-w-3xl mx-auto`, ein Textfluss, keine Seitenleiste |
| Zwei-Spalten-Arbeitsbereich | `/workshop` (aktive Aufgabe) | `lg:grid-cols-[minmax(0,1fr)_460px]` — Editor links, Kontext-Sidebar rechts; unterhalb `lg` (1024px) stapelt sich die Sidebar unter den Editor |
| Kartenraster | Sprachwahl, Begriffs-Definitionen, Vorteile/Nachteile | `sm:grid-cols-2` bzw. `md:grid-cols-2`, einspaltig darunter |
| Persistenter Header | `WorkshopHeader` | Sprache, Reset, Theme, Avatar — auf jeder `/workshop`-Unteransicht sichtbar, auch auf dem Abschluss-Screen |

Geprüfte Breiten (Abschnitt 7 der Akzeptanzkriterien): **1280px** (üblicher Laptop) und **768px** (Tablet, Hoch- wie Querformat-Breite). Beide wurden für Landing, Aufgaben-Ansicht, Story-Seite und Abschluss-Screen visuell verifiziert — kein horizontales Scrollen, keine abgeschnittenen Inhalte, Kartenraster fallen korrekt auf eine Spalte zurück.

## 6. Komponentenzustände — nie nur Farbe

Jeder Zustand unten wurde daraufhin geprüft, dass er **mindestens zwei** unabhängige Signale trägt (Farbe + Form/Text/natives Attribut), damit er ohne Farbwahrnehmung verständlich bleibt:

| Zustand | Farbe | Zusätzliches Signal |
|---|---|---|
| **Fokus** | Blauer Outline-Ring (`--accent`) | `outline: 2px solid`, `outline-offset: 2px` — geometrisch, nicht nur Farbe; gilt global über `:focus-visible` |
| **Erfolg / richtig** | Akzentfarbe/-fläche | `✓`-Glyphe vor dem Text (`CheckGlyph`, `KnowledgeCheck`, `FlowDiagram`-Boxen) |
| **Warnung / Achtung** | Amber (`amber-500`-Skala) | `!`- oder `⚠`-Glyphe vor dem Text, plus ausformulierter Grund im Fließtext (nie nur eine rote Box) |
| **Gesperrt** | Gedämpfte Fläche/Text | Eigenes Schloss-Icon (`Stepper`) — kein Zustand hängt an Farbe allein |
| **Ladend** | — | Eigener Text „Loading exercise…" / „Loading editor…"; kein reiner Spinner ohne Beschriftung |
| **Deaktiviert** | Gedämpfte Fläche/Text | Natives `disabled`-Attribut (Screenreader- und Tastatur-Semantik unabhängig vom visuellen Stil) |

Diese Tabelle ist eine Regel, keine Bestandsaufnahme: Jede neue Komponente, die einen dieser Zustände einführt, muss beide Spalten erfüllen. Beispiel für eine nachträgliche Korrektur nach dieser Regel: Die Fluss-Diagramm-Boxen (`FlowDiagram.tsx`) trugen ursprünglich nur farbliche Unterscheidung zwischen „normal"/„Warnung"/„sicher" — sie tragen jetzt zusätzlich eine `⚠`- bzw. `✓`-Glyphe direkt in der Box.

## 7. Reduced Motion und WebGL-Fallback

Seit Issue #12 hat die Aufgaben-Seitenleiste eine echte R3F-/Drei-Pipeline (`DataTransitPipeline.tsx` → `three/DataPipelineScene.tsx`), die den `IsometricStack`-Fallback ersetzt, wenn der Browser sie unterstützt. Die Regeln unten sind kein Vorgriff mehr, sondern beschreiben die tatsächliche Umsetzung:

1. `prefers-reduced-motion: reduce` wird respektiert — `canRender3DPipeline()` (`lib/three/capabilities.ts`) prüft das explizit und liefert in dem Fall den 2D-Fallback, nicht eine „weniger bewegte" 3D-Variante. Der zusätzliche kleine GSAP-Übergang der Seitenleisten-Infobox (`ExerciseSidebar.tsx`) prüft dieselbe Präferenz separat und unterbleibt dann ganz — inklusive des `import("gsap")`-Aufrufs selbst.
2. Der **vollständige 2D-Fallback ohne WebGL** ist die tatsächliche erste Bildschirmausgabe für jeden Besuch: `DataTransitPipeline` rendert serverseitig und beim ersten Client-Paint immer `IsometricStack`, bevor der Client-seitige Fähigkeitscheck greift — kein Hydration-Mismatch, keine verzögerte Kerninhalts-Anzeige.
3. Keine Animation blockiert Editor oder Navigation — verifiziert live: Task-Wechsel, Hinweise und `Insert solution` bleiben während laufender Pipeline-Übergänge uneingeschränkt bedienbar.
4. Schwere Module laden dynamisch und ausschließlich im fähigen Zweig: `three`, `@react-three/fiber`, `@react-three/drei` und `gsap` werden nur bei bestätigter Fähigkeit per `import()` nachgeladen (verifiziert im Produktions-Build: der ~1 MB schwere 3D-Chunk taucht in `/workshop`s eagerem Skript-Manifest nicht auf, ebenso wenig `gsap`s ~70 KB).
5. Adaptive Qualität: begrenzter `dpr` (`[1, 1.75]`), `powerPreference: "low-power"`, `frameloop="demand"` nach einer kurzen Einschwingphase (siehe Punkt 6).
6. **Kein Dauer-Rendering im Leerlauf**: Der Canvas rendert nur bei tatsächlicher Änderung. Eine Besonderheit war hier zu lösen — siehe „Postprocessing" unten.

**Postprocessing:** Die Workshop-Seitenleiste bleibt bei ihrer sparsamen nativen Three.js-Beleuchtung. Die große Hero-Szene aus Figma-Knoten `41:3` verwendet dagegen eine separat verifizierte `@react-three/postprocessing`-Kette mit subtilen Bloom-, Depth-of-Field- und Chromatic-Aberration-Werten. Bloom greift nur Spitzenlichter; die Fokusspanne hält Kanten und Beschriftungen lesbar.

## 8. Asset-Herkunft und Lizenzregeln

| Asset-Typ | Stand | Regel für künftige Assets |
|---|---|---|
| Schriften | Inter und JetBrains Mono, lokal selbst gehostet; keine Laufzeit-Anfrage an einen externen Font-CDN | Neue Schriften ebenfalls lokal versionieren und lizenzieren |
| Icons | UI-Icons bleiben Inline-SVG; die vier Markenlogos der Sprachkarten sind exakte, lokal versionierte Figma-PNG-Exporte | Neue Markenassets nicht nachzeichnen; Herkunft und Lizenz dokumentieren |
| PBR-Materialien | Workshop-Pipeline: `meshStandardMaterial`/`meshPhysicalMaterial`; Hero: Drei `MeshTransmissionMaterial` als milchiges Resin mit Transmission, IOR, reduziertem Clearcoat, gleichmäßiger Roughness und lokaler 1K-Normal-Karte „Glass Frosted 001" von 3DTextures.me/Katsukagi, CC0 | Neue PBR-Texturen lokal versionieren und hier lizenzieren |
| HDRI-Umgebungslicht | Hero: lokales `studio_small_08_1k.hdr`, Poly Haven „Studio Small 08", CC0. Die Workshop-Seitenleiste nutzt weiterhin prozedurale Lightformer | Keine Drittanbieter-CDN-Aufrufe zur Laufzeit; neue HDRIs lokal versionieren und Lizenz hier ergänzen |

## 9. Prüfung dieses Fundaments

- Gelebt und stichprobenartig auf Konsistenz geprüft in: Landing (`/`), Story (`/story`), Demo (`/demo`), Workshop-Aufgabenansicht und Abschluss-Screen (`/workshop`).
- Responsiv geprüft bei 1280px (Laptop) und 768px (Tablet) — siehe Abschnitt 5.
- Zustands-Regel (Abschnitt 6) geprüft gegen alle bestehenden Status-tragenden Komponenten; eine Lücke (Fluss-Diagramm-Boxen) gefunden und behoben.
- Die 3D-Pipeline der Aufgaben-Seitenleiste (Abschnitt 7) wurde nicht nur gebaut, sondern in einem echten Browser gegen echte Pixel verifiziert (`readPixels`) — reine Sichtprüfung hätte ihren historischen leeren-Canvas-Fehler durch `EffectComposer` nicht zuverlässig von einem echten, aber unauffälligen Rendering unterschieden. Die separate Hero-Pipeline verwendet ihre eigene verifizierte Postprocessing-Kette.
- Ein zweiter echter Bug wurde bei der Integration gefunden und behoben: Die Seitenleiste hob in `ExerciseSidebar.tsx` immer fest „Request DTO" hervor, unabhängig von der aktiven Aufgabe — die neue `stackLayerForTask()`-Zuordnung (`lib/workshop/stackLayer.ts`) betrifft sowohl den 2D- als auch den 3D-Pfad.
