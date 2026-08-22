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
| Fließtext, UI | Geist Sans | `next/font/google`, selbst gehostet über Next.js (kein externer Netzwerk-Request zur Laufzeit, siehe Abschnitt 8) |
| Code, Editor-Zeilennummern | Geist Mono | `next/font/google`, ebenso selbst gehostet |
| Fallback | `system-ui, -apple-system, sans-serif` bzw. `ui-monospace, SFMono-Regular, monospace` | greift, falls Geist nicht lädt |

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
| `--muted` | `#71717a` | `#a1a1aa` | Sekundärtext, Beschreibungen |
| `--border` | `#e4e4e7` | `#27272a` | Kartenrahmen, Trenner |
| `--accent` | `#2563eb` | `#3b82f6` | Primäraktion, aktiver Zustand, Fokus |
| `--accent-soft` | `#eff4ff` | `rgba(59,130,246,.14)` | Hintergrund für „sicher"/aktiv/erfolgreich |
| `--accent-foreground` | `#ffffff` | `#ffffff` | Text auf Akzentflächen |
| `--glass-from/to/edge`, `--glow` | s. Datei | s. Datei | Isometrische/3D-Flächen |
| `--code-bg` | `#ffffff` | `#131316` | Editor-Hintergrund |
| `--shadow-sm/--shadow/--shadow-lg` | s. Datei | s. Datei | Erhabene Flächen, gestaffelt nach Wichtigkeit |
| `--syntax-*` | s. Datei | s. Datei | Manuelle Syntax-Highlighting-Farben (Platzhalter-Editor) |

Zusätzlich, **nicht** als eigenes Token, sondern bewusst über Tailwinds `amber-500`-Skala: Warn-/Fehlerfarbe (siehe Abschnitt 6). Der Theme-Wechsel wird per `data-theme`-Attribut auf `<html>` gesteuert und vor dem ersten Render per Inline-Skript gesetzt (`THEME_INIT_SCRIPT`), um einen Flackerübergang zu vermeiden.

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

## 7. Reduced Motion und WebGL-Fallback (verbindlich vor Issue #12)

Zum jetzigen Stand enthält der Workshop **keine** Motion- oder WebGL-Inhalte — die isometrische Datenpipeline ist ein statisches SVG. Diese Regeln gelten als Vertrag für die 3D-Umsetzung in Issue #12 und danach:

1. `prefers-reduced-motion: reduce` wird respektiert — jede GSAP-/R3F-Animation muss eine reduzierte oder deaktivierte Variante haben, niemals nur „etwas langsamer".
2. Ein **vollständiger 2D-Fallback ohne WebGL** ist Pflicht, nicht optional — Geräte ohne WebGL-Unterstützung oder mit deaktiviertem WebGL müssen den kompletten Lerninhalt erreichen können. Das existierende `IsometricStack`-SVG ist der Referenzpunkt für diesen Fallback: Es transportiert dieselbe Kernaussage (vier Stationen, eine hervorgehoben) ohne jede 3D-Bibliothek.
3. Keine Animation darf den Editor oder die Navigation blockieren — CodeMirror-Eingaben und Task-Wechsel müssen während einer laufenden Animation reaktionsfähig bleiben.
4. Schwere Editor- und 3D-Module werden dynamisch nachgeladen (bereits gelebte Praxis: jede CodeMirror-Sprachgrammatik lädt einzeln per `import()`, siehe `loadLanguageExtension` und die vier `taskNAdapters.ts`-Loader — dasselbe Muster gilt für R3F/Drei/GSAP-Bundles).
5. Adaptive Qualität für schwächere Geräte (z. B. reduzierte Partikelzahl, deaktiviertes Postprocessing) ist beim Bau der 3D-Szene zu berücksichtigen, nicht nachträglich.
6. Tastaturbedienung und sichtbarer Fokus (Abschnitt 6) gelten unverändert auch neben/über einer 3D-Szene — die Szene darf niemals der einzige Weg sein, um eine Aktion auszulösen.

## 8. Asset-Herkunft und Lizenzregeln

| Asset-Typ | Aktueller Stand | Regel für künftige Assets |
|---|---|---|
| Schriften | Geist Sans/Mono über `next/font/google`, zur Build-Zeit selbst gehostet (keine Laufzeit-Anfrage an Google, keine separate Lizenzklärung nötig — Next.js bezieht ausschließlich offen lizenzierte Google-Fonts-Dateien) | Neue Schriften müssen ebenso self-hosted via `next/font` eingebunden werden, nicht per `<link>` auf einen externen CDN |
| Icons | Alle Icons sind handgeschriebenes Inline-SVG im jeweiligen Component-File (keine Icon-Bibliothek als Abhängigkeit) | Neue Icons folgen demselben Muster: `viewBox="0 0 24 24"`, `stroke="currentColor"`, `aria-hidden="true"` |
| PBR-Materialien / HDRI (für Issue #12) | Noch keine vorhanden | Müssen lokal im Repository versioniert werden (`apps/web/public/...` oder ein noch anzulegendes `assets/`-Verzeichnis) — kein Laden von Drittanbieter-CDNs zur Laufzeit, da das den 2D-/Offline-Fallback und die Deploy-Reproduzierbarkeit (Spec 16.12) gefährdet. Jede Datei braucht eine dokumentierte Quelle und Lizenz (z. B. CC0/Public Domain) in einer Zeile in diesem Abschnitt, sobald sie hinzukommt. Dateigröße ist gegen die Ladezeit-Anforderung (dynamisches Nachladen, adaptive Qualität) abzuwägen. |

## 9. Prüfung dieses Fundaments

- Gelebt und stichprobenartig auf Konsistenz geprüft in: Landing (`/`), Story (`/story`), Demo (`/demo`), Workshop-Aufgabenansicht und Abschluss-Screen (`/workshop`).
- Responsiv geprüft bei 1280px (Laptop) und 768px (Tablet) — siehe Abschnitt 5.
- Zustands-Regel (Abschnitt 6) geprüft gegen alle bestehenden Status-tragenden Komponenten; eine Lücke (Fluss-Diagramm-Boxen) gefunden und behoben.
- Dieses Dokument wird nicht rückwirkend für jede Komponente einzeln verifiziert (das leistet die visuelle/funktionale Testabdeckung der jeweiligen Issues) — es ist der Vertrag, an dem künftige Arbeit, allen voran Issue #12, gemessen wird.
