/**
 * Client-side only (issue #20's explicit scope: no server involvement, no
 * persistence). `jsPDF` is dynamically imported by the one caller
 * (`CertificateForm`) so it never lands in the initial `/workshop` bundle —
 * same discipline as the CodeMirror grammars and the 3D pipeline module.
 *
 * A certificate is a static, printable document, not a themed UI surface,
 * so it always uses the light-mode DESIGN.md tokens regardless of the
 * participant's active theme.
 */
const COLORS = {
  background: "#f4f4f5",
  foreground: "#09090b",
  muted: "#6b6b76",
  accent: "#2563eb",
  border: "#e4e4e7",
} as const;

const PAGE_WIDTH = 297;
const PAGE_HEIGHT = 210;
const CENTER_X = PAGE_WIDTH / 2;

export type CertificateData = {
  name: string;
  completedAt: Date;
};

export async function downloadCertificate({
  name,
  completedAt,
}: CertificateData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFillColor(COLORS.background);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.6);
  doc.roundedRect(12, 12, PAGE_WIDTH - 24, PAGE_HEIGHT - 24, 4, 4, "S");

  doc.setDrawColor(COLORS.accent);
  doc.setLineWidth(1.2);
  doc.line(CENTER_X - 16, 40, CENTER_X + 16, 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLORS.muted);
  doc.text("DTO & MAPPER WORKSHOP", CENTER_X, 30, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(COLORS.foreground);
  doc.text("Certificate of Completion", CENTER_X, 58, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(COLORS.muted);
  doc.text("This certifies that", CENTER_X, 92, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  doc.setTextColor(COLORS.accent);
  doc.text(name, CENTER_X, 112, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(COLORS.foreground);
  doc.text(
    "completed all four exercises of the DTO & Mapper Workshop,",
    CENTER_X,
    132,
    { align: "center" },
  );
  doc.text(
    "building typed DTOs and explicit mappers across a real API boundary.",
    CENTER_X,
    140,
    { align: "center" },
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.muted);
  const dateLabel = completedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(dateLabel, CENTER_X, PAGE_HEIGHT - 22, { align: "center" });

  const fileName = `dto-mapper-certificate-${completedAt.toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
