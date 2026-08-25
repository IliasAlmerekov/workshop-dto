import type { Language, TaskId } from "@/lib/workshop/types";
import type { Messages } from "./en";

/**
 * The German workshop.
 *
 * Two rules held throughout:
 *
 *  - **Identifiers stay identifiers.** `userName`, `birth_date`,
 *    `passwordHash`, `CreateUserRequest`, `trim()` — every token a
 *    participant reads in the editor or types into it appears here exactly as
 *    it does in the code. Translating them would break the link between the
 *    feedback and the file it is about.
 *  - **The vocabulary is the one used in German dev teams**: „Entity“,
 *    „Mapper“, „DTO“, „Contract“ where the English term is what people
 *    actually say, and real German where it is not („Grenze“, „Vertrag“ only
 *    where it reads naturally). The register is `du`, matching the workshop's
 *    direct second-person English.
 */

const CONCEPT_HINTS: Record<string, string> = {
  "request-dto":
    "Ein Request-DTO macht den Eingabevertrag explizit und verhindert, dass er nach dem Erzeugen noch verändert wird.",
  "request-mapper":
    "Der Mapper ist die eine Stelle, die eine fremde Form (snake_case, überflüssige Leerzeichen) in den eigenen typisierten Vertrag deiner Anwendung übersetzt.",
  "external-api":
    "Die Antwort des Identity Service ist ein fremder Vertrag mit eigenen Feldnamen und Darstellungen — der Mapper ist die eine Stelle, die ihn abschottet.",
  "response-dto":
    "Die öffentliche Response enthält nur das, was ein Client braucht — sie explizit aufzubauen bedeutet, dass passwordHash und internalNote niemals versehentlich nach außen gelangen.",
};

function hintsForEveryTrack(
  concept: string,
  fields: string,
  syntax: string,
): Record<Language, import("./en").HintCopy> {
  return {
    php: { concept, fields, syntax },
    typescript: { concept, fields, syntax },
    python: { concept, fields, syntax },
    java: { concept, fields, syntax },
  };
}

