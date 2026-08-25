import type { jsPDF } from "jspdf";
import { GARAMOND } from "./fonts/register";

/**
 * Guilloche: the interlaced hairline lattice on banknotes, share certificates
 * and diplomas. It is what makes a document read as "issued" before a single
 * word is read, and it is pure trigonometry — no images, no bitmaps, nothing
 * that costs bundle weight or degrades in print.
 *
 * Everything here strokes vectors only, so the certificate stays sharp at any
 * zoom and prints as line art rather than as a photograph of line art.
 */

type Point = { x: number; y: number };

/** One stroked polyline, emitted as a single jsPDF path rather than N segments. */
function polyline(doc: jsPDF, points: readonly Point[], closed = false): void {
  if (points.length < 2) {
    return;
  }
  const deltas: [number, number][] = [];
  for (let index = 1; index < points.length; index += 1) {
    deltas.push([
      points[index].x - points[index - 1].x,
      points[index].y - points[index - 1].y,
    ]);
  }
  doc.lines(deltas, points[0].x, points[0].y, [1, 1], "S", closed);
}

/**
 * A braided band: two counter-phase sine waves plus a slower third, the
 * classic "twisted ribbon" look of an engraved border.
 */
function braid(
  doc: jsPDF,
  from: Point,
  to: Point,
  amplitude: number,
  cycles: number,
): void {
  const steps = 240;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return;
  }
  // Unit vectors along the band and across it, so one implementation serves
  // all four edges regardless of direction.
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;

  for (const [phase, scale] of [
    [0, 1],
    [Math.PI, 1],
    [Math.PI / 2, 0.45],
  ] as const) {
    const points: Point[] = [];
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const offset =
        Math.sin(t * cycles * 2 * Math.PI + phase) * amplitude * scale;
      points.push({
        x: from.x + ux * length * t + nx * offset,
        y: from.y + uy * length * t + ny * offset,
      });
    }
    polyline(doc, points);
  }
}

/**
 * A hypotrochoid — the spirograph curve. The lace in each corner and the
 * flower at the heart of the seal are the same function at different radii.
 * `lobes` is the petal count; the radii are derived from it so the curve always
 * closes after one revolution instead of drifting into a tangle.
 */
function rosette(
  doc: jsPDF,
  center: Point,
  radius: number,
  lobes: number,
  offset: number,
): void {
  const steps = 24 * lobes;
  const ring = (radius * lobes) / (lobes + 1);
  const points: Point[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const t = (step / steps) * 2 * Math.PI;
    points.push({
      x: center.x + ring * Math.cos(t) + offset * Math.cos(lobes * t),
      y: center.y + ring * Math.sin(t) - offset * Math.sin(lobes * t),
    });
  }
  polyline(doc, points, true);
}

export function drawGuillocheFrame(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  colors: { border: string; ornament: string },
): void {
  // Two keylines with the braided band running between them, the standard
  // engraved-border construction.
  doc.setDrawColor(colors.border);
  doc.setLineWidth(0.9);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16, "S");
  doc.setLineWidth(0.3);
  doc.rect(19, 19, pageWidth - 38, pageHeight - 38, "S");

  doc.setDrawColor(colors.ornament);
  doc.setLineWidth(0.12);
  const inset = 13.5;
  const amplitude = 3.1;
  braid(
    doc,
    { x: inset + 12, y: inset },
    { x: pageWidth - inset - 12, y: inset },
    amplitude,
    26,
  );
  braid(
    doc,
    { x: inset + 12, y: pageHeight - inset },
    { x: pageWidth - inset - 12, y: pageHeight - inset },
    amplitude,
    26,
  );
  braid(
    doc,
    { x: inset, y: inset + 12 },
    { x: inset, y: pageHeight - inset - 12 },
    amplitude,
    18,
  );
  braid(
    doc,
    { x: pageWidth - inset, y: inset + 12 },
    { x: pageWidth - inset, y: pageHeight - inset - 12 },
    amplitude,
    18,
  );

  for (const corner of [
    { x: inset, y: inset },
    { x: pageWidth - inset, y: inset },
    { x: inset, y: pageHeight - inset },
    { x: pageWidth - inset, y: pageHeight - inset },
  ]) {
    // Kept inside the band between the two keylines: ornament that crosses the
    // outer rule reads as a printing error rather than as engraving.
    rosette(doc, corner, 5.3, 9, 1.3);
    rosette(doc, corner, 3.5, 9, 0.9);
  }
}

