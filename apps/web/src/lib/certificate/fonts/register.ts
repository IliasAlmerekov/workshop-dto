import type { jsPDF } from "jspdf";
import { garamondRegularBase64 } from "./garamondRegular";
import { garamondSemiBoldBase64 } from "./garamondSemiBold";
import { greatVibesBase64 } from "./greatVibes";

/**
 * The certificate is set in a real serif and a real script hand, because
 * Helvetica is the single strongest tell that a document was generated rather
 * than issued. Both faces are OFL (see OFL-*.txt) and both are subset, so the
 * three of them together cost about the same as one unsubset weight.
 */
export const GARAMOND = "EBGaramond";
export const SCRIPT = "GreatVibes";

export function registerCertificateFonts(doc: jsPDF): void {
  doc.addFileToVFS("EBGaramond-Regular.ttf", garamondRegularBase64);
  doc.addFont("EBGaramond-Regular.ttf", GARAMOND, "normal");
  doc.addFileToVFS("EBGaramond-SemiBold.ttf", garamondSemiBoldBase64);
  // Registered as the family's `bold` style rather than a family of its own so
  // `setFont(GARAMOND, "bold")` reads like every other jsPDF call site.
  doc.addFont("EBGaramond-SemiBold.ttf", GARAMOND, "bold");
  doc.addFileToVFS("GreatVibes-Regular.ttf", greatVibesBase64);
  doc.addFont("GreatVibes-Regular.ttf", SCRIPT, "normal");
}
