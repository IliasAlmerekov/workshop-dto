# Accessibility – Testkonzept (issue #13)

Ergänzt [DESIGN.md](./DESIGN.md) (visueller Vertrag, u. a. Fokus-Ring und
"zwei Signale pro Zustand") und [SPECIFICATION.md](./SPECIFICATION.md)
Abschnitt 11 (Motion-Konzept) und Abschnitt 16 (Abnahmekriterien Punkt 11:
"Reduced Motion und der 2D-Fallback ermöglichen den vollständigen
Workshop"). Dieses Dokument hält fest, was automatisiert geprüft wird und
was vor einer Session manuell nachgeprüft werden sollte.

## 1. Automatisiert (jest-axe)

Jede Hauptansicht hat einen eigenen Test `"has no automatically detectable
accessibility violations"`, der [jest-axe](https://github.com/nickcolley/jest-axe)
(axe-core) gegen den gerenderten DOM laufen lässt:

| Datei | Ansicht |
|---|---|
| `src/app/page.test.tsx` | Landing Page |
| `src/app/workshop/page.test.tsx` | Aufgabenansicht (inkl. echtem CodeMirror-Editor) |
| `src/app/story/page.test.tsx` | `/story` |
| `src/app/demo/page.test.tsx` | `/demo` |
| `src/components/CompletionScreen.test.tsx` | Abschlussbildschirm |
| `src/components/ExerciseRunner.test.tsx` | Aufgaben-Runner isoliert |
| `src/components/KnowledgeCheck.test.tsx` | Quiz |

`pnpm run test` führt sie mit der übrigen Suite aus. Diese Tests fingen bei
ihrer Einführung zwei reale Verstöße ab, die seitdem behoben sind:
fehlender Accessible Name auf dem CodeMirror-Textfeld
([CodeMirrorEditor.tsx](../apps/web/src/components/CodeMirrorEditor.tsx),
`EditorView.contentAttributes`) und ein `aria-label` auf einem `<span>`
ohne passende Rolle im Stepper
([Stepper.tsx](../apps/web/src/components/Stepper.tsx), jetzt `role="img"`).

axe deckt nur automatisch erkennbare Verstöße ab (fehlende Labels, falsche
ARIA-Attribute, grobe Kontrastfehler auf geprüften Elementen). Tastatur-Reihenfolge,
Fokus-Reihenfolge bei dynamischen Inhalten und Sinnhaftigkeit von Ansagen
bleiben manuell zu prüfen (Abschnitt 2).

## 2. Manuelle Prüfung vor einer Session

Etwa 10 Minuten, idealerweise nach jedem Deployment auf Render.

### 2.1 Tastatur

1. Landing Page laden, **nur mit Tab/Shift+Tab/Pfeiltasten/Enter** bedienen.
2. Sprachauswahl ist eine `radiogroup`: Ein Tab-Stopp führt zur aktuell
   gewählten Sprache; Pfeiltasten (↑↓←→) wechseln Auswahl *und* Fokus
   zwischen den vier Sprachen (kein einzelner Tab-Stopp pro Sprache –
   `LanguagePicker.tsx` nutzt Roving Tabindex).
3. "Start without login" per Enter/Space auslösen, den kompletten
   Workshop bis zum Abschluss ausschließlich per Tastatur durchspielen:
   Editor fokussieren, Lösung eintippen, "Check solution", "Show hint" ×3,
   "Insert solution", "Continue".
4. Sichtbaren Fokus-Ring bei jedem Tab-Stopp prüfen (2 px, `--accent`,
   2 px Offset, siehe DESIGN.md Abschnitt "Fokus") – insbesondere auf dem
   Theme-Toggle, dem Sprachwechsler im Header und den Stepper-Schritten.

### 2.2 Reduced Motion

1. Betriebssystem- oder Browser-Einstellung "reduce motion" aktivieren
   (macOS: Bedienungshilfen → Anzeige → Bewegung reduzieren; Chrome
   DevTools: Rendering-Tab → "Emulate CSS prefers-reduced-motion: reduce").
2. Seite frisch laden (die Prüfung läuft einmalig beim Mount von
   `DataTransitPipeline`, siehe
   [capabilities.ts](../apps/web/src/lib/three/capabilities.ts)).
3. Kompletten Workshop (alle 4 Aufgaben + Abschluss) durchspielen.
   Erwartung: An jeder Stelle, an der sonst die 3D-Pipeline erscheint,
   zeigt sich durchgängig der statische 2D-`IsometricStack` – nie die
   3D-Szene, auch nicht kurz beim Wechsel zwischen Aufgaben.

### 2.3 Ohne WebGL

1. WebGL im Browser deaktivieren (Chrome: `chrome://flags` →
   "WebGL" / "WebGL 2.0" auf "Disabled", oder `chrome://settings` →
   System → Hardwarebeschleunigung aus; Firefox: `about:config` →
   `webgl.disabled` = `true`) und neu starten.
2. Kompletten Workshop durchspielen. Erwartung: identisch zu 2.2 – überall
   der 2D-Fallback, keine Fehlermeldung, keine leere Fläche.
3. Bekannter Randfall (issue #13, seit diesem Commit mit Fallback
   abgesichert): Falls die WebGL-Erkennung beim Laden erfolgreich ist, der
   echte `@react-three/fiber`-Kontext aber dennoch fehlschlägt (GPU-Reset,
   Ressourcenknappheit), fängt eine `SceneErrorBoundary` in
   [DataTransitPipeline.tsx](../apps/web/src/components/DataTransitPipeline.tsx)
   das ab und zeigt ebenfalls den 2D-Fallback statt eines Absturzes. Das ist
   automatisiert abgedeckt
   (`DataTransitPipeline.test.tsx`, "falls back to the 2D pipeline if the 3D
   scene throws while mounting") und muss nicht manuell nachgestellt werden.

### 2.4 Kontrast

Kein manueller Schritt nötig – die Tokens in
[globals.css](../apps/web/src/app/globals.css) sind gegen WCAG AA
(4,5:1 für normalen Text) durchgerechnet. Bei künftigen Änderungen an
`--muted`, `--accent`, `--accent-solid` oder den `--background`/`--surface`-Paaren
die Kontrastrechnung wiederholen (Formel in DESIGN.md-Kommentar bei den
Farbtokens) statt sich auf den optischen Eindruck zu verlassen – zwei reale
Verstöße (`--muted` auf `--background`: 4.40:1; `--accent-foreground` auf
`--accent` im Dark Mode: 3.68:1) wurden so erst durch Nachrechnen sichtbar,
nicht durch Hinsehen.

### 2.5 Performance / schwächere Hardware

Kein Live-Gerätetest nötig, stattdessen Bundle-Disziplin prüfen (schneller
und reproduzierbarer als CPU-Throttling):

```bash
pnpm --filter web run build
```

Danach in `apps/web/.next/server/app/workshop.html` nach
`chunks/*.js`-Referenzen suchen und mit den Dateigrößen in
`apps/web/.next/static/chunks/` abgleichen. Der three.js/@react-three/gsap-Bundle
(aktuell ~940 KB / ~254 KB gzip) darf in dieser Liste **nicht** auftauchen –
er wird ausschließlich dynamisch importiert, nachdem
`canRender3DPipeline()` true ergeben hat. Taucht er doch im initialen
`/workshop`-Payload auf, ist das ein Regressions-Fund (spec 11: "dynamisches
Laden schwerer 3D-Module").

## 3. Bekannte Grenzen

- axe prüft nur den jeweils gerenderten Ausschnitt einer Ansicht zu einem
  Zeitpunkt (z. B. den Zustand vor dem Ausfüllen einer Aufgabe). Zustände
  nach Interaktion (Check-Feedback, Insert-solution-Erklärung,
  Abschluss-Quiz-Auswertung) sind nicht separat mit axe geprüft, weil dieselbe
  Seite dann bereits einmal ohne Verstöße geprüft wurde und sich die
  ARIA-Struktur durch die Interaktion nicht ändert (nur Textinhalt).
- Kein automatisierter Screenreader-Test (VoiceOver/NVDA) – bei größeren
  Änderungen an Live-Regions oder der Aufgabenreihenfolge empfiehlt sich ein
  kurzer manueller Durchlauf mit VoiceOver (macOS, `Cmd+F5`).
