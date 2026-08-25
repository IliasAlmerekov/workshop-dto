import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * jsPDF is stubbed rather than exercised for real: the assertions here are
 * about what the certificate *says* and what it is called, and a stub keeps
 * both readable without parsing a PDF. The drawing primitives are recorded so a
 * missing font registration or a renamed file still fails loudly.
 */
const save = vi.fn();
const addFont = vi.fn();
const addFileToVFS = vi.fn();
const texts: string[] = [];

vi.mock("jspdf", () => ({
  jsPDF: class {
    save = save;
    addFont = addFont;
    addFileToVFS = addFileToVFS;
    text = (value: string) => {
      texts.push(value);
    };
    getTextWidth = (value: string) => value.length * 2;
    lines = vi.fn();
    circle = vi.fn();
    rect = vi.fn();
    line = vi.fn();
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setDrawColor = vi.fn();
    setFillColor = vi.fn();
    setLineWidth = vi.fn();
    setCharSpace = vi.fn();
  },
}));

const { downloadCertificate } = await import("./generateCertificate");

describe("downloadCertificate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    texts.length = 0;
  });

  it("saves under a fixed, participant-agnostic file name", async () => {
    await downloadCertificate({
      name: "Ada Lovelace",
      completedAt: new Date(2026, 7, 26),
    });

    expect(save).toHaveBeenCalledWith("Certificate-Workshop.pdf");
  });

  it("names the participant and dates the award in the citation itself", async () => {
    await downloadCertificate({
      name: "Ada Lovelace",
      completedAt: new Date(2026, 7, 26),
    });
    const document = texts.join("\n");

    expect(document).toContain("Ada Lovelace");
    expect(document).toContain(
      "has satisfied all requirements of the DTO & Mapper Workshop on 26.08.2026",
    );
  });

  it("carries no registry or host line, which would imply a record that does not exist", async () => {
    await downloadCertificate({
      name: "Ada Lovelace",
      completedAt: new Date(2026, 7, 26),
    });
    const document = texts.join("\n");

    expect(document).not.toMatch(/\bNO\.\s/);
    expect(document).not.toContain("HOSTED BY");
  });

  it("registers the embedded serif and script faces", async () => {
    await downloadCertificate({
      name: "Ada Lovelace",
      completedAt: new Date(2026, 7, 26),
    });

    expect(addFileToVFS).toHaveBeenCalledTimes(3);
    expect(addFont).toHaveBeenCalledWith(
      "GreatVibes-Regular.ttf",
      "GreatVibes",
      "normal",
    );
  });

  it("shrinks an unusually long name instead of letting it run into the border", async () => {
    await downloadCertificate({
      name: "Wolfgang Amadeus Hieronymus Bartholomäus Lichtenstein",
      completedAt: new Date(2026, 7, 26),
    });

    expect(texts).toContain(
      "Wolfgang Amadeus Hieronymus Bartholomäus Lichtenstein",
    );
  });
});