/** A centred hairline rule with a lozenge at its middle — a section divider. */
export function drawFlourishRule(
  doc: jsPDF,
  centerX: number,
  y: number,
  halfWidth: number,
  color: string,
): void {
  doc.setDrawColor(color);
  doc.setFillColor(color);
  doc.setLineWidth(0.35);
  doc.line(centerX - halfWidth, y, centerX - 3.6, y);
  doc.line(centerX + 3.6, y, centerX + halfWidth, y);
  polyline(
    doc,
    [
      { x: centerX, y: y - 1.5 },
      { x: centerX + 1.9, y },
      { x: centerX, y: y + 1.5 },
      { x: centerX - 1.9, y },
    ],
    true,
  );
}

/**
 * The seal. A ring of Latin around a rosette with a monogram at its centre:
 * the motto is the one on-document claim that is actually true of the
 * workshop — no data without a contract.
 */
export function drawSeal(
  doc: jsPDF,
  center: Point,
  radius: number,
  colors: { ornament: string; foreground: string },
): void {
  const { x: cx, y: cy } = center;
  doc.setDrawColor(colors.ornament);

  doc.setLineWidth(0.7);
  doc.circle(cx, cy, radius, "S");
  doc.setLineWidth(0.25);
  doc.circle(cx, cy, radius * 0.94, "S");
  doc.circle(cx, cy, radius * 0.68, "S");
  doc.setLineWidth(0.6);
  doc.circle(cx, cy, radius * 0.64, "S");

  doc.setLineWidth(0.12);
  rosette(doc, center, radius * 0.55, 12, radius * 0.11);
  rosette(doc, center, radius * 0.38, 12, radius * 0.075);

  // Toothed outer edge, as pressed into a wax or foil seal.
  doc.setLineWidth(0.28);
  for (let tooth = 0; tooth < 72; tooth += 1) {
    const angle = (tooth / 72) * 2 * Math.PI;
    doc.line(
      cx + Math.sin(angle) * radius * 0.94,
      cy - Math.cos(angle) * radius * 0.94,
      cx + Math.sin(angle) * radius,
      cy - Math.cos(angle) * radius,
    );
  }

  drawRingText(
    doc,
    center,
    radius * 0.81,
    "NULLA DATA SINE CONTRACTU",
    radius * 0.29,
    colors.ornament,
  );

  doc.setFont(GARAMOND, "bold");
  doc.setFontSize(radius * 0.78);
  doc.setTextColor(colors.foreground);
  doc.setCharSpace(0.9);
  doc.text("DTO", cx + 0.45, cy + radius * 0.13, { align: "center" });
  doc.setCharSpace(0);
}

/**
 * Letters set around a circle, each rotated to sit on the tangent. jsPDF has no
 * text-on-path, so the glyphs are placed one at a time; the leading star marks
 * the top of the ring the way a real seal's does.
 */
function drawRingText(
  doc: jsPDF,
  center: Point,
  radius: number,
  text: string,
  size: number,
  color: string,
): void {
  const glyphs = [...`${text} ★ `];
  doc.setFont(GARAMOND, "bold");
  doc.setFontSize(size);
  doc.setTextColor(color);
  const step = 360 / glyphs.length;
  glyphs.forEach((glyph, index) => {
    const degrees = index * step;
    const radians = (degrees * Math.PI) / 180;
    doc.text(
      glyph,
      center.x + Math.sin(radians) * radius,
      center.y - Math.cos(radians) * radius,
      { align: "center", angle: -degrees, baseline: "middle" },
    );
  });
}
