import type { jsPDF } from "jspdf";
import { GARAMOND, SCRIPT, registerCertificateFonts } from "./fonts/register";
import { drawFlourishRule, drawGuillocheFrame, drawSeal } from "./ornament";

/**
 * Client-side only (issue #20's explicit scope: no server involvement, no
 * persistence). `jsPDF` and the embedded typefaces are dynamically imported by
 * the one caller (`CertificateForm`) so they never land in the initial
 * `/workshop` bundle — same discipline as the CodeMirror grammars and the 3D
 * pipeline module.
 *
 * The certificate is an in-house keepsake for the people who sat the workshop,
 * so it is styled as a diploma from a fictional institute: engraved border,
 * pressed seal, Latin motto, two signatures. Nothing about it is verifiable and
 * nothing about it pretends to be checkable against a register — the fictional
 * issuer is what keeps the joke visible while the craft stays serious.
 *
 * A certificate is a printed document, not a themed UI surface, so it
 * deliberately leaves the `DESIGN.md` palette behind for cream, ink-navy and
 * gold: the product's greys and blues are what made the first version read as
 * a screenshot of an app.
 */
const COLORS = {
  paper: "#faf7f0",
  foreground: "#1a2340",
  muted: "#5b6280",
  ornament: "#a8842c",
  border: "#1a2340",
} as const;

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const CENTER_X = PAGE_WIDTH / 2;

const ISSUER = "International Institute of Data Transfer Objects";
const SEAL_RADIUS = 18;
const SIGNATORIES = [
  { name: "Ilias Almerekov", title: "Director of the Institute" },
  { name: "Kamal Shekho", title: "Chief Mapper Instructor" },
] as const;

export type CertificateData = {
  name: string;
  completedAt: Date;
};

export async function downloadCertificate(
  data: CertificateData,
): Promise<void> {
  const doc = await buildCertificate(data);
  doc.save("Certificate-Workshop.pdf");
}

/**
 * Split from `downloadCertificate` so the document can be built and inspected
 * without a browser download: the layout is the part worth looking at.
 */
export async function buildCertificate({
  name,
  completedAt,
}: CertificateData): Promise<jsPDF> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  registerCertificateFonts(doc);

  doc.setFillColor(COLORS.paper);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

  drawGuillocheFrame(doc, PAGE_WIDTH, PAGE_HEIGHT, {
    border: COLORS.border,
    ornament: COLORS.ornament,
  });

  smallCaps(doc, ISSUER.toUpperCase(), CENTER_X, 34, {
    size: 10.5,
    charSpace: 1.5,
    color: COLORS.foreground,
  });
  drawFlourishRule(doc, CENTER_X, 39.5, 52, COLORS.ornament);

  doc.setFont(GARAMOND, "bold");
  doc.setFontSize(37);
  doc.setTextColor(COLORS.foreground);
  doc.text("Certificate of Completion", CENTER_X, 57, { align: "center" });

  smallCaps(doc, "DTO & MAPPER WORKSHOP", CENTER_X, 67, {
    size: 9.5,
    charSpace: 2.4,
    color: COLORS.ornament,
  });

  doc.setFont(GARAMOND, "normal");
  doc.setFontSize(13);
  doc.setTextColor(COLORS.muted);
  doc.text("Be it known that", CENTER_X, 83, { align: "center" });

  const nameSize = fittedFontSize(doc, name, 200, 44, 22);
  doc.setFont(GARAMOND, "bold");
  doc.setFontSize(nameSize);
  doc.setTextColor(COLORS.foreground);
  doc.text(name, CENTER_X, 101, { align: "center" });
  drawFlourishRule(
    doc,
    CENTER_X,
    107.5,
    Math.min(112, doc.getTextWidth(name) / 2 + 16),
    COLORS.ornament,
  );

  doc.setFont(GARAMOND, "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(COLORS.foreground);
  const issued = `${pad(completedAt.getDate())}.${pad(completedAt.getMonth() + 1)}.${completedAt.getFullYear()}`;
  const citation = [
    `has satisfied all requirements of the DTO & Mapper Workshop on ${issued}`,
    "and is hereby awarded this Certificate of Completion, in recognition of typed",
    "data transfer objects and explicit mappers built across a real API boundary.",
  ];
  citation.forEach((line, index) => {
    doc.text(line, CENTER_X, 118 + index * 7.4, { align: "center" });
  });

  drawSeal(doc, { x: CENTER_X, y: 165 }, SEAL_RADIUS, COLORS);
  drawSignature(doc, 66, SIGNATORIES[0]);
  drawSignature(doc, PAGE_WIDTH - 66, SIGNATORIES[1]);

  return doc;
}

function drawSignature(
  doc: jsPDF,
  centerX: number,
  signatory: { name: string; title: string },
): void {
  doc.setFont(SCRIPT, "normal");
  doc.setFontSize(23);
  doc.setTextColor(COLORS.foreground);
  doc.text(signatory.name, centerX, 164, { align: "center" });

  doc.setDrawColor(COLORS.foreground);
  doc.setLineWidth(0.3);
  doc.line(centerX - 32, 167.5, centerX + 32, 167.5);

  smallCaps(doc, signatory.name.toUpperCase(), centerX, 172.5, {
    size: 8.4,
    charSpace: 0.9,
    color: COLORS.foreground,
  });
  doc.setFont(GARAMOND, "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.muted);
  doc.text(signatory.title, centerX, 177, { align: "center" });
}

/**
 * Letterspaced capitals. jsPDF's `charSpace` also pads the final glyph, which
 * pushes centred text half a space off-centre — corrected here so the
 * ornaments and the type actually share an axis.
 */
function smallCaps(
  doc: jsPDF,
  text: string,
  centerX: number,
  y: number,
  {
    size,
    charSpace,
    color,
  }: { size: number; charSpace: number; color: string },
): void {
  doc.setFont(GARAMOND, "bold");
  doc.setFontSize(size);
  doc.setTextColor(color);
  doc.setCharSpace(charSpace);
  doc.text(text, centerX - charSpace / 2, y, { align: "center" });
  doc.setCharSpace(0);
}

/** Shrinks an unusually long name until it fits between the border ornaments. */
function fittedFontSize(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  preferredSize: number,
  minimumSize: number,
): number {
  doc.setFont(GARAMOND, "bold");
  for (let size = preferredSize; size > minimumSize; size -= 0.5) {
    doc.setFontSize(size);
    if (doc.getTextWidth(text) <= maxWidth) {
      return size;
    }
  }
  return minimumSize;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