export const de: Messages = {
  locale: {
    label: "Sprache der Oberfläche",
    groupLabel: "Sprache der Oberfläche",
  },
  meta: {
    title: "DTO- & Mapper-Workshop",
    description:
      "Browserbasierter DTO- und Mapper-Workshop für Junior-Entwicklerinnen und -Entwickler.",
    storyTitle: "Die Geschichte von DTO & Mapper — DTO- & Mapper-Workshop",
    demoTitle: "Entity vs. DTO — DTO- & Mapper-Workshop",
  },
  landing: {
    eyebrow: ["Üben", "Verstehen", "Anwenden"],
    workshop: "Workshop",
    lede: "Ein geführter, interaktiver Workshop, um DTOs und Mapper an realen Beispielen zu beherrschen.",
    pickerHeading: "Wähle deine Programmiersprache",
  },
  header: {
    workshopTag: "Workshop",
    programmingLanguage: "Programmiersprache",
    selectLanguage: "Sprache wählen",
    switchTitle: "Sprache wechseln?",
    switchDescription: (language, task) =>
      `Der Wechsel zu ${language} verwirft deinen aktuellen Entwurf für „${task}“. Abgeschlossene Aufgaben bleiben abgeschlossen.`,
    switchConfirm: "Wechseln und Entwurf verwerfen",
    switchCancel: "Entwurf behalten",
    resetLabel: "Workshop zurücksetzen",
    resetTitle: "Den gesamten Workshop zurücksetzen?",
    resetDescription:
      "Das löscht deine Sprachauswahl und den gesamten Aufgabenfortschritt auf diesem Gerät. Das lässt sich nicht rückgängig machen.",
    resetConfirm: "Alles zurücksetzen",
    toDarkTheme: "Zum dunklen Design wechseln",
    toLightTheme: "Zum hellen Design wechseln",
  },
  common: {
    cancel: "Abbrechen",
    back: "← Zurück",
    loading: "Wird geladen…",
  },
  stepper: {
    label: "Fortschritt der Übungen",
    locked: "gesperrt",
  },
  exercise: {
    loading: "Übung wird geladen…",
    eyebrow: (order) => `Übung ${order}`,
    yourTask: "Deine Aufgabe",
    completeWith: () => "mit folgendem Inhalt vervollständigen:",
    checkSolution: "Lösung prüfen",
    checking: "Wird geprüft…",
    showHint: "Hinweis anzeigen",
    insertSolution: "Lösung einfügen",
    continue: "Weiter",
    editorLabel: (title) => `Deine Lösung für ${title}`,
    expandEditor: "Editor vergrößern",
    collapseEditor: "Editor verkleinern",
    hintsTitle: "Hinweise",
    hintStep: (shown, total) => `Hinweis ${shown} von ${total}`,
    previousHint: "Vorheriger Hinweis",
    followingHint: "Nächster freigeschalteter Hinweis",
    nextHint: "Nächster Hinweis",
    closeHints: "Hinweise schließen",
    hintKind: { concept: "Konzept", fields: "Felder", syntax: "Syntax" },
  },
  previewCard: {
    hintsLater:
      "Die schrittweisen Hinweise für diese Übung werden freigeschaltet, sobald die Aufgabenprüfung in einem künftigen Update erscheint.",
    accepted:
      "Vorschau-Build: Jeder Entwurf wird akzeptiert. Weiter zur nächsten Übung.",
    prompt:
      "„Lösung prüfen“ zeigt den Ablauf als Vorschau — die echte Prüfung kommt in einem künftigen Update.",
  },
  result: {
    eyebrow: "Ergebnis",
    idle: "// „Lösung prüfen“ ausführen, um das Ergebnis hier zu sehen",
    correct: "Richtig — alle Prüfungen bestanden",
    failed: (failed, total) =>
      `${failed} von ${total} Prüfungen fehlgeschlagen`,
    disclaimer:
      "Dein Code wird nie ausgeführt. Die Prüfungen lesen nur seine Struktur, und das Ergebnis ist der Beispiel-Payload durch einen korrekten Mapper.",
    outputTitle: "Prüfergebnis",
    testsPassed: (passed, total) => `${passed} / ${total} Prüfungen bestanden`,
    passedHeadline: "Alle Prüfungen bestanden",
    passedSubline: "Gut gemacht! Deine Lösung erfüllt alle Anforderungen.",
    failedHeadline: "Prüfung fehlgeschlagen",
    failedSubline:
      "Dein Code hat nicht alle erforderlichen Prüfungen bestanden. Behebe die Punkte unten und versuche es erneut.",
    checkPassed: "Bestanden",
    checkFailed: "Fehlgeschlagen",
    outputSectionTitle: "Ergebnis",
    nextStepTitle: "Nächster Schritt",
    nextStepLead: (task) => `Du kannst zu ${task} weitergehen`,
    nextStepReady: "Bereit",
    lastStepLead: "Du kannst den Workshop abschließen",
    guidanceTitle: "Details & Hilfestellung",
    whatToFix: "Was zu beheben ist",
    needNudge:
      "Brauchst du einen Hinweis? Nutze „Hinweis zeigen“ unter dem Editor.",
    run: {
      title: "Prüfung läuft",
      progress: (done, total) => `${done} / ${total}`,
      announcement: "Prüfung läuft…",
      steps: {
        parse: (fileName) => `${fileName} wird geparst`,
        structure: "Syntaxbaum wird gelesen",
        rules: (count) =>
          count === 1
            ? "1 Fachregel wird angewendet"
            : `${count} Fachregeln werden angewendet`,
        report: "Ergebnis wird zusammengestellt",
      },
    },
  },
  health: {
    waking: "Die Demo-API wacht auf… die Übungen funktionieren auch ohne sie.",
  },
  jsonPanel: {
    loading: "Wird geladen…",
    waking: (attempt, max) =>
      `Die Demo-API wacht auf… Versuch ${attempt} von ${max}`,
    error: (attempts, message) =>
      `Nach ${attempts} Versuchen weiterhin nicht erreichbar: ${message}`,
    retry: "Erneut versuchen",
    leaked: (fields) => `Nach außen gelangt: ${fields}`,
    entityTitle: "Entity-Endpunkt",
    entityDescription: "Serialisiert die interne Entity unverändert.",
    dtoTitle: "DTO-Endpunkt",
    dtoDescription:
      "Über den UserResponseMapper gemappt — nur das, was der Client braucht.",
  },
  comparison: {
    heading: "Live gegen die echte Symfony-API",
    body: "Beide Panels rufen für denselben Nutzer die echte Demo-API auf. Der linke Endpunkt serialisiert die interne Entity direkt; der rechte läuft durch denselben UserResponseMapper, den deine Lösung nachbildet.",
  },
  completion: {
    heading: "Alle sechs Registrierungsschritte geschafft 🎉",
    body: "Du hast typisierte DTOs definiert, explizite Mapper geschrieben, einen fremden API-Vertrag abgeschottet und eine sichere öffentliche Response erzeugt.",
    quizHeading: "Kurzer Wissenscheck",
    beforeAfterHeading: "Vorher und nachher, ein letztes Mal",
    flowTitle: "Der sichere Datenfluss, den du gerade gebaut hast",
    flowNote: "Der Mapper ist die einzige Stelle, die beide Formen kennt.",
    protectedHeading: "Was jede Übung geschützt hat",
    repositoryHeading: "Repository und Musterlösungen",
    viewRepository: "Repository ansehen",
    resultHeading: "Das von dir gebaute Registrierungsergebnis",
    responseHeading: "Sichere RegistrationResponse",
    emailHeading: "Vorbereitete WelcomeEmail",
    resultNote:
      "Das sind deterministische Lehrdaten: Es wurde kein Konto angelegt und keine E-Mail gesendet.",
  },
  quiz: {
    questions: [
      {
        prompt:
          "Warum ist es riskant, die interne User-Entity direkt in einer API-Response zu serialisieren?",
        options: [
          {
            text: "Es ist langsamer, als auf ein DTO zu mappen.",
            feedback:
              "Performance ist nicht der Kern — die Entity wird genauso schnell zu JSON wie ein DTO.",
          },
          {
            text: "Es koppelt den öffentlichen API-Vertrag an interne Felder und kann sensible Daten wie einen Passwort-Hash nach außen geben.",
            feedback:
              "Genau — der Entity-Endpunkt in diesem Workshop gibt passwordHash und internalNote aus exakt diesem Grund preis.",
          },
          {
            text: "Entities lassen sich überhaupt nicht zu JSON serialisieren.",
            feedback:
              "Doch — genau das macht der undichte Entity-Endpunkt in diesem Workshop.",
          },
          {
            text: "Es erfordert mehr Code als ein DTO.",
            feedback:
              "Es ist sogar weniger Code — und genau das macht es verlockend und riskant, das DTO wegzulassen.",
          },
        ],
      },
      {
        prompt: "Wofür ist die map()-Methode eines Mappers zuständig?",
        options: [
          {
            text: "Das gemappte Objekt in einer Datenbank zu speichern.",
            feedback:
              "Das ist ein anderes Anliegen — und mit ein Grund, warum der Mapper in diesem Workshop bewusst nicht dasselbe ist wie das Data-Mapper-Muster der Persistenz.",
          },
          {
            text: "Die explizite Übersetzung zwischen zwei Datenformen: umbenennen, normalisieren, konvertieren und entscheiden, was übernommen oder weggelassen wird.",
            feedback:
              "Richtig — genau das machen die Mapper in dieser Registration-Pipeline.",
          },
          {
            text: "Zu entscheiden, ob der eingehende Request autorisiert ist.",
            feedback:
              "Autorisierung gehört in eine andere Schicht — ein Mapper vertraut darauf, dass sie bereits geprüft wurde.",
          },
          {
            text: "Zu validieren, dass alle Pflichtfelder vorhanden sind.",
            feedback:
              "Fast — Validierung ist aber ein eigenes Anliegen: Ein Mapper transformiert Daten, denen er bereits als wohlgeformt vertraut.",
          },
        ],
      },
      {
        prompt:
          "Wann lohnt sich der zusätzliche Code für ein DTO vermutlich nicht?",
        options: [
          {
            text: "Wenn die Daten in eine öffentliche, externe API übergehen.",
            feedback:
              "Genau dort zahlt sich ein DTO aus — ein öffentlicher Vertrag braucht diesen Schutz.",
          },
          {
            text: "Wenn ein Feld sicherheitskritisch ist, etwa ein Passwort-Hash.",
            feedback:
              "Im Gegenteil — ein sicherheitskritisches Feld ist der stärkste Grund, explizit zu mappen.",
          },
          {
            text: "In kleinem, kurzlebigem Code innerhalb eines Prozesses, in dem Erzeuger und Verbraucher einander ohnehin voll vertrauen.",
            feedback:
              "Richtig — ohne echte Grenze ist der Mapper nur Zeremonie ohne etwas zu schützen.",
          },
          {
            text: "Sobald die Entity mehr als fünf Felder hat.",
            feedback:
              "Die Anzahl der Felder entscheidet nicht — sondern ob es eine echte Grenze gibt.",
          },
        ],
      },
    ],
  },
  boundaries: [
    {
      title: "HTTP-Request → Anwendung",
      body: "Übung 1: Der Client schickt Registrierungsdaten. Ein typisiertes CreateUserRequest macht genau das explizit, was die Anwendung annimmt.",
    },
    {
      title: "Diese Eingabe normalisieren",
      body: "Übung 2: Felder des älteren Registrierungsbildschirms werden umbenannt, getrimmt und konvertiert, bevor irgendetwas anderes sie anfasst.",
    },
    {
      title: "Externe API → deine Anwendung",
      body: "Übung 3: Ein fremder Identity Service hat sein eigenes Vokabular. Ein Mapper schottet es ab, damit ein Anbieterwechsel nie durch deinen Code hindurchschlägt.",
    },
    {
      title: "Anwendung → HTTP-Response",
      body: "Übung 4: Die öffentliche Response wird bewusst aufgebaut statt direkt aus der Entity serialisiert — so können interne Felder nicht versehentlich nach außen gelangen.",
    },
  ],
  story: {
    back: "← Zurück",
    eyebrow: "Bevor du startest",
    heading: "Warum es DTOs und Mapper gibt",
    ledeBefore: "Jede Übung in diesem Workshop gehört zu einer Geschichte: ",
    ledeUserRegistration: "der Benutzerregistrierung",
    ledeAfter:
      ". Ein Client schickt Registrierungsdaten. Die Anwendung normalisiert sie, prüft sie gegen einen externen Identity Service und gibt eine sichere öffentliche Response zurück. Die interne User-Entity auf diesem Weg trägt mehr, als diese öffentliche Response je zeigen sollte.",
    termsHeading: "Vier Begriffe, genau genommen",
    termsIntro:
      "Diese Begriffe werden draußen locker verwendet. Hier bedeuten sie genau das:",
    terms: [
      {
        term: "Entity",
        definition:
          "Das interne Modell, mit dem deine Anwendung tatsächlich arbeitet. Es trägt alles, was die Anwendung braucht — auch Felder, die kein Client je sehen sollte, etwa einen Passwort-Hash oder eine interne Notiz.",
      },
      {
        term: "DTO (Data Transfer Object)",
        definition:
          "Ein kleines Objekt, das bewusst ausgewählte Daten über eine Grenze trägt. Es enthält keine Geschäftslogik. In diesem Workshop sind DTOs unveränderlich und explizit typisiert.",
      },
      {
        term: "Object Mapper / Assembler",
        definition:
          "Eine Klasse, die explizit zwischen zwei Datenmodellen übersetzt — Felder umbenennen, Werte normalisieren, Typen konvertieren, Felder zusammenführen oder weglassen. Der UserResponseMapper, den du in Übung 4 schreibst, ist genau so einer.",
      },
      {
        term: "Data Mapper (ein anderes Muster)",
        definition:
          "Nicht dasselbe. „Data Mapper“ heißt auch ein Muster der Persistenzschicht, das Daten zwischen Objekten und einer Datenbank bewegt. Diese Bedeutung kommt in diesem Workshop nie vor — jeder „Mapper“ hier ist der Object Mapper/Assembler von oben.",
      },
    ],
    originHeading: "Woher das kommt",
    historically: "Historisch",
    historicallyBody:
      " waren Transferobjekte vor allem bei entfernten Aufrufen wichtig: Statt vieler kleiner, geschwätziger Roundtrips schickt ein verteiltes System ein bewusst geschnürtes Datenpaket.",
    today: "Heute",
    todayBody:
      " liegt der größere Gewinn in gewöhnlichen Webanwendungen woanders: Ein DTO schützt deinen API-Vertrag und macht jede Transformation an einer Stelle sichtbar, statt implizite Konvertierungen über die ganze Codebasis zu verstreuen. Mapper gibt es aus demselben Grund — zwei Datenmodelle werden absichtlich zusammengeführt, nicht zufällig.",
    liveHeading: "Live ansehen",
    liveBody:
      "Beide Panels unten rufen für denselben Nutzer die echte Symfony-Demo-API auf. Nichts davon ist erfunden — so sieht es wirklich aus, wenn eine Entity direkt serialisiert wird, direkt neben dem, was ein Mapper stattdessen erzeugt.",
    flowsHeading: "Zwei Datenflüsse",
    withoutDtoTitle: "Ohne DTO",
    withoutDtoNote:
      "Der Client ist ungewollt an die Entity gekoppelt — ein in der Entity umbenanntes Feld bricht auch den öffentlichen Vertrag.",
    withDtoTitle: "Mit DTO und Mapper",
    withDtoNote:
      "Der Mapper ist die einzige Stelle, die beide Formen kennt. Die Entity darf sich dahinter frei verändern.",
    whereHeading: "Wo das im Workshop auftaucht",
    whereBody: "Jede kommende Übung ist eine dieser Grenzen:",
    afterEyebrow: "Nach den Übungen",
    tradeoffsHeading: "Vorteile, Nachteile und wann man darauf verzichtet",
    benefitsLabel: "Vorteile",
    benefits: [
      "Ein stabiler, bewusst definierter API-Vertrag.",
      "Kein versehentliches Offenlegen interner oder sensibler Felder.",
      "Klare Typen und früher erkannte Fehler.",
      "Kontrolliertes Umbenennen und Formatieren, an einer sichtbaren Stelle.",
      "Entity und API können sich unabhängig voneinander weiterentwickeln.",
      "Transformationen sind leicht zu finden und leicht zu testen.",
      "Ein Drittanbieter bleibt hinter deiner eigenen Grenze.",
    ],
    drawbacksLabel: "Nachteile",
    drawbacks: [
      "Zusätzliche Klassen oder Records, die definiert und gepflegt werden wollen.",
      "Mehr Mapping-Code — und mehr Tests für diesen Code.",
      "Feldlisten können zwischen Entity und DTO doppelt geführt werden.",
      "Ein Feld umzubenennen bedeutet jetzt, mehr als eine Stelle anzufassen.",
      "Bei einer kleinen, kurzlebigen App kann die Zeremonie den Nutzen überwiegen.",
      "Ein generischer oder automatischer Mapper kann eine Transformation verstecken, auf die es eigentlich ankam.",
    ],
    ruleHeading: "Die Entscheidungsregel",
    ruleBody:
      "Dieser Workshop lehrt nicht „immer ein DTO“. Setze eines ein, wo es eine echte Grenze gibt und etwas Wertvolles sie überquert: eine öffentliche API, ein Vertrag mit Dritten, ein Client, den du nicht kontrollierst, oder ein sicherheitskritisches Feld, das nie nach außen darf. Spar dir die Zeremonie bei kleinem, kurzlebigem Code innerhalb eines Prozesses, in dem Entity und Verbraucher ohnehin dieselbe Vertrauensgrenze teilen — dort ist ein Mapper nur zusätzlicher Code ohne etwas zu schützen.",
    startExercises: "Mit den Übungen starten",
    openComparison: "Den Vergleich Entity vs. DTO separat öffnen",
  },
  demo: {
    heading: "Entity-Leck vs. sichere DTO-Response",
    body: "Beide Panels rufen für denselben Nutzer die echte Symfony-Demo-API auf. Der linke Endpunkt serialisiert die interne Entity direkt; der rechte läuft durch einen expliziten UserResponseMapper.",
  },
  tasks: {
    "request-dto": {
      title: "Typisiertes Request-DTO",
      shortTitle: "Request-DTO",
      question: "Wie definieren wir einen klaren, typisierten Eingabevertrag?",
      description:
        "Dein Team migriert die Registrierung von einem alten System in einen neuen Service. In sechs kleinen Schritten importierst du ein legacyProfile, bereitest eine Welcome-E-Mail vor und gibst eine sichere öffentliche Response zurück. Zuerst definierst du den Vertrag, den der neue Service akzeptiert.",
      fields: [
        "userName: string",
        "firstName: string",
        "lastName: string",
        "birthDate: date",
        "email: string",
      ],
      explanation:
        "CreateUserRequest ist ein DTO, nicht die Domain-Entity: Es existiert nur, um die Daten an dieser Grenze explizit und typisiert zu machen. Jedes Feld unveränderlich zu halten bedeutet, dass niemand weiter unten den Request nach dem Erzeugen still verändern kann.",
      brief: {
        situation: {
          title: "Die Situation",
          body: "Dein Team ersetzt ein altes Registrierungssystem. Dessen Registration API liefert ein legacyProfile mit alten Feldnamen und unaufgeräumten Werten. Daraus soll im neuen Service ein Konto entstehen. In den nächsten sechs Schritten baust du den gesamten Weg: Profil importieren, Konto anlegen, Welcome-E-Mail vorbereiten und dem Registration-Complete-Screen eine sichere Response geben. Dieses erste DTO ist das Ziel, auf das der nächste Mapper abbildet.",
        },
        mission: {
          title: "Dein Auftrag",
          body: "Definiere in {fileName} den unveränderlichen CreateUserRequest-Vertrag: genau die Daten, die der neue Registration Service zum Anlegen eines Kontos annimmt.",
        },
        doneWhen: {
          title: "Fertig, wenn",
          body: "Es enthält userName, firstName, lastName, birthDate und email, jeweils mit passendem Typ und nach dem Erzeugen nicht mehr veränderbar.",
        },
        notInThisStep: {
          title: "Noch nicht in diesem Schritt",
          body: "Noch kein Datenbank-Drama — in diesem Schritt definierst du nur die Form der Daten. Validieren, speichern oder transformieren gehört noch nicht dazu.",
        },
      },
    },
    "request-mapper": {
      title: "Request-Mapper",
      shortTitle: "Request-Mapper",
      question:
        "Wohin gehören Umbenennung, Normalisierung und Typkonvertierung?",
      description:
        "Rohe Request-Daten kommen mit snake_case-Schlüsseln, überflüssigen Leerzeichen und gemischter Groß-/Kleinschreibung an. Mappe sie auf das typisierte CreateUserRequest aus Schritt eins.",
      fields: [
        "user_name → userName · trimmen · kleinschreiben",
        "first_name → firstName · trimmen",
        "last_name → lastName · trimmen",
        "birth_date → birthDate · als Datum parsen",
        "email → email · trimmen · kleinschreiben",
      ],
      explanation:
        "Der Mapper bündelt die Logik der Grenze an einer sichtbaren, testbaren Stelle. Umbenennen, Trimmen und Normalisieren der Schreibweise passieren hier — einmal — statt überall dort wiederholt (oder vergessen) zu werden, wo der Request verwendet wird.",
      brief: {
        situation: {
          title: "Die Situation",
          body: "Ein älterer Registrierungsbildschirm sendet seine Formularwerte an deine Anwendung. Er verwendet snake_case-Schlüssel und kann Leerzeichen oder uneinheitliche Groß- und Kleinschreibung enthalten.",
        },
        mission: {
          title: "Dein Auftrag",
          body: "Verwandle dieses Formular in {fileName} in das typisierte CreateUserRequest, mit dem ein Konto angelegt wird.",
        },
        doneWhen: {
          title: "Fertig, wenn",
          body: "Mappe alle fünf Felder: user_name → userName (trimmen + kleinschreiben), first_name → firstName (trimmen), last_name → lastName (trimmen), birth_date → birthDate (als Datum parsen) und email → email (trimmen + kleinschreiben).",
        },
        notInThisStep: {
          title: "Noch nicht in diesem Schritt",
          body: "Kein Datenchaos — bereinige jeden Wert genau einmal an dieser Grenze. Verändere das ursprüngliche Formular nicht und füge keine Validierungsregeln hinzu.",
        },
        example: {
          beforeLabel: "Vor dem Mapping",
          beforeValue: 'user_name: "  Ada.Lovelace "',
          afterLabel: "Nach dem Mapping",
          afterValue: 'userName: "ada.lovelace"',
        },
      },
    },
    "external-api": {
      title: "DTO und Mapper für eine externe API",
      shortTitle: "Externe API",
      question:
        "Wie schützen wir unsere Anwendung vor einem fremden API-Vertrag?",
      description:
        "Der externe Identity Service antwortet in seinem eigenen Vokabular. Mappe seine Antwort auf einen eigenen Ergebnistyp, der unserer Anwendung gehört.",
      fields: [
        "subject_id → userId: number",
        "verification_state → verified: boolean",
        "checked_at → checkedAt: timestamp",
      ],
      explanation:
        "Das Vokabular des Drittanbieters an der Integrationsgrenze abzuschotten bedeutet: Ändert der Anbieter Feldnamen, Schreibweise oder Darstellung, betrifft das nur diesen einen Mapper — der Rest der Anwendung arbeitet weiter gegen seinen eigenen stabilen Vertrag.",
    },
    "response-dto": {
      title: "Response-DTO und Entity-Mapper",
      shortTitle: "Response-DTO",
      question: "Wie erzeugen wir eine sichere, stabile öffentliche Response?",
      description:
        "Die interne User-Entity trägt mehr, als der öffentliche Vertrag preisgeben sollte. Mappe sie auf eine Response, die sich gefahrlos serialisieren lässt.",
      fields: [
        "id, userName, email unverändert",
        "firstName + lastName → displayName",
        "birthDate als YYYY-MM-DD formatiert",
        "passwordHash & internalNote weglassen",
      ],
      explanation:
        "Der öffentliche Vertrag enthält nur das, was der Client wirklich braucht. Ihn explizit aufzubauen — statt die Entity direkt zu serialisieren — bedeutet, dass passwordHash und internalNote nie versehentlich nach außen gelangen, auch wenn die Entity mit der Zeit neue Felder bekommt.",
    },
    "welcome-email-dto": {
      title: "Welcome-E-Mail-DTO",
      shortTitle: "E-Mail-DTO",
      question: "Welchen Vertrag braucht eine Welcome-E-Mail?",
      description:
        "Definiere den kleinen unveränderlichen WelcomeEmail-Vertrag, bevor ein erzeugter User an der Benachrichtigungsgrenze gemappt wird.",
      fields: [
        "recipientEmail: string",
        "recipientName: string",
        "subject: string",
        "body: string",
      ],
      explanation:
        "WelcomeEmail ist ein expliziter Benachrichtigungsvertrag. Definiere die Daten des Verbrauchers vor seinem Mapper.",
      brief: {
        situation: {
          title: "Die Situation",
          body: "Ein neues Konto wurde erstellt. Die Benachrichtigungsgrenze braucht Daten für eine Welcome-E-Mail.",
        },
        mission: {
          title: "Dein Auftrag",
          body: "Definiere in {fileName} den unveränderlichen Vertrag für den E-Mail-Verbraucher.",
        },
        doneWhen: {
          title: "Fertig, wenn",
          body: "Er recipientEmail, recipientName, subject und body als Strings enthält.",
        },
        notInThisStep: {
          title: "Noch nicht in diesem Schritt",
          body: "Sende keine E-Mail und rufe keinen Provider auf. Hier definierst du nur Daten.",
        },
      },
    },
    "welcome-email-mapper": {
      title: "Welcome-E-Mail-Mapper",
      shortTitle: "E-Mail-Mapper",
      question: "Wie bereiten wir eine Welcome-E-Mail vor, ohne sie zu senden?",
      description:
        "Mappe den erzeugten User auf WelcomeEmail. Der Workshop bereitet nur Daten vor und ruft keinen E-Mail-Provider auf.",
      fields: [
        "email → recipientEmail",
        "firstName + lastName → recipientName",
        "Welcome-Betreff",
        "body nennt Teilnehmende",
      ],
      explanation:
        "Der Mapper macht die ausgehende Benachrichtigungsgrenze explizit und bereitet nur die benötigten Daten vor.",
      brief: {
        situation: {
          title: "Die Situation",
          body: "Ein erzeugter User soll eine Welcome-E-Mail erhalten, aber der Workshop hat keinen Mail-Provider.",
        },
        mission: {
          title: "Dein Auftrag",
          body: "Mappe in {fileName} den User auf WelcomeEmail.",
        },
        doneWhen: {
          title: "Fertig, wenn",
          body: "Verwende E-Mail und vollständigen Namen und bereite Betreff und Text vor.",
        },
        notInThisStep: {
          title: "Noch nicht in diesem Schritt",
          body: "Sende nichts und gib keine weiteren User-Felder weiter.",
        },
      },
    },
    "registration-response-dto": {
      title: "Registration-Response-DTO",
      shortTitle: "Response-DTO",
      question: "Was darf der Registration-Complete-Screen erhalten?",
      description:
        "Definiere die unveränderliche öffentliche RegistrationResponse, bevor ein erzeugter User veröffentlicht wird.",
      fields: [
        "id: number",
        "userName: string",
        "displayName: string",
        "birthDate: string",
        "email: string",
      ],
      explanation:
        "RegistrationResponse ist ein öffentlicher Vertrag, nicht die interne User-Entity.",
      brief: {
        situation: {
          title: "Die Situation",
          body: "Der Registration-Complete-Screen braucht ein sicheres öffentliches Ergebnis.",
        },
        mission: {
          title: "Dein Auftrag",
          body: "Definiere in {fileName} den unveränderlichen RegistrationResponse-Vertrag.",
        },
        doneWhen: {
          title: "Fertig, wenn",
          body: "Er id, userName, displayName, birthDate und email enthält.",
        },
        notInThisStep: {
          title: "Noch nicht in diesem Schritt",
          body: "Füge einem öffentlichen Vertrag keine privaten Entity-Felder hinzu.",
        },
      },
    },
    "registration-response-mapper": {
      title: "Registration-Response-Mapper",
      shortTitle: "Response-Mapper",
      question: "Wie geben wir ein sicheres Registrierungsergebnis zurück?",
      description:
        "Mappe den erzeugten User auf RegistrationResponse und schließe private Entity-Felder bewusst aus.",
      fields: [
        "id, userName, email",
        "firstName + lastName → displayName",
        "birthDate → YYYY-MM-DD",
        "passwordHash und internalNote weglassen",
      ],
      explanation:
        "Der öffentliche Mapper trennt Registration Complete von internen User-Feldern und verhindert versehentliche Leaks.",
      brief: {
        situation: {
          title: "Die Situation",
          body: "Das Konto existiert und der öffentliche Registration-Complete-Screen braucht sein Ergebnis.",
        },
        mission: {
          title: "Dein Auftrag",
          body: "Mappe in {fileName} den User auf RegistrationResponse.",
        },
        doneWhen: {
          title: "Fertig, wenn",
          body: "Gib nur öffentliche Felder zurück, formatiere birthDate und lasse passwordHash und internalNote weg.",
        },
        notInThisStep: {
          title: "Noch nicht in diesem Schritt",
          body: "Serialisiere nicht die Entity und schließe keine privaten Felder ein.",
        },
      },
    },
  },
  hints: {
    "request-dto": {
      php: {
        concept: CONCEPT_HINTS["request-dto"],
        fields:
          "Du brauchst userName, firstName, lastName, birthDate und email — alle typisiert und alle readonly.",
        syntax:
          "Nutze PHPs Constructor Property Promotion — jeder Parameter wird zu einer public readonly Property.",
      },
      typescript: {
        concept: CONCEPT_HINTS["request-dto"],
        fields:
          "Du brauchst userName, firstName, lastName, birthDate und email — alle typisiert und alle readonly.",
        syntax:
          "In TypeScript markierst du jede Property innerhalb eines Objekttyps als readonly.",
      },
      python: {
        concept: CONCEPT_HINTS["request-dto"],
        fields:
          "Du brauchst userName, firstName, lastName, birthDate und email — alle typisiert.",
        syntax:
          "In einer frozen dataclass ist jedes deklarierte Attribut unveränderlich — annotiere einfach den Typ.",
      },
      java: {
        concept: CONCEPT_HINTS["request-dto"],
        fields:
          "Du brauchst userName, firstName, lastName, birthDate und email — alle typisiert.",
        syntax:
          "Die Komponenten eines Record sind implizit unveränderlich — liste sie einfach kommagetrennt auf.",
      },
    },
    "request-mapper": {
      php: {
        concept: CONCEPT_HINTS["request-mapper"],
        fields:
          "Lies jedes $form['...']-Feld, trimme es, und schreibe userName/email zusätzlich klein. Konvertiere birth_date in ein echtes DateTimeImmutable.",
        syntax:
          "Nutze PHPs benannte Argumente und umschließe trim() dort, wo nötig, mit strtolower().",
      },
      typescript: {
        concept: CONCEPT_HINTS["request-mapper"],
        fields:
          "Lies jedes form.*-Feld, trimme es, und schreibe userName/email zusätzlich klein. Konvertiere birth_date in ein echtes Date.",
        syntax:
          "Verkette die Transformationen direkt am Zugriff auf das Formularfeld.",
      },
      python: {
        concept: CONCEPT_HINTS["request-mapper"],
        fields:
          'Lies jedes form["..."]-Feld, strippe es, und schreibe userName/email zusätzlich klein. Konvertiere birth_date in ein echtes date.',
        syntax:
          "Verkette .strip() und .lower() direkt am Zugriff auf das Formularfeld.",
      },
      java: {
        concept: CONCEPT_HINTS["request-mapper"],
        fields:
          'Lies jedes form.get("...")-Feld, trimme es, und schreibe userName/email zusätzlich klein. Konvertiere birth_date in ein echtes LocalDate — die Argumente sind positionsabhängig, in derselben Reihenfolge wie im Record.',
        syntax: "Verkette .trim() und .toLowerCase() direkt am Map-Zugriff.",
      },
    },
    "external-api": {
      php: {
        concept: CONCEPT_HINTS["external-api"],
        fields:
          "Konvertiere $raw['subject_id'] zu int, vergleiche $raw['verification_state'] mit 'VERIFIED' für den bool, und konvertiere $raw['checked_at'] in ein echtes DateTimeImmutable.",
        syntax:
          "Nutze intval() für die Zahl, einen strikten Vergleich für den Boolean und new DateTimeImmutable(...) für den Zeitstempel.",
      },
      typescript: {
        concept: CONCEPT_HINTS["external-api"],
        fields:
          'Konvertiere raw.subject_id zu number, vergleiche raw.verification_state mit "VERIFIED" für den boolean, und konvertiere raw.checked_at in ein echtes Date.',
        syntax:
          "Nutze parseInt für die Zahl, einen strikten Gleichheitsvergleich für den Boolean und den Date-Konstruktor für den Zeitstempel.",
      },
      python: {
        concept: CONCEPT_HINTS["external-api"],
        fields:
          'Konvertiere raw["subject_id"] zu int, vergleiche raw["verification_state"] mit "VERIFIED" für den bool, und konvertiere raw["checked_at"] in ein echtes datetime.',
        syntax:
          "Nutze int() für die Zahl, einen Gleichheitsvergleich für den Boolean und datetime.fromisoformat(...) für den Zeitstempel.",
      },
      java: {
        concept: CONCEPT_HINTS["external-api"],
        fields:
          'Konvertiere raw.get("subject_id") zu int, vergleiche raw.get("verification_state") mit "VERIFIED" für den boolean, und konvertiere raw.get("checked_at") in ein echtes Instant — die Argumente sind positionsabhängig, in derselben Reihenfolge wie im Record.',
        syntax:
          "Nutze Integer.parseInt für die Zahl, .equals(...) für den Boolean und Instant.parse für den Zeitstempel.",
      },
    },
    "response-dto": {
      php: {
        concept: CONCEPT_HINTS["response-dto"],
        fields:
          "Übernimm $user->userName und $user->email unverändert, füge $user->firstName und $user->lastName zu displayName zusammen und formatiere $user->birthDate als YYYY-MM-DD.",
        syntax:
          "Nutze String-Interpolation für displayName und ->format('Y-m-d') für das Datum.",
      },
      typescript: {
        concept: CONCEPT_HINTS["response-dto"],
        fields:
          "Übernimm userName und email unverändert, füge user.firstName und user.lastName zu displayName zusammen und formatiere user.birthDate als YYYY-MM-DD.",
        syntax:
          "Nutze ein Template Literal für displayName und toISOString().slice(0, 10) für das Datumsformat.",
      },
      python: {
        concept: CONCEPT_HINTS["response-dto"],
        fields:
          "Übernimm user.userName und user.email unverändert, füge user.firstName und user.lastName zu displayName zusammen und formatiere user.birthDate als YYYY-MM-DD.",
        syntax:
          "Nutze einen f-String für displayName und .strftime(...) für das Datum.",
      },
      java: {
        concept: CONCEPT_HINTS["response-dto"],
        fields:
          "Übernimm user.userName() und user.email() unverändert, füge user.firstName() und user.lastName() zu displayName zusammen und formatiere user.birthDate() als YYYY-MM-DD — die Argumente sind positionsabhängig, in derselben Reihenfolge wie im Record.",
        syntax:
          "Verkette Strings für displayName und nutze .format(DateTimeFormatter.ISO_LOCAL_DATE) für das Datum.",
      },
    },
    "welcome-email-dto": hintsForEveryTrack(
      "Halte den Benachrichtigungsvertrag explizit, bevor etwas hinein mappt.",
      "Nutze recipientEmail, recipientName, subject und body.",
      "Nutze die unveränderliche DTO-Syntax deines Tracks.",
    ),
    "welcome-email-mapper": hintsForEveryTrack(
      "Der Mapper bereitet eine ausgehende Nachricht vor; er sendet sie nicht.",
      "Mappe email, firstName und lastName in die vier WelcomeEmail-Felder.",
      "Nutze die explizite Mapper-Syntax deines Tracks.",
    ),
    "registration-response-dto": hintsForEveryTrack(
      "Eine öffentliche Response ist ein separater Vertrag zur internen Entity.",
      "Nutze id, userName, displayName, birthDate und email.",
      "Nutze die unveränderliche DTO-Syntax deines Tracks.",
    ),
    "registration-response-mapper": hintsForEveryTrack(
      "Mappe an dieser Grenze nur das öffentliche Ergebnis.",
      "Baue displayName und formatiertes birthDate; lasse passwordHash und internalNote weg.",
      "Nutze die explizite Mapper-Syntax deines Tracks.",
    ),
  },
  construct: {
    "request-dto": {
      php: {
        ok: "CreateUserRequest ist als final class deklariert.",
        missing: "Es wurde keine CreateUserRequest-Klasse gefunden.",
        notImmutable: "CreateUserRequest sollte eine „final“ class sein.",
      },
      typescript: {
        ok: "CreateUserRequest ist deklariert.",
        missing:
          "Es wurde kein CreateUserRequest-Typ und keine -Klasse gefunden.",
      },
      python: {
        ok: "CreateUserRequest ist eine frozen dataclass.",
        missing: "Es wurde keine CreateUserRequest-Klasse gefunden.",
        notImmutable:
          "CreateUserRequest sollte mit @dataclass(frozen=True) dekoriert sein.",
      },
      java: {
        ok: "CreateUserRequest ist als record deklariert.",
        missing: "Es wurde kein CreateUserRequest-Record gefunden.",
      },
    },
    "request-mapper": {
      php: {
        ok: "map() gibt ein neues CreateUserRequest mit benannten Argumenten zurück.",
        missing:
          "map() sollte new CreateUserRequest(...) mit benannten Argumenten zurückgeben.",
      },
      typescript: {
        ok: "mapCreateUserRequest gibt ein Objekt zurück.",
        missing: "mapCreateUserRequest sollte ein Objektliteral zurückgeben.",
      },
      python: {
        ok: "map() gibt CreateUserRequest mit Schlüsselwortargumenten zurück.",
        missing:
          "map() sollte CreateUserRequest(...) mit Schlüsselwortargumenten zurückgeben.",
      },
      java: {
        ok: "map() gibt ein neues CreateUserRequest zurück.",
        missing:
          "map() sollte new CreateUserRequest(...) mit allen fünf Argumenten in der richtigen Reihenfolge zurückgeben.",
      },
    },
    "external-api": {
      php: {
        ok: "map() gibt ein neues IdentityCheckResult mit benannten Argumenten zurück.",
        missing:
          "map() sollte new IdentityCheckResult(...) mit benannten Argumenten zurückgeben.",
      },
      typescript: {
        ok: "mapIdentityCheck gibt ein Objekt zurück.",
        missing: "mapIdentityCheck sollte ein Objektliteral zurückgeben.",
      },
      python: {
        ok: "map() gibt IdentityCheckResult mit Schlüsselwortargumenten zurück.",
        missing:
          "map() sollte IdentityCheckResult(...) mit Schlüsselwortargumenten zurückgeben.",
      },
      java: {
        ok: "map() gibt ein neues IdentityCheckResult zurück.",
        missing:
          "map() sollte new IdentityCheckResult(...) mit allen drei Argumenten in der richtigen Reihenfolge zurückgeben.",
      },
    },
    "response-dto": {
      php: {
        ok: "map() gibt eine neue UserResponse mit benannten Argumenten zurück.",
        missing:
          "map() sollte new UserResponse(...) mit benannten Argumenten zurückgeben.",
      },
      typescript: {
        ok: "mapUserResponse gibt ein Objekt zurück.",
        missing: "mapUserResponse sollte ein Objektliteral zurückgeben.",
      },
      python: {
        ok: "map() gibt UserResponse mit Schlüsselwortargumenten zurück.",
        missing:
          "map() sollte UserResponse(...) mit Schlüsselwortargumenten zurückgeben.",
      },
      java: {
        ok: "map() gibt eine neue UserResponse zurück.",
        missing:
          "map() sollte new UserResponse(...) mit allen fünf Argumenten in der richtigen Reihenfolge zurückgeben.",
      },
    },
  },
  checks: {
    fieldMissingRequest: (field) => `${field} fehlt im Request.`,
    fieldWrongType: (field, expected, found) =>
      `${field} sollte ${expected} sein, nicht „${found}“.`,
    fieldDeclared: (field) => `${field} ist korrekt deklariert.`,
    kindString: "ein String",
    kindDate: "ein Datumstyp",
    immutableUnknown:
      "Es wurden noch keine Felder gefunden, daher lässt sich Unveränderlichkeit nicht prüfen.",
    immutableMissing: (fields) => `${fields} muss unveränderlich sein.`,
    immutableAll: "Alle Felder sind unveränderlich.",
    missingFromResult: (field) => `${field} fehlt im gemappten Ergebnis.`,
    missingFromResponse: (field) => `${field} fehlt in der gemappten Response.`,
    readsFrom: (field, source) => `${field} liest aus „${source}“.`,
    shouldReadFrom: (field, source) => `${field} sollte aus „${source}“ lesen.`,
    trims: (field) => `${field} trimmt Leerzeichen.`,
    shouldTrim: (field) => `${field} hat noch ungetrimmte Leerzeichen.`,
    lowercased: (field) => `${field} wird kleingeschrieben.`,
    shouldLowercase: (field) => `${field} sollte kleingeschrieben werden.`,
    isDate: (field) => `${field} wird in einen Datumstyp konvertiert.`,
    shouldBeDate: (field) => `${field} ist noch Text statt eines Datumstyps.`,
    isInteger: (field) => `${field} wird in einen Integer konvertiert.`,
    shouldBeInteger: (field) => `${field} ist noch Text statt eines Integer.`,
    comparesVerified: (field) => `${field} vergleicht mit „VERIFIED“.`,
    shouldCompareVerified: (field) =>
      `${field} sollte verification_state mit „VERIFIED“ vergleichen.`,
    isTimestamp: (field) =>
      `${field} wird in einen Zeitstempel-Typ konvertiert.`,
    shouldBeTimestamp: (field) =>
      `${field} ist noch Text statt eines Zeitstempels.`,
    carriedOver: (field) => `${field} wird vom Nutzer übernommen.`,
    shouldCarryOver: (field) => `${field} sollte vom Nutzer übernommen werden.`,
    includes: (field, source) => `${field} enthält ${source}.`,
    shouldInclude: (field, source) => `${field} sollte ${source} enthalten.`,
    readsFromUser: (field, source) =>
      `${field} liest aus ${source} des Nutzers.`,
    shouldReadFromUser: (field, source) =>
      `${field} sollte aus ${source} des Nutzers lesen.`,
    formatted: (field) => `${field} ist als YYYY-MM-DD formatiert.`,
    shouldFormat: (field) =>
      `${field} ist noch nicht als YYYY-MM-DD formatiert.`,
    leaks: (field) => `${field} darf in der Response nicht vorkommen.`,
    notExposed: (field) => `${field} wird nicht offengelegt.`,
  },
};
